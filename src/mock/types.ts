export type Skill = {
  id: number
  name: string
  value: number
  note: string
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
  notes?: string
  telegramUsername?: string
}

export type TrainingHistory = {
  id: number
  date: string
  duration: string
  theme: string
  topics: string[]
  comment: string
  mistakes: string[]
  improved: string
  hasVideo: boolean
  instructorComment?: string
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
  instructorComment: string
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
