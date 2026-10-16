import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createProduct } from '../../api/products'
import { productKeys } from '../../api/queryKeys'
import { useStore } from '../../store/store'
import type { ProductInput } from '../../types/product'

const useCreateProduct = () => {
  const queryClient = useQueryClient()
  const showToast = useStore((state) => state.showToast)

  return useMutation({
    mutationKey: ['create-product'],
    mutationFn: (input: ProductInput) => createProduct(input),
    onSuccess: (product) => {
      queryClient.invalidateQueries({ queryKey: productKeys.all })
      showToast('success', `Product ${product.sku} created`)
    },
  })
}

export default useCreateProduct
