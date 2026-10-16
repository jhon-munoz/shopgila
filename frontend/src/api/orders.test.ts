import { afterEach, describe, expect, it, vi } from 'vitest'
import { mockFetchResponse } from '../test/mockFetch'
import { fetchOrderById, placeOrder } from './orders'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('orders api', () => {
  it('places an order with a POST', async () => {
    const fetchMock = mockFetchResponse({ id: 'order-1' }, 201)
    const order = { paymentToken: 'tok_visa', items: [{ productId: 'abc', quantity: 2 }] }

    await placeOrder(order)

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('/api/v1/orders')
    expect(init.method).toBe('POST')
    expect(JSON.parse(init.body as string)).toEqual(order)
  })

  it('fetches an order by id', async () => {
    const fetchMock = mockFetchResponse({ id: 'order-1' })

    await expect(fetchOrderById('order-1')).resolves.toEqual({ id: 'order-1' })
    expect(fetchMock.mock.calls[0][0]).toBe('/api/v1/orders/order-1')
  })
})
