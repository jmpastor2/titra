import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { installed, outcomeOf, useAppUpdate } from './useAppUpdate'

const sw = vi.hoisted(() => ({
  needRefresh: false,
  updateServiceWorker: vi.fn(async (_reload?: boolean) => {}),
}))
vi.mock('virtual:pwa-register/react', () => ({
  useRegisterSW: () => ({
    needRefresh: [sw.needRefresh, () => {}],
    updateServiceWorker: sw.updateServiceWorker,
  }),
}))

interface Reg {
  update: () => Promise<void>
  installing: ServiceWorker | null
  waiting: ServiceWorker | null
}

/** A service worker stand-in whose state the test moves by hand. */
function fakeWorker(state: ServiceWorkerState) {
  const listeners = new Set<() => void>()
  const worker = {
    state,
    addEventListener: (_type: string, fn: () => void) => listeners.add(fn),
    removeEventListener: (_type: string, fn: () => void) => listeners.delete(fn),
  }
  return {
    worker: worker as unknown as ServiceWorker,
    move(next: ServiceWorkerState) {
      worker.state = next
      listeners.forEach((l) => l())
    },
  }
}

function stubRegistration(reg: Reg | undefined) {
  Object.defineProperty(navigator, 'serviceWorker', {
    configurable: true,
    value: { getRegistration: async () => reg },
  })
}

beforeEach(() => {
  sw.needRefresh = false
  sw.updateServiceWorker.mockClear()
})

afterEach(() => {
  vi.useRealTimers()
  Reflect.deleteProperty(navigator, 'serviceWorker')
})

describe('outcomeOf', () => {
  it('reads what the registration holds after the check', () => {
    expect(outcomeOf({ installing: null, waiting: null })).toBe('upToDate')
    expect(outcomeOf({ installing: fakeWorker('installing').worker, waiting: null })).toBe(
      'installing',
    )
    expect(outcomeOf({ installing: null, waiting: fakeWorker('installed').worker })).toBe(
      'available',
    )
  })
})

describe('installed', () => {
  it('resolves once the new files are in', async () => {
    const { worker, move } = fakeWorker('installing')
    const done = installed(worker, 1000)
    move('installed')
    await expect(done).resolves.toBe('available')
  })

  it('is immediate for a worker that already installed', async () => {
    await expect(installed(fakeWorker('installed').worker, 1000)).resolves.toBe('available')
  })

  it('gives up on a failed install', async () => {
    const failed = fakeWorker('installing')
    const done = installed(failed.worker, 1000)
    failed.move('redundant')
    await expect(done).resolves.toBe('error')
  })

  it('gives up on a stalled one', async () => {
    vi.useFakeTimers()
    const stalled = installed(fakeWorker('installing').worker, 1000)
    vi.advanceTimersByTime(1000)
    await expect(stalled).resolves.toBe('error')
  })
})

describe('useAppUpdate', () => {
  it('has nothing to ask where there is no service worker', () => {
    const { result } = renderHook(() => useAppUpdate())
    expect(result.current.phase).toBe('unsupported')
  })

  it('says so when the page has no worker registered (dev server, lab)', async () => {
    stubRegistration(undefined)
    const { result } = renderHook(() => useAppUpdate())
    await waitFor(() => expect(result.current.phase).toBe('unsupported'))
  })

  it('reports being up to date after asking the worker for an update', async () => {
    const update = vi.fn(async () => {})
    stubRegistration({ update, installing: null, waiting: null })
    const { result } = renderHook(() => useAppUpdate())
    expect(result.current.phase).toBe('idle')

    await act(async () => {
      await result.current.check()
    })
    expect(update).toHaveBeenCalledTimes(1)
    expect(result.current.phase).toBe('upToDate')
    expect(result.current.checkedAt).toBeInstanceOf(Date)
  })

  it('reports a new version that is already waiting', async () => {
    stubRegistration({
      update: async () => {},
      installing: null,
      waiting: fakeWorker('installed').worker,
    })
    const { result } = renderHook(() => useAppUpdate())
    await act(async () => {
      await result.current.check()
    })
    expect(result.current.phase).toBe('available')
  })

  it('waits for a version that is still downloading', async () => {
    const downloading = fakeWorker('installing')
    stubRegistration({ update: async () => {}, installing: downloading.worker, waiting: null })
    const { result } = renderHook(() => useAppUpdate())

    let check!: Promise<void>
    act(() => {
      check = result.current.check()
    })
    await waitFor(() => expect(result.current.phase).toBe('checking'))
    await act(async () => {
      downloading.move('installed')
      await check
    })
    expect(result.current.phase).toBe('available')
  })

  it('is not "up to date" when the check itself fails', async () => {
    stubRegistration({
      update: async () => {
        throw new TypeError('Failed to fetch')
      },
      installing: null,
      waiting: null,
    })
    const { result } = renderHook(() => useAppUpdate())
    await act(async () => {
      await result.current.check()
    })
    expect(result.current.phase).toBe('error')
  })

  it('shows an update the app already found, with no check', () => {
    sw.needRefresh = true
    stubRegistration({ update: async () => {}, installing: null, waiting: null })
    const { result } = renderHook(() => useAppUpdate())
    expect(result.current.phase).toBe('available')
  })

  it('applies it the way the update banner does, then makes sure the page is replaced', async () => {
    vi.useFakeTimers()
    sw.needRefresh = true
    const reload = vi.fn()
    stubRegistration({
      update: async () => {},
      installing: null,
      waiting: fakeWorker('installed').worker,
    })
    const { result } = renderHook(() => useAppUpdate({ reload }))

    await act(async () => {
      await result.current.apply()
    })
    expect(sw.updateServiceWorker).toHaveBeenCalledWith(true)
    expect(result.current.applying).toBe(true)
    expect(reload).not.toHaveBeenCalled()
    act(() => {
      vi.advanceTimersByTime(4000)
    })
    expect(reload).toHaveBeenCalledTimes(1)
  })

  it('just reloads when the new worker is already in charge', async () => {
    const reload = vi.fn()
    stubRegistration({ update: async () => {}, installing: null, waiting: null })
    const { result } = renderHook(() => useAppUpdate({ reload }))
    await act(async () => {
      await result.current.apply()
    })
    expect(sw.updateServiceWorker).not.toHaveBeenCalled()
    expect(reload).toHaveBeenCalledTimes(1)
  })
})
