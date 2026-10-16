import type { CartLine } from '../../types/cart'
import { formatCurrency, fromCents, toCents } from '../../utils/money'
import Button from '../reusables/Button'
import Card from '../reusables/Card'
import { fieldClasses } from '../reusables/fieldUtils'

interface CartItemRowProps {
  line: CartLine
  onQuantityChange: (quantity: number, availableStock: number) => void
  onRemove: () => void
}

function getIssue(line: CartLine) {
  switch (line.status) {
    case 'removed':
      return 'This product is no longer available. Remove it to continue.'
    case 'unavailable':
      return 'This product is out of stock. Remove it to continue.'
    case 'insufficient':
      return `Only ${line.stock} available. Reduce the quantity to continue.`
    default:
      return null
  }
}

function CartItemRow({ line, onQuantityChange, onRemove }: CartItemRowProps) {
  const { item, price, stock, previousPrice } = line
  const issue = getIssue(line)
  const canEditQuantity = line.status === 'ok' || line.status === 'insufficient'
  const subtotal = fromCents(toCents(price) * item.quantity)

  return (
    <Card className="p-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold text-slate-900">{item.name}</h2>
          <p className="text-xs text-slate-400">{item.sku}</p>
          <p className="mt-1 text-sm text-slate-600">{formatCurrency(price)} each</p>
          {previousPrice !== undefined && (
            <p className="mt-1 text-xs font-medium text-amber-600">
              Price changed from {formatCurrency(previousPrice)} to {formatCurrency(price)}
            </p>
          )}
        </div>
        <p className="text-lg font-bold text-slate-900">{formatCurrency(subtotal)}</p>
      </div>
      {issue && (
        <p role="alert" className="mt-3 text-sm font-medium text-red-600">
          {issue}
        </p>
      )}
      <div className="mt-4 flex items-center justify-between gap-4">
        {canEditQuantity ? (
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              aria-label={`Decrease quantity of ${item.name}`}
              onClick={() => onQuantityChange(item.quantity - 1, stock)}
            >
              −
            </Button>
            <input
              type="number"
              min={1}
              max={stock}
              value={item.quantity}
              aria-label={`Quantity of ${item.name}`}
              onChange={(event) => {
                const quantity = Number.parseInt(event.target.value, 10)
                if (Number.isInteger(quantity)) {
                  onQuantityChange(quantity, stock)
                }
              }}
              className={`${fieldClasses} w-16 text-center`}
            />
            <Button
              variant="secondary"
              size="sm"
              aria-label={`Increase quantity of ${item.name}`}
              disabled={item.quantity >= stock}
              onClick={() => onQuantityChange(item.quantity + 1, stock)}
            >
              +
            </Button>
          </div>
        ) : (
          <span />
        )}
        <Button variant="ghost" size="sm" aria-label={`Remove ${item.name}`} onClick={onRemove}>
          Remove
        </Button>
      </div>
    </Card>
  )
}

export default CartItemRow
