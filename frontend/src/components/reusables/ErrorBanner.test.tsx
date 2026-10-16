import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ApiError } from '../../api/utils/request'
import ErrorBanner from './ErrorBanner'

describe('ErrorBanner', () => {
  it('renders nothing without an error', () => {
    const { container } = render(<ErrorBanner error={null} />)

    expect(container).toBeEmptyDOMElement()
  })

  it('shows the message of a regular error', () => {
    render(<ErrorBanner error={new Error('Network down')} />)

    expect(screen.getByRole('alert')).toHaveTextContent('Network down')
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
  })

  it('lists the details of an api error', () => {
    const error = new ApiError(400, 'Validation failed', ['name: must not be blank', 'sku: must not be blank'])

    render(<ErrorBanner error={error} title="Could not save" />)

    expect(screen.getByText('Could not save')).toBeInTheDocument()
    expect(screen.getByText('Validation failed')).toBeInTheDocument()
    expect(screen.getAllByRole('listitem').map((item) => item.textContent)).toEqual([
      'name: must not be blank',
      'sku: must not be blank',
    ])
  })

  it('does not render a list when there are no details', () => {
    render(<ErrorBanner error={new ApiError(404, 'Product not found')} />)

    expect(screen.queryByRole('list')).not.toBeInTheDocument()
  })
})
