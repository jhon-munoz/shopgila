import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateProduct } from '../../api/products'
import { productKeys } from '../../api/queryKeys'
import { useStore } from '../../store/store'
import type { ProductInput } from '../../types/product'

interface UpdateProductVariables {
  id: string
  input: ProductInput
}

const useUpdateProduct = () => {
  const queryClient = useQueryClient()
  const showToast = useStore((state) => state.showToast)

  return useMutation({
    mutationKey: ['update-product'],
    mutationFn: ({ id, input }: UpdateProductVariables) => updateProduct(id, input),
    onSuccess: (product) => {
      queryClient.invalidateQueries({ queryKey: productKeys.all })
      showToast('success', `Product ${product.sku} updated`)
    },
  })
}

export default useUpdateProduct
