/**
 * The measurement sheet as Progress opens it: any kind, prefilled from the last reading,
 * with the kinds that are not a single number (blood pressure, a session) handled.
 */
import { QueryClientProvider } from '@tanstack/react-query'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { PatientScopeProvider } from '@/app/scope'
import { ToastProvider } from '@/components/ui/Toast'
import type { MeasurementKind, ProfileRow } from '@/data/database.types'
import { createFakeSupabase, type Row, type Store } from '@/dev/fakeSupabase'
import { buildStore, LAB_USER } from '@/dev/fixtures'
import i18n from '@/i18n'
import { createQueryClient } from '@/lib/queryClient'
import { setSupabaseClient } from '@/lib/supabase'
import { LogMeasurementSheet } from './LogMeasurementSheet'

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

function renderSheet(defaultKind: MeasurementKind, seed: (store: Store) => void = () => {}) {
  const store = buildStore(NOW, { empty: true })
  seed(store)
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
          <LogMeasurementSheet open onClose={onClose} defaultKind={defaultKind} />
        </PatientScopeProvider>
      </ToastProvider>
    </QueryClientProvider>,
  )
  return { store, onClose }
}

const reading = (kind: string, value: number, unit: string, daysAgo: number): Row => ({
  id: `${kind}-${daysAgo}`,
  patient_id: LAB_USER.id,
  kind,
  value,
  unit,
  measured_at: new Date(NOW.getTime() - daysAgo * 86_400_000).toISOString(),
  notes: null,
  source: 'manual',
  created_at: '',
})

const settle = () => act(async () => void (await new Promise((r) => setTimeout(r, 30))))
const rowsOf = (store: Store, kind: string) => store.measurements.filter((m) => m.kind === kind)

describe('LogMeasurementSheet', () => {
  it('records blood pressure as two readings from the last ones', async () => {
    const { store, onClose } = renderSheet('bp_systolic', (s) => {
      s.measurements.push(
        reading('bp_systolic', 122, 'mmHg', 3),
        reading('bp_diastolic', 80, 'mmHg', 3),
      )
    })
    const systolic = await screen.findByRole('textbox', { name: 'TA sistólica' })
    expect(systolic).toHaveValue('122')
    expect(screen.getByRole('textbox', { name: 'TA diastólica' })).toHaveValue('80')
    fireEvent.click(screen.getByRole('button', { name: 'TA sistólica: sumar 1 mmHg' }))
    fireEvent.click(screen.getByRole('button', { name: 'Guardar 123/80' }))
    await settle()
    expect(rowsOf(store, 'bp_systolic').map((m) => m.value)).toEqual([122, 123])
    expect(rowsOf(store, 'bp_diastolic').map((m) => m.value)).toEqual([80, 80])
    expect(onClose).toHaveBeenCalled()
  })

  it('takes a session length from the chips, or none at all', async () => {
    const { store } = renderSheet('resistance_session')
    fireEvent.click(await screen.findByRole('button', { name: 'Poner 45 min' }))
    expect(screen.getByRole('textbox', { name: 'Sesión de fuerza' })).toHaveValue('45')
    fireEvent.click(screen.getByRole('button', { name: 'Guardar 45 min' }))
    await settle()
    expect(rowsOf(store, 'resistance_session')[0]).toMatchObject({ value: 45, unit: 'min' })
  })

  it('does not start a session from the one logged without a length', async () => {
    renderSheet('resistance_session', (s) =>
      s.measurements.push(reading('resistance_session', 1, 'session', 2)),
    )
    expect(await screen.findByRole('textbox', { name: 'Sesión de fuerza' })).toHaveValue('')
    expect(screen.getByText(/Aún sin registros/)).toBeInTheDocument()
  })

  it('logs a session without a length as one session', async () => {
    const { store } = renderSheet('resistance_session')
    fireEvent.click(await screen.findByRole('button', { name: 'Sin duración' }))
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))
    await settle()
    expect(rowsOf(store, 'resistance_session')[0]).toMatchObject({ value: 1, unit: 'session' })
  })

  it('switches kind from the row of kinds and starts from that kind’s last reading', async () => {
    renderSheet('weight', (s) => {
      s.measurements.push(reading('weight', 77, 'kg', 2), reading('waist', 91, 'cm', 9))
    })
    expect(await screen.findByRole('textbox', { name: 'Peso' })).toHaveValue('77,0')
    fireEvent.click(screen.getByRole('radio', { name: 'Cintura' }))
    expect(await screen.findByRole('textbox', { name: 'Cintura' })).toHaveValue('91,0')
    expect(screen.getByText(/Última: 91,0 cm · hace 9 días/)).toBeInTheDocument()
  })

  it('dates the reading when asked to, and keeps a note', async () => {
    const { store } = renderSheet('weight', (s) =>
      s.measurements.push(reading('weight', 77, 'kg', 2)),
    )
    await screen.findByRole('textbox', { name: 'Peso' })
    fireEvent.click(screen.getByRole('radio', { name: 'Fecha' }))
    fireEvent.change(screen.getByLabelText('Fecha'), { target: { value: '2026-10-03' } })
    fireEvent.change(screen.getByLabelText('Hora'), { target: { value: '07:15' } })
    fireEvent.click(screen.getByRole('button', { name: 'Añadir nota' }))
    fireEvent.change(screen.getByRole('textbox', { name: /Notas/ }), {
      target: { value: 'en ayunas' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar 77,0 kg' }))
    await settle()
    const saved = rowsOf(store, 'weight').at(-1)
    expect(new Date(String(saved?.measured_at)).getTime()).toBe(
      new Date('2026-10-03T07:15').getTime(),
    )
    expect(saved?.notes).toBe('en ayunas')
  })

  it('shows steps as whole numbers with thousands handled', async () => {
    const { store } = renderSheet('steps', (s) =>
      s.measurements.push(reading('steps', 8000, 'steps', 1)),
    )
    const field = await screen.findByRole('textbox', { name: 'Pasos' })
    expect(field).toHaveValue('8000')
    fireEvent.click(screen.getByRole('button', { name: 'Pasos: sumar 500 steps' }))
    expect(field).toHaveValue('8500')
    fireEvent.click(screen.getByRole('button', { name: /^Guardar 8500/ }))
    await settle()
    expect(rowsOf(store, 'steps').at(-1)).toMatchObject({ value: 8500, unit: 'steps' })
  })
})
