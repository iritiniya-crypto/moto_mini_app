import type {BookingSlotStatus} from './booking'
import type {StudentLevel} from './student'

export interface ApiTrainingReport {
  id: string
  bookingSlotId: string
  studentId: string
  instructorId: string
  trainedOn: string
  successes: string
  focusNext: string
  levelChange: StudentLevel
  createdAt?: string
  updatedAt?: string
}

export interface TrainingVideo {
  id: string
  studentId: string
  trainingHistoryId: string
  reportId?: string
  telegramUrl: string
  title?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface ApiTrainingHistory {
  id: string
  studentId: string
  bookingSlotId?: string | null
  reportId?: string | null
  trainedAt: string
  summary: string
  location?: string
  locationUrl?: string
  videos: TrainingVideo[]
  report?: ApiTrainingReport | null
  bookingSlot?: {
    id: string
    status: BookingSlotStatus
    finalLocation?: string
    finalLocationUrl?: string
    location?: string
    locationUrl?: string
  } | null
}

export interface InstructorCalendarEvent {
  id: string
  startsAt: string
  endsAt: string
  status: BookingSlotStatus
  previousStartsAt?: string
  previousDurationMinutes?: number
  student?: {
    id: string
    name: string
    telegramUsername: string
    level: StudentLevel
  }
  instructor?: {
    id: string
    displayName: string
    telegramUsername: string
  }
  calendarEvents: unknown[]
  report?: ApiTrainingReport | null
}

export interface TrainingHistory {
  id: number
  apiId?: string
  slotId?: number
  slotApiId?: string
  date: string
  duration: string
  location?: string
  locationUrl?: string
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

export interface CreateTrainingReportRequest {
  slotId: string
  studentId: string
  trainedSkills: string[]
  improved: string
  nextFocus: string
  levelUpdate?: StudentLevel
}

export interface CreateTrainingVideoRequest {
  title?: string
  telegramUrl: string
  comment?: string
}

export interface CreateManualTrainingHistoryRequest {
  trainedAt?: string
  summary?: string
}

export interface CreateTrainingReportResponse {
  report: ApiTrainingReport
  trainingHistory: ApiTrainingHistory
  slot: {
    id: string
    status: BookingSlotStatus
  }
  student: {
    id: string
    level: StudentLevel
  }
}
