import { afterEach, describe, expect, it, vi } from 'vitest'
import { mockFetchFailure, mockFetchResponse } from '../../test/mockFetch'
import { ApiError, NETWORK_ERROR_MESSAGE, request } from './request'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('request', () => {
  it('returns the parsed JSON body', async () => {
    mockFetchResponse({ name: 'Shoes' })

    const result = await request<{ name: string }>('/api/v1/products/1')

    expect(result).toEqual({ name: 'Shoes' })
  })

  it('sends a GET request accepting JSON by default', async () => {
    const fetchMock = mockFetchResponse({})

    await request('/api/v1/products')

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v1/products',
      expect.objectContaining({ method: 'GET', headers: { Accept: 'application/json' } }),
    )
  })

  it('serializes the body as JSON with its content type', async () => {
    const fetchMock = mockFetchResponse({})

    await request('/api/v1/products', { method: 'POST', body: { sku: 'RS-001' } })

    const init = fetchMock.mock.calls[0][1] as RequestInit
    expect(init.body).toBe('{"sku":"RS-001"}')
    expect(init.headers).toMatchObject({ 'Content-Type': 'application/json' })
  })

  it('sends form data without forcing the content type', async () => {
    const fetchMock = mockFetchResponse({})
    const formData = new FormData()
    formData.append('file', new File(['a'], 'products.csv'))

    await request('/api/v1/products/import', { method: 'POST', body: formData })

    const init = fetchMock.mock.calls[0][1] as RequestInit
    expect(init.body).toBe(formData)
    expect(init.headers).not.toHaveProperty('Content-Type')
  })

  it('returns undefined when the response has no content', async () => {
    mockFetchResponse(undefined, 204)

    const result = await request<void>('/api/v1/products/1', { method: 'DELETE' })

    expect(result).toBeUndefined()
  })

  it('throws an ApiError with the message and details of the server', async () => {
    mockFetchResponse(
      { statusCode: 400, message: 'Validation failed', details: ['name: must not be blank'] },
      400,
    )

    const error = await request('/api/v1/products').catch((e: unknown) => e)

    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({
      status: 400,
      message: 'Validation failed',
      details: ['name: must not be blank'],
    })
  })

  it('throws an ApiError with a generic message when the error is not JSON', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('boom', { status: 502 })))

    const error = await request('/api/v1/products').catch((e: unknown) => e)

    expect(error).toMatchObject({ status: 502, message: 'Request failed with status 502', details: [] })
  })

  it('throws an ApiError with status 0 when the server cannot be reached', async () => {
    mockFetchFailure(new TypeError('Failed to fetch'))

    const error = await request('/api/v1/products').catch((e: unknown) => e)

    expect(error).toMatchObject({ status: 0, message: NETWORK_ERROR_MESSAGE })
  })

  it('rethrows aborted requests untouched', async () => {
    const abort = new DOMException('Aborted', 'AbortError')
    mockFetchFailure(abort)

    await expect(request('/api/v1/products')).rejects.toBe(abort)
  })
})
