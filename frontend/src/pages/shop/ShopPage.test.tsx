import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { UseQueryResult } from '@tanstack/react-query'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '../../api/utils/request'
import { useGetCategories, useGetProducts } from '../../hooks'
import { useStore } from '../../store/store'
import { productFixture } from '../../test/fixtures'
import type { PageResponse } from '../../types/api'
import type { Product } from '../../types/product'
import ShopPage from './ShopPage'

vi.mock('../../hooks')

function LocationDisplay() {
  const location = useLocation()
  return <p data-testid="location">{location.search}</p>
}

const page = (content: Product[], overrides: Partial<PageResponse<Product>> = {}): PageResponse<Product> => ({
  content,
  page: 0,
  size: 12,
  totalElements: content.length,
  totalPages: 1,
  ...overrides,
})

const givenProducts = (state: Partial<UseQueryResult<PageResponse<Product>>>) => {
  vi.mocked(useGetProducts).mockReturnValue({
    isPending: false,
    isError: false,
    isPlaceholderData: false,
    refetch: vi.fn(),
    ...state,
  } as UseQueryResult<PageResponse<Product>>)
}

const renderPage = (path = '/') =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <ShopPage />
      <LocationDisplay />
    </MemoryRouter>,
  )

beforeEach(() => {
  vi.resetAllMocks()
  localStorage.clear()
  useStore.setState({ items: [] })
  vi.mocked(useGetCategories).mockReturnValue({ data: ['Books', 'Footwear'] } as UseQueryResult<string[]>)
})

describe('ShopPage', () => {
  it('shows placeholders while the products load', () => {
    givenProducts({ isPending: true, data: undefined })

    const { container } = renderPage()

    expect(container.querySelector('[aria-busy="true"]')).toBeInTheDocument()
    expect(screen.queryByRole('list')).not.toBeInTheDocument()
  })

  it('lists the products with the total', () => {
    givenProducts({
      data: page([productFixture, { ...productFixture, id: 'product-2', name: 'Trail Shoes' }]),
    })

    renderPage()

    expect(screen.getByText('2 products')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Running Shoes' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Trail Shoes' })).toBeInTheDocument()
  })

  it('uses the singular for a single product', () => {
    givenProducts({ data: page([productFixture]) })

    renderPage()

    expect(screen.getByText('1 product')).toBeInTheDocument()
  })

  it('asks the api with the filters of the url', () => {
    givenProducts({ data: page([productFixture]) })

    renderPage('/?q=shoes&category=Footwear&minPrice=10&inStockOnly=true&page=2')

    expect(useGetProducts).toHaveBeenCalledWith({
      q: 'shoes',
      category: 'Footwear',
      minPrice: 10,
      maxPrice: undefined,
      inStockOnly: true,
      sort: 'name,asc',
      page: 1,
      size: 12,
    })
  })

  it('shows an empty state without filters', () => {
    givenProducts({ data: page([]) })

    renderPage()

    expect(screen.getByText('No products found')).toBeInTheDocument()
    expect(screen.getByText('There are no products yet.')).toBeInTheDocument()
  })

  it('offers to clear the filters when nothing matches', async () => {
    givenProducts({ data: page([]) })
    renderPage('/?q=unicorn')

    expect(screen.getByText('Try changing or clearing the filters.')).toBeInTheDocument()
    const [, clearInEmptyState] = screen.getAllByRole('button', { name: 'Clear filters' })
    await userEvent.click(clearInEmptyState)

    expect(screen.getByTestId('location')).toHaveTextContent('')
  })

  it('shows the error and retries', async () => {
    const refetch = vi.fn()
    givenProducts({ isError: true, error: new ApiError(500, 'Server down'), data: undefined, refetch })

    renderPage()

    expect(screen.getByRole('alert')).toHaveTextContent('Server down')
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(refetch).toHaveBeenCalledTimes(1)
  })

  it('changes the page in the url', async () => {
    givenProducts({ data: page([productFixture], { totalPages: 3, page: 0 }) })
    renderPage()

    await userEvent.click(screen.getByRole('button', { name: 'Next' }))

    expect(screen.getByTestId('location')).toHaveTextContent('?page=2')
  })

  it('goes back to the first page when a filter changes', async () => {
    givenProducts({ data: page([productFixture], { totalPages: 3, page: 1 }) })
    renderPage('/?page=2')

    await userEvent.selectOptions(screen.getByLabelText('Category'), 'Books')

    expect(screen.getByTestId('location')).toHaveTextContent('?category=Books')
  })

  it('stores the sort order and the stock filter in the url', async () => {
    givenProducts({ data: page([productFixture]) })
    renderPage()

    await userEvent.click(screen.getByLabelText('In stock only'))
    await userEvent.selectOptions(screen.getByLabelText('Sort by'), 'price,asc')

    expect(screen.getByTestId('location')).toHaveTextContent('inStockOnly=true')
    expect(screen.getByTestId('location')).toHaveTextContent('sort=price%2Casc')
  })

  it('dims the results while the next page is loading', () => {
    givenProducts({ data: page([productFixture]), isPlaceholderData: true })

    renderPage()

    expect(screen.getByText('1 product').parentElement).toHaveClass('opacity-60')
  })

  it('adds a product to the cart from the list', async () => {
    givenProducts({ data: page([productFixture]) })
    renderPage()

    await userEvent.click(screen.getByRole('button', { name: 'Add to cart: Running Shoes' }))

    expect(useStore.getState().items).toHaveLength(1)
  })
})
