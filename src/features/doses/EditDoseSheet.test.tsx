import { fireEvent, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import type { DoseRow } from '@/data/database.types'
import { groupAdministrations } from './administrations'
import { DeleteDoseSheet } from './DeleteDoseSheet'
import { EditDoseSheet } from './EditDoseSheet'
import { installDomShims, makeStore, renderWithStore, setSpanish } from './testHarness'
import { blendDose, blendVial, cjcProtocol } from './testData'

beforeAll(async () => {
  installDomShims()
  await setSpanish()
})
afterEach(() => vi.useRealTimers())

/** The administration the log would show for these rows. */
const administration = (rows: DoseRow[]) => {
  const [first] = groupAdministrations(rows)
  if (!first) throw new Error('no rows')
  return first
}

describe('EditDoseSheet', () => {
  it('edits a blend administration as one unit and saves each row', async () => {
    const rows = blendDose('2026-10-03T01:03', { site_id: 'abd_ul', notes: 'ok' })
    const store = makeStore({ protocols: [cjcProtocol], inventory: [blendVial], doses: rows })
    const onClose = vi.fn()
    renderWithStore(
      <EditDoseSheet open onClose={onClose} administration={administration(rows)} />,
      store,
    )

    // One draw for both compounds: 100 mcg of a 5 + 5 mg blend in 3 mL is 6 U.
    const dose = await screen.findByLabelText('Dosis')
    expect(dose).toHaveValue('6')
    expect(screen.getByText('CJC-1295 + Ipamorelina')).toBeInTheDocument()

    // Nine units is half as much again for both, and the partner follows it on screen.
    fireEvent.change(dose, { target: { value: '9' } })
    expect(screen.getAllByText(/150 mcg/).length).toBeGreaterThan(0)
    fireEvent.change(screen.getByLabelText(/Notas/), { target: { value: 'Tras la cena' } })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }))

    await waitFor(() => expect(onClose).toHaveBeenCalled())
    const [owner, partner] = store.doses
    expect(Number(owner?.dose_mg)).toBeCloseTo(0.15, 6)
    expect(Number(partner?.dose_mg)).toBeCloseTo(0.15, 6)
    expect(owner).toMatchObject({ notes: 'Tras la cena', site_id: 'abd_ul' })
    expect(partner).toMatchObject({ notes: 'Tras la cena', site_id: 'abd_ul' })
    // The vial stays on the carrier's row, and the partner never takes from it.
    expect(owner?.inventory_id).toBe(blendVial.id)
    expect(partner?.inventory_id).toBeNull()
    // The moment was not touched, seconds and all.
    expect(owner?.administered_at).toBe(rows[0]?.administered_at)
    // Stock follows in the database: 0.1 mg back, 0.15 mg taken.
    expect(Number(store.inventory[0]?.remaining_mg)).toBeCloseTo(4.5 + 0.1 - 0.15, 6)
  })

  it('moves the whole administration to another time and site', async () => {
    const rows = blendDose('2026-10-03T01:03', { site_id: 'abd_ul' })
    const store = makeStore({ protocols: [cjcProtocol], inventory: [blendVial], doses: rows })
    const onClose = vi.fn()
    renderWithStore(
      <EditDoseSheet open onClose={onClose} administration={administration(rows)} />,
      store,
    )

    await screen.findByLabelText('Dosis')
    fireEvent.change(screen.getByLabelText('Hora'), { target: { value: '00:20' } })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }))

    await waitFor(() => expect(onClose).toHaveBeenCalled())
    const moved = new Date('2026-10-03T00:20').toISOString()
    expect(store.doses.map((r) => r.administered_at)).toEqual([moved, moved])
  })

  it('saves nothing, and just closes, when nothing changed', async () => {
    const rows = blendDose('2026-10-03T01:03')
    const store = makeStore({ protocols: [cjcProtocol], inventory: [blendVial], doses: rows })
    const onClose = vi.fn()
    renderWithStore(
      <EditDoseSheet open onClose={onClose} administration={administration(rows)} />,
      store,
    )

    await screen.findByLabelText('Dosis')
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }))

    await waitFor(() => expect(onClose).toHaveBeenCalled())
    expect(store.doses).toEqual(structuredClone(rows))
    expect(Number(store.inventory[0]?.remaining_mg)).toBe(4.5)
  })

  it('refuses a dose that is not a number above zero', async () => {
    const rows = blendDose('2026-10-03T01:03')
    const store = makeStore({ protocols: [cjcProtocol], inventory: [blendVial], doses: rows })
    const onClose = vi.fn()
    renderWithStore(
      <EditDoseSheet open onClose={onClose} administration={administration(rows)} />,
      store,
    )

    fireEvent.change(await screen.findByLabelText('Dosis'), { target: { value: '0' } })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }))

    expect(await screen.findByText('Debe ser mayor que 0')).toBeInTheDocument()
    expect(onClose).not.toHaveBeenCalled()
    expect(Number(store.doses[0]?.dose_mg)).toBe(0.1)
  })

  it('assigns an extra to the night that was missed, so it counts as taken late', async () => {
    // Mon–Fri nights of two weeks, Monday 28's night (Tue 29 01:00) forgotten, and on
    // Sunday morning an extra shot to make up for it.
    const nights = [
      '2026-09-22T01:03',
      '2026-09-23T01:00',
      '2026-09-24T00:58',
      '2026-09-25T01:07',
      '2026-09-26T01:02',
      '2026-09-30T01:02',
      '2026-10-01T00:58',
      '2026-10-02T01:05',
      '2026-10-03T01:00',
    ].flatMap((at) => blendDose(at))
    const sunday = blendDose('2026-10-04T08:00')
    const store = makeStore({
      protocols: [cjcProtocol],
      inventory: [blendVial],
      doses: [...nights, ...sunday],
    })
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-10-04T12:00'))
    const onClose = vi.fn()
    renderWithStore(
      <EditDoseSheet open onClose={onClose} administration={administration(sunday)} />,
      store,
    )

    // It lands on no administration: an extra, with the missed night on offer.
    expect(await screen.findByText('Ninguna: toma extra')).toBeInTheDocument()
    expect(screen.getByText('No coincide con ninguna toma: contará como extra')).toBeInTheDocument()
    const monday = screen.getByRole('radio', { name: /lun 28 noche · 01:00 · perdida/ })
    expect(monday).toHaveTextContent('Sugerida')
    expect(monday).toHaveAttribute('aria-checked', 'false')

    fireEvent.click(monday)
    expect(monday).toHaveAttribute('aria-checked', 'true')
    expect(
      screen.getByText('Tu adherencia sube: la del lunes pasa de perdida a hecha tarde.'),
    ).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }))

    await waitFor(() => expect(onClose).toHaveBeenCalled())
    const assigned = new Date('2026-09-29T01:00').toISOString()
    const saved = store.doses.filter((r) => r.batch_id === sunday[0]?.batch_id)
    expect(saved.map((r) => r.planned_at)).toEqual([assigned, assigned])
    // Everything else stays as it was.
    expect(store.doses.filter((r) => r.planned_at !== null)).toHaveLength(2)
  })

  it('shows the administration an assigned dose covers as what it covers now', async () => {
    const monday = new Date('2026-09-29T01:00').toISOString()
    const rows = blendDose('2026-10-04T08:00', { planned_at: monday })
    const store = makeStore({ protocols: [cjcProtocol], inventory: [blendVial], doses: rows })
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-10-04T12:00'))
    renderWithStore(
      <EditDoseSheet open onClose={() => {}} administration={administration(rows)} />,
      store,
    )

    const current = await screen.findByRole('radio', { name: /la que cubre ahora/ })
    expect(current).toHaveAttribute('aria-checked', 'true')
  })
})

describe('DeleteDoseSheet', () => {
  it('names what goes, says the vial gets its amount back and deletes every row', async () => {
    const rows = blendDose('2026-10-03T01:03')
    const store = makeStore({ protocols: [cjcProtocol], inventory: [blendVial], doses: rows })
    const onClose = vi.fn()
    renderWithStore(
      <DeleteDoseSheet open onClose={onClose} administration={administration(rows)} />,
      store,
    )

    expect(await screen.findByText('¿Eliminar esta toma?')).toBeInTheDocument()
    expect(screen.getByText('CJC-1295 (sin DAC) + Ipamorelina')).toBeInTheDocument()
    expect(screen.getByText('100 + 100 mcg')).toBeInTheDocument()
    // The vial arrives with the inventory.
    expect(
      await screen.findByText('El vial «CJC-1295 + Ipamorelina 10 mg» recupera 100 mcg.'),
    ).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Eliminar' }))
    await waitFor(() => expect(onClose).toHaveBeenCalled())
    expect(store.doses).toEqual([])
    expect(Number(store.inventory[0]?.remaining_mg)).toBeCloseTo(4.6, 6)
  })

  it('changes nothing when cancelled', async () => {
    const rows = blendDose('2026-10-03T01:03')
    const store = makeStore({ protocols: [cjcProtocol], inventory: [blendVial], doses: rows })
    const onClose = vi.fn()
    renderWithStore(
      <DeleteDoseSheet open onClose={onClose} administration={administration(rows)} />,
      store,
    )

    fireEvent.click(await screen.findByRole('button', { name: 'Cancelar' }))
    expect(onClose).toHaveBeenCalled()
    expect(store.doses).toHaveLength(2)
  })
})
