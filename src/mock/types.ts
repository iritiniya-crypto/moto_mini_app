export type Skill = {
  id: number
  name: string
  value: number
}

export type PaymentStatus = 'оплачено' | 'не оплачено' | 'частично оплачено'

export type TrainingPackage = {
  total: number
  completed: number
  paymentStatus: PaymentStatus
}

export type Student = {
  id: number
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

export type TrainingHistory = {
  id: number
  slotId?: number
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
  studentId: number
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
  date: string
  time: string
  duration: string
  studentId?: number
  preference?: string
  studentComment?: string
  finalLocation?: string
  finalLocationUrl?: string
  instructorComment?: string
  status:
    | 'available'
    | 'requested'
    | 'confirmed'
    | 'completed'
    | 'rescheduleRequested'
    | 'rescheduled'
    | 'cancelled'
    | 'unavailable'
}

export type ScheduleItem = {
  id: number
  time: string
  student: string
  theme: string
  status: string
}
