import { useMutation, useQueryClient } from '@tanstack/react-query'
import { placeOrder } from '../../api/orders'
import { orderKeys, productKeys } from '../../api/queryKeys'
import { useStore } from '../../store/store'
import { ApiError } from '../../api/utils/request'
import type { OrderRequest } from '../../types/order'

const usePlaceOrder = () => {
  const queryClient = useQueryClient()
  const clearCart = useStore((state) => state.clearCart)
  const showToast = useStore((state) => state.showToast)

  return useMutation({
    mutationKey: ['place-order'],
    mutationFn: (order: OrderRequest) => placeOrder(order),
    onSuccess: (order) => {
      queryClient.setQueryData(orderKeys.detail(order.id), order)
      queryClient.invalidateQueries({ queryKey: productKeys.all })
      clearCart()
      showToast('success', 'Order placed successfully')
    },
    onError: (error) => {
      if (error instanceof ApiError && error.status === 409) {
        queryClient.invalidateQueries({ queryKey: productKeys.all })
      }
    },
  })
}

export default usePlaceOrder
