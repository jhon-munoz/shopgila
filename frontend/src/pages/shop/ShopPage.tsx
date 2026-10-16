import { useSearchParams } from 'react-router-dom'
import ProductCard from '../../components/products/ProductCard'
import ProductCardSkeleton from '../../components/products/ProductCardSkeleton'
import SearchFilters from '../../components/products/SearchFilters'
import Button from '../../components/reusables/Button'
import ErrorBanner from '../../components/reusables/ErrorBanner'
import NoDataPrompt from '../../components/reusables/NoDataPrompt'
import PageHeader from '../../components/reusables/PageHeader'
import Pagination from '../../components/reusables/Pagination'
import { useGetCategories, useGetProducts } from '../../hooks'
import {
  PAGE_SIZE,
  hasActiveFilters,
  parseFilters,
  toProductSearchParams,
  toSearchParams,
  type ShopFilters,
} from '../../utils/queryParams'

const TEXT_FILTERS: ReadonlyArray<keyof ShopFilters> = ['q', 'minPrice', 'maxPrice']

function ShopPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const filters = parseFilters(searchParams)
  const productsQuery = useGetProducts(toProductSearchParams(filters))
  const categoriesQuery = useGetCategories()
  const canClear = hasActiveFilters(filters)

  const updateFilters = (changes: Partial<ShopFilters>) => {
    const resetsPage = !('page' in changes)
    const next = { ...filters, ...changes, ...(resetsPage ? { page: 0 } : {}) }
    const isTyping = Object.keys(changes).every((key) => TEXT_FILTERS.includes(key as keyof ShopFilters))
    setSearchParams(toSearchParams(next), { replace: isTyping })
  }

  const clearFilters = () => setSearchParams(new URLSearchParams())

  const renderResults = () => {
    if (productsQuery.isPending) {
      return (
        <div
          aria-busy="true"
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        >
          {Array.from({ length: PAGE_SIZE }, (_, index) => (
            <ProductCardSkeleton key={index} />
          ))}
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

    const { content, totalElements, totalPages, page } = productsQuery.data
    if (content.length === 0) {
      return (
        <NoDataPrompt
          title="No products found"
          message={canClear ? 'Try changing or clearing the filters.' : 'There are no products yet.'}
          action={
            canClear ? (
              <Button variant="secondary" onClick={clearFilters}>
                Clear filters
              </Button>
            ) : undefined
          }
        />
      )
    }

    return (
      <div className={productsQuery.isPlaceholderData ? 'opacity-60 transition-opacity' : undefined}>
        <p className="mb-4 text-sm text-slate-500">
          {totalElements} {totalElements === 1 ? 'product' : 'products'}
        </p>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {content.map((product) => (
            <li key={product.id}>
              <ProductCard product={product} />
            </li>
          ))}
        </ul>
        <Pagination page={page} totalPages={totalPages} onPageChange={(next) => updateFilters({ page: next })} />
      </div>
    )
  }

  return (
    <>
      <PageHeader title="Shop" description="Find products and add them to your cart." />
      <SearchFilters
        filters={filters}
        categories={categoriesQuery.data ?? []}
        onChange={updateFilters}
        onClear={clearFilters}
        canClear={canClear}
      />
      {renderResults()}
    </>
  )
}

export default ShopPage
