import { getJson } from './client'
import { normalizeStudent, type ApiRecord } from './normalizers'
import type { Student } from '../mock/types'

export async function fetchStudentProfile(studentId: string | number, signal?: AbortSignal) {
  return getJson<ApiRecord>(`/students/${studentId}/profile`, signal)
}

export function normalizeStudentProfile(payload: ApiRecord, fallback: Student): Student {
  return normalizeStudent(payload, fallback)
}
