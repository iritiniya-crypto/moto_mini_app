import {getJson} from './client'
import {type ApiRecord, normalizeStudent} from './normalizers'
import {API_ENDPOINTS} from '../types/api'
import type {Student} from '../types/student'

export async function fetchStudentProfile(studentId: string | number, signal?: AbortSignal) {
  return getJson<ApiRecord>(API_ENDPOINTS.STUDENT_PROFILE(String(studentId)), signal)
}

export function normalizeStudentProfile(payload: ApiRecord): Student {
  return normalizeStudent(payload)
}
