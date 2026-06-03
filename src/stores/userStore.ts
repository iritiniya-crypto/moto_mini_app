import {defineStore} from 'pinia'
import {ref} from 'vue'
import {TEST_USER_ID} from '../api/client'
import {fetchHealth, type HealthResponse} from '../api/health'
import {fetchSkills, normalizeSkillDefinitions} from '../api/skills'
import {fetchStudentProfile, normalizeStudentProfile} from '../api/studentProfile'
import {fetchStudents, normalizeStudents} from '../api/students'
import type {Skill, Student} from '../mock/types'

export const useUserStore = defineStore('user', () => {
  const health = ref<HealthResponse | null>(null)
  const healthError = ref('')
  const profile = ref<Student | null>(null)
  const isProfileLoading = ref(false)
  const profileError = ref('')
  const students = ref<Student[]>([])
  const isStudentsLoading = ref(false)
  const studentsError = ref('')
  const skills = ref<Skill[]>([])
  const isSkillsLoading = ref(false)
  const skillsError = ref('')
  const usingFallback = ref(false)

  async function checkHealth() {
    healthError.value = ''

    try {
      health.value = await fetchHealth()
    } catch {
      health.value = null
      healthError.value = 'Backend health недоступен.'
    }
  }

  async function loadStudents(fallbackStudents: Student[] = []) {
    isStudentsLoading.value = true
    studentsError.value = ''

    try {
      const payload = await fetchStudents()
      students.value = normalizeStudents(payload, fallbackStudents)
    } catch {
      students.value = fallbackStudents
      studentsError.value = 'Backend недоступен, список учеников взят из локальных данных.'
    } finally {
      isStudentsLoading.value = false
    }
  }

  async function loadSkills() {
    isSkillsLoading.value = true
    skillsError.value = ''

    try {
      const payload = await fetchSkills()
      skills.value = normalizeSkillDefinitions(payload)
    } catch {
      skills.value = []
      skillsError.value = 'Backend skills недоступен.'
    } finally {
      isSkillsLoading.value = false
    }
  }

  async function loadProfile(studentId: string) {
    const controller = new AbortController()
    const timeout = window.setTimeout(() => controller.abort(), 6000)
    const apiStudentId = TEST_USER_ID || studentId

    isProfileLoading.value = true
    profileError.value = ''
    usingFallback.value = false

    try {
      const payload = await fetchStudentProfile(apiStudentId, controller.signal)
      profile.value = normalizeStudentProfile(payload)
    } catch {
      profileError.value = 'Backend недоступен, показываем локальные данные.'
      usingFallback.value = true
    } finally {
      window.clearTimeout(timeout)
      isProfileLoading.value = false
    }
  }

  return {
    checkHealth,
    health,
    healthError,
    isProfileLoading,
    isSkillsLoading,
    isStudentsLoading,
    loadSkills,
    loadProfile,
    loadStudents,
    profile,
    profileError,
    skills,
    skillsError,
    students,
    studentsError,
    usingFallback,
  }
})
