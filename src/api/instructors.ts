import { getJson } from './client'
import { API_ENDPOINTS } from '@/types/api'
import type { ApiInstructorProfile, InstructorProfile } from '@/types/instructor'

export async function fetchInstructorProfile(instructorId: string, signal?: AbortSignal) {
  return getJson<ApiInstructorProfile>(API_ENDPOINTS.INSTRUCTOR_PROFILE(instructorId), signal)
}

export function normalizeInstructorProfile(payload: ApiInstructorProfile): InstructorProfile {
  const firstName = payload.firstName || ''
  const lastName = payload.lastName || ''
  const fullName = `${firstName} ${lastName}`.trim() || 'Инструктор'

  return {
    id: payload.id,
    firstName,
    lastName,
    fullName,
    telegramUsername: payload.telegramUsername,
    userId: payload.userId,
    createdAt: payload.createdAt,
    updatedAt: payload.updatedAt,
    studentsCount: payload.students?.length || 0,
  }
}

