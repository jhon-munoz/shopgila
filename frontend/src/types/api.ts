export interface ErrorMessage {
  statusCode: number
  timestamp: string
  message: string
  description?: string
  details?: string[]
}

export interface PageResponse<T> {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}
