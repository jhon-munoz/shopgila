import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import TextField from './TextField'

describe('TextField', () => {
  it('associates the label with the input', () => {
    render(<TextField id="name" label="Name" />)

    expect(screen.getByLabelText('Name')).toBeInTheDocument()
  })

  it('shows the hint and links it to the input', () => {
    render(<TextField id="sku" label="SKU" hint="Unique code" />)

    expect(screen.getByLabelText('SKU')).toHaveAccessibleDescription('Unique code')
  })

  it('marks the input as invalid and announces the error', () => {
    render(<TextField id="name" label="Name" error="must not be blank" hint="Product name" />)

    const input = screen.getByLabelText('Name')
    expect(input).toBeInvalid()
    expect(input).toHaveAccessibleDescription('must not be blank')
    expect(screen.getByRole('alert')).toHaveTextContent('must not be blank')
    expect(screen.queryByText('Product name')).not.toBeInTheDocument()
  })

  it('does not mark the input as invalid without an error', () => {
    render(<TextField id="name" label="Name" />)

    expect(screen.getByLabelText('Name')).toBeValid()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('forwards the native input props', () => {
    render(<TextField id="price" label="Price" type="number" min={0} step="0.01" required />)

    expect(screen.getByLabelText('Price')).toHaveAttribute('type', 'number')
    expect(screen.getByLabelText('Price')).toBeRequired()
  })
})
