import { describe, expect, it } from 'vitest'
import {
  DEFAULT_SORT,
  PAGE_SIZE,
  hasActiveFilters,
  parseFilters,
  toProductSearchParams,
  toSearchParams,
  type ShopFilters,
} from './queryParams'

const emptyFilters: ShopFilters = {
  q: '',
  category: '',
  minPrice: '',
  maxPrice: '',
  inStockOnly: false,
  sort: DEFAULT_SORT,
  page: 0,
}

describe('parseFilters', () => {
  it('returns the defaults for an empty url', () => {
    expect(parseFilters(new URLSearchParams())).toEqual(emptyFilters)
  })

  it('reads every filter from the url', () => {
    const params = new URLSearchParams(
      'q=mouse&category=Electronics&minPrice=10&maxPrice=50.5&inStockOnly=true&sort=price,desc&page=3',
    )

    expect(parseFilters(params)).toEqual({
      q: 'mouse',
      category: 'Electronics',
      minPrice: '10',
      maxPrice: '50.5',
      inStockOnly: true,
      sort: 'price,desc',
      page: 2,
    })
  })

  it('drops invalid prices', () => {
    const filters = parseFilters(new URLSearchParams('minPrice=abc&maxPrice=-4'))

    expect(filters.minPrice).toBe('')
    expect(filters.maxPrice).toBe('')
  })

  it('falls back to the default sort when it is unknown', () => {
    expect(parseFilters(new URLSearchParams('sort=hacked,asc')).sort).toBe(DEFAULT_SORT)
  })

  it('falls back to the first page when the page is invalid', () => {
    expect(parseFilters(new URLSearchParams('page=0')).page).toBe(0)
    expect(parseFilters(new URLSearchParams('page=-2')).page).toBe(0)
    expect(parseFilters(new URLSearchParams('page=abc')).page).toBe(0)
  })

  it('only enables the stock filter with the exact value true', () => {
    expect(parseFilters(new URLSearchParams('inStockOnly=1')).inStockOnly).toBe(false)
  })
})

describe('toSearchParams', () => {
  it('omits the default values', () => {
    expect(toSearchParams(emptyFilters).toString()).toBe('')
  })

  it('writes the active filters with a one based page', () => {
    const filters: ShopFilters = { ...emptyFilters, q: 'mouse', inStockOnly: true, sort: 'price,asc', page: 1 }

    expect(toSearchParams(filters).toString()).toBe('q=mouse&inStockOnly=true&sort=price%2Casc&page=2')
  })

  it('round trips with parseFilters', () => {
    const filters: ShopFilters = {
      q: '50% off',
      category: 'Food & Beverage',
      minPrice: '5',
      maxPrice: '20',
      inStockOnly: true,
      sort: 'price,desc',
      page: 4,
    }

    expect(parseFilters(toSearchParams(filters))).toEqual(filters)
  })
})

describe('toProductSearchParams', () => {
  it('builds the api params with numbers and the page size', () => {
    const filters: ShopFilters = { ...emptyFilters, q: '  mouse ', minPrice: '10.5', inStockOnly: true, page: 2 }

    expect(toProductSearchParams(filters)).toEqual({
      q: 'mouse',
      category: undefined,
      minPrice: 10.5,
      maxPrice: undefined,
      inStockOnly: true,
      sort: DEFAULT_SORT,
      page: 2,
      size: PAGE_SIZE,
    })
  })

  it('does not send the stock filter when it is off', () => {
    expect(toProductSearchParams(emptyFilters).inStockOnly).toBeUndefined()
  })

  it('keeps a zero minimum price', () => {
    expect(toProductSearchParams({ ...emptyFilters, minPrice: '0' }).minPrice).toBe(0)
  })
})

describe('hasActiveFilters', () => {
  it('is false for the default filters, sort and page', () => {
    expect(hasActiveFilters({ ...emptyFilters, sort: 'price,asc', page: 3 })).toBe(false)
  })

  it('is true when any filter is set', () => {
    expect(hasActiveFilters({ ...emptyFilters, q: 'a' })).toBe(true)
    expect(hasActiveFilters({ ...emptyFilters, category: 'Books' })).toBe(true)
    expect(hasActiveFilters({ ...emptyFilters, minPrice: '1' })).toBe(true)
    expect(hasActiveFilters({ ...emptyFilters, maxPrice: '1' })).toBe(true)
    expect(hasActiveFilters({ ...emptyFilters, inStockOnly: true })).toBe(true)
  })
})
