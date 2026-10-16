import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useStore } from '../../store/store'
import ToastContainer from './ToastContainer'

beforeEach(() => {
  useStore.setState({ toasts: [] })
})

afterEach(() => {
  vi.useRealTimers()
})

describe('ToastContainer', () => {
  it('shows the notifications of the store', () => {
    useStore.getState().showToast('success', 'Product created')
    useStore.getState().showToast('error', 'Something failed')

    render(<ToastContainer />)

    expect(screen.getByText('Product created')).toBeInTheDocument()
    expect(screen.getByText('Something failed')).toBeInTheDocument()
  })

  it('dismisses a notification with its button', async () => {
    useStore.getState().showToast('info', 'Hello')
    render(<ToastContainer />)

    await userEvent.click(screen.getByRole('button', { name: 'Dismiss notification' }))

    expect(screen.queryByText('Hello')).not.toBeInTheDocument()
    expect(useStore.getState().toasts).toEqual([])
  })

  it('dismisses a notification automatically after four seconds', () => {
    vi.useFakeTimers()
    useStore.getState().showToast('success', 'Saved')
    render(<ToastContainer />)

    act(() => {
      vi.advanceTimersByTime(3900)
    })
    expect(screen.getByText('Saved')).toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(200)
    })
    expect(screen.queryByText('Saved')).not.toBeInTheDocument()
  })

  it('announces notifications politely', () => {
    const { container } = render(<ToastContainer />)

    expect(container.firstChild).toHaveAttribute('aria-live', 'polite')
  })
})
