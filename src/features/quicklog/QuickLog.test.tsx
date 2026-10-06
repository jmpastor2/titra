/**
 * The Registro rápido against the dev lab's in-memory database: the grid fills with the
 * state of a real account, a tap saves what it says, sheets start from the last reading,
 * and a new account or a shared view degrades gracefully.
 */
import { QueryClientProvider } from '@tanstack/react-query'
import type { ComponentProps } from 'react'
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { PatientScopeProvider } from '@/app/scope'
import { ToastProvider } from '@/components/ui/Toast'
import type { ProfileRow } from '@/data/database.types'
import { createFakeSupabase, type Row, type Store } from '@/dev/fakeSupabase'
import { setLastMeal } from '@/features/fasting/fasting'
import { buildStore, LAB_USER } from '@/dev/fixtures'
import i18n from '@/i18n'
import { createQueryClient } from '@/lib/queryClient'
import { setSupabaseClient } from '@/lib/supabase'
import { QuickLog } from './QuickLog'

// Monday afternoon: the CJC + ipamorelina dose is a long way off.
const NOW = new Date('2026-10-05T14:30:00')

beforeAll(async () => {
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
  localStorage.clear()
  setLastMeal(null)
})

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

interface Options {
  /** The moment it is; Monday afternoon by default. */
  at?: Date
  empty?: boolean
  readOnly?: boolean
  imperial?: boolean
  /** What the lead passes to the panel. */
  props?: ComponentProps<typeof QuickLog>
}

function renderQuick({
  at = NOW,
  empty = false,
  readOnly = false,
  imperial = false,
  props = {},
}: Options = {}) {
  vi.setSystemTime(at)
  const store = buildStore(at, { empty })
  const profile = store.profiles[0] as unknown as ProfileRow
  if (imperial) profile.unit_system = 'imperial'
  setSupabaseClient(createFakeSupabase(store, LAB_USER))
  const client = createQueryClient()
  client.setDefaultOptions({ queries: { retry: false, staleTime: Infinity } })
  const view = render(
    <QueryClientProvider client={client}>
      <ToastProvider>
        <PatientScopeProvider
          value={{
            patientId: LAB_USER.id,
            patient: profile,
            isSelf: true,
            readOnly,
            canPrescribe: false,
          }}
        >
          <QuickLog {...props} />
        </PatientScopeProvider>
      </ToastProvider>
    </QueryClientProvider>,
  )
  return { store, view }
}

/** The grid's buttons in reading order, by their spoken names. */
const tileNames = () =>
  screen
    .getAllByRole('button')
    .map((b) => b.getAttribute('aria-label') ?? '')
    .filter((n) => /^(Check-in|Fuerza|Toma|Agua|Peso|Síntoma|Proteína|Cintura|Ayuno|Más)\./.test(n))

const tile = (name: RegExp) => screen.findByRole('button', { name })
const rowsOf = (store: Store, kind: string): Row[] =>
  store.measurements.filter((m) => m.kind === kind)
/** A table the store does not declare by name. */
const table = (store: Store, name: string): Row[] => store[name] ?? []

/** Let the optimistic write and the follow-up refetch settle. */
const settle = () => act(async () => void (await new Promise((r) => setTimeout(r, 30))))

describe('QuickLog', () => {
  it('shows a skeleton first and then the tiles, the most pressing first', async () => {
    const { view } = renderQuick()
    expect(view.container.querySelectorAll('.skeleton')).toHaveLength(8)
    await tile(/^Agua\./)
    expect(view.container.querySelectorAll('.skeleton')).toHaveLength(0)
    const names = tileNames()
    // 7 tiles and "Más": a 2 x 4 grid.
    expect(names).toHaveLength(8)
    // Check-in (last one 5 days ago) and strength (none this week) ask first; Cintura waits in "Más".
    expect(names.slice(0, 2).map((n) => n.split('.')[0])).toEqual(['Check-in', 'Fuerza'])
    expect(names.at(-1)).toMatch(/^Más/)
    expect(names.some((n) => n.startsWith('Cintura'))).toBe(false)
    expect(screen.getByText('Registro rápido')).toBeInTheDocument()
  })

  it('counts what is pending and marks the tiles that ask', async () => {
    renderQuick()
    await tile(/^Agua\./)
    // Check-in, strength and the stale waist.
    expect(screen.getByText('3 por hacer')).toBeInTheDocument()
  })

  it('says where the weight stands: last reading, how long ago, change', async () => {
    renderQuick()
    const weight = await tile(/^Peso\./)
    expect(weight).toHaveAccessibleName(/77,0 kg\. hace 2 días · −0,4/)
  })

  it('renders nothing in a shared, read-only view', async () => {
    renderQuick({ readOnly: true })
    await settle()
    expect(screen.queryByRole('region', { name: 'Registro rápido' })).toBeNull()
    expect(screen.queryAllByRole('button')).toHaveLength(0)
  })

  it('degrades to calm starting tiles on a brand-new account', async () => {
    const { view } = renderQuick({ empty: true })
    await tile(/^Agua\./)
    expect(view.container.textContent).not.toMatch(/undefined|NaN/)
    expect(await tile(/^Peso\./)).toHaveAccessibleName(/Pésate para empezar/)
    expect(await tile(/^Check-in\./)).toHaveAccessibleName(/Empieza hoy/)
    expect(await tile(/^Toma\./)).toHaveAccessibleName(/Toma suelta/)
    expect(await tile(/^Proteína\./)).toHaveAccessibleName(/Falta tu peso|Faltan/)
    expect(tileNames().some((n) => n.startsWith('Ayuno'))).toBe(false)
  })

  describe('water', () => {
    it('adds 250 ml with one tap, shows it at once and takes it back', async () => {
      const { store } = renderQuick()
      fireEvent.click(await tile(/^Agua\./))
      expect(await tile(/^Agua\. 250 ml/)).toBeInTheDocument()
      await settle()
      expect(rowsOf(store, 'hydration_ml').map((m) => [m.value, m.unit])).toEqual([[250, 'ml']])

      fireEvent.click(screen.getByRole('button', { name: 'Deshacer +250 ml' }))
      expect(await tile(/^Agua\. 0 ml/)).toBeInTheDocument()
      await settle()
      expect(rowsOf(store, 'hydration_ml')).toHaveLength(0)
    })

    it('sums the taps of the day and ignores yesterday', async () => {
      const { store } = renderQuick()
      store.measurements.push({
        id: 'old',
        patient_id: LAB_USER.id,
        kind: 'hydration_ml',
        value: 1000,
        unit: 'ml',
        measured_at: new Date('2026-10-04T20:00:00').toISOString(),
        notes: null,
        source: 'manual',
        created_at: '',
      })
      fireEvent.click(await tile(/^Agua\./))
      fireEvent.click(await tile(/^Agua\. 250 ml/))
      expect(await tile(/^Agua\. 500 ml/)).toBeInTheDocument()
    })

    it('lists the day, takes back the last entry, and deletes an older one', async () => {
      const { store } = renderQuick()
      await tile(/^Agua\./)
      fireEvent.click(screen.getByRole('button', { name: 'Más opciones de agua' }))
      const sheet = await screen.findByRole('dialog')
      for (const ml of ['250', '500', '250']) {
        fireEvent.click(within(sheet).getByRole('button', { name: `Añadir ${ml} ml` }))
        // A minute apart, as real taps are, so "the last one" is unambiguous.
        // oxlint-disable-next-line eslint/no-await-in-loop
        await settle()
        vi.setSystemTime(new Date(Date.now() + 60_000))
      }
      expect(within(sheet).getAllByRole('listitem')).toHaveLength(3)
      expect(within(sheet).getByText('Faltan 1,5 L')).toBeInTheDocument()

      fireEvent.click(within(sheet).getByRole('button', { name: 'Deshacer' }))
      await settle()
      expect(within(sheet).getAllByRole('listitem')).toHaveLength(2)
      expect(rowsOf(store, 'hydration_ml').map((m) => m.value)).toEqual([250, 500])

      fireEvent.click(within(sheet).getByRole('button', { name: 'Eliminar 250 ml' }))
      await settle()
      expect(rowsOf(store, 'hydration_ml').map((m) => m.value)).toEqual([500])
      expect(within(sheet).getByText('Faltan 2 L')).toBeInTheDocument()
    })

    it('opens the sheet from the corner, adds 500 ml and edits the goal', async () => {
      const { store } = renderQuick()
      await tile(/^Agua\./)
      fireEvent.click(screen.getByRole('button', { name: 'Más opciones de agua' }))
      const sheet = await screen.findByRole('dialog')
      fireEvent.click(within(sheet).getByRole('button', { name: 'Añadir 500 ml' }))
      await settle()
      expect(rowsOf(store, 'hydration_ml')[0]?.value).toBe(500)
      expect(within(sheet).getByText('Faltan 2 L')).toBeInTheDocument()

      fireEvent.click(within(sheet).getByRole('button', { name: 'Subir el objetivo' }))
      expect(within(sheet).getByText('2,75 L')).toBeInTheDocument()
      expect(localStorage.getItem('titra.waterGoalMl')).toBe('2750')
    })
  })

  describe('weight', () => {
    it('opens on the last reading and saves a step with one tap', async () => {
      const { store } = renderQuick()
      fireEvent.click(await tile(/^Peso\./))
      const field = await screen.findByRole('textbox', { name: 'Peso' })
      expect(field).toHaveValue('77,0')
      expect(screen.getByText(/Última: 77,0 kg · hace 2 días/)).toBeInTheDocument()

      fireEvent.click(screen.getByRole('button', { name: 'Peso: sumar 0,1 kg' }))
      fireEvent.click(screen.getByRole('button', { name: 'Peso: sumar 0,1 kg' }))
      expect(field).toHaveValue('77,2')
      expect(screen.getByText('+0,2 kg')).toBeInTheDocument()

      fireEvent.click(screen.getByRole('button', { name: 'Guardar 77,2 kg' }))
      await settle()
      const saved = rowsOf(store, 'weight').find((m) => m.value === 77.2)
      expect(saved).toMatchObject({ unit: 'kg' })
      expect(await screen.findByText('Peso: guardado · +0,2 kg')).toBeInTheDocument()
      // The tile already shows it.
      expect(await tile(/^Peso\. 77,2 kg\. hoy/)).toBeInTheDocument()
    })

    it('lets the person type the number', async () => {
      const { store } = renderQuick()
      fireEvent.click(await tile(/^Peso\./))
      const field = await screen.findByRole('textbox', { name: 'Peso' })
      fireEvent.focus(field)
      fireEvent.change(field, { target: { value: '76,4' } })
      fireEvent.click(screen.getByRole('button', { name: 'Guardar 76,4 kg' }))
      await settle()
      expect(rowsOf(store, 'weight').some((m) => m.value === 76.4)).toBe(true)
    })

    it('refuses an implausible value before saving it', async () => {
      renderQuick()
      fireEvent.click(await tile(/^Peso\./))
      const field = await screen.findByRole('textbox', { name: 'Peso' })
      fireEvent.change(field, { target: { value: '777' } })
      expect(screen.getByRole('alert')).toHaveTextContent('Revisa el valor')
      expect(screen.getByRole('button', { name: 'Guardar' })).toBeDisabled()
    })

    it('works in pounds for an imperial user and stores kilograms', async () => {
      const { store } = renderQuick({ imperial: true })
      fireEvent.click(await tile(/^Peso\./))
      const field = await screen.findByRole('textbox', { name: 'Peso' })
      expect(field).toHaveValue('169,8')
      fireEvent.change(field, { target: { value: '170' } })
      fireEvent.click(screen.getByRole('button', { name: 'Guardar 170,0 lb' }))
      await settle()
      const saved = rowsOf(store, 'weight').find((m) => Math.abs(Number(m.value) - 77.11) < 0.001)
      expect(saved).toMatchObject({ unit: 'kg' })
    })

    it('starts empty on a new account and asks for the first reading', async () => {
      renderQuick({ empty: true })
      fireEvent.click(await tile(/^Peso\./))
      expect(await screen.findByText(/Aún sin registros/)).toBeInTheDocument()
      expect(screen.getByRole('textbox', { name: 'Peso' })).toHaveValue('')
      expect(screen.getByRole('button', { name: 'Guardar' })).toBeDisabled()
    })
  })

  describe('protein and strength', () => {
    it('adds 30 g of protein from the sheet and moves the totals', async () => {
      const { store } = renderQuick()
      fireEvent.click(await tile(/^Proteína\./))
      const sheet = await screen.findByRole('dialog')
      fireEvent.click(within(sheet).getByRole('button', { name: 'Añadir 30 g' }))
      await settle()
      expect(rowsOf(store, 'protein_g')[0]).toMatchObject({ value: 30, unit: 'g' })
      expect(within(sheet).getByText('Faltan 93 g')).toBeInTheDocument()
      expect(within(sheet).getByText(/1,6 g por kg × 77 kg/)).toBeInTheDocument()
    })

    it('logs a 45 minute session in two taps and closes', async () => {
      const { store } = renderQuick()
      fireEvent.click(await tile(/^Fuerza\./))
      const sheet = await screen.findByRole('dialog')
      fireEvent.click(within(sheet).getByRole('button', { name: 'Guardar 45 min' }))
      await settle()
      expect(rowsOf(store, 'resistance_session')[0]).toMatchObject({ value: 45, unit: 'min' })
      expect(screen.queryByRole('dialog')).toBeNull()
      expect(await screen.findByText('Sesión de fuerza guardada · 45 min')).toBeInTheDocument()
      expect(await tile(/^Fuerza\. 1 \/ 2/)).toBeInTheDocument()
    })
  })

  describe('check-in', () => {
    it('fills every dimension from the last time and saves them together', async () => {
      const { store } = renderQuick()
      const before = store.measurements.filter((m) => m.unit === 'score').length
      fireEvent.click(await tile(/^Check-in\./))
      fireEvent.click(await screen.findByRole('button', { name: /^Igual que/ }))
      fireEvent.click(screen.getByRole('button', { name: 'Guardar 7 valores' }))
      await settle()
      const scores = store.measurements.filter((m) => m.unit === 'score')
      expect(scores.length - before).toBe(7)
      const energy = scores.filter((m) => m.kind === 'energy').map((m) => m.value)
      expect(energy).toEqual([8, 8])
      expect(await tile(/^Check-in\. Hecho/)).toBeInTheDocument()
    })

    it('saves only what was scored', async () => {
      const { store } = renderQuick()
      const before = store.measurements.filter((m) => m.unit === 'score').length
      fireEvent.click(await tile(/^Check-in\./))
      const mood = await screen.findByRole('slider', { name: 'Ánimo' })
      fireEvent.change(mood, { target: { value: '9' } })
      fireEvent.click(screen.getByRole('button', { name: 'Guardar 1 valor' }))
      await settle()
      const added = store.measurements.filter((m) => m.unit === 'score').slice(before)
      expect(added).toHaveLength(1)
      expect(added[0]).toMatchObject({ kind: 'mood', value: 9 })
    })

    it('keeps the button off until something is scored', async () => {
      renderQuick()
      fireEvent.click(await tile(/^Check-in\./))
      expect(await screen.findByRole('button', { name: 'Guardar' })).toBeDisabled()
      fireEvent.change(await screen.findByRole('slider', { name: 'Energía' }), {
        target: { value: '7' },
      })
      expect(screen.getByRole('button', { name: 'Guardar 1 valor' })).toBeEnabled()
    })
  })

  describe('symptoms', () => {
    it('picks a symptom and a level and saves it on the 0 to 10 scale', async () => {
      const { store } = renderQuick()
      fireEvent.click(await tile(/^Síntoma\./))
      const sheet = await screen.findByRole('dialog')
      const save = within(sheet).getByRole('button', { name: 'Guardar' })
      expect(save).toBeDisabled()
      fireEvent.click(within(sheet).getByRole('radio', { name: 'Náuseas' }))
      fireEvent.click(within(sheet).getByRole('radio', { name: /^3\/5/ }))
      fireEvent.click(within(sheet).getByRole('button', { name: 'Guardar Náuseas · 3/5' }))
      await settle()
      expect(table(store, 'symptoms')).toHaveLength(1)
      expect(table(store, 'symptoms')[0]).toMatchObject({ kind: 'nausea', severity: 6 })
      expect(await screen.findByText('Náuseas: guardado')).toBeInTheDocument()
    })
  })

  describe('"Más"', () => {
    it('keeps what did not fit, with its state, and everything else', async () => {
      renderQuick()
      fireEvent.click(await tile(/^Más\./))
      const sheet = await screen.findByRole('dialog')
      expect(within(sheet).getByText('Cintura')).toBeInTheDocument()
      expect(within(sheet).getByText(/91,0 cm · hace 10 días/)).toBeInTheDocument()
      for (const name of ['Añadir analítica', 'Medidas corporales', 'Pasos', 'Toma suelta']) {
        expect(within(sheet).getByText(name)).toBeInTheDocument()
      }
    })

    it('opens the same sheet as the tile would from a row of the panel', async () => {
      renderQuick()
      fireEvent.click(await tile(/^Más\./))
      fireEvent.click(await screen.findByText('Cintura'))
      const field = await screen.findByRole('textbox', { name: 'Cintura' })
      expect(field).toHaveValue('91,0')
      expect(screen.getByText(/Última: 91,0 cm · hace 10 días/)).toBeInTheDocument()
    })

    it('opens a free dose, with nothing chosen yet', async () => {
      renderQuick()
      fireEvent.click(await tile(/^Más\./))
      fireEvent.click(await screen.findByText('Toma suelta'))
      // The dose sheet, open on the choice of what was taken (its own wording is its own).
      const dose = await screen.findByRole('dialog')
      expect(dose).not.toHaveTextContent('Más registros')
      expect(dose).toHaveTextContent('Retatrutida')
    })

    it('opens the tape measurements and saves only what changed', async () => {
      const { store } = renderQuick()
      fireEvent.click(await tile(/^Más\./))
      fireEvent.click(await screen.findByText('Medidas corporales'))
      const hip = await screen.findByRole('textbox', { name: 'Cadera' })
      expect(hip).toHaveValue('')
      const waist = screen.getByRole('textbox', { name: 'Cintura' })
      expect(waist).toHaveValue('91,0')
      fireEvent.click(screen.getByRole('button', { name: 'Cintura: restar 0,5 cm' }))
      fireEvent.change(hip, { target: { value: '99,5' } })
      fireEvent.click(screen.getByRole('button', { name: 'Guardar 2 medidas' }))
      await settle()
      expect(rowsOf(store, 'waist').some((m) => m.value === 90.5)).toBe(true)
      expect(rowsOf(store, 'hip').map((m) => m.value)).toEqual([99.5])
      expect(rowsOf(store, 'chest')).toHaveLength(0)
    })

    it('shows the tape measurements in inches for an imperial user and stores centimetres', async () => {
      const { store } = renderQuick({ imperial: true })
      fireEvent.click(await tile(/^Más\./))
      fireEvent.click(await screen.findByText('Medidas corporales'))
      const waist = await screen.findByRole('textbox', { name: 'Cintura' })
      expect(waist).toHaveValue('35,8')
      fireEvent.click(screen.getByRole('button', { name: 'Cintura: sumar 0,2 in' }))
      expect(waist).toHaveValue('36,0')
      fireEvent.click(screen.getByRole('button', { name: 'Guardar 1 medida' }))
      await settle()
      expect(rowsOf(store, 'waist').at(-1)).toMatchObject({ value: 91.44, unit: 'cm' })
    })

    it('opens the other readings through the same fast stepper', async () => {
      const { store } = renderQuick()
      fireEvent.click(await tile(/^Más\./))
      fireEvent.click(await screen.findByText('Pasos'))
      const field = await screen.findByRole('textbox', { name: 'Pasos' })
      fireEvent.change(field, { target: { value: '8.500' } })
      fireEvent.click(screen.getByRole('button', { name: /^Guardar 8500/ }))
      await settle()
      expect(rowsOf(store, 'steps')[0]).toMatchObject({ value: 8500, unit: 'steps' })
    })
  })

  describe('taking a save back', () => {
    it('says where the water stands after a tap and takes that tap back from the toast', async () => {
      const { store } = renderQuick()
      fireEvent.click(await tile(/^Agua\./))
      expect(await screen.findByText('Agua: 250 ml de 2,5 L')).toBeInTheDocument()
      await settle()
      expect(rowsOf(store, 'hydration_ml')).toHaveLength(1)
      fireEvent.click(screen.getByRole('button', { name: 'Deshacer +250 ml' }))
      expect(await tile(/^Agua\. 0 ml/)).toBeInTheDocument()
      await settle()
      expect(rowsOf(store, 'hydration_ml')).toHaveLength(0)
    })

    it('keeps one way back at a time while the water is tapped again and again', async () => {
      const { store } = renderQuick()
      fireEvent.click(await tile(/^Agua\./))
      await screen.findByText('Agua: 250 ml de 2,5 L')
      fireEvent.click(await tile(/^Agua\. 250 ml/))
      expect(await screen.findByText('Agua: 500 ml de 2,5 L')).toBeInTheDocument()
      expect(screen.queryByText('Agua: 250 ml de 2,5 L')).toBeNull()
      // The toast takes back the latest tap only.
      fireEvent.click(screen.getByRole('button', { name: 'Deshacer +250 ml' }))
      await settle()
      expect(rowsOf(store, 'hydration_ml')).toHaveLength(1)
    })

    it('takes a weight back', async () => {
      const { store } = renderQuick()
      const before = rowsOf(store, 'weight').length
      fireEvent.click(await tile(/^Peso\./))
      await screen.findByRole('textbox', { name: 'Peso' })
      fireEvent.click(screen.getByRole('button', { name: 'Peso: sumar 0,1 kg' }))
      fireEvent.click(screen.getByRole('button', { name: 'Guardar 77,1 kg' }))
      await settle()
      expect(rowsOf(store, 'weight')).toHaveLength(before + 1)
      fireEvent.click(await screen.findByRole('button', { name: 'Deshacer' }))
      await settle()
      expect(rowsOf(store, 'weight')).toHaveLength(before)
      expect(await tile(/^Peso\. 77,0 kg/)).toBeInTheDocument()
    })

    it('takes a whole check-in back', async () => {
      const { store } = renderQuick()
      const before = store.measurements.filter((m) => m.unit === 'score').length
      fireEvent.click(await tile(/^Check-in\./))
      fireEvent.click(await screen.findByRole('button', { name: /^Igual que/ }))
      fireEvent.click(screen.getByRole('button', { name: 'Guardar 7 valores' }))
      await settle()
      expect(store.measurements.filter((m) => m.unit === 'score')).toHaveLength(before + 7)
      fireEvent.click(await screen.findByRole('button', { name: 'Deshacer' }))
      await settle()
      expect(store.measurements.filter((m) => m.unit === 'score')).toHaveLength(before)
    })

    it('takes a strength session back', async () => {
      const { store } = renderQuick()
      fireEvent.click(await tile(/^Fuerza\./))
      fireEvent.click(
        within(await screen.findByRole('dialog')).getByRole('button', {
          name: 'Guardar 45 min',
        }),
      )
      await settle()
      expect(rowsOf(store, 'resistance_session')).toHaveLength(1)
      fireEvent.click(await screen.findByRole('button', { name: 'Deshacer' }))
      await settle()
      expect(rowsOf(store, 'resistance_session')).toHaveLength(0)
      expect(await tile(/^Fuerza\. 0 \/ 2/)).toBeInTheDocument()
    })

    it('takes a symptom back, even when asked before the server has answered', async () => {
      const { store } = renderQuick()
      fireEvent.click(await tile(/^Síntoma\./))
      const sheet = await screen.findByRole('dialog')
      fireEvent.click(within(sheet).getByRole('radio', { name: 'Náuseas' }))
      fireEvent.click(within(sheet).getByRole('radio', { name: /^2\/5/ }))
      fireEvent.click(within(sheet).getByRole('button', { name: 'Guardar Náuseas · 2/5' }))
      fireEvent.click(await screen.findByRole('button', { name: 'Deshacer' }))
      await settle()
      expect(table(store, 'symptoms')).toHaveLength(0)
    })

    it('takes tape measurements back, all of them', async () => {
      const { store } = renderQuick()
      fireEvent.click(await tile(/^Más\./))
      fireEvent.click(await screen.findByText('Medidas corporales'))
      fireEvent.change(await screen.findByRole('textbox', { name: 'Cadera' }), {
        target: { value: '99,5' },
      })
      fireEvent.change(screen.getByRole('textbox', { name: 'Pecho' }), { target: { value: '101' } })
      fireEvent.click(screen.getByRole('button', { name: 'Guardar 2 medidas' }))
      await settle()
      expect(rowsOf(store, 'hip')).toHaveLength(1)
      expect(rowsOf(store, 'chest')).toHaveLength(1)
      fireEvent.click(await screen.findByRole('button', { name: 'Deshacer' }))
      await settle()
      expect(rowsOf(store, 'hip')).toHaveLength(0)
      expect(rowsOf(store, 'chest')).toHaveLength(0)
    })

    it('takes a lab result back', async () => {
      const { store } = renderQuick()
      fireEvent.click(await tile(/^Más\./))
      fireEvent.click(await screen.findByText('Añadir analítica'))
      fireEvent.click(await screen.findByRole('button', { name: 'HbA1c' }))
      fireEvent.change(screen.getByLabelText('Valor'), { target: { value: '5,2' } })
      fireEvent.click(screen.getByRole('button', { name: 'Guardar 5,2 %' }))
      await settle()
      expect(table(store, 'lab_results')).toHaveLength(1)
      fireEvent.click(await screen.findByRole('button', { name: 'Deshacer' }))
      await settle()
      expect(table(store, 'lab_results')).toHaveLength(0)
    })

    it('goes back to the meal that was noted before', async () => {
      setLastMeal(new Date('2026-10-05T20:00:00'))
      renderQuick({ at: new Date('2026-10-05T22:30:00') })
      fireEvent.click(await tile(/^Ayuno\./))
      fireEvent.click(await screen.findByRole('button', { name: 'Acabo de comer' }))
      expect(await tile(/^Ayuno\. Listo 00:30/)).toBeInTheDocument()
      fireEvent.click(await screen.findByRole('button', { name: 'Deshacer' }))
      expect(await tile(/^Ayuno\. En ayunas\. desde las 22:00/)).toBeInTheDocument()
    })
  })

  it('does not reshuffle the tiles under a finger', async () => {
    renderQuick()
    await tile(/^Agua\./)
    const before = tileNames().map((n) => n.split('.')[0])
    // A tap changes the water tile's state; the grid keeps its order.
    fireEvent.click(await tile(/^Agua\./))
    await settle()
    expect(tileNames().map((n) => n.split('.')[0])).toEqual(before)
  })

  it('waits for the data before it asks for anything', async () => {
    const { view } = renderQuick()
    await waitFor(() => expect(view.container.querySelectorAll('.skeleton')).toHaveLength(0))
    expect(screen.queryByText(/por hacer/)).toBeInTheDocument()
  })

  describe('through the night', () => {
    // 22:30 on a Monday: the 01:00 CJC + ipamorelina dose is two and a half hours away.
    const EVENING = new Date('2026-10-05T22:30:00')

    it('asks for the fast when a GH dose is near, and starts the countdown in two taps', async () => {
      renderQuick({ at: EVENING })
      const fasting = await tile(/^Ayuno\./)
      expect(fasting).toHaveAccessibleName(/Sin anotar\. ¿Cuándo comiste\?/)
      fireEvent.click(fasting)
      const sheet = await screen.findByRole('dialog')
      fireEvent.click(within(sheet).getByRole('button', { name: 'Acabo de comer' }))
      expect(screen.queryByRole('dialog')).toBeNull()
      expect(await screen.findByText('Comida anotada: ayuno listo a las 00:30')).toBeInTheDocument()
      expect(await tile(/^Ayuno\. Listo 00:30\. faltan 120 min/)).toBeInTheDocument()
      expect(localStorage.getItem('titra.lastMeal')).not.toBeNull()
    })

    it('says "En ayunas" once the two hours are up', async () => {
      setLastMeal(new Date('2026-10-05T20:00:00'))
      renderQuick({ at: EVENING })
      await tile(/^Agua\./)
      expect(await tile(/^Ayuno\. En ayunas\. desde las 22:00/)).toBeInTheDocument()
    })

    it('puts the dose that is due first, with its units, and opens its log', async () => {
      renderQuick({ at: new Date('2026-10-06T00:55:00') })
      const dose = await tile(/^Toma\./)
      expect(dose).toHaveAccessibleName(/Toca ahora\. CJC \+ Ipa · 9 U/)
      expect(tileNames()[0]).toMatch(/^Toma\./)
      expect(screen.getByText('5 por hacer')).toBeInTheDocument()
      fireEvent.click(dose)
      expect(await screen.findByRole('dialog')).toHaveTextContent('Registrar toma')
    })
  })

  describe('labs', () => {
    it('offers the analytes already logged first and starts from their unit and range', async () => {
      const { store } = renderQuick()
      table(store, 'lab_results').push({
        id: 'ldl-1',
        patient_id: LAB_USER.id,
        drawn_at: '2026-07-01',
        analyte: 'LDL',
        value: 120,
        unit: 'mmol/L',
        ref_low: null,
        ref_high: 3.4,
        notes: null,
        created_at: '2026-07-01T10:00:00Z',
      })
      fireEvent.click(await tile(/^Más\./))
      fireEvent.click(await screen.findByText('Añadir analítica'))
      const chips = await screen.findAllByRole('button', { pressed: false })
      expect(chips.find((b) => b.textContent === 'LDL')).toBeDefined()
      fireEvent.click(screen.getByRole('button', { name: 'LDL' }))
      expect(screen.getByLabelText('Unidad')).toHaveValue('mmol/L')
      expect(screen.getByText(/Última: 120 mmol\/L/)).toBeInTheDocument()

      fireEvent.change(screen.getByLabelText('Valor'), { target: { value: '3,9' } })
      expect(screen.getByText('Fuera de rango')).toBeInTheDocument()
      fireEvent.click(screen.getByRole('button', { name: 'Guardar 3,9 mmol/L' }))
      await settle()
      expect(table(store, 'lab_results').at(-1)).toMatchObject({
        analyte: 'LDL',
        value: 3.9,
        unit: 'mmol/L',
        ref_high: 3.4,
      })
    })

    it('no longer saves an empty value as zero', async () => {
      const { store } = renderQuick()
      fireEvent.click(await tile(/^Más\./))
      fireEvent.click(await screen.findByText('Añadir analítica'))
      fireEvent.click(await screen.findByRole('button', { name: 'HbA1c' }))
      expect(screen.getByRole('button', { name: 'Guardar' })).toBeDisabled()
      expect(table(store, 'lab_results')).toHaveLength(0)
    })
  })

  it('speaks English without a missing word', async () => {
    const missing: string[] = []
    i18n.options.saveMissing = true
    i18n.options.missingKeyHandler = (_l, _ns, key) => {
      missing.push(key)
    }
    await i18n.changeLanguage('en')
    try {
      const { view } = renderQuick()
      fireEvent.click(await tile(/^Water\./))
      expect(await tile(/^Water\. 250 ml/)).toBeInTheDocument()
      expect(tileNames()[0]).toMatch(/^Check-in\. Due today/)
      // Each sheet in turn: open it, make sure it spoke English, close it.
      for (const name of [/^Weight\./, /^Protein\./, /^Strength\./, /^Symptom\./, /^Check-in\./]) {
        // oxlint-disable-next-line eslint/no-await-in-loop
        fireEvent.click(await tile(name))
        // oxlint-disable-next-line eslint/no-await-in-loop
        expect(await screen.findByRole('dialog')).toBeInTheDocument()
        fireEvent.click(screen.getByRole('button', { name: 'Close' }))
      }
      fireEvent.click(await tile(/^More\./))
      expect(await screen.findByText('From the panel')).toBeInTheDocument()
      expect(view.container.textContent).not.toMatch(/undefined|NaN|quick\./)
      expect([...new Set(missing)]).toEqual([])
    } finally {
      i18n.options.saveMissing = false
      await i18n.changeLanguage('es')
    }
  })

  it('takes a class name and a size for the screen that places it', async () => {
    const { view } = renderQuick({ props: { className: 'mt-4', max: 5 } })
    await tile(/^Agua\./)
    const panel = view.container.querySelector('section')
    expect(panel).toHaveClass('mt-4')
    expect(panel).not.toHaveClass('card')
    // The five that are always there and "Más": what asks for a look waits in the sheet.
    expect(tileNames()).toHaveLength(6)
    expect(tileNames().some((n) => n.startsWith('Check-in'))).toBe(false)
    expect(screen.getByRole('heading', { name: 'Registro rápido' })).toBeInTheDocument()
  })
})
