import { QueryClientProvider } from '@tanstack/react-query'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import type { ReactNode } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import i18n from '@/i18n'
import { PatientScopeProvider } from '@/app/scope'
import { ToastProvider } from '@/components/ui/Toast'
import type { DoseRow, ProfileRow, ProtocolRow } from '@/data/database.types'
import { createFakeSupabase, type Store } from '@/dev/fakeSupabase'
import { buildStore, LAB_USER } from '@/dev/fixtures'
import { FixedSessionProvider, type SessionState } from '@/features/auth/SessionProvider'
import type { ScheduleStep } from '@/domain/types'
import { createQueryClient } from '@/lib/queryClient'
import { setSupabaseClient } from '@/lib/supabase'
import { CyclesPage } from './CyclesPage'
import { cjc, CJC_VIAL, doseRow, mots, reta, RETA_VIAL, USER, weightRow } from './fixtures'

const NOW = '2026-10-05T10:00' // a Monday: week 3 of the blend cycle, week 4 of the titration

const profile: ProfileRow = {
  id: USER,
  role: 'patient',
  display_name: 'Lab',
  locale: 'es',
  unit_system: 'metric',
  clinic_code: null,
  birth_year: 1985,
  sex: 'M',
  height_cm: 178,
  goal_weight_kg: 72,
  protein_g_per_kg: 1.6,
  onboarded: true,
  reminders_enabled: false,
  reminder_lead_minutes: 0,
  created_at: '',
  updated_at: '',
}

function makeStore(
  protocols: ProtocolRow[],
  extra: { doses?: DoseRow[]; weights?: [string, number][] } = {},
): Store {
  return {
    profiles: [profile],
    protocols,
    inventory: [CJC_VIAL, RETA_VIAL],
    doses: extra.doses ?? [],
    measurements: (extra.weights ?? []).map(([iso, kg]) => weightRow(iso, kg)),
    saved_protocols: [],
    symptoms: [],
    lab_results: [],
    alert_dismissals: [],
  }
}

function mount(ui: ReactNode, db: Store, options: { readOnly?: boolean; userId?: string } = {}) {
  const userId = options.userId ?? USER
  setSupabaseClient(createFakeSupabase(db, { id: userId, email: 'lab@titra.test' }))
  const client = createQueryClient()
  client.setDefaultOptions({ queries: { retry: false, staleTime: Infinity } })
  const session: SessionState = {
    status: 'signed_in',
    session: null,
    user: { id: userId, email: 'lab@titra.test' } as SessionState['user'],
  }
  return render(
    <QueryClientProvider client={client}>
      <FixedSessionProvider value={session}>
        <ToastProvider>
          <PatientScopeProvider
            value={{
              patientId: userId,
              patient: profile,
              isSelf: true,
              readOnly: options.readOnly ?? false,
              canPrescribe: false,
            }}
          >
            <MemoryRouter>{ui}</MemoryRouter>
          </PatientScopeProvider>
        </ToastProvider>
      </FixedSessionProvider>
    </QueryClientProvider>,
  )
}

/** The account the app is built for, a few weeks in, with a finished cycle behind it. */
function account(): Store {
  const doses = [
    '2026-09-14T09:05',
    '2026-09-21T09:10',
    '2026-09-28T09:00',
    '2026-10-05T09:30',
  ].map((iso) => doseRow(iso, { protocol_id: 'reta' }))
  return makeStore(
    [
      cjc(),
      reta(),
      mots(),
      cjc({
        id: 'cjc-1',
        start_date: '2026-05-04',
        status: 'completed',
        updated_at: '2026-09-01T10:00:00.000Z',
      }),
    ],
    {
      doses,
      weights: [
        ['2026-09-18T08:00', 77],
        ['2026-10-03T08:00', 76],
      ],
    },
  )
}

const missing: string[] = []

beforeAll(async () => {
  await i18n.changeLanguage('es')
  i18n.options.saveMissing = true
  i18n.options.missingKeyHandler = (_l, _ns, key) => {
    missing.push(key)
  }
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
})
afterAll(() => {
  i18n.options.saveMissing = false
})
afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

function at(iso: string) {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date(iso))
}

describe('CyclesPage', () => {
  it('shows where each cycle stands, with its figures and the history behind it', async () => {
    at(NOW)
    mount(<CyclesPage />, account())

    expect(screen.getByRole('heading', { level: 1, name: 'Ciclos' })).toBeInTheDocument()
    expect(await screen.findByText('En curso')).toBeInTheDocument()

    // Week N of M in dosing weeks, per cycle, over the cycle's first and last day.
    expect(screen.getByText('Semana 3 de 12')).toBeInTheDocument()
    const strip = screen.getByRole('button', {
      name: 'Ver los escalones de CJC-1295 + Ipamorelina',
    })
    expect(within(strip).getByText('21 sep')).toBeInTheDocument()
    expect(within(strip).getByText('10 ene 2027')).toBeInTheDocument()
    expect(screen.getByText('Semana 4 de 5')).toBeInTheDocument()
    expect(screen.getByText('Semana 4 de 4')).toBeInTheDocument()
    // The dose now, with the syringe reading from the vial.
    expect(screen.getByText('Ahora · 200 + 200 mcg · 12 U')).toBeInTheDocument()
    expect(screen.getByText('Ahora · 1,5 mg · 15 U')).toBeInTheDocument()
    // The change that comes next.
    expect(screen.getByText('Sube a 1,75 mg · 17,5 U en 7 días · lun 12 oct')).toBeInTheDocument()

    // Adherence over the cycle so far, doses taken and weight since the start of the cycle.
    expect(screen.getAllByText('100', { selector: 'dd' }).length).toBeGreaterThan(0)
    expect(screen.getByText('4 de 4 tomas')).toBeInTheDocument()
    expect(screen.getAllByText('−1', { selector: 'dd' }).length).toBeGreaterThan(0)
    expect(screen.getAllByText('desde el inicio').length).toBeGreaterThan(0)

    // History: the finished cycle in brief, and the comparison on the one that followed it.
    expect(screen.getByText('Ciclos anteriores')).toBeInTheDocument()
    expect(screen.getByText('Del 4 may 2026 al 23 ago 2026')).toBeInTheDocument()
    expect(screen.getByText('16 semanas · 12 de dosis + 4 de descanso')).toBeInTheDocument()
    expect(screen.getByText('Comparar con el ciclo anterior')).toBeInTheDocument()
    // Nothing offers a new cycle while the plans are running or already have a successor.
    expect(screen.queryByRole('button', { name: 'Empezar un nuevo ciclo' })).toBeNull()

    expect(document.body.textContent).not.toMatch(/\bundefined\b|\bNaN\b|\[object Object\]/)
  })

  it('draws every week of a cycle, the rest included, and opens its steps from the strip', async () => {
    at(NOW)
    mount(<CyclesPage />, account())
    const strip = await screen.findByRole('button', {
      name: 'Ver los escalones de CJC-1295 + Ipamorelina',
    })
    // 12 dosing weeks and 4 of rest: sixteen bars, today's the third.
    expect(strip.querySelectorAll('[data-kind]')).toHaveLength(16)
    expect(strip.querySelectorAll('[data-kind="rest"]')).toHaveLength(4)
    expect(strip.querySelectorAll('[data-kind]')[2]).toHaveAttribute('data-kind', 'current')
    fireEvent.click(strip)

    // It opens on the step in force: dates, dose, syringe reading.
    const sheet = await screen.findByRole('dialog')
    expect(within(sheet).getByText('Escalón 3 de 4')).toBeInTheDocument()
    expect(within(sheet).getByText('200 + 200 mcg')).toBeInTheDocument()
    expect(within(sheet).getByText('12 U')).toBeInTheDocument()
    expect(within(sheet).getByText('lun 5 oct → dom 13 dic')).toBeInTheDocument()
    expect(within(sheet).getByText('Semanas 3–12')).toBeInTheDocument()
    expect(within(sheet).getByText('En curso')).toBeInTheDocument()

    // And walks along the steps from there: the rest comes next, and nothing after it.
    fireEvent.click(within(sheet).getByRole('button', { name: 'Escalón siguiente' }))
    const rest = await screen.findByRole('dialog')
    expect(within(rest).getByText('Escalón 4 de 4')).toBeInTheDocument()
    expect(within(rest).getByRole('button', { name: 'Escalón siguiente' })).toBeDisabled()
    fireEvent.click(within(rest).getByRole('button', { name: 'Escalón anterior' }))
    expect(await screen.findByText('Escalón 3 de 4')).toBeInTheDocument()
  })

  it('puts the decision in the card when a step-up is close, and keeps the step another week', async () => {
    at('2026-10-11T20:30') // Sunday: the titration steps up tomorrow
    const db = account()
    mount(<CyclesPage />, db)
    const buttons = await screen.findAllByRole('button', { name: 'Mantener una semana más' })
    expect(buttons.length).toBeGreaterThan(0)
    expect(screen.getAllByText('Toca decidir', { exact: false }).length).toBe(buttons.length)
    fireEvent.click(buttons[0]!)
    const sheet = await screen.findByRole('dialog')
    expect(within(sheet).getAllByText(/El próximo cambio pasa/).length).toBeGreaterThan(0)
  })

  it('lets the rest be lengthened and shortened, saving it on the protocol', async () => {
    at(NOW)
    const db = account()
    mount(<CyclesPage />, db)
    expect(await screen.findByText('Previsto: 4 semanas')).toBeInTheDocument()
    expect(screen.getByText(/tu referencia: 4–8 semanas/)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Alargar el descanso una semana' }))
    expect(await screen.findByText('Previsto: 5 semanas')).toBeInTheDocument()
    const steps = db.protocols.find((p) => p.id === 'cjc')!.steps as ScheduleStep[]
    expect(steps.map((s) => s.durationWeeks)).toEqual([1, 1, 10, 5])

    fireEvent.click(screen.getByRole('button', { name: 'Acortar el descanso una semana' }))
    await waitFor(() => {
      const now = db.protocols.find((p) => p.id === 'cjc')!.steps as ScheduleStep[]
      expect(now.at(-1)!.durationWeeks).toBe(4)
    })
  })

  it('counts down the rest once the dosing weeks are over', async () => {
    at('2026-12-16T10:00') // 12 dosing weeks done; the rest ends on 11 January
    mount(<CyclesPage />, makeStore([cjc()]))
    // The cycle says it, and so does the rest planner.
    expect(await screen.findByText('Descanso: quedan 4 semanas')).toBeInTheDocument()
    expect(screen.getByText('Quedan 4 semanas')).toBeInTheDocument()
  })

  it('starts the next cycle from a finished plan: a copy, a new start, the old one closed', async () => {
    at('2027-01-12T10:00') // the day after the plan and its rest ended; a Tuesday
    const db = makeStore([cjc()])
    mount(<CyclesPage />, db)

    expect(await screen.findByText('Ciclo terminado')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Empezar un nuevo ciclo' }))

    const sheet = await screen.findByRole('dialog')
    // The start defaults to the next Monday, the dose to the first step of the plan.
    const start = within(sheet).getByLabelText('Empieza el') as HTMLInputElement
    expect(start.value).toBe('2027-01-18')
    fireEvent.click(within(sheet).getByRole('tab', { name: 'Donde lo dejé' }))
    expect((within(sheet).getByRole('combobox') as HTMLSelectElement).value).toBe('2')
    expect(
      within(sheet).getByText(
        /Del lun 18 ene al dom 25 abr · 14 semanas · 10 de dosis \+ 4 de descanso/,
      ),
    ).toBeInTheDocument()

    fireEvent.click(within(sheet).getByRole('button', { name: 'Empezar el ciclo' }))
    expect(await screen.findByText('Nuevo ciclo creado')).toBeInTheDocument()

    expect(db.protocols).toHaveLength(2)
    const old = db.protocols.find((p) => p.id === 'cjc')!
    const next = db.protocols.find((p) => p.id !== 'cjc')!
    expect(old.status).toBe('completed')
    expect(next).toMatchObject({
      patient_id: USER,
      created_by: USER,
      compound_id: 'mod-grf-1-29',
      name: 'CJC-1295 + Ipamorelina',
      route: 'sc',
      unit: 'mcg',
      start_date: '2027-01-18',
      time_of_day: '01:00',
      times: ['25:00'],
      status: 'active',
      notes: 'En ayunas',
    })
    expect((next.steps as ScheduleStep[]).map((s) => s.doseMg)).toEqual([0.2, 0])
    expect(next.components).toEqual([{ compoundId: 'ipamorelin', doseMg: 0.1 }])
  })

  it('offers a new cycle from history, but never to someone who cannot edit', async () => {
    at(NOW)
    const done = cjc({ status: 'completed', updated_at: '2026-10-02T15:00:00.000Z' })
    mount(<CyclesPage />, makeStore([done]))
    expect(
      await screen.findByRole('button', { name: 'Empezar un nuevo ciclo' }),
    ).toBeInTheDocument()
    expect(screen.getByText(/cerrado antes del final del plan/)).toBeInTheDocument()
    cleanup()

    mount(<CyclesPage />, makeStore([done]), { readOnly: true })
    await screen.findByText('Ciclos anteriores')
    expect(screen.queryByRole('button', { name: 'Empezar un nuevo ciclo' })).toBeNull()
  })

  it('invites a new account to create its first protocol', async () => {
    at(NOW)
    mount(<CyclesPage />, makeStore([]))
    expect(await screen.findByText('Aún no hay ciclos')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Crear una pauta' })).toBeInTheDocument()
  })

  it('leaves out the weight when there are no readings', async () => {
    at(NOW)
    mount(<CyclesPage />, makeStore([cjc()]))
    await screen.findByText('Tomas') // the figures have loaded
    expect(screen.queryByText('desde el inicio')).toBeNull()
  })
})

describe('with the accounts of the dev lab', () => {
  for (const [name, empty, expected] of [
    ['a real account', false, /En curso/],
    ['a new account', true, /Aún no hay ciclos/],
  ] as const) {
    it(`renders ${name} without a runtime error, a stray value or a missing string`, async () => {
      at(NOW)
      const errors = vi.spyOn(console, 'error').mockImplementation(() => {})
      mount(<CyclesPage />, buildStore(new Date(), { empty }), { userId: LAB_USER.id })
      await waitFor(() => expect(document.body.textContent).toMatch(expected))
      await screen.findAllByText(empty ? 'Crear una pauta' : /Semana \d+ de \d+/)
      expect(document.body.textContent).not.toMatch(/\bundefined\b|\bNaN\b|\[object Object\]/)
      expect(errors).not.toHaveBeenCalled()
      errors.mockRestore()
    })
  }
})

describe('translations', () => {
  it('never asked for a key that does not exist', () => {
    expect([...new Set(missing)]).toEqual([])
  })
})
