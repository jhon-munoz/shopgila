import { API_ENDPOINTS } from '../config'
import type { ProductSearchParams } from '../../types/product'

type QueryValue = string | number | boolean | null | undefined

export function buildQuery(params: Record<string, QueryValue>): string {
  const query = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.set(key, String(value))
    }
  })
  const text = query.toString()
  return text ? `?${text}` : ''
}

export const getProductsUrl = (params: ProductSearchParams = {}) =>
  `${API_ENDPOINTS.PRODUCTS}${buildQuery({ ...params })}`

export const getProductUrl = (id: string) => `${API_ENDPOINTS.PRODUCTS}/${id}`

export const getOrderUrl = (id: string) => `${API_ENDPOINTS.ORDERS}/${id}`
