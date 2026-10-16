import { useQuery } from '@tanstack/react-query'
import { fetchProductById } from '../../api/products'
import { productKeys } from '../../api/queryKeys'

const useGetProductById = (id: string | undefined) =>
  useQuery({
    queryKey: productKeys.detail(id ?? ''),
    queryFn: ({ signal }) => fetchProductById(id as string, signal),
    enabled: Boolean(id),
  })

export default useGetProductById
