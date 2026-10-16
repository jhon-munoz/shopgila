import { beforeEach, describe, expect, it } from 'vitest'
import { useStore } from './store'

beforeEach(() => {
  useStore.setState({ toasts: [] })
})

describe('toasts', () => {
  it('shows a toast with a unique id', () => {
    useStore.getState().showToast('success', 'Saved')
    useStore.getState().showToast('error', 'Failed')

    const { toasts } = useStore.getState()
    expect(toasts).toHaveLength(2)
    expect(toasts[0]).toMatchObject({ type: 'success', message: 'Saved' })
    expect(toasts[0].id).not.toBe(toasts[1].id)
  })

  it('dismisses only the selected toast', () => {
    useStore.getState().showToast('info', 'First')
    useStore.getState().showToast('info', 'Second')
    const [first] = useStore.getState().toasts

    useStore.getState().dismissToast(first.id)

    expect(useStore.getState().toasts.map((toast) => toast.message)).toEqual(['Second'])
  })
})
