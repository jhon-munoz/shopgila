const currencyFormatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })

export const formatCurrency = (value: number) => currencyFormatter.format(value)

export const toCents = (value: number) => Math.round(value * 100)

export const fromCents = (cents: number) => cents / 100
