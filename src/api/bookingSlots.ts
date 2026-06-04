import {deleteJson, getJson, patchJson, postJson} from './client'
import {type ApiRecord, dateTimeToIso, durationMinutes, normalizeBookingSlot} from './normalizers'
import {API_ENDPOINTS, type DeleteResponse} from '../types/api'
import type {
  BookingSlot,
  ConfirmBookingSlotRequest,
  CreateBookingSlotRequest,
  FindBookingSlotsQuery,
  RequestBookingSlotRequest,
  RescheduleBookingSlotRequest,
  UpdateBookingSlotRequest,
} from '../types/booking'

function bookingSlotsPath(query: FindBookingSlotsQuery = {}) {
  const params = new URLSearchParams()

  if (query.status) {
    params.set('status', query.status)
  }

  if (query.studentId) {
    params.set('studentId', query.studentId)
  }

  const queryString = params.toString()
  return queryString ? `${API_ENDPOINTS.BOOKING_SLOTS}?${queryString}` : API_ENDPOINTS.BOOKING_SLOTS
}

export function slotToCreatePayload(slot: Pick<BookingSlot, 'date' | 'time' | 'duration'>): CreateBookingSlotRequest {
  return {
    startsAt: dateTimeToIso(slot.date, slot.time),
    durationMinutes: durationMinutes(slot.duration),
  }
}

export function slotPatchToPayload(slot: Partial<BookingSlot>): UpdateBookingSlotRequest {
  return {
    startsAt: slot.date && slot.time ? dateTimeToIso(slot.date, slot.time) : undefined,
    durationMinutes: slot.duration ? durationMinutes(slot.duration) : undefined,
    title: slot.title,
    location: slot.location,
    notes: slot.instructorComment,
  }
}

export async function fetchAllBookingSlots(signal?: AbortSignal) {
  return getJson<ApiRecord[]>(API_ENDPOINTS.BOOKING_SLOTS, signal)
}

export async function fetchStudentBookingSlots(userId: string, signal?: AbortSignal) {
  return getJson<ApiRecord[]>(bookingSlotsPath({ studentId: userId }), signal)
}

export async function fetchInstructorCalendar(signal?: AbortSignal) {
  return getJson<ApiRecord[]>(API_ENDPOINTS.INSTRUCTOR_CALENDAR, signal)
}

export async function createBookingSlot(payload: CreateBookingSlotRequest) {
  return postJson<ApiRecord, CreateBookingSlotRequest>(API_ENDPOINTS.BOOKING_SLOTS, payload)
}

export async function updateBookingSlot(slotId: string, payload: UpdateBookingSlotRequest) {
  return patchJson<ApiRecord, UpdateBookingSlotRequest>(API_ENDPOINTS.BOOKING_SLOT(slotId), payload)
}

export async function deleteBookingSlot(slotId: string) {
  return deleteJson<DeleteResponse>(API_ENDPOINTS.BOOKING_SLOT(slotId))
}

export async function requestBookingSlot(slotId: string, payload: RequestBookingSlotRequest) {
  return postJson<ApiRecord, RequestBookingSlotRequest>(API_ENDPOINTS.BOOKING_SLOT_REQUEST(slotId), payload)
}

export async function confirmBookingSlot(slotId: string, payload: ConfirmBookingSlotRequest) {
  return postJson<ApiRecord, ConfirmBookingSlotRequest>(API_ENDPOINTS.BOOKING_SLOT_CONFIRM(slotId), payload)
}

export async function rescheduleBookingSlot(slotId: string, payload: RescheduleBookingSlotRequest) {
  return postJson<ApiRecord, RescheduleBookingSlotRequest>(API_ENDPOINTS.BOOKING_SLOT_RESCHEDULE(slotId), payload)
}

export async function cancelBookingSlot(slotId: string) {
  return postJson<ApiRecord, Record<string, never>>(API_ENDPOINTS.BOOKING_SLOT_CANCEL(slotId), {})
}

export async function declineBookingSlot(slotId: string) {
  return postJson<ApiRecord, Record<string, never>>(API_ENDPOINTS.BOOKING_SLOT_DECLINE(slotId), {})
}

export function normalizeBookingSlots(payload: ApiRecord[]) {
  return payload.map((slot, index) => normalizeBookingSlot(slot, index))
}
