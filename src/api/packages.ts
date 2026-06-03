import { getJson, putJson } from './client'
import { normalizePackage, paymentStatusToApi, type ApiRecord } from './normalizers'
import type { TrainingPackage } from '../mock/types'

export type UpsertTrainingPackagePayload = {
  totalTrainings: number
  completedTrainings: number
  paymentStatus: string
  startedAt?: string
  endedAt?: string
  isActive: boolean
}

export async function fetchStudentPackage(studentId: string, signal?: AbortSignal) {
  return getJson<ApiRecord>(`/students/${studentId}/package`, signal)
}

export async function upsertStudentPackage(studentId: string, payload: UpsertTrainingPackagePayload) {
  return putJson<ApiRecord, UpsertTrainingPackagePayload>(`/students/${studentId}/package`, payload)
}

export function packageToPayload(trainingPackage: TrainingPackage): UpsertTrainingPackagePayload {
  return {
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
