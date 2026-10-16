import { useNavigate, useParams } from 'react-router-dom'
import ProductForm from '../../components/products/ProductForm'
import ErrorBanner from '../../components/reusables/ErrorBanner'
import NoDataPrompt from '../../components/reusables/NoDataPrompt'
import PageHeader from '../../components/reusables/PageHeader'
import Spinner from '../../components/reusables/Spinner'
import { ApiError } from '../../api/utils/request'
import { ROUTES } from '../../constants/routes'
import {
  useCreateProduct,
  useGetCategories,
  useGetProductById,
  useUpdateProduct,
} from '../../hooks'
import type { ProductInput } from '../../types/product'

function ProductFormPage() {
  const { productId } = useParams()
  const navigate = useNavigate()
  const isEditing = Boolean(productId)
  const productQuery = useGetProductById(productId)
  const categoriesQuery = useGetCategories()
  const createProduct = useCreateProduct()
  const updateProduct = useUpdateProduct()
  const mutation = isEditing ? updateProduct : createProduct

  const goToList = () => navigate(ROUTES.ADMIN_PRODUCTS)

  const handleSubmit = (input: ProductInput) => {
    if (productId) {
      updateProduct.mutate({ id: productId, input }, { onSuccess: goToList })
    } else {
      createProduct.mutate(input, { onSuccess: goToList })
    }
  }

  const title = isEditing ? 'Edit product' : 'New product'

  if (isEditing && productQuery.isPending) {
    return (
      <div className="flex justify-center py-16 text-brand-600">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  if (isEditing && productQuery.error instanceof ApiError && productQuery.error.status === 404) {
    return <NoDataPrompt title="Product not found" message="It may have been deleted." />
  }

  if (isEditing && productQuery.error) {
    return <ErrorBanner error={productQuery.error} title="Could not load the product" />
  }

  return (
    <>
      <PageHeader title={title} />
      <ProductForm
        initialProduct={productQuery.data}
        categories={categoriesQuery.data ?? []}
        submitLabel={isEditing ? 'Save changes' : 'Create product'}
        isSubmitting={mutation.isPending}
        error={mutation.error}
        onSubmit={handleSubmit}
        onCancel={goToList}
      />
    </>
  )
}

export default ProductFormPage
