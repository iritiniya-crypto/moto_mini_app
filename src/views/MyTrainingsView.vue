<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { TEST_USER_ID } from '../api/client'
import { numericId } from '../api/normalizers'
import SectionHeader from '../components/SectionHeader.vue'
import { useBookingStore } from '../composables/useBookingStore'
import type { BookingSlot } from '../mock/types'

const currentStudentId = TEST_USER_ID ? numericId(TEST_USER_ID, 1) : 1
const { activeStudentSlot, cancelSlot, loadBookingSlots, requestSlot, rescheduleSlot, availableSlots, slots } = useBookingStore()
const selectedSlotId = ref<number | null>(null)
const moving = ref(false)
const bookingDialogOpen = ref(false)
const candidateSlot = ref<BookingSlot | null>(null)
const cancelDialogOpen = ref(false)
const trainingToCancel = ref<BookingSlot | null>(null)
const preferenceOptions = ['Площадка Запад', 'Серпантин', 'Город', 'Не знаю / нужна консультация']
const bookingForm = ref({
  preference: 'Не знаю / нужна консультация',
  studentComment: '',
})
const monthMap: Record<string, number> = {
  января: 0,
  февраля: 1,
  марта: 2,
  апреля: 3,
  мая: 4,
  июня: 5,
  июля: 6,
  августа: 7,
  сентября: 8,
  октября: 9,
  ноября: 10,
  декабря: 11,
}

function parseSlotDateTime(slot: Pick<BookingSlot, 'date' | 'time'>) {
  const [day, month] = slot.date.split(' ')
  const [hours, minutes] = slot.time.split(':').map(Number)

  return new Date(2026, monthMap[month] ?? 0, Number(day) || 1, hours || 0, minutes || 0)
}

const studentActiveSlots = computed(() =>
  slots.value.filter(
    (slot) =>
      slot.studentId === currentStudentId &&
      (slot.status === 'requested' || slot.status === 'reschedule' || slot.status === 'confirmed'),
  ),
)
const activeTrainings = computed(() =>
  [...studentActiveSlots.value].sort((a, b) => parseSlotDateTime(a).getTime() - parseSlotDateTime(b).getTime()),
)
const nextTraining = computed(() => activeTrainings.value[0] ?? null)
const selectedSlot = computed(() => {
  const activeSlot = activeStudentSlot.value?.studentId === currentStudentId ? activeStudentSlot.value : null
  return activeSlot ?? studentActiveSlots.value.find((slot) => slot.id === selectedSlotId.value) ?? nextTraining.value
})

function durationText(duration: string) {
  return duration.replace('мин', 'минут')
}

function statusLabel(status: BookingSlot['status']) {
  const labels = {
    available: 'Свободно',
    requested: 'Ожидает подтверждения',
    reschedule: 'Запрос на перенос',
    confirmed: 'Подтверждено',
    cancelled: 'Отменено',
    completed: 'Проведено',
  }

  return labels[status]
}

function rescheduleTimeText(slot: BookingSlot) {
  const nextTime = `${slot.date} ${slot.time}`

  if (!slot.previousDate || !slot.previousTime) {
    return nextTime
  }

  return `${slot.previousDate} ${slot.previousTime} → ${nextTime}`
}

function openBookingDialog(slot: BookingSlot) {
  candidateSlot.value = slot
  bookingForm.value = {
    preference: 'Не знаю / нужна консультация',
    studentComment: '',
  }
  bookingDialogOpen.value = true
}

async function submitBooking() {
  if (!candidateSlot.value) {
    return
  }

  const slot = candidateSlot.value
  if (moving.value && selectedSlot.value?.status === 'confirmed') {
    selectedSlotId.value = selectedSlot.value.id
    await rescheduleSlot(
      selectedSlot.value.id,
      {
        date: slot.date,
        time: slot.time,
        duration: slot.duration,
      },
      bookingForm.value.studentComment,
    )
  } else {
    selectedSlotId.value = slot.id
    await requestSlot(
      slot.id,
      currentStudentId,
      bookingForm.value.preference,
      bookingForm.value.studentComment,
      'requested',
      TEST_USER_ID,
    )
  }
  await loadBookingSlots()
  moving.value = false
  bookingDialogOpen.value = false
}

function startMove(slot: BookingSlot) {
  selectedSlotId.value = slot.id
  moving.value = true
}

function openCancelDialog(slot: BookingSlot) {
  trainingToCancel.value = slot
  cancelDialogOpen.value = true
}

async function confirmCancelTraining() {
  if (!trainingToCancel.value) {
    return
  }

  await cancelSlot(trainingToCancel.value.id)
  await loadBookingSlots()
  if (selectedSlotId.value === trainingToCancel.value.id) {
    selectedSlotId.value = null
  }
  if (moving.value && selectedSlot.value?.id === trainingToCancel.value.id) {
    moving.value = false
  }
  trainingToCancel.value = null
  cancelDialogOpen.value = false
}

onMounted(() => {
  loadBookingSlots()
})
</script>

<template>
  <section class="stack">
    <Card class="hero-card training-hero">
      <template #content>
        <h1>Ближайшая тренировка</h1>

        <div v-if="nextTraining" class="training-main">
          <div>
            <span>{{ nextTraining.date }}</span>
            <strong>{{ nextTraining.time }}</strong>
          </div>
          <Tag
            :value="statusLabel(nextTraining.status)"
            :severity="nextTraining.status === 'confirmed' ? 'success' : 'warn'"
          />
        </div>

        <div v-if="nextTraining" class="training-place">
          <i class="pi pi-map-marker" />
          <span>{{ nextTraining.finalLocation || 'Локация появится после подтверждения' }} · {{ durationText(nextTraining.duration) }}</span>
        </div>

        <p v-if="nextTraining?.status === 'confirmed'">
          {{ nextTraining.instructorComment || 'Возьмите защиту и приезжайте за 5-10 минут до начала.' }}
        </p>
        <p v-else-if="nextTraining">
          Запрос отправлен Никите. После подтверждения здесь появятся финальная локация и комментарий.
        </p>
        <p v-else>
          Активной записи пока нет. Выберите свободное время ниже.
        </p>
        <a
          v-if="nextTraining?.finalLocationUrl"
          class="location-link primary"
          :href="nextTraining.finalLocationUrl"
          target="_blank"
          rel="noreferrer"
        >
          Открыть локацию
        </a>
        <span v-else-if="nextTraining" class="location-empty">Ссылка на локацию появится после подтверждения</span>
        <Button
          v-if="nextTraining?.status === 'confirmed'"
          label="Перенести"
          icon="pi pi-refresh"
          severity="secondary"
          @click="startMove(nextTraining)"
        />
      </template>
    </Card>

    <Card v-if="moving" class="warning-card">
      <template #content>
        <i class="pi pi-exclamation-triangle" />
        <p>Если тренировка переносится в день занятия, оплата за урок списывается.</p>
      </template>
    </Card>

    <section>
      <SectionHeader title="Мои тренировки" />
      <div v-if="activeTrainings.length > 0" class="slot-grid">
        <Card v-for="training in activeTrainings" :key="training.id" class="slot-card">
          <template #content>
            <div class="slot-top">
              <div>
                <span>{{ training.date }}</span>
                <strong>{{ training.time }}</strong>
              </div>
              <Tag
                :value="statusLabel(training.status)"
                :severity="training.status === 'confirmed' ? 'success' : 'warn'"
              />
            </div>
            <p>{{ durationText(training.duration) }}</p>
            <div class="booking-summary">
              <span v-if="training.status === 'confirmed'">
                {{ training.finalLocation || 'Локация появится после подтверждения' }}
              </span>
              <span v-else>
                Ожидает подтверждения Никитой
              </span>
              <span v-if="training.status === 'reschedule'">
                {{ rescheduleTimeText(training) }}
              </span>
            </div>
            <div class="slot-actions">
              <Button
                v-if="training.status === 'confirmed'"
                label="Перенести"
                icon="pi pi-refresh"
                size="small"
                severity="secondary"
                @click="startMove(training)"
              />
              <Button
                label="Отменить"
                icon="pi pi-times"
                size="small"
                severity="secondary"
                @click="openCancelDialog(training)"
              />
            </div>
          </template>
        </Card>
      </div>
      <p v-else class="status-message">Активных тренировок пока нет.</p>
    </section>

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

    <Card v-if="selectedSlot && (selectedSlot.status === 'requested' || selectedSlot.status === 'reschedule')" class="flow-card">
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

    <Dialog v-model:visible="cancelDialogOpen" modal header="Отменить тренировку?" class="moto-dialog" :draggable="false">
      <div class="form-stack">
        <p class="status-message">
          Если отмена происходит в день тренировки, занятие считается использованным и может быть списано из пакета.
        </p>
        <div v-if="trainingToCancel" class="booking-summary">
          <span>{{ trainingToCancel.date }} · {{ trainingToCancel.time }}</span>
          <strong>{{ durationText(trainingToCancel.duration) }}</strong>
          <Tag :value="statusLabel(trainingToCancel.status)" />
        </div>
        <div class="dialog-actions">
          <Button label="Назад" severity="secondary" @click="cancelDialogOpen = false" />
          <Button label="Отменить тренировку" icon="pi pi-times" severity="danger" @click="confirmCancelTraining" />
        </div>
      </div>
    </Dialog>
  </section>
</template>
