import { render, screen } from '@testing-library/react'
import { QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as ordersApi from '../../api/orders'
import { ApiError } from '../../api/utils/request'
import { createTestQueryClient } from '../../test/createWrapper'
import { orderFixture } from '../../test/fixtures'
import OrderConfirmationPage from './OrderConfirmationPage'

vi.mock('../../api/orders')

const renderPage = () =>
  render(
    <QueryClientProvider client={createTestQueryClient()}>
      <MemoryRouter initialEntries={['/orders/order-1']}>
        <Routes>
          <Route path="/orders/:orderId" element={<OrderConfirmationPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )

beforeEach(() => {
  vi.resetAllMocks()
})

describe('OrderConfirmationPage', () => {
  it('shows a spinner while the order loads', () => {
    vi.mocked(ordersApi.fetchOrderById).mockReturnValue(new Promise(() => undefined))

    renderPage()

    expect(screen.getByRole('status', { name: 'Loading' })).toBeInTheDocument()
  })

  it('confirms the order with its reference, lines and total', async () => {
    vi.mocked(ordersApi.fetchOrderById).mockResolvedValue(orderFixture)

    renderPage()

    expect(await screen.findByRole('heading', { name: 'Thank you for your order!' })).toBeInTheDocument()
    expect(screen.getByText('PAY-ABC12345')).toBeInTheDocument()
    expect(screen.getByText('order-1')).toBeInTheDocument()
    expect(screen.getByText('Running Shoes')).toBeInTheDocument()
    expect(screen.getAllByText('$179.98')).toHaveLength(2)
    expect(screen.getByRole('link', { name: 'Continue shopping' })).toHaveAttribute('href', '/')
  })

  it('explains that the order does not exist', async () => {
    vi.mocked(ordersApi.fetchOrderById).mockRejectedValue(new ApiError(404, 'Order not found'))

    renderPage()

    expect(await screen.findByText('Order not found')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Continue shopping' })).toBeInTheDocument()
  })

  it('shows other errors', async () => {
    vi.mocked(ordersApi.fetchOrderById).mockRejectedValue(new ApiError(400, 'Invalid order id'))

    renderPage()

    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid order id')
  })
})
