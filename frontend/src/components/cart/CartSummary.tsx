import { PAYMENT_METHODS } from '../../constants/payment'
import { formatCurrency } from '../../utils/money'
import Button from '../reusables/Button'
import Card from '../reusables/Card'
import SelectField from '../reusables/SelectField'

interface CartSummaryProps {
  count: number
  total: number
  paymentToken: string
  canCheckout: boolean
  isPlacing: boolean
  onPaymentTokenChange: (token: string) => void
  onPlaceOrder: () => void
}

function CartSummary({
  count,
  total,
  paymentToken,
  canCheckout,
  isPlacing,
  onPaymentTokenChange,
  onPlaceOrder,
}: CartSummaryProps) {
  return (
    <Card className="p-5 lg:sticky lg:top-24">
      <h2 className="text-lg font-semibold text-slate-900">Order summary</h2>
      <dl className="mt-4 space-y-2 text-sm">
        <div className="flex justify-between">
          <dt className="text-slate-500">Items</dt>
          <dd className="font-medium text-slate-900">{count}</dd>
        </div>
        <div className="flex justify-between border-t border-slate-200 pt-2 text-base">
          <dt className="font-semibold text-slate-900">Total</dt>
          <dd className="font-bold text-slate-900">{formatCurrency(total)}</dd>
        </div>
      </dl>
      <div className="mt-5">
        <SelectField
          id="payment-method"
          label="Payment method"
          hint="Payments are simulated, no real charge is made."
          value={paymentToken}
          onChange={(event) => onPaymentTokenChange(event.target.value)}
        >
          {PAYMENT_METHODS.map((method) => (
            <option key={method.token} value={method.token}>
              {method.label}
            </option>
          ))}
        </SelectField>
      </div>
      <Button className="mt-5 w-full" disabled={!canCheckout} loading={isPlacing} onClick={onPlaceOrder}>
        Place order
      </Button>
    </Card>
  )
}

export default CartSummary
