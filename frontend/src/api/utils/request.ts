import type { ErrorMessage } from '../../types/api'

export const NETWORK_ERROR_MESSAGE = 'Unable to reach the server, please try again'

export class ApiError extends Error {
  readonly status: number
  readonly details: string[]

  constructor(status: number, message: string, details: string[] = []) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.details = details
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  body?: unknown
  signal?: AbortSignal
}

function buildInit({ method = 'GET', body, signal }: RequestOptions): RequestInit {
  const headers: Record<string, string> = { Accept: 'application/json' }
  const init: RequestInit = { method, headers, signal }
  if (body instanceof FormData) {
    init.body = body
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
    init.body = JSON.stringify(body)
  }
  return init
}

async function toApiError(response: Response): Promise<ApiError> {
  try {
    const error = (await response.json()) as Partial<ErrorMessage>
    return new ApiError(
      response.status,
      error.message ?? `Request failed with status ${response.status}`,
      error.details ?? [],
    )
  } catch {
    return new ApiError(response.status, `Request failed with status ${response.status}`)
  }
}

export async function request<T>(url: string, options: RequestOptions = {}): Promise<T> {
  let response: Response
  try {
    response = await fetch(url, buildInit(options))
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw error
    }
    throw new ApiError(0, NETWORK_ERROR_MESSAGE)
  }

  if (!response.ok) {
    throw await toApiError(response)
  }
  if (response.status === 204) {
    return undefined as T
  }
  return (await response.json()) as T
}
