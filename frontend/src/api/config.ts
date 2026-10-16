const API_V1 = '/api/v1'

export const API_ENDPOINTS = {
  PRODUCTS: `${API_V1}/products`,
  PRODUCT_CATEGORIES: `${API_V1}/products/categories`,
  PRODUCT_IMPORT: `${API_V1}/products/import`,
  ORDERS: `${API_V1}/orders`,
} as const
