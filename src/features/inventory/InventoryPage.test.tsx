import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import i18n from '@/i18n'
import { InventoryPage } from './InventoryPage'
import { makeStore, protocolRow, renderInApp, stubDialog, vialRow } from './testUtils'

beforeAll(async () => {
  stubDialog()
  window.scrollTo = () => {}
  await i18n.changeLanguage('es')
})
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date('2026-10-05T10:00:00'))
})
afterEach(() => vi.useRealTimers())

/** MOTS-c in use since 20 Sep, a reserve vial in powder and one archived long ago. */
const inUse = vialRow({
  id: 'open',
  label: 'MOTS-c 10 mg',
  remaining_mg: 4,
  diluent_ml: 1,
  concentration_mg_per_ml: 10,
  opened_at: '2026-09-20',
  created_at: '2026-09-10T10:00:00Z',
})
const reserve = vialRow({
  id: 'reserve',
  label: 'MOTS-c reserva',
  created_at: '2026-09-12T10:00:00Z',
})
const archived = vialRow({
  id: 'old',
  label: 'MOTS-c viejo',
  remaining_mg: 0,
  archived: true,
  created_at: '2026-08-01T10:00:00Z',
})

const store = () =>
  makeStore({
    protocols: [protocolRow()],
    inventory: [inUse, reserve, archived].map((v) => Object.assign({}, v)),
  })

/** The card of a vial, found by its label. */
const card = async (label: string) => {
  const heading = await screen.findByText(label, { selector: 'div' })
  const section = heading.closest('section')
  if (!section) throw new Error(`no card for ${label}`)
  return within(section)
}

/** The big number of one reading of the stock strip, found by its label. */
const reading = (label: string) =>
  screen.getByText(label, { selector: 'dt' }).parentElement?.querySelector('dd > span')?.textContent

describe('inventory page', () => {
  it('reads the stock at a glance: vials open and waiting, what expires first, when to order', async () => {
    renderInApp(<InventoryPage />, store())
    await card('MOTS-c 10 mg')
    expect(reading('En uso')).toBe('1')
    expect(reading('Reserva')).toBe('1')
    // Opened 20 Sep: the 28 days end on 18 Oct, an estimate.
    expect(reading('Caduca primero')).toBe('≈ 18 oct')
    // Everything runs out on a date; the order goes in three weeks before it.
    expect(reading('Pedir')).toMatch(/^(\d+ \w+|Ya)$/)
    // The cover: days to the first run-out, with a gauge that has the order point on it.
    expect(screen.getByText('Cobertura')).toBeInTheDocument()
    expect(
      screen.getByRole('meter', { name: /Tu stock te llega para \d+ días/ }),
    ).toBeInTheDocument()
    expect(screen.getByText(/^Lo primero en acabarse: MOTS-c, el /)).toBeInTheDocument()
  })

  it('says so when no protocol takes anything from the stock, and shows no empty readings', async () => {
    renderInApp(<InventoryPage />, makeStore({ inventory: [Object.assign({}, inUse)] }))
    await card('MOTS-c 10 mg')
    expect(screen.getAllByText('Sin pautas que usen tu stock').length).toBeGreaterThan(0)
    expect(screen.queryByText('Pedir', { selector: 'dt' })).toBeNull()
    expect(screen.queryByText('—')).toBeNull()
  })

  it('leads with the doses left and shows the units for the current dose', async () => {
    renderInApp(<InventoryPage />, store())
    const open = await card('MOTS-c 10 mg')
    // 1.2 mg from a 10 mg/mL vial: 12 U. 4 mg left covers three of those doses.
    await waitFor(() => expect(open.getByText('12 U')).toBeInTheDocument())
    expect(open.getByText('tomas')).toBeInTheDocument()
    expect(open.getByText('10 mg/mL')).toBeInTheDocument()
    // The use-by date in words: 13 days from 5 Oct to 18 Oct, an estimate.
    expect(open.getByText('Caduca en 13 días · ≈ dom 18 oct')).toBeInTheDocument()
    // No rings any more.
    expect(open.queryByRole('img')).toBeNull()
    // The label already says "MOTS-c": the substance is not written a second time above it.
    expect(open.queryByText('MOTS-c', { selector: 'div' })).toBeNull()
  })

  it('writes the names of a blend vial out in full, never cut at the side of the card', async () => {
    const blend = vialRow({
      id: 'blend',
      compound_id: 'mod-grf-1-29',
      label: 'Vial de las noches de entre semana · lote 2026-A de reserva · 10 mg',
      total_mg: 5,
      remaining_mg: 5,
      components: [{ compoundId: 'ipamorelin', mg: 5 }],
    })
    renderInApp(<InventoryPage />, makeStore({ inventory: [blend] }))
    const vialCard = await card(blend.label)
    const label = vialCard.getByText(blend.label)
    const eyebrow = vialCard.getByText('CJC-1295 (sin DAC) + Ipamorelina')
    for (const el of [label, eyebrow]) {
      // Nothing between the text and the card may cut it off with an ellipsis.
      for (let n: HTMLElement | null = el; n && n.tagName !== 'SECTION'; n = n.parentElement)
        expect(n.className).not.toMatch(/truncate|line-clamp|text-ellipsis/)
    }
    // A blend is a vial of both substances: 10 mg, not just the first one's 5.
    expect(vialCard.getByText('10')).toBeInTheDocument()
  })

  it('reconstitutes a powder vial from its card', async () => {
    const s = store()
    renderInApp(<InventoryPage />, s)
    const powder = await card('MOTS-c reserva')
    fireEvent.click(powder.getByRole('button', { name: 'Reconstituir' }))

    fireEvent.change(await screen.findByLabelText('Agua bacteriostática'), {
      target: { value: '100' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar reconstitución' }))
    await waitFor(() =>
      expect(s.inventory.find((v) => v.id === 'reserve')).toMatchObject({
        diluent_ml: 1,
        concentration_mg_per_ml: 10,
      }),
    )
  })

  it('adds another vial like this one: same product, still powder, no dates', async () => {
    const s = store()
    renderInApp(<InventoryPage />, s)
    const open = await card('MOTS-c 10 mg')
    fireEvent.click(open.getByRole('button', { name: 'Añadir otro igual: MOTS-c 10 mg' }))

    await waitFor(() => expect(s.inventory).toHaveLength(4))
    expect(s.inventory[3]).toMatchObject({
      compound_id: 'mots-c',
      label: 'MOTS-c 10 mg',
      total_mg: 10,
      remaining_mg: 10,
      diluent_ml: null,
      concentration_mg_per_ml: null,
      opened_at: null,
      expires_at: null,
      archived: false,
    })
    // It shows up as one more in reserve.
    await waitFor(() => expect(reading('Reserva')).toBe('2'))
    expect(reading('En uso')).toBe('1')
  })

  it('archives a vial and restores it from the finished ones', async () => {
    const s = store()
    renderInApp(<InventoryPage />, s)
    const powder = await card('MOTS-c reserva')
    fireEvent.click(powder.getByRole('button', { name: 'Archivar MOTS-c reserva' }))
    await waitFor(() => expect(s.inventory.find((v) => v.id === 'reserve')!.archived).toBe(true))

    fireEvent.click(await screen.findByRole('button', { name: /Terminados y archivados \(2\)/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Restaurar MOTS-c reserva' }))
    await waitFor(() => expect(s.inventory.find((v) => v.id === 'reserve')!.archived).toBe(false))
  })

  it('adds a vial of a substance from the restock card, like the last one', async () => {
    const s = store()
    renderInApp(<InventoryPage />, s)
    fireEvent.click(await screen.findByRole('button', { name: 'Añadir un vial de MOTS-c' }))
    await waitFor(() => expect(s.inventory).toHaveLength(4))
    // The newest vial of the substance was the reserve one.
    expect(s.inventory[3]).toMatchObject({
      label: 'MOTS-c reserva',
      remaining_mg: 10,
      diluent_ml: null,
    })
  })

  it('invites to add the first vial, with the usual ones one tap away', async () => {
    renderInApp(<InventoryPage />, makeStore())
    expect(await screen.findByText('Sin inventario')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /NAD\+ 500 mg/ }))

    // The form opens with NAD+ and its usual content, and says it can be edited.
    expect(await screen.findByText(/Edítalas si tu vial es otro/)).toBeInTheDocument()
    expect(screen.getByDisplayValue('500')).toBeInTheDocument()
  })
})
