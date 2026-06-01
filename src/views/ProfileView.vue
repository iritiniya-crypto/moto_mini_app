<script setup lang="ts">
import { computed, ref } from 'vue'
import CompleteTrainingDialog from '../components/CompleteTrainingDialog.vue'
import LessonCard from '../components/LessonCard.vue'
import MetricCard from '../components/MetricCard.vue'
import SectionHeader from '../components/SectionHeader.vue'
import SkillProgress from '../components/SkillProgress.vue'
import { useBookingStore } from '../composables/useBookingStore'
import { useTrainingStore } from '../composables/useTrainingStore'
import { newStudents as mockNewStudents } from '../mock/trainingContent'
import { students } from '../mock/students'
import type { BookingSlot, PaymentStatus, Skill, Student } from '../mock/types'

defineProps<{
  role: 'student' | 'instructor'
}>()

type StudentCard = Student

const { slots } = useBookingStore()
const {
  addManualTraining,
  addTrainingVideo,
  allStudents: storeStudents,
  getStudent,
  getStudentTrainingHistory,
  getStudentSkills,
  updateStudent,
  updateStudentSkills,
} = useTrainingStore()

const student = computed(() => getStudent(students[0].id) || students[0])
const selectedStudent = ref<StudentCard>(students[0])
const studentDialogOpen = ref(false)
const addStudentOpen = ref(false)
const reportSelectionOpen = ref(false)
const completeTrainingDialogOpen = ref(false)
const manualTrainingOpen = ref(false)
const isManualTrainingSaving = ref(false)
const videoOpen = ref(false)
const newStudents = ref(mockNewStudents.map((item) => ({ ...item, status: 'new' })))
const manualStudents = ref<StudentCard[]>([])
const customSkill = ref('')
const trainingPlan = ref(selectedStudent.value.focus || '')
const level = ref(selectedStudent.value.level)
const packageTotal = ref(selectedStudent.value.trainingPackage?.total ?? 0)
const packageCompleted = ref(selectedStudent.value.trainingPackage?.completed ?? 0)
const packagePaymentStatus = ref<PaymentStatus>(selectedStudent.value.trainingPackage?.paymentStatus ?? 'не оплачено')
const editableSkills = ref<Skill[]>([])
const studentSaveMessage = ref('')
const trainingToReport = ref<BookingSlot | null>(null)
const videoTraining = ref<BookingSlot | null>(null)
const videoForm = ref({
  title: '',
  url: '',
  comment: '',
})
const durationOptions = ['30 мин', '60 мин', '90 мин', '120 мин']
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

const allStudents = computed(() => [...storeStudents.value, ...manualStudents.value])
const activeStudents = computed(() => allStudents.value.length)

const studentTrainingHistory = computed(() => getStudentTrainingHistory(student.value.id))
const studentSkills = computed(() => getStudentSkills(student.value.id))
const studentPackage = computed(
  () =>
    student.value.trainingPackage || {
      total: 0,
      completed: 0,
      paymentStatus: 'не оплачено' as PaymentStatus,
    },
)
const studentPackageText = computed(() => `${studentPackage.value.completed} / ${studentPackage.value.total}`)
const selectedStudentSlots = computed(() =>
  slots.value.filter(
    (slot) =>
      slot.studentId === selectedStudent.value.id &&
      ['requested', 'rescheduleRequested', 'confirmed', 'completed', 'rescheduled'].includes(slot.status),
  ),
)
const selectedStudentReportSlots = computed(() =>
  selectedStudentSlots.value.filter((slot) => slot.status === 'confirmed'),
)
const selectedStudentVideoSlots = computed(() =>
  selectedStudentSlots.value.filter((slot) => slot.status === 'confirmed' || slot.status === 'completed' || slot.status === 'rescheduled'),
)

function openStudentCard(nextStudent: StudentCard) {
  selectedStudent.value = nextStudent
  level.value = nextStudent.level
  packageTotal.value = nextStudent.trainingPackage?.total ?? 0
  packageCompleted.value = nextStudent.trainingPackage?.completed ?? 0
  packagePaymentStatus.value = nextStudent.trainingPackage?.paymentStatus ?? 'не оплачено'
  trainingPlan.value = nextStudent.focus || ''
  editableSkills.value = (nextStudent.skills || []).map((skill) => ({ ...skill }))
  studentSaveMessage.value = ''
  studentDialogOpen.value = true
}

function telegramHandle(nextStudent: StudentCard) {
  return nextStudent.telegramUsername || `@${nextStudent.name.split(' ')[0].toLowerCase()}_moto`
}

function durationText(duration: string) {
  return duration.replace('мин', 'минут')
}

function statusLabel(status: BookingSlot['status']) {
  const labels = {
    available: 'Свободно',
    requested: 'Ожидает подтверждения',
    confirmed: 'Подтверждено',
    completed: 'Проведено',
    rescheduleRequested: 'Перенос на подтверждении',
    rescheduled: 'Перенесено',
    cancelled: 'Отменено',
  }

  return labels[status]
}

function saveStudentChanges() {
  const nextLevel = level.value.trim()
  const nextTrainingPlan = trainingPlan.value.trim()
  const nextPackageTotal = Math.max(0, Number(packageTotal.value) || 0)
  const nextPackageCompleted = Math.min(
    nextPackageTotal,
    Math.max(0, Number(packageCompleted.value) || 0),
  )

  updateStudent(selectedStudent.value.id, {
    level: nextLevel || selectedStudent.value.level,
    focus: nextTrainingPlan,
    trainingPackage: {
      total: nextPackageTotal,
      completed: nextPackageCompleted,
      paymentStatus: packagePaymentStatus.value,
    },
  })
  updateStudentSkills(selectedStudent.value.id, editableSkills.value)

  const updatedStudent = getStudent(selectedStudent.value.id)
  if (updatedStudent) {
    selectedStudent.value = updatedStudent
    packageTotal.value = updatedStudent.trainingPackage?.total ?? 0
    packageCompleted.value = updatedStudent.trainingPackage?.completed ?? 0
    packagePaymentStatus.value = updatedStudent.trainingPackage?.paymentStatus ?? 'не оплачено'
    editableSkills.value = (updatedStudent.skills || []).map((skill) => ({ ...skill }))
  }

  studentSaveMessage.value = 'Изменения сохранены'
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

function saveManualTraining() {
  manualTrainingMessage.value = ''

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

  const history = addManualTraining(selectedStudent.value.id, {
    date: form.date.trim(),
    duration: form.duration,
    location: form.location.trim() || undefined,
    topics,
    improved: form.improved.trim(),
    nextFocus: form.nextFocus.trim(),
    videoUrl: form.videoUrl.trim() || undefined,
  })

  if (history) {
    const updatedStudent = getStudent(selectedStudent.value.id)
    if (updatedStudent) {
      selectedStudent.value = updatedStudent
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

function saveTrainingVideo() {
  if (!videoTraining.value || !videoForm.value.url.trim()) {
    return
  }

  const history = getStudentTrainingHistory(selectedStudent.value.id).find((item) => item.slotId === videoTraining.value?.id)

  addTrainingVideo(
    selectedStudent.value.id,
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
  )

  videoOpen.value = false
}

function acceptNewStudent(id: number) {
  const item = newStudents.value.find((newStudent) => newStudent.id === id)
  if (item) {
    item.status = 'accepted'
  }
}

function declineNewStudent(id: number) {
  const item = newStudents.value.find((newStudent) => newStudent.id === id)
  if (item) {
    item.status = 'declined'
  }
}

function addManualStudent() {
  const name = newStudentForm.value.name.trim()

  if (!name) {
    return
  }

  manualStudents.value.push({
    id: Date.now(),
    name,
    status: 'новый ученик',
    level: 'Новичок',
    completedTrainingsCount: 0,
    nextLesson: 'Время еще не выбрано',
    avatar: '',
    focus: newStudentForm.value.comment || 'первичная тренировка и знакомство с мотоциклом',
    trainingPackage: {
      total: 0,
      completed: 0,
      paymentStatus: 'не оплачено',
    },
  })
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
  <section v-if="role === 'student'" class="stack">
    <Card class="hero-card profile">
      <template #content>
        <div class="student-top">
          <Avatar image="student-avatar.png" size="xlarge" shape="circle" />
          <div>
            <h1>{{ student.name }}</h1>
            <p>{{ student.level }}</p>
          </div>
        </div>
      </template>
    </Card>

    <div class="metric-grid">
      <MetricCard label="Тренировок" :value="student.completedTrainingsCount" hint="в журнале" />
      <MetricCard label="Уровень" :value="student.level" hint="текущий" />
      <MetricCard label="Пакет" :value="studentPackageText" :hint="studentPackage.paymentStatus" />
    </div>

    <section>
      <SectionHeader title="История тренировок" />
      <div v-if="studentTrainingHistory.length > 0" class="stack tight">
        <LessonCard v-for="lesson in studentTrainingHistory" :key="lesson.id" :lesson="lesson" />
      </div>
      <Card v-else class="settings-card">
        <template #content>
          <p class="text-gray-400">Тренировок еще нет</p>
        </template>
      </Card>
    </section>

    <section>
      <SectionHeader title="Прогресс навыков" />
      <div v-if="studentSkills.length > 0" class="stack tight">
        <SkillProgress v-for="skill in studentSkills" :key="skill.id" :skill="skill" />
      </div>
      <Card v-else class="settings-card">
        <template #content>
          <p class="text-gray-400">Навыков еще нет</p>
        </template>
      </Card>
    </section>

  </section>

  <section v-else class="stack">
    <Card class="hero-card profile">
      <template #content>
        <Tag value="профиль инструктора" />
        <h1>Артем Соколов</h1>
        <p>@artem_moto · частный мотоинструктор</p>
      </template>
    </Card>

    <div class="metric-grid">
      <MetricCard label="Активных учеников" :value="activeStudents" hint="сейчас" />
      <MetricCard label="Новых учеников" :value="newStudents.filter((item) => item.status === 'new').length" hint="из бота" />
    </div>

    <Button label="Добавить ученика" icon="pi pi-plus" @click="addStudentOpen = true" />

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
                :value="item.status === 'accepted' ? 'Принят' : item.status === 'declined' ? 'Отклонен' : 'Новый'"
                :severity="item.status === 'accepted' ? 'success' : item.status === 'declined' ? 'secondary' : 'warn'"
              />
            </div>
            <div v-if="item.status === 'new'" class="slot-actions">
              <Button label="Принять" icon="pi pi-check" size="small" @click="acceptNewStudent(item.id)" />
              <Button label="Отклонить" icon="pi pi-times" size="small" severity="secondary" @click="declineNewStudent(item.id)" />
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

    <Dialog v-model:visible="addStudentOpen" modal header="Добавить ученика" class="moto-dialog" :draggable="false">
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
          <Textarea v-model="newStudentForm.comment" rows="3" auto-resize placeholder="Например: первый раз, хочет уверенно ездить в городе" />
        </label>
        <Button label="Добавить ученика" icon="pi pi-plus" @click="addManualStudent" />
      </div>
    </Dialog>

    <Dialog v-model:visible="studentDialogOpen" modal header="Карточка ученика" class="moto-dialog student-card-dialog" :draggable="false">
      <div class="form-stack student-dialog-content">
        <div class="student-dialog-header">
          <Avatar image="student-avatar.png" class="student-dialog-avatar" shape="circle" />
          <div>
            <h3>{{ selectedStudent.name }}</h3>
            <span>{{ telegramHandle(selectedStudent) }}</span>
            <strong>{{ selectedStudent.level }}</strong>
          </div>
        </div>

        <div class="action-grid">
          <Button label="Заполнить отчет" icon="pi pi-pen-to-square" @click="openReportSelection" />
          <Button label="Добавить тренировку вручную" icon="pi pi-plus-circle" severity="secondary" @click="openManualTrainingDialog" />
          <Button label="Добавить видео" icon="pi pi-video" severity="secondary" @click="openVideoDialog" />
          <Button label="Сохранить изменения" icon="pi pi-save" severity="secondary" @click="saveStudentChanges" />
        </div>
        <p v-if="studentSaveMessage" class="status-message">{{ studentSaveMessage }}</p>

        <label>
          Уровень
          <Select v-model="level" :options="['Новичок', 'База', 'Уверенный старт', 'Город', 'Профи']" />
        </label>
        <section class="package-editor">
          <SectionHeader title="Пакет тренировок" />
          <div class="package-grid">
            <label>
              Количество тренировок в пакете
              <input v-model.number="packageTotal" class="skill-percent-input" type="number" min="0" />
            </label>
            <label>
              Пройдено в текущем пакете
              <input v-model.number="packageCompleted" class="skill-percent-input" type="number" min="0" :max="packageTotal" />
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
          <Textarea v-model="trainingPlan" rows="3" auto-resize />
        </label>

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
        <div v-if="editableSkills.length > 0" class="skill-edit-list">
          <label v-for="skill in editableSkills" :key="skill.id" class="skill-edit-row skill-percent-row">
            <span>{{ skill.name }}</span>
            <input
              v-model.number="skill.oldValue"
              class="skill-percent-input"
              type="number"
              min="0"
              max="100"
            />
            <Button icon="pi pi-trash" size="small" severity="secondary" @click="removeSkill(skill.id)" />
          </label>
        </div>

        <label>
          Добавить навык
          <InputText v-model="customSkill" placeholder="например, маневрирование" />
        </label>
        <Button label="Добавить навык" icon="pi pi-plus" @click="addSkill" />
      </div>
    </Dialog>

    <Dialog v-model:visible="reportSelectionOpen" modal header="Выбрать тренировку для отчета" class="moto-dialog" :draggable="false">
      <div class="form-stack">
        <div v-if="selectedStudentReportSlots.length > 0" class="training-select-list">
          <button
            v-for="slot in selectedStudentReportSlots"
            :key="slot.id"
            type="button"
            class="training-select-card"
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
      :open="completeTrainingDialogOpen"
      :slot="trainingToReport"
      :student="selectedStudent"
      @update:open="completeTrainingDialogOpen = $event"
      @completed="handleTrainingReportCompleted"
    />

    <Dialog
      v-if="manualTrainingOpen"
      v-model:visible="manualTrainingOpen"
      modal
      header="Добавить тренировку"
      class="moto-dialog"
      :draggable="false"
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
            rows="2"
            auto-resize
            placeholder="Например: Овал, Восьмерка, Торможение"
          />
        </label>
        <label>
          Что получилось
          <Textarea v-model="manualTrainingForm.improved" rows="3" auto-resize />
        </label>
        <label>
          На что обратить внимание
          <Textarea v-model="manualTrainingForm.nextFocus" rows="3" auto-resize />
        </label>
        <label>
          Видео Telegram
          <InputText v-model="manualTrainingForm.videoUrl" placeholder="https://t.me/..." />
        </label>
        <p v-if="manualTrainingMessage" class="status-message">{{ manualTrainingMessage }}</p>
        <Button
          label="Сохранить тренировку"
          icon="pi pi-check"
          :disabled="isManualTrainingSaving"
          @click="saveManualTraining"
        />
      </div>
    </Dialog>

    <Dialog v-model:visible="videoOpen" modal header="Добавить видео к тренировке" class="moto-dialog" :draggable="false">
      <div class="form-stack">
        <div v-if="selectedStudentVideoSlots.length > 0" class="training-select-list">
          <button
            v-for="slot in selectedStudentVideoSlots"
            :key="slot.id"
            type="button"
            :class="['training-select-card', { active: videoTraining?.id === slot.id }]"
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
            <Textarea v-model="videoForm.comment" rows="3" auto-resize />
          </label>
          <Button label="Сохранить видео" icon="pi pi-check" :disabled="!videoForm.url.trim()" @click="saveTrainingVideo" />
        </template>
      </div>
    </Dialog>
  </section>
</template>
