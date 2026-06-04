import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useTrainingStore } from './useTrainingStore'

const userStoreState = vi.hoisted(() => ({
  profile: null as any,
  loadProfile: vi.fn(async () => {}),
}))

vi.mock('../stores/userStore.ts', () => ({
  useUserStore: () => userStoreState,
}))

vi.mock('../api/trainingReports', () => ({
  createTrainingReportApi: vi.fn(),
}))

vi.mock('../api/trainingHistory', () => ({
  createManualTrainingHistory: vi.fn(),
  manualTrainingToPayload: vi.fn((payload: any) => payload),
}))

vi.mock('../api/videos', () => ({
  createTrainingVideo: vi.fn(),
}))

vi.mock('../api/packages', () => ({
  normalizeTrainingPackage: vi.fn((payload: any) => payload),
  packageToPayload: vi.fn((payload: any) => payload),
  upsertStudentPackage: vi.fn(),
}))

vi.mock('../api/skills', () => ({
  normalizeSkillDefinitions: vi.fn((payload: any) => payload),
  skillsToPayload: vi.fn((payload: any[]) => payload),
  updateStudentSkillsApi: vi.fn(),
}))

import { createTrainingReportApi } from '../api/trainingReports'
import { createManualTrainingHistory } from '../api/trainingHistory'
import { upsertStudentPackage } from '../api/packages'
import { updateStudentSkillsApi } from '../api/skills'

const student = {
  id: 'student-1',
  apiId: 'student-api-1',
  name: 'Иван',
  status: 'активный',
  level: 'База',
  completedTrainingsCount: 0,
  nextLesson: 'Время еще не выбрано',
  avatar: '',
  focus: '',
  skills: [{ id: 1, apiId: 'skill-1', name: 'Овал', oldValue: 20 }],
  trainingHistory: [],
}

describe('useTrainingStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    userStoreState.profile = { ...student, trainingHistory: [] }
  })

  it('returns null when createTrainingReport backend call fails', async () => {
    vi.mocked(createTrainingReportApi).mockRejectedValueOnce(new Error('down'))

    const store = useTrainingStore()
    const result = await store.createTrainingReport(
      {
        studentId: 'student-1',
        slotId: 101,
        date: '10 июня',
        duration: '90 мин',
        location: 'Площадка',
        trainedSkills: ['Овал'],
        improved: 'Лучше баланс',
        nextFocus: 'Смотреть дальше',
        skillUpdates: {},
      },
      { slotApiId: 'slot-api-101', studentApiId: 'student-api-1' },
    )

    expect(result).toBeNull()
    expect(store.trainingReports.value).toHaveLength(0)
  })

  it('creates report and updates local profile after successful backend call', async () => {
    vi.mocked(createTrainingReportApi).mockResolvedValueOnce({
      report: { id: 'report-api-1' },
      trainingHistory: { id: 'history-api-1' },
    } as any)

    const store = useTrainingStore()
    const result = await store.createTrainingReport(
      {
        studentId: 'student-1',
        slotId: 101,
        date: '10 июня',
        duration: '90 мин',
        location: 'Площадка',
        trainedSkills: ['Овал'],
        improved: 'Лучше баланс',
        nextFocus: 'Смотреть дальше',
        skillUpdates: {},
      },
      { slotApiId: 'slot-api-101', studentApiId: 'student-api-1' },
    )

    expect(result?.apiId).toBe('report-api-1')
    expect(store.trainingReports.value).toHaveLength(1)
    expect(userStoreState.profile.trainingHistory).toHaveLength(1)
  })

  it('does not add manual training without backend id', async () => {
    const store = useTrainingStore()
    const result = await store.addManualTraining('student-1', {
      date: '10 июня',
      duration: '90 мин',
      topics: ['Овал'],
      improved: 'Лучше баланс',
      nextFocus: 'Смотреть дальше',
    })

    expect(result).toBeNull()
    expect(userStoreState.profile.trainingHistory).toHaveLength(0)
  })

  it('creates manual training only after successful backend response', async () => {
    vi.mocked(createManualTrainingHistory).mockResolvedValueOnce({ id: 'history-api-2' } as any)

    const store = useTrainingStore()
    const result = await store.addManualTraining(
      'student-1',
      {
        date: '10 июня',
        duration: '90 мин',
        topics: ['Овал'],
        improved: 'Лучше баланс',
        nextFocus: 'Смотреть дальше',
      },
      'student-api-1',
    )

    expect(result?.apiId).toBe('history-api-2')
    expect(userStoreState.profile.trainingHistory).toHaveLength(1)
  })

  it('returns null and keeps previous package when backend package save fails', async () => {
    userStoreState.profile.trainingPackage = { total: 3, completed: 1, paymentStatus: 'не оплачено' }
    vi.mocked(upsertStudentPackage).mockRejectedValueOnce(new Error('down'))

    const store = useTrainingStore()
    const result = await store.upsertStudentPackage('student-1', {
      total: 5,
      completed: 2,
      paymentStatus: 'оплачено',
      isActive: true,
    }, 'student-api-1')

    expect(result).toBeNull()
    expect(userStoreState.profile.trainingPackage.total).toBe(3)
  })

  it('updates student skills only from backend response', async () => {
    vi.mocked(updateStudentSkillsApi).mockResolvedValueOnce([
      { id: 10, apiId: 'skill-1', name: 'Овал', oldValue: 90 },
    ] as any)

    const store = useTrainingStore()
    await store.updateStudentSkills(
      'student-1',
      [{ id: 1, apiId: 'skill-1', name: 'Овал', oldValue: 90 }],
      'student-api-1',
    )

    expect(userStoreState.profile.skills[0].oldValue).toBe(90)
  })
})

