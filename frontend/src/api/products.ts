import { API_ENDPOINTS } from './config'
import { request } from './utils/request'
import { getProductsUrl, getProductUrl } from './utils/urls'
import type { PageResponse } from '../types/api'
import type { ImportReport } from '../types/importReport'
import type { Product, ProductInput, ProductSearchParams } from '../types/product'

export const fetchProducts = (params: ProductSearchParams = {}, signal?: AbortSignal) =>
  request<PageResponse<Product>>(getProductsUrl(params), { signal })

export const fetchProductById = (id: string, signal?: AbortSignal) =>
  request<Product>(getProductUrl(id), { signal })

export const fetchCategories = (signal?: AbortSignal) =>
  request<string[]>(API_ENDPOINTS.PRODUCT_CATEGORIES, { signal })

export const createProduct = (input: ProductInput) =>
  request<Product>(API_ENDPOINTS.PRODUCTS, { method: 'POST', body: input })

export const updateProduct = (id: string, input: ProductInput) =>
  request<Product>(getProductUrl(id), { method: 'PUT', body: input })

export const deleteProduct = (id: string) =>
  request<void>(getProductUrl(id), { method: 'DELETE' })

export const importProducts = (file: File) => {
  const formData = new FormData()
  formData.append('file', file)
  return request<ImportReport>(API_ENDPOINTS.PRODUCT_IMPORT, { method: 'POST', body: formData })
}
