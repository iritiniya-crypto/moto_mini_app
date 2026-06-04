import type {StudentLevel} from './student'
import type {ApiTrainingHistory, ApiTrainingReport} from './training'
import type {UserRole} from './user'

export type BookingSlotStatus = 'available' | 'requested' | 'reschedule' | 'confirmed' | 'completed' | 'cancelled'

export interface ApiBookingSlot {
  id: string
  startsAt: string
  endsAt: string
  status: BookingSlotStatus
  title: string
  location?: string
  notes?: string
  instructorId: string
  studentId?: string
  requestedById?: string
  requestedAt?: string
  confirmedAt?: string
  cancelledAt?: string
  cancellationReason?: string
  preference?: string
  studentComment?: string
  finalLocation?: string
  finalLocationUrl?: string
  instructorComment?: string
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
    role: UserRole
  }
  requestedBy?: {
    id: string
    displayName: string
    telegramUsername: string
    role: UserRole
  }
  report?: ApiTrainingReport | null
  trainingRecord?: ApiTrainingHistory | null
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
  status: BookingSlotStatus
}

export interface FindBookingSlotsQuery {
  status?: BookingSlotStatus
  studentId?: string
}

export interface CreateBookingSlotRequest {
  startsAt: string
  durationMinutes: number
}

export interface UpdateBookingSlotRequest {
  startsAt?: string
  durationMinutes?: number
  title?: string
  location?: string
  notes?: string
}

export interface RequestBookingSlotRequest {
  studentId: string
  preference?: string
  studentComment?: string
}

export interface ConfirmBookingSlotRequest {
  finalLocation?: string
  finalLocationUrl?: string
  instructorComment?: string
}

export interface RescheduleBookingSlotRequest {
  startsAt: string
  durationMinutes: number
  instructorComment?: string
}

export interface CancelBookingSlotRequest {
  reason?: string
}
