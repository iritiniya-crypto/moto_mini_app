<script setup lang="ts">
import { computed, ref } from 'vue'
import SectionHeader from '../components/SectionHeader.vue'
import { useBookingStore } from '../composables/useBookingStore'
import type { BookingSlot } from '../mock/types'

const { activeStudentSlot, requestSlot, slots, updateSlot } = useBookingStore()
const selectedSlotId = ref<number | null>(null)
const moving = ref(false)
const moveRequested = ref(false)
const moveConfirmed = ref(false)
const bookingDialogOpen = ref(false)
const candidateSlot = ref<BookingSlot | null>(null)
const preferenceOptions = ['Площадка Запад', 'Серпантин', 'Город', 'Не знаю / нужна консультация']
const bookingForm = ref({
  preference: 'Не знаю / нужна консультация',
  studentComment: '',
})

const nextTraining = ref({
  date: '28 мая',
  time: '18:30',
  duration: '90 мин',
  finalLocation: 'Площадка Запад',
  finalLocationUrl: 'https://maps.google.com/?q=Ploshchadka+Zapad',
  instructorComment: 'Встречаемся у въезда на площадку, возьмите закрытую обувь.',
  status: 'Подтверждено',
  comment: 'Возьмите защиту и приезжайте за 5-10 минут до начала.',
})

const availableSlots = computed(() => slots.value.filter((slot) => slot.status === 'available'))
const selectedSlot = computed(() => activeStudentSlot.value ?? slots.value.find((slot) => slot.id === selectedSlotId.value))

function durationText(duration: string) {
  return duration.replace('мин', 'минут')
}

function statusLabel(status: BookingSlot['status']) {
  const labels = {
    available: 'Свободно',
    requested: 'На подтверждении',
    confirmed: 'Подтверждено',
    rescheduleRequested: 'Перенос на подтверждении',
    rescheduled: 'Перенесено',
    cancelled: 'Отменено',
    unavailable: 'Недоступно',
    completed: 'Проведено',
  }

  return labels[status]
}

function openBookingDialog(slot: BookingSlot) {
  candidateSlot.value = slot
  bookingForm.value = {
    preference: 'Не знаю / нужна консультация',
    studentComment: '',
  }
  bookingDialogOpen.value = true
}

function submitBooking() {
  if (!candidateSlot.value) {
    return
  }

  const slot = candidateSlot.value
  selectedSlotId.value = slot.id
  requestSlot(
    slot.id,
    1,  // studentId - current student
    bookingForm.value.preference,
    bookingForm.value.studentComment,
    moving.value ? 'rescheduleRequested' : 'requested',
  )
  moveRequested.value = moving.value
  bookingDialogOpen.value = false
}

function startMove() {
  moving.value = true
  moveRequested.value = false
  moveConfirmed.value = false
}

function confirmMove() {
  if (selectedSlot.value) {
    updateSlot(selectedSlot.value.id, {
      status: 'rescheduled',
      finalLocation: 'Площадка Запад',
      finalLocationUrl: 'https://maps.google.com/?q=Ploshchadka+Zapad',
      instructorComment: 'Перенос подтвержден. Встречаемся у въезда на площадку.',
    })
    nextTraining.value = {
      date: selectedSlot.value.date,
      time: selectedSlot.value.time,
      duration: selectedSlot.value.duration,
      finalLocation: 'Площадка Запад',
      finalLocationUrl: 'https://maps.google.com/?q=Ploshchadka+Zapad',
      instructorComment: 'Перенос подтвержден. Встречаемся у въезда на площадку.',
      status: 'Перенесено',
      comment: 'Перенос подтвержден. Новое время уже в расписании.',
    }
  }

  moving.value = false
  moveRequested.value = false
  moveConfirmed.value = true
}
</script>

<template>
  <section class="stack">
    <Card class="hero-card training-hero">
      <template #content>
        <h1>Ближайшая тренировка</h1>

        <div class="training-main">
          <div>
            <span>{{ nextTraining.date }}</span>
            <strong>{{ nextTraining.time }}</strong>
          </div>
          <Tag :value="nextTraining.status" severity="success" />
        </div>

        <div class="training-place">
          <i class="pi pi-map-marker" />
          <span>{{ nextTraining.finalLocation }} · {{ durationText(nextTraining.duration) }}</span>
        </div>

        <p>{{ nextTraining.comment }}</p>
        <a
          v-if="nextTraining.finalLocationUrl"
          class="location-link primary"
          :href="nextTraining.finalLocationUrl"
          target="_blank"
          rel="noreferrer"
        >
          Открыть локацию
        </a>
        <span v-else class="location-empty">Ссылка на локацию появится после подтверждения</span>
        <Button label="Перенести" icon="pi pi-refresh" severity="secondary" @click="startMove" />
      </template>
    </Card>

    <Card v-if="moving" class="warning-card">
      <template #content>
        <i class="pi pi-exclamation-triangle" />
        <p>Если тренировка переносится в день занятия, оплата за урок списывается.</p>
      </template>
    </Card>

    <section>
      <SectionHeader :title="moving ? 'Выберите новое время' : 'Свободное время'" />
      <Card class="hero-card booking-copy">
        <template #content>
          <p>
            Выберите подходящее время тренировки. После подтверждения инструктором вам придет уведомление в Telegram.
          </p>
        </template>
      </Card>
      <div class="slot-grid">
        <Card v-for="slot in availableSlots" :key="slot.id" class="slot-card">
          <template #content>
            <div class="slot-top">
              <div>
                <span>{{ slot.date }}</span>
                <strong>{{ slot.time }}</strong>
              </div>
              <Tag value="Свободно" />
            </div>
            <p>{{ durationText(slot.duration) }}</p>
            <Button
              :label="moving ? 'Выбрать новое время' : 'Забронировать время'"
              icon="pi pi-send"
              size="small"
              @click="openBookingDialog(slot)"
            />
          </template>
        </Card>
      </div>
    </section>

    <Card v-if="selectedSlot && (selectedSlot.status === 'requested' || selectedSlot.status === 'rescheduleRequested')" class="flow-card">
      <template #content>
        <SectionHeader title="Статус записи" />
        <p class="status-message">
          Мы отправили запрос Никите. После подтверждения вы получите уведомление в Telegram.
        </p>
        <div class="booking-summary">
          <strong>{{ selectedSlot.date }} · {{ selectedSlot.time }}</strong>
          <span>{{ durationText(selectedSlot.duration) }}</span>
          <span>Пожелание: {{ selectedSlot.preference }}</span>
          <span>Финальное место тренировки подтвердит Никита.</span>
          <Tag :value="statusLabel(selectedSlot.status)" severity="warn" />
        </div>
        <Button
          v-if="moveRequested"
          label="Показать подтверждение переноса"
          icon="pi pi-check"
          severity="secondary"
          @click="confirmMove"
        />
      </template>
    </Card>

    <Card v-if="selectedSlot && selectedSlot.status === 'confirmed'" class="telegram-card">
      <template #content>
        <SectionHeader title="Запись подтверждена" />
        <div class="telegram-preview">
          <i class="pi pi-telegram" />
          <div>
            <strong>Тренировка подтверждена</strong>
            <span>{{ selectedSlot.date }} · {{ selectedSlot.time }} · {{ durationText(selectedSlot.duration) }}</span>
            <span>Место: {{ selectedSlot.finalLocation }}</span>
            <span v-if="selectedSlot.instructorComment">Комментарий Никиты: {{ selectedSlot.instructorComment }}</span>
          </div>
        </div>
        <a
          v-if="selectedSlot.finalLocationUrl"
          class="location-link primary"
          :href="selectedSlot.finalLocationUrl"
          target="_blank"
          rel="noreferrer"
        >
          Открыть локацию
        </a>
      </template>
    </Card>

    <Card v-if="moveConfirmed && selectedSlot" class="telegram-card">
      <template #content>
        <SectionHeader title="Пример уведомления" />
        <div class="telegram-preview">
          <i class="pi pi-telegram" />
          <div>
            <strong>Тренировка перенесена</strong>
            <span>Новое время: {{ selectedSlot.date }} · {{ selectedSlot.time }}</span>
            <span>Площадка Запад</span>
          </div>
        </div>
      </template>
    </Card>

    <Dialog v-model:visible="bookingDialogOpen" modal header="Забронировать тренировку" class="moto-dialog">
      <div v-if="candidateSlot" class="form-stack">
        <div class="booking-summary">
          <span>Выбранное время</span>
          <strong>{{ candidateSlot.date }} · {{ candidateSlot.time }} · {{ durationText(candidateSlot.duration) }}</strong>
        </div>

        <label>
          Желаемый формат / локация
          <Select v-model="bookingForm.preference" :options="preferenceOptions" />
        </label>
        <label>
          Комментарий для Никиты
          <Textarea
            v-model="bookingForm.studentComment"
            rows="3"
            auto-resize
            placeholder="Например: хочу потренировать торможение, первый раз в городе, боюсь серпантина"
          />
        </label>
        <Button label="Отправить запрос" icon="pi pi-send" @click="submitBooking" />
      </div>
    </Dialog>
  </section>
</template>
