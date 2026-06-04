import { getJson } from './client'
import {API_ENDPOINTS, type ApiHealthResponse} from '../types/api'

export type HealthResponse = ApiHealthResponse

export function fetchHealth(signal?: AbortSignal) {
  return getJson<HealthResponse>(API_ENDPOINTS.HEALTH, signal)
}
