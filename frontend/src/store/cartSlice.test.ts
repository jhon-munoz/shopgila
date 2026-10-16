import { beforeEach, describe, expect, it } from 'vitest'
import { selectCartCount, selectCartTotal } from './cartSlice'
import { CART_STORAGE_KEY, useStore } from './store'
import { productFixture } from '../test/fixtures'

const mouse = { id: 'product-2', sku: 'WM-042', name: 'Wireless Mouse', price: 29.99, stock: 5 }

beforeEach(() => {
  localStorage.clear()
  useStore.setState({ items: [] })
})

describe('cart', () => {
  it('adds a new product with quantity one', () => {
    useStore.getState().addItem(productFixture)

    expect(useStore.getState().items).toEqual([
      {
        productId: 'product-1',
        sku: 'RS-001',
        name: 'Running Shoes',
        unitPrice: 89.99,
        quantity: 1,
        stock: 10,
      },
    ])
  })

  it('adds the requested quantity', () => {
    useStore.getState().addItem(productFixture, 3)

    expect(useStore.getState().items[0].quantity).toBe(3)
  })

  it('adds up the quantity of a product already in the cart', () => {
    useStore.getState().addItem(productFixture, 2)
    useStore.getState().addItem(productFixture, 3)

    expect(useStore.getState().items).toHaveLength(1)
    expect(useStore.getState().items[0].quantity).toBe(5)
  })

  it('never exceeds the stock when adding', () => {
    useStore.getState().addItem(mouse, 4)
    useStore.getState().addItem(mouse, 4)

    expect(useStore.getState().items[0].quantity).toBe(5)
  })

  it('caps the initial quantity to the stock', () => {
    useStore.getState().addItem(mouse, 99)

    expect(useStore.getState().items[0].quantity).toBe(5)
  })

  it('ignores products without stock', () => {
    useStore.getState().addItem({ ...mouse, stock: 0 })

    expect(useStore.getState().items).toEqual([])
  })

  it('refreshes the price and stock when the product is added again', () => {
    useStore.getState().addItem(mouse, 1)
    useStore.getState().addItem({ ...mouse, price: 19.99, stock: 3 }, 1)

    expect(useStore.getState().items[0]).toMatchObject({ unitPrice: 19.99, stock: 3, quantity: 2 })
  })

  it('updates the quantity up to the stock', () => {
    useStore.getState().addItem(mouse)

    useStore.getState().updateQuantity('product-2', 4)
    expect(useStore.getState().items[0].quantity).toBe(4)

    useStore.getState().updateQuantity('product-2', 50)
    expect(useStore.getState().items[0].quantity).toBe(5)
  })

  it('uses the fresh stock to cap the quantity and keeps it for later', () => {
    useStore.getState().addItem(mouse)

    useStore.getState().updateQuantity('product-2', 8, 12)
    expect(useStore.getState().items[0]).toMatchObject({ quantity: 8, stock: 12 })

    useStore.getState().updateQuantity('product-2', 20, 12)
    expect(useStore.getState().items[0].quantity).toBe(12)
  })

  it('removes the line when the quantity is zero or less', () => {
    useStore.getState().addItem(mouse)

    useStore.getState().updateQuantity('product-2', 0)

    expect(useStore.getState().items).toEqual([])
  })

  it('removes a line and clears the cart', () => {
    useStore.getState().addItem(productFixture)
    useStore.getState().addItem(mouse)

    useStore.getState().removeItem('product-1')
    expect(useStore.getState().items.map((item) => item.productId)).toEqual(['product-2'])

    useStore.getState().clearCart()
    expect(useStore.getState().items).toEqual([])
  })

  it('counts the units and totals the price exactly', () => {
    useStore.getState().addItem({ ...mouse, price: 0.1, stock: 10 }, 1)
    useStore.getState().addItem({ ...productFixture, id: 'product-3', price: 0.2 }, 1)

    expect(selectCartCount(useStore.getState())).toBe(2)
    expect(selectCartTotal(useStore.getState())).toBe(0.3)
  })

  it('totals several quantities', () => {
    useStore.getState().addItem(productFixture, 2)
    useStore.getState().addItem(mouse, 1)

    expect(selectCartTotal(useStore.getState())).toBe(209.97)
  })

  it('persists only the cart items', () => {
    useStore.getState().addItem(productFixture)
    useStore.getState().showToast('info', 'hello')

    const stored = JSON.parse(localStorage.getItem(CART_STORAGE_KEY) as string)

    expect(stored.state.items[0].sku).toBe('RS-001')
    expect(stored.state).not.toHaveProperty('toasts')
  })
})
