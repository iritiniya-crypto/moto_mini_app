import { postJson } from './client'
import {API_ENDPOINTS} from '../types/api'
import type { ApiRecord } from './normalizers'
import type {CreateTrainingVideoRequest} from '../types/training'

export async function createTrainingVideo(historyId: string, payload: CreateTrainingVideoRequest) {
  return postJson<ApiRecord, CreateTrainingVideoRequest>(API_ENDPOINTS.TRAINING_VIDEO(historyId), payload)
}
