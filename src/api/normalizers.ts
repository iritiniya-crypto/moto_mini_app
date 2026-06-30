import type {BookingSlot} from '@/types/booking'
import type {PaymentStatus, TrainingPackage, TrainingPackagePaymentStatus} from '@/types/package'
import type {Skill} from '@/types/skill'
import type {Student} from '@/types/student'
import type {TrainingHistory} from '@/types/training'

export type ApiRecord = Record<string, any>

const idMap = new Map<string, number>()

export function numericId(value: unknown, fallback: number) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value === 'string') {
    const numeric = Number(value)
    if (Number.isFinite(numeric)) {
      return numeric
    }

    if (!idMap.has(value)) {
      idMap.set(value, idMap.size + 1000)
    }

    return idMap.get(value)!
  }

  return fallback
}

export function pick<T = unknown>(source: ApiRecord | undefined, ...keys: string[]): T | undefined {
  if (!source) {
    return undefined
  }

  for (const key of keys) {
    if (source[key] !== undefined && source[key] !== null) {
      return source[key] as T
    }
  }

  return undefined
}

export function formatDate(value: unknown) {
  if (typeof value !== 'string' || !value) {
    return ''
  }

  if (!value.includes('T')) {
    return value
  }

  return new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long' }).format(new Date(value)).replace(' г.', '')
}

export function formatTime(value: unknown) {
  if (typeof value !== 'string' || !value) {
    return ''
  }

  if (!value.includes('T')) {
    return value
  }

  return new Intl.DateTimeFormat('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(value))
}

export function durationText(value: unknown, endsAt?: unknown, startsAt?: unknown) {
  if (typeof value === 'number') {
    return `${value} мин`
  }

  if (typeof value === 'string' && value) {
    return value
  }

  if (typeof endsAt === 'string' && typeof startsAt === 'string') {
    const diff = new Date(endsAt).getTime() - new Date(startsAt).getTime()
    if (Number.isFinite(diff) && diff > 0) {
      return `${Math.round(diff / 60000)} мин`
    }
  }

  return '90 мин'
}

export function paymentStatus(value: unknown): PaymentStatus {
  const map: Record<string, PaymentStatus> = {
    paid: 'оплачено',
    unpaid: 'не оплачено',
    partial: 'частично оплачено',
    оплачено: 'оплачено',
    'не оплачено': 'не оплачено',
    'частично оплачено': 'частично оплачено',
  }

  return map[String(value)] || 'не оплачено'
}

export function levelToApi(value: string) {
  const map: Record<string, string> = {
    Новичок: 'BEGINNER',
    База: 'BASIC',
    Средний: 'INTERMEDIATE',
    Профи: 'ADVANCED',
    BEGINNER: 'BEGINNER',
    BASIC: 'BASIC',
    INTERMEDIATE: 'INTERMEDIATE',
    ADVANCED: 'ADVANCED',
  }

  return map[value] || 'BEGINNER'
}

export function levelFromApi(value: unknown, fallback = 'Новичок') {
  const map: Record<string, string> = {
    BEGINNER: 'Новичок',
    BASIC: 'База',
    INTERMEDIATE: 'Средний',
    ADVANCED: 'Профи',
  }

  return map[String(value)] || String(value || fallback)
}

export function paymentStatusToApi(value: PaymentStatus): TrainingPackagePaymentStatus {
  const map: Record<PaymentStatus, TrainingPackagePaymentStatus> = {
    оплачено: 'paid',
    'не оплачено': 'unpaid',
    'частично оплачено': 'partial',
  }

  return map[value]
}

export function dateTimeToIso(date: string, time: string) {
  const monthMap: Record<string, number> = {
    января: 0,
    февраля: 1,
    марта: 2,
    апреля: 3,
    мая: 4,
    июня: 5,
    июля: 6,
    августа: 7,
    сентября: 8,
    октября: 9,
    ноября: 10,
    декабря: 11,
  }
  const [day, month] = date.split(' ')
  const [hours, minutes] = time.split(':').map(Number)

  return new Date(2026, monthMap[month] ?? new Date().getMonth(), Number(day) || 1, hours || 0, minutes || 0).toISOString()
}

export function durationMinutes(value: string) {
  return Number.parseInt(value, 10) || 90
}

export function normalizePackage(source: ApiRecord | undefined): TrainingPackage | undefined {
  if (!source) {
    return undefined
  }

  return {
    total: Number(pick(source, 'totalSessions', 'totalTrainings', 'total_trainings', 'total') ?? 0),
    completed: Number(pick(source, 'usedSessions', 'completedTrainings', 'completed_trainings', 'completed') ?? 0),
    paymentStatus: paymentStatus(pick(source, 'paymentStatus', 'payment_status')),
    startedAt: pick(source, 'startedAt', 'started_at'),
    endedAt: pick(source, 'endedAt', 'ended_at'),
    isActive: Boolean(pick(source, 'isActive', 'is_active') ?? true),
  }
}

export function normalizeSkills(source: unknown): Skill[] {
  if (!Array.isArray(source)) {
    return []
  }

  return source.map((item, index) => {
    const skill = pick<ApiRecord>(item, 'skill') ?? item

    return {
      id: numericId(pick(item, 'skillId', 'skill_id', 'id') ?? pick(skill, 'id'), index + 1),
      apiId: typeof (pick(item, 'skillId', 'skill_id') ?? pick(skill, 'id') ?? pick(item, 'id')) === 'string'
        ? (pick(item, 'skillId', 'skill_id') ?? pick(skill, 'id') ?? pick(item, 'id')) as string
        : undefined,
      name: String(pick(skill, 'name') ?? pick(item, 'name', 'skillName', 'skill_name') ?? 'Навык'),
      oldValue: Number(pick(item, 'percent', 'progressPercent', 'progress_percent', 'oldValue', 'value') ?? 0),
    }
  })
}

export function normalizeHistory(source: unknown): TrainingHistory[] {
  if (!Array.isArray(source)) {
    return []
  }

  return source.map((history, index) => {
    const report = pick<ApiRecord>(history, 'report')
    const slot = pick<ApiRecord>(history, 'bookingSlot', 'booking_slot')
    const videos = pick<ApiRecord[]>(history, 'videos') ?? []
    const video = videos[0]
    const trainedOn = pick<string>(report, 'trainedOn', 'trained_on') ?? ''
    const topics = pick<string[]>(history, 'trainedSkills', 'trained_skills', 'topics') ?? trainedOn.split(',').map((item) => item.trim()).filter(Boolean)

    return {
      id: numericId(pick(history, 'id'), index + 1),
      apiId: typeof pick(history, 'id') === 'string' ? pick(history, 'id') : undefined,
      slotId: numericId(pick(history, 'bookingSlotId', 'booking_slot_id', 'slotId', 'slot_id'), 0) || undefined,
      slotApiId: typeof pick(history, 'bookingSlotId', 'booking_slot_id', 'slotId', 'slot_id') === 'string'
        ? pick(history, 'bookingSlotId', 'booking_slot_id', 'slotId', 'slot_id')
        : undefined,
      date: formatDate(pick(history, 'trainedAt', 'trained_at', 'date') ?? pick(slot, 'startsAt', 'starts_at')),
      duration: durationText(
        pick(slot, 'durationMinutes', 'duration_minutes', 'duration'),
        pick(slot, 'endsAt', 'ends_at'),
        pick(slot, 'startsAt', 'starts_at'),
      ),
      location: pick(history, 'location') ?? pick(slot, 'finalLocation', 'final_location') ?? pick(slot, 'location'),
      locationUrl: pick(history, 'locationUrl', 'location_url') ?? pick(slot, 'finalLocationUrl', 'final_location_url', 'locationUrl', 'location_url'),
      theme: topics.join(', ') || String(pick(history, 'summary') ?? 'Тренировка'),
      topics,
      comment: String(pick(history, 'summary', 'comment') ?? ''),
      mistakes: [],
      improved: String(pick(report, 'successes') ?? pick(history, 'improved') ?? ''),
      hasVideo: Boolean(video),
      videoTitle: pick(video, 'title'),
      videoUrl: pick(video, 'telegramUrl', 'telegram_url'),
      videoComment: pick(video, 'notes', 'comment'),
      nextFocus: pick(report, 'focusNext', 'focus_next') ?? pick(history, 'nextFocus', 'next_focus'),
    }
  })
}

export function normalizeHistoryItem(source: ApiRecord, fallback?: Partial<TrainingHistory>): TrainingHistory {
  return normalizeHistory([source])[0] ?? {
    id: Date.now(),
    date: fallback?.date ?? '',
    duration: fallback?.duration ?? '90 мин',
    location: fallback?.location,
    theme: fallback?.theme ?? 'Тренировка',
    topics: fallback?.topics ?? [],
    comment: fallback?.comment ?? '',
    mistakes: fallback?.mistakes ?? [],
    improved: fallback?.improved ?? '',
    hasVideo: fallback?.hasVideo ?? false,
    nextFocus: fallback?.nextFocus,
  }
}

export function normalizeStudent(source: ApiRecord, fallback?: Student): Student {
  const activePackage = (pick<ApiRecord[]>(source, 'packages') ?? [])[0]
  const skills = normalizeSkills(pick(source, 'skills'))
  const history = normalizeHistory(pick(source, 'trainingHistory', 'training_history', 'history'))
  const instructor = pick<ApiRecord>(source, 'instructor')
  const backendHistoryCount = pick(
    source,
    'completedTrainingsCount',
    'completed_trainings_count',
    'historyCount',
    'history_count',
    'totalTrainings',
    'total_trainings',
  )
  const parsedHistoryCount = Number(backendHistoryCount)
  const completedTrainingsCount = backendHistoryCount !== undefined && Number.isFinite(parsedHistoryCount)
    ? parsedHistoryCount
    : history.length || fallback?.completedTrainingsCount || 0

  return {
    id: pick(source, 'id') || '',
    apiId: typeof pick(source, 'id') === 'string' ? pick(source, 'id') : fallback?.apiId,
    createdAt: pick(source, 'createdAt', 'created_at') ?? fallback?.createdAt,
    updatedAt: pick(source, 'updatedAt', 'updated_at') ?? fallback?.updatedAt,
    name: String(pick(source, 'name') ?? pick<ApiRecord>(source, 'user')?.displayName ?? fallback?.name ?? 'Ученик'),
    status: String(pick(source, 'status') ?? fallback?.status ?? 'активный'),
    level: levelFromApi(pick(source, 'level'), fallback?.level),
    completedTrainingsCount,
    nextLesson: fallback?.nextLesson ?? 'Время еще не выбрано',
    avatar: fallback?.avatar ?? '',
    focus: String(pick(source, 'nextTrainingPlan', 'next_training_plan', 'focus', 'notes') ?? fallback?.focus ?? ''),
    telegramUsername: pick(source, 'telegramUsername', 'telegram_username') ?? pick<ApiRecord>(source, 'user')?.telegramUsername ?? fallback?.telegramUsername,
    trainingPackage: normalizePackage(activePackage) ?? fallback?.trainingPackage,
    skills: skills.length > 0 ? skills : fallback?.skills,
    trainingHistory: history.length > 0 ? history : fallback?.trainingHistory,
    instructor: instructor
      ? {
          id: String(pick(instructor, 'id') ?? fallback?.instructor?.id ?? ''),
          firstName: String(pick(instructor, 'firstName', 'first_name') ?? fallback?.instructor?.firstName ?? ''),
          lastName: String(pick(instructor, 'lastName', 'last_name') ?? fallback?.instructor?.lastName ?? ''),
          telegramUsername: pick(instructor, 'telegramUsername', 'telegram_username') ?? fallback?.instructor?.telegramUsername,
          userId: String(pick(instructor, 'userId', 'user_id') ?? fallback?.instructor?.userId ?? ''),
          createdAt: pick(instructor, 'createdAt', 'created_at') ?? fallback?.instructor?.createdAt,
          updatedAt: pick(instructor, 'updatedAt', 'updated_at') ?? fallback?.instructor?.updatedAt,
        }
      : fallback?.instructor,
  }
}

export function normalizeBookingSlot(source: ApiRecord, index = 0): BookingSlot {
  const student = pick<ApiRecord>(source, 'student')
  const requestedBy = pick<ApiRecord>(source, 'requestedBy', 'requested_by')
  const rawStudentId = pick(source, 'studentId', 'student_id') as string ?? pick(student, 'id') as string
  const previousStartsAt = pick(source, 'previousStartsAt', 'previous_starts_at')
  const previousDuration = pick(source, 'previousDurationMinutes', 'previous_duration_minutes')

  return {
    id: numericId(pick(source, 'id'), index + 1),
    apiId: typeof pick(source, 'id') === 'string' ? pick(source, 'id') : undefined,
    date: formatDate(pick(source, 'startsAt', 'starts_at')),
    time: formatTime(pick(source, 'startsAt', 'starts_at')),
    duration: durationText(
      pick(source, 'durationMinutes', 'duration_minutes'),
      pick(source, 'endsAt', 'ends_at'),
      pick(source, 'startsAt', 'starts_at'),
    ),
    previousDate: previousStartsAt ? formatDate(previousStartsAt) : undefined,
    previousTime: previousStartsAt ? formatTime(previousStartsAt) : undefined,
    previousDuration: previousStartsAt ? durationText(previousDuration) : undefined,
    title: pick(source, 'title'),
    location: pick(source, 'location'),
    studentId: rawStudentId,
    studentApiId: typeof rawStudentId === 'string' ? rawStudentId : undefined,
    studentName: pick(student, 'name') ?? pick(requestedBy, 'displayName', 'display_name'),
    preference: pick(source, 'preference') ?? pick(source, 'title', 'location'),
    studentComment: pick(source, 'studentComment', 'student_comment', 'notes'),
    finalLocation: pick(source, 'finalLocation', 'final_location', 'location', 'title'),
    finalLocationUrl: pick(source, 'finalLocationUrl', 'final_location_url', 'locationUrl', 'location_url'),
    instructorComment: pick(source, 'notes'),
    status: pick(source, 'status') ?? 'available',
  }
}
