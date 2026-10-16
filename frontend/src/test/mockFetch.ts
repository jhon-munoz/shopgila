import { vi } from 'vitest'

export function mockFetchResponse(body: unknown, status = 200) {
  const createResponse = () =>
    body === undefined
      ? new Response(null, { status })
      : new Response(JSON.stringify(body), {
          status,
          headers: { 'Content-Type': 'application/json' },
        })
  const fetchMock = vi.fn().mockImplementation(() => Promise.resolve(createResponse()))
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

export function mockFetchFailure(error: unknown) {
  const fetchMock = vi.fn().mockRejectedValue(error)
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

export function mockFetchByUrl(resolveBody: (url: string) => unknown) {
  const fetchMock = vi.fn().mockImplementation((url: string) =>
    Promise.resolve(
      new Response(JSON.stringify(resolveBody(url)), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    ),
  )
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}
