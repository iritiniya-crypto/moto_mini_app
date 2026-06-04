import {defineStore} from 'pinia'
import {ref} from 'vue'
import {fetchStudentPackage, normalizeTrainingPackage, packageToPayload, upsertStudentPackage} from '../api/packages'
import {fetchStudentSkills, normalizeSkillDefinitions, skillsToPayload, updateStudentSkillsApi} from '../api/skills'
import {
  createStudent,
  fetchStudents,
  normalizeStudentResponse,
  normalizeStudents,
  type StudentPayload,
  updateStudent,
} from '../api/students'
import type {Student} from '../types/student'

export const useStudentsStore = defineStore('students', () => {
  const students = ref<Student[]>([])
  const isLoading = ref(false)
  const isSaving = ref(false)
  const error = ref('')
  const usingFallback = ref(false)

  function replaceStudent(studentId: string, patch: Partial<Student>) {
    students.value = students.value.map((student) => (student.id === studentId ? { ...student, ...patch } : student))
  }

  async function loadStudents(fallbackStudents: Student[] = []) {
    isLoading.value = true
    error.value = ''

    try {
      const payload = await fetchStudents()
      students.value = normalizeStudents(payload, fallbackStudents)
      usingFallback.value = false
    } catch {
      students.value = fallbackStudents
      usingFallback.value = true
      error.value = 'Backend недоступен, показываем локальный список учеников.'
    } finally {
      isLoading.value = false
    }
  }

  async function createStudentRecord(payload: StudentPayload) {
    isSaving.value = true
    error.value = ''

    try {
      const response = await createStudent(payload)
      const createdStudent = normalizeStudentResponse(response)
      students.value = [...students.value, createdStudent]
      usingFallback.value = false
      return createdStudent
    } catch {
      usingFallback.value = true
      error.value = 'Backend недоступен, ученик добавлен только локально.'
    } finally {
      isSaving.value = false
    }
  }

  async function updateStudentRecord(student: Student, payload: Partial<StudentPayload>) {
    isSaving.value = true
    error.value = ''

    const nextLocalStudent = {
      ...student,
      name: payload.name ?? student.name,
      level: payload.level ?? student.level,
      focus: payload.nextTrainingPlan ?? payload.focus ?? student.focus,
      telegramUsername: payload.telegramUsername ?? student.telegramUsername,
    }

    try {
      if (!student.apiId) {
        throw new Error('Student has no backend id')
      }

      const response = await updateStudent(student.apiId, payload)
      const updatedStudent = normalizeStudentResponse(response, nextLocalStudent)
      students.value = students.value.map((item) => (item.id === student.id ? updatedStudent : item))
      usingFallback.value = false
      return updatedStudent
    } catch {
      students.value = students.value.map((item) => (item.id === student.id ? nextLocalStudent : item))
      usingFallback.value = true
      error.value = 'Backend недоступен, изменения сохранены только локально.'
      return nextLocalStudent
    } finally {
      isSaving.value = false
    }
  }

  async function loadStudentPackage(student: Student) {
    if (!student.apiId) {
      return student.trainingPackage
    }

    try {
      const payload = await fetchStudentPackage(student.apiId)
      const trainingPackage = payload ? normalizeTrainingPackage(payload) : undefined

      if (trainingPackage) {
        replaceStudent(student.id, { trainingPackage })
      }

      return trainingPackage
    } catch {
      usingFallback.value = true
      error.value = 'Backend package недоступен, показываем локальный пакет.'
      return student.trainingPackage
    }
  }

  async function saveStudentPackage(student: Student, trainingPackage: NonNullable<Student['trainingPackage']>) {
    try {
      if (!student.apiId) {
        throw new Error('Student has no backend id')
      }

      const response = await upsertStudentPackage(student.apiId, packageToPayload(trainingPackage))
      const savedPackage = normalizeTrainingPackage(response) ?? trainingPackage
      replaceStudent(student.id, { trainingPackage: savedPackage })
      usingFallback.value = false
      return savedPackage
    } catch {
      replaceStudent(student.id, { trainingPackage })
      usingFallback.value = true
      error.value = 'Backend package недоступен, пакет сохранен только локально.'
      return trainingPackage
    }
  }

  async function loadStudentSkills(student: Student) {
    if (!student.apiId) {
      return student.skills
    }

    try {
      const payload = await fetchStudentSkills(student.apiId)
      const skills = normalizeSkillDefinitions(payload)
      replaceStudent(student.id, { skills })
      return skills
    } catch {
      usingFallback.value = true
      error.value = 'Backend skills недоступен, показываем локальные навыки.'
      return student.skills
    }
  }

  async function saveStudentSkills(student: Student, skills: NonNullable<Student['skills']>) {
    try {
      const payload = skillsToPayload(skills)

      if (!student.apiId || payload.length === 0) {
        throw new Error('Student or skill has no backend id')
      }

      const response = await updateStudentSkillsApi(student.apiId, payload)
      const savedSkills = normalizeSkillDefinitions(response)
      replaceStudent(student.id, { skills: savedSkills })
      usingFallback.value = false
      return savedSkills
    } catch {
      replaceStudent(student.id, { skills })
      usingFallback.value = true
      error.value = 'Backend skills недоступен, навыки сохранены только локально.'
      return skills
    }
  }

  return {
    createStudentRecord,
    error,
    isLoading,
    isSaving,
    loadStudents,
    loadStudentPackage,
    loadStudentSkills,
    saveStudentPackage,
    saveStudentSkills,
    students,
    updateStudentRecord,
    usingFallback,
  }
})
