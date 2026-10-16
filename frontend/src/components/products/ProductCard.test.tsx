import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { useStore } from '../../store/store'
import { productFixture } from '../../test/fixtures'
import ProductCard from './ProductCard'

beforeEach(() => {
  localStorage.clear()
  useStore.setState({ items: [] })
})

describe('ProductCard', () => {
  it('shows the details of the product', () => {
    render(<ProductCard product={productFixture} />)

    expect(screen.getByRole('heading', { name: 'Running Shoes' })).toBeInTheDocument()
    expect(screen.getByText('RS-001')).toBeInTheDocument()
    expect(screen.getByText('Footwear')).toBeInTheDocument()
    expect(screen.getByText('Lightweight shoes')).toBeInTheDocument()
    expect(screen.getByText('$89.99')).toBeInTheDocument()
  })

  it('does not render a description when there is none', () => {
    render(<ProductCard product={{ ...productFixture, description: null }} />)

    expect(screen.queryByText('Lightweight shoes')).not.toBeInTheDocument()
  })

  it('labels the stock levels', () => {
    const { rerender } = render(<ProductCard product={productFixture} />)
    expect(screen.getByText('In stock')).toBeInTheDocument()

    rerender(<ProductCard product={{ ...productFixture, stock: 3 }} />)
    expect(screen.getByText('Only 3 left')).toBeInTheDocument()

    rerender(<ProductCard product={{ ...productFixture, stock: 0 }} />)
    expect(screen.getByText('Out of stock', { selector: 'p' })).toBeInTheDocument()
  })

  it('adds the product to the cart', async () => {
    render(<ProductCard product={productFixture} />)

    await userEvent.click(screen.getByRole('button', { name: 'Add to cart: Running Shoes' }))

    expect(useStore.getState().items).toEqual([
      expect.objectContaining({ productId: 'product-1', quantity: 1, unitPrice: 89.99 }),
    ])
    expect(screen.getByText('In cart: 1')).toBeInTheDocument()
  })

  it('adds another unit each time it is pressed', async () => {
    render(<ProductCard product={productFixture} />)

    await userEvent.click(screen.getByRole('button', { name: /Add to cart/ }))
    await userEvent.click(screen.getByRole('button', { name: /Add to cart/ }))

    expect(useStore.getState().items[0].quantity).toBe(2)
    expect(screen.getByText('In cart: 2')).toBeInTheDocument()
  })

  it('disables the button when the product is out of stock', () => {
    render(<ProductCard product={{ ...productFixture, stock: 0 }} />)

    expect(screen.getByRole('button', { name: /Out of stock/ })).toBeDisabled()
  })

  it('disables the button once all the stock is in the cart', async () => {
    render(<ProductCard product={{ ...productFixture, stock: 2 }} />)

    await userEvent.click(screen.getByRole('button', { name: /Add to cart/ }))
    await userEvent.click(screen.getByRole('button', { name: /Add to cart/ }))

    expect(screen.getByRole('button', { name: /Max in cart/ })).toBeDisabled()
    expect(useStore.getState().items[0].quantity).toBe(2)
  })

  it('shows what is already in the cart', () => {
    useStore.getState().addItem(productFixture, 4)

    render(<ProductCard product={productFixture} />)

    expect(screen.getByText('In cart: 4')).toBeInTheDocument()
  })
})
