export interface OrderItemRequest {
  productId: string
  quantity: number
}

export interface OrderRequest {
  paymentToken: string
  items: OrderItemRequest[]
}

export interface OrderItem {
  productId: string
  sku: string
  productName: string
  unitPrice: number
  quantity: number
  subtotal: number
}

export interface Order {
  id: string
  total: number
  paymentReference: string
  createdAt: string
  items: OrderItem[]
}
