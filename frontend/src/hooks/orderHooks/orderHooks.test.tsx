import { act, renderHook, waitFor } from '@testing-library/react'
import { QueryClient } from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as ordersApi from '../../api/orders'
import { orderKeys, productKeys } from '../../api/queryKeys'
import { ApiError } from '../../api/utils/request'
import { useStore } from '../../store/store'
import { createTestQueryClient, createWrapper } from '../../test/createWrapper'
import { orderFixture, productFixture } from '../../test/fixtures'
import { useGetOrderById, usePlaceOrder } from '..'

vi.mock('../../api/orders')

let queryClient: QueryClient

const orderRequest = { paymentToken: 'tok_visa', items: [{ productId: 'product-1', quantity: 2 }] }

beforeEach(() => {
  vi.resetAllMocks()
  localStorage.clear()
  useStore.setState({ items: [], toasts: [] })
  queryClient = createTestQueryClient()
})

describe('order hooks', () => {
  it('places the order, clears the cart and refreshes the stock', async () => {
    vi.mocked(ordersApi.placeOrder).mockResolvedValue(orderFixture)
    useStore.getState().addItem(productFixture, 2)
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries')
    const { result } = renderHook(() => usePlaceOrder(), { wrapper: createWrapper(queryClient) })

    await act(() => result.current.mutateAsync(orderRequest))

    expect(ordersApi.placeOrder).toHaveBeenCalledWith(orderRequest)
    expect(useStore.getState().items).toEqual([])
    expect(invalidate).toHaveBeenCalledWith({ queryKey: productKeys.all })
    expect(queryClient.getQueryData(orderKeys.detail('order-1'))).toEqual(orderFixture)
    expect(useStore.getState().toasts.map((toast) => toast.message)).toEqual(['Order placed successfully'])
  })

  it('keeps the cart and refreshes the stock when there is not enough stock', async () => {
    vi.mocked(ordersApi.placeOrder).mockRejectedValue(new ApiError(409, 'Insufficient stock'))
    useStore.getState().addItem(productFixture, 2)
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries')
    const { result } = renderHook(() => usePlaceOrder(), { wrapper: createWrapper(queryClient) })

    await act(() => result.current.mutateAsync(orderRequest).catch(() => undefined))

    expect(useStore.getState().items).toHaveLength(1)
    expect(invalidate).toHaveBeenCalledWith({ queryKey: productKeys.all })
    expect(result.current.error).toMatchObject({ status: 409 })
  })

  it('keeps the cart and does not refresh anything when the payment is declined', async () => {
    vi.mocked(ordersApi.placeOrder).mockRejectedValue(new ApiError(402, 'Payment declined'))
    useStore.getState().addItem(productFixture, 2)
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries')
    const { result } = renderHook(() => usePlaceOrder(), { wrapper: createWrapper(queryClient) })

    await act(() => result.current.mutateAsync(orderRequest).catch(() => undefined))

    expect(useStore.getState().items).toHaveLength(1)
    expect(invalidate).not.toHaveBeenCalled()
  })

  it('fetches an order by id', async () => {
    vi.mocked(ordersApi.fetchOrderById).mockResolvedValue(orderFixture)

    const { result } = renderHook(() => useGetOrderById('order-1'), { wrapper: createWrapper(queryClient) })

    await waitFor(() => expect(result.current.data).toEqual(orderFixture))
  })

  it('does not fetch an order without id', () => {
    renderHook(() => useGetOrderById(undefined), { wrapper: createWrapper(queryClient) })

    expect(ordersApi.fetchOrderById).not.toHaveBeenCalled()
  })
})
