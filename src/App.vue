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
import {storeToRefs} from "pinia";

const ROOT_IDS = import.meta.env.VITE_APP_ROOT_IDS
const NIKITA_TG_NAME = import.meta.env.VITE_APP_NIKITA_INSTRUCTOR_NAME

type Tab = 'home' | 'lessons' | 'videos' | 'profile'

// Declare Telegram WebApp type
declare global {
  interface Window {
    Telegram: {
      WebApp: {
        initData: string
        ready: () => void
        expand: () => void
        enableClosingConfirmation: () => void
      }
    }
  }
}

const authStore = useAuthStore()
const { activeRole } = storeToRefs(authStore)
const activeTab = ref<Tab>('home')
const isInitializing = ref(true)
const initError = ref<string | null>(null)
const initData = ref('')

// Helper to get Telegram WebApp
function getTelegramWebApp() {
  if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
    return window.Telegram.WebApp
  }
  return null
}

// Wait for Telegram to provide initData
async function getTelegramInitData(maxAttempts = 50, delayMs = 100): Promise<string> {
  for (let i = 0; i < maxAttempts; i++) {
    const webApp = getTelegramWebApp()
    if (webApp?.initData) {
      console.log('✅ Telegram initData received')
      return webApp.initData
    }
    if (i === 0) {
      console.log('⏳ Waiting for Telegram WebApp...')
    }
    await new Promise(resolve => setTimeout(resolve, delayMs))
  }
  throw new Error('Telegram initData not available. Make sure app is opened from Telegram Mini App.')
}

onMounted(async () => {
  try {
    // Skip auth if already authenticated
    // if (authStore.isAuthenticated) {
    //   console.log('✅ Already authenticated')
    //   isInitializing.value = false
    //   return
    // }

    if (import.meta.env.VITE_APP_DEV_MODE === 'true') {
      console.log('⚠️ Dev mode enabled, skipping Telegram auth')
      isInitializing.value = false
      return
    }

    // Get Telegram initData
    initData.value = await getTelegramInitData()
    console.log('🔐 Authenticating...')
    if (!initData) {
      throw new Error('Telegram initData is empty')
    }
    const initDataUser = authStore.parseInitData(initData.value)

     if (initDataUser.username === NIKITA_TG_NAME) {
       authStore.activeRole = 'instructor'
     }

     if (String(ROOT_IDS).split(',').includes(initDataUser.id.toString())) {
       authStore.activeRole = 'root'
     }

    // Authenticate with Telegram
    await authStore.loginWithTelegram(initData.value)
    console.log('✅ Authentication successful')
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Authentication failed'
    initError.value = message
    console.error('❌ Auth error:', message, error)
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

function retryAuth() {
  window.location.reload()
}
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
