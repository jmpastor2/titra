import { fireEvent, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import i18n from '@/i18n'
import { InventorySheet } from './InventorySheet'
import { makeStore, renderInApp, stubDialog, vialRow } from './testUtils'

beforeAll(async () => {
  stubDialog()
  await i18n.changeLanguage('es')
})
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date('2026-10-05T10:00:00'))
})
afterEach(() => vi.useRealTimers())

const SWITCH = 'Ya está reconstituido'

describe('vial form', () => {
  it('starts a new vial as powder: no water until it is reconstituted', async () => {
    const store = makeStore()
    const onClose = vi.fn()
    renderInApp(<InventorySheet open onClose={onClose} editing={null} />, store)

    fireEvent.click(screen.getByRole('button', { name: /NAD\+ 500 mg/ }))
    expect(screen.getByRole('switch', { name: SWITCH })).toHaveAttribute('aria-checked', 'false')
    expect(screen.queryByLabelText('Agua bacteriostática')).toBeNull()
    // The preset says the amounts can be edited.
    expect(screen.getByText(/Edítalas si tu vial es otro/)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))
    await waitFor(() => expect(onClose).toHaveBeenCalled())
    expect(store.inventory[0]).toMatchObject({
      compound_id: 'nad-plus',
      label: 'NAD+ 500 mg',
      total_mg: 500,
      remaining_mg: 500,
      components: [],
      diluent_ml: null,
      concentration_mg_per_ml: null,
      opened_at: null,
      expires_at: null,
    })
  })

  it('lets the usual sizes of NAD+ replace the preset content, and the label follows', async () => {
    const store = makeStore()
    renderInApp(<InventorySheet open onClose={() => {}} editing={null} />, store)
    fireEvent.click(screen.getByRole('button', { name: /NAD\+ 500 mg/ }))

    fireEvent.click(screen.getByRole('button', { name: '100 mg' }))
    expect(screen.getByRole('button', { name: '100 mg' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByDisplayValue('100')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))
    await waitFor(() => expect(store.inventory).toHaveLength(1))
    expect(store.inventory[0]).toMatchObject({ total_mg: 100, label: 'NAD+ 100 mg' })
  })

  it('takes the water in units and saves the concentration of a vial already reconstituted', async () => {
    const store = makeStore()
    renderInApp(<InventorySheet open onClose={() => {}} editing={null} />, store)
    fireEvent.click(screen.getByRole('button', { name: /BPC-157 \+ TB-500 10 mg/ }))

    fireEvent.click(screen.getByRole('switch', { name: SWITCH }))
    fireEvent.change(screen.getByLabelText('Agua bacteriostática'), { target: { value: '100' } })
    expect(screen.getByText('100 U = 1 mL')).toBeInTheDocument()
    // 5 mg of each in 1 mL: 5 mg/mL.
    expect(screen.getByRole('region', { name: 'Resultado' })).toHaveTextContent(/5\s*mg\/mL/)

    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))
    await waitFor(() => expect(store.inventory).toHaveLength(1))
    expect(store.inventory[0]).toMatchObject({
      total_mg: 5,
      components: [{ compoundId: 'tb-500', mg: 5 }],
      diluent_ml: 1,
      concentration_mg_per_ml: 5,
      opened_at: '2026-10-05',
    })
  })

  it('guards the water here too: 100 in the mL field is probably 100 units', () => {
    renderInApp(<InventorySheet open onClose={() => {}} editing={null} />, makeStore())
    fireEvent.click(screen.getByRole('button', { name: /BPC-157 \+ TB-500 10 mg/ }))
    fireEvent.click(screen.getByRole('switch', { name: SWITCH }))
    fireEvent.click(screen.getByRole('radio', { name: 'mL' }))
    fireEvent.change(screen.getByLabelText('Agua bacteriostática'), { target: { value: '100' } })

    expect(screen.getByRole('status')).toHaveTextContent('¿Querías decir 100 unidades (= 1 mL)?')
    fireEvent.click(screen.getByRole('button', { name: 'Sí, 100 U' }))
    expect(screen.queryByRole('status')).toBeNull()
  })

  it('does not save a reconstituted vial without its water', () => {
    const store = makeStore()
    renderInApp(<InventorySheet open onClose={() => {}} editing={null} />, store)
    fireEvent.click(screen.getByRole('button', { name: /NAD\+ 500 mg/ }))
    fireEvent.click(screen.getByRole('switch', { name: SWITCH }))
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))
    expect(screen.getByText('Indica el agua que le añadiste.')).toBeInTheDocument()
    expect(store.inventory).toHaveLength(0)
  })

  it('opens an edit with the water the vial got, in units', () => {
    const open = vialRow({
      label: 'MOTS-c 10 mg',
      diluent_ml: 1.5,
      concentration_mg_per_ml: 10 / 1.5,
      opened_at: '2026-09-20',
    })
    renderInApp(
      <InventorySheet open onClose={() => {}} editing={open} />,
      makeStore({ inventory: [open] }),
    )
    expect(screen.getByRole('switch', { name: SWITCH })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByLabelText('Agua bacteriostática')).toHaveValue('150')
    expect(screen.getByLabelText('Reconstituido el')).toHaveValue('2026-09-20')
  })

  it('keeps a powder vial as powder when its label is edited', async () => {
    const powder = vialRow({ label: 'MOTS-c reserva', remaining_mg: 10 })
    const store = makeStore({ inventory: [{ ...powder }] })
    renderInApp(<InventorySheet open onClose={() => {}} editing={powder} />, store)
    expect(screen.getByRole('switch', { name: SWITCH })).toHaveAttribute('aria-checked', 'false')

    fireEvent.change(screen.getByLabelText('Etiqueta'), {
      target: { value: 'MOTS-c nuevo nombre' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))
    await waitFor(() => expect(store.inventory[0]!.label).toBe('MOTS-c nuevo nombre'))
    expect(store.inventory[0]).toMatchObject({
      diluent_ml: null,
      concentration_mg_per_ml: null,
      remaining_mg: 10,
      lot: 'L-42',
    })
  })
})
