import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import ConfirmDialog from './ConfirmDialog'

const renderDialog = (props = {}) => {
  const onConfirm = vi.fn()
  const onCancel = vi.fn()
  render(
    <ConfirmDialog
      open
      title="Delete product"
      message="This cannot be undone"
      confirmLabel="Delete"
      onConfirm={onConfirm}
      onCancel={onCancel}
      {...props}
    />,
  )
  return { onConfirm, onCancel }
}

describe('ConfirmDialog', () => {
  it('renders nothing when closed', () => {
    renderDialog({ open: false })

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('shows an accessible dialog with the title and message', () => {
    renderDialog()

    expect(screen.getByRole('dialog', { name: 'Delete product' })).toBeInTheDocument()
    expect(screen.getByText('This cannot be undone')).toBeInTheDocument()
  })

  it('focuses the cancel button first', () => {
    renderDialog()

    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus()
  })

  it('confirms and cancels with the buttons', async () => {
    const { onConfirm, onCancel } = renderDialog()

    await userEvent.click(screen.getByRole('button', { name: 'Delete' }))
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(onConfirm).toHaveBeenCalledTimes(1)
    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('cancels with the Escape key', async () => {
    const { onCancel } = renderDialog()

    await userEvent.keyboard('{Escape}')

    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('blocks the confirm button while loading', () => {
    renderDialog({ loading: true })

    expect(screen.getByRole('button', { name: /Delete/ })).toBeDisabled()
  })
})
