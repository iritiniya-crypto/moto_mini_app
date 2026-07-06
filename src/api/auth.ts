import { postJson } from './client'
import type {Student} from "@/types";

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
  student: Student
}

export async function authenticateWithTelegram(initData: string): Promise<AuthResponse> {
  return postJson<AuthResponse>('/auth/telegram', { initData })
}
