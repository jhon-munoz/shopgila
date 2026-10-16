import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import CartItemRow from '../../components/cart/CartItemRow'
import CartSummary from '../../components/cart/CartSummary'
import ErrorBanner from '../../components/reusables/ErrorBanner'
import NoDataPrompt from '../../components/reusables/NoDataPrompt'
import PageHeader from '../../components/reusables/PageHeader'
import { ApiError } from '../../api/utils/request'
import { DEFAULT_PAYMENT_TOKEN } from '../../constants/payment'
import { ROUTES, getOrderPath } from '../../constants/routes'
import { useCartItems, usePlaceOrder } from '../../hooks'
import { useStore } from '../../store/store'

const getErrorTitle = (error: unknown) => {
  if (error instanceof ApiError) {
    switch (error.status) {
      case 402:
        return 'Payment declined'
      case 404:
        return 'A product is no longer available'
      case 409:
        return 'Not enough stock'
    }
  }
  return 'Could not place the order'
}

function CartPage() {
  const navigate = useNavigate()
  const { lines, count, total, canCheckout } = useCartItems()
  const placeOrder = usePlaceOrder()
  const updateQuantity = useStore((state) => state.updateQuantity)
  const removeItem = useStore((state) => state.removeItem)
  const [paymentToken, setPaymentToken] = useState<string>(DEFAULT_PAYMENT_TOKEN)

  if (placeOrder.isSuccess) {
    return null
  }

  if (lines.length === 0) {
    return (
      <>
        <PageHeader title="Your cart" />
        <NoDataPrompt
          title="Your cart is empty"
          message="Add some products to get started."
          action={
            <Link to={ROUTES.SHOP} className="text-sm font-medium text-brand-600 hover:text-brand-700">
              Browse the shop
            </Link>
          }
        />
      </>
    )
  }

  const handlePlaceOrder = () =>
    placeOrder.mutate(
      {
        paymentToken,
        items: lines.map((line) => ({ productId: line.item.productId, quantity: line.item.quantity })),
      },
      { onSuccess: (order) => navigate(getOrderPath(order.id)) },
    )

  const handlePaymentTokenChange = (token: string) => {
    placeOrder.reset()
    setPaymentToken(token)
  }

  return (
    <>
      <PageHeader title="Your cart" description="Review your items and place the order." />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <ErrorBanner error={placeOrder.error} title={getErrorTitle(placeOrder.error)} />
          {lines.map((line) => (
            <CartItemRow
              key={line.item.productId}
              line={line}
              onQuantityChange={(quantity, stock) => updateQuantity(line.item.productId, quantity, stock)}
              onRemove={() => removeItem(line.item.productId)}
            />
          ))}
        </div>
        <CartSummary
          count={count}
          total={total}
          paymentToken={paymentToken}
          canCheckout={canCheckout}
          isPlacing={placeOrder.isPending}
          onPaymentTokenChange={handlePaymentTokenChange}
          onPlaceOrder={handlePlaceOrder}
        />
      </div>
    </>
  )
}

export default CartPage
