import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { addDays } from 'date-fns'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it } from 'vitest'
import { createFakeSupabase, MAX_ROWS, type Row, type Store } from '@/dev/fakeSupabase'
import { setSupabaseClient } from '@/lib/supabase'
import { useDoses, useMeasurements } from './hooks'

const USER = 'u1'
const NOW = new Date()

const emptyStore = (): Store => ({
  profiles: [],
  protocols: [],
  inventory: [],
  doses: [],
  measurements: [],
  saved_protocols: [],
  symptoms: [],
  lab_results: [],
  care_links: [],
  clinical_notes: [],
  compound_notes: [],
  push_subscriptions: [],
  reminders: [],
  alert_dismissals: [],
})

const measurement = (i: number, kind: string, daysAgo: number): Row => ({
  id: `m${i}`,
  patient_id: USER,
  kind,
  value: 1,
  unit: 'x',
  measured_at: addDays(NOW, -daysAgo).toISOString(),
  created_at: NOW.toISOString(),
  notes: null,
  source: 'manual',
})

const dose = (i: number, daysAgo: number): Row => ({
  id: `d${i}`,
  patient_id: USER,
  compound_id: 'retatrutide',
  dose_mg: 1,
  administered_at: addDays(NOW, -daysAgo).toISOString(),
  created_at: NOW.toISOString(),
})

function wrapper() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  )
}

let store: Store
beforeEach(() => {
  store = emptyStore()
  setSupabaseClient(createFakeSupabase(store, { id: USER, email: 'a@b.c' }))
})

describe('long logs are read completely', () => {
  it('returns every dose even past the API row limit', async () => {
    const total = MAX_ROWS + 450
    store.doses = Array.from({ length: total }, (_, i) => dose(i, i % 300))
    const { result } = renderHook(() => useDoses(USER, 365), { wrapper: wrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toHaveLength(total)
    expect(new Set(result.current.data?.map((r) => r.id)).size).toBe(total)
  })

  it('keeps an old weight when check-ins pile up beyond the row limit', async () => {
    const checkIns = Array.from({ length: MAX_ROWS + 300 }, (_, i) =>
      measurement(i, 'energy', i % 200),
    )
    store.measurements = [...checkIns, measurement(99_999, 'weight', 380)]
    const { result } = renderHook(() => useMeasurements(USER, 400), { wrapper: wrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toHaveLength(checkIns.length + 1)
    expect(result.current.data?.some((r) => r.kind === 'weight')).toBe(true)
  })
})

describe('counters stay out of the shared measurements window', () => {
  const rows = () => [
    measurement(1, 'weight', 2),
    measurement(2, 'hydration_ml', 0),
    measurement(3, 'hydration_ml', 0),
    measurement(4, 'protein_g', 1),
    measurement(5, 'resistance_session', 1),
  ]

  it('leaves water and protein out by default', async () => {
    store.measurements = rows()
    const { result } = renderHook(() => useMeasurements(USER, 365), { wrapper: wrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.map((r) => r.kind).toSorted()).toEqual([
      'resistance_session',
      'weight',
    ])
  })

  it('brings them back when the export asks for every row', async () => {
    store.measurements = rows()
    const { result } = renderHook(() => useMeasurements(USER, 365, true), { wrapper: wrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toHaveLength(5)
  })
})
