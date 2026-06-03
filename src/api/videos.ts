import { postJson } from './client'
import type { ApiRecord } from './normalizers'

export type CreateTrainingVideoPayload = {
  title?: string
  telegramUrl: string
  comment?: string
}

export async function createTrainingVideo(historyId: string, payload: CreateTrainingVideoPayload) {
  return postJson<ApiRecord, CreateTrainingVideoPayload>(`/training-history/${historyId}/videos`, payload)
}
