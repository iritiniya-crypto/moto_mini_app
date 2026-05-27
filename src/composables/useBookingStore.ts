import { computed, ref } from 'vue'
import { bookingSlots } from '../mock/booking'
import type { BookingSlot } from '../mock/types'

const slots = ref<BookingSlot[]>(bookingSlots.map((slot) => ({ ...slot })))
const activeStudentSlotId = ref<number | null>(null)

export function useBookingStore() {
  const activeStudentSlot = computed(() => slots.value.find((slot) => slot.id === activeStudentSlotId.value))
  const requestedSlots = computed(() =>
    slots.value.filter((slot) => slot.status === 'requested' || slot.status === 'rescheduleRequested'),
  )

  const confirmedSlots = computed(() =>
    slots.value.filter((slot) => slot.status === 'confirmed'),
  )

  const completedSlots = computed(() =>
    slots.value.filter((slot) => slot.status === 'completed'),
  )

  function addSlot(slot: Omit<BookingSlot, 'id'>) {
    slots.value.unshift({
      id: Date.now(),
      ...slot,
    })
  }

  function updateSlot(id: number, patch: Partial<BookingSlot>) {
    const slot = slots.value.find((item) => item.id === id)

    if (slot) {
      Object.assign(slot, patch)
    }

    return slot
  }

  function removeSlot(id: number) {
    slots.value = slots.value.filter((slot) => slot.id !== id)

    if (activeStudentSlotId.value === id) {
      activeStudentSlotId.value = null
    }
  }

  function requestSlot(id: number, studentId: number, preference: string, studentComment: string, status: BookingSlot['status'] = 'requested') {
    updateSlot(id, {
      studentId,
      preference,
      studentComment,
      status,
      finalLocation: undefined,
      finalLocationUrl: undefined,
      instructorComment: undefined,
    })
    activeStudentSlotId.value = id
  }

  function confirmSlot(
    id: number,
    finalLocation: string,
    finalLocationUrl: string | undefined,
    instructorComment: string,
  ) {
    updateSlot(id, {
      status: 'confirmed',
      finalLocation,
      finalLocationUrl,
      instructorComment,
    })
  }

  function completeSlot(id: number) {
    return updateSlot(id, { status: 'completed' })
  }

  function declineSlot(id: number) {
    updateSlot(id, { status: 'cancelled' })
  }

  return {
    activeStudentSlot,
    activeStudentSlotId,
    addSlot,
    completeSlot,
    confirmSlot,
    declineSlot,
    removeSlot,
    requestSlot,
    requestedSlots,
    confirmedSlots,
    completedSlots,
    slots,
    updateSlot,
  }
}
