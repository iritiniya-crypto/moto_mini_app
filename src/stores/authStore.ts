import {defineStore} from 'pinia'
import {computed, ref} from 'vue'
import {authenticateWithTelegram, type AuthResponse} from '@/api/auth'
import {setAuthToken} from '@/api/client'
import {useUserStore} from "@/stores/userStore.ts";
import {normalizeStudent} from "@/api/normalizers.ts";
import type {TelegramUser} from "@/types";

const STORAGE_KEY = 'auth_token'
const STUDENT_ID_KEY = 'student_id'
const AVATAR_KEY = 'student_avatar'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem(STORAGE_KEY))
  const studentId = ref<string | null>(localStorage.getItem(STUDENT_ID_KEY))
  const avatar = ref<string | null>(localStorage.getItem(AVATAR_KEY))
  const user = ref<AuthResponse['user'] | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const activeRole = ref<'student' | 'instructor' | 'root'>('student')
  const isInstructor = computed(() => activeRole.value === 'instructor')
  const isRoot = ref(false)

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

  function setAvatar(avatarUrl: string | null | undefined) {
    avatar.value = avatarUrl || null
    if (avatarUrl) {
      localStorage.setItem(AVATAR_KEY, avatarUrl)
    } else {
      localStorage.removeItem(AVATAR_KEY)
    }
  }

  function clearAuth() {
    token.value = null
    studentId.value = null
    avatar.value = null
    user.value = null
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(STUDENT_ID_KEY)
    localStorage.removeItem(AVATAR_KEY)
    setAuthToken(null)
  }

  function parseInitData(initData: string): TelegramUser {
    // Parse init data (format: key=value&key=value&...)
    const params = new URLSearchParams(initData);
    const userStr = params.get('user') as string;

    return JSON.parse(userStr) as TelegramUser;
  }

  async function loginWithTelegram(initData: string) {
    isLoading.value = true
    error.value = null

    try {
      const response = await authenticateWithTelegram(initData)
      setToken(response.token)
      setStudentId(response.studentId)
      setAvatar(response.user.avatar)
      user.value = response.user

      const userStore = useUserStore()
      userStore.profile = normalizeStudent(response.student)

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
    avatar,
    user,
    isLoading,
    error,
    isAuthenticated,
    isInstructor,
    isRoot,
    setToken,
    setStudentId,
    setAvatar,
    clearAuth,
    loginWithTelegram,
    parseInitData,
    activeRole,
  }
})
