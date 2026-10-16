import { act, renderHook, waitFor } from '@testing-library/react'
import { QueryClient } from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as productsApi from '../../api/products'
import { productKeys } from '../../api/queryKeys'
import { useStore } from '../../store/store'
import { createTestQueryClient, createWrapper } from '../../test/createWrapper'
import { productFixture, productInputFixture } from '../../test/fixtures'
import {
  useCreateProduct,
  useDeleteProduct,
  useGetCategories,
  useGetProductById,
  useGetProducts,
  useImportProducts,
  useUpdateProduct,
} from '..'

vi.mock('../../api/products')

let queryClient: QueryClient

beforeEach(() => {
  vi.resetAllMocks()
  useStore.setState({ toasts: [] })
  queryClient = createTestQueryClient()
})

const toastMessages = () => useStore.getState().toasts.map((toast) => toast.message)

describe('product queries', () => {
  it('fetches the products with the given filters', async () => {
    const page = { content: [productFixture], page: 0, size: 20, totalElements: 1, totalPages: 1 }
    vi.mocked(productsApi.fetchProducts).mockResolvedValue(page)

    const { result } = renderHook(() => useGetProducts({ q: 'shoes', page: 0 }), {
      wrapper: createWrapper(queryClient),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(page)
    expect(productsApi.fetchProducts).toHaveBeenCalledWith({ q: 'shoes', page: 0 }, expect.anything())
  })

  it('keeps showing the previous page while the next one loads', async () => {
    const first = { content: [productFixture], page: 0, size: 1, totalElements: 2, totalPages: 2 }
    vi.mocked(productsApi.fetchProducts).mockResolvedValueOnce(first)
    vi.mocked(productsApi.fetchProducts).mockReturnValueOnce(new Promise(() => undefined))

    const { result, rerender } = renderHook(({ page }) => useGetProducts({ page }), {
      initialProps: { page: 0 },
      wrapper: createWrapper(queryClient),
    })
    await waitFor(() => expect(result.current.data).toEqual(first))

    rerender({ page: 1 })

    expect(result.current.data).toEqual(first)
    expect(result.current.isPlaceholderData).toBe(true)
  })

  it('fetches a product by id', async () => {
    vi.mocked(productsApi.fetchProductById).mockResolvedValue(productFixture)

    const { result } = renderHook(() => useGetProductById('product-1'), {
      wrapper: createWrapper(queryClient),
    })

    await waitFor(() => expect(result.current.data).toEqual(productFixture))
  })

  it('does not fetch a product without id', () => {
    renderHook(() => useGetProductById(undefined), { wrapper: createWrapper(queryClient) })

    expect(productsApi.fetchProductById).not.toHaveBeenCalled()
  })

  it('fetches the categories', async () => {
    vi.mocked(productsApi.fetchCategories).mockResolvedValue(['Books', 'Footwear'])

    const { result } = renderHook(() => useGetCategories(), { wrapper: createWrapper(queryClient) })

    await waitFor(() => expect(result.current.data).toEqual(['Books', 'Footwear']))
  })
})

describe('product mutations', () => {
  it('creates a product, refreshes the products and notifies', async () => {
    vi.mocked(productsApi.createProduct).mockResolvedValue(productFixture)
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries')
    const { result } = renderHook(() => useCreateProduct(), { wrapper: createWrapper(queryClient) })

    await act(() => result.current.mutateAsync(productInputFixture))

    expect(productsApi.createProduct).toHaveBeenCalledWith(productInputFixture)
    expect(invalidate).toHaveBeenCalledWith({ queryKey: productKeys.all })
    expect(toastMessages()).toEqual(['Product RS-001 created'])
  })

  it('updates a product, refreshes the products and notifies', async () => {
    vi.mocked(productsApi.updateProduct).mockResolvedValue(productFixture)
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries')
    const { result } = renderHook(() => useUpdateProduct(), { wrapper: createWrapper(queryClient) })

    await act(() => result.current.mutateAsync({ id: 'product-1', input: productInputFixture }))

    expect(productsApi.updateProduct).toHaveBeenCalledWith('product-1', productInputFixture)
    expect(invalidate).toHaveBeenCalledWith({ queryKey: productKeys.all })
    expect(toastMessages()).toEqual(['Product RS-001 updated'])
  })

  it('deletes a product, refreshes the products and notifies', async () => {
    vi.mocked(productsApi.deleteProduct).mockResolvedValue(undefined)
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries')
    const { result } = renderHook(() => useDeleteProduct(), { wrapper: createWrapper(queryClient) })

    await act(() => result.current.mutateAsync('product-1'))

    expect(productsApi.deleteProduct).toHaveBeenCalledWith('product-1')
    expect(invalidate).toHaveBeenCalledWith({ queryKey: productKeys.all })
    expect(toastMessages()).toEqual(['Product deleted'])
  })

  it('imports a file and summarizes the report', async () => {
    const report = { totalRows: 5, created: 3, updated: 1, failed: 1, blankRows: 0, duplicatesInFile: 0, errors: [] }
    vi.mocked(productsApi.importProducts).mockResolvedValue(report)
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries')
    const { result } = renderHook(() => useImportProducts(), { wrapper: createWrapper(queryClient) })
    const file = new File(['name'], 'products.csv')

    await act(() => result.current.mutateAsync(file))

    expect(productsApi.importProducts).toHaveBeenCalledWith(file)
    expect(invalidate).toHaveBeenCalledWith({ queryKey: productKeys.all })
    expect(toastMessages()).toEqual(['Import finished: 3 created, 1 updated, 1 failed'])
  })

  it('does not notify success when the creation fails', async () => {
    vi.mocked(productsApi.createProduct).mockRejectedValue(new Error('boom'))
    const { result } = renderHook(() => useCreateProduct(), { wrapper: createWrapper(queryClient) })

    await act(() => result.current.mutateAsync(productInputFixture).catch(() => undefined))

    expect(toastMessages()).toEqual([])
  })
})
