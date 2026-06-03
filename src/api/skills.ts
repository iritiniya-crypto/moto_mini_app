import { getJson, putJson } from './client'
import { normalizeSkills, type ApiRecord } from './normalizers'
import type { Skill } from '../mock/types'

export type UpsertStudentSkillPayload = {
  skillId: string
  progressPercent: number
}

export async function fetchSkills(signal?: AbortSignal) {
  return getJson<ApiRecord[]>('/skills', signal)
}

export async function fetchStudentSkills(studentId: string, signal?: AbortSignal) {
  return getJson<ApiRecord[]>(`/students/${studentId}/skills`, signal)
}

export async function updateStudentSkillsApi(studentId: string, skills: UpsertStudentSkillPayload[]) {
  return putJson<ApiRecord[], UpsertStudentSkillPayload[]>(`/students/${studentId}/skills`, skills)
}

export function skillsToPayload(skills: Skill[]): UpsertStudentSkillPayload[] {
  return skills
    .filter((skill) => skill.apiId)
    .map((skill) => ({
      skillId: skill.apiId!,
      progressPercent: Math.min(100, Math.max(0, Number(skill.oldValue) || 0)),
    }))
}

export function normalizeSkillDefinitions(payload: ApiRecord[]) {
  return normalizeSkills(payload)
}
