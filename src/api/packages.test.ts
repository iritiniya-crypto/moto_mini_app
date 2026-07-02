import { describe, expect, it } from 'vitest'
import { normalizeTrainingPackage, packageToPayload } from './packages'

describe('packages api helpers', () => {
  it('packageToPayload maps ui package shape to api dto', () => {
    const payload = packageToPayload({
      name: 'Мотоцикл',
      total: 8,
      completed: 3,
      paymentStatus: 'частично оплачено',
      startedAt: '2026-06-01T00:00:00.000Z',
      endedAt: '2026-07-01T00:00:00.000Z',
    })

    expect(payload).toEqual({
      name: 'Мотоцикл',
      totalTrainings: 8,
      completedTrainings: 3,
      paymentStatus: 'partial',
      startedAt: '2026-06-01T00:00:00.000Z',
      endedAt: '2026-07-01T00:00:00.000Z',
      isActive: true,
    })
  })

  it('normalizeTrainingPackage maps backend response', () => {
    const normalized = normalizeTrainingPackage({
      totalTrainings: 5,
      completedTrainings: 2,
      paymentStatus: 'paid',
      startedAt: '2026-06-01T00:00:00.000Z',
      endedAt: '2026-07-01T00:00:00.000Z',
      isActive: true,
      name: 'Скутер',
    })

    expect(normalized).toEqual({
      name: 'Скутер',
      total: 5,
      completed: 2,
      paymentStatus: 'оплачено',
      startedAt: '2026-06-01T00:00:00.000Z',
      endedAt: '2026-07-01T00:00:00.000Z',
      isActive: true,
    })
  })
})
