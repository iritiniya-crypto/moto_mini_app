import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authenticateWithTelegram, type AuthResponse } from '@/api/auth'
import { setAuthToken } from '@/api/client'

const STORAGE_KEY = 'auth_token'
const STUDENT_ID_KEY = 'student_id'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem(STORAGE_KEY))
  const studentId = ref<string | null>(localStorage.getItem(STUDENT_ID_KEY))
  const user = ref<AuthResponse['user'] | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const isAuthenticated = computed(() => !!token.value && !!studentId.value)

  function setToken(newToken: string) {
    token.value = newToken
    localStorage.setItem(STORAGE_KEY, newToken)
    setAuthToken(newToken)
  }

  function setStudentId(id: string) {
    studentId.value = id
    localStorage.setItem(STUDENT_ID_KEY, id)
  }

  function clearAuth() {
    token.value = null
    studentId.value = null
    user.value = null
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(STUDENT_ID_KEY)
    setAuthToken(null)
  }

  async function loginWithTelegram(initData: string) {
    isLoading.value = true
    error.value = null

    try {
      const response = await authenticateWithTelegram(initData)
      setToken(response.token)
      setStudentId(response.studentId)
      user.value = response.user
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Authentication failed'
      error.value = errorMessage
      clearAuth()
      throw e
    } finally {
      isLoading.value = false
    }
  }

  // Initialize token in API client on store creation
  if (token.value) {
    setAuthToken(token.value)
  }

  return {
    token,
    studentId,
    user,
    isLoading,
    error,
    isAuthenticated,
    setToken,
    setStudentId,
    clearAuth,
    loginWithTelegram
  }
})
