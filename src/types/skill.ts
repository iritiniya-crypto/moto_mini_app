export interface ApiSkill {
  id: string
  name: string
  description?: string
  createdAt: string
  updatedAt: string
}

export interface StudentSkill {
  skillId: string
  progressPercent: number
  skill: {
    id: string
    name: string
    description?: string
  }
}

export type Skill = {
  id: number
  apiId?: string
  name: string
  oldValue: number
  newValue?: number
}

export type AvailableSkill = {
  id: number
  name: string
}

export interface UpsertStudentSkillRequest {
  skillId: string
  progressPercent: number
}
