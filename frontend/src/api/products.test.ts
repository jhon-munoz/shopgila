import { afterEach, describe, expect, it, vi } from 'vitest'
import { mockFetchResponse } from '../test/mockFetch'
import {
  createProduct,
  deleteProduct,
  fetchCategories,
  fetchProductById,
  fetchProducts,
  importProducts,
  updateProduct,
} from './products'
import type { ProductInput } from '../types/product'

const input: ProductInput = {
  name: 'Running Shoes',
  sku: 'RS-001',
  description: null,
  category: 'Footwear',
  price: 89.99,
  stock: 10,
  weightKg: null,
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('products api', () => {
  it('searches products with the given filters', async () => {
    const fetchMock = mockFetchResponse({ content: [], totalElements: 0 })

    await fetchProducts({ q: 'shoes', inStockOnly: true, page: 1 })

    expect(fetchMock.mock.calls[0][0]).toBe('/api/v1/products?q=shoes&inStockOnly=true&page=1')
  })

  it('fetches a product by id', async () => {
    const fetchMock = mockFetchResponse({ id: 'abc' })

    await fetchProductById('abc')

    expect(fetchMock.mock.calls[0][0]).toBe('/api/v1/products/abc')
  })

  it('fetches the categories', async () => {
    const fetchMock = mockFetchResponse(['Books'])

    await expect(fetchCategories()).resolves.toEqual(['Books'])
    expect(fetchMock.mock.calls[0][0]).toBe('/api/v1/products/categories')
  })

  it('creates a product with a POST', async () => {
    const fetchMock = mockFetchResponse({ id: 'abc' }, 201)

    await createProduct(input)

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('/api/v1/products')
    expect(init.method).toBe('POST')
    expect(JSON.parse(init.body as string)).toEqual(input)
  })

  it('updates a product with a PUT', async () => {
    const fetchMock = mockFetchResponse({ id: 'abc' })

    await updateProduct('abc', input)

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('/api/v1/products/abc')
    expect(init.method).toBe('PUT')
  })

  it('deletes a product with a DELETE', async () => {
    const fetchMock = mockFetchResponse(undefined, 204)

    await expect(deleteProduct('abc')).resolves.toBeUndefined()

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('/api/v1/products/abc')
    expect(init.method).toBe('DELETE')
  })

  it('imports a CSV file as multipart form data', async () => {
    const fetchMock = mockFetchResponse({ created: 1 })
    const file = new File(['name,sku'], 'products.csv', { type: 'text/csv' })

    await importProducts(file)

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('/api/v1/products/import')
    expect(init.method).toBe('POST')
    expect((init.body as FormData).get('file')).toBe(file)
  })
})
