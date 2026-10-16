import type { Order } from '../types/order'
import type { Product, ProductInput } from '../types/product'

export const productFixture: Product = {
  id: 'product-1',
  name: 'Running Shoes',
  sku: 'RS-001',
  description: 'Lightweight shoes',
  category: 'Footwear',
  price: 89.99,
  stock: 10,
  weightKg: 0.35,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
}

export const productInputFixture: ProductInput = {
  name: 'Running Shoes',
  sku: 'RS-001',
  description: null,
  category: 'Footwear',
  price: 89.99,
  stock: 10,
  weightKg: null,
}

export const orderFixture: Order = {
  id: 'order-1',
  total: 179.98,
  paymentReference: 'PAY-ABC12345',
  createdAt: '2026-01-01T00:00:00Z',
  items: [
    {
      productId: 'product-1',
      sku: 'RS-001',
      productName: 'Running Shoes',
      unitPrice: 89.99,
      quantity: 2,
      subtotal: 179.98,
    },
  ],
}
