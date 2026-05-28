<script setup lang="ts">
import { computed, ref } from 'vue'
import CompleteTrainingDialog from '../components/CompleteTrainingDialog.vue'
import SectionHeader from '../components/SectionHeader.vue'
import studentAvatar from '../assets/student-avatar.png'
import { useBookingStore } from '../composables/useBookingStore'
import { useTrainingStore } from '../composables/useTrainingStore'
import { standardLocations } from '../mock/booking'
import { rescheduleRequests } from '../mock/trainingContent'
import type { BookingSlot, Student } from '../mock/types'

const { confirmSlot, declineSlot, requestedSlots, slots } = useBookingStore()
const { getStudent, getStudentTrainingHistory, trainingReports } = useTrainingStore()
type CalendarFilter = 'all' | 'requested' | 'confirmed' | 'completed'
type CalendarTraining = BookingSlot & {
  student: string
  statusText: string
  statusSeverity: 'success' | 'warn' | 'secondary'
  history: ReturnType<typeof getStudentTrainingHistory>[number] | null
  report: typeof trainingReports.value[number] | null
}

const calendarOpen = ref(false)
const calendarFilter = ref<CalendarFilter>('all')
const selectedReportTraining = ref<CalendarTraining | null>(null)
const calendarFilters: { label: string; value: CalendarFilter }[] = [
  { label: 'Все', value: 'all' },
  { label: 'Ожидают', value: 'requested' },
  { label: 'Подтверждено', value: 'confirmed' },
  { label: 'Проведено', value: 'completed' },
]
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

function todayLabel() {
  return new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long' }).format(new Date()).replace(' г.', '')
}

function studentName(slot: BookingSlot) {
  return getStudent(slot.studentId || 0)?.name || 'Ученик'
}

function parseSlotDateTime(slot: Pick<BookingSlot, 'date' | 'time'>) {
  const [day, month] = slot.date.split(' ')
  const [hours, minutes] = slot.time.split(':').map(Number)

  return new Date(2026, monthMap[month] ?? 0, Number(day) || 1, hours || 0, minutes || 0)
}

function statusText(status: BookingSlot['status']) {
  if (status === 'requested') {
    return 'ожидает подтверждения'
  }

  if (status === 'confirmed') {
    return 'подтверждено'
  }

  if (status === 'completed') {
    return 'проведено'
  }

  return status
}

function statusSeverity(status: BookingSlot['status']): 'success' | 'warn' | 'secondary' {
  if (status === 'confirmed' || status === 'completed') {
    return 'success'
  }

  if (status === 'requested') {
    return 'warn'
  }

  return 'secondary'
}

function historyForSlot(slot: BookingSlot) {
  return getStudentTrainingHistory(slot.studentId || 0).find((history) => history.slotId === slot.id) || null
}

function reportForSlot(slot: BookingSlot) {
  return trainingReports.value.find((report) => report.slotId === slot.id) || null
}

const requests = computed(() => 
  requestedSlots.value.map((slot) => {
    return { ...slot, student: studentName(slot) }
  })
)

const todaySchedule = computed(() => {
  const today = todayLabel()

  return slots.value
    .filter((slot) => slot.date === today && (slot.status === 'requested' || slot.status === 'confirmed'))
    .map((slot) => ({
      ...slot,
      student: studentName(slot),
      statusText: slot.status === 'requested' ? 'ожидает подтверждения' : 'подтверждено',
      statusSeverity: slot.status === 'requested' ? 'warn' : 'success',
      place: slot.finalLocation || slot.preference || 'Локация не выбрана',
    }))
    .sort((a, b) => a.time.localeCompare(b.time))
})

const calendarTrainings = computed<CalendarTraining[]>(() =>
  slots.value
    .filter((slot) => ['requested', 'confirmed', 'completed'].includes(slot.status))
    .filter((slot) => calendarFilter.value === 'all' || slot.status === calendarFilter.value)
    .map((slot) => ({
      ...slot,
      student: studentName(slot),
      statusText: statusText(slot.status),
      statusSeverity: statusSeverity(slot.status),
      history: historyForSlot(slot),
      report: reportForSlot(slot),
    }))
    .sort((a, b) => parseSlotDateTime(a).getTime() - parseSlotDateTime(b).getTime()),
)

const calendarGroups = computed(() => {
  const groups = new Map<string, CalendarTraining[]>()

  calendarTrainings.value.forEach((training) => {
    if (!groups.has(training.date)) {
      groups.set(training.date, [])
    }

    groups.get(training.date)!.push(training)
  })

  return Array.from(groups.entries()).map(([date, trainings]) => ({ date, trainings }))
})

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

function openTrainingReport(training: CalendarTraining) {
  selectedReportTraining.value = training
}

function handleTrainingCompleted() {
  if (confirmedRequest.value?.id === trainingToComplete.value?.id) {
    confirmedRequest.value = null
  }

  completeTrainingDialogOpen.value = false
  trainingToComplete.value = null
  studentForTraining.value = null
}

function openLocation(url: string) {
  window.open(url, '_blank')
}

</script>

<template>
  <section class="stack">
    <Card class="hero-card instructor">
      <template #content>
        <div class="hero-title-row">
          <h1>Сегодня</h1>
          <Button label="Календарь" icon="pi pi-calendar" severity="secondary" @click="calendarOpen = true" />
        </div>

        <div v-if="todaySchedule.length > 0" class="schedule-list">
          <div v-for="item in todaySchedule" :key="item.id" class="schedule-item">
            <div class="schedule-item-main">
              <strong>{{ item.time }}</strong>
              <div>
                <b>{{ item.student }}</b>
                <span>{{ item.place }} · {{ durationText(item.duration) }}</span>
              </div>
              <Tag :value="item.statusText" :severity="item.statusSeverity" />
            </div>

            <div v-if="item.status === 'confirmed'" class="slot-actions">
              <Button
                v-if="item.finalLocationUrl"
                label="Открыть локацию"
                icon="pi pi-map-marker"
                size="small"
                severity="secondary"
                @click="openLocation(item.finalLocationUrl)"
              />
              <Button
                label="Проведено"
                icon="pi pi-check-circle"
                size="small"
                @click="openCompleteTrainingDialog(item)"
              />
            </div>
          </div>
        </div>
        <p v-else class="status-message">Сегодня тренировок нет</p>
      </template>
    </Card>

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
                :value="request.status === 'confirmed' ? 'Подтверждено' : request.status === 'cancelled' ? 'Отклонено' : 'Ожидает подтверждения'"
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
      @completed="handleTrainingCompleted"
    />

    <Dialog
      v-model:visible="calendarOpen"
      modal
      header="Календарь тренировок"
      class="moto-dialog calendar-dialog"
      :draggable="false"
    >
      <div class="calendar-content">
        <div class="calendar-filter-row" aria-label="Фильтр тренировок">
          <button
            v-for="filter in calendarFilters"
            :key="filter.value"
            :class="{ active: calendarFilter === filter.value }"
            type="button"
            @click="calendarFilter = filter.value"
          >
            {{ filter.label }}
          </button>
        </div>

        <div v-if="calendarGroups.length > 0" class="calendar-agenda">
          <section v-for="group in calendarGroups" :key="group.date" class="calendar-day-group">
            <SectionHeader :title="group.date" />
            <Card v-for="training in group.trainings" :key="training.id" class="calendar-training-card">
              <template #content>
                <div class="calendar-training-top">
                  <div>
                    <strong>{{ training.time }} — {{ training.student }}</strong>
                    <span>{{ durationText(training.duration) }}</span>
                  </div>
                  <Tag :value="training.statusText" :severity="training.statusSeverity" />
                </div>

                <div v-if="training.status === 'requested'" class="calendar-training-details">
                  <span>Пожелание: {{ training.preference || 'Не знаю / нужна консультация' }}</span>
                  <span v-if="training.studentComment">Комментарий: {{ training.studentComment }}</span>
                </div>

                <div v-else-if="training.status === 'confirmed'" class="calendar-training-details">
                  <span>Локация: {{ training.finalLocation || 'Локация по договоренности' }}</span>
                </div>

                <div v-else class="calendar-training-details">
                  <span>Что тренировали: {{ training.history?.topics.join(', ') || training.report?.trainedSkills.join(', ') || 'Не указано' }}</span>
                </div>

                <div v-if="training.status === 'requested'" class="slot-actions">
                  <Button label="Подтвердить" icon="pi pi-check" size="small" @click="openConfirmRequest(training)" />
                  <Button label="Отклонить" icon="pi pi-times" size="small" severity="secondary" @click="declineRequest(training)" />
                </div>

                <div v-else-if="training.status === 'confirmed'" class="slot-actions">
                  <Button
                    v-if="training.finalLocationUrl"
                    label="Открыть локацию"
                    icon="pi pi-map-marker"
                    size="small"
                    severity="secondary"
                    @click="openLocation(training.finalLocationUrl)"
                  />
                  <Button label="Проведено" icon="pi pi-check-circle" size="small" @click="openCompleteTrainingDialog(training)" />
                </div>

                <Button
                  v-else
                  label="Открыть отчет"
                  icon="pi pi-file"
                  size="small"
                  severity="secondary"
                  @click="openTrainingReport(training)"
                />
              </template>
            </Card>
          </section>
        </div>

        <p v-else class="status-message">Тренировок с таким статусом пока нет.</p>
      </div>
    </Dialog>

    <Dialog
      :visible="Boolean(selectedReportTraining)"
      modal
      header="Отчет тренировки"
      class="moto-dialog"
      :draggable="false"
      @update:visible="selectedReportTraining = null"
    >
      <div v-if="selectedReportTraining" class="form-stack">
        <div class="booking-summary">
          <span>{{ selectedReportTraining.student }}</span>
          <strong>{{ selectedReportTraining.date }} · {{ selectedReportTraining.time }} · {{ durationText(selectedReportTraining.duration) }}</strong>
          <span>
            Что тренировали:
            {{ selectedReportTraining.history?.topics.join(', ') || selectedReportTraining.report?.trainedSkills.join(', ') || 'Не указано' }}
          </span>
        </div>

        <div class="note-list">
          <div>
            <span>Что получилось</span>
            <strong>{{ selectedReportTraining.history?.improved || selectedReportTraining.report?.improved || 'Не заполнено' }}</strong>
          </div>
          <div>
            <span>На что обратить внимание</span>
            <strong>{{ selectedReportTraining.history?.nextFocus || selectedReportTraining.report?.nextFocus || 'Не заполнено' }}</strong>
          </div>
          <div v-if="selectedReportTraining.history?.videoUrl">
            <span>Видео</span>
            <a
              class="location-link primary"
              :href="selectedReportTraining.history.videoUrl"
              target="_blank"
              rel="noreferrer"
            >
              Открыть видео в Telegram
            </a>
          </div>
        </div>
      </div>
    </Dialog>

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
