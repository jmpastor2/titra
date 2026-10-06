import { act, fireEvent, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import i18n from '@/i18n'
import { ReconstituteSheet } from './ReconstituteSheet'
import { makeStore, protocolRow, renderInApp, stubDialog, vialRow } from './testUtils'
import { WATER_SETTLE_MS } from './useWaterEntry'

beforeAll(async () => {
  stubDialog()
  await i18n.changeLanguage('es')
})
beforeEach(() => {
  // Only the clock: a dose is "current" on the day it is read.
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date('2026-10-05T10:00:00'))
})
afterEach(() => vi.useRealTimers())

const SAVE = 'Guardar reconstitución'

/** Lets typing pause long enough for the water checks to look at it. */
const settle = () => act(() => new Promise((r) => setTimeout(r, WATER_SETTLE_MS + 50)))
const warnings = () => screen.getByRole('status')

describe('ReconstituteSheet', () => {
  it('turns 100 U of water into 1 mL, 10 mg/mL and the 12 U of a 1.2 mg dose', async () => {
    renderInApp(
      <ReconstituteSheet vial={vialRow()} open onClose={() => {}} />,
      makeStore({ protocols: [protocolRow()], inventory: [vialRow()] }),
    )

    // Units are the default: nothing to switch before typing what is on the syringe.
    expect(screen.getByRole('radio', { name: 'U' })).toBeChecked()
    fireEvent.change(screen.getByLabelText('Agua bacteriostática'), { target: { value: '100' } })

    expect(screen.getByText('100 U = 1 mL')).toBeInTheDocument()
    const result = screen.getByRole('region', { name: 'Resultado' })
    expect(result).toHaveTextContent(/10\s*mg\/mL/)
    expect(result).toHaveTextContent('0,1 mg') // what one syringe unit holds
    await waitFor(() => expect(result).toHaveTextContent('12 U'))
    expect(result).toHaveTextContent('1,2 mg')
    // 28 days from the day of reconstitution, as an estimate.
    expect(result).toHaveTextContent('≈ lun 2 nov')
    await settle()
    expect(warnings()).toBeEmptyDOMElement()
  })

  it('offers 1, 2 and 3 mL as 100, 200 and 300 U', () => {
    renderInApp(
      <ReconstituteSheet vial={vialRow()} open onClose={() => {}} />,
      makeStore({ inventory: [vialRow()] }),
    )
    const water = screen.getByLabelText('Agua bacteriostática')
    for (const [label, typed] of [
      [/^200 U\s*2 mL$/, '200'],
      [/^300 U\s*3 mL$/, '300'],
      [/^100 U\s*1 mL$/, '100'],
    ] as const) {
      fireEvent.click(screen.getByRole('button', { name: label }))
      expect(water).toHaveValue(typed)
    }
    expect(screen.getByRole('button', { name: /^100 U\s*1 mL$/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })

  it('catches 100 typed as mL and fixes it in one tap', async () => {
    renderInApp(
      <ReconstituteSheet vial={vialRow()} open onClose={() => {}} />,
      makeStore({ protocols: [protocolRow()], inventory: [vialRow()] }),
    )
    fireEvent.click(screen.getByRole('radio', { name: 'mL' }))
    fireEvent.change(screen.getByLabelText('Agua bacteriostática'), { target: { value: '100' } })

    expect(screen.getByText('100 mL = 10.000 U')).toBeInTheDocument()
    const warning = warnings()
    await waitFor(() =>
      expect(warning).toHaveTextContent('100 mL es muchísima agua para un vial de 10 mg'),
    )
    expect(warning).toHaveTextContent('¿Querías decir 100 unidades (= 1 mL)?')
    // The wrong reading would have made the vial 0.1 mg/mL.
    expect(screen.getByRole('region', { name: 'Resultado' })).toHaveTextContent(/0,1\s*mg\/mL/)

    fireEvent.click(within(warning).getByRole('button', { name: 'Sí, 100 U' }))

    expect(screen.getByRole('radio', { name: 'U' })).toBeChecked()
    expect(screen.getByText('100 U = 1 mL')).toBeInTheDocument()
    expect(warning).toBeEmptyDOMElement()
    await waitFor(() =>
      expect(screen.getByRole('region', { name: 'Resultado' })).toHaveTextContent(/10\s*mg\/mL/),
    )
  })

  it('warns, without blocking, when the dose would be under 2 U or over 100 U', async () => {
    renderInApp(
      <ReconstituteSheet vial={vialRow()} open onClose={() => {}} />,
      makeStore({ protocols: [protocolRow()], inventory: [vialRow()] }),
    )
    const water = screen.getByLabelText('Agua bacteriostática')

    // 300 U of water: 3.33 mg/mL, 1.2 mg is 36 U: fine.
    fireEvent.change(water, { target: { value: '300' } })
    await screen.findByText(/36 U/)
    await settle()
    expect(warnings()).toBeEmptyDOMElement()

    // 1000 U (10 mL): 1 mg/mL, 1.2 mg would be 120 U.
    fireEvent.change(water, { target: { value: '1000' } })
    await waitFor(() => expect(warnings()).toHaveTextContent('no cabe en una jeringa de 1 mL'))
    // A warning is not a refusal.
    expect(screen.getByRole('button', { name: SAVE })).toBeEnabled()
  })

  it('checks the water once typing pauses, not on every key', async () => {
    renderInApp(
      <ReconstituteSheet vial={vialRow()} open onClose={() => {}} />,
      makeStore({ protocols: [protocolRow()], inventory: [vialRow()] }),
    )
    const water = screen.getByLabelText('Agua bacteriostática')

    // On the way to 150 U the field holds 1 U, which on its own would be a warning.
    fireEvent.change(water, { target: { value: '1' } })
    expect(warnings()).toBeEmptyDOMElement()
    fireEvent.change(water, { target: { value: '15' } })
    fireEvent.change(water, { target: { value: '150' } })
    await settle()
    expect(warnings()).toBeEmptyDOMElement()

    // A pause on 1 U is checked; so is leaving the field, at once.
    fireEvent.change(water, { target: { value: '1' } })
    await waitFor(() => expect(warnings()).toHaveTextContent('¿Querías decir 1 mL?'))
    fireEvent.change(water, { target: { value: '100' } })
    fireEvent.blur(water)
    expect(warnings()).toBeEmptyDOMElement()
  })

  it('saves only the water, the concentration and the day', async () => {
    const store = makeStore({ protocols: [protocolRow()], inventory: [vialRow()] })
    const onClose = vi.fn()
    renderInApp(<ReconstituteSheet vial={vialRow()} open onClose={onClose} />, store)

    expect(screen.getByRole('button', { name: SAVE })).toBeDisabled()
    fireEvent.change(screen.getByLabelText('Agua bacteriostática'), { target: { value: '100' } })
    fireEvent.change(screen.getByLabelText('Fecha de reconstitución'), {
      target: { value: '2026-10-03' },
    })
    fireEvent.click(screen.getByRole('button', { name: SAVE }))

    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1))
    expect(store.inventory[0]).toMatchObject({
      id: 'v1',
      label: 'MOTS-c 10 mg · reserva',
      total_mg: 10,
      remaining_mg: 10,
      lot: 'L-42',
      diluent_ml: 1,
      concentration_mg_per_ml: 10,
      opened_at: '2026-10-03',
    })
  })

  it('shows each compound of a blend and draws it as one load', async () => {
    const blend = vialRow({
      id: 'b1',
      compound_id: 'mod-grf-1-29',
      label: 'CJC-1295 + Ipamorelina 10 mg',
      total_mg: 5,
      remaining_mg: 5,
      components: [{ compoundId: 'ipamorelin', mg: 5 }],
    })
    const cjc = protocolRow({
      id: 'p2',
      compound_id: 'mod-grf-1-29',
      name: 'CJC-1295 + Ipamorelina',
      unit: 'mcg',
      steps: [{ doseMg: 0.1, intervalDays: 1, weekdays: [1, 2, 3, 4, 5], durationWeeks: null }],
      components: [{ compoundId: 'ipamorelin', doseMg: 0.1 }],
    })
    renderInApp(
      <ReconstituteSheet vial={blend} open onClose={() => {}} />,
      makeStore({ protocols: [cjc], inventory: [blend] }),
    )
    fireEvent.change(screen.getByLabelText('Agua bacteriostática'), { target: { value: '300' } })

    const result = screen.getByRole('region', { name: 'Resultado' })
    expect(result).toHaveTextContent(/1,67\s*mg\/mL/)
    expect(result).toHaveTextContent('CJC-1295 (sin DAC)')
    expect(result).toHaveTextContent('Ipamorelina')
    // 100 mcg of each is a single 6 U draw, not 12.
    await waitFor(() => expect(result).toHaveTextContent('6 U'))
    expect(result).toHaveTextContent('100 + 100 mcg')
  })

  it('renders nothing without a vial', () => {
    renderInApp(<ReconstituteSheet vial={null} open onClose={() => {}} />, makeStore())
    expect(document.querySelector('dialog')).toBeNull()
  })

  it('renders nothing while closed', () => {
    renderInApp(<ReconstituteSheet vial={vialRow()} open={false} onClose={() => {}} />, makeStore())
    expect(document.querySelector('dialog')).toBeNull()
  })
})
