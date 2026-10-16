import type { ProductSearchParams } from '../types/product'

export const productKeys = {
  all: ['products'] as const,
  list: (params: ProductSearchParams) => [...productKeys.all, 'list', params] as const,
  detail: (id: string) => [...productKeys.all, 'detail', id] as const,
  categories: () => [...productKeys.all, 'categories'] as const,
}

export const orderKeys = {
  all: ['orders'] as const,
  detail: (id: string) => [...orderKeys.all, 'detail', id] as const,
}
