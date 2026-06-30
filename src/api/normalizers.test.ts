import { describe, expect, it } from 'vitest'
import {
  dateTimeToIso,
  formatDate,
  formatTime,
  levelFromApi,
  levelToApi,
  normalizeBookingSlot,
  normalizeStudent,
  numericId,
  paymentStatus,
} from './normalizers'

describe('normalizers', () => {
  it('numericId maps stable values for string ids', () => {
    const first = numericId('slot-1', 1)
    const second = numericId('slot-1', 2)

    expect(first).toBe(second)
    expect(first).toBeGreaterThanOrEqual(1000)
  })

  it('formats date and time from ISO strings', () => {
    const iso = '2026-06-10T14:30:00.000Z'

    expect(formatDate(iso)).toContain('июня')
    expect(formatTime(iso)).toMatch(/\d{2}:\d{2}/)
  })

  it('maps level values between API and UI labels', () => {
    expect(levelToApi('Профи')).toBe('ADVANCED')
    expect(levelFromApi('INTERMEDIATE')).toBe('Средний')
  })

  it('maps payment statuses from API values', () => {
    expect(paymentStatus('paid')).toBe('оплачено')
    expect(paymentStatus('partial')).toBe('частично оплачено')
  })

  it('builds iso datetime from russian date and time strings', () => {
    const iso = dateTimeToIso('12 июня', '10:45')

    expect(iso).toContain('2026-06')
    expect(iso).toContain('T')
  })

  it('normalizes booking slot fields', () => {
    const slot = normalizeBookingSlot(
      {
        id: 'slot-api-id',
        startsAt: '2026-06-10T10:00:00.000Z',
        endsAt: '2026-06-10T11:30:00.000Z',
        status: 'confirmed',
        student: { name: 'Иван' },
        studentId: 'student-api-id',
        finalLocation: 'Площадка',
      },
      0,
    )

    expect(slot.apiId).toBe('slot-api-id')
    expect(slot.status).toBe('confirmed')
    expect(slot.studentName).toBe('Иван')
    expect(slot.studentApiId).toBe('student-api-id')
    expect(slot.finalLocation).toBe('Площадка')
  })

  it('calculates booking slot duration from startsAt and endsAt', () => {
    const slot = normalizeBookingSlot(
      {
        id: 'slot-api-id',
        startsAt: '2026-07-07T10:00:00.000Z',
        endsAt: '2026-07-07T11:00:00.000Z',
        status: 'available',
      },
      0,
    )

    expect(slot.duration).toBe('60 мин')
  })

  it('normalizes student profile core fields', () => {
    const student = normalizeStudent({
      id: 'student-api-id',
      name: 'Анна',
      level: 'BASIC',
      createdAt: '2026-06-01T10:00:00.000Z',
      updatedAt: '2026-06-02T10:00:00.000Z',
      skills: [
        {
          skillId: 'skill-api-id',
          progressPercent: 80,
          skill: { id: 'skill-api-id', name: 'Овал' },
        },
      ],
      trainingHistory: [],
      packages: [],
    })

    expect(student.id).toBe('student-api-id')
    expect(student.name).toBe('Анна')
    expect(student.level).toBe('База')
    expect(student.createdAt).toBe('2026-06-01T10:00:00.000Z')
    expect(student.skills?.[0].name).toBe('Овал')
  })

  it('uses backend history count when the student list has no full history', () => {
    const student = normalizeStudent({
      id: 'student-api-id',
      name: 'Алексей',
      level: 'BASIC',
      historyCount: 7,
      trainingHistory: [],
      packages: [{ totalTrainings: 3, completedTrainings: 0, paymentStatus: 'paid' }],
    })

    expect(student.completedTrainingsCount).toBe(7)
    expect(student.trainingPackage?.completed).toBe(0)
    expect(student.trainingPackage?.total).toBe(3)
  })

  it('normalizes history location without using the booking slot title', () => {
    const student = normalizeStudent({
      id: 'student-api-id',
      name: 'Алексей',
      level: 'BASIC',
      trainingHistory: [
        {
          id: 'history-1',
          trainedAt: '2026-06-30T10:00:00.000Z',
          location: 'Площадка Запад',
          locationUrl: 'https://maps.example.com/west',
          bookingSlot: {
            title: 'Свободный слот',
            finalLocation: 'Площадка Север',
          },
        },
        {
          id: 'history-2',
          trainedAt: '2026-06-25T10:00:00.000Z',
          bookingSlot: {
            title: 'Свободный слот',
            finalLocation: 'Площадка Север',
          },
        },
      ],
      packages: [],
    })

    expect(student.trainingHistory?.[0].location).toBe('Площадка Запад')
    expect(student.trainingHistory?.[0].locationUrl).toBe('https://maps.example.com/west')
    expect(student.trainingHistory?.[1].location).toBe('Площадка Север')
    expect(student.trainingHistory?.some((history) => history.location === 'Свободный слот')).toBe(false)
  })
})
