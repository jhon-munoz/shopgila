import type { ProductSearchParams } from '../types/product'

export const PAGE_SIZE = 12
export const DEFAULT_SORT = 'name,asc'

export const SORT_OPTIONS = [
  { value: 'name,asc', label: 'Name (A-Z)' },
  { value: 'price,asc', label: 'Price: low to high' },
  { value: 'price,desc', label: 'Price: high to low' },
] as const

export interface ShopFilters {
  q: string
  category: string
  minPrice: string
  maxPrice: string
  inStockOnly: boolean
  sort: string
  page: number
}

const isValidPrice = (value: string | null): value is string =>
  value !== null && value.trim() !== '' && Number.isFinite(Number(value)) && Number(value) >= 0

const isValidSort = (value: string | null): value is string =>
  SORT_OPTIONS.some((option) => option.value === value)

export function parseFilters(params: URLSearchParams): ShopFilters {
  const minPrice = params.get('minPrice')
  const maxPrice = params.get('maxPrice')
  const sort = params.get('sort')
  const page = Number.parseInt(params.get('page') ?? '', 10)

  return {
    q: params.get('q') ?? '',
    category: params.get('category') ?? '',
    minPrice: isValidPrice(minPrice) ? minPrice : '',
    maxPrice: isValidPrice(maxPrice) ? maxPrice : '',
    inStockOnly: params.get('inStockOnly') === 'true',
    sort: isValidSort(sort) ? sort : DEFAULT_SORT,
    page: Number.isInteger(page) && page >= 1 ? page - 1 : 0,
  }
}

export function toSearchParams(filters: ShopFilters): URLSearchParams {
  const params = new URLSearchParams()
  if (filters.q) params.set('q', filters.q)
  if (filters.category) params.set('category', filters.category)
  if (filters.minPrice) params.set('minPrice', filters.minPrice)
  if (filters.maxPrice) params.set('maxPrice', filters.maxPrice)
  if (filters.inStockOnly) params.set('inStockOnly', 'true')
  if (filters.sort !== DEFAULT_SORT) params.set('sort', filters.sort)
  if (filters.page > 0) params.set('page', String(filters.page + 1))
  return params
}

export function toProductSearchParams(filters: ShopFilters): ProductSearchParams {
  return {
    q: filters.q.trim() || undefined,
    category: filters.category || undefined,
    minPrice: filters.minPrice ? Number(filters.minPrice) : undefined,
    maxPrice: filters.maxPrice ? Number(filters.maxPrice) : undefined,
    inStockOnly: filters.inStockOnly || undefined,
    sort: filters.sort,
    page: filters.page,
    size: PAGE_SIZE,
  }
}

export const hasActiveFilters = (filters: ShopFilters) =>
  Boolean(filters.q || filters.category || filters.minPrice || filters.maxPrice || filters.inStockOnly)
