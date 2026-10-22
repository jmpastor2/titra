import {
  dehydrate,
  hydrate,
  onlineManager,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createFakeSupabase, type Store } from '@/dev/fakeSupabase'
import { createQueryClient } from '@/lib/queryClient'
import { setSupabaseClient } from '@/lib/supabase'
import { ApiError, registerMutationDefaults, unwrap, useAddDose, useAddMeasurement } from './hooks'

const USER = 'u1'

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

/** A client that pauses writes while offline, as the app's does once a first attempt fails. */
function appLikeClient() {
  const client = new QueryClient({ defaultOptions: { mutations: { networkMode: 'online' } } })
  registerMutationDefaults(client)
  return client
}

const wrapperFor = (client: QueryClient) =>
  function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>
  }

let store: Store
beforeEach(() => {
  store = emptyStore()
  setSupabaseClient(createFakeSupabase(store, { id: USER, email: 'a@b.c' }))
})
afterEach(() => onlineManager.setOnline(true))

describe('a write made offline survives a reload', () => {
  it('logs the dose once the reopened app is back online', async () => {
    onlineManager.setOnline(false)
    const before = appLikeClient()
    const { result, unmount } = renderHook(() => useAddDose(USER), { wrapper: wrapperFor(before) })
    act(() => {
      result.current.mutate({
        patient_id: USER,
        compound_id: 'retatrutide',
        dose_mg: 2,
        administered_at: new Date().toISOString(),
      })
    })
    await waitFor(() => expect(result.current.isPaused).toBe(true))

    // What the persister keeps, through the same JSON round trip as storage.
    const saved = JSON.parse(JSON.stringify(dehydrate(before)))
    // The reload: the old page and everything it held in memory are gone.
    unmount()
    before.clear()
    expect(saved.mutations).toHaveLength(1)

    const after = appLikeClient()
    hydrate(after, saved)
    onlineManager.setOnline(true)
    await after.resumePausedMutations()

    expect(store.doses).toHaveLength(1)
    expect(store.doses[0]).toMatchObject({ compound_id: 'retatrutide', dose_mg: 2 })
  })

  it('saves a measurement the same way', async () => {
    onlineManager.setOnline(false)
    const before = appLikeClient()
    const { result, unmount } = renderHook(() => useAddMeasurement(USER), {
      wrapper: wrapperFor(before),
    })
    act(() => {
      result.current.mutate({
        patient_id: USER,
        kind: 'weight',
        value: 80,
        unit: 'kg',
        measured_at: new Date().toISOString(),
      })
    })
    await waitFor(() => expect(result.current.isPaused).toBe(true))
    const saved = JSON.parse(JSON.stringify(dehydrate(before)))
    // The reload: the old page and everything it held in memory are gone.
    unmount()
    before.clear()

    const after = appLikeClient()
    hydrate(after, saved)
    onlineManager.setOnline(true)
    await after.resumePausedMutations()

    expect(store.measurements).toHaveLength(1)
  })
})

describe('request errors keep their HTTP status', () => {
  it('carries status and code, so permission errors are not retried', () => {
    let error: unknown
    try {
      unwrap({ data: null, error: { message: 'denied', code: '42501' }, status: 403 })
    } catch (e) {
      error = e
    }
    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ message: 'denied', status: 403, code: '42501' })

    const retry = createQueryClient().getDefaultOptions().queries?.retry
    expect(typeof retry).toBe('function')
    const decide = retry as (n: number, e: unknown) => boolean
    expect(decide(0, error)).toBe(false)
    expect(decide(0, new ApiError('down', 503))).toBe(true)
  })
})
