<script lang="ts" setup>
import {computed, onMounted, ref} from 'vue'
import {storeToRefs} from 'pinia'
import MetricCard from '@/components/MetricCard.vue'
import SectionHeader from '@/components/SectionHeader.vue'
import SkillProgress from '@/components/SkillProgress.vue'
import {useUserStore} from '@/stores/userStore.ts'
import type {PaymentStatus} from '@/types/package'
import type {TrainingHistory} from '@/types/training'

defineProps<{
  role: 'student' | 'instructor'
}>()

const userStore = useUserStore()
const {
  profile: apiProfile,
  isProfileLoading,
  profileError,
} = storeToRefs(userStore)

const studentProfile = computed(() => apiProfile.value)
const studentTrainingHistory = computed(() => studentProfile.value?.trainingHistory || [])
const studentSkills = computed(() => studentProfile.value?.skills || [])
const studentPackage = computed(
  () =>
    studentProfile.value?.trainingPackage || {
      total: 0,
      completed: 0,
      paymentStatus: 'не оплачено' as PaymentStatus,
    },
)
const studentPackageText = computed(() => `${studentPackage.value.completed} / ${studentPackage.value.total}`)
const selectedTrainingHistory = ref<TrainingHistory | null>(null)
const trainingDetailsOpen = ref(false)

function openTrainingDetails(history: TrainingHistory) {
  selectedTrainingHistory.value = history
  trainingDetailsOpen.value = true
}

async function loadStudentProfile() {
  await userStore.loadProfile(apiProfile.value?.apiId || '')
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
          <Avatar image="student-avatar.png" shape="circle" size="xlarge" style="width: 115px; height: 115px;"/>
          <div style="display: flex; flex-direction: column; align-items: flex-end">
            <h1>{{ studentProfile?.name }}</h1>
            <p>Уровень: {{ studentProfile?.level }}</p>
          </div>
        </div>
        <div class="student-instructor-info">
          <p>Инструктор: {{ studentProfile?.instructor?.firstName || 'Не назначен' }} {{ studentProfile?.instructor?.lastName || '' }}</p>
          <p>Телеграм: {{ studentProfile?.instructor?.telegramUsername ? `@${studentProfile.instructor.telegramUsername}` : 'Не указан' }}</p>
        </div>
        <p v-if="isProfileLoading" class="status-message">Загружаем профиль из backend...</p>
        <p v-else-if="profileError" class="status-message">{{ profileError }}</p>
      </template>
    </Card>

    <div class="metric-grid">
      <MetricCard :value="studentProfile?.completedTrainingsCount || 0" hint="в журнале" label="Тренировок" />
      <MetricCard :value="studentProfile?.level || 0" hint="текущий" label="Уровень" />
      <MetricCard :hint="studentPackage.paymentStatus" :value="studentPackageText" label="Пакет" />
    </div>

    <section>
      <SectionHeader title="История тренировок" />
      <div v-if="studentTrainingHistory.length > 0" class="training-select-list">
        <button
          v-for="history in studentTrainingHistory"
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
      <Card v-else class="settings-card">
        <template #content>
          <p class="text-gray-400">Тренировок еще нет</p>
        </template>
      </Card>
    </section>

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
