import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { fetchProducts } from '../../api/products'
import { productKeys } from '../../api/queryKeys'
import type { ProductSearchParams } from '../../types/product'

const useGetProducts = (params: ProductSearchParams) =>
  useQuery({
    queryKey: productKeys.list(params),
    queryFn: ({ signal }) => fetchProducts(params, signal),
    placeholderData: keepPreviousData,
  })

export default useGetProducts
