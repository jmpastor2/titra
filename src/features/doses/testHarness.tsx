/**
 * Rendering helpers for the component tests of this folder: the real hooks against the
 * in-memory database of the dev lab, inside the providers a screen needs. Test-only.
 */
import { QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import type { ReactNode } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { PatientScopeProvider } from '@/app/scope'
import { ToastProvider } from '@/components/ui/Toast'
import type { DoseRow, InventoryRow, ProtocolRow } from '@/data/database.types'
import { createFakeSupabase, type Row, type Store } from '@/dev/fakeSupabase'
import i18n from '@/i18n'
import { createQueryClient } from '@/lib/queryClient'
import { setSupabaseClient } from '@/lib/supabase'
import { USER } from './testData'

function showModal(this: HTMLDialogElement) {
  this.setAttribute('open', '')
}

function closeDialog(this: HTMLDialogElement) {
  this.removeAttribute('open')
}

/** What jsdom lacks and a sheet needs: a native dialog and a few browser APIs. */
export function installDomShims(): void {
  HTMLDialogElement.prototype.showModal ??= showModal
  HTMLDialogElement.prototype.close ??= closeDialog
  window.scrollTo = () => {}
  window.matchMedia ??= ((query: string) => ({
    matches: false,
    media: query,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
    onchange: null,
    dispatchEvent: () => false,
  })) as typeof window.matchMedia
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
}

/** The app's own language, whatever the test browser says. */
export async function setSpanish(): Promise<void> {
  await i18n.changeLanguage('es')
}

export interface StoreInput {
  protocols?: ProtocolRow[]
  inventory?: InventoryRow[]
  doses?: DoseRow[]
}

const copy = (rows: object[]): Row[] => structuredClone(rows) as Row[]

/** A database with the given rows; rows are copied, so a test can read what the app wrote. */
export function makeStore({ protocols = [], inventory = [], doses = [] }: StoreInput): Store {
  return {
    profiles: [],
    protocols: copy(protocols),
    inventory: copy(inventory),
    doses: copy(doses),
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
  }
}

/** Render `ui` against `store` as the signed-in patient. */
export function renderWithStore(ui: ReactNode, store: Store) {
  setSupabaseClient(createFakeSupabase(store, { id: USER, email: 'lab@titra.test' }))
  const client = createQueryClient()
  client.setDefaultOptions({ queries: { retry: false, staleTime: Infinity } })
  return render(
    <QueryClientProvider client={client}>
      <PatientScopeProvider
        value={{
          patientId: USER,
          patient: null,
          isSelf: true,
          readOnly: false,
          canPrescribe: false,
        }}
      >
        <ToastProvider>
          <MemoryRouter>{ui}</MemoryRouter>
        </ToastProvider>
      </PatientScopeProvider>
    </QueryClientProvider>,
  )
}
