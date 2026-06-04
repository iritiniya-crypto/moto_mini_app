import { getJson, putJson } from './client'
import { normalizeSkills, type ApiRecord } from './normalizers'
import {API_ENDPOINTS} from '../types/api'
import type { Skill, UpsertStudentSkillRequest } from '../types/skill'

export async function fetchSkills(signal?: AbortSignal) {
  return getJson<ApiRecord[]>(API_ENDPOINTS.SKILLS, signal)
}

export async function fetchStudentSkills(studentId: string, signal?: AbortSignal) {
  return getJson<ApiRecord[]>(API_ENDPOINTS.STUDENT_SKILLS(studentId), signal)
}

export async function updateStudentSkillsApi(studentId: string, skills: UpsertStudentSkillRequest[]) {
  return putJson<ApiRecord[], UpsertStudentSkillRequest[]>(API_ENDPOINTS.STUDENT_SKILLS(studentId), skills)
}

export function skillsToPayload(skills: Skill[]): UpsertStudentSkillRequest[] {
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
