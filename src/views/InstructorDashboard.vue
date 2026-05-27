<script setup lang="ts">
import { computed, ref } from 'vue'
import CompleteTrainingDialog from '../components/CompleteTrainingDialog.vue'
import SectionHeader from '../components/SectionHeader.vue'
import studentAvatar from '../assets/student-avatar.png'
import { useBookingStore } from '../composables/useBookingStore'
import { useTrainingStore } from '../composables/useTrainingStore'
import { standardLocations } from '../mock/booking'
import { schedule } from '../mock/lessons'
import { rescheduleRequests } from '../mock/trainingContent'
import type { BookingSlot, Student } from '../mock/types'

const { confirmSlot, declineSlot, requestedSlots, confirmedSlots } = useBookingStore()
const { getStudent } = useTrainingStore()

const requests = computed(() => 
  requestedSlots.value.map((slot) => {
    const student = getStudent(slot.studentId || 0)
    return { ...slot, student: student?.name || 'Ученик' }
  })
)

const confirmedTrainings = computed(() =>
  confirmedSlots.value.map((slot) => {
    const student = getStudent(slot.studentId || 0)
    return { ...slot, student: student?.name || 'Ученик' }
  })
)

const moves = ref(rescheduleRequests.map((item) => ({ ...item, status: 'new' })))
const confirmedRequest = ref<(BookingSlot & { student: string }) | null>(null)
const confirmedMove = ref<(typeof moves.value)[number] | null>(null)
const confirmDialogOpen = ref(false)
const requestToConfirm = ref<(BookingSlot & { student: string }) | null>(null)
const completeTrainingDialogOpen = ref(false)
const trainingToComplete = ref<BookingSlot | null>(null)
const studentForTraining = ref<Student | null>(null)

const finalLocationOptions = [...standardLocations.map((location) => location.name), 'Ввести вручную']
const finalLocationForm = ref({
  locationChoice: 'Площадка Запад',
  customLocation: '',
  locationUrl: standardLocations[0]?.locationUrl ?? '',
  instructorComment: 'Встречаемся у въезда на площадку, возьмите закрытую обувь.',
})

function durationText(duration: string) {
  return duration.replace('мин', 'минут')
}

function locationUrlFor(locationName: string) {
  return standardLocations.find((location) => location.name === locationName)?.locationUrl ?? ''
}

function syncFinalLocationUrl() {
  if (finalLocationForm.value.locationChoice !== 'Ввести вручную') {
    finalLocationForm.value.locationUrl = locationUrlFor(finalLocationForm.value.locationChoice)
  }
}

function openConfirmRequest(request: BookingSlot & { student: string }) {
  requestToConfirm.value = request
  finalLocationForm.value = {
    locationChoice: request.preference && request.preference !== 'Не знаю / нужна консультация' ? request.preference : 'Площадка Запад',
    customLocation: '',
    locationUrl: locationUrlFor(
      request.preference && request.preference !== 'Не знаю / нужна консультация' ? request.preference : 'Площадка Запад',
    ),
    instructorComment: 'Встречаемся у въезда на площадку, возьмите закрытую обувь.',
  }
  confirmDialogOpen.value = true
}

function confirmRequest() {
  if (!requestToConfirm.value) {
    return
  }

  const request = requestToConfirm.value
  const manualLocation = finalLocationForm.value.locationChoice === 'Ввести вручную'
  const finalLocation = manualLocation
    ? finalLocationForm.value.customLocation.trim() || 'Локация по договоренности'
    : finalLocationForm.value.locationChoice
  const finalLocationUrl = finalLocationForm.value.locationUrl || undefined
  const instructorComment = finalLocationForm.value.instructorComment
  confirmSlot(request.id, finalLocation, finalLocationUrl, instructorComment)
  confirmedRequest.value = {
    ...request,
    status: 'confirmed',
    finalLocation,
    finalLocationUrl,
    instructorComment,
  }
  confirmDialogOpen.value = false
}

function declineRequest(request: BookingSlot & { student: string }) {
  declineSlot(request.id)
}

function confirmMove(move: (typeof moves.value)[number]) {
  move.status = 'confirmed'
  confirmedMove.value = move
}

function declineMove(move: (typeof moves.value)[number]) {
  move.status = 'declined'
}

function openCompleteTrainingDialog(training: BookingSlot & { student: string }) {
  trainingToComplete.value = training
  studentForTraining.value = getStudent(training.studentId || 0) || null
  completeTrainingDialogOpen.value = true
}

function openLocation(url: string) {
  window.open(url, '_blank')
}

</script>

<template>
  <section class="stack">
    <Card class="hero-card instructor">
      <template #content>
        <h1>Сегодня</h1>

        <div class="schedule-list">
          <div v-for="item in schedule" :key="item.id" class="schedule-item">
            <strong>{{ item.time }}</strong>
            <div>
              <b>{{ item.student }}</b>
              <span>Площадка Север · {{ item.theme }}</span>
            </div>
            <Tag :value="item.status" :severity="item.status === 'следующее' ? 'warn' : 'secondary'" />
          </div>
        </div>
      </template>
    </Card>

    <section v-if="confirmedTrainings.length > 0">
      <SectionHeader title="Подтвержденные тренировки" />
      <div class="stack tight">
        <Card v-for="training in confirmedTrainings" :key="training.id" class="request-card">
          <template #content>
            <div class="request-top">
              <div>
                <h3>{{ training.student }}</h3>
                <span>{{ training.date }} · {{ training.time }} · {{ durationText(training.duration) }}</span>
                <Tag value="Подтверждено" severity="success" />
              </div>
            </div>
            <div class="booking-summary">
              <span>Место: {{ training.finalLocation }}</span>
            </div>
            <div class="slot-actions">
              <Button
                v-if="training.finalLocationUrl"
                label="Открыть локацию"
                icon="pi pi-map-marker"
                size="small"
                severity="secondary"
                @click="openLocation(training.finalLocationUrl)"
              />
              <Button
                label="Проведено"
                icon="pi pi-check-circle"
                size="small"
                @click="openCompleteTrainingDialog(training)"
              />
            </div>
          </template>
        </Card>
      </div>
    </section>

    <section>
      <SectionHeader title="Новые запросы на запись" />
      <div class="stack tight">
        <Card v-for="request in requests" :key="request.id" class="request-card">
          <template #content>
            <div class="request-top">
              <Avatar :image="studentAvatar" shape="circle" />
              <div>
                <h3>{{ request.student }}</h3>
                <span>{{ request.date }} · {{ request.time }} · {{ durationText(request.duration) }}</span>
                <small>Пожелание: {{ request.preference || 'Не знаю / нужна консультация' }}</small>
                <small v-if="request.studentComment">Комментарий: "{{ request.studentComment }}"</small>
              </div>
              <Tag
                :value="request.status === 'confirmed' ? 'Подтверждено' : request.status === 'cancelled' ? 'Отклонено' : 'На подтверждении'"
                :severity="request.status === 'confirmed' ? 'success' : request.status === 'cancelled' ? 'secondary' : 'warn'"
              />
            </div>
            <div v-if="request.status === 'requested'" class="slot-actions">
              <Button label="Подтвердить" icon="pi pi-check" size="small" @click="openConfirmRequest(request)" />
              <Button label="Отклонить" icon="pi pi-times" size="small" severity="secondary" @click="declineRequest(request)" />
            </div>
            <div v-if="request.status === 'confirmed'" class="booking-summary">
              <span>Место: {{ request.finalLocation }}</span>
              <a
                v-if="request.finalLocationUrl"
                class="location-link"
                :href="request.finalLocationUrl"
                target="_blank"
                rel="noreferrer"
              >
                Открыть локацию
              </a>
            </div>
          </template>
        </Card>
      </div>
    </section>

    <section>
      <SectionHeader title="Запросы на перенос" />
      <div class="stack tight">
        <Card v-for="move in moves" :key="move.id" class="request-card">
          <template #content>
            <div class="note-list">
              <div>
                <span>{{ move.student }}</span>
                <strong>{{ move.oldTime }} → {{ move.newTime }}</strong>
              </div>
              <div>
                <span>Место</span>
                <strong>{{ move.place }}</strong>
              </div>
            </div>
            <p v-if="move.sameDay" class="status-message">Перенос в день занятия: оплата за урок списывается.</p>
            <div v-if="move.status === 'new'" class="slot-actions">
              <Button label="Подтвердить перенос" icon="pi pi-check" size="small" @click="confirmMove(move)" />
              <Button label="Отклонить" icon="pi pi-times" size="small" severity="secondary" @click="declineMove(move)" />
            </div>
            <Tag
              v-else
              :value="move.status === 'confirmed' ? 'Перенос подтвержден' : 'Перенос отклонен'"
              :severity="move.status === 'confirmed' ? 'success' : 'secondary'"
            />
          </template>
        </Card>
      </div>
    </section>

    <Card v-if="confirmedRequest || confirmedMove" class="telegram-card">
      <template #content>
        <SectionHeader title="Уведомление ученику" />
        <div v-if="confirmedRequest" class="telegram-preview">
          <i class="pi pi-telegram" />
          <div>
            <strong>Тренировка подтверждена</strong>
            <span>{{ confirmedRequest.date }} · {{ confirmedRequest.time }} · {{ durationText(confirmedRequest.duration) }}</span>
            <span>Место: {{ confirmedRequest.finalLocation }}</span>
            <span>Комментарий Никиты: {{ confirmedRequest.instructorComment }}</span>
          </div>
        </div>
        <div v-if="confirmedMove" class="telegram-preview">
          <i class="pi pi-telegram" />
          <div>
            <strong>Тренировка перенесена</strong>
            <span>Новое время: {{ confirmedMove.newTime }}</span>
            <span>{{ confirmedMove.place }}</span>
          </div>
        </div>
      </template>
    </Card>

    <CompleteTrainingDialog
      :open="completeTrainingDialogOpen"
      :slot="trainingToComplete"
      :student="studentForTraining"
      @update:open="completeTrainingDialogOpen = $event"
      @completed="completeTrainingDialogOpen = false"
    />

    <Dialog v-model:visible="confirmDialogOpen" modal header="Подтвердить запись" class="moto-dialog">
      <div v-if="requestToConfirm" class="form-stack">
        <div class="booking-summary">
          <span>{{ requestToConfirm.student }}</span>
          <strong>{{ requestToConfirm.date }} · {{ requestToConfirm.time }} · {{ durationText(requestToConfirm.duration) }}</strong>
          <span>Пожелание: {{ requestToConfirm.preference || 'Не знаю / нужна консультация' }}</span>
          <span v-if="requestToConfirm.studentComment">Комментарий: {{ requestToConfirm.studentComment }}</span>
        </div>

        <label>
          Финальная локация
          <Select
            v-model="finalLocationForm.locationChoice"
            :options="finalLocationOptions"
            @change="syncFinalLocationUrl"
          />
        </label>
        <label v-if="finalLocationForm.locationChoice === 'Ввести вручную'">
          Название локации
          <InputText v-model="finalLocationForm.customLocation" placeholder="Например, парковка у кафе" />
        </label>
        <label>
          Ссылка на локацию
          <InputText v-model="finalLocationForm.locationUrl" placeholder="https://maps.google.com/..." />
        </label>
        <label>
          Комментарий Никиты
          <Textarea
            v-model="finalLocationForm.instructorComment"
            rows="3"
            auto-resize
            placeholder="Например: встречаемся у въезда на площадку, возьмите закрытую обувь"
          />
        </label>
        <Button label="Подтвердить запись" icon="pi pi-check" @click="confirmRequest" />
      </div>
    </Dialog>
  </section>
</template>
