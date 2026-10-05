import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { CompoundDetail } from '@/content/schema'
import { useCompoundDetail } from './useCompoundDetail'

const mocks = vi.hoisted(() => ({
  cached: new Map<string, unknown>(),
  load: vi.fn(),
}))

vi.mock('@/content/compounds', () => ({
  cachedCompoundDetail: (id: string) => mocks.cached.get(id),
  loadCompoundDetail: mocks.load,
}))

const entry = (id: string) => ({ id }) as CompoundDetail

/** Like the real loader: the entry is in memory by the time the promise settles. */
async function loadsFine(id: string) {
  mocks.cached.set(id, entry(id))
  return entry(id)
}

beforeEach(() => {
  mocks.cached.clear()
  mocks.load.mockReset()
})

describe('useCompoundDetail', () => {
  it('returns a cached entry on the first render without loading anything', () => {
    mocks.cached.set('a', entry('a'))
    const { result } = renderHook(() => useCompoundDetail('a'))
    expect(result.current.detail?.id).toBe('a')
    expect(mocks.load).not.toHaveBeenCalled()
  })

  it('loads on demand and follows the id', async () => {
    mocks.load.mockImplementation(loadsFine)
    const { result, rerender } = renderHook(({ id }) => useCompoundDetail(id), {
      initialProps: { id: 'a' },
    })
    expect(result.current.detail).toBeUndefined()
    await waitFor(() => expect(result.current.detail?.id).toBe('a'))

    rerender({ id: 'b' })
    expect(result.current.detail).toBeUndefined()
    await waitFor(() => expect(result.current.detail?.id).toBe('b'))
  })

  it('reports a failed load and retries on request', async () => {
    mocks.load.mockRejectedValueOnce(new Error('offline')).mockImplementation(loadsFine)
    const { result } = renderHook(() => useCompoundDetail('a'))
    await waitFor(() => expect(result.current.failed).toBe(true))
    expect(result.current.detail).toBeUndefined()

    act(() => result.current.retry())
    await waitFor(() => expect(result.current.detail?.id).toBe('a'))
    expect(result.current.failed).toBe(false)
  })

  it('does nothing without an id', () => {
    const { result } = renderHook(() => useCompoundDetail(undefined))
    expect(result.current.detail).toBeUndefined()
    expect(result.current.failed).toBe(false)
    expect(mocks.load).not.toHaveBeenCalled()
  })
})
