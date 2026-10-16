import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import Button from '../../components/reusables/Button'
import Card from '../../components/reusables/Card'
import ConfirmDialog from '../../components/reusables/ConfirmDialog'
import ErrorBanner from '../../components/reusables/ErrorBanner'
import NoDataPrompt from '../../components/reusables/NoDataPrompt'
import PageHeader from '../../components/reusables/PageHeader'
import Pagination from '../../components/reusables/Pagination'
import Spinner from '../../components/reusables/Spinner'
import TextField from '../../components/reusables/TextField'
import { ApiError } from '../../api/utils/request'
import { ROUTES, getProductEditPath } from '../../constants/routes'
import useDebouncedField from '../../hooks/customHooks/useDebouncedField'
import { useDeleteProduct, useGetProducts } from '../../hooks'
import type { Product } from '../../types/product'
import { formatCurrency } from '../../utils/money'

const PAGE_SIZE = 10
const DELETE_CONFLICT_MESSAGE = 'This product cannot be deleted because it is part of existing orders.'

function AdminProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const q = searchParams.get('q') ?? ''
  const pageParam = Number.parseInt(searchParams.get('page') ?? '', 10)
  const page = Number.isInteger(pageParam) && pageParam >= 1 ? pageParam - 1 : 0
  const [productToDelete, setProductToDelete] = useState<Product | null>(null)

  const productsQuery = useGetProducts({ q: q || undefined, page, size: PAGE_SIZE, sort: 'name,asc' })
  const deleteProduct = useDeleteProduct()

  const updateParams = (next: { q?: string; page?: number }, replace = false) => {
    const params = new URLSearchParams()
    const nextQ = next.q ?? q
    const nextPage = next.page ?? page
    if (nextQ) params.set('q', nextQ)
    if (nextPage > 0) params.set('page', String(nextPage + 1))
    setSearchParams(params, { replace })
  }

  const [searchText, setSearchText] = useDebouncedField(q, (value) => updateParams({ q: value, page: 0 }, true))

  const confirmDelete = () => {
    if (!productToDelete) return
    deleteProduct.mutate(productToDelete.id, { onSettled: () => setProductToDelete(null) })
  }

  const deleteError =
    deleteProduct.error instanceof ApiError && deleteProduct.error.status === 409
      ? new Error(DELETE_CONFLICT_MESSAGE)
      : deleteProduct.error

  const renderTable = () => {
    if (productsQuery.isPending) {
      return (
        <div className="flex justify-center py-16 text-brand-600">
          <Spinner className="h-8 w-8" />
        </div>
      )
    }
    if (productsQuery.isError) {
      return (
        <div className="space-y-4">
          <ErrorBanner error={productsQuery.error} title="Could not load the products" />
          <Button variant="secondary" onClick={() => productsQuery.refetch()}>
            Try again
          </Button>
        </div>
      )
    }
    const { content, totalPages, totalElements } = productsQuery.data
    if (content.length === 0) {
      return <NoDataPrompt title="No products found" message={q ? 'Try a different search.' : 'Create a product or import a CSV.'} />
    }
    return (
      <>
        <Card className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium">Product</th>
                <th scope="col" className="px-4 py-3 font-medium">Category</th>
                <th scope="col" className="px-4 py-3 text-right font-medium">Price</th>
                <th scope="col" className="px-4 py-3 text-right font-medium">Stock</th>
                <th scope="col" className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {content.map((product) => (
                <tr key={product.id}>
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900">{product.name}</p>
                    <p className="text-xs text-slate-400">{product.sku}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{product.category}</td>
                  <td className="px-4 py-3 text-right text-slate-900">{formatCurrency(product.price)}</td>
                  <td className={`px-4 py-3 text-right ${product.stock === 0 ? 'font-medium text-red-600' : 'text-slate-600'}`}>
                    {product.stock}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <Link
                        to={getProductEditPath(product.id)}
                        aria-label={`Edit ${product.name}`}
                        className="rounded-lg px-3 py-1.5 text-sm font-medium text-brand-600 hover:bg-brand-50"
                      >
                        Edit
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-label={`Delete ${product.name}`}
                        onClick={() => {
                          deleteProduct.reset()
                          setProductToDelete(product)
                        }}
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
        <p className="mt-3 text-sm text-slate-500">{totalElements} products</p>
        <Pagination page={page} totalPages={totalPages} onPageChange={(next) => updateParams({ page: next })} />
      </>
    )
  }

  return (
    <>
      <PageHeader
        title="Products"
        description="Create, edit and delete the products of the catalog."
        actions={
          <Link
            to={ROUTES.ADMIN_PRODUCT_NEW}
            className="inline-flex items-center rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-brand-700"
          >
            New product
          </Link>
        }
      />
      <div className="mb-4 max-w-sm">
        <TextField
          id="admin-search"
          label="Search"
          type="search"
          placeholder="Name, SKU or description"
          value={searchText}
          onChange={(event) => setSearchText(event.target.value)}
        />
      </div>
      <div className="mb-4">
        <ErrorBanner error={deleteError} title="Could not delete the product" />
      </div>
      {renderTable()}
      <ConfirmDialog
        open={productToDelete !== null}
        title="Delete product"
        message={`Delete ${productToDelete?.name ?? 'this product'}? This cannot be undone.`}
        confirmLabel="Delete"
        loading={deleteProduct.isPending}
        onConfirm={confirmDelete}
        onCancel={() => setProductToDelete(null)}
      />
    </>
  )
}

export default AdminProductsPage
