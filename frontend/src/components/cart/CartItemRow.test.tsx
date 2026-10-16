import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { CartLine } from '../../types/cart'
import CartItemRow from './CartItemRow'

const line = (overrides: Partial<CartLine> = {}, quantity = 2): CartLine => ({
  item: {
    productId: 'product-1',
    sku: 'RS-001',
    name: 'Running Shoes',
    unitPrice: 89.99,
    quantity,
    stock: 10,
  },
  price: 89.99,
  stock: 10,
  status: 'ok',
  ...overrides,
})

const setup = (cartLine: CartLine) => {
  const onQuantityChange = vi.fn()
  const onRemove = vi.fn()
  render(<CartItemRow line={cartLine} onQuantityChange={onQuantityChange} onRemove={onRemove} />)
  return { onQuantityChange, onRemove }
}

describe('CartItemRow', () => {
  it('shows the product, the unit price and the subtotal', () => {
    setup(line())

    expect(screen.getByRole('heading', { name: 'Running Shoes' })).toBeInTheDocument()
    expect(screen.getByText('RS-001')).toBeInTheDocument()
    expect(screen.getByText('$89.99 each')).toBeInTheDocument()
    expect(screen.getByText('$179.98')).toBeInTheDocument()
    expect(screen.getByLabelText('Quantity of Running Shoes')).toHaveValue(2)
  })

  it('increases and decreases the quantity with the fresh stock', async () => {
    const { onQuantityChange } = setup(line({ stock: 7 }))

    await userEvent.click(screen.getByRole('button', { name: 'Increase quantity of Running Shoes' }))
    await userEvent.click(screen.getByRole('button', { name: 'Decrease quantity of Running Shoes' }))

    expect(onQuantityChange).toHaveBeenNthCalledWith(1, 3, 7)
    expect(onQuantityChange).toHaveBeenNthCalledWith(2, 1, 7)
  })

  it('disables increasing once the stock is reached', () => {
    setup(line({ stock: 2 }))

    expect(screen.getByRole('button', { name: 'Increase quantity of Running Shoes' })).toBeDisabled()
  })

  it('accepts a typed quantity', async () => {
    const { onQuantityChange } = setup(line({}, 1))

    await userEvent.type(screen.getByLabelText('Quantity of Running Shoes'), '5')

    expect(onQuantityChange).toHaveBeenCalledWith(15, 10)
  })

  it('removes the line', async () => {
    const { onRemove } = setup(line())

    await userEvent.click(screen.getByRole('button', { name: 'Remove Running Shoes' }))

    expect(onRemove).toHaveBeenCalledTimes(1)
  })

  it('warns about a price change', () => {
    setup(line({ price: 99.99, previousPrice: 89.99 }))

    expect(screen.getByText('Price changed from $89.99 to $99.99')).toBeInTheDocument()
  })

  it('asks to reduce the quantity when there is not enough stock', () => {
    setup(line({ stock: 1, status: 'insufficient' }))

    expect(screen.getByRole('alert')).toHaveTextContent('Only 1 available. Reduce the quantity to continue.')
    expect(screen.getByLabelText('Quantity of Running Shoes')).toBeInTheDocument()
  })

  it('does not allow editing a product that is out of stock or gone', () => {
    const { onRemove } = setup(line({ stock: 0, status: 'unavailable' }))

    expect(screen.getByRole('alert')).toHaveTextContent('out of stock')
    expect(screen.queryByLabelText('Quantity of Running Shoes')).not.toBeInTheDocument()
    expect(onRemove).not.toHaveBeenCalled()
  })

  it('explains that a deleted product must be removed', () => {
    setup(line({ stock: 0, status: 'removed' }))

    expect(screen.getByRole('alert')).toHaveTextContent('no longer available')
  })
})
