<script lang="ts" setup>
import {computed, onMounted, ref} from 'vue'
import CompleteTrainingDialog from '@/components/CompleteTrainingDialog.vue'
import SectionHeader from '@/components/SectionHeader.vue'
import {useBookingStore} from '@/composables/useBookingStore.ts'
import {standardLocations} from '@/constants/locations.ts'
import type {BookingSlot} from '@/types/booking'
import {useUserStore} from "@/stores/userStore.ts";

const userStore = useUserStore()
const { confirmSlot, declineSlot, loadInstructorCalendar, requestedSlots, rescheduleSlots, slots } = useBookingStore()
type CalendarFilter = 'all' | 'available' | 'requested' | 'reschedule' | 'confirmed' | 'completed'
type CalendarTraining = BookingSlot & {
  student: string
  statusText: string
  statusSeverity: 'success' | 'warn' | 'secondary'
}

const calendarOpen = ref(false)
const calendarFilter = ref<CalendarFilter>('confirmed')
const selectedReportTraining = ref<CalendarTraining | null>(null)
const calendarFilters: { label: string; value: CalendarFilter }[] = [
  { label: 'Все', value: 'all' },
  { label: 'Свободно', value: 'available' },
  { label: 'Ожидают', value: 'requested' },
  { label: 'Переносы', value: 'reschedule' },
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
  return slot.studentName  || 'Ученик'
}

function studentAvatarForSlot(slot: BookingSlot) {
  return slot.studentAvatar || 'student-avatar.png'
}

function packageTextForSlot(slot: BookingSlot) {
  const trainingPackage = slot.studentPackage

  if (!trainingPackage) {
    return ''
  }

  return `Пакет "${trainingPackage.name || 'Без названия'}" ${trainingPackage.completed}/${trainingPackage.total}`
}

function parseSlotDateTime(slot: Pick<BookingSlot, 'date' | 'time'>) {
  const [day, month] = slot.date.split(' ')
  const [hours, minutes] = slot.time.split(':').map(Number)

  return new Date(2026, monthMap[month] ?? 0, Number(day) || 1, hours || 0, minutes || 0)
}

function statusText(status: BookingSlot['status']) {
  if (status === 'available') {
    return 'свободно'
  }

  if (status === 'requested') {
    return 'ожидает подтверждения'
  }

  if (status === 'reschedule') {
    return 'запрос на перенос'
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

  if (status === 'requested' || status === 'reschedule') {
    return 'warn'
  }

  return 'secondary'
}

const requests = computed(() =>
  requestedSlots.value.map((slot) => {
    return { ...slot, student: studentName(slot), packageText: packageTextForSlot(slot), avatar: studentAvatarForSlot(slot) }
  })
)

const reschedules = computed(() =>
  rescheduleSlots.value.map((slot) => {
    return { ...slot, student: studentName(slot), avatar: studentAvatarForSlot(slot) }
  })
)

const todaySchedule = computed(() => {
  const today = todayLabel()

  return slots.value
    .filter((slot) => slot.date === today && (slot.status === 'requested' || slot.status === 'reschedule' || slot.status === 'confirmed'))
    .map((slot) => ({
      ...slot,
      student: studentName(slot),
      statusText: statusText(slot.status),
      statusSeverity: statusSeverity(slot.status),
      place: slot.finalLocation || slot.preference || 'Локация не выбрана',
    }))
    .sort((a, b) => a.time.localeCompare(b.time))
})

const calendarTrainings = computed<CalendarTraining[]>(() =>
  slots.value
    .filter((slot) => ['available', 'requested', 'reschedule', 'confirmed', 'completed'].includes(slot.status))
    .filter((slot) => calendarFilter.value === 'all' || slot.status === calendarFilter.value)
    .map((slot) => ({
      ...slot,
      student: slot.status === 'available' ? 'Свободное окно' : studentName(slot),
      statusText: statusText(slot.status),
      statusSeverity: statusSeverity(slot.status),
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

const confirmedRequest = ref<(BookingSlot & { student: string }) | null>(null)
const confirmDialogOpen = ref(false)
const requestToConfirm = ref<(BookingSlot & { student: string }) | null>(null)
const completeTrainingDialogOpen = ref(false)
const trainingToComplete = ref<BookingSlot | null>(null)

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

function rescheduleTimeText(slot: BookingSlot) {
  const nextTime = `${slot.date} ${slot.time}`

  if (!slot.previousDate || !slot.previousTime) {
    return nextTime
  }

  return `${slot.previousDate} ${slot.previousTime} → ${nextTime}`
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

async function confirmRequest() {
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
  await confirmSlot(request.id, finalLocation, finalLocationUrl, instructorComment)
  await loadInstructorCalendar()
  confirmedRequest.value = {
    ...request,
    status: 'confirmed',
    finalLocation,
    finalLocationUrl,
    instructorComment,
  }
  confirmDialogOpen.value = false
}

async function declineRequest(request: BookingSlot & { student: string }) {
  await declineSlot(request.id)
  await loadInstructorCalendar()
}

function openCompleteTrainingDialog(training: BookingSlot & { student: string }) {
  trainingToComplete.value = training
  userStore.loadProfile(training.studentId || '')
  completeTrainingDialogOpen.value = true
}

function openTrainingReport(training: CalendarTraining) {
  selectedReportTraining.value = training
}

async function handleTrainingCompleted() {
  if (confirmedRequest.value?.id === trainingToComplete.value?.id) {
    confirmedRequest.value = null
  }

  completeTrainingDialogOpen.value = false
  trainingToComplete.value = null
  await loadInstructorCalendar()
}

function openLocation(url: string) {
  window.open(url, '_blank')
}

onMounted(async () => {
  await loadInstructorCalendar()
})

</script>

<template>
  <section class="stack">
    <Card class="hero-card instructor">
      <template #content>
        <div class="hero-title-row">
          <h1>Сегодня</h1>
          <Button icon="pi pi-calendar" label="Календарь" severity="secondary" @click="calendarOpen = true" />
        </div>

        <div v-if="todaySchedule.length > 0" class="schedule-list">
          <div v-for="item in todaySchedule" :key="item.id" class="schedule-item">
            <div class="schedule-item-main">
              <strong>{{ item.time }}</strong>
              <div>
                <b>{{ item.student }}</b>
                <span>{{ item.place }} · {{ durationText(item.duration) }}</span>
              </div>
              <Tag :severity="item.statusSeverity" :value="item.statusText" />
            </div>

            <div v-if="item.status === 'confirmed'" class="slot-actions">
              <Button
                v-if="item.finalLocationUrl"
                icon="pi pi-map-marker"
                label="Открыть локацию"
                severity="secondary"
                size="small"
                @click="openLocation(item.finalLocationUrl)"
              />
              <Button
                icon="pi pi-check-circle"
                label="Проведено"
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
            <div class="booking-request-content">
              <div class="booking-request-top">
                <div class="booking-request-avatar-cell">
                  <Avatar class="student-request-avatar" :image="request.avatar" shape="circle" size="large" />
                </div>
                <div class="booking-request-details">
                  <h3>{{ request.student }}</h3>
                  <strong class="booking-request-time">{{ request.date }} · {{ request.time }} · {{ durationText(request.duration) }}</strong>
                  <p v-if="request.packageText">{{ request.packageText }}</p>
                  <p><b>Пожелание:</b> {{ request.preference || 'Не знаю / нужна консультация' }}</p>
                  <p v-if="request.studentComment"><b>Комментарий:</b> "{{ request.studentComment }}"</p>
                </div>
              </div>
              <Tag
                  :severity="request.status === 'confirmed' ? 'success' : request.status === 'cancelled' ? 'secondary' : 'warn'"
                  :value="request.status === 'confirmed' ? 'Подтверждено' : request.status === 'cancelled' ? 'Отклонено' : 'Ожидает подтверждения'"
              />
              <div v-if="request.status === 'requested'" class="slot-actions">
                <Button icon="pi pi-check" label="Подтвердить" size="small" @click="openConfirmRequest(request)" />
                <Button icon="pi pi-times" label="Отклонить" severity="secondary" size="small" @click="declineRequest(request)" />
              </div>
              <div v-if="request.status === 'confirmed'" class="booking-summary">
                <span>Место: {{ request.finalLocation }}</span>
                <a
                    v-if="request.finalLocationUrl"
                    :href="request.finalLocationUrl"
                    class="location-link"
                    rel="noreferrer"
                    target="_blank"
                >
                  Открыть локацию
                </a>
              </div>
            </div>
          </template>
        </Card>
      </div>
    </section>

    <section>
      <SectionHeader title="Запросы на перенос" />
      <div class="stack tight">
        <Card v-for="move in reschedules" :key="move.id" class="request-card">
          <template #content>
            <div class="booking-request-content">
              <div class="booking-request-top">
                <div class="booking-request-avatar-cell">
                  <Avatar class="student-request-avatar" :image="move.avatar" shape="circle" size="large" />
                </div>
                <div class="booking-request-details">
                  <h3>{{ move.student }}</h3>
                  <strong class="booking-request-time">{{ rescheduleTimeText(move) }}</strong>
                  <p>{{ durationText(move.duration) }}</p>
                  <p v-if="move.studentComment"><b>Комментарий:</b> "{{ move.studentComment }}"</p>
                </div>
              </div>
              <Tag severity="warn" value="Запрос на перенос" />
              <div class="slot-actions">
                <Button icon="pi pi-check" label="Подтвердить перенос" security="primary" size="small" @click="openConfirmRequest(move)" />
                <Button icon="pi pi-times" label="Отклонить" severity="secondary" size="small" @click="declineRequest(move)" />
              </div>
            </div>
          </template>
        </Card>
      </div>
    </section>

    <Card v-if="confirmedRequest" class="telegram-card">
      <template #content>
        <SectionHeader title="Уведомление ученику" />
        <div class="telegram-preview">
          <i class="pi pi-telegram" />
          <div>
            <strong>Тренировка подтверждена</strong>
            <span>{{ confirmedRequest.date }} · {{ confirmedRequest.time }} · {{ durationText(confirmedRequest.duration) }}</span>
            <span>Место: {{ confirmedRequest.finalLocation }}</span>
            <span>Комментарий Никиты: {{ confirmedRequest.instructorComment }}</span>
          </div>
        </div>
      </template>
    </Card>

    <CompleteTrainingDialog
      :slot="trainingToComplete"
      :open="completeTrainingDialogOpen"
      @completed="handleTrainingCompleted"
      @update:open="completeTrainingDialogOpen = $event"
    />

    <Dialog
      v-model:visible="calendarOpen"
      :draggable="false"
      class="moto-dialog calendar-dialog"
      header="Календарь тренировок"
      modal
    >
      <div class="calendar-content">
        <div aria-label="Фильтр тренировок" class="calendar-filter-row">
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
                  <Tag :severity="training.statusSeverity" :value="training.statusText" />
                </div>

                <div v-if="training.status === 'requested'" class="calendar-training-details">
                  <span>Пожелание: {{ training.preference || 'Не знаю / нужна консультация' }}</span>
                  <span v-if="training.studentComment">Комментарий: {{ training.studentComment }}</span>
                </div>

                <div v-else-if="training.status === 'reschedule'" class="calendar-training-details">
                  <span>{{ rescheduleTimeText(training) }}</span>
                  <span v-if="training.studentComment">Комментарий: {{ training.studentComment }}</span>
                </div>

                <div v-else-if="training.status === 'confirmed'" class="calendar-training-details">
                  <span>Локация: {{ training.finalLocation || 'Локация по договоренности' }}</span>
                </div>

                <div v-else-if="training.status === 'available'" class="calendar-training-details">
                  <span>{{ training.location || 'Окно доступно для записи' }}</span>
                </div>

                <div v-else class="calendar-training-details">
                  <span>Что тренировали: {{ training.report?.trainedSkills.join(', ') || 'Не указано' }}</span>
                </div>

                <div v-if="training.status === 'requested' || training.status === 'reschedule'" class="slot-actions">
                  <Button icon="pi pi-check" label="Подтвердить" size="small" @click="openConfirmRequest(training)" />
                  <Button icon="pi pi-times" label="Отклонить" severity="secondary" size="small" @click="declineRequest(training)" />
                </div>

                <div v-else-if="training.status === 'confirmed'" class="slot-actions">
                  <Button
                    v-if="training.finalLocationUrl"
                    icon="pi pi-map-marker"
                    label="Открыть локацию"
                    severity="secondary"
                    size="small"
                    @click="openLocation(training.finalLocationUrl)"
                  />
                  <Button icon="pi pi-check-circle" label="Проведено" size="small" @click="openCompleteTrainingDialog(training)" />
                </div>

                <Button
                  v-else-if="training.status === 'completed'"
                  icon="pi pi-file"
                  label="Открыть отчет"
                  severity="secondary"
                  size="small"
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
      :draggable="false"
      :visible="Boolean(selectedReportTraining)"
      class="moto-dialog"
      header="Отчет тренировки"
      modal
      @update:visible="selectedReportTraining = null"
    >
      <div v-if="selectedReportTraining" class="form-stack">
        <div class="booking-summary">
          <span>{{ selectedReportTraining.student }}</span>
          <strong>{{ selectedReportTraining.date }} · {{ selectedReportTraining.time }} · {{ durationText(selectedReportTraining.duration) }}</strong>
          <span>
            Что тренировали:
            {{ selectedReportTraining.report?.trainedSkills.join(', ') || 'Не указано' }}
          </span>
        </div>

        <div class="note-list">
          <div>
            <span>Что получилось</span>
            <strong>{{ selectedReportTraining.report?.improved || 'Не заполнено' }}</strong>
          </div>
          <div>
            <span>На что обратить внимание</span>
            <strong>{{ selectedReportTraining.report?.nextFocus || 'Не заполнено' }}</strong>
          </div>
        </div>
      </div>
    </Dialog>

    <Dialog v-model:visible="confirmDialogOpen" class="moto-dialog" header="Подтвердить запись" modal>
      <div v-if="requestToConfirm" class="form-stack">
        <div class="booking-summary">
          <span>{{ requestToConfirm.student }}</span>
          <strong>{{ requestToConfirm.date }} · {{ requestToConfirm.time }} · {{ durationText(requestToConfirm.duration) }}</strong>
          <span v-if="requestToConfirm.status === 'reschedule'">
            {{ rescheduleTimeText(requestToConfirm) }}
          </span>
          <span v-else>Пожелание: {{ requestToConfirm.preference || 'Не знаю / нужна консультация' }}</span>
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
            auto-resize
            placeholder="Например: встречаемся у въезда на площадку, возьмите закрытую обувь"
            rows="3"
          />
        </label>
        <Button
          :label="requestToConfirm.status === 'reschedule' ? 'Подтвердить перенос' : 'Подтвердить запись'"
          icon="pi pi-check"
          @click="confirmRequest"
        />
      </div>
    </Dialog>
  </section>
</template>
