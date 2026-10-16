import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as ordersApi from '../../api/orders'
import * as productsApi from '../../api/products'
import { ApiError } from '../../api/utils/request'
import { useStore } from '../../store/store'
import { createTestQueryClient } from '../../test/createWrapper'
import { orderFixture, productFixture } from '../../test/fixtures'
import CartPage from './CartPage'

vi.mock('../../api/products')
vi.mock('../../api/orders')

const mouse = { id: 'product-2', sku: 'WM-042', name: 'Wireless Mouse', price: 29.99, stock: 5 }

const renderPage = () =>
  render(
    <QueryClientProvider client={createTestQueryClient()}>
      <MemoryRouter initialEntries={['/cart']}>
        <Routes>
          <Route path="/cart" element={<CartPage />} />
          <Route path="/orders/:orderId" element={<p>order confirmation</p>} />
          <Route path="/" element={<p>shop</p>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )

const placeOrderButton = () => screen.findByRole('button', { name: 'Place order' })

beforeEach(() => {
  vi.resetAllMocks()
  localStorage.clear()
  useStore.setState({ items: [], toasts: [] })
  vi.mocked(productsApi.fetchProductById).mockImplementation((id: string) =>
    Promise.resolve(id === 'product-2' ? { ...productFixture, ...mouse } : productFixture),
  )
})

const fillCart = () => {
  useStore.getState().addItem(productFixture, 2)
  useStore.getState().addItem(mouse, 1)
}

describe('CartPage', () => {
  it('shows an empty state with a link to the shop', () => {
    renderPage()

    expect(screen.getByText('Your cart is empty')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Browse the shop' })).toHaveAttribute('href', '/')
  })

  it('lists the items with the total and the units', async () => {
    fillCart()

    renderPage()

    expect(await screen.findByRole('heading', { name: 'Running Shoes' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Wireless Mouse' })).toBeInTheDocument()
    expect(screen.getByText('$209.97')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('places the order with the lines of the cart and shows the confirmation', async () => {
    fillCart()
    vi.mocked(ordersApi.placeOrder).mockResolvedValue(orderFixture)
    renderPage()

    await userEvent.click(await placeOrderButton())

    expect(await screen.findByText('order confirmation')).toBeInTheDocument()
    expect(ordersApi.placeOrder).toHaveBeenCalledWith({
      paymentToken: 'tok_visa',
      items: [
        { productId: 'product-1', quantity: 2 },
        { productId: 'product-2', quantity: 1 },
      ],
    })
    expect(useStore.getState().items).toEqual([])
  })

  it('shows that the payment was declined and keeps the cart', async () => {
    fillCart()
    vi.mocked(ordersApi.placeOrder).mockRejectedValue(new ApiError(402, 'Payment declined: card declined'))
    renderPage()

    await userEvent.selectOptions(await screen.findByLabelText('Payment method'), 'tok_declined')
    await userEvent.click(await placeOrderButton())

    expect(await screen.findByText('Payment declined: card declined')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Payment declined' })).toBeInTheDocument()
    expect(ordersApi.placeOrder).toHaveBeenCalledWith(expect.objectContaining({ paymentToken: 'tok_declined' }))
    expect(useStore.getState().items).toHaveLength(2)
  })

  it('clears the error when another payment method is chosen', async () => {
    fillCart()
    vi.mocked(ordersApi.placeOrder).mockRejectedValue(new ApiError(402, 'Payment declined: card declined'))
    renderPage()
    await userEvent.click(await placeOrderButton())
    await screen.findByText('Payment declined: card declined')

    await userEvent.selectOptions(screen.getByLabelText('Payment method'), 'tok_declined')

    expect(screen.queryByText('Payment declined: card declined')).not.toBeInTheDocument()
  })

  it('shows the stock problem reported by the server', async () => {
    fillCart()
    vi.mocked(ordersApi.placeOrder).mockRejectedValue(
      new ApiError(409, 'Insufficient stock: RS-001 (requested 2, available 1)'),
    )
    renderPage()

    await userEvent.click(await placeOrderButton())

    expect(await screen.findByRole('heading', { name: 'Not enough stock' })).toBeInTheDocument()
    expect(screen.getByText('Insufficient stock: RS-001 (requested 2, available 1)')).toBeInTheDocument()
    expect(useStore.getState().items).toHaveLength(2)
  })

  it('blocks the order when a line asks for more than the available stock', async () => {
    useStore.getState().addItem(productFixture, 6)
    vi.mocked(productsApi.fetchProductById).mockResolvedValue({ ...productFixture, stock: 4 })
    renderPage()

    expect(await screen.findByText(/Only 4 available/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Place order' })).toBeDisabled()
  })

  it('lets the user fix the quantity with the fresh stock', async () => {
    useStore.getState().addItem(productFixture, 6)
    vi.mocked(productsApi.fetchProductById).mockResolvedValue({ ...productFixture, stock: 4 })
    renderPage()
    await screen.findByText(/Only 4 available/)

    await userEvent.click(screen.getByRole('button', { name: 'Decrease quantity of Running Shoes' }))

    expect(useStore.getState().items[0]).toMatchObject({ quantity: 4, stock: 4 })
    await waitFor(() => expect(screen.getByRole('button', { name: 'Place order' })).toBeEnabled())
  })

  it('changes the quantity of a line', async () => {
    fillCart()
    renderPage()

    await userEvent.click(await screen.findByRole('button', { name: 'Increase quantity of Running Shoes' }))

    expect(useStore.getState().items[0].quantity).toBe(3)
    expect(screen.getByText('$299.96')).toBeInTheDocument()
  })

  it('removes a line and shows the empty state after removing the last one', async () => {
    useStore.getState().addItem(productFixture, 1)
    renderPage()

    await userEvent.click(await screen.findByRole('button', { name: 'Remove Running Shoes' }))

    expect(screen.getByText('Your cart is empty')).toBeInTheDocument()
  })

  it('requires removing a product that no longer exists', async () => {
    useStore.getState().addItem(productFixture, 1)
    vi.mocked(productsApi.fetchProductById).mockRejectedValue(new ApiError(404, 'Product not found'))
    renderPage()

    expect(await screen.findByText(/no longer available/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Place order' })).toBeDisabled()
  })
})
