import { postJson } from './client'

export interface AuthResponse {
  token: string
  studentId: string
  user: {
    id: string
    telegramId: number
    telegramUsername?: string
    displayName: string
  }
}

export async function authenticateWithTelegram(initData: string): Promise<AuthResponse> {
  return postJson<AuthResponse>('/auth/telegram', { initData })
}
