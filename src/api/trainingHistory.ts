import { postJson } from './client'
import { dateTimeToIso, normalizeHistoryItem, type ApiRecord } from './normalizers'
import type { TrainingHistory } from '../mock/types'

export type CreateManualTrainingHistoryPayload = {
  trainedAt?: string
  summary?: string
}

export async function createManualTrainingHistory(studentId: string, payload: CreateManualTrainingHistoryPayload) {
  return postJson<ApiRecord, CreateManualTrainingHistoryPayload>(`/students/${studentId}/training-history/manual`, payload)
}

export function manualTrainingToPayload(training: Pick<TrainingHistory, 'date' | 'topics' | 'improved' | 'nextFocus'>): CreateManualTrainingHistoryPayload {
  const summaryParts = [
    training.topics.length ? `Что тренировали: ${training.topics.join(', ')}` : '',
    training.improved ? `Что получилось: ${training.improved}` : '',
    training.nextFocus ? `На что обратить внимание: ${training.nextFocus}` : '',
  ].filter(Boolean)

  return {
    trainedAt: dateTimeToIso(training.date, '12:00'),
    summary: summaryParts.join('\n'),
  }
}

export { normalizeHistoryItem }
