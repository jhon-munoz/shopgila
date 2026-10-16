import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_SORT, type ShopFilters } from '../../utils/queryParams'
import SearchFilters from './SearchFilters'

const filters: ShopFilters = {
  q: '',
  category: '',
  minPrice: '',
  maxPrice: '',
  inStockOnly: false,
  sort: DEFAULT_SORT,
  page: 0,
}

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true })
})

afterEach(() => {
  vi.useRealTimers()
})

const setup = (overrides: Partial<ShopFilters> = {}, canClear = false) => {
  const onChange = vi.fn()
  const onClear = vi.fn()
  const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
  render(
    <SearchFilters
      filters={{ ...filters, ...overrides }}
      categories={['Books', 'Footwear']}
      onChange={onChange}
      onClear={onClear}
      canClear={canClear}
    />,
  )
  return { user, onChange, onClear }
}

describe('SearchFilters', () => {
  it('shows the categories of the api plus an option for all of them', () => {
    setup()

    const options = screen.getAllByRole('option', { name: /All categories|Books|Footwear/ })
    expect(options.map((option) => option.textContent)).toEqual(['All categories', 'Books', 'Footwear'])
  })

  it('shows the current filters', () => {
    setup({ q: 'mouse', category: 'Books', minPrice: '5', maxPrice: '20', inStockOnly: true })

    expect(screen.getByLabelText('Search')).toHaveValue('mouse')
    expect(screen.getByLabelText('Category')).toHaveValue('Books')
    expect(screen.getByLabelText('Min price')).toHaveValue(5)
    expect(screen.getByLabelText('Max price')).toHaveValue(20)
    expect(screen.getByLabelText('In stock only')).toBeChecked()
  })

  it('reports the search text only after the user stops typing', async () => {
    const { user, onChange } = setup()

    await user.type(screen.getByLabelText('Search'), 'mouse')
    expect(onChange).not.toHaveBeenCalled()

    vi.advanceTimersByTime(300)

    expect(onChange).toHaveBeenCalledExactlyOnceWith({ q: 'mouse' })
  })

  it('reports the price range after the delay', async () => {
    const { user, onChange } = setup()

    await user.type(screen.getByLabelText('Min price'), '10')
    await user.type(screen.getByLabelText('Max price'), '50')
    vi.advanceTimersByTime(300)

    expect(onChange).toHaveBeenCalledWith({ minPrice: '10' })
    expect(onChange).toHaveBeenCalledWith({ maxPrice: '50' })
  })

  it('reports the category immediately', async () => {
    const { user, onChange } = setup()

    await user.selectOptions(screen.getByLabelText('Category'), 'Footwear')

    expect(onChange).toHaveBeenCalledWith({ category: 'Footwear' })
  })

  it('reports the stock checkbox immediately', async () => {
    const { user, onChange } = setup()

    await user.click(screen.getByLabelText('In stock only'))

    expect(onChange).toHaveBeenCalledWith({ inStockOnly: true })
  })

  it('reports the sort order immediately', async () => {
    const { user, onChange } = setup()

    await user.selectOptions(screen.getByLabelText('Sort by'), 'price,desc')

    expect(onChange).toHaveBeenCalledWith({ sort: 'price,desc' })
  })

  it('clears the filters when allowed', async () => {
    const { user, onClear } = setup({ q: 'mouse' }, true)

    await user.click(screen.getByRole('button', { name: 'Clear filters' }))

    expect(onClear).toHaveBeenCalledTimes(1)
  })

  it('disables clearing when there is nothing to clear', () => {
    setup()

    expect(screen.getByRole('button', { name: 'Clear filters' })).toBeDisabled()
  })
})
