import {getJson, patchJson, postJson} from './client'
import {type ApiRecord, levelToApi, normalizeStudent} from './normalizers'
import {API_ENDPOINTS} from '@/types/api'
import type {CreateStudentRequest, Student, UpdateStudentRequest} from '@/types/student'

export type StudentPayload = {
  name: string
  telegramUsername?: string
  level?: string
  focus?: string
  nextTrainingPlan?: string
}

function toStudentDto(payload: StudentPayload | Partial<StudentPayload>): CreateStudentRequest | UpdateStudentRequest {
  return {
    ...payload,
    level: payload.level ? levelToApi(payload.level) as CreateStudentRequest['level'] : undefined,
  }
}

export async function fetchStudents(signal?: AbortSignal) {
  return getJson<ApiRecord[]>(API_ENDPOINTS.STUDENTS, signal)
}

export async function createStudent(payload: StudentPayload) {
  return postJson<ApiRecord, CreateStudentRequest>(API_ENDPOINTS.STUDENTS, toStudentDto(payload) as CreateStudentRequest)
}

export async function updateStudent(studentId: string, payload: Partial<StudentPayload>) {
  return patchJson<ApiRecord, UpdateStudentRequest>(API_ENDPOINTS.STUDENT_UPDATE(studentId), toStudentDto(payload))
}

export function normalizeStudents(payload: ApiRecord[], fallbacks: Student[] = []) {
  return payload.map((student, index) => normalizeStudent(student, fallbacks[index]))
}

export function normalizeStudentResponse(payload: ApiRecord, fallback?: Student) {
  return normalizeStudent(payload, fallback)
}
