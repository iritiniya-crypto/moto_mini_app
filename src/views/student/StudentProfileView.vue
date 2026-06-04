<script lang="ts" setup>
import {computed, onMounted} from 'vue'
import {storeToRefs} from 'pinia'
import LessonCard from '@/components/LessonCard.vue'
import MetricCard from '@/components/MetricCard.vue'
import SectionHeader from '@/components/SectionHeader.vue'
import SkillProgress from '@/components/SkillProgress.vue'
import {useUserStore} from '@/stores/userStore.ts'
import {TEST_USER_ID} from '@/api/client.ts'
import type {PaymentStatus} from '@/types/package'
import type {Student} from '@/types/student'

defineProps<{
  role: 'student' | 'instructor'
}>()

const userStore = useUserStore()
const {
  profile: apiProfile,
  isProfileLoading,
  profileError,
} = storeToRefs(userStore)

const fallbackStudent: Student = {
  id: TEST_USER_ID,
  name: 'Ученик',
  status: 'активный',
  level: 'Новичок',
  completedTrainingsCount: 0,
  nextLesson: 'Время еще не выбрано',
  avatar: '',
  focus: '',
  skills: [],
  trainingHistory: [],
}

const studentProfile = computed(() => apiProfile.value || fallbackStudent)
const studentTrainingHistory = computed(() => studentProfile.value.trainingHistory || [])
const studentSkills = computed(() => studentProfile.value.skills || [])
const studentPackage = computed(
  () =>
    studentProfile.value.trainingPackage || {
      total: 0,
      completed: 0,
      paymentStatus: 'не оплачено' as PaymentStatus,
    },
)
const studentPackageText = computed(() => `${studentPackage.value.completed} / ${studentPackage.value.total}`)
async function loadStudentProfile() {
  await userStore.loadProfile(TEST_USER_ID)
}

onMounted(() => {
  userStore.checkHealth()
  userStore.loadSkills()
  loadStudentProfile()
})
</script>

<template>
  <section class="stack">
    <Card class="hero-card profile">
      <template #content>
        <div class="student-top">
          <Avatar image="student-avatar.png" shape="circle" size="xlarge" />
          <div>
            <h1>{{ studentProfile.name }}</h1>
            <p>{{ studentProfile.level }}</p>
          </div>
        </div>
        <p v-if="isProfileLoading" class="status-message">Загружаем профиль из backend...</p>
        <p v-else-if="profileError" class="status-message">{{ profileError }}</p>
      </template>
    </Card>

    <div class="metric-grid">
      <MetricCard :value="studentProfile.completedTrainingsCount" hint="в журнале" label="Тренировок" />
      <MetricCard :value="studentProfile.level" hint="текущий" label="Уровень" />
      <MetricCard :hint="studentPackage.paymentStatus" :value="studentPackageText" label="Пакет" />
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
</template>
