import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as productsApi from '../../api/products'
import { ApiError } from '../../api/utils/request'
import { useStore } from '../../store/store'
import { createWrapper } from '../../test/createWrapper'
import { productFixture } from '../../test/fixtures'
import { useCartItems } from '..'

vi.mock('../../api/products')

const mouse = { id: 'product-2', sku: 'WM-042', name: 'Wireless Mouse', price: 29.99, stock: 5 }

beforeEach(() => {
  vi.resetAllMocks()
  localStorage.clear()
  useStore.setState({ items: [] })
})

const givenFreshProducts = (products: Record<string, Partial<typeof productFixture>>) => {
  vi.mocked(productsApi.fetchProductById).mockImplementation((id: string) => {
    const override = products[id]
    return override
      ? Promise.resolve({ ...productFixture, id, ...override })
      : Promise.reject(new ApiError(404, 'Product not found'))
  })
}

const render = () => renderHook(() => useCartItems(), { wrapper: createWrapper() })

describe('useCartItems', () => {
  it('is empty and cannot check out without items', () => {
    const { result } = render()

    expect(result.current).toMatchObject({ lines: [], count: 0, total: 0, canCheckout: false })
  })

  it('falls back to the saved data and blocks checkout while loading', () => {
    useStore.getState().addItem(productFixture, 2)
    vi.mocked(productsApi.fetchProductById).mockReturnValue(new Promise(() => undefined))

    const { result } = render()

    expect(result.current.isLoading).toBe(true)
    expect(result.current.canCheckout).toBe(false)
    expect(result.current.lines[0]).toMatchObject({ price: 89.99, stock: 10, status: 'ok' })
  })

  it('uses the fresh price and stock of the products', async () => {
    useStore.getState().addItem(productFixture, 2)
    givenFreshProducts({ 'product-1': { price: 89.99, stock: 7 } })

    const { result } = render()

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.lines[0]).toMatchObject({ price: 89.99, stock: 7, status: 'ok' })
    expect(result.current.lines[0].previousPrice).toBeUndefined()
    expect(result.current.canCheckout).toBe(true)
  })

  it('reports a price change keeping the price saved in the cart', async () => {
    useStore.getState().addItem(productFixture, 2)
    givenFreshProducts({ 'product-1': { price: 99.99 } })

    const { result } = render()

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.lines[0]).toMatchObject({ price: 99.99, previousPrice: 89.99, status: 'ok' })
    expect(result.current.total).toBe(199.98)
  })

  it('flags a line asking for more than the available stock', async () => {
    useStore.getState().addItem(productFixture, 6)
    givenFreshProducts({ 'product-1': { stock: 4 } })

    const { result } = render()

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.lines[0]).toMatchObject({ stock: 4, status: 'insufficient' })
    expect(result.current.canCheckout).toBe(false)
  })

  it('flags a product that ran out of stock', async () => {
    useStore.getState().addItem(productFixture, 1)
    givenFreshProducts({ 'product-1': { stock: 0 } })

    const { result } = render()

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.lines[0]).toMatchObject({ stock: 0, status: 'unavailable' })
    expect(result.current.canCheckout).toBe(false)
  })

  it('flags a product that no longer exists', async () => {
    useStore.getState().addItem(productFixture, 1)
    givenFreshProducts({})

    const { result } = render()

    await waitFor(() => expect(result.current.lines[0].status).toBe('removed'))
    expect(result.current.canCheckout).toBe(false)
  })

  it('keeps the saved data when the refresh fails for another reason', async () => {
    useStore.getState().addItem(productFixture, 1)
    vi.mocked(productsApi.fetchProductById).mockRejectedValue(new ApiError(500, 'Server down'))

    const { result } = render()

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.lines[0]).toMatchObject({ price: 89.99, status: 'ok' })
    expect(result.current.canCheckout).toBe(true)
  })

  it('counts the units and totals the fresh prices exactly', async () => {
    useStore.getState().addItem(productFixture, 2)
    useStore.getState().addItem(mouse, 1)
    givenFreshProducts({ 'product-1': { price: 89.99 }, 'product-2': { price: 29.99 } })

    const { result } = render()

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.count).toBe(3)
    expect(result.current.total).toBe(209.97)
  })

  it('does not allow checkout when only one of the lines has a problem', async () => {
    useStore.getState().addItem(productFixture, 1)
    useStore.getState().addItem(mouse, 1)
    givenFreshProducts({ 'product-1': {}, 'product-2': { stock: 0 } })

    const { result } = render()

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.canCheckout).toBe(false)
  })
})
