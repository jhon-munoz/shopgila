import { useQuery } from '@tanstack/react-query'
import { fetchOrderById } from '../../api/orders'
import { orderKeys } from '../../api/queryKeys'

const useGetOrderById = (id: string | undefined) =>
  useQuery({
    queryKey: orderKeys.detail(id ?? ''),
    queryFn: ({ signal }) => fetchOrderById(id as string, signal),
    enabled: Boolean(id),
  })

export default useGetOrderById
