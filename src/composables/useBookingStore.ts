import {computed, ref} from 'vue'
import {
  cancelBookingSlot,
  confirmBookingSlot,
  createBookingSlot,
  declineBookingSlot,
  deleteBookingSlot,
  fetchAllBookingSlots,
  fetchInstructorCalendar,
  fetchStudentBookingSlots,
  normalizeBookingSlots,
  requestBookingSlot,
  rescheduleBookingSlot,
  slotPatchToPayload,
  slotToCreatePayload,
  updateBookingSlot,
} from '@/api/bookingSlots'
import {TEST_USER_ID} from '@/api/client'
import {type ApiRecord, normalizeBookingSlot} from '@/api/normalizers'
import type {BookingSlot} from '@/types/booking'

const slots = ref<BookingSlot[]>([])
const activeStudentSlotId = ref<number | null>(null)
const isBookingLoading = ref(false)
const bookingError = ref('')

function definedPatch<T extends object>(patch: T): Partial<T> {
  return Object.fromEntries(Object.entries(patch).filter(([, value]) => value !== undefined && value !== '')) as Partial<T>
}

function isApiRecord(value: unknown): value is ApiRecord {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function looksLikeSlot(value: unknown): value is ApiRecord {
  if (!isApiRecord(value)) {
    return false
  }

  return (
    value.id !== undefined &&
    (value.startsAt !== undefined ||
      value.starts_at !== undefined ||
      value.durationMinutes !== undefined ||
      value.duration_minutes !== undefined ||
      value.status !== undefined)
  )
}

function normalizeSlotsFromResponse(payload: unknown) {
  const candidates: ApiRecord[] = []
  const addCandidate = (value: unknown) => {
    if (Array.isArray(value)) {
      value.forEach(addCandidate)
      return
    }

    if (looksLikeSlot(value)) {
      candidates.push(value)
    }
  }

  addCandidate(payload)

  if (isApiRecord(payload)) {
    ;[
      'slot',
      'bookingSlot',
      'booking_slot',
      'oldSlot',
      'old_slot',
      'previousSlot',
      'previous_slot',
      'availableSlot',
      'available_slot',
      'newSlot',
      'new_slot',
      'targetSlot',
      'target_slot',
      'confirmedSlot',
      'confirmed_slot',
      'rescheduleSlot',
      'reschedule_slot',
      'slots',
      'bookingSlots',
      'booking_slots',
      'updatedSlots',
      'updated_slots',
    ].forEach((key) => addCandidate(payload[key]))
  }

  const seen = new Set<string>()

  return candidates
    .map((candidate, index) => normalizeBookingSlot(candidate, index))
    .filter((slot) => {
      const key = slot.apiId || String(slot.id)

      if (seen.has(key)) {
        return false
      }

      seen.add(key)
      return true
    })
}

export function useBookingStore() {
  const activeStudentSlot = computed(() => slots.value.find((slot) => slot.id === activeStudentSlotId.value))
  const bookingManagementSlots = computed(() =>
    slots.value.filter((slot) => slot.status === 'available' || slot.status === 'requested'),
  )

  const availableSlots = computed(() => slots.value.filter((slot) => slot.status === 'available'))

  const requestedSlots = computed(() => slots.value.filter((slot) => slot.status === 'requested'))

  const rescheduleSlots = computed(() => slots.value.filter((slot) => slot.status === 'reschedule'))

  const confirmedSlots = computed(() =>
    slots.value.filter((slot) => slot.status === 'confirmed'),
  )

  function getStudentActiveSlots(studentId: string) {
    return slots.value.filter(
      (slot) =>
        slot.studentId === studentId &&
        (slot.status === 'requested' || slot.status === 'reschedule' || slot.status === 'confirmed'),
    )
  }

  function upsertSlot(slot: BookingSlot) {
    const index = slots.value.findIndex((item) => item.id === slot.id)

    if (index >= 0) {
      slots.value[index] = { ...slots.value[index], ...slot }
      return slots.value[index]
    }

    slots.value.unshift(slot)
    return slot
  }

  function upsertSlotsFromResponse(payload: unknown, fallbackSlot?: BookingSlot) {
    const normalizedSlots = normalizeSlotsFromResponse(payload)

    if (normalizedSlots.length === 0) {
      return fallbackSlot ? upsertSlot(fallbackSlot) : undefined
    }

    const updated = normalizedSlots.map((slot) => {
      const currentSlot = slots.value.find((item) => item.id === slot.id || (slot.apiId && item.apiId === slot.apiId))
      const fallbackForSlot =
        fallbackSlot && (fallbackSlot.id === slot.id || (slot.apiId && fallbackSlot.apiId === slot.apiId))
          ? fallbackSlot
          : undefined
      const availablePatch =
        slot.status === 'available'
          ? {
              studentId: undefined,
              studentApiId: undefined,
              studentName: undefined,
              preference: undefined,
              studentComment: undefined,
              finalLocation: undefined,
              finalLocationUrl: undefined,
              instructorComment: undefined,
              previousDate: undefined,
              previousTime: undefined,
              previousDuration: undefined,
            }
          : {}

      return upsertSlot({
        ...slot,
        ...currentSlot,
        ...fallbackForSlot,
        ...availablePatch,
        ...definedPatch(slot),
        status: slot.status,
        id: slot.id,
        apiId: slot.apiId,
      })
    })

    return (
      updated.find((slot) => slot.status === 'confirmed') ||
      updated.find((slot) => slot.status === 'reschedule') ||
      updated[0]
    )
  }

  async function addSlot(slot: Omit<BookingSlot, 'id'>) {
    const fallbackSlot: BookingSlot = {
      id: Date.now(),
      ...slot,
    }

    try {
      const response = await createBookingSlot(slotToCreatePayload(fallbackSlot))
      return upsertSlot(normalizeBookingSlot(response))
    } catch {
      bookingError.value = 'Backend недоступен, слот не был добавлен.'
      return undefined
    }
  }

  async function updateSlot(id: number, patch: Partial<BookingSlot>) {
    const slot = slots.value.find((item) => item.id === id)

    if (!slot) {
      return undefined
    }

    const nextSlot = { ...slot, ...patch }

    try {
      if (!slot.apiId) {
        throw new Error('Slot has no backend id')
      }

      const response = await updateBookingSlot(slot.apiId, slotPatchToPayload(nextSlot))
      return upsertSlot({ ...nextSlot, ...definedPatch(normalizeBookingSlot(response)) })
    } catch {
      bookingError.value = slot.apiId ? 'Backend недоступен, слот не был обновлен.' : bookingError.value
      return undefined
    }
  }

  async function removeSlot(id: number) {
    const slot = slots.value.find((item) => item.id === id)

    try {
      if (!slot?.apiId) {
        throw new Error('Slot has no backend id')
      }
      await deleteBookingSlot(slot.apiId)
    } catch {
      bookingError.value = 'Не удалось удалить слот на backend.'
      return
    }

    slots.value = slots.value.filter((slot) => slot.id !== id)

    if (activeStudentSlotId.value === id) {
      activeStudentSlotId.value = null
    }
  }

  async function requestSlot(
    id: number,
    preference: string,
    studentComment: string,
    status: BookingSlot['status'] = 'requested',
    studentApiId?: string,
  ) {
    const slot = slots.value.find((item) => item.id === id)
    const patch: Partial<BookingSlot> = {
      preference,
      studentComment,
      status,
      finalLocation: undefined,
      finalLocationUrl: undefined,
      instructorComment: undefined,
    }

    try {
      if (!slot?.apiId) {
        throw new Error('Slot has no backend id')
      }

      const response = await requestBookingSlot(slot.apiId, {
        studentId: studentApiId || TEST_USER_ID,
        preference,
        studentComment,
      })
      upsertSlotsFromResponse(response, { ...slot, ...patch })
      activeStudentSlotId.value = id
    } catch {
      bookingError.value = slot?.apiId ? 'Backend недоступен, заявка не была сохранена.' : bookingError.value
    }
  }

  async function confirmSlot(
    id: number,
    finalLocation: string,
    finalLocationUrl: string | undefined,
    instructorComment: string,
  ) {
    const slot = slots.value.find((item) => item.id === id)
    const patch: Partial<BookingSlot> = {
      status: 'confirmed',
      finalLocation,
      finalLocationUrl,
      instructorComment,
    }

    try {
      if (!slot?.apiId) {
        throw new Error('Slot has no backend id')
      }

      const response = await confirmBookingSlot(slot.apiId, {
        finalLocation,
        finalLocationUrl,
        instructorComment,
      })
      return upsertSlotsFromResponse(response, { ...slot, ...patch })
    } catch {
      bookingError.value = slot?.apiId ? 'Backend недоступен, подтверждение не было сохранено.' : bookingError.value
      return undefined
    }
  }

  async function rescheduleSlot(
    id: number,
    targetSlot: BookingSlot,
    studentComment?: string,
  ) {
    bookingError.value = ''
    const slot = slots.value.find((item) => item.id === id)
    const patch: Partial<BookingSlot> = {
      date: targetSlot?.date,
      time: targetSlot?.time,
      duration: targetSlot?.duration,
      status: 'reschedule',
      previousDate: slot?.date,
      previousTime: slot?.time,
      previousDuration: slot?.duration,
      studentComment: studentComment || slot?.studentComment,
    }

    try {
      if (!slot?.apiId || !targetSlot?.apiId || targetSlot.status !== 'available') {
        throw new Error('Reschedule slots have no backend ids')
      }

      const response = await rescheduleBookingSlot(slot.apiId, {
        targetSlotId: targetSlot.apiId,
        ...slotToCreatePayload(targetSlot),
        studentComment,
      })
      return upsertSlotsFromResponse(response, { ...slot, ...patch })
    } catch {
      bookingError.value = slot?.apiId
        ? 'Не удалось перенести тренировку. Попробуйте еще раз.'
        : 'Не удалось определить выбранную тренировку.'
      return undefined
    }
  }

  function completeSlot(id: number) {
    const slot = slots.value.find((item) => item.id === id)

    if (slot) {
      Object.assign(slot, { status: 'completed' })
    }

    return slot
  }

  async function declineSlot(id: number) {
    const slot = slots.value.find((item) => item.id === id)

    try {
      if (!slot?.apiId) {
        throw new Error('Slot has no backend id')
      }

      const response = await declineBookingSlot(slot.apiId)
      return upsertSlotsFromResponse(response, { ...slot, status: 'cancelled' })
    } catch {
      bookingError.value = slot?.apiId ? 'Backend недоступен, отклонение не было сохранено.' : bookingError.value
      return undefined
    }
  }

  async function cancelSlot(id: number) {
    const slot = slots.value.find((item) => item.id === id)
    const patch: Partial<BookingSlot> = {
      status: 'available',
      studentId: undefined,
      studentApiId: undefined,
      studentName: undefined,
      preference: undefined,
      studentComment: undefined,
      finalLocation: undefined,
      finalLocationUrl: undefined,
      instructorComment: undefined,
      previousDate: undefined,
      previousTime: undefined,
      previousDuration: undefined,
    }

    try {
      if (!slot?.apiId) {
        throw new Error('Slot has no backend id')
      }

      const response = await cancelBookingSlot(slot.apiId)
      return upsertSlotsFromResponse(response, { ...slot, ...patch })
    } catch {
      bookingError.value = slot?.apiId ? 'Backend недоступен, отмена не была сохранена.' : bookingError.value
      return undefined
    }
  }

  async function loadAllBookingSlots() {
    isBookingLoading.value = true
    bookingError.value = ''

    try {
      const payload = await fetchAllBookingSlots()
      slots.value = normalizeBookingSlots(payload)
    } catch {
      bookingError.value = 'Backend booking-slots недоступен, данные не обновлены.'
    } finally {
      isBookingLoading.value = false
    }
  }

  async function loadStudentBookingSlots(userId: string) {
    isBookingLoading.value = true
    bookingError.value = ''

    try {
      const payload = await fetchStudentBookingSlots(userId)
      slots.value = normalizeBookingSlots(payload)
    } catch {
      bookingError.value = 'Backend booking-slots недоступен, данные не обновлены.'
    } finally {
      isBookingLoading.value = false
    }
  }

  async function loadInstructorCalendar() {
    isBookingLoading.value = true
    bookingError.value = ''

    try {
      const calendarPayload = await fetchInstructorCalendar()
      slots.value = normalizeBookingSlots(calendarPayload)
    } catch {
      bookingError.value = 'Backend calendar недоступен, данные не обновлены.'
    } finally {
      isBookingLoading.value = false
    }
  }

  return {
    activeStudentSlot,
    activeStudentSlotId,
    addSlot,
    availableSlots,
    bookingManagementSlots,
    cancelSlot,
    completeSlot,
    confirmSlot,
    declineSlot,
    getStudentActiveSlots,
    isBookingLoading,
    bookingError,
    loadAllBookingSlots,
    loadStudentBookingSlots,
    loadInstructorCalendar,
    removeSlot,
    requestSlot,
    requestedSlots,
    rescheduleSlot,
    rescheduleSlots,
    confirmedSlots,
    slots,
    updateSlot,
  }
}
