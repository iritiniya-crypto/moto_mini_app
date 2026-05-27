<script setup lang="ts">
import { computed, ref } from 'vue'
import LessonCard from '../components/LessonCard.vue'
import MetricCard from '../components/MetricCard.vue'
import SectionHeader from '../components/SectionHeader.vue'
import SkillProgress from '../components/SkillProgress.vue'
import studentAvatar from '../assets/student-avatar.png'
import { useTrainingStore } from '../composables/useTrainingStore'
import { newStudents as mockNewStudents } from '../mock/trainingContent'
import { students } from '../mock/students'

defineProps<{
  role: 'student' | 'instructor'
}>()

type StudentCard = (typeof students)[number]

const { getStudentTrainingHistory, getStudentSkills } = useTrainingStore()

const student = students[0]
const selectedStudent = ref<StudentCard>(students[0])
const studentDialogOpen = ref(false)
const addStudentOpen = ref(false)
const newStudents = ref(mockNewStudents.map((item) => ({ ...item, status: 'new' })))
const manualStudents = ref<StudentCard[]>([])
const customSkill = ref('')
const note = ref(selectedStudent.value.notes || 'Закрепить взгляд в точку выхода и плавную работу сцеплением.')
const level = ref(selectedStudent.value.level)
const newStudentForm = ref({
  name: '',
  username: '',
  comment: '',
})

const allStudents = computed(() => [...students, ...manualStudents.value])
const activeStudents = computed(() => allStudents.value.length)

const studentTrainingHistory = computed(() => getStudentTrainingHistory(student.id))
const studentSkills = computed(() => getStudentSkills(student.id))

function openStudentCard(nextStudent: StudentCard) {
  selectedStudent.value = nextStudent
  level.value = nextStudent.level
  note.value = nextStudent.notes || ''
  studentDialogOpen.value = true
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
  })
  newStudentForm.value = { name: '', username: '', comment: '' }
  addStudentOpen.value = false
}

function addSkill() {
  const name = customSkill.value.trim()

  if (!name) {
    return
  }

  if (selectedStudent.value.skills) {
    selectedStudent.value.skills.push({
      id: Date.now(),
      name,
      value: 20,
      note: 'добавлено инструктором',
    })
  }
  customSkill.value = ''
}

function removeSkill(id: number) {
  if (selectedStudent.value.skills) {
    selectedStudent.value.skills = selectedStudent.value.skills.filter((skill) => skill.id !== id)
  }
}
</script>

<template>
  <section v-if="role === 'student'" class="stack">
    <Card class="hero-card profile">
      <template #content>
        <div class="student-top">
          <Avatar :image="studentAvatar" size="xlarge" shape="circle" />
          <div>
            <h1>{{ student.name }}</h1>
            <p>{{ student.focus }}</p>
          </div>
        </div>
      </template>
    </Card>

    <div class="metric-grid">
      <MetricCard label="Тренировок" :value="student.completedTrainingsCount" hint="в журнале" />
      <MetricCard label="Уровень" :value="student.level" hint="текущий" />
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

    <section>
      <SectionHeader title="Заметки инструктора" />
      <Card class="settings-card">
        <template #content>
          <div class="note-list">
            <div>
              <span>Что тренировать дальше</span>
              <strong>{{ student.notes || 'Информация будет после тренировки' }}</strong>
            </div>
          </div>
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
              <Avatar :image="student.avatar" shape="circle" />
              <div>
                <h3>{{ student.name }}</h3>
                <span>{{ student.level }} · {{ student.completedTrainingsCount }} тренировок</span>
              </div>
            </div>
          </template>
        </Card>
      </div>
    </section>

    <Dialog v-model:visible="addStudentOpen" modal header="Добавить ученика" class="moto-dialog">
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

    <Dialog v-model:visible="studentDialogOpen" modal header="Карточка ученика" class="moto-dialog">
      <div class="form-stack">
        <div class="student-top">
          <Avatar :image="selectedStudent.avatar" shape="circle" />
          <div>
            <h3>{{ selectedStudent.name }}</h3>
            <span>{{ selectedStudent.status }}</span>
          </div>
        </div>

        <label>
          Уровень
          <InputText v-model="level" />
        </label>
        <label>
          Заметка инструктора
          <Textarea v-model="note" rows="3" auto-resize />
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
        <div v-if="selectedStudent.skills && selectedStudent.skills.length > 0" class="skill-edit-list">
          <div v-for="skill in selectedStudent.skills" :key="skill.id" class="skill-edit-row">
            <span>{{ skill.name }}</span>
            <div>
              <Button icon="pi pi-trash" size="small" severity="secondary" @click="removeSkill(skill.id)" />
            </div>
          </div>
        </div>

        <label>
          Добавить навык
          <InputText v-model="customSkill" placeholder="например, маневрирование" />
        </label>
        <Button label="Добавить навык" icon="pi pi-plus" @click="addSkill" />
      </div>
    </Dialog>
  </section>
</template>
