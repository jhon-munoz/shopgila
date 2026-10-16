import { describe, expect, it } from 'vitest'
import { buildQuery, getOrderUrl, getProductsUrl, getProductUrl } from './urls'

describe('buildQuery', () => {
  it('returns an empty string when there are no values', () => {
    expect(buildQuery({})).toBe('')
    expect(buildQuery({ q: '', page: undefined, category: null })).toBe('')
  })

  it('omits empty values and keeps the others', () => {
    expect(buildQuery({ q: 'mouse', category: '', page: 0, inStockOnly: true })).toBe(
      '?q=mouse&page=0&inStockOnly=true',
    )
  })

  it('keeps false and zero values', () => {
    expect(buildQuery({ inStockOnly: false, minPrice: 0 })).toBe('?inStockOnly=false&minPrice=0')
  })

  it('encodes special characters', () => {
    expect(buildQuery({ q: '50% off & more' })).toBe('?q=50%25+off+%26+more')
  })
})

describe('urls', () => {
  it('builds the products url with and without filters', () => {
    expect(getProductsUrl()).toBe('/api/v1/products')
    expect(getProductsUrl({ q: 'shoes', sort: 'price,desc' })).toBe(
      '/api/v1/products?q=shoes&sort=price%2Cdesc',
    )
  })

  it('builds the url of a product and an order', () => {
    expect(getProductUrl('abc')).toBe('/api/v1/products/abc')
    expect(getOrderUrl('xyz')).toBe('/api/v1/orders/xyz')
  })
})
