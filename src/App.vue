<script lang="ts" setup>
import {computed, ref, watch, onMounted} from 'vue'
import AppShell from './layouts/AppShell.vue'
import BookingView from './views/instructor/BookingView.vue'
import InstructorDashboard from './views/instructor/InstructorDashboard.vue'
import MyTrainingsView from './views/student/MyTrainingsView.vue'
import StudentProfileView from './views/student/StudentProfileView.vue'
import StudentDashboard from './views/student/StudentDashboard.vue'
import VideosView from './views/VideosView.vue'
import InstructorProfileView from "./views/instructor/InstructorProfileView.vue";
import { useAuthStore } from './stores/authStore'
import WebApp from '@twa-dev/sdk'

type Role = 'student' | 'instructor'
type Tab = 'home' | 'lessons' | 'videos' | 'profile'

const authStore = useAuthStore()
const activeRole = ref<Role>('student')
const activeTab = ref<Tab>('home')
const isInitializing = ref(true)
const initError = ref<string | null>(null)

onMounted(async () => {
  try {
    // Skip auth if already authenticated
    if (authStore.isAuthenticated) {
      isInitializing.value = false
      return
    }

    // Get Telegram initData
    const initData = WebApp.initData
    if (!initData) {
      throw new Error('Telegram initData not available. Make sure app is opened from Telegram.')
    }

    // Authenticate with Telegram
    await authStore.loginWithTelegram(initData)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Authentication failed'
    initError.value = message
    console.error('Auth initialization error:', message)
  } finally {
    isInitializing.value = false
  }
})

watch(activeRole, (role) => {
  if (role === 'instructor' && activeTab.value === 'videos') {
    activeTab.value = 'home'
  }
})

const currentView = computed(() => {
  if (activeTab.value === 'home') {
    return activeRole.value === 'student' ? StudentDashboard : InstructorDashboard
  }

  if (activeTab.value === 'lessons') {
    return activeRole.value === 'student' ? MyTrainingsView : BookingView
  }

  if (activeTab.value === 'videos' && activeRole.value === 'student') {
    return VideosView
  }

  if (activeTab.value === 'profile' && activeRole.value === 'student') {
    return StudentProfileView
  }

  return InstructorProfileView
})
</script>

<template>
  <div v-if="isInitializing" class="loading-container">
    <p>Инициализация...</p>
  </div>
  <div v-else-if="initError" class="error-container">
    <p>Ошибка авторизации: {{ initError }}</p>
  </div>
  <AppShell v-else v-model:role="activeRole" v-model:tab="activeTab">
    <component :is="currentView" :role="activeRole" />
  </AppShell>
</template>

<style scoped>
.loading-container, .error-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 20px;
  text-align: center;
}

.error-container {
  color: var(--red-500, #ef4444);
}
</style>
