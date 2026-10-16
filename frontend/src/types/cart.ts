import type { CartItem } from '../store/cartSlice'

export type CartLineStatus = 'ok' | 'insufficient' | 'unavailable' | 'removed'

export interface CartLine {
  item: CartItem
  price: number
  stock: number
  status: CartLineStatus
  previousPrice?: number
}
