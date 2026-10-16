export const PAYMENT_METHODS = [
  { token: 'tok_visa', label: 'Test card - approved' },
  { token: 'tok_declined', label: 'Test card - declined' },
] as const

export const DEFAULT_PAYMENT_TOKEN = PAYMENT_METHODS[0].token
