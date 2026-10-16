import { useQueries } from '@tanstack/react-query'
import { fetchProductById } from '../../api/products'
import { productKeys } from '../../api/queryKeys'
import { ApiError } from '../../api/utils/request'
import { useStore } from '../../store/store'
import type { CartLine } from '../../types/cart'
import type { Product } from '../../types/product'
import { fromCents, toCents } from '../../utils/money'
import type { CartItem } from '../../store/cartSlice'

const isNotFound = (error: unknown) => error instanceof ApiError && error.status === 404

function toLine(item: CartItem, product: Product | undefined, error: unknown): CartLine {
  if (isNotFound(error)) {
    return { item, price: item.unitPrice, stock: 0, status: 'removed' }
  }
  if (!product) {
    return { item, price: item.unitPrice, stock: item.stock, status: 'ok' }
  }
  const previousPrice = product.price !== item.unitPrice ? item.unitPrice : undefined
  if (product.stock <= 0) {
    return { item, price: product.price, stock: 0, status: 'unavailable', previousPrice }
  }
  const status = item.quantity > product.stock ? 'insufficient' : 'ok'
  return { item, price: product.price, stock: product.stock, status, previousPrice }
}

const useCartItems = () => {
  const items = useStore((state) => state.items)
  const queries = useQueries({
    queries: items.map((item) => ({
      queryKey: productKeys.detail(item.productId),
      queryFn: ({ signal }: { signal: AbortSignal }) => fetchProductById(item.productId, signal),
      staleTime: 0,
    })),
  })

  const lines = items.map((item, index) => toLine(item, queries[index]?.data, queries[index]?.error))
  const isLoading = queries.some((query) => query.isPending)
  const count = lines.reduce((total, line) => total + line.item.quantity, 0)
  const total = fromCents(
    lines.reduce((sum, line) => sum + toCents(line.price) * line.item.quantity, 0),
  )
  const canCheckout = lines.length > 0 && !isLoading && lines.every((line) => line.status === 'ok')

  return { lines, count, total, isLoading, canCheckout }
}

export default useCartItems
