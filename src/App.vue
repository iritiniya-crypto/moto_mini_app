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

// Helper to wait for Telegram WebApp to be ready
async function waitForTelegramWebApp(maxAttempts = 50, delayMs = 100): Promise<string> {
  for (let i = 0; i < maxAttempts; i++) {
    const initData = WebApp.initData
    if (initData) {
      return initData
    }
    // Wait a bit before trying again
    await new Promise(resolve => setTimeout(resolve, delayMs))
  }
  throw new Error('Telegram initData not available. Make sure app is opened from Telegram Mini App.')
}

function retryAuth() {
  window.location.reload()
}

onMounted(async () => {
  try {
    // Skip auth if already authenticated
    if (authStore.isAuthenticated) {
      isInitializing.value = false
      return
    }

    // Wait for Telegram WebApp to provide initData
    console.log('Waiting for Telegram WebApp initData...')
    const initData = await waitForTelegramWebApp()
    console.log('Telegram initData received, authenticating...')

    // Authenticate with Telegram
    await authStore.loginWithTelegram(initData)
    console.log('Authentication successful')
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Authentication failed'
    initError.value = message
    console.error('Auth initialization error:', message, error)
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
    <div>
      <p>Инициализация...</p>
      <small style="color: #666; margin-top: 10px;">Подключение к Telegram...</small>
    </div>
  </div>
  <div v-else-if="initError" class="error-container">
    <div>
      <p>❌ Ошибка авторизации:</p>
      <p style="margin-top: 10px; font-size: 14px;">{{ initError }}</p>
      <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;">
      <div style="font-size: 12px; color: #666; text-align: left;">
        <p><strong>Решение:</strong></p>
        <ul style="margin: 5px 0; padding-left: 20px;">
          <li>Убедитесь, что открываете приложение через Telegram Mini App</li>
          <li>Попробуйте закрыть и переоткрыть приложение</li>
          <li>Проверьте консоль браузера (F12) для деталей ошибки</li>
          <li>Убедитесь, что Telegram WebApp SDK загружен</li>
        </ul>
      </div>
      <button 
        type="button"
        @click="retryAuth"
        style="
          margin-top: 20px;
          padding: 10px 20px;
          background: #0088cc;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
        "
      >
        🔄 Попробовать снова
      </button>
    </div>
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
