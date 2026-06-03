export type Skill = {
  id: number
  apiId?: string
  name: string
  oldValue: number
  newValue?: number
}

export type PaymentStatus = 'оплачено' | 'не оплачено' | 'частично оплачено'

export type TrainingPackage = {
  total: number
  completed: number
  paymentStatus: PaymentStatus
  startedAt?: string
  endedAt?: string
  isActive?: boolean
}

export type Student = {
  id: string
  apiId?: string
  name: string
  status: string
  level: string
  completedTrainingsCount: number
  nextLesson: string
  avatar: string
  focus: string
  skills?: Skill[]
  trainingHistory?: TrainingHistory[]
  telegramUsername?: string
  trainingPackage?: TrainingPackage
}

export interface TrainingHistory {
  id: number
  apiId?: string
  slotId?: number
  slotApiId?: string
  date: string
  duration: string
  location?: string
  theme: string
  topics: string[]
  comment: string
  mistakes: string[]
  improved: string
  hasVideo: boolean
  videoTitle?: string
  videoUrl?: string
  videoComment?: string
  nextFocus?: string
  skillUpdates?: Record<string, number>
}

export type Lesson = {
  id: number
  date: string
  duration: string
  theme: string
  topics: string[]
  comment: string
  mistakes: string[]
  improved: string
  hasVideo: boolean
}

export type Video = {
  id: number
  title: string
  date: string
  theme: string
  comment: string
  telegramUrl: string
}

export type TrainingReport = {
  id: number
  apiId?: string
  studentId: string
  slotId: number
  date: string
  duration: string
  location: string
  trainedSkills: string[]
  improved: string
  nextFocus: string
  skillUpdates: Record<string, string>
  levelUpdate?: string
  createdAt: number
}

export type AvailableSkill = {
  id: number
  name: string
}

export type BookingSlot = {
  id: number
  apiId?: string
  date: string
  time: string
  duration: string
  previousDate?: string
  previousTime?: string
  previousDuration?: string
  title?: string
  location?: string
  studentName?: string
  studentId?: string
  studentApiId?: string
  preference?: string
  studentComment?: string
  finalLocation?: string
  finalLocationUrl?: string
  instructorComment?: string
  status:
    | 'available'
    | 'requested'
    | 'reschedule'
    | 'confirmed'
    | 'completed'
    | 'cancelled'
}
