<script lang="ts" setup>
import {computed, onMounted, ref} from 'vue'
import {storeToRefs} from 'pinia'
import CompleteTrainingDialog from '@/components/CompleteTrainingDialog.vue'
import LessonCard from '@/components/LessonCard.vue'
import MetricCard from '@/components/MetricCard.vue'
import SectionHeader from '@/components/SectionHeader.vue'
import {useBookingStore} from '@/composables/useBookingStore.ts'
import {useStudentsStore} from '@/stores/studentsStore.ts'
import {useUserStore} from '@/stores/userStore.ts'
import {useTrainingStore} from '@/composables/useTrainingStore.ts'
import type {BookingSlot} from '@/types/booking'
import type {PaymentStatus} from '@/types/package'
import type {Skill} from '@/types/skill'
import type {Student} from '@/types/student'
import type {TrainingHistory} from '@/types/training'
import {durationOptions} from "@/dictionary/durationOptions.ts";

defineProps<{
  role: 'student' | 'instructor'
}>()

type NewStudentStatus = 'new' | 'accepted' | 'declined'
type NewStudentListItem = {
  id: string
  name: string
  username: string
  comment: string
  date: string
  status: NewStudentStatus
}

const userStore = useUserStore();
const { slots } = useBookingStore()
const {
  addManualTraining,
  addTrainingVideo,
  getStudentTrainingHistory,
  updateStudent,
  updateStudentSkills,
} = useTrainingStore()

const studentsStore = useStudentsStore()
const {
  error: studentsError,
  isLoading: isStudentsLoading,
  isSaving: isStudentSaving,
  students: apiStudents,
} = storeToRefs(studentsStore)
const selectedStudent = ref<Student | null>(null)
const studentDialogOpen = ref(false)
const addStudentOpen = ref(false)
const reportSelectionOpen = ref(false)
const completeTrainingDialogOpen = ref(false)
const manualTrainingOpen = ref(false)
const isManualTrainingSaving = ref(false)
const videoOpen = ref(false)
const newStudentStatuses = ref<Record<string, Exclude<NewStudentStatus, 'new'>>>({})
const customSkill = ref('')
const studentName = ref('')
const trainingPlan = ref(selectedStudent.value?.focus || '')
const level = ref('')
const packageTotal = ref(selectedStudent.value?.trainingPackage?.total ?? 0)
const packageCompleted = ref(selectedStudent.value?.trainingPackage?.completed ?? 0)
const packagePaymentStatus = ref<PaymentStatus>(selectedStudent.value?.trainingPackage?.paymentStatus ?? 'не оплачено')
const editableSkills = ref<Skill[]>([])
const selectedStudentHistory = ref<TrainingHistory[]>([])
const studentSaveMessage = ref('')
const trainingToReport = ref<BookingSlot | null>(null)
const videoTraining = ref<BookingSlot | null>(null)
const videoForm = ref({
  title: '',
  url: '',
  comment: '',
})
const paymentStatusOptions: PaymentStatus[] = ['оплачено', 'не оплачено', 'частично оплачено']
const manualTrainingForm = ref({
  date: '',
  duration: '90 мин',
  location: '',
  trained: '',
  improved: '',
  nextFocus: '',
  videoUrl: '',
})
const manualTrainingMessage = ref('')
const newStudentForm = ref({
  name: '',
  username: '',
  comment: '',
})

const allStudents = computed(() => (apiStudents.value.length > 0 ? apiStudents.value : studentsStore.students))
const activeStudents = computed(() => allStudents.value.length)
const newStudents = computed<NewStudentListItem[]>(() => {
  return allStudents.value
    .filter((student) => isRecentStudent(student.createdAt))
    .map((student) => ({
      id: student.id,
      name: student.name,
      username: telegramHandle(student),
      comment: student.focus || 'Ожидает первичную консультацию.',
      date: formatStudentDate(student.createdAt),
      status: newStudentStatuses.value[student.id] ?? 'new',
    }))
})

const selectedStudentSlots = computed(() =>
  slots.value.filter(
    (slot) =>
      slot.studentId === selectedStudent.value?.id &&
      ['requested', 'reschedule', 'confirmed', 'completed'].includes(slot.status),
  ),
)
const selectedStudentReportSlots = computed(() =>
  selectedStudentSlots.value.filter((slot) => slot.status === 'confirmed'),
)
const selectedStudentVideoSlots = computed(() =>
  selectedStudentSlots.value.filter((slot) => slot.status === 'confirmed' || slot.status === 'completed'),
)

onMounted(() => {
  userStore.checkHealth()
  userStore.loadSkills()
  studentsStore.loadStudents()
})

async function openStudentCard(nextStudent: Student) {
  const localStudent = await updateStudent(nextStudent.id, nextStudent)
  selectedStudent.value = nextStudent
  selectedStudentHistory.value = localStudent?.trainingHistory ?? nextStudent.trainingHistory ?? []
  studentName.value = nextStudent.name
  level.value = nextStudent.level
  packageTotal.value = nextStudent.trainingPackage?.total ?? 0
  packageCompleted.value = nextStudent.trainingPackage?.completed ?? 0
  packagePaymentStatus.value = nextStudent.trainingPackage?.paymentStatus ?? 'не оплачено'
  trainingPlan.value = nextStudent.focus || ''
  editableSkills.value = (nextStudent.skills || []).map((skill) => ({ ...skill }))
  studentSaveMessage.value = ''
  studentDialogOpen.value = true

  const [apiPackage, apiSkills] = await Promise.all([
    studentsStore.loadStudentPackage(nextStudent),
    studentsStore.loadStudentSkills(nextStudent),
  ])

  const currentStudent = selectedStudent.value
  if (!currentStudent) {
    return
  }

  selectedStudent.value = {
    ...currentStudent,
    trainingPackage: apiPackage ?? currentStudent.trainingPackage,
    skills: apiSkills ?? currentStudent.skills,
  }
  updateStudent(selectedStudent.value.id, selectedStudent.value)
  packageTotal.value = selectedStudent.value.trainingPackage?.total ?? 0
  packageCompleted.value = selectedStudent.value.trainingPackage?.completed ?? 0
  packagePaymentStatus.value = selectedStudent.value.trainingPackage?.paymentStatus ?? 'не оплачено'
  editableSkills.value = (selectedStudent.value.skills || []).map((skill) => ({ ...skill }))
}

function telegramHandle(nextStudent: Student) {
  return nextStudent.telegramUsername || `@${nextStudent.name.split(' ')[0].toLowerCase()}_moto`
}

function formatStudentDate(value?: string) {
  if (!value) {
    return 'дата не указана'
  }

  return new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long' }).format(new Date(value)).replace(' г.', '')
}

function isRecentStudent(createdAt?: string) {
  if (!createdAt) {
    return false
  }

  const createdAtMs = new Date(createdAt).getTime()

  if (!Number.isFinite(createdAtMs)) {
    return false
  }

  const threeDaysMs = 3 * 24 * 60 * 60 * 1000
  return Date.now() - createdAtMs <= threeDaysMs
}

function durationText(duration: string) {
  return duration.replace('мин', 'минут')
}

function statusLabel(status: BookingSlot['status']) {
  const labels = {
    available: 'Свободно',
    requested: 'Ожидает подтверждения',
    reschedule: 'Запрос на перенос',
    confirmed: 'Подтверждено',
    completed: 'Проведено',
    cancelled: 'Отменено',
  }

  return labels[status]
}

async function saveStudentChanges() {
  const currentStudent = selectedStudent.value
  if (isStudentSaving.value || !currentStudent) {
    return
  }

  const nextName = studentName.value.trim()
  const nextLevel = level.value.trim()
  const nextTrainingPlan = trainingPlan.value.trim()
  const nextPackageTotal = Math.max(0, Number(packageTotal.value) || 0)
  const nextPackageCompleted = Math.min(
    nextPackageTotal,
    Math.max(0, Number(packageCompleted.value) || 0),
  )

  const updatedStudentFromApi = await studentsStore.updateStudentRecord(currentStudent, {
    name: nextName || currentStudent.name,
    level: nextLevel || currentStudent.level,
    focus: nextTrainingPlan,
    nextTrainingPlan,
    telegramUsername: currentStudent.telegramUsername,
  })

  const savedPackage = await studentsStore.saveStudentPackage(updatedStudentFromApi, {
    total: nextPackageTotal,
    completed: nextPackageCompleted,
    paymentStatus: packagePaymentStatus.value,
    startedAt: currentStudent.trainingPackage?.startedAt,
    endedAt: currentStudent.trainingPackage?.endedAt,
    isActive: currentStudent.trainingPackage?.isActive ?? nextPackageTotal > 0,
  })
  const savedSkills = await studentsStore.saveStudentSkills(updatedStudentFromApi, editableSkills.value)

  updateStudent(currentStudent.id, {
    name: updatedStudentFromApi.name,
    level: updatedStudentFromApi.level,
    focus: updatedStudentFromApi.focus,
    trainingPackage: savedPackage,
    skills: savedSkills,
  })
  await updateStudentSkills(currentStudent.id, savedSkills)

  selectedStudent.value = {
    ...updatedStudentFromApi,
    trainingPackage: savedPackage,
    skills: savedSkills,
  }
  studentName.value = selectedStudent.value.name
  packageTotal.value = selectedStudent.value.trainingPackage?.total ?? 0
  packageCompleted.value = selectedStudent.value.trainingPackage?.completed ?? 0
  packagePaymentStatus.value = selectedStudent.value.trainingPackage?.paymentStatus ?? 'не оплачено'
  editableSkills.value = (selectedStudent.value.skills || []).map((skill) => ({ ...skill }))

  studentSaveMessage.value = studentsError.value || 'Изменения сохранены'
}

function openReportSelection() {
  reportSelectionOpen.value = true
}

function selectTrainingForReport(slot: BookingSlot) {
  trainingToReport.value = slot
  reportSelectionOpen.value = false
  completeTrainingDialogOpen.value = true
}

function handleTrainingReportCompleted() {
  completeTrainingDialogOpen.value = false
  trainingToReport.value = null
}

function openManualTrainingDialog() {
  manualTrainingForm.value = {
    date: '',
    duration: '90 мин',
    location: '',
    trained: '',
    improved: '',
    nextFocus: '',
    videoUrl: '',
  }
  manualTrainingMessage.value = ''
  isManualTrainingSaving.value = false
  manualTrainingOpen.value = true
}

const isManualTrainingValid = computed(() => {
  const form = manualTrainingForm.value

  return Boolean(
    form.date.trim() &&
      form.duration.trim() &&
      form.trained.trim() &&
      form.improved.trim() &&
      form.nextFocus.trim(),
  )
})

async function saveManualTraining() {
  manualTrainingMessage.value = ''
  const currentStudent = selectedStudent.value

  if (!currentStudent) {
    manualTrainingMessage.value = 'Сначала выберите ученика.'
    return
  }

  if (!isManualTrainingValid.value) {
    manualTrainingMessage.value = 'Заполните дату, что тренировали, что получилось и на что обратить внимание.'
    return
  }

  if (isManualTrainingSaving.value) {
    return
  }

  isManualTrainingSaving.value = true

  const form = manualTrainingForm.value
  const topics = form.trained
    .split(',')
    .map((topic) => topic.trim())
    .filter(Boolean)

  const history = await addManualTraining(currentStudent.id, {
    date: form.date.trim(),
    duration: form.duration,
    location: form.location.trim() || undefined,
    topics,
    improved: form.improved.trim(),
    nextFocus: form.nextFocus.trim(),
    videoUrl: form.videoUrl.trim() || undefined,
  }, currentStudent.apiId)

  if (history) {
    selectedStudentHistory.value = [history, ...selectedStudentHistory.value]
    selectedStudent.value = {
      ...currentStudent,
      completedTrainingsCount: currentStudent.completedTrainingsCount + 1,
      trainingHistory: selectedStudentHistory.value,
    }
    studentSaveMessage.value = 'Тренировка добавлена'
  } else {
    manualTrainingMessage.value = 'Не удалось добавить тренировку: ученик не найден.'
    isManualTrainingSaving.value = false
    return
  }

  manualTrainingOpen.value = false
  isManualTrainingSaving.value = false
}

function openVideoDialog() {
  videoTraining.value = null
  videoForm.value = { title: '', url: '', comment: '' }
  videoOpen.value = true
}

function selectTrainingForVideo(slot: BookingSlot) {
  videoTraining.value = slot
  videoForm.value = {
    title: '',
    url: '',
    comment: '',
  }
}

async function saveTrainingVideo() {
  const currentStudent = selectedStudent.value

  if (!currentStudent || !videoTraining.value || !videoForm.value.url.trim()) {
    return
  }

  const history = selectedStudentHistory.value.find((item) => item.slotId === videoTraining.value?.id)

  await addTrainingVideo(
    currentStudent.id,
    {
      slotId: videoTraining.value.id,
      date: videoTraining.value.date,
      duration: videoTraining.value.duration,
      location: videoTraining.value.finalLocation,
      theme: history?.theme || 'Видео тренировки',
      topics: history?.topics || [],
    },
    {
      title: videoForm.value.title.trim() || 'Видео тренировки',
      url: videoForm.value.url.trim(),
      comment: videoForm.value.comment.trim(),
    },
    history?.apiId,
  )

  selectedStudentHistory.value = await getStudentTrainingHistory(currentStudent.id)
  selectedStudent.value = {
    ...currentStudent,
    trainingHistory: selectedStudentHistory.value,
  }
  videoOpen.value = false
}

function acceptNewStudent(id: string) {
  newStudentStatuses.value[id] = 'accepted'
}

function declineNewStudent(id: string) {
  newStudentStatuses.value[id] = 'declined'
}

async function addManualStudent() {
  const name = newStudentForm.value.name.trim()

  if (!name || isStudentSaving.value) {
    return
  }

  const createdStudent = await studentsStore.createStudentRecord({
    name,
    level: 'Новичок',
    telegramUsername: newStudentForm.value.username.trim().replace(/^@/, '') || undefined,
    focus: newStudentForm.value.comment.trim() || 'первичная тренировка и знакомство с мотоциклом',
    nextTrainingPlan: newStudentForm.value.comment.trim() || 'первичная тренировка и знакомство с мотоциклом',
  })

  if (createdStudent) {
    updateStudent(createdStudent.id, createdStudent)
  }
  newStudentForm.value = { name: '', username: '', comment: '' }
  addStudentOpen.value = false
}

function addSkill() {
  const name = customSkill.value.trim()

  if (!name) {
    return
  }

  editableSkills.value.push({
    id: Date.now(),
    name,
    oldValue: 0,
  })
  customSkill.value = ''
}

function removeSkill(id: number) {
  editableSkills.value = editableSkills.value.filter((skill) => skill.id !== id)
}
</script>

<template>
  <section class="stack">
    <Card class="hero-card profile">
      <template #content>
        <h1>Никита Ноготочки 💅</h1>
        <p>@Nikita_Alex_Vietnam · частный мотоинструктор</p>
      </template>
    </Card>

    <div class="metric-grid">
      <MetricCard :value="activeStudents" hint="сейчас" label="Активных учеников" />
      <MetricCard :value="newStudents.filter((item) => item.status === 'new').length" hint="из бота" label="Новых учеников" />
    </div>

    <Button icon="pi pi-plus" label="Добавить ученика" @click="addStudentOpen = true" />
    <p v-if="isStudentsLoading" class="status-message">Загружаем учеников из backend...</p>
    <p v-else-if="studentsError" class="status-message">{{ studentsError }}</p>

    <section>
      <SectionHeader title="Новые ученики" />
      <div class="stack tight">
        <Card v-for="item in newStudents" :key="item.id" class="request-card">
          <template #content>
            <div class="request-top">
              <div>
                <h3>{{ item.name }}</h3>
                <span>{{ item.username }} · {{ item.date }}</span>
                <small>{{ item.comment }}</small>
              </div>
              <Tag
                :severity="item.status === 'accepted' ? 'success' : item.status === 'declined' ? 'secondary' : 'warn'"
                :value="item.status === 'accepted' ? 'Принят' : item.status === 'declined' ? 'Отклонен' : 'Новый'"
              />
            </div>
            <div v-if="item.status === 'new'" class="slot-actions">
              <Button icon="pi pi-check" label="Принять" size="small" @click="acceptNewStudent(item.id)" />
              <Button icon="pi pi-times" label="Отклонить" severity="secondary" size="small" @click="declineNewStudent(item.id)" />
            </div>
          </template>
        </Card>
      </div>
    </section>

    <section>
      <SectionHeader title="Все ученики" />
      <div class="student-grid">
        <Card
          v-for="student in allStudents"
          :key="student.id"
          class="student-card clickable-card"
          role="button"
          tabindex="0"
          @click="openStudentCard(student)"
          @keydown.enter="openStudentCard(student)"
        >
          <template #content>
            <div class="student-top">
              <Avatar image="student-avatar.png" shape="circle" />
              <div>
                <h3>{{ student.name }}</h3>
                <span>{{ student.level }} · {{ student.completedTrainingsCount }} тренировок</span>
              </div>
            </div>
          </template>
        </Card>
      </div>
    </section>

    <Dialog v-model:visible="addStudentOpen" :draggable="false" class="moto-dialog" header="Добавить ученика" modal>
      <div class="form-stack">
        <label>
          Имя и фамилия
          <InputText v-model="newStudentForm.name" />
        </label>
        <label>
          Telegram username
          <InputText v-model="newStudentForm.username" placeholder="@username" />
        </label>
        <label>
          Комментарий
          <Textarea v-model="newStudentForm.comment" auto-resize placeholder="Например: первый раз, хочет уверенно ездить в городе" rows="3" />
        </label>
        <Button
          :disabled="isStudentSaving"
          icon="pi pi-plus"
          label="Добавить ученика"
          @click="addManualStudent"
        />
      </div>
    </Dialog>

    <Dialog v-if="selectedStudent" v-model:visible="studentDialogOpen" :draggable="false" class="moto-dialog student-card-dialog" header="Карточка ученика" modal>
      <div class="form-stack student-dialog-content">
        <div class="student-dialog-header">
          <Avatar class="student-dialog-avatar" image="student-avatar.png" shape="circle" />
          <div>
            <h3>{{ selectedStudent.name }}</h3>
            <span>{{ telegramHandle(selectedStudent) }}</span>
            <strong>{{ selectedStudent.level }}</strong>
          </div>
        </div>

        <div class="action-grid">
          <Button icon="pi pi-pen-to-square" label="Заполнить отчет" @click="openReportSelection" />
          <Button icon="pi pi-plus-circle" label="Добавить тренировку вручную" severity="secondary" @click="openManualTrainingDialog" />
          <Button icon="pi pi-video" label="Добавить видео" severity="secondary" @click="openVideoDialog" />
          <Button
            :disabled="isStudentSaving"
            icon="pi pi-save"
            label="Сохранить изменения"
            severity="secondary"
            @click="saveStudentChanges"
          />
        </div>
        <p v-if="studentSaveMessage" class="status-message">{{ studentSaveMessage }}</p>

        <label>
          Имя и фамилия
          <InputText v-model="studentName" />
        </label>
        <label>
          Уровень
          <Select v-model="level" :options="['Новичок', 'База', 'Уверенный старт', 'Город', 'Профи']" />
        </label>
        <section class="package-editor">
          <SectionHeader title="Пакет тренировок" />
          <div class="package-grid">
            <label>
              Количество тренировок в пакете
              <input v-model.number="packageTotal" class="skill-percent-input" min="0" type="number" />
            </label>
            <label>
              Пройдено в текущем пакете
              <input v-model.number="packageCompleted" :max="packageTotal" class="skill-percent-input" min="0" type="number" />
            </label>
            <label class="package-payment-field">
              Статус оплаты
              <Select v-model="packagePaymentStatus" :options="paymentStatusOptions" />
            </label>
          </div>
          <div class="note-list">
            <div>
              <span>Пройдено</span>
              <strong>{{ Math.min(Number(packageCompleted) || 0, Number(packageTotal) || 0) }} / {{ Number(packageTotal) || 0 }}</strong>
            </div>
            <div>
              <span>Оплата</span>
              <strong>{{ packagePaymentStatus }}</strong>
            </div>
          </div>
        </section>
        <div class="note-list">
          <div>
            <span>Ближайшая тренировка</span>
            <strong>{{ selectedStudent.nextLesson }}</strong>
          </div>
        </div>

        <label>
          Что будем изучать на тренировке
          <Textarea v-model="trainingPlan" auto-resize rows="3" />
        </label>

        <SectionHeader title="История тренировок" />
        <div v-if="selectedStudentHistory.length > 0">
          <LessonCard
            v-for="history in selectedStudentHistory"
            :key="history.id"
            :lesson="history"
          />
        </div>
        <div v-else class="text-gray-400 text-sm">
          Тренировок еще нет
        </div>

        <SectionHeader title="Навыки" />
        <div v-if="editableSkills.length > 0" class="skill-edit-list">
          <label v-for="skill in editableSkills" :key="skill.id" class="skill-edit-row skill-percent-row">
            <span>{{ skill.name }}</span>
            <input
              v-model.number="skill.oldValue"
              class="skill-percent-input"
              max="100"
              min="0"
              type="number"
            />
            <Button icon="pi pi-trash" severity="secondary" size="small" @click="removeSkill(skill.id)" />
          </label>
        </div>

        <label>
          Добавить навык
          <InputText v-model="customSkill" placeholder="например, маневрирование" />
        </label>
        <Button icon="pi pi-plus" label="Добавить навык" @click="addSkill" />
      </div>
    </Dialog>

    <Dialog v-model:visible="reportSelectionOpen" :draggable="false" class="moto-dialog" header="Выбрать тренировку для отчета" modal>
      <div class="form-stack">
        <div v-if="selectedStudentReportSlots.length > 0" class="training-select-list">
          <button
            v-for="slot in selectedStudentReportSlots"
            :key="slot.id"
            class="training-select-card"
            type="button"
            @click="selectTrainingForReport(slot)"
          >
            <span>{{ slot.date }} · {{ slot.time }} · {{ durationText(slot.duration) }}</span>
            <strong>{{ slot.finalLocation || 'Локация не указана' }}</strong>
            <Tag :value="statusLabel(slot.status)" />
          </button>
        </div>
        <p v-else class="status-message">У ученика пока нет подтвержденных тренировок для отчета.</p>
      </div>
    </Dialog>

    <CompleteTrainingDialog
      :slot="trainingToReport"
      :open="completeTrainingDialogOpen"
      :student="selectedStudent"
      @completed="handleTrainingReportCompleted"
      @update:open="completeTrainingDialogOpen = $event"
    />

    <Dialog
      v-if="manualTrainingOpen"
      v-model:visible="manualTrainingOpen"
      :draggable="false"
      class="moto-dialog"
      header="Добавить тренировку"
      modal
    >
      <div class="form-stack">
        <label>
          Дата
          <InputText v-model="manualTrainingForm.date" placeholder="Например, 22 июня" />
        </label>
        <label>
          Длительность
          <Select v-model="manualTrainingForm.duration" :options="durationOptions" />
        </label>
        <label>
          Локация
          <InputText v-model="manualTrainingForm.location" placeholder="Например, Площадка Запад" />
        </label>
        <label>
          Что тренировали
          <Textarea
            v-model="manualTrainingForm.trained"
            auto-resize
            placeholder="Например: Овал, Восьмерка, Торможение"
            rows="2"
          />
        </label>
        <label>
          Что получилось
          <Textarea v-model="manualTrainingForm.improved" auto-resize rows="3" />
        </label>
        <label>
          На что обратить внимание
          <Textarea v-model="manualTrainingForm.nextFocus" auto-resize rows="3" />
        </label>
        <label>
          Видео Telegram
          <InputText v-model="manualTrainingForm.videoUrl" placeholder="https://t.me/..." />
        </label>
        <p v-if="manualTrainingMessage" class="status-message">{{ manualTrainingMessage }}</p>
        <Button
          :disabled="isManualTrainingSaving"
          icon="pi pi-check"
          label="Сохранить тренировку"
          @click="saveManualTraining"
        />
      </div>
    </Dialog>

    <Dialog v-model:visible="videoOpen" :draggable="false" class="moto-dialog" header="Добавить видео к тренировке" modal>
      <div class="form-stack">
        <div v-if="selectedStudentVideoSlots.length > 0" class="training-select-list">
          <button
            v-for="slot in selectedStudentVideoSlots"
            :key="slot.id"
            :class="['training-select-card', { active: videoTraining?.id === slot.id }]"
            type="button"
            @click="selectTrainingForVideo(slot)"
          >
            <span>{{ slot.date }} · {{ slot.time }} · {{ durationText(slot.duration) }}</span>
            <strong>{{ slot.finalLocation || 'Локация не указана' }}</strong>
            <Tag :value="statusLabel(slot.status)" />
          </button>
        </div>
        <p v-else class="status-message">У ученика пока нет тренировок, к которым можно прикрепить видео.</p>

        <template v-if="videoTraining">
          <label>
            Ссылка на Telegram-видео
            <InputText v-model="videoForm.url" placeholder="https://t.me/..." />
          </label>
          <label>
            Название / короткий комментарий
            <InputText v-model="videoForm.title" />
          </label>
          <label>
            Короткий комментарий
            <Textarea v-model="videoForm.comment" auto-resize rows="3" />
          </label>
          <Button :disabled="!videoForm.url.trim()" icon="pi pi-check" label="Сохранить видео" @click="saveTrainingVideo" />
        </template>
      </div>
    </Dialog>
  </section>
</template>
