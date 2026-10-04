/**
 * Test helpers for the protocol screens: the real routes and hooks against an in-memory
 * database (the development lab's fake Supabase), with the clock fixed. Tests only.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import { createMemoryRouter, RouterProvider, type RouteObject } from 'react-router-dom'
import { PatientScopeProvider } from '@/app/scope'
import { ToastProvider } from '@/components/ui/Toast'
import { createFakeSupabase, type Row, type Store } from '@/dev/fakeSupabase'
import { FixedSessionProvider, type SessionState } from '@/features/auth/SessionProvider'
import '@/i18n'
import { setSupabaseClient } from '@/lib/supabase'

export const USER = { id: 'u1', email: 'u1@titra.test' }

const W15 = [1, 2, 3, 4, 5]

/** The CJC-1295 + ipamorelin blend, Mon–Fri nights: 6 → 9 → 12 U for ten weeks, then a rest. */
export function cjcProtocol(over: Row = {}): Row {
  return {
    id: 'cjc',
    patient_id: USER.id,
    created_by: USER.id,
    compound_id: 'mod-grf-1-29',
    name: 'CJC-1295 + Ipamorelina',
    route: 'sc',
    unit: 'mcg',
    start_date: '2026-09-21',
    time_of_day: '01:00',
    times: ['25:00'],
    steps: [
      { doseMg: 0.1, intervalDays: 1, weekdays: W15, durationWeeks: 1 },
      { doseMg: 0.15, intervalDays: 1, weekdays: W15, durationWeeks: 1 },
      { doseMg: 0.2, intervalDays: 1, weekdays: W15, durationWeeks: 10 },
      { doseMg: 0, intervalDays: 1, pause: true, durationWeeks: 4, label: 'Descanso' },
    ],
    components: [{ compoundId: 'ipamorelin', doseMg: 0.1 }],
    status: 'active',
    template_id: null,
    notes: 'En ayunas.',
    created_at: '2026-09-21T00:00:00Z',
    updated_at: '2026-09-21T00:00:00Z',
    ...over,
  }
}

/** 5 + 5 mg in 3 mL: 1.667 mg/mL of each, 1 U = 16.7 mcg. */
export function blendVial(over: Row = {}): Row {
  return {
    id: 'vial',
    patient_id: USER.id,
    compound_id: 'mod-grf-1-29',
    form: 'vial',
    label: 'CJC-1295 + Ipamorelina 10 mg',
    total_mg: 5,
    remaining_mg: 4,
    concentration_mg_per_ml: 5 / 3,
    diluent_ml: 3,
    components: [{ compoundId: 'ipamorelin', mg: 5 }],
    opened_at: '2026-09-21',
    expires_at: null,
    lot: null,
    storage_notes: null,
    archived: false,
    created_at: '2026-09-21T00:00:00Z',
    updated_at: '2026-09-21T00:00:00Z',
    ...over,
  }
}

export function storeWith(rows: Partial<Record<string, Row[]>>): Store {
  return {
    profiles: [],
    protocols: [],
    inventory: [],
    doses: [],
    measurements: [],
    saved_protocols: [],
    symptoms: [],
    alert_dismissals: [],
    ...rows,
  } as Store
}

function showModal(this: HTMLDialogElement) {
  this.setAttribute('open', '')
}
function closeDialog(this: HTMLDialogElement) {
  this.removeAttribute('open')
  this.dispatchEvent(new Event('close'))
}

/** jsdom has no <dialog>.showModal(): open the element so its content is reachable. */
export function stubDialog() {
  HTMLDialogElement.prototype.showModal = showModal
  HTMLDialogElement.prototype.close = closeDialog
}

const session: SessionState = {
  status: 'signed_in',
  session: null,
  user: { id: USER.id, email: USER.email } as SessionState['user'],
}

/** Render routes against a store; the router is returned to read where the app navigated. */
export function renderRoutes(routes: RouteObject[], path: string, store: Store) {
  setSupabaseClient(createFakeSupabase(store, USER))
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const router = createMemoryRouter(routes, { initialEntries: [path] })
  const view = render(
    <QueryClientProvider client={client}>
      <FixedSessionProvider value={session}>
        <ToastProvider>
          <PatientScopeProvider
            value={{
              patientId: USER.id,
              patient: null,
              isSelf: true,
              readOnly: false,
              canPrescribe: false,
            }}
          >
            <RouterProvider router={router} />
          </PatientScopeProvider>
        </ToastProvider>
      </FixedSessionProvider>
    </QueryClientProvider>,
  )
  return { router, client, ...view }
}
