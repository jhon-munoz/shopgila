export interface Product {
  id: string
  name: string
  sku: string
  description: string | null
  category: string
  price: number
  stock: number
  weightKg: number | null
  createdAt: string
  updatedAt: string
}

export interface ProductInput {
  name: string
  sku: string
  description: string | null
  category: string
  price: number
  stock: number
  weightKg: number | null
}

export interface ProductSearchParams {
  q?: string
  category?: string
  minPrice?: number
  maxPrice?: number
  inStockOnly?: boolean
  page?: number
  size?: number
  sort?: string
}
