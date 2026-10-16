import { useQuery } from '@tanstack/react-query'
import { fetchCategories } from '../../api/products'
import { productKeys } from '../../api/queryKeys'

const CATEGORIES_STALE_TIME_MS = 5 * 60_000

const useGetCategories = () =>
  useQuery({
    queryKey: productKeys.categories(),
    queryFn: ({ signal }) => fetchCategories(signal),
    staleTime: CATEGORIES_STALE_TIME_MS,
  })

export default useGetCategories
