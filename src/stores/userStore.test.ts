import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useUserStore } from './userStore'

vi.mock('../api/health', () => ({
  fetchHealth: vi.fn(),
}))

vi.mock('../api/skills', () => ({
  fetchSkills: vi.fn(),
  normalizeSkillDefinitions: vi.fn((payload: any) => payload),
}))

vi.mock('../api/students', () => ({
  fetchStudents: vi.fn(),
  normalizeStudents: vi.fn((payload: any[]) => payload),
}))

vi.mock('../api/studentProfile', () => ({
  fetchStudentProfile: vi.fn(),
  normalizeStudentProfile: vi.fn((payload: any) => payload),
}))

import { fetchHealth } from '../api/health'
import { fetchSkills } from '../api/skills'
import { fetchStudents } from '../api/students'
import { fetchStudentProfile } from '../api/studentProfile'

describe('userStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('loads health status', async () => {
    vi.mocked(fetchHealth).mockResolvedValueOnce({ status: 'ok', service: 'backend' } as any)

    const store = useUserStore()
    await store.checkHealth()

    expect(store.health?.status).toBe('ok')
    expect(store.healthError).toBe('')
  })

  it('resets students to empty on backend failure', async () => {
    vi.mocked(fetchStudents).mockRejectedValueOnce(new Error('down'))

    const store = useUserStore()
    await store.loadStudents()

    expect(store.students).toEqual([])
    expect(store.studentsError).toContain('не загружен')
  })

  it('loads skills and keeps backend data', async () => {
    vi.mocked(fetchSkills).mockResolvedValueOnce([{ id: 1, name: 'Овал' }] as any)

    const store = useUserStore()
    await store.loadSkills()

    expect(store.skills).toEqual([{ id: 1, name: 'Овал' }])
  })

  it('sets profile to null on profile load failure', async () => {
    vi.mocked(fetchStudentProfile).mockRejectedValueOnce(new Error('down'))

    const store = useUserStore()
    store.profile = { id: 'cached' } as any

    await store.loadProfile('student-id')

    expect(store.profile).toBeNull()
    expect(store.profileError).toContain('не загружен')
  })
})

