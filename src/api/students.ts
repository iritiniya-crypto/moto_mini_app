import {getJson, patchJson, postJson} from './client'
import {type ApiRecord, levelToApi, normalizeStudent} from './normalizers'
import type {Student} from '../mock/types'

export type StudentPayload = {
  name: string
  telegramUsername?: string
  level?: string
  focus?: string
  nextTrainingPlan?: string
}

function toStudentDto(payload: StudentPayload | Partial<StudentPayload>) {
  return {
    ...payload,
    level: payload.level ? levelToApi(payload.level) : undefined,
  }
}

export async function fetchStudents(signal?: AbortSignal) {
  return getJson<ApiRecord[]>('/students', signal)
}

export async function createStudent(payload: StudentPayload) {
  return postJson<ApiRecord, ReturnType<typeof toStudentDto>>('/students', toStudentDto(payload))
}

export async function updateStudent(studentId: string, payload: Partial<StudentPayload>) {
  return patchJson<ApiRecord, ReturnType<typeof toStudentDto>>(`/students/${studentId}`, toStudentDto(payload))
}

export function normalizeStudents(payload: ApiRecord[], fallbacks: Student[] = []) {
  return payload.map((student, index) => normalizeStudent(student, fallbacks[index]))
}

export function normalizeStudentResponse(payload: ApiRecord, fallback?: Student) {
  return normalizeStudent(payload, fallback)
}
