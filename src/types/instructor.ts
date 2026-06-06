export interface ApiInstructorStudentSummary {
  id: string
  name: string
  telegramUsername?: string
  level?: string
  createdAt?: string
  updatedAt?: string
}

export interface ApiInstructorProfile {
  id: string
  firstName: string
  lastName: string
  telegramUsername?: string
  userId?: string
  createdAt?: string
  updatedAt?: string
  students?: ApiInstructorStudentSummary[]
}

export interface InstructorProfile {
  id: string
  firstName: string
  lastName: string
  fullName: string
  telegramUsername?: string
  userId?: string
  createdAt?: string
  updatedAt?: string
  studentsCount: number
}

