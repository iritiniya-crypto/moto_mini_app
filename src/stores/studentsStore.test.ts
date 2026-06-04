import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useStudentsStore } from './studentsStore'

vi.mock('../api/students', () => ({
  createStudent: vi.fn(),
  fetchStudents: vi.fn(),
  normalizeStudentResponse: vi.fn((payload: any, fallback?: any) => ({ ...fallback, ...payload })),
  normalizeStudents: vi.fn((payload: any[]) => payload),
  updateStudent: vi.fn(),
}))

vi.mock('../api/packages', () => ({
  fetchStudentPackage: vi.fn(),
  normalizeTrainingPackage: vi.fn((payload: any) => payload),
  packageToPayload: vi.fn((payload: any) => payload),
  upsertStudentPackage: vi.fn(),
}))

vi.mock('../api/skills', () => ({
  fetchStudentSkills: vi.fn(),
  normalizeSkillDefinitions: vi.fn((payload: any) => payload),
  skillsToPayload: vi.fn((payload: any[]) => payload),
  updateStudentSkillsApi: vi.fn(),
}))

import { createStudent, fetchStudents, updateStudent } from '../api/students'
import { upsertStudentPackage } from '../api/packages'
import { updateStudentSkillsApi } from '../api/skills'

const sampleStudent = {
  id: 'student-1',
  apiId: 'student-api-1',
  name: 'Иван',
  status: 'активный',
  level: 'База',
  completedTrainingsCount: 0,
  nextLesson: 'Время еще не выбрано',
  avatar: '',
  focus: 'Овал',
}

describe('studentsStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('loads students from backend', async () => {
    vi.mocked(fetchStudents).mockResolvedValueOnce([sampleStudent] as any)

    const store = useStudentsStore()
    await store.loadStudents()

    expect(store.students).toHaveLength(1)
    expect(store.students[0].name).toBe('Иван')
    expect(store.usingFallback).toBe(false)
  })

  it('sets empty list when loadStudents fails', async () => {
    vi.mocked(fetchStudents).mockRejectedValueOnce(new Error('down'))

    const store = useStudentsStore()
    await store.loadStudents()

    expect(store.students).toEqual([])
    expect(store.usingFallback).toBe(true)
    expect(store.error).toContain('не удалось загрузить')
  })

  it('does not mutate student locally when update fails', async () => {
    vi.mocked(updateStudent).mockRejectedValueOnce(new Error('down'))

    const store = useStudentsStore()
    store.students = [{ ...sampleStudent } as any]

    const result = await store.updateStudentRecord(store.students[0] as any, { name: 'Новое имя' })

    expect(result.name).toBe('Иван')
    expect(store.students[0].name).toBe('Иван')
    expect(store.error).toContain('не сохранены')
  })

  it('does not save package locally when backend request fails', async () => {
    vi.mocked(upsertStudentPackage).mockRejectedValueOnce(new Error('down'))

    const store = useStudentsStore()
    store.students = [{ ...sampleStudent, trainingPackage: { total: 1, completed: 0, paymentStatus: 'не оплачено' } } as any]

    const nextPackage = { total: 10, completed: 1, paymentStatus: 'оплачено', isActive: true }
    const result = await store.saveStudentPackage(store.students[0] as any, nextPackage as any)

    expect(result).toEqual(store.students[0].trainingPackage)
    expect(store.students[0].trainingPackage).not.toEqual(nextPackage)
  })

  it('does not save skills locally when backend request fails', async () => {
    vi.mocked(updateStudentSkillsApi).mockRejectedValueOnce(new Error('down'))

    const store = useStudentsStore()
    store.students = [
      {
        ...sampleStudent,
        skills: [{ id: 1, apiId: 'skill-1', name: 'Овал', oldValue: 30 }],
      } as any,
    ]

    const nextSkills = [{ id: 1, apiId: 'skill-1', name: 'Овал', oldValue: 80 }]
    const result = await store.saveStudentSkills(store.students[0] as any, nextSkills as any)

    expect(result).toEqual(store.students[0].skills)
    expect(store.students[0].skills?.[0].oldValue).toBe(30)
  })

  it('creates student only after successful backend response', async () => {
    vi.mocked(createStudent).mockResolvedValueOnce({ ...sampleStudent, id: 'student-2', name: 'Анна' } as any)

    const store = useStudentsStore()
    const created = await store.createStudentRecord({ name: 'Анна' })

    expect(created?.name).toBe('Анна')
    expect(store.students).toHaveLength(1)
  })
})

