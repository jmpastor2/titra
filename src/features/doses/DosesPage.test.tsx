import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { DosesPage } from './DosesPage'
import { installDomShims, makeStore, renderWithStore, setSpanish } from './testHarness'
import { blendDose, blendVial, cjcProtocol } from './testData'

beforeAll(async () => {
  installDomShims()
  await setSpanish()
})
afterEach(() => {
  vi.useRealTimers()
})

// Mon–Fri nights of two weeks, Monday 28's night (Tue 29 01:00) forgotten, and on
// Sunday morning an extra shot to make up for it.
const NIGHTS = [
  '2026-09-22T01:03',
  '2026-09-23T01:00',
  '2026-09-24T00:58',
  '2026-09-25T01:07',
  '2026-09-26T01:02',
  '2026-09-30T01:02',
  '2026-10-01T00:58',
  '2026-10-02T01:05',
  '2026-10-03T01:00',
]

function sundayStore() {
  const sunday = blendDose('2026-10-04T08:00', {
    protocol_id: 'cjc',
    site_id: 'abd_ul',
    notes: 'Toma extra',
  })
  const store = makeStore({
    protocols: [cjcProtocol],
    inventory: [blendVial],
    doses: [...NIGHTS.flatMap((at) => blendDose(at, { protocol_id: 'cjc' })), ...sunday],
  })
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date('2026-10-04T12:00'))
  return { store, sunday }
}

/** The section of the log for a day, by its heading. */
async function dayOf(heading: string) {
  const section = (await screen.findByRole('heading', { name: heading })).closest('section')
  if (!section) throw new Error(`no day ${heading}`)
  return within(section)
}

describe('DosesPage', () => {
  it('groups by day with a summary, and marks the Sunday shot as an extra that could be Monday’s', async () => {
    const { store } = sundayStore()
    renderWithStore(<DosesPage />, store)

    const today = await dayOf('Hoy')
    expect(await today.findByText('1 toma · 1 extra')).toBeInTheDocument()
    expect(today.getByText('extra')).toBeInTheDocument()
    expect(today.getByText('100 + 100 mcg')).toBeInTheDocument()
    expect(today.getByText('6 U')).toBeInTheDocument()
    expect(today.getByText('Toma extra')).toBeInTheDocument()
    // The night shots read as the evening they belong to.
    const yesterday = await dayOf('Ayer')
    expect(yesterday.getByText('vie noche')).toBeInTheDocument()
    expect(yesterday.getByText('a su hora')).toBeInTheDocument()
    expect(today.getByRole('button', { name: /¿Era la del lun 28\?/ })).toBeInTheDocument()
  })

  it('assigns the extra to Monday with one tap, and the undo puts it back', async () => {
    const { store, sunday } = sundayStore()
    renderWithStore(<DosesPage />, store)

    const today = await dayOf('Hoy')
    fireEvent.click(await today.findByRole('button', { name: /¿Era la del lun 28\?/ }))

    const night = new Date('2026-09-29T01:00').toISOString()
    await waitFor(() =>
      expect(
        store.doses.filter((r) => r.batch_id === sunday[0]?.batch_id).map((r) => r.planned_at),
      ).toEqual([night, night]),
    )
    expect(await screen.findByText('Hecho: cuenta como la del lun 28')).toBeInTheDocument()
    // No longer an extra: it is the week's make-up, five days late.
    expect(await today.findByText('retrasada 5 d')).toBeInTheDocument()
    expect(today.getByText('cubre la del lun 28')).toBeInTheDocument()
    expect(today.queryByText('extra')).not.toBeInTheDocument()
    expect(today.getByText('1 toma · 1 con retraso')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Deshacer' }))
    await waitFor(() => expect(store.doses.every((r) => r.planned_at === null)).toBe(true))
    expect(await today.findByText('extra')).toBeInTheDocument()
  })

  it('offers edit, assign and delete for a dose, and deletes it after asking', async () => {
    const { store, sunday } = sundayStore()
    renderWithStore(<DosesPage />, store)

    const today = await dayOf('Hoy')
    fireEvent.click(await today.findByRole('button', { name: /Acciones de la toma de/ }))
    expect(await screen.findByRole('button', { name: /Editar toma/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Asignar a una toma perdida/ })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Eliminar toma/ }))

    // Asks first, in the app's own sheet, and says what the vial gets back.
    expect(await screen.findByText('¿Eliminar esta toma?')).toBeInTheDocument()
    expect(store.doses).toHaveLength(NIGHTS.length * 2 + 2)
    fireEvent.click(screen.getByRole('button', { name: 'Eliminar' }))

    await waitFor(() =>
      expect(store.doses.some((r) => r.batch_id === sunday[0]?.batch_id)).toBe(false),
    )
    expect(store.doses).toHaveLength(NIGHTS.length * 2)
  })

  it('assigns from the action sheet with the suggested night already selected', async () => {
    const { store, sunday } = sundayStore()
    renderWithStore(<DosesPage />, store)

    const today = await dayOf('Hoy')
    fireEvent.click(await today.findByRole('button', { name: /Acciones de la toma de/ }))
    fireEvent.click(await screen.findByRole('button', { name: /Asignar a una toma perdida/ }))

    expect(await screen.findByText('¿Qué toma cubre?')).toBeInTheDocument()
    const monday = await screen.findByRole('radio', { name: /lun 28 noche · 01:00 · perdida/ })
    expect(monday).toHaveAttribute('aria-checked', 'true')
    fireEvent.click(screen.getByRole('button', { name: 'Asignar' }))

    const night = new Date('2026-09-29T01:00').toISOString()
    await waitFor(() =>
      expect(
        store.doses.filter((r) => r.batch_id === sunday[0]?.batch_id).map((r) => r.planned_at),
      ).toEqual([night, night]),
    )
    expect(await screen.findByText('Hecho: cuenta como la del lun 28')).toBeInTheDocument()
  })

  it('has no assign action for a dose that is not an extra', async () => {
    const { store } = sundayStore()
    renderWithStore(<DosesPage />, store)

    const yesterday = await dayOf('Ayer')
    fireEvent.click(await yesterday.findByRole('button', { name: /Acciones de la toma de/ }))
    expect(await screen.findByRole('button', { name: /Editar toma/ })).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: /Asignar a una toma perdida/ }),
    ).not.toBeInTheDocument()
  })

  it('welcomes a first dose', async () => {
    renderWithStore(<DosesPage />, makeStore({ protocols: [cjcProtocol], inventory: [blendVial] }))
    expect(await screen.findByText('Sin dosis registradas')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Registrar mi primera toma' })).toBeInTheDocument()
  })
})
