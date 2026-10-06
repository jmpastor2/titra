import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { useState } from 'react'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { LogDoseSheet } from './LogDoseSheet'
import { installDomShims, makeStore, renderWithStore, setSpanish } from './testHarness'
import { blendDose, blendVial, cjcProtocol, retaProtocol, retaVial } from './testData'

beforeAll(async () => {
  installDomShims()
  await setSpanish()
})
afterEach(() => {
  vi.useRealTimers()
})

/** The sheet as the app opens it: it is gone from the screen once it has saved. */
function SheetThatCloses({ onClose }: { onClose: () => void }) {
  const [open, setOpen] = useState(true)
  return open ? (
    <LogDoseSheet
      open
      onClose={() => {
        setOpen(false)
        onClose()
      }}
    />
  ) : null
}

/** The tile inside a section of the chooser, by the section's title. */
function sectionOf(title: string) {
  const section = screen.getByRole('heading', { name: title }).closest('section')
  if (!section) throw new Error(`no section ${title}`)
  return within(section)
}

const NIGHTS = [
  '2026-09-22T01:03',
  '2026-09-23T01:00',
  '2026-09-24T00:58',
  '2026-09-25T01:07',
  '2026-09-26T01:02',
  // Monday 28's night (Tue 29 01:00) forgotten.
  '2026-09-30T01:02',
  '2026-10-01T00:58',
  '2026-10-02T01:05',
  '2026-10-03T01:00',
]

/** The log button, named after what it logs: "Registrar 9 U". */
const LOG = /^Registrar \d/

describe('LogDoseSheet, a free dose', () => {
  it('offers what you inject as tiles, and logs the CJC + ipamorelin vial as ONE draw', async () => {
    const history = NIGHTS.flatMap((at) => blendDose(at, { protocol_id: 'cjc' }))
    const store = makeStore({
      protocols: [cjcProtocol, retaProtocol],
      inventory: [blendVial, retaVial],
      doses: history,
    })
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-10-04T12:00'))
    const onClose = vi.fn()
    renderWithStore(<LogDoseSheet open onClose={onClose} />, store)

    // No dropdown of protocols: the question, and a tile for each thing.
    expect(await screen.findByText('¿Qué te has puesto?')).toBeInTheDocument()
    expect(screen.queryByText('Sin pauta (toma puntual)')).not.toBeInTheDocument()
    const protocols = sectionOf('Tus pautas')
    expect(protocols.getByText('CJC-1295 + Ipamorelina')).toBeInTheDocument()
    expect(protocols.getByText('Retatrutida')).toBeInTheDocument()
    // A blend vial is one entry, not one per compound.
    const vials = sectionOf('Tus viales')
    expect(vials.getAllByRole('button')).toHaveLength(2)

    fireEvent.click(vials.getByRole('button', { name: /CJC-1295 \+ Ipamorelina 10 mg/ }))

    // One line for the vial, starting from the protocol's dose: 6 U is 100 mcg of each.
    expect(await screen.findByText('Toma suelta')).toBeInTheDocument()
    expect(screen.getByLabelText('Dosis')).toHaveValue('6')
    expect(screen.getAllByLabelText('Dosis')).toHaveLength(1)
    // Free of any protocol: nothing to assign it to.
    expect(screen.queryByText('Cuenta para')).not.toBeInTheDocument()

    // The button says what it logs: the units drawn.
    fireEvent.click(screen.getByRole('button', { name: 'Registrar 6 U' }))
    await waitFor(() => expect(onClose).toHaveBeenCalled())

    const added = store.doses.slice(history.length)
    expect(added.map((r) => r.compound_id)).toEqual(['mod-grf-1-29', 'ipamorelin'])
    expect(added.every((r) => Math.abs(Number(r.dose_mg) - 0.1) < 1e-9)).toBe(true)
    expect(added[0]?.batch_id).toBeTruthy()
    expect(added[0]?.batch_id).toBe(added[1]?.batch_id)
    expect(added.map((r) => r.protocol_id)).toEqual([null, null])
    // The stock drops once, on the vial's own compound.
    expect(added.map((r) => r.inventory_id)).toEqual([blendVial.id, null])
    expect(Number(store.inventory[0]?.remaining_mg)).toBeCloseTo(4.5 - 0.1, 6)
    expect(await screen.findByText('Toma registrada')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Deshacer' })).toBeInTheDocument()
  })

  it('takes the dose back with the undo of the toast, once the sheet is gone', async () => {
    const store = makeStore({ protocols: [cjcProtocol], inventory: [blendVial], doses: [] })
    const onClose = vi.fn()
    renderWithStore(<SheetThatCloses onClose={onClose} />, store)

    fireEvent.click(
      (await sectionFor('Tus viales')).getByRole('button', { name: /CJC-1295 \+ Ipamorelina/ }),
    )
    fireEvent.click(await screen.findByRole('button', { name: LOG }))
    await waitFor(() => expect(onClose).toHaveBeenCalled())
    expect(store.doses).toHaveLength(2)

    // The toast outlives the sheet that raised it.
    expect(screen.queryByRole('button', { name: LOG })).not.toBeInTheDocument()
    fireEvent.click(await screen.findByRole('button', { name: 'Deshacer' }))
    await waitFor(() => expect(store.doses).toEqual([]))
    expect(Number(store.inventory[0]?.remaining_mg)).toBeCloseTo(4.5, 6)
  })

  it('still logs a single substance from its own vial', async () => {
    const store = makeStore({ protocols: [], inventory: [retaVial], doses: [] })
    const onClose = vi.fn()
    renderWithStore(<LogDoseSheet open onClose={onClose} />, store)

    fireEvent.click(
      (await sectionFor('Tus viales')).getByRole('button', { name: /Retatrutida 15 mg/ }),
    )
    // 10 units of a 10 mg/mL vial is 1 mg.
    fireEvent.change(await screen.findByLabelText('Dosis'), { target: { value: '10' } })
    fireEvent.click(screen.getByRole('button', { name: 'Registrar 10 U' }))
    await waitFor(() => expect(onClose).toHaveBeenCalled())

    expect(store.doses).toHaveLength(1)
    expect(store.doses[0]).toMatchObject({
      compound_id: 'retatrutide',
      inventory_id: retaVial.id,
      protocol_id: null,
    })
    expect(Number(store.doses[0]?.dose_mg)).toBeCloseTo(1, 9)
    expect(Number(store.inventory[0]?.remaining_mg)).toBeCloseTo(11, 6)
  })

  it('keeps the syringe in place while the amount is retyped, and names what it logs', async () => {
    const store = makeStore({ protocols: [], inventory: [retaVial], doses: [] })
    renderWithStore(<LogDoseSheet open onClose={() => {}} />, store)

    fireEvent.click(
      (await sectionFor('Tus viales')).getByRole('button', { name: /Retatrutida 15 mg/ }),
    )
    const field = await screen.findByLabelText('Dosis')
    fireEvent.change(field, { target: { value: '12,5' } })
    expect(screen.getByText('Prepara la jeringa')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Registrar 12,5 U' })).toBeInTheDocument()

    // Emptied to type another number: the guide stays (empty), the button names nothing.
    fireEvent.change(field, { target: { value: '' } })
    expect(screen.getByText('Prepara la jeringa')).toBeInTheDocument()
    expect(screen.getByText('Escribe la dosis para ver cuánto cargar.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Registrar toma' })).toBeInTheDocument()

    // Typed as a mass, it says the mass.
    fireEvent.click(screen.getByRole('tab', { name: 'mg' }))
    fireEvent.change(field, { target: { value: '1,25' } })
    expect(screen.getByRole('button', { name: 'Registrar 1,25 mg' })).toBeInTheDocument()
  })

  it('refuses an empty amount', async () => {
    const store = makeStore({ protocols: [], inventory: [retaVial], doses: [] })
    const onClose = vi.fn()
    renderWithStore(<LogDoseSheet open onClose={onClose} />, store)

    fireEvent.click(
      (await sectionFor('Tus viales')).getByRole('button', { name: /Retatrutida 15 mg/ }),
    )
    // Nothing typed yet: the button names no amount.
    fireEvent.click(await screen.findByRole('button', { name: 'Registrar toma' }))

    expect(await screen.findByText('Debe ser mayor que 0')).toBeInTheDocument()
    expect(onClose).not.toHaveBeenCalled()
    expect(store.doses).toEqual([])
  })

  it('lets you go back to the choice', async () => {
    const store = makeStore({ protocols: [cjcProtocol], inventory: [blendVial], doses: [] })
    renderWithStore(<LogDoseSheet open onClose={() => {}} />, store)

    fireEvent.click(
      (await sectionFor('Tus pautas')).getByRole('button', { name: /CJC-1295 \+ Ipamorelina/ }),
    )
    fireEvent.click(await screen.findByRole('button', { name: 'Cambiar' }))
    expect(await screen.findByText('¿Qué te has puesto?')).toBeInTheDocument()
  })
})

/** `sectionOf`, once the chooser has loaded. */
async function sectionFor(title: string) {
  await screen.findByText('¿Qué te has puesto?')
  return sectionOf(title)
}

describe('LogDoseSheet, a make-up dose', () => {
  it('counts a late CJC + ipamorelina dose as the night that was missed', async () => {
    const history = NIGHTS.flatMap((at) => blendDose(at, { protocol_id: 'cjc' }))
    const store = makeStore({ protocols: [cjcProtocol], inventory: [blendVial], doses: history })
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-10-04T08:00'))
    const onClose = vi.fn()
    renderWithStore(<LogDoseSheet open onClose={onClose} />, store)

    fireEvent.click(
      (await sectionFor('Tus pautas')).getByRole('button', { name: /CJC-1295 \+ Ipamorelina/ }),
    )

    // Sunday morning matches no night: it would be an extra, so the missed night is selected.
    const monday = await screen.findByRole('radio', { name: /lun 28 noche · 01:00 · perdida/ })
    expect(monday).toHaveAttribute('aria-checked', 'true')
    expect(
      screen.getByText('Tu adherencia sube: la del lunes pasa de perdida a hecha tarde.'),
    ).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: LOG }))
    await waitFor(() => expect(onClose).toHaveBeenCalled())

    const added = store.doses.slice(history.length)
    const night = new Date('2026-09-29T01:00').toISOString()
    expect(added.map((r) => [r.compound_id, r.planned_at, r.protocol_id])).toEqual([
      ['mod-grf-1-29', night, 'cjc'],
      ['ipamorelin', night, 'cjc'],
    ])
    expect(
      await screen.findByText('Toma registrada: cuenta como la del lun 28'),
    ).toBeInTheDocument()
  })

  it('lets you say it really was an extra', async () => {
    const history = NIGHTS.flatMap((at) => blendDose(at, { protocol_id: 'cjc' }))
    const store = makeStore({ protocols: [cjcProtocol], inventory: [blendVial], doses: history })
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-10-04T08:00'))
    const onClose = vi.fn()
    renderWithStore(<LogDoseSheet open onClose={onClose} />, store)

    fireEvent.click(
      (await sectionFor('Tus pautas')).getByRole('button', { name: /CJC-1295 \+ Ipamorelina/ }),
    )
    fireEvent.click(await screen.findByRole('radio', { name: /Ninguna: toma extra/ }))
    expect(screen.getByText('Contará como extra y no cambia tu adherencia.')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: LOG }))
    await waitFor(() => expect(onClose).toHaveBeenCalled())

    expect(store.doses.slice(history.length).map((r) => r.planned_at)).toEqual([null, null])
  })

  it('selects the administration it was opened for, logged at the time it is taken', async () => {
    // The agenda's missed Monday night: opened for it, a day and a bit later.
    const history = NIGHTS.flatMap((at) => blendDose(at, { protocol_id: 'cjc' }))
    const store = makeStore({ protocols: [cjcProtocol], inventory: [blendVial], doses: history })
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-10-04T08:00'))
    renderWithStore(
      <LogDoseSheet
        open
        onClose={() => {}}
        protocolId="cjc"
        plannedAt={new Date('2026-09-29T01:00')}
      />,
      store,
    )

    const monday = await screen.findByRole('radio', { name: /lun 28 noche · 01:00 · perdida/ })
    expect(monday).toHaveAttribute('aria-checked', 'true')
    // Taken now, honestly, rather than at the planned time.
    expect(screen.getByRole('tab', { name: 'Ahora' })).toHaveAttribute('aria-selected', 'true')
  })

  it('makes the second shot of the night the make-up of the one that was missed', async () => {
    // Monday 28's night was forgotten. Friday night's shot is taken at 01:10 and lands on
    // Friday's slot; a second shot straight after lands on nothing, so it covers Monday's.
    const history = NIGHTS.slice(0, -1).flatMap((at) => blendDose(at, { protocol_id: 'cjc' }))
    const store = makeStore({ protocols: [cjcProtocol], inventory: [blendVial], doses: history })
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-10-03T01:10'))

    const first = vi.fn()
    const { unmount } = renderWithStore(
      <LogDoseSheet open onClose={first} protocolId="cjc" />,
      store,
    )
    expect(await screen.findByText(/Cubre la de vie 2 noche · 01:00/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: LOG }))
    await waitFor(() => expect(first).toHaveBeenCalled())
    unmount()

    renderWithStore(<LogDoseSheet open onClose={() => {}} protocolId="cjc" />, store)
    const monday = await screen.findByRole('radio', { name: /lun 28 noche · 01:00 · perdida/ })
    expect(monday).toHaveAttribute('aria-checked', 'true')
  })

  it('lands an on-time dose on its own night by itself', async () => {
    // Friday's 01:00 slot is open: logged at 01:10 it covers it by its time.
    const history = NIGHTS.slice(0, -1).flatMap((at) => blendDose(at, { protocol_id: 'cjc' }))
    const store = makeStore({ protocols: [cjcProtocol], inventory: [blendVial], doses: history })
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-10-03T01:10'))
    const onClose = vi.fn()
    renderWithStore(<LogDoseSheet open onClose={onClose} protocolId="cjc" />, store)

    // It has its own night, so there is nothing to choose: no older night is offered.
    expect(await screen.findByText(/Cubre la de vie 2 noche · 01:00/)).toBeInTheDocument()
    expect(screen.queryByRole('radiogroup', { name: 'Cuenta para' })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: LOG }))
    await waitFor(() => expect(onClose).toHaveBeenCalled())

    // Nothing to assign: its time decides.
    expect(store.doses.slice(history.length).map((r) => r.planned_at)).toEqual([null, null])
  })
})
