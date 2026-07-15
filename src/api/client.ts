import axios from 'axios'

export const API_BASE_URL =
  (import.meta.env.VITE_APP_BASE_URL).replace(/\/$/, '')

export const TEST_USER_ID = import.meta.env.VITE_APP_TEST_USER_ID as string
export const TEST_INSTRUCTOR_ID = import.meta.env.VITE_APP_TEST_INSTRUCTOR_ID as string

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 6000,
  headers: {
    Accept: 'application/json',
  },
})

// Add token to headers if available
export function setAuthToken(token: string | null) {
  if (token) {
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`
  } else {
    delete apiClient.defaults.headers.common['Authorization']
  }
}

export class ApiError extends Error {
  readonly status?: number

  constructor(message: string, status?: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export async function getJson<T>(path: string, signal?: AbortSignal): Promise<T> {
  try {
    const response = await apiClient.get<T>(path, { signal })
    return response.data
  } catch (error: any) {
    const status = error?.response?.status
    if (status) {
      throw new ApiError(`API request failed: ${status}`, status)
    }

    throw new ApiError('API request failed')
  }
}

export async function postJson<T, D = unknown>(path: string, data: D): Promise<T> {
  try {
    const response = await apiClient.post<T>(path, data)
    return response.data
  } catch (error: any) {
    const status = error?.response?.status
    if (status) {
      throw new ApiError(`API request failed: ${status}`, status)
    }

    throw new ApiError('API request failed')
  }
}

export async function patchJson<T, D = unknown>(path: string, data: D): Promise<T> {
  try {
    const response = await apiClient.patch<T>(path, data)
    return response.data
  } catch (error: any) {
    const status = error?.response?.status
    if (status) {
      throw new ApiError(`API request failed: ${status}`, status)
    }

    throw new ApiError('API request failed')
  }
}

export async function putJson<T, D = unknown>(path: string, data: D): Promise<T> {
  try {
    const response = await apiClient.put<T>(path, data)

    return response.data
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new ApiError(error.message, error.response?.status)
    }

    throw error
  }
}

export async function deleteJson<T>(path: string): Promise<T> {
  try {
    const response = await apiClient.delete<T>(path)

    return response.data
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new ApiError(error.message, error.response?.status)
    }

    throw error
  }
}
