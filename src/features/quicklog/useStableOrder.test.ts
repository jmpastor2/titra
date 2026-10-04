import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useStableOrder } from './useStableOrder'

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

type Props = { target: string[]; ready: boolean }

function setup(initial: Props) {
  return renderHook(({ target, ready }: Props) => useStableOrder(target, ready, 1000), {
    initialProps: initial,
  })
}

describe('useStableOrder', () => {
  it('follows the target while it is not ready', () => {
    const { result, rerender } = setup({ target: ['a', 'b'], ready: false })
    expect(result.current.order).toEqual(['a', 'b'])
    rerender({ target: ['b', 'a'], ready: false })
    expect(result.current.order).toEqual(['b', 'a'])
  })

  it('applies the first order at once and a later one when nobody is tapping', () => {
    const { result, rerender } = setup({ target: ['a', 'b'], ready: true })
    expect(result.current.order).toEqual(['a', 'b'])
    rerender({ target: ['b', 'a'], ready: true })
    // No recent tap: the new order lands straight away.
    expect(result.current.order).toEqual(['b', 'a'])
  })

  it('holds a new order while the person keeps tapping', () => {
    const { result, rerender } = setup({ target: ['a', 'b'], ready: true })
    act(() => result.current.touch())
    rerender({ target: ['b', 'a'], ready: true })
    expect(result.current.order).toEqual(['a', 'b'])

    act(() => {
      vi.advanceTimersByTime(600)
      result.current.touch()
      vi.advanceTimersByTime(600)
    })
    // 600 ms after the second tap: still held.
    expect(result.current.order).toEqual(['a', 'b'])

    act(() => {
      vi.advanceTimersByTime(500)
    })
    expect(result.current.order).toEqual(['b', 'a'])
  })

  it('drops a pending order that is no longer wanted', () => {
    const { result, rerender } = setup({ target: ['a', 'b'], ready: true })
    act(() => result.current.touch())
    rerender({ target: ['b', 'a'], ready: true })
    rerender({ target: ['a', 'b'], ready: true })
    act(() => {
      vi.advanceTimersByTime(2000)
    })
    expect(result.current.order).toEqual(['a', 'b'])
  })
})
