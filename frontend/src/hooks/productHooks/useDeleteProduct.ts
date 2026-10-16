import { useMutation, useQueryClient } from '@tanstack/react-query'
import { deleteProduct } from '../../api/products'
import { productKeys } from '../../api/queryKeys'
import { useStore } from '../../store/store'

const useDeleteProduct = () => {
  const queryClient = useQueryClient()
  const showToast = useStore((state) => state.showToast)

  return useMutation({
    mutationKey: ['delete-product'],
    mutationFn: (id: string) => deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.all })
      showToast('success', 'Product deleted')
    },
  })
}

export default useDeleteProduct
