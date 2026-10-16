import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import useDebouncedField from './useDebouncedField'

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('useDebouncedField', () => {
  it('starts with the given value without committing it', () => {
    const onCommit = vi.fn()

    const { result } = renderHook(() => useDebouncedField('mouse', onCommit))

    expect(result.current[0]).toBe('mouse')
    act(() => {
      vi.advanceTimersByTime(1000)
    })
    expect(onCommit).not.toHaveBeenCalled()
  })

  it('commits the typed value only after the delay', () => {
    const onCommit = vi.fn()
    const { result } = renderHook(() => useDebouncedField('', onCommit, 300))

    act(() => result.current[1]('mou'))
    act(() => {
      vi.advanceTimersByTime(299)
    })
    expect(onCommit).not.toHaveBeenCalled()

    act(() => {
      vi.advanceTimersByTime(1)
    })
    expect(onCommit).toHaveBeenCalledExactlyOnceWith('mou')
  })

  it('commits only the last value when typing quickly', () => {
    const onCommit = vi.fn()
    const { result } = renderHook(() => useDebouncedField('', onCommit, 300))

    act(() => result.current[1]('m'))
    act(() => {
      vi.advanceTimersByTime(200)
    })
    act(() => result.current[1]('mo'))
    act(() => {
      vi.advanceTimersByTime(200)
    })
    act(() => result.current[1]('mou'))
    act(() => {
      vi.advanceTimersByTime(300)
    })

    expect(onCommit).toHaveBeenCalledExactlyOnceWith('mou')
  })

  it('follows changes of the value made from outside', () => {
    const onCommit = vi.fn()
    const { result, rerender } = renderHook(({ value }) => useDebouncedField(value, onCommit), {
      initialProps: { value: 'mouse' },
    })

    rerender({ value: '' })

    expect(result.current[0]).toBe('')
    act(() => {
      vi.advanceTimersByTime(1000)
    })
    expect(onCommit).not.toHaveBeenCalled()
  })

  it('allows typing the same text again after an external reset', () => {
    const onCommit = vi.fn()
    const { result, rerender } = renderHook(({ value }) => useDebouncedField(value, onCommit, 300), {
      initialProps: { value: '' },
    })
    act(() => result.current[1]('mou'))
    act(() => {
      vi.advanceTimersByTime(300)
    })
    rerender({ value: 'mou' })
    rerender({ value: '' })
    onCommit.mockClear()

    act(() => result.current[1]('mou'))
    act(() => {
      vi.advanceTimersByTime(300)
    })

    expect(onCommit).toHaveBeenCalledExactlyOnceWith('mou')
  })

  it('does not commit the same value twice while the value is catching up', () => {
    const onCommit = vi.fn()
    const { result, rerender } = renderHook(({ value }) => useDebouncedField(value, onCommit, 300), {
      initialProps: { value: '' },
    })

    act(() => result.current[1]('mou'))
    act(() => {
      vi.advanceTimersByTime(300)
    })
    rerender({ value: '' })
    act(() => {
      vi.advanceTimersByTime(1000)
    })

    expect(onCommit).toHaveBeenCalledTimes(1)
  })

  it('keeps what the user typed after a commit comes back as the value', () => {
    const onCommit = vi.fn()
    const { result, rerender } = renderHook(({ value }) => useDebouncedField(value, onCommit, 300), {
      initialProps: { value: '' },
    })

    act(() => result.current[1]('mo'))
    act(() => {
      vi.advanceTimersByTime(300)
    })
    act(() => result.current[1]('mou'))
    rerender({ value: 'mo' })

    expect(result.current[0]).toBe('mou')
  })
})
