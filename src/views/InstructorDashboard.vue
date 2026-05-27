<script setup lang="ts">
import { computed, ref } from 'vue'
import CompleteTrainingDialog from '../components/CompleteTrainingDialog.vue'
import LessonCard from '../components/LessonCard.vue'
import SectionHeader from '../components/SectionHeader.vue'
import { useBookingStore } from '../composables/useBookingStore'
import { useTrainingStore } from '../composables/useTrainingStore'
import { standardLocations } from '../mock/booking'
import { schedule } from '../mock/lessons'
import { baseSkills } from '../mock/students'
import { students } from '../mock/students'
import { rescheduleRequests } from '../mock/trainingContent'
import { videos } from '../mock/videos'
import type { BookingSlot } from '../mock/types'

const { confirmSlot, declineSlot, requestedSlots, confirmedSlots, slots } = useBookingStore()
const { getStudent, getStudentTrainingHistory } = useTrainingStore()

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
const selectedStudent = ref(students[0])
const studentDialogOpen = ref(false)
const reportOpen = ref(false)
const videoOpen = ref(false)
const confirmedRequest = ref<(BookingSlot & { student: string }) | null>(null)
const confirmedMove = ref<(typeof moves.value)[number] | null>(null)
const studentSkills = ref<Array<{ id: number; name: string; value: number; note: string; done?: boolean }>>(baseSkills.map((skill) => ({ ...skill, done: skill.value > 70 })))
const customSkill = ref('')
const note = ref(selectedStudent.value.notes || 'Закрепить взгляд в точку выхода и плавную работу сцеплением.')
const level = ref(selectedStudent.value.level)
const videoLink = ref('https://t.me/c/1827364512/48')
const nextTrainingLocation = slots.value[0]
const confirmDialogOpen = ref(false)
const requestToConfirm = ref<(BookingSlot & { student: string }) | null>(null)
const completeTrainingDialogOpen = ref(false)
const trainingToComplete = ref<BookingSlot | null>(null)
const studentForTraining = ref<typeof students[0] | null>(null)

const finalLocationOptions = [...standardLocations.map((location) => location.name), 'Ввести вручную']
const finalLocationForm = ref({
  locationChoice: 'Площадка Запад',
  customLocation: '',
  locationUrl: standardLocations[0]?.locationUrl ?? '',
  instructorComment: 'Встречаемся у въезда на площадку, возьмите закрытую обувь.',
})

const report = ref({
  planned: 'Овал, змейка, торможение',
  done: 'Овал, работа со сцеплением',
  newSkill: '',
  comment: 'Закрепить взгляд в точку выхода и не закрывать газ перед разворотом.',
  improved: 'Лучше держит баланс на малой скорости.',
  homework: 'Восьмерка, экстренное торможение, расслабленные руки.',
  video: 'https://t.me/c/1827364512/48',
})

function durationText(duration: string) {
  return duration.replace('мин', 'минут')
}

function openStudentCard(nextStudent: typeof students[number]) {
  selectedStudent.value = nextStudent
  level.value = nextStudent.level
  note.value = nextStudent.notes || ''
  studentDialogOpen.value = true
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

function addSkill() {
  const name = customSkill.value.trim()

  if (!name) {
    return
  }

  studentSkills.value.push({
    id: Date.now(),
    name,
    value: 20,
    note: 'добавлено инструктором',
    done: false,
  })
  customSkill.value = ''
}

function removeSkill(id: number) {
  studentSkills.value = studentSkills.value.filter((skill) => skill.id !== id)
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
              <a
                v-if="training.finalLocationUrl"
                class="location-link"
                :href="training.finalLocationUrl"
                target="_blank"
                rel="noreferrer"
              >
                Открыть локацию
              </a>
            </div>
            <div class="slot-actions">
              <Button
                label="Открыть локацию"
                icon="pi pi-map-marker"
                size="small"
                severity="secondary"
                @click="training.finalLocationUrl && openLocation(training.finalLocationUrl)"
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
              <Avatar :image="request.student.slice(0, 1)" shape="circle" />
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

    <section>
      <SectionHeader title="Ученики" />
      <div class="student-grid">
        <Card
          v-for="student in students"
          :key="student.id"
          class="student-card clickable-card"
          role="button"
          tabindex="0"
          @click="openStudentCard(student)"
          @keydown.enter="openStudentCard(student)"
        >
          <template #content>
            <div class="student-top">
              <Avatar :image="student.avatar" shape="circle" />
              <div>
                <h3>{{ student.name }}</h3>
                <span>{{ student.level }} · {{ student.focus }}</span>
              </div>
            </div>
          </template>
        </Card>
      </div>
    </section>

    <Dialog v-model:visible="studentDialogOpen" modal header="Карточка ученика" class="moto-dialog">
      <div class="form-stack">
        <div class="student-top">
          <Avatar :image="selectedStudent.avatar" shape="circle" />
          <div>
            <h3>{{ selectedStudent.name }}</h3>
            <span>@{{ selectedStudent.telegramUsername || selectedStudent.name.split(' ')[0].toLowerCase() }}_moto · {{ selectedStudent.status }}</span>
          </div>
        </div>

        <div class="action-grid">
          <Button label="Заполнить отчет" icon="pi pi-pen-to-square" @click="reportOpen = true" />
          <Button label="Добавить видео" icon="pi pi-video" severity="secondary" @click="videoOpen = true" />
        </div>

        <label>
          Уровень
          <InputText v-model="level" />
        </label>
        <label>
          Заметка инструктора
          <Textarea v-model="note" rows="3" auto-resize />
        </label>

        <div class="note-list">
          <div>
            <span>Ближайшая тренировка</span>
            <strong>{{ selectedStudent.nextLesson }}</strong>
          </div>
          <div>
            <span>Локация</span>
            <strong>{{ nextTrainingLocation.finalLocation }} · {{ durationText(nextTrainingLocation.duration) }}</strong>
            <a
              v-if="nextTrainingLocation.finalLocationUrl"
              class="location-link"
              :href="nextTrainingLocation.finalLocationUrl"
              target="_blank"
              rel="noreferrer"
            >
              Открыть локацию
            </a>
          </div>
          <div>
            <span>Что уже отрабатывали</span>
            <strong>овал, змейка, работа со сцеплением, торможение</strong>
          </div>
          <div>
            <span>Что нужно тренировать дальше</span>
            <strong>{{ selectedStudent.focus }}</strong>
          </div>
        </div>

        <SectionHeader title="История тренировок" />
        <div v-if="getStudentTrainingHistory(selectedStudent.id).length > 0">
          <LessonCard
            v-for="history in getStudentTrainingHistory(selectedStudent.id)"
            :key="history.id"
            :lesson="history"
          />
        </div>
        <div v-else class="text-gray-400 text-sm">
          Тренировок еще нет
        </div>

        <SectionHeader title="Навыки" />
        <div class="skill-edit-list">
          <div v-for="skill in studentSkills" :key="skill.id" class="skill-edit-row">
            <span>{{ skill.name }}</span>
            <div>
              <Button
                :label="skill.done ? 'Отработано' : 'В работе'"
                size="small"
                :severity="skill.done ? undefined : 'secondary'"
              />
              <Button icon="pi pi-trash" size="small" severity="secondary" @click="removeSkill(skill.id)" />
            </div>
          </div>
        </div>

        <label>
          Добавить навык
          <InputText v-model="customSkill" placeholder="например, маневрирование" />
        </label>
        <Button label="Добавить навык" icon="pi pi-plus" @click="addSkill" />

        <SectionHeader title="Видео ученика" />
        <Card v-for="video in videos.slice(0, 2)" :key="video.id" class="video-card compact">
          <template #content>
            <div class="video-info">
              <Tag value="Telegram" />
              <h3>{{ video.title }}</h3>
              <span>{{ video.date }} · {{ video.theme }}</span>
              <small>{{ video.telegramUrl }}</small>
            </div>
          </template>
        </Card>
      </div>
    </Dialog>

    <CompleteTrainingDialog
      :open="completeTrainingDialogOpen"
      :slot="trainingToComplete"
      :student="studentForTraining"
      @update:open="completeTrainingDialogOpen = $event"
      @completed="completeTrainingDialogOpen = false"
    />

    <Dialog v-model:visible="reportOpen" modal header="Отчет по тренировке" class="moto-dialog">
      <div class="form-stack">
        <label>
          Запланировано
          <InputText v-model="report.planned" />
        </label>
        <label>
          Отработано
          <InputText v-model="report.done" />
        </label>
        <label>
          Добавить навык
          <InputText v-model="report.newSkill" placeholder="например, восьмерка" />
        </label>
        <label>
          Комментарий инструктора
          <Textarea v-model="report.comment" rows="3" auto-resize />
        </label>
        <label>
          Что получилось
          <Textarea v-model="report.improved" rows="2" auto-resize />
        </label>
        <label>
          Что тренировать дальше
          <Textarea v-model="report.homework" rows="2" auto-resize />
        </label>
        <label>
          Ссылка на видео Telegram
          <InputText v-model="report.video" />
        </label>
        <Button label="Сохранить отчет" icon="pi pi-check" @click="reportOpen = false" />
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

    <Dialog v-model:visible="videoOpen" modal header="Добавить видео" class="moto-dialog">
      <div class="form-stack">
        <label>
          Ссылка на видео в Telegram
          <InputText v-model="videoLink" />
        </label>
        <p>Видео хранится в закрытом Telegram-канале. В Mini App сохраняется только ссылка.</p>
        <Button label="Прикрепить к ученику" icon="pi pi-paperclip" @click="videoOpen = false" />
      </div>
    </Dialog>
  </section>
</template>
