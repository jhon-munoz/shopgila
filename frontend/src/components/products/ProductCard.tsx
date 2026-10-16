import { useStore } from '../../store/store'
import type { Product } from '../../types/product'
import { formatCurrency } from '../../utils/money'
import Button from '../reusables/Button'
import Card from '../reusables/Card'

const LOW_STOCK_THRESHOLD = 5

interface ProductCardProps {
  product: Product
}

function getStockLabel(stock: number) {
  if (stock <= 0) {
    return { text: 'Out of stock', className: 'text-red-600' }
  }
  if (stock <= LOW_STOCK_THRESHOLD) {
    return { text: `Only ${stock} left`, className: 'text-amber-600' }
  }
  return { text: 'In stock', className: 'text-emerald-600' }
}

function ProductCard({ product }: ProductCardProps) {
  const quantityInCart = useStore(
    (state) => state.items.find((item) => item.productId === product.id)?.quantity ?? 0,
  )
  const addItem = useStore((state) => state.addItem)
  const stockLabel = getStockLabel(product.stock)
  const outOfStock = product.stock <= 0
  const reachedStock = quantityInCart >= product.stock

  const buttonLabel = outOfStock ? 'Out of stock' : reachedStock ? 'Max in cart' : 'Add to cart'

  return (
    <Card className="flex h-full flex-col p-5 transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-700">
          {product.category}
        </span>
        <span className="text-xs text-slate-400">{product.sku}</span>
      </div>
      <h3 className="mt-3 text-base font-semibold text-slate-900">{product.name}</h3>
      {product.description && (
        <p className="mt-1 line-clamp-2 text-sm text-slate-500">{product.description}</p>
      )}
      <div className="mt-auto pt-4">
        <div className="flex items-end justify-between">
          <p className="text-xl font-bold text-slate-900">{formatCurrency(product.price)}</p>
          <p className={`text-xs font-medium ${stockLabel.className}`}>{stockLabel.text}</p>
        </div>
        <Button
          className="mt-3 w-full"
          disabled={outOfStock || reachedStock}
          aria-label={`${buttonLabel}: ${product.name}`}
          onClick={() => addItem(product)}
        >
          {buttonLabel}
        </Button>
        {quantityInCart > 0 && (
          <p className="mt-2 text-center text-xs text-slate-500">In cart: {quantityInCart}</p>
        )}
      </div>
    </Card>
  )
}

export default ProductCard
