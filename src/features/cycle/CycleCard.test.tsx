import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { PatientScopeProvider } from '@/app/scope'
import { ToastProvider } from '@/components/ui/Toast'
import type { ProfileRow } from '@/data/database.types'
import { createFakeSupabase, type Row, type Store } from '@/dev/fakeSupabase'
import { FixedSessionProvider, type SessionState } from '@/features/auth/SessionProvider'
import i18n from '@/i18n'
import { setSupabaseClient } from '@/lib/supabase'
import { CycleCard } from './CycleCard'

const W15 = [1, 2, 3, 4, 5]
const step = (doseMg: number, durationWeeks: number) => ({
  doseMg,
  intervalDays: 1,
  weekdays: W15,
  durationWeeks,
})
// CJC-1295 + ipamorelin Monday to Friday nights, 6 → 9 → 12 U, four weeks of rest after.
// Week 2 (Sep 28 – Oct 4) plans 150 mcg; on Monday Oct 5 the plan goes up to 200 mcg.
const STEPS = [
  step(0.1, 1),
  step(0.15, 1),
  step(0.2, 10),
  { doseMg: 0, intervalDays: 1, pause: true, durationWeeks: 4 },
]
const CJC: Row = {
  id: 'cjc',
  patient_id: 'u',
  created_by: 'u',
  compound_id: 'mod-grf-1-29',
  name: 'CJC-1295 + Ipamorelina',
  route: 'sc',
  unit: 'mcg',
  start_date: '2026-09-21',
  time_of_day: '01:00',
  times: ['25:00'],
  steps: STEPS,
  components: [{ compoundId: 'ipamorelin', doseMg: 0.1 }],
  status: 'active',
  template_id: null,
  notes: null,
  created_at: '2026-09-21T10:00:00Z',
  updated_at: '2026-09-21T10:00:00Z',
}
// 5 mg + 5 mg in 3 mL: 9 U = 150 mcg of each.
const BLEND: Row = {
  id: 'blend',
  patient_id: 'u',
  compound_id: 'mod-grf-1-29',
  form: 'vial',
  label: 'CJC + Ipa',
  total_mg: 5,
  remaining_mg: 5,
  concentration_mg_per_ml: 5 / 3,
  diluent_ml: 3,
  components: [{ compoundId: 'ipamorelin', mg: 5 }],
  opened_at: '2026-09-21',
  expires_at: null,
  lot: null,
  storage_notes: null,
  archived: false,
  created_at: '2026-09-21T10:00:00Z',
  updated_at: '2026-09-21T10:00:00Z',
}
const PROFILE = {
  id: 'u',
  role: 'patient',
  display_name: 'Lab',
  locale: 'es',
} as unknown as ProfileRow
const SESSION = { status: 'signed_in', session: null, user: { id: 'u' } } as SessionState

const NIGHTS = ['2026-09-29T01:05', '2026-09-30T00:40', '2026-10-01T01:10', '2026-10-02T00:55']
const dose = (iso: string, mg: number): Row => ({
  id: iso,
  patient_id: 'u',
  protocol_id: 'cjc',
  compound_id: 'mod-grf-1-29',
  dose_mg: mg,
  administered_at: new Date(iso).toISOString(),
  site_id: null,
  inventory_id: null,
  batch_id: null,
  planned_at: null,
  notes: null,
  created_at: '2026-09-29T00:00:00Z',
})
/** Doses that follow the plan; `raised` adds the three nights at 200 mcg (Wed to Fri). */
const onPlan = NIGHTS.slice(0, 2).map((iso) => dose(iso, 0.15))
const raised = [
  ...onPlan,
  ...['2026-10-01T01:10', '2026-10-02T00:55', '2026-10-03T01:20'].map((iso) => dose(iso, 0.2)),
]

function makeStore(over: Partial<Store> = {}): Store {
  return {
    profiles: [PROFILE as unknown as Row],
    protocols: [structuredClone(CJC)],
    inventory: [structuredClone(BLEND)],
    doses: structuredClone(onPlan),
    measurements: [],
    saved_protocols: [],
    alert_dismissals: [],
    ...over,
  }
}

function renderCard(store: Store, props: { focusProtocolId?: string; readOnly?: boolean } = {}) {
  setSupabaseClient(createFakeSupabase(store, { id: 'u', email: 'u@titra.test' }))
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  const view = render(
    <QueryClientProvider client={client}>
      <FixedSessionProvider value={SESSION}>
        <ToastProvider>
          <PatientScopeProvider
            value={{
              patientId: 'u',
              patient: PROFILE,
              isSelf: !props.readOnly,
              readOnly: props.readOnly ?? false,
              canPrescribe: false,
            }}
          >
            <MemoryRouter initialEntries={['/']}>
              <Routes>
                <Route path="/" element={<CycleCard focusProtocolId={props.focusProtocolId} />} />
                <Route path="/cycles" element={<p>página de ciclos</p>} />
              </Routes>
            </MemoryRouter>
          </PatientScopeProvider>
        </ToastProvider>
      </FixedSessionProvider>
    </QueryClientProvider>,
  )
  return { ...view, store }
}

const stepWeeks = (store: Store) =>
  (store.protocols[0]!.steps as { durationWeeks: number }[]).map((s) => s.durationWeeks)
const stepDoses = (store: Store) =>
  (store.protocols[0]!.steps as { doseMg: number }[]).map((s) => s.doseMg)
const keys = (store: Store) => (store.alert_dismissals ?? []).map((r) => r.alert_key)
const button = (name: RegExp | string) => screen.getByRole('button', { name })

beforeAll(async () => {
  await i18n.changeLanguage('es')
})

beforeEach(() => {
  // Sunday evening: all it takes for the plan to step up is the night.
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date('2026-10-04T20:30'))
  localStorage.clear()
})

afterEach(() => {
  cleanup()
  vi.useRealTimers()
  setSupabaseClient(null)
})

describe('CycleCard · rows', () => {
  it('shows the week, the dose now in units and the next change', async () => {
    renderCard(makeStore())
    const row = await screen.findByRole('button', { name: /Semana 2 de 12/ })
    expect(row).toHaveTextContent('9 U')
    expect(row).toHaveTextContent('150 mcg')
    expect(row).toHaveTextContent('El lun 5 sube a 12 U')
    expect(row).toHaveTextContent('en 1 día')
    expect(row).toHaveAttribute('aria-expanded', 'false')
  })

  it('opens the steps of the plan with where you are', async () => {
    renderCard(makeStore())
    fireEvent.click(await screen.findByRole('button', { name: /Semana 2 de 12/ }))
    const here = screen.getByText('estás aquí')
    expect(here).toBeInTheDocument()
    expect(screen.getByText('Escalones de la pauta')).toBeInTheDocument()
    expect(screen.getByText('Descanso')).toBeInTheDocument()
    // Two of the five planned nights were taken in this step so far.
    expect(screen.getByText('Tomas de este escalón').nextSibling).toHaveTextContent('2 de 5')
  })

  it('renders nothing without active protocols, and a skeleton while loading', async () => {
    const { container } = renderCard(makeStore({ protocols: [{ ...CJC, status: 'paused' }] }))
    expect(container.querySelector('.skeleton')).not.toBeNull()
    await waitFor(() => expect(container.querySelector('.skeleton')).toBeNull())
    expect(container.querySelector('section')).toBeNull()
  })
})

describe('CycleCard · the weekly decision', () => {
  it('asks the day before a step-up, with the person’s own rule and the three answers', async () => {
    renderCard(makeStore())
    const card = await screen.findByRole('region', { name: /CJC-1295 \+ Ipamorelina/ })
    expect(card).toHaveTextContent('Decisión de la semana')
    expect(card).toHaveTextContent('El lunes 5 sube de 9 U a 12 U (150 → 200 mcg).')
    expect(card).toHaveTextContent('¿Sin náuseas ni vómitos esta semana?')
    expect(button('Subir como estaba previsto')).toBeEnabled()
    expect(button('Mantener una semana más')).toBeEnabled()
    expect(button('Decidir luego')).toBeEnabled()
    // Nothing logged against the rule: the card does not say anything about symptoms.
    expect(card).not.toHaveTextContent('Esta semana has anotado')
  })

  it('shows what was logged this week against the rule, without judging it', async () => {
    const symptom = (id: string, kind: string, iso: string): Row => ({
      id,
      patient_id: 'u',
      kind,
      severity: 4,
      occurred_at: new Date(iso).toISOString(),
      notes: null,
      created_at: '2026-10-01T00:00:00Z',
    })
    renderCard(
      makeStore({
        symptoms: [
          symptom('s1', 'nausea', '2026-10-01T22:00'),
          symptom('s2', 'nausea', '2026-10-03T09:00'),
          symptom('s3', 'vomiting', '2026-10-03T10:00'),
          symptom('s4', 'headache', '2026-10-03T11:00'),
          symptom('s5', 'nausea', '2026-09-20T09:00'), // before this week
        ],
      }),
    )
    const card = await screen.findByRole('region', { name: /CJC-1295 \+ Ipamorelina/ })
    await waitFor(() =>
      expect(card).toHaveTextContent('Esta semana has anotado: náuseas (2), vómitos (1).'),
    )
    expect(button('Subir como estaba previsto')).toBeEnabled()
  })

  it('does not ask while the change is far off', async () => {
    vi.setSystemTime(new Date('2026-09-29T10:00'))
    renderCard(makeStore())
    await screen.findByRole('button', { name: /Semana 2 de 12/ })
    expect(screen.queryByText('Decisión de la semana')).toBeNull()
  })

  it('going up as planned is remembered, and can be taken back', async () => {
    const { store } = renderCard(makeStore())
    fireEvent.click(await screen.findByRole('button', { name: 'Subir como estaba previsto' }))

    expect(await screen.findByRole('status')).toHaveTextContent(
      'Anotado: el lunes 5 subes a 12 U (200 mcg).',
    )
    expect(screen.queryByText('Decisión de la semana')).toBeNull()
    await waitFor(() => expect(keys(store)).toEqual(['step:cjc:2']))
    // The plan itself is untouched.
    expect(stepWeeks(store)).toEqual([1, 1, 10, 4])

    fireEvent.click(button('Deshacer'))
    expect(await screen.findByText('Decisión de la semana')).toBeInTheDocument()
    await waitFor(() => expect(keys(store)).toEqual([]))
  })

  it('holding a week moves the change back a week and can be undone', async () => {
    const { store } = renderCard(makeStore())
    fireEvent.click(await screen.findByRole('button', { name: 'Mantener una semana más' }))

    // The current step gets one more week: Sin cambios hasta el lunes 12.
    expect(await screen.findByRole('status')).toHaveTextContent('Sin cambios hasta el lunes 12')
    await waitFor(() => expect(stepWeeks(store)).toEqual([1, 2, 10, 4]))
    expect(await screen.findByRole('button', { name: /Semana 2 de 13/ })).toHaveTextContent(
      'El lun 12 sube a 12 U · en 8 días',
    )
    expect(screen.queryByText('Decisión de la semana')).toBeNull()
    expect(keys(store)).toEqual([])

    fireEvent.click(button('Deshacer'))
    await waitFor(() => expect(stepWeeks(store)).toEqual([1, 1, 10, 4]))
    expect(await screen.findByText('Decisión de la semana')).toBeInTheDocument()
  })

  it('"decide later" folds it away for today and remembers that on this device', async () => {
    const { store, unmount } = renderCard(makeStore())
    fireEvent.click(await screen.findByRole('button', { name: 'Decidir luego' }))

    const folded = await screen.findByRole('button', { name: /Decisión pendiente/ })
    expect(screen.queryByRole('button', { name: 'Subir como estaba previsto' })).toBeNull()
    expect(stepWeeks(store)).toEqual([1, 1, 10, 4])
    expect(keys(store)).toEqual([])

    // Opening the app again the same day: still folded.
    unmount()
    renderCard(store)
    await screen.findByRole('button', { name: /Decisión pendiente/ })

    fireEvent.click(button(/Decisión pendiente/))
    expect(await screen.findByRole('button', { name: 'Subir como estaba previsto' })).toBeEnabled()
    expect(folded).not.toBeInTheDocument()
  })

  it('opens the decision a notification pointed at, even far from the change', async () => {
    vi.setSystemTime(new Date('2026-09-29T10:00'))
    renderCard(makeStore(), { focusProtocolId: 'cjc' })
    expect(await screen.findByText('Decisión de la semana')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Semana 2 de 12/ })).toHaveAttribute(
      'aria-expanded',
      'true',
    )
  })

  it('on the day the step starts it speaks in the present and a hold goes back a step', async () => {
    vi.setSystemTime(new Date('2026-10-05T08:00'))
    const { store } = renderCard(makeStore())
    const card = await screen.findByRole('region', { name: /CJC-1295 \+ Ipamorelina/ })
    expect(card).toHaveTextContent('Hoy sube de 9 U a 12 U (150 → 200 mcg).')

    fireEvent.click(button('Mantener una semana más'))
    // The week just ended is lengthened, so the plan is back on 150 mcg for another week.
    await waitFor(() => expect(stepWeeks(store)).toEqual([1, 2, 10, 4]))
    expect(await screen.findByRole('status')).toHaveTextContent('Sin cambios hasta el lunes 12')
  })

  it('does not announce, on the day a step starts, a dose the doses already took', async () => {
    vi.setSystemTime(new Date('2026-10-05T08:00'))
    renderCard(makeStore({ doses: structuredClone(raised) }))
    const row = await screen.findByRole('button', { name: /Semana 3 de 12/ })
    expect(row).toHaveTextContent('12 U')
    expect(screen.queryByText('Decisión de la semana')).toBeNull()
    expect(screen.queryByText('Tu pauta no coincide')).toBeNull()
  })

  it('announces the rest and lets the dosing weeks run a week longer', async () => {
    vi.setSystemTime(new Date('2026-12-12T10:00'))
    const { store } = renderCard(makeStore({ doses: [] }))
    const card = await screen.findByRole('region', { name: /CJC-1295 \+ Ipamorelina/ })
    expect(card).toHaveTextContent('Fin de las semanas de dosis: empieza el descanso el lunes 14.')

    fireEvent.click(button('Alargar una semana'))
    await waitFor(() => expect(stepWeeks(store)).toEqual([1, 1, 11, 4]))
  })

  it('offers a new cycle when the plan is over', async () => {
    vi.setSystemTime(new Date('2027-01-20T10:00'))
    const { store } = renderCard(makeStore({ doses: [] }))
    expect(await screen.findByText('Descanso terminado: ¿empiezas un nuevo ciclo?')).toBeVisible()

    fireEvent.click(button('Empezar un nuevo ciclo'))
    expect(await screen.findByText('página de ciclos')).toBeInTheDocument()
    expect(keys(store)).toEqual([])
  })

  it('asks nothing of a read-only view', async () => {
    renderCard(makeStore(), { readOnly: true })
    const row = await screen.findByRole('button', { name: /Semana 2 de 12/ })
    expect(row).toBeInTheDocument()
    expect(screen.queryByText('Decisión de la semana')).toBeNull()
  })
})

describe('CycleCard · doses that differ from the plan', () => {
  const driftStore = () => makeStore({ doses: structuredClone(raised) })

  it('says so before anything else and holds the decision back', async () => {
    renderCard(driftStore())
    const notice = await screen.findByRole('region', { name: /CJC-1295 \+ Ipamorelina/ })
    expect(notice).toHaveTextContent(
      'Tu pauta dice 9 U (150 mcg) esta semana pero llevas 3 tomas de 12 U (200 mcg).',
    )
    expect(notice).toHaveTextContent(
      'Desde el miércoles 30. Es la dosis que tu pauta marca desde el lunes 5.',
    )
    expect(screen.queryByText('Decisión de la semana')).toBeNull()
    expect(screen.queryByRole('button', { name: 'Subir como estaba previsto' })).toBeNull()
  })

  it('updating the plan brings it up to what is taken, so nothing "goes up" tomorrow', async () => {
    const { store } = renderCard(driftStore())
    fireEvent.click(await screen.findByRole('button', { name: 'Actualizar la pauta' }))

    expect(await screen.findByRole('status')).toHaveTextContent(
      'Pauta actualizada: 12 U (200 mcg) esta semana.',
    )
    await waitFor(() => expect(stepDoses(store)).toEqual([0.1, 0.2, 0.2, 0]))
    // The next step has the same dose now: no step-up to announce, no decision to take.
    const row = await screen.findByRole('button', { name: /Semana 2 de 12/ })
    expect(row).toHaveTextContent('12 U')
    expect(row).toHaveTextContent('misma dosis')
    expect(screen.queryByText('Tu pauta no coincide')).toBeNull()
    expect(screen.queryByText('Decisión de la semana')).toBeNull()

    fireEvent.click(button('Deshacer'))
    await waitFor(() => expect(stepDoses(store)).toEqual([0.1, 0.15, 0.2, 0]))
    expect(await screen.findByText('Tu pauta no coincide')).toBeInTheDocument()
  })

  it('"it was a one-off" leaves the plan alone and brings the decision back', async () => {
    const { store } = renderCard(driftStore())
    fireEvent.click(await screen.findByRole('button', { name: 'Fue puntual' }))

    await waitFor(() => expect(keys(store)).toEqual(['drift:cjc:2026-09-30']))
    expect(await screen.findByText('Decisión de la semana')).toBeInTheDocument()
    expect(screen.queryByText('Tu pauta no coincide')).toBeNull()
    expect(stepDoses(store)).toEqual([0.1, 0.15, 0.2, 0])
  })
})
