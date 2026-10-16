import { useMutation, useQueryClient } from '@tanstack/react-query'
import { importProducts } from '../../api/products'
import { productKeys } from '../../api/queryKeys'
import { useStore } from '../../store/store'

const useImportProducts = () => {
  const queryClient = useQueryClient()
  const showToast = useStore((state) => state.showToast)

  return useMutation({
    mutationKey: ['import-products'],
    mutationFn: (file: File) => importProducts(file),
    onSuccess: (report) => {
      queryClient.invalidateQueries({ queryKey: productKeys.all })
      showToast(
        'success',
        `Import finished: ${report.created} created, ${report.updated} updated, ${report.failed} failed`,
      )
    },
  })
}

export default useImportProducts
