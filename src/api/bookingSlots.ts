import {deleteJson, getJson, patchJson, postJson} from './client'
import {type ApiRecord, dateTimeToIso, durationMinutes, normalizeBookingSlot} from './normalizers'
import type {BookingSlot} from '../mock/types'

export type CreateBookingSlotPayload = {
  startsAt: string
  durationMinutes: number
}

export type UpdateBookingSlotPayload = {
  startsAt?: string
  durationMinutes?: number
  title?: string
  location?: string
  notes?: string
}

export type RequestBookingSlotPayload = {
  studentId: string
  preference?: string
  studentComment?: string
}

export type ConfirmBookingSlotPayload = {
  finalLocation?: string
  finalLocationUrl?: string
  instructorComment?: string
}

export type RescheduleBookingSlotPayload = {
  startsAt: string
  durationMinutes: number
}

export function slotToCreatePayload(slot: Pick<BookingSlot, 'date' | 'time' | 'duration'>): CreateBookingSlotPayload {
  return {
    startsAt: dateTimeToIso(slot.date, slot.time),
    durationMinutes: durationMinutes(slot.duration),
  }
}

export function slotPatchToPayload(slot: Partial<BookingSlot>): UpdateBookingSlotPayload {
  return {
    startsAt: slot.date && slot.time ? dateTimeToIso(slot.date, slot.time) : undefined,
    durationMinutes: slot.duration ? durationMinutes(slot.duration) : undefined,
    title: slot.title,
    location: slot.location,
    notes: slot.instructorComment,
  }
}

export async function fetchAllBookingSlots(signal?: AbortSignal) {
  return getJson<ApiRecord[]>('/booking-slots', signal)
}

export async function fetchStudentBookingSlots(userId: string, signal?: AbortSignal) {
  return getJson<ApiRecord[]>(`/booking-slots/${userId}`, signal)
}

export async function fetchInstructorCalendar(signal?: AbortSignal) {
  return getJson<ApiRecord[]>('/instructor/calendar', signal)
}

export async function createBookingSlot(payload: CreateBookingSlotPayload) {
  return postJson<ApiRecord, CreateBookingSlotPayload>('/booking-slots', payload)
}

export async function updateBookingSlot(slotId: string, payload: UpdateBookingSlotPayload) {
  return patchJson<ApiRecord, UpdateBookingSlotPayload>(`/booking-slots/${slotId}`, payload)
}

export async function deleteBookingSlot(slotId: string) {
  return deleteJson<{ deleted: boolean; id: string }>(`/booking-slots/${slotId}`)
}

export async function requestBookingSlot(slotId: string, payload: RequestBookingSlotPayload) {
  return postJson<ApiRecord, RequestBookingSlotPayload>(`/booking-slots/${slotId}/request`, payload)
}

export async function confirmBookingSlot(slotId: string, payload: ConfirmBookingSlotPayload) {
  return postJson<ApiRecord, ConfirmBookingSlotPayload>(`/booking-slots/${slotId}/confirm`, payload)
}

export async function rescheduleBookingSlot(slotId: string, payload: RescheduleBookingSlotPayload) {
  return postJson<ApiRecord, RescheduleBookingSlotPayload>(`/booking-slots/${slotId}/reschedule`, payload)
}

export async function cancelBookingSlot(slotId: string) {
  return postJson<ApiRecord, Record<string, never>>(`/booking-slots/${slotId}/cancel`, {})
}

export async function declineBookingSlot(slotId: string) {
  return postJson<ApiRecord, Record<string, never>>(`/booking-slots/${slotId}/decline`, {})
}

export function normalizeBookingSlots(payload: ApiRecord[]) {
  return payload.map((slot, index) => normalizeBookingSlot(slot, index))
}
