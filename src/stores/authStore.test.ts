import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from './authStore'

// Mock API
vi.mock('@/api/auth', () => ({
  authenticateWithTelegram: vi.fn()
}))

vi.mock('@/api/client', () => ({
  setAuthToken: vi.fn()
}))

import { authenticateWithTelegram } from '@/api/auth'
import { setAuthToken } from '@/api/client'

describe('useAuthStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  it('should initialize with null values', () => {
    const store = useAuthStore()
    expect(store.token).toBeNull()
    expect(store.studentId).toBeNull()
    expect(store.avatar).toBeNull()
    expect(store.user).toBeNull()
    expect(store.isAuthenticated).toBe(false)
  })

  it('should restore token and avatar from localStorage', () => {
    localStorage.setItem('auth_token', 'test-token')
    localStorage.setItem('student_id', 'test-student-id')
    localStorage.setItem('student_avatar', 'https://t.me/avatar.jpg')
    
    const store = useAuthStore()
    expect(store.token).toBe('test-token')
    expect(store.studentId).toBe('test-student-id')
    expect(store.avatar).toBe('https://t.me/avatar.jpg')
  })

  it('should mark as authenticated when token and studentId exist', () => {
    localStorage.setItem('auth_token', 'test-token')
    localStorage.setItem('student_id', 'test-student-id')
    
    const store = useAuthStore()
    expect(store.isAuthenticated).toBe(true)
  })

  it('should set token and save to localStorage', () => {
    const store = useAuthStore()
    store.setToken('new-token')
    
    expect(store.token).toBe('new-token')
    expect(localStorage.getItem('auth_token')).toBe('new-token')
    expect(setAuthToken).toHaveBeenCalledWith('new-token')
  })

  it('should set studentId and save to localStorage', () => {
    const store = useAuthStore()
    store.setStudentId('new-student-id')
    
    expect(store.studentId).toBe('new-student-id')
    expect(localStorage.getItem('student_id')).toBe('new-student-id')
  })

  it('should clear auth data', () => {
    localStorage.setItem('auth_token', 'test-token')
    localStorage.setItem('student_id', 'test-student-id')
    localStorage.setItem('student_avatar', 'https://t.me/avatar.jpg')
    
    const store = useAuthStore()
    store.clearAuth()
    
    expect(store.token).toBeNull()
    expect(store.studentId).toBeNull()
    expect(store.avatar).toBeNull()
    expect(store.user).toBeNull()
    expect(localStorage.getItem('auth_token')).toBeNull()
    expect(localStorage.getItem('student_id')).toBeNull()
    expect(localStorage.getItem('student_avatar')).toBeNull()
    expect(setAuthToken).toHaveBeenCalledWith(null)
  })

  it('should set avatar and save to localStorage', () => {
    const store = useAuthStore()
    store.setAvatar('https://t.me/avatar.jpg')
    
    expect(store.avatar).toBe('https://t.me/avatar.jpg')
    expect(localStorage.getItem('student_avatar')).toBe('https://t.me/avatar.jpg')
  })

  it('should remove avatar from localStorage when set to null', () => {
    localStorage.setItem('student_avatar', 'https://t.me/avatar.jpg')
    const store = useAuthStore()
    store.setAvatar(null)
    
    expect(store.avatar).toBeNull()
    expect(localStorage.getItem('student_avatar')).toBeNull()
  })

  it('should login with Telegram and store avatar', async () => {
    const mockResponse = {
      token: 'jwt-token',
      studentId: 'student-123',
      user: {
        id: 'user-123',
        telegramId: 123456789,
        telegramUsername: 'test_user',
        displayName: 'Test User',
        avatar: 'https://t.me/avatar.jpg'
      },
      student: {
        id: 'student-123',
        userId: 'user-123',
        name: 'Test User',
        level: 'BEGINNER',
        focus: '',
        nextTrainingPlan: '',
        notes: '',
        avatar: 'https://t.me/avatar.jpg',
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z'
      }
    }

    vi.mocked(authenticateWithTelegram).mockResolvedValueOnce(mockResponse)

    const store = useAuthStore()
    await store.loginWithTelegram('mock-init-data')

    expect(store.token).toBe('jwt-token')
    expect(store.studentId).toBe('student-123')
    expect(store.avatar).toBe('https://t.me/avatar.jpg')
    expect(store.user).toEqual(mockResponse.user)
    expect(localStorage.getItem('auth_token')).toBe('jwt-token')
    expect(localStorage.getItem('student_id')).toBe('student-123')
    expect(localStorage.getItem('student_avatar')).toBe('https://t.me/avatar.jpg')
  })

  it('should handle login error and clear avatar', async () => {
    localStorage.setItem('student_avatar', 'https://t.me/avatar.jpg')
    const error = new Error('Auth failed')
    vi.mocked(authenticateWithTelegram).mockRejectedValueOnce(error)

    const store = useAuthStore()
    
    try {
      await store.loginWithTelegram('mock-init-data')
    } catch (e) {
      // Expected
    }

    expect(store.token).toBeNull()
    expect(store.studentId).toBeNull()
    expect(store.avatar).toBeNull()
    expect(store.error).toBe('Auth failed')
  })

  it('should manage loading state', async () => {
    const mockResponse = {
      token: 'jwt-token',
      studentId: 'student-123',
      user: { 
        id: 'user-123', 
        telegramId: 123456789, 
        displayName: 'Test',
        avatar: undefined
      },
      student: {
        id: 'student-123',
        userId: 'user-123',
        name: 'Test',
        level: 'BEGINNER',
        avatar: '',
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z'
      }
    }

    vi.mocked(authenticateWithTelegram).mockImplementationOnce(() => {
      return new Promise((resolve) => {
        setTimeout(() => resolve(mockResponse), 100)
      })
    })

    const store = useAuthStore()
    const promise = store.loginWithTelegram('mock-init-data')

    expect(store.isLoading).toBe(true)

    await promise

    expect(store.isLoading).toBe(false)
  })
})
