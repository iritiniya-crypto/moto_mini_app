import {defineStore} from 'pinia'
import {ref} from 'vue'
import {TEST_INSTRUCTOR_ID, TEST_USER_ID} from '@/api/client'
import {fetchHealth, type HealthResponse} from '@/api/health'
import {fetchInstructorProfile, normalizeInstructorProfile} from '@/api/instructors'
import {fetchSkills, normalizeSkillDefinitions} from '@/api/skills'
import {fetchStudentProfile, normalizeStudentProfile} from '@/api/studentProfile'
import {fetchStudents, normalizeStudents} from '@/api/students'
import type {InstructorProfile, Skill, Student} from '@/types'

export const useUserStore = defineStore('user', () => {
  const health = ref<HealthResponse | null>(null)
  const healthError = ref('')
  const profile = ref<Student | null>(null)
  const instructorProfile = ref<InstructorProfile | null>(null)
  const isInstructorProfileLoading = ref(false)
  const instructorProfileError = ref('')
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

  async function loadStudents() {
    isStudentsLoading.value = true
    studentsError.value = ''

    try {
      const payload = await fetchStudents()
      students.value = normalizeStudents(payload)
    } catch {
      students.value = []
      studentsError.value = 'Backend недоступен, список учеников не загружен.'
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
      profile.value = null
      profileError.value = 'Backend недоступен, профиль не загружен.'
      usingFallback.value = true
    } finally {
      window.clearTimeout(timeout)
      isProfileLoading.value = false
    }
  }

  async function loadInstructorProfile(instructorId: string) {
    const controller = new AbortController()
    const timeout = window.setTimeout(() => controller.abort(), 6000)
    const apiInstructorId = TEST_INSTRUCTOR_ID || instructorId

    isInstructorProfileLoading.value = true
    instructorProfileError.value = ''

    try {
      const payload = await fetchInstructorProfile(apiInstructorId, controller.signal)
      instructorProfile.value = normalizeInstructorProfile(payload)
    } catch {
      instructorProfile.value = null
      instructorProfileError.value = 'Backend недоступен, профиль инструктора не загружен.'
    } finally {
      window.clearTimeout(timeout)
      isInstructorProfileLoading.value = false
    }
  }

  return {
    checkHealth,
    health,
    healthError,
    instructorProfile,
    instructorProfileError,
    isInstructorProfileLoading,
    isProfileLoading,
    isSkillsLoading,
    isStudentsLoading,
    loadInstructorProfile,
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
