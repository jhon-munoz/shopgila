import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { orderFixture } from '../../test/fixtures'
import OrderItemsTable from './OrderItemsTable'

describe('OrderItemsTable', () => {
  it('lists every line with the price paid', () => {
    render(<OrderItemsTable items={orderFixture.items} total={orderFixture.total} />)

    const row = screen.getByRole('row', { name: /Running Shoes/ })
    expect(within(row).getByText('RS-001')).toBeInTheDocument()
    expect(within(row).getByText('$89.99')).toBeInTheDocument()
    expect(within(row).getByText('2')).toBeInTheDocument()
    expect(within(row).getByText('$179.98')).toBeInTheDocument()
  })

  it('shows the total of the order', () => {
    render(<OrderItemsTable items={orderFixture.items} total={orderFixture.total} />)

    expect(screen.getByRole('row', { name: /Total/ })).toHaveTextContent('$179.98')
  })

  it('has accessible column headers', () => {
    render(<OrderItemsTable items={orderFixture.items} total={orderFixture.total} />)

    expect(screen.getAllByRole('columnheader').map((header) => header.textContent)).toEqual([
      'Product',
      'Unit price',
      'Quantity',
      'Subtotal',
    ])
  })
})
