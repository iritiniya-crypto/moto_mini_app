import type {BookingSlotStatus} from './booking'
import type {StudentLevel} from './student'
import type {TrainingPackagePaymentStatus} from './package'

export interface TGInitData {
    query_id: string
    user: {
        id: number
        first_name: string
        last_name?: string
        username?: string
        language_code?: string
    }
    auth_date: number
    hash: string
}

export interface ApiHealthResponse {
  status: 'ok'
  service: string
}

export interface DeleteResponse {
  deleted: boolean
  id: string
}

export const BOOKING_SLOT_STATUSES: BookingSlotStatus[] = [
  'available',
  'requested',
  'reschedule',
  'confirmed',
  'completed',
  'cancelled',
]

export const STUDENT_LEVELS: StudentLevel[] = ['BEGINNER', 'BASIC', 'INTERMEDIATE', 'ADVANCED']

export const PAYMENT_STATUSES: TrainingPackagePaymentStatus[] = ['unpaid', 'paid', 'partial']

export const SEED_SKILLS = [
  'Овал',
  'Восьмерка',
  'Змейка',
  'Торможение',
  'Развороты',
  'Медленная езда',
  'Взгляд',
  'Город',
] as const

export const VALIDATION_RULES = {
  STUDENT_NAME_MAX_LENGTH: 120,
  TELEGRAM_USERNAME_MAX_LENGTH: 120,
  BOOKING_SLOT_DURATION_MIN: 15,
  BOOKING_SLOT_DURATION_MAX: 600,
  TRAINING_PACKAGE_TOTAL_MAX: 1000,
  TRAINING_PACKAGE_COMPLETED_MAX: 1000,
  SKILL_PROGRESS_MIN: 0,
  SKILL_PROGRESS_MAX: 100,
} as const

export const API_ENDPOINTS = {
  HEALTH: '/health',
  STUDENTS: '/students',
  STUDENT_PROFILE: (id: string) => `/students/${id}/profile`,
  INSTRUCTOR_PROFILE: (id: string) => `/instructors/${id}/profile`,
  STUDENT_UPDATE: (id: string) => `/students/${id}`,
  STUDENT_PACKAGE: (studentId: string) => `/students/${studentId}/package`,
  STUDENT_SKILLS: (studentId: string) => `/students/${studentId}/skills`,
  MANUAL_TRAINING_HISTORY: (studentId: string) => `/students/${studentId}/training-history/manual`,
  SKILLS: '/skills',
  BOOKING_SLOTS: '/booking-slots',
  BOOKING_SLOT: (id: string) => `/booking-slots/${id}`,
  BOOKING_SLOT_REQUEST: (id: string) => `/booking-slots/${id}/request`,
  BOOKING_SLOT_CONFIRM: (id: string) => `/booking-slots/${id}/confirm`,
  BOOKING_SLOT_RESCHEDULE: (id: string) => `/booking-slots/${id}/reschedule`,
  BOOKING_SLOT_DECLINE: (id: string) => `/booking-slots/${id}/decline`,
  BOOKING_SLOT_CANCEL: (id: string) => `/booking-slots/${id}/cancel`,
  INSTRUCTOR_CALENDAR: '/instructor/calendar',
  TRAINING_REPORTS: '/training-reports',
  TRAINING_VIDEO: (historyId: string) => `/training-history/${historyId}/videos`,
} as const

export function canCancelBookingSlot(status: BookingSlotStatus): boolean {
  return ['requested', 'reschedule', 'confirmed'].includes(status)
}

export function canEditBookingSlot(status: BookingSlotStatus): boolean {
  return status === 'available'
}

export function canRequestBookingSlot(status: BookingSlotStatus): boolean {
  return status === 'available'
}

export function canConfirmBookingSlot(status: BookingSlotStatus): boolean {
  return ['requested', 'reschedule'].includes(status)
}

export function canRescheduleBookingSlot(status: BookingSlotStatus): boolean {
  return status === 'confirmed'
}

export function getRemainingTrainings(pkg: { totalTrainings: number; completedTrainings: number }): number {
  return pkg.totalTrainings - pkg.completedTrainings
}

export function getPackageUsagePercent(pkg: { totalTrainings: number; completedTrainings: number }): number {
  if (pkg.totalTrainings === 0) {
    return 0
  }

  return Math.round((pkg.completedTrainings / pkg.totalTrainings) * 100)
}

export function skillsArrayToString(skills: string[]): string {
  return skills.join(', ')
}

export function skillsStringToArray(skillsStr: string): string[] {
  return skillsStr.split(',').map((skill) => skill.trim())
}
