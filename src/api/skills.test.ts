import { describe, expect, it } from 'vitest'
import { normalizeSkillDefinitions, skillsToPayload } from './skills'

describe('skills api helpers', () => {
  it('skillsToPayload keeps only skills with apiId and clamps progress', () => {
    const payload = skillsToPayload([
      { id: 1, apiId: 'skill-1', name: 'Овал', oldValue: 120 },
      { id: 2, name: 'Без api id', oldValue: 50 },
      { id: 3, apiId: 'skill-3', name: 'Змейка', oldValue: -5 },
    ])

    expect(payload).toEqual([
      { skillId: 'skill-1', progressPercent: 100 },
      { skillId: 'skill-3', progressPercent: 0 },
    ])
  })

  it('normalizeSkillDefinitions normalizes backend shape', () => {
    const normalized = normalizeSkillDefinitions([
      {
        skillId: 'skill-api-id',
        progressPercent: 76,
        skill: {
          id: 'skill-api-id',
          name: 'Восьмерка',
        },
      },
    ])

    expect(normalized).toHaveLength(1)
    expect(normalized[0].apiId).toBe('skill-api-id')
    expect(normalized[0].name).toBe('Восьмерка')
    expect(normalized[0].oldValue).toBe(76)
  })
})

