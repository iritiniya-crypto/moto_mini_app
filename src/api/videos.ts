import {postJson} from './client'
import type {CreateTrainingVideoRequest} from '@/types'
import {API_ENDPOINTS} from '@/types'
import type {ApiRecord} from './normalizers'

export async function createTrainingVideo(historyId: string, payload: CreateTrainingVideoRequest) {
  return postJson<ApiRecord, CreateTrainingVideoRequest>(API_ENDPOINTS.TRAINING_VIDEO(historyId), payload)
}
