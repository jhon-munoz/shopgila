import type { StateCreator } from 'zustand'
import type { Product } from '../types/product'
import { fromCents, toCents } from '../utils/money'

export interface CartItem {
  productId: string
  sku: string
  name: string
  unitPrice: number
  quantity: number
  stock: number
}

export type CartProduct = Pick<Product, 'id' | 'sku' | 'name' | 'price' | 'stock'>

export interface CartSlice {
  items: CartItem[]
  addItem: (product: CartProduct, quantity?: number) => void
  updateQuantity: (productId: string, quantity: number, availableStock?: number) => void
  removeItem: (productId: string) => void
  clearCart: () => void
}

export const createCartSlice: StateCreator<CartSlice, [], [], CartSlice> = (set) => ({
  items: [],

  addItem: (product, quantity = 1) =>
    set((state) => {
      if (product.stock <= 0 || quantity <= 0) {
        return state
      }
      const existing = state.items.find((item) => item.productId === product.id)
      if (!existing) {
        const item: CartItem = {
          productId: product.id,
          sku: product.sku,
          name: product.name,
          unitPrice: product.price,
          quantity: Math.min(quantity, product.stock),
          stock: product.stock,
        }
        return { items: [...state.items, item] }
      }
      return {
        items: state.items.map((item) =>
          item.productId === product.id
            ? {
                ...item,
                unitPrice: product.price,
                stock: product.stock,
                quantity: Math.min(item.quantity + quantity, product.stock),
              }
            : item,
        ),
      }
    }),

  updateQuantity: (productId, quantity, availableStock) =>
    set((state) => {
      if (quantity <= 0) {
        return { items: state.items.filter((item) => item.productId !== productId) }
      }
      return {
        items: state.items.map((item) => {
          if (item.productId !== productId) {
            return item
          }
          const stock = availableStock ?? item.stock
          return { ...item, stock, quantity: Math.min(quantity, stock) }
        }),
      }
    }),

  removeItem: (productId) =>
    set((state) => ({ items: state.items.filter((item) => item.productId !== productId) })),

  clearCart: () => set({ items: [] }),
})

export const selectCartCount = (state: CartSlice) =>
  state.items.reduce((count, item) => count + item.quantity, 0)

export const selectCartTotal = (state: CartSlice) =>
  fromCents(state.items.reduce((total, item) => total + toCents(item.unitPrice) * item.quantity, 0))
