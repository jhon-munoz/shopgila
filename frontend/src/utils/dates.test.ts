import { describe, expect, it } from 'vitest'
import { formatDateTime } from './dates'

describe('formatDateTime', () => {
  it('formats an ISO date with the day, the month and the time', () => {
    const formatted = formatDateTime('2026-03-15T10:30:00Z')

    expect(formatted).toMatch(/^Mar 1[45], 2026/)
    expect(formatted).toMatch(/\d{1,2}:\d{2}\s?(AM|PM)$/)
  })
})
