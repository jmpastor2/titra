/**
 * Test harness for the inventory screens: the real hooks against the in-memory database of
 * the dev lab, inside the providers the app puts around them.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import type { ReactElement } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { PatientScopeProvider } from '@/app/scope'
import { ToastProvider } from '@/components/ui/Toast'
import type { InventoryRow, ProtocolRow } from '@/data/database.types'
import { createFakeSupabase, type Row, type Store } from '@/dev/fakeSupabase'
import { FixedSessionProvider, type SessionState } from '@/features/auth/SessionProvider'
import { setSupabaseClient } from '@/lib/supabase'

export const USER_ID = 'u'

const session: SessionState = {
  status: 'signed_in',
  session: null,
  user: { id: USER_ID, email: 'lab@titra.test' } as SessionState['user'],
}

function showModal(this: HTMLDialogElement) {
  this.setAttribute('open', '')
}
function closeDialog(this: HTMLDialogElement) {
  this.removeAttribute('open')
}

/** What jsdom lacks and the sheets use: a native dialog that can open and close. */
export function stubDialog() {
  HTMLDialogElement.prototype.showModal ??= showModal
  HTMLDialogElement.prototype.close ??= closeDialog
}

/** The keys of the alerts marked as read, as the database holds them. */
export const dismissalKeys = (store: Store): string[] =>
  (store.alert_dismissals ?? []).map((d) => String(d.alert_key))

export function makeStore(over: Partial<Record<keyof Store, Row[]>> = {}): Store {
  return {
    profiles: [],
    protocols: [],
    inventory: [],
    doses: [],
    measurements: [],
    symptoms: [],
    lab_results: [],
    care_links: [],
    clinical_notes: [],
    compound_notes: [],
    push_subscriptions: [],
    saved_protocols: [],
    reminders: [],
    alert_dismissals: [],
    ...over,
  }
}

export const vialRow = (over: Partial<InventoryRow> = {}): InventoryRow => ({
  id: 'v1',
  patient_id: USER_ID,
  compound_id: 'mots-c',
  form: 'vial',
  label: 'MOTS-c 10 mg · reserva',
  total_mg: 10,
  remaining_mg: 10,
  concentration_mg_per_ml: null,
  diluent_ml: null,
  components: [],
  opened_at: null,
  expires_at: null,
  lot: 'L-42',
  storage_notes: null,
  archived: false,
  created_at: '2026-09-01T10:00:00Z',
  updated_at: '2026-09-01T10:00:00Z',
  ...over,
})

export const protocolRow = (over: Partial<ProtocolRow> = {}): ProtocolRow => ({
  id: 'p1',
  patient_id: USER_ID,
  created_by: USER_ID,
  compound_id: 'mots-c',
  name: 'MOTS-c',
  route: 'sc',
  unit: 'mg',
  start_date: '2026-09-14',
  time_of_day: '09:00',
  times: ['09:00'],
  steps: [{ doseMg: 1.2, intervalDays: 1, weekdays: [1, 3, 5], durationWeeks: null }],
  components: [],
  status: 'active',
  template_id: null,
  notes: null,
  created_at: '2026-09-14T10:00:00Z',
  updated_at: '2026-09-14T10:00:00Z',
  ...over,
})

/** Render inside query client, session, patient scope, toasts and router, over `store`. */
export function renderInApp(ui: ReactElement, store: Store, options: { readOnly?: boolean } = {}) {
  setSupabaseClient(createFakeSupabase(store, { id: USER_ID, email: 'lab@titra.test' }))
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { retry: false } },
  })
  const view = render(
    <QueryClientProvider client={client}>
      <FixedSessionProvider value={session}>
        <PatientScopeProvider
          value={{
            patientId: USER_ID,
            patient: null,
            isSelf: true,
            readOnly: options.readOnly ?? false,
            canPrescribe: false,
          }}
        >
          <ToastProvider>
            <MemoryRouter>{ui}</MemoryRouter>
          </ToastProvider>
        </PatientScopeProvider>
      </FixedSessionProvider>
    </QueryClientProvider>,
  )
  return { ...view, client }
}
