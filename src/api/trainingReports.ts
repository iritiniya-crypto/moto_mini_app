import { postJson } from './client'
import { levelToApi, type ApiRecord } from './normalizers'

export type CreateTrainingReportPayload = {
  slotId: string
  studentId: string
  trainedSkills: string[]
  improved: string
  nextFocus: string
  levelUpdate?: string
}

export type TrainingReportResponse = {
  report: ApiRecord
  trainingHistory: ApiRecord
  slot: ApiRecord
  student: ApiRecord
}

export async function createTrainingReportApi(payload: CreateTrainingReportPayload) {
  return postJson<TrainingReportResponse, CreateTrainingReportPayload>('/training-reports', {
    ...payload,
    levelUpdate: payload.levelUpdate ? levelToApi(payload.levelUpdate) : undefined,
  })
}
