import { getJson } from './client'

export type HealthResponse = {
  status: string
  service: string
}

export function fetchHealth(signal?: AbortSignal) {
  return getJson<HealthResponse>('/health', signal)
}
