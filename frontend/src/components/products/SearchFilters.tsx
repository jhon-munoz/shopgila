import useDebouncedField from '../../hooks/customHooks/useDebouncedField'
import { SORT_OPTIONS, type ShopFilters } from '../../utils/queryParams'
import Button from '../reusables/Button'
import Card from '../reusables/Card'
import SelectField from '../reusables/SelectField'
import TextField from '../reusables/TextField'

interface SearchFiltersProps {
  filters: ShopFilters
  categories: string[]
  onChange: (changes: Partial<ShopFilters>) => void
  onClear: () => void
  canClear: boolean
}

interface DebouncedTextFieldProps {
  id: string
  label: string
  value: string
  onCommit: (value: string) => void
  type?: string
  placeholder?: string
  min?: number
  step?: string
}

function DebouncedTextField({ value, onCommit, ...rest }: DebouncedTextFieldProps) {
  const [local, setLocal] = useDebouncedField(value, onCommit)

  return <TextField value={local} onChange={(event) => setLocal(event.target.value)} {...rest} />
}

function SearchFilters({ filters, categories, onChange, onClear, canClear }: SearchFiltersProps) {
  return (
    <Card className="mb-6 p-4">
      <form role="search" aria-label="Product filters" onSubmit={(event) => event.preventDefault()}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <DebouncedTextField
            id="filter-search"
            label="Search"
            type="search"
            placeholder="Name, SKU or description"
            value={filters.q}
            onCommit={(q) => onChange({ q })}
          />
          <SelectField
            id="filter-category"
            label="Category"
            value={filters.category}
            onChange={(event) => onChange({ category: event.target.value })}
          >
            <option value="">All categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </SelectField>
          <DebouncedTextField
            id="filter-min-price"
            label="Min price"
            type="number"
            min={0}
            step="0.01"
            value={filters.minPrice}
            onCommit={(minPrice) => onChange({ minPrice })}
          />
          <DebouncedTextField
            id="filter-max-price"
            label="Max price"
            type="number"
            min={0}
            step="0.01"
            value={filters.maxPrice}
            onCommit={(maxPrice) => onChange({ maxPrice })}
          />
        </div>
        <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={filters.inStockOnly}
              onChange={(event) => onChange({ inStockOnly: event.target.checked })}
              className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            />
            In stock only
          </label>
          <div className="flex items-end gap-3">
            <div className="w-56">
              <SelectField
                id="filter-sort"
                label="Sort by"
                value={filters.sort}
                onChange={(event) => onChange({ sort: event.target.value })}
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </SelectField>
            </div>
            <Button variant="ghost" onClick={onClear} disabled={!canClear}>
              Clear filters
            </Button>
          </div>
        </div>
      </form>
    </Card>
  )
}

export default SearchFilters
