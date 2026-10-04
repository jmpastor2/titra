import { QueryClientProvider } from '@tanstack/react-query'
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { PatientScopeProvider } from '@/app/scope'
import { ToastProvider } from '@/components/ui/Toast'
import type { ProfileRow, SymptomKind } from '@/data/database.types'
import { createFakeSupabase, type Row, type Store } from '@/dev/fakeSupabase'
import { buildStore, LAB_USER } from '@/dev/fixtures'
import i18n from '@/i18n'
import { createQueryClient } from '@/lib/queryClient'
import { setSupabaseClient } from '@/lib/supabase'
import { LogSymptomSheet } from './LogSymptomSheet'

const NOW = new Date('2026-10-05T14:30:00')

beforeAll(async () => {
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
  HTMLDialogElement.prototype.showModal ??= function showModal(this: HTMLDialogElement) {
    this.setAttribute('open', '')
  }
  HTMLDialogElement.prototype.close ??= function close(this: HTMLDialogElement) {
    this.removeAttribute('open')
  }
  await i18n.changeLanguage('es')
})

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(NOW)
})
afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

const symptom = (kind: SymptomKind, severity: number, daysAgo: number, hour = 9): Row => ({
  id: `${kind}-${daysAgo}-${hour}`,
  patient_id: LAB_USER.id,
  kind,
  severity,
  notes: null,
  occurred_at: new Date(2026, 9, 5 - daysAgo, hour, 0).toISOString(),
  created_at: '',
})

function renderSheet(rows: Row[] = []) {
  const store: Store = buildStore(NOW, { empty: true })
  store.symptoms = rows
  setSupabaseClient(createFakeSupabase(store, LAB_USER))
  const client = createQueryClient()
  client.setDefaultOptions({ queries: { retry: false, staleTime: Infinity } })
  const onClose = vi.fn()
  render(
    <QueryClientProvider client={client}>
      <ToastProvider>
        <PatientScopeProvider
          value={{
            patientId: LAB_USER.id,
            patient: store.profiles[0] as unknown as ProfileRow,
            isSelf: true,
            readOnly: false,
            canPrescribe: false,
          }}
        >
          <LogSymptomSheet open onClose={onClose} />
        </PatientScopeProvider>
      </ToastProvider>
    </QueryClientProvider>,
  )
  return { store, onClose }
}

const settle = () => act(async () => void (await new Promise((r) => setTimeout(r, 30))))
const kinds = () => screen.getAllByRole('radio').map((r) => r.textContent ?? '')

describe('LogSymptomSheet', () => {
  it('offers the usual GLP-1 symptoms first on a new account and saves with a level', async () => {
    const { store, onClose } = renderSheet()
    await screen.findByRole('radiogroup', { name: 'Tipo' })
    expect(kinds().slice(0, 5)).toEqual([
      'Náuseas',
      'Estreñimiento',
      'Reflujo / ardor',
      'Fatiga',
      'Dolor de cabeza',
    ])
    expect(screen.queryByText('Igual que ayer')).toBeNull()
    expect(screen.getByRole('button', { name: 'Guardar' })).toBeDisabled()

    fireEvent.click(screen.getByRole('radio', { name: 'Fatiga' }))
    fireEvent.click(screen.getByRole('radio', { name: /^4\/5/ }))
    expect(screen.getByText('Se guarda como 8/10.')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Guardar Fatiga · 4/5' }))
    await settle()
    expect(store.symptoms?.[0]).toMatchObject({ kind: 'fatigue', severity: 8, notes: null })
    expect(onClose).toHaveBeenCalled()
  })

  it('puts the symptoms the person logs most first', async () => {
    renderSheet([
      symptom('bloating', 4, 6),
      symptom('bloating', 4, 9),
      symptom('bloating', 2, 12),
      symptom('dizziness', 6, 8),
    ])
    await waitFor(() => expect(kinds().slice(0, 3)).toEqual(['Hinchazón', 'Mareo', 'Náuseas']))
  })

  it('repeats yesterday with one tap, then saves it', async () => {
    const { store } = renderSheet([
      symptom('nausea', 4, 1),
      symptom('nausea', 6, 1, 21),
      symptom('headache', 2, 1),
    ])
    const again = await screen.findByText('Igual que ayer')
    // The label and the chips share a block.
    const chips = within(again.parentElement?.parentElement as HTMLElement)
    fireEvent.click(chips.getByRole('button', { name: /Náuseas/ }))
    expect(screen.getByRole('radio', { name: 'Náuseas' })).toHaveAttribute('aria-checked', 'true')
    fireEvent.click(screen.getByRole('button', { name: 'Guardar Náuseas · 3/5' }))
    await settle()
    expect(store.symptoms?.at(-1)).toMatchObject({ kind: 'nausea', severity: 6 })
  })

  it('names the day when the last symptoms were a few days ago', async () => {
    renderSheet([symptom('reflux', 2, 3)])
    expect(await screen.findByText('Igual que hace 3 días')).toBeInTheDocument()
  })

  it('reveals every other symptom on request and keeps a note', async () => {
    const { store } = renderSheet()
    await screen.findByRole('radiogroup', { name: 'Tipo' })
    fireEvent.click(screen.getByRole('button', { name: 'Más síntomas' }))
    fireEvent.click(screen.getByRole('radio', { name: 'Caída de cabello' }))
    fireEvent.click(screen.getByRole('radio', { name: /^1\/5/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Añadir nota' }))
    fireEvent.change(screen.getByRole('textbox', { name: /Notas/ }), {
      target: { value: 'al peinarme' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar Caída de cabello · 1/5' }))
    await settle()
    expect(store.symptoms?.[0]).toMatchObject({
      kind: 'hair_loss',
      severity: 2,
      notes: 'al peinarme',
    })
  })
})
