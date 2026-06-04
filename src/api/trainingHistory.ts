import {postJson} from './client'
import {type ApiRecord, dateTimeToIso, normalizeHistoryItem} from './normalizers'
import {API_ENDPOINTS} from '@/types/api'
import type {CreateManualTrainingHistoryRequest, TrainingHistory} from '@/types/training'

export async function createManualTrainingHistory(studentId: string, payload: CreateManualTrainingHistoryRequest) {
  return postJson<ApiRecord, CreateManualTrainingHistoryRequest>(API_ENDPOINTS.MANUAL_TRAINING_HISTORY(studentId), payload)
}

export function manualTrainingToPayload(training: Pick<TrainingHistory, 'date' | 'topics' | 'improved' | 'nextFocus'>): CreateManualTrainingHistoryRequest {
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
