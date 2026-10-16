import { render, screen, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { useStore } from '../store/store'
import { productFixture } from '../test/fixtures'
import AdminLayout from './AdminLayout'
import ShopLayout from './ShopLayout'

beforeEach(() => {
  localStorage.clear()
  useStore.setState({ items: [] })
})

const renderShop = (initialPath = '/') =>
  render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route element={<ShopLayout />}>
          <Route index element={<p>shop content</p>} />
          <Route path="cart" element={<p>cart content</p>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )

describe('ShopLayout', () => {
  it('renders the brand, the navigation and the page content', () => {
    renderShop()

    const nav = screen.getByRole('navigation', { name: 'Main' })
    expect(screen.getByRole('link', { name: 'Shopgila' })).toHaveAttribute('href', '/')
    expect(within(nav).getByRole('link', { name: 'Shop' })).toHaveAttribute('href', '/')
    expect(within(nav).getByRole('link', { name: 'Admin' })).toHaveAttribute('href', '/admin/products')
    expect(screen.getByText('shop content')).toBeInTheDocument()
  })

  it('does not show the cart count when the cart is empty', () => {
    renderShop()

    expect(screen.queryByTestId('cart-count')).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Cart, 0 items' })).toBeInTheDocument()
  })

  it('shows the number of units in the cart', () => {
    useStore.getState().addItem(productFixture, 3)

    renderShop()

    expect(screen.getByTestId('cart-count')).toHaveTextContent('3')
    expect(screen.getByRole('link', { name: 'Cart, 3 items' })).toHaveAttribute('href', '/cart')
  })

  it('uses the singular for a single unit', () => {
    useStore.getState().addItem(productFixture, 1)

    renderShop()

    expect(screen.getByRole('link', { name: 'Cart, 1 item' })).toBeInTheDocument()
  })

  it('highlights the current section', () => {
    renderShop('/cart')

    expect(screen.getByRole('link', { name: /Cart/ })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'Shop' })).not.toHaveAttribute('aria-current')
  })
})

describe('AdminLayout', () => {
  it('renders the administration navigation and the page content', () => {
    render(
      <MemoryRouter initialEntries={['/admin/products']}>
        <Routes>
          <Route path="/admin" element={<AdminLayout />}>
            <Route path="products" element={<p>products content</p>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    )

    const nav = screen.getByRole('navigation', { name: 'Administration' })
    expect(within(nav).getByRole('link', { name: 'Products' })).toHaveAttribute('href', '/admin/products')
    expect(within(nav).getByRole('link', { name: 'Import CSV' })).toHaveAttribute('href', '/admin/import')
    expect(within(nav).getByRole('link', { name: 'Back to shop' })).toHaveAttribute('href', '/')
    expect(screen.getByText('products content')).toBeInTheDocument()
  })
})
