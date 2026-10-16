import { Link, useParams } from 'react-router-dom'
import OrderItemsTable from '../../components/orders/OrderItemsTable'
import Card from '../../components/reusables/Card'
import ErrorBanner from '../../components/reusables/ErrorBanner'
import NoDataPrompt from '../../components/reusables/NoDataPrompt'
import Spinner from '../../components/reusables/Spinner'
import { ApiError } from '../../api/utils/request'
import { ROUTES } from '../../constants/routes'
import { useGetOrderById } from '../../hooks'
import { formatDateTime } from '../../utils/dates'

const shopLink = (
  <Link to={ROUTES.SHOP} className="text-sm font-medium text-brand-600 hover:text-brand-700">
    Continue shopping
  </Link>
)

function OrderConfirmationPage() {
  const { orderId } = useParams()
  const { data: order, error, isPending } = useGetOrderById(orderId)

  if (isPending) {
    return (
      <div className="flex justify-center py-16 text-brand-600">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  if (error instanceof ApiError && error.status === 404) {
    return <NoDataPrompt title="Order not found" message="We could not find that order." action={shopLink} />
  }

  if (error || !order) {
    return <ErrorBanner error={error} title="Could not load the order" />
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Thank you for your order!</h1>
        <p className="mt-1 text-sm text-slate-500">Your payment was approved and your order is confirmed.</p>
      </div>
      <Card className="p-6">
        <dl className="grid gap-4 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-slate-500">Payment reference</dt>
            <dd className="font-semibold text-slate-900">{order.paymentReference}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Date</dt>
            <dd className="font-semibold text-slate-900">{formatDateTime(order.createdAt)}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Order number</dt>
            <dd className="break-all font-semibold text-slate-900">{order.id}</dd>
          </div>
        </dl>
        <div className="mt-6">
          <OrderItemsTable items={order.items} total={order.total} />
        </div>
      </Card>
      <div className="mt-6 text-center">{shopLink}</div>
    </div>
  )
}

export default OrderConfirmationPage
