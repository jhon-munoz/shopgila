import { describe, expect, it } from 'vitest'
import { formatCurrency, fromCents, toCents } from './money'

describe('money', () => {
  it('formats a value as US dollars', () => {
    expect(formatCurrency(1299.5)).toBe('$1,299.50')
    expect(formatCurrency(0)).toBe('$0.00')
  })

  it('converts to cents without floating point errors', () => {
    expect(toCents(0.1 + 0.2)).toBe(30)
    expect(toCents(89.99)).toBe(8999)
    expect(toCents(19.99)).toBe(1999)
  })

  it('converts cents back to a value', () => {
    expect(fromCents(8999)).toBe(89.99)
  })
})
