import {getJson, putJson} from './client'
import {type ApiRecord, normalizePackage, paymentStatusToApi} from './normalizers'
import {API_ENDPOINTS} from '@/types/api'
import type {TrainingPackage, UpsertTrainingPackageRequest} from '@/types/package'

export async function fetchStudentPackage(studentId: string, signal?: AbortSignal) {
  return getJson<ApiRecord>(API_ENDPOINTS.STUDENT_PACKAGE(studentId), signal)
}

export async function upsertStudentPackage(studentId: string, payload: UpsertTrainingPackageRequest) {
  return putJson<ApiRecord, UpsertTrainingPackageRequest>(API_ENDPOINTS.STUDENT_PACKAGE(studentId), payload)
}

export function packageToPayload(trainingPackage: TrainingPackage): UpsertTrainingPackageRequest {
  return {
    name: trainingPackage.name,
    totalTrainings: trainingPackage.total,
    completedTrainings: trainingPackage.completed,
    paymentStatus: paymentStatusToApi(trainingPackage.paymentStatus),
    startedAt: trainingPackage.startedAt,
    endedAt: trainingPackage.endedAt,
    isActive: trainingPackage.isActive ?? trainingPackage.total > 0,
  }
}

export function normalizeTrainingPackage(payload: ApiRecord) {
  return normalizePackage(payload)
}
