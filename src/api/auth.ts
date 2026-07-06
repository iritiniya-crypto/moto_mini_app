import { postJson } from './client'

export interface AuthResponse {
  token: string
  studentId: string
  user: {
    id: string
    telegramId: number
    telegramUsername?: string
    displayName: string
    avatar?: string
  }
  student: {
    id: string
    userId: string
    name: string
    level: string
    focus?: string
    nextTrainingPlan?: string
    notes?: string
    avatar?: string
    createdAt: string
    updatedAt: string
  }
}

export async function authenticateWithTelegram(initData: string): Promise<AuthResponse> {
  return postJson<AuthResponse>('/auth/telegram', { initData })
}
