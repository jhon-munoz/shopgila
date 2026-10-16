import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import CartSummary from './CartSummary'

const setup = (props = {}) => {
  const onPaymentTokenChange = vi.fn()
  const onPlaceOrder = vi.fn()
  render(
    <CartSummary
      count={3}
      total={209.97}
      paymentToken="tok_visa"
      canCheckout
      isPlacing={false}
      onPaymentTokenChange={onPaymentTokenChange}
      onPlaceOrder={onPlaceOrder}
      {...props}
    />,
  )
  return { onPaymentTokenChange, onPlaceOrder }
}

describe('CartSummary', () => {
  it('shows the number of items and the total', () => {
    setup()

    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText('$209.97')).toBeInTheDocument()
  })

  it('offers an approved and a declined test card and explains that payments are simulated', () => {
    setup()

    const options = screen.getAllByRole('option').map((option) => option.textContent)
    expect(options).toEqual(['Test card - approved', 'Test card - declined'])
    expect(screen.getByLabelText('Payment method')).toHaveAccessibleDescription(
      'Payments are simulated, no real charge is made.',
    )
  })

  it('reports the selected payment method', async () => {
    const { onPaymentTokenChange } = setup()

    await userEvent.selectOptions(screen.getByLabelText('Payment method'), 'tok_declined')

    expect(onPaymentTokenChange).toHaveBeenCalledWith('tok_declined')
  })

  it('places the order', async () => {
    const { onPlaceOrder } = setup()

    await userEvent.click(screen.getByRole('button', { name: 'Place order' }))

    expect(onPlaceOrder).toHaveBeenCalledTimes(1)
  })

  it('cannot place the order when checkout is not allowed', () => {
    setup({ canCheckout: false })

    expect(screen.getByRole('button', { name: 'Place order' })).toBeDisabled()
  })

  it('blocks the button while the order is being placed', () => {
    setup({ isPlacing: true })

    expect(screen.getByRole('button', { name: /Place order/ })).toBeDisabled()
  })
})
