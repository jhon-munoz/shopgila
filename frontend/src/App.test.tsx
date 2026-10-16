import { render, screen } from '@testing-library/react'
import { QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { createTestQueryClient } from './test/createWrapper'
import { mockFetchByUrl } from './test/mockFetch'

const renderApp = (path: string) =>
  render(
    <QueryClientProvider client={createTestQueryClient()}>
      <MemoryRouter initialEntries={[path]}>
        <App />
      </MemoryRouter>
    </QueryClientProvider>,
  )

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('App', () => {
  it('renders the shop layout and the catalog on the home route', async () => {
    mockFetchByUrl((url) =>
      url.includes('/categories') ? [] : { content: [], page: 0, size: 12, totalElements: 0, totalPages: 0 },
    )

    renderApp('/')

    expect(screen.getByRole('link', { name: 'Shopgila' })).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'Main' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Shop' })).toBeInTheDocument()
    expect(await screen.findByText('No products found')).toBeInTheDocument()
  })

  it('renders the administration layout on the admin route', async () => {
    mockFetchByUrl(() => ({ content: [], page: 0, size: 10, totalElements: 0, totalPages: 0 }))

    renderApp('/admin')

    expect(screen.getByRole('navigation', { name: 'Administration' })).toBeInTheDocument()
    expect(await screen.findByRole('heading', { name: 'Products' })).toBeInTheDocument()
  })

  it('renders the not found page for unknown routes', () => {
    renderApp('/does-not-exist')

    expect(screen.getByRole('heading', { name: 'Page not found' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Back to the shop' })).toHaveAttribute('href', '/')
  })
})
