import { describe, expect, it, vi } from 'vitest'
import { apiClient, deleteJson, getJson, patchJson, postJson, putJson } from './client'

describe('api client helpers', () => {
  it('getJson returns response data', async () => {
    vi.spyOn(apiClient, 'get').mockResolvedValueOnce({ data: { ok: true } } as never)

    await expect(getJson<{ ok: boolean }>('/health')).resolves.toEqual({ ok: true })
  })

  it('postJson throws ApiError with status on backend failure', async () => {
    vi.spyOn(apiClient, 'post').mockRejectedValueOnce({ response: { status: 409 } })

    await expect(postJson('/path', {})).rejects.toMatchObject({
      name: 'ApiError',
      status: 409,
    })
  })

  it('patchJson throws generic ApiError on network failure', async () => {
    vi.spyOn(apiClient, 'patch').mockRejectedValueOnce(new Error('network'))

    await expect(patchJson('/path', {})).rejects.toMatchObject({
      name: 'ApiError',
      status: undefined,
    })
  })

  it('putJson returns response data', async () => {
    vi.spyOn(apiClient, 'put').mockResolvedValueOnce({ data: { saved: true } } as never)

    await expect(putJson<{ saved: boolean }, { id: string }>('/path', { id: '1' })).resolves.toEqual({ saved: true })
  })

  it('deleteJson returns response data', async () => {
    vi.spyOn(apiClient, 'delete').mockResolvedValueOnce({ data: { deleted: true } } as never)

    await expect(deleteJson<{ deleted: boolean }>('/path')).resolves.toEqual({ deleted: true })
  })
})



