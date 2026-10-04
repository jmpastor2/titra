/**
 * The optimistic writes behind every tap: the row is in the cache at once, comes back out if
 * the server refuses it, and an undo that beats the server's answer still deletes the row.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { MeasurementRow } from '@/data/database.types'
import { createFakeSupabase, type Store } from '@/dev/fakeSupabase'
import { buildStore, LAB_USER } from '@/dev/fixtures'
import { setSupabaseClient, type TypedSupabase } from '@/lib/supabase'
import { useQuickWrites } from './data'

const PID = LAB_USER.id
const NOW = new Date('2026-10-05T14:30:00')
const WATER = { kind: 'hydration_ml', value: 250, unit: 'ml' } as const

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(NOW)
})
afterEach(() => vi.useRealTimers())

type Hold = { release: () => void }

/** The fake database, answering inserts only once `release` is called; or refusing them then. */
function setup(mode: 'fine' | 'refuse' | 'slow' = 'fine') {
  const store: Store = buildStore(NOW, { empty: true })
  const real = createFakeSupabase(store, LAB_USER)
  const hold: Hold = { release: () => {} }
  const gate = new Promise<void>((resolve) => {
    hold.release = resolve
  })
  const client = new Proxy(real, {
    get(target, prop, receiver) {
      if (prop !== 'from') return Reflect.get(target, prop, receiver)
      return (table: string) => {
        const query = target.from(table as 'measurements')
        if (table !== 'measurements' || mode === 'fine') return query
        return new Proxy(query, {
          get(q, p, r) {
            if (p !== 'insert') return Reflect.get(q, p, r)
            return (rows: never) => {
              const inner = q.insert(rows) as unknown as {
                select(columns: string): PromiseLike<unknown>
              }
              const answer = async () => {
                await gate
                return mode === 'refuse'
                  ? { data: null, error: { message: 'boom' } }
                  : inner.select('*')
              }
              return {
                select: () => ({
                  // oxlint-disable-next-line unicorn/no-thenable
                  then: (ok: (v: unknown) => unknown, fail: (e: unknown) => unknown) =>
                    answer().then(ok, fail),
                }),
              }
            }
          },
        })
      }
    },
  }) as unknown as TypedSupabase
  setSupabaseClient(client)
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  )
  const { result, rerender } = renderHook(() => useQuickWrites(PID), { wrapper })
  // A list the screen already holds, as Progress or the panel would.
  const key = ['measurements', PID, 365] as const
  qc.setQueryData<MeasurementRow[]>(key, [])
  const cached = () => qc.getQueryData<MeasurementRow[]>(key) ?? []
  return { store, qc, writes: result, rerender, hold, cached }
}

describe('useQuickWrites', () => {
  it('puts a new row in the cached lists before the server answers, then keeps the real one', async () => {
    const { store, writes, hold, cached } = setup('slow')
    let written: Awaited<ReturnType<typeof writes.current.addMany>> | undefined
    await act(async () => {
      written = await writes.current.addMany([WATER])
    })
    expect(cached()).toHaveLength(1)
    expect(cached()[0]).toMatchObject({ kind: 'hydration_ml', value: 250 })
    expect(cached()[0]?.id).toMatch(/^pending-/)
    expect(store.measurements).toHaveLength(0)

    hold.release()
    await act(async () => {
      await written?.saved
    })
    expect(store.measurements).toHaveLength(1)
  })

  it('keeps the lists in time order when the row is dated earlier', async () => {
    const { writes, qc, cached } = setup()
    const yesterday = new Date('2026-10-04T20:00:00').toISOString()
    await act(async () => {
      await writes.current.addMany([{ ...WATER, measuredAt: yesterday }])
      await writes.current.addMany([WATER])
    })
    expect(cached().map((r) => r.measured_at.slice(0, 10))).toEqual(['2026-10-05', '2026-10-04'])
    qc.clear()
  })

  it('takes the row back out when the server refuses it', async () => {
    const { writes, hold, cached } = setup('refuse')
    let saved: Promise<unknown> | undefined
    await act(async () => {
      saved = (await writes.current.addMany([WATER])).saved
    })
    expect(cached()).toHaveLength(1)
    hold.release()
    await act(async () => {
      await expect(saved).rejects.toThrow('boom')
    })
    expect(cached()).toHaveLength(0)
  })

  it('deletes a row for real even when the undo beats the server', async () => {
    const { store, writes, hold, cached } = setup('slow')
    let written: Awaited<ReturnType<typeof writes.current.addMany>> | undefined
    await act(async () => {
      written = await writes.current.addMany([WATER])
    })
    const [row] = written?.rows ?? []
    let removing: Promise<void> | undefined
    await act(async () => {
      removing = row ? writes.current.remove(row) : undefined
      await Promise.resolve()
    })
    // Gone from the screen at once, while the insert is still on its way.
    expect(cached()).toHaveLength(0)
    expect(store.measurements).toHaveLength(0)

    hold.release()
    await act(async () => {
      await written?.saved
      await removing
    })
    expect(store.measurements).toHaveLength(0)
  })

  it('removes a saved row from the cache and the database', async () => {
    const { store, writes, cached } = setup()
    let written: Awaited<ReturnType<typeof writes.current.addMany>> | undefined
    await act(async () => {
      written = await writes.current.addMany([WATER, { ...WATER, value: 500 }])
      await written.saved
    })
    expect(store.measurements).toHaveLength(2)
    const [first] = written?.rows ?? []
    await act(async () => {
      if (first) await writes.current.remove(first)
    })
    expect(cached().map((r) => r.value)).toEqual([500])
    expect(store.measurements.map((m) => m.value)).toEqual([500])
  })

  it('hands back the same object on every render, so effects and memos can rely on it', () => {
    const { writes, rerender } = setup()
    const first = writes.current
    rerender()
    expect(writes.current).toBe(first)
  })
})
