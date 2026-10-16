import { beforeEach, describe, expect, it } from 'vitest'
import { useStore } from '../store/store'
import { createQueryClient } from './queryClient'
import { ApiError } from './utils/request'

beforeEach(() => {
  useStore.setState({ toasts: [] })
})

const failWith = (error: ApiError) =>
  createQueryClient()
    .getMutationCache()
    .build(createQueryClient(), {
      mutationFn: () => Promise.reject(error),
    })
    .execute(undefined)
    .catch(() => undefined)

describe('query client', () => {
  const retry = createQueryClient().getDefaultOptions().queries?.retry as (
    count: number,
    error: Error,
  ) => boolean

  it('does not retry client errors', () => {
    expect(retry(0, new ApiError(404, 'Not found'))).toBe(false)
    expect(retry(0, new ApiError(409, 'Conflict'))).toBe(false)
  })

  it('retries server and network failures a limited number of times', () => {
    expect(retry(0, new ApiError(500, 'Boom'))).toBe(true)
    expect(retry(1, new ApiError(0, 'Offline'))).toBe(true)
    expect(retry(2, new ApiError(500, 'Boom'))).toBe(false)
  })

  it('shows a toast when a mutation fails because of the server', async () => {
    await failWith(new ApiError(500, 'Server exploded'))

    expect(useStore.getState().toasts).toEqual([
      expect.objectContaining({ type: 'error', message: 'Server exploded' }),
    ])
  })

  it('shows a toast when the server cannot be reached', async () => {
    await failWith(new ApiError(0, 'Offline'))

    expect(useStore.getState().toasts).toHaveLength(1)
  })

  it('leaves client errors to the screens', async () => {
    await failWith(new ApiError(400, 'Validation failed'))

    expect(useStore.getState().toasts).toEqual([])
  })
})
