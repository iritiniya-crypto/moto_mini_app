import {postJson} from './client'
import {levelToApi} from './normalizers'
import {API_ENDPOINTS} from '@/types/api'
import type {CreateTrainingReportRequest, CreateTrainingReportResponse} from '@/types/training'

export type CreateTrainingReportPayload = Omit<CreateTrainingReportRequest, 'levelUpdate'> & {
  levelUpdate?: string
}

export type TrainingReportResponse = CreateTrainingReportResponse

export async function createTrainingReportApi(payload: CreateTrainingReportPayload) {
  return postJson<TrainingReportResponse, CreateTrainingReportRequest>(API_ENDPOINTS.TRAINING_REPORTS, {
    ...payload,
    levelUpdate: payload.levelUpdate ? levelToApi(payload.levelUpdate) as CreateTrainingReportRequest['levelUpdate'] : undefined,
  })
}
