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

describe('inventory page', () => {
  it('counts vials in use, in reserve and finished at a glance', async () => {
    renderInApp(<InventoryPage />, store())
    await card('MOTS-c 10 mg')
    expect(screen.getAllByRole('definition').map((d) => d.textContent)).toEqual(['1', '1', '1'])
  })

  it('shows the units for the current dose and the day of the in-use period', async () => {
    renderInApp(<InventoryPage />, store())
    const open = await card('MOTS-c 10 mg')
    // 1.2 mg from a 10 mg/mL vial: 12 U. Opened 20 Sep: day 16 of 28.
    await waitFor(() => expect(open.getByText('12 U')).toBeInTheDocument())
    expect(open.getByText('Día 16 de 28')).toBeInTheDocument()
    expect(open.getByText('10 mg/mL')).toBeInTheDocument()
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
    await waitFor(() =>
      expect(screen.getAllByRole('definition').map((d) => d.textContent)).toEqual(['1', '2', '1']),
    )
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
