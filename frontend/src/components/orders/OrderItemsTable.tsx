import type { OrderItem } from '../../types/order'
import { formatCurrency } from '../../utils/money'

interface OrderItemsTableProps {
  items: OrderItem[]
  total: number
}

function OrderItemsTable({ items, total }: OrderItemsTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th scope="col" className="py-2 pr-4 font-medium">
              Product
            </th>
            <th scope="col" className="px-4 py-2 text-right font-medium">
              Unit price
            </th>
            <th scope="col" className="px-4 py-2 text-right font-medium">
              Quantity
            </th>
            <th scope="col" className="py-2 pl-4 text-right font-medium">
              Subtotal
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {items.map((item) => (
            <tr key={item.productId}>
              <td className="py-3 pr-4">
                <p className="font-medium text-slate-900">{item.productName}</p>
                <p className="text-xs text-slate-400">{item.sku}</p>
              </td>
              <td className="px-4 py-3 text-right text-slate-600">{formatCurrency(item.unitPrice)}</td>
              <td className="px-4 py-3 text-right text-slate-600">{item.quantity}</td>
              <td className="py-3 pl-4 text-right font-medium text-slate-900">
                {formatCurrency(item.subtotal)}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t border-slate-200">
            <th scope="row" colSpan={3} className="py-3 pr-4 text-right font-semibold text-slate-900">
              Total
            </th>
            <td className="py-3 pl-4 text-right text-base font-bold text-slate-900">
              {formatCurrency(total)}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}

export default OrderItemsTable
