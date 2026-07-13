<script lang="ts" setup>
import {computed, nextTick, onMounted, ref} from 'vue'
import {storeToRefs} from 'pinia'
import CompleteTrainingDialog from '@/components/CompleteTrainingDialog.vue'
import MetricCard from '@/components/MetricCard.vue'
import SectionHeader from '@/components/SectionHeader.vue'
import {useStudentsStore} from '@/stores/studentsStore.ts'
import {useUserStore} from '@/stores/userStore.ts'
import {useTrainingStore} from '@/composables/useTrainingStore.ts'
import type {BookingSlot} from '@/types/booking'
import type {PaymentStatus, TrainingPackage, TrainingPackageName} from '@/types/package'
import type {Skill} from '@/types/skill'
import type {Student} from '@/types/student'
import type {TrainingHistory} from '@/types/training'
import {durationOptions} from "@/dictionary/durationOptions.ts";
import { standardLocations } from '@/constants/locations'
import {
  packageNameForStudent,
  setStoredPackageName,
  trainingPackageNameOptions,
} from '@/utils/trainingPackageName'

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
const {
  addManualTraining,
  addTrainingVideo,
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
const studentName = ref('')
const trainingPlan = ref(selectedStudent.value?.focus || '')
const level = ref('')
const packageTotal = ref(selectedStudent.value?.trainingPackage?.total ?? 0)
const packageCompleted = ref(selectedStudent.value?.trainingPackage?.completed ?? 0)
const packagePaymentStatus = ref<PaymentStatus>(selectedStudent.value?.trainingPackage?.paymentStatus ?? 'не оплачено')
const packageName = ref<TrainingPackageName>('Скутер')
const editableSkills = ref<Skill[]>([])
const selectedStudentHistory = ref<TrainingHistory[]>([])
const selectedTrainingHistory = ref<TrainingHistory | null>(null)
const trainingDetailsOpen = ref(false)
const studentSaveMessage = ref('')
const trainingToReport = ref<BookingSlot | null>(null)
const selectedVideoHistory = ref<TrainingHistory | null>(null)
const videoFormSection = ref<HTMLElement | null>(null)
const videoForm = ref({
  title: '',
  url: '',
  comment: '',
})
const paymentStatusOptions: PaymentStatus[] = ['оплачено', 'не оплачено', 'частично оплачено']
const manualTrainingForm = ref({
  date: null as Date | null,
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

const allStudents = computed(() => (apiStudents.value.length > 0 ? apiStudents.value : studentsStore.students))
const activeStudents = computed(() => allStudents.value.length)
const instructorFullName = computed(() => userStore.instructorProfile?.fullName || 'Инструктор')
const instructorUsername = computed(() => {
  const username = userStore.instructorProfile?.telegramUsername
  return username ? `@${username.replace(/^@/, '')}` : '@username'
})
const instructorSubtitle = computed(() => `${instructorUsername.value} · частный мотоинструктор`)
const newStudents = computed<NewStudentListItem[]>(() => {
  return allStudents.value
    .filter((student) => isRecentStudent(student.createdAt))
    .map((student) => ({
      id: student.id,
      name: student.name,
      username: student.telegramUsername ?? '',
      comment: student.focus || 'Ожидает первичную консультацию.',
      date: formatStudentDate(student.createdAt),
      status: newStudentStatuses.value[student.id] ?? 'new',
    }))
})


const selectedStudentSlots = computed(() => selectedStudent.value?.upcomingTrainings ?? [])
const selectedStudentActiveSlots = computed(() =>
  selectedStudentSlots.value
    .filter((slot) => ['requested', 'reschedule', 'confirmed'].includes(slot.status))
    .sort((a, b) => parseSlotDateTime(a).getTime() - parseSlotDateTime(b).getTime()),
)
const selectedStudentNextLesson = computed(() => {
  const nextSlot = selectedStudentActiveSlots.value[0]

  if (!nextSlot) {
    return 'Время еще не выбрано'
  }

  const location = nextSlot.finalLocation || nextSlot.location

  return [nextSlot.date, nextSlot.time, location].filter(Boolean).join(' · ')
})
const selectedStudentReportSlots = computed(() =>
  selectedStudentSlots.value.filter((slot) => slot.status === 'confirmed'),
)
const videoTrainingHistory = computed(() =>
  selectedStudentHistory.value.filter((history) => Boolean(history.apiId)),
)
const isVideoUrlValid = computed(() => {
  try {
    const url = new URL(videoForm.value.url.trim())
    return ['t.me', 'telegram.me'].includes(url.hostname) && ['http:', 'https:'].includes(url.protocol)
  } catch {
    return false
  }
})

onMounted(async () => {
  await userStore.checkHealth()
  await userStore.loadInstructorProfile()
  await userStore.loadSkills()
  await studentsStore.loadStudents()
})

async function openStudentCard(nextStudent: Student) {
  selectedTrainingHistory.value = null
  trainingDetailsOpen.value = false
  selectedStudent.value = nextStudent
  selectedStudentHistory.value = nextStudent.trainingHistory ?? []
  studentName.value = nextStudent.name
  level.value = nextStudent.level
  packageTotal.value = nextStudent.trainingPackage?.total ?? 0
  packageCompleted.value = nextStudent.trainingPackage?.completed ?? 0
  packagePaymentStatus.value = nextStudent.trainingPackage?.paymentStatus ?? 'не оплачено'
  packageName.value = packageNameForStudent(nextStudent)
  trainingPlan.value = nextStudent.focus || ''
  editableSkills.value = (nextStudent.skills || []).map((skill) => ({ ...skill }))
  studentSaveMessage.value = ''
  studentDialogOpen.value = true

  const profileStudent = await studentsStore.loadStudentProfile(nextStudent)
  selectedStudent.value = profileStudent
  selectedStudentHistory.value = profileStudent.trainingHistory ?? []
  studentName.value = profileStudent.name
  level.value = profileStudent.level
  trainingPlan.value = profileStudent.focus || ''
  packageName.value = packageNameForStudent(profileStudent)

  const [apiPackage, apiSkills] = await Promise.all([
    studentsStore.loadStudentPackage(profileStudent),
    studentsStore.loadStudentSkills(profileStudent),
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
  packageTotal.value = selectedStudent.value.trainingPackage?.total ?? 0
  packageCompleted.value = selectedStudent.value.trainingPackage?.completed ?? 0
  packagePaymentStatus.value = selectedStudent.value.trainingPackage?.paymentStatus ?? 'не оплачено'
  packageName.value = packageNameForStudent(selectedStudent.value)
  editableSkills.value = (selectedStudent.value.skills || []).map((skill) => ({ ...skill }))
}

function openTrainingDetails(history: TrainingHistory) {
  selectedTrainingHistory.value = history
  trainingDetailsOpen.value = true
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

function parseSlotDateTime(slot: Pick<BookingSlot, 'date' | 'time'>) {
  const [day, month] = slot.date.split(' ')
  const [hours, minutes] = slot.time.split(':').map(Number)

  return new Date(2026, monthMap[month] ?? 0, Number(day) || 1, hours || 0, minutes || 0)
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
    name: packageName.value,
    total: nextPackageTotal,
    completed: nextPackageCompleted,
    paymentStatus: packagePaymentStatus.value,
    startedAt: currentStudent.trainingPackage?.startedAt,
    endedAt: currentStudent.trainingPackage?.endedAt,
    isActive: currentStudent.trainingPackage?.isActive ?? nextPackageTotal > 0,
  })
  const savedSkills = await studentsStore.saveStudentSkills(updatedStudentFromApi, editableSkills.value)

  await updateStudent(currentStudent.id, {
    name: updatedStudentFromApi.name,
    level: updatedStudentFromApi.level,
    focus: updatedStudentFromApi.focus,
    trainingPackage: savedPackage ? { ...savedPackage, name: packageName.value } : savedPackage,
    skills: savedSkills,
  })
  await updateStudentSkills(currentStudent.id, savedSkills)

  selectedStudent.value = {
    ...updatedStudentFromApi,
    trainingPackage: savedPackage ? { ...savedPackage, name: packageName.value } : savedPackage,
    skills: savedSkills,
  }
  if (selectedStudent.value.apiId) {
    setStoredPackageName(selectedStudent.value.apiId, packageName.value)
  }
  setStoredPackageName(selectedStudent.value.id, packageName.value)
  studentName.value = selectedStudent.value.name
  packageTotal.value = selectedStudent.value.trainingPackage?.total ?? 0
  packageCompleted.value = selectedStudent.value.trainingPackage?.completed ?? 0
  packagePaymentStatus.value = selectedStudent.value.trainingPackage?.paymentStatus ?? 'не оплачено'
  packageName.value = packageNameForStudent(selectedStudent.value)
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

function handleTrainingReportCompleted(payload?: { skills?: Skill[]; trainingPackage?: TrainingPackage }) {
  if (selectedStudent.value && payload?.skills?.length) {
    selectedStudent.value = {
      ...selectedStudent.value,
      skills: payload.skills,
    }
    editableSkills.value = payload.skills.map((skill) => ({ ...skill }))
  }

  if (selectedStudent.value && payload?.trainingPackage) {
    selectedStudent.value = {
      ...selectedStudent.value,
      trainingPackage: payload.trainingPackage,
    }
    packageTotal.value = payload.trainingPackage.total
    packageCompleted.value = payload.trainingPackage.completed
    packagePaymentStatus.value = payload.trainingPackage.paymentStatus
    packageName.value = packageNameForStudent(selectedStudent.value)
  }

  completeTrainingDialogOpen.value = false
  trainingToReport.value = null
}

function openManualTrainingDialog() {
  manualTrainingForm.value = {
    date: null,
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
    form.date &&
      form.duration.trim() &&
      form.trained.trim() &&
      form.improved.trim() &&
      form.nextFocus.trim(),
  )
})

function formatManualTrainingDate(value: Date) {
  return new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long' })
    .format(value)
    .replace(' г.', '')
}

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
    date: formatManualTrainingDate(form.date!),
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
  selectedVideoHistory.value = null
  videoForm.value = { title: '', url: '', comment: '' }
  videoOpen.value = true
}

async function selectTrainingForVideo(history: TrainingHistory) {
  selectedVideoHistory.value = history
  videoForm.value = {
    title: '',
    url: '',
    comment: '',
  }
  await nextTick()
  videoFormSection.value?.scrollIntoView({behavior: 'smooth', block: 'start'})
}

async function saveTrainingVideo() {
  const currentStudent = selectedStudent.value
  const history = selectedVideoHistory.value

  if (!currentStudent || !history?.apiId || !isVideoUrlValid.value) {
    return
  }

  const saved = await addTrainingVideo(
    currentStudent.id,
    history,
    {
      title: videoForm.value.title.trim() || 'Видео тренировки',
      url: videoForm.value.url.trim(),
      comment: videoForm.value.comment.trim(),
    },
    history.apiId,
  )

  if (!saved) {
    return
  }

  const refreshedStudent = await studentsStore.loadStudentProfile(currentStudent)
  selectedStudent.value = refreshedStudent
  selectedStudentHistory.value = refreshedStudent.trainingHistory ?? []
  selectedVideoHistory.value = null
  videoForm.value = { title: '', url: '', comment: '' }
  videoOpen.value = false
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
    await updateStudent(createdStudent.id, createdStudent)
  }
  newStudentForm.value = { name: '', username: '', comment: '' }
  addStudentOpen.value = false
}

function removeSkill(id: number) {
  editableSkills.value = editableSkills.value.filter((skill) => skill.id !== id)
}
</script>

<template>
  <section class="stack">
    <Card class="hero-card profile">
      <template #content>
        <h1>{{ instructorFullName }}</h1>
        <p>{{ instructorSubtitle }}</p>
        <small v-if="userStore.isInstructorProfileLoading">Загружаем профиль инструктора...</small>
        <small v-else-if="userStore.instructorProfileError">{{ userStore.instructorProfileError }}</small>
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
                <span><a :href="`https://t.me/${item.username}`">@{{ item.username }}</a> · {{ item.date }}</span>
                <small>{{ item.comment }}</small>
              </div>
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
              <Avatar :image="student.avatar || 'student-avatar.png'" shape="circle"/>
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
          <InputText v-model="newStudentForm.username" placeholder="username" />
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
          <div style="display: flex; gap: 2rem;">
            <div style="display: flex; align-items: center; justify-content: center">
              <Avatar :image="selectedStudent.avatar || 'student-avatar.png'" shape="circle" size="large" style="width: 100px; height: 100px;"/>
            </div>
          </div>
          <div style="display: flex; gap: 1rem; flex-direction: column; align-items: flex-end; justify-content: flex-start">
            <h3 style="text-align: right">{{ selectedStudent.name }}</h3>
            <span style="text-align: right">@{{ selectedStudent.telegramUsername }}</span>
            <strong style="text-align: right">{{ selectedStudent.level }}</strong>
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
          <Select v-model="level" :options="['Новичок', 'База', 'Средний', 'Профи']" />
        </label>
        <section class="package-editor">
          <SectionHeader title="Пакет тренировок" />
          <div class="package-grid">
            <label>
              Название пакета
              <Select v-model="packageName" :options="trainingPackageNameOptions" />
            </label>
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
            <strong>{{ selectedStudentNextLesson }}</strong>
          </div>
        </div>

        <label>
          Что будем изучать на тренировке
          <Textarea v-model="trainingPlan" auto-resize rows="3" />
        </label>

        <SectionHeader title="История тренировок" />
        <div v-if="selectedStudentHistory.length > 0" class="training-select-list">
          <button
            v-for="history in selectedStudentHistory"
            :key="history.id"
            class="training-select-card"
            type="button"
            @click="openTrainingDetails(history)"
          >
            <div class="lesson-head">
              <span>
                {{ history.date }} · {{ history.duration }} · {{ history.location || 'Локация не указана' }}
              </span>
              <Tag severity="success" value="завершено" />
            </div>
          </button>
        </div>
        <div v-else class="text-gray-400 text-sm">
          Тренировок еще нет
        </div>

        <SectionHeader title="Навыки" />
        <label>
          <MultiSelect v-model="editableSkills" :max-selected-labels="2" :options="userStore.skills" option-label="name"/>
        </label>
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
      </div>
    </Dialog>

    <Dialog
      v-if="selectedTrainingHistory"
      v-model:visible="trainingDetailsOpen"
      :draggable="false"
      class="moto-dialog"
      :header="`Тренировка ${selectedTrainingHistory.date}`"
      modal
    >
      <div class="form-stack">
        <div class="note-list">
          <div>
            <span>Дата</span>
            <strong>{{ selectedTrainingHistory.date }}</strong>
          </div>
          <div>
            <span>Длительность</span>
            <strong>{{ selectedTrainingHistory.duration }}</strong>
          </div>
          <div>
            <span>Локация</span>
            <strong>{{ selectedTrainingHistory.location || 'Локация не указана' }}</strong>
          </div>
          <div>
            <span>Что тренировали</span>
            <strong>{{ selectedTrainingHistory.topics.join(', ') || selectedTrainingHistory.theme }}</strong>
          </div>
          <div>
            <span>Что получилось</span>
            <strong>{{ selectedTrainingHistory.improved || 'Не указано' }}</strong>
          </div>
          <div>
            <span>На что обратить внимание</span>
            <strong>{{ selectedTrainingHistory.nextFocus || 'Не указано' }}</strong>
          </div>
        </div>
        <a
          v-if="selectedTrainingHistory.videoUrl"
          :href="selectedTrainingHistory.videoUrl"
          class="location-link"
          rel="noreferrer"
          target="_blank"
        >
          Открыть видео в Telegram
        </a>
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
          <DatePicker v-model="manualTrainingForm.date" date-format="dd.mm.yy" show-icon />
        </label>
        <label>
          Длительность
          <Select v-model="manualTrainingForm.duration" :options="durationOptions" />
        </label>
        <label>
          Локация
          <Select v-model="manualTrainingForm.location" :options="standardLocations" option-label="name" option-value="name"/>
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
        <div v-if="videoTrainingHistory.length > 0" class="training-select-list">
          <button
            v-for="history in videoTrainingHistory"
            :key="history.id"
            :class="['training-select-card', { active: selectedVideoHistory?.id === history.id }]"
            type="button"
            @click="selectTrainingForVideo(history)"
          >
            <span>{{ history.date }} · {{ durationText(history.duration) }}</span>
            <strong>{{ history.location || 'Локация не указана' }}</strong>
            <Tag value="Проведено" />
          </button>
        </div>
        <p v-else class="status-message">У ученика пока нет тренировок, к которым можно прикрепить видео.</p>

        <div v-if="selectedVideoHistory" ref="videoFormSection" class="form-stack">
          <strong>Видео для тренировки {{ selectedVideoHistory.date }}</strong>
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
          <Button :disabled="!isVideoUrlValid" icon="pi pi-check" label="Сохранить видео" @click="saveTrainingVideo" />
        </div>
      </div>
    </Dialog>
  </section>
</template>
