import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useBookingStore } from './useBookingStore'

vi.mock('../api/client', () => ({
  TEST_USER_ID: '',
}))

vi.mock('../api/normalizers', () => ({
  normalizeBookingSlot: vi.fn((payload: any) => payload),
}))

vi.mock('../api/bookingSlots', () => ({
  cancelBookingSlot: vi.fn(),
  confirmBookingSlot: vi.fn(),
  createBookingSlot: vi.fn(),
  declineBookingSlot: vi.fn(),
  deleteBookingSlot: vi.fn(),
  fetchAllBookingSlots: vi.fn(),
  fetchInstructorCalendar: vi.fn(),
  fetchStudentBookingSlots: vi.fn(),
  normalizeBookingSlots: vi.fn((payload: any[]) => payload),
  requestBookingSlot: vi.fn(),
  rescheduleBookingSlot: vi.fn(),
  slotPatchToPayload: vi.fn((payload: any) => payload),
  slotToCreatePayload: vi.fn(() => ({
    startsAt: '2026-06-12T05:00:00.000Z',
    durationMinutes: 90,
  })),
  updateBookingSlot: vi.fn(),
}))

import {
  confirmBookingSlot,
  deleteBookingSlot,
  fetchAllBookingSlots,
  requestBookingSlot,
  rescheduleBookingSlot,
} from '../api/bookingSlots'

const baseSlot = {
  id: 101,
  apiId: 'slot-101',
  date: '10 июня',
  time: '10:00',
  duration: '90 мин',
  studentId: 'student-1',
  status: 'requested' as const,
}

describe('useBookingStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    const store = useBookingStore()
    store.slots.value = []
    store.activeStudentSlotId.value = null
    store.bookingError.value = ''
  })

  it('loads slots from backend payload', async () => {
    vi.mocked(fetchAllBookingSlots).mockResolvedValueOnce([{ ...baseSlot } as any])

    const store = useBookingStore()
    await store.loadAllBookingSlots()

    expect(store.slots.value).toHaveLength(1)
    expect(store.availableSlots.value).toHaveLength(0)
  })

  it('does not mutate slot when requestSlot fails', async () => {
    vi.mocked(requestBookingSlot).mockRejectedValueOnce(new Error('down'))

    const store = useBookingStore()
    store.slots.value = [{ ...baseSlot } as any]

    await store.requestSlot(101, 'Площадка', 'Комментарий', 'requested', 'student-1')

    expect(store.slots.value[0].studentId).toBe('student-1')
    expect(store.slots.value[0].status).toBe('requested')
    expect(store.activeStudentSlotId.value).toBeNull()
  })

  it('does not mutate slot when confirmSlot fails', async () => {
    vi.mocked(confirmBookingSlot).mockRejectedValueOnce(new Error('down'))

    const store = useBookingStore()
    store.slots.value = [{ ...baseSlot } as any]

    const result = await store.confirmSlot(101, 'Площадка', undefined, 'Комментарий')

    expect(result).toBeUndefined()
    expect(store.slots.value[0].status).toBe('requested')
  })

  it('reschedules to the selected available slot by backend id', async () => {
    const confirmedSlot = { ...baseSlot, status: 'confirmed' as const }
    const targetSlot = {
      id: 202,
      apiId: 'slot-202',
      date: '12 июня',
      time: '12:00',
      duration: '90 мин',
      status: 'available' as const,
    }
    vi.mocked(rescheduleBookingSlot).mockResolvedValueOnce({
      ...targetSlot,
      status: 'reschedule',
    } as any)

    const store = useBookingStore()
    store.slots.value = [confirmedSlot, targetSlot] as any

    await store.rescheduleSlot(confirmedSlot.id, targetSlot)

    expect(rescheduleBookingSlot).toHaveBeenCalledWith('slot-101', {
      targetSlotId: 'slot-202',
      startsAt: expect.any(String),
      durationMinutes: 90,
    })
  })

  it('does not remove slot when removeSlot backend call fails', async () => {
    vi.mocked(deleteBookingSlot).mockRejectedValueOnce(new Error('down'))

    const store = useBookingStore()
    store.slots.value = [{ ...baseSlot } as any]

    await store.removeSlot(101)

    expect(store.slots.value).toHaveLength(1)
    expect(store.bookingError.value).toContain('Не удалось удалить')
  })

  it('removes slot only after successful backend deletion', async () => {
    vi.mocked(deleteBookingSlot).mockResolvedValueOnce({ deleted: true, id: 'slot-101' } as any)

    const store = useBookingStore()
    store.slots.value = [{ ...baseSlot } as any]

    await store.removeSlot(101)

    expect(store.slots.value).toHaveLength(0)
  })
})
