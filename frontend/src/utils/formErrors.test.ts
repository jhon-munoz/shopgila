import { describe, expect, it } from 'vitest'
import { toFieldErrors } from './formErrors'

describe('toFieldErrors', () => {
  it('maps the field details of the server to their messages', () => {
    expect(toFieldErrors(['name: must not be blank', 'price: must be greater than or equal to 0.00'])).toEqual({
      name: 'must not be blank',
      price: 'must be greater than or equal to 0.00',
    })
  })

  it('keeps the first message of a repeated field and ignores details without a field', () => {
    expect(toFieldErrors(['sku: too long', 'sku: must not be blank', 'something else'])).toEqual({
      sku: 'too long',
    })
  })

  it('returns an empty object without details', () => {
    expect(toFieldErrors([])).toEqual({})
  })
})
