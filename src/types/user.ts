export type UserRole = 'STUDENT' | 'INSTRUCTOR'

export interface User {
  id: string
  telegramId?: string
  telegramUsername: string
  displayName: string
  role: UserRole
  createdAt?: string
  updatedAt?: string
}
