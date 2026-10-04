import { act, cleanup, fireEvent, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import i18n from '@/i18n'
import type { StockAlert } from './alerts'
import { alertKey } from './alerts'
import { AlertsPanel } from './AlertsPanel'
import { StockAlerts } from './StockAlerts'
import {
  dismissalKeys,
  makeStore,
  protocolRow,
  renderInApp,
  stubDialog,
  USER_ID,
  vialRow,
} from './testUtils'
import { useStock } from './useStock'

beforeAll(async () => {
  stubDialog()
  await i18n.changeLanguage('es')
})
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date('2026-10-05T10:00:00'))
})
afterEach(() => vi.useRealTimers())

/** What Today and Inventory do: the alerts from useStock, in the component. */
function Harness() {
  const stock = useStock(USER_ID)
  return (
    <>
      <StockAlerts alerts={stock.alerts} />
      <p data-testid="read">{stock.dismissedAlerts.map((a) => a.kind).join(',')}</p>
      <p data-testid="flags">
        {[...stock.alerts, ...stock.dismissedAlerts]
          .map((a) => `${a.kind}:${stock.dismissed(a)}`)
          .join(',')}
      </p>
    </>
  )
}

/** In use since 20 Sep, with a label date that has already passed. */
const expiredVial = (over = {}) =>
  vialRow({
    id: 'v1',
    label: 'MOTS-c 10 mg',
    remaining_mg: 5,
    diluent_ml: 1,
    concentration_mg_per_ml: 10,
    opened_at: '2026-09-20',
    expires_at: '2026-10-01',
    ...over,
  })

describe('marking alerts as read', () => {
  it('hides an alert for good once read, until its situation changes', async () => {
    const store = makeStore({ inventory: [expiredVial()] })
    renderInApp(<Harness />, store)

    expect(await screen.findByText('Vial caducado')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Entendido: Vial caducado' }))

    // Gone at once, and listed as read.
    await waitFor(() => expect(screen.queryByText('Vial caducado')).toBeNull())
    expect(screen.getByTestId('read')).toHaveTextContent('expired')
    // `dismissed` tells the read one from the pending ones.
    expect(screen.getByTestId('flags')).toHaveTextContent('expired:true')
    await waitFor(() => expect(dismissalKeys(store)).toEqual(['expired:v1:danger:2026-10-01']))

    // Opening the app again (a fresh cache) does not bring it back.
    cleanup()
    const reopened = renderInApp(<Harness />, store)
    await waitFor(() => expect(screen.getByTestId('read')).toHaveTextContent('expired'))
    expect(screen.queryByText('Vial caducado')).toBeNull()

    // Editing the expiry date is a different situation: a new alert.
    store.inventory[0]!.expires_at = '2026-10-02'
    await act(async () => {
      await reopened.client.invalidateQueries({ queryKey: ['inventory', USER_ID] })
    })
    expect(await screen.findByText('Vial caducado')).toBeInTheDocument()
    expect(screen.getByTestId('read')).toHaveTextContent('')
  })

  it('offers no way to mark as read in a read-only view', async () => {
    renderInApp(<Harness />, makeStore({ inventory: [expiredVial()] }), { readOnly: true })
    expect(await screen.findByText('Vial caducado')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Entendido/ })).toBeNull()
  })

  it('reconstitutes the reserve from the alert and the alert goes away', async () => {
    // One dose left in the open vial, a reserve vial in powder, MOTS-c on Mon/Wed/Fri.
    const open = vialRow({
      id: 'open',
      label: 'MOTS-c 10 mg',
      remaining_mg: 1.2,
      diluent_ml: 1,
      concentration_mg_per_ml: 10,
      opened_at: '2026-09-30',
    })
    const reserve = vialRow({ id: 'reserve', label: 'MOTS-c reserva' })
    const store = makeStore({ protocols: [protocolRow()], inventory: [open, reserve] })
    renderInApp(<Harness />, store)

    expect(await screen.findByText('Toca reconstituir')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Reconstituir' }))

    // The sheet opens for the reserve vial, not the one running out.
    expect(screen.getByText('MOTS-c reserva')).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Agua bacteriostática'), { target: { value: '100' } })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar reconstitución' }))

    await waitFor(() => expect(screen.queryByText('Toca reconstituir')).toBeNull())
    expect(store.inventory.find((v) => v.id === 'reserve')).toMatchObject({
      diluent_ml: 1,
      concentration_mg_per_ml: 10,
    })
    // Another vial is ready: the one running out is not an alert any more.
    expect(screen.queryByText('Se acaba el vial')).toBeNull()
  })

  it('offers to archive a vial that is expired', async () => {
    const store = makeStore({ inventory: [expiredVial()] })
    renderInApp(<Harness />, store)
    await screen.findByText('Vial caducado')
    fireEvent.click(screen.getByRole('button', { name: 'Archivar' }))
    await waitFor(() => expect(store.inventory[0]!.archived).toBe(true))
  })
})

describe('alerts panel', () => {
  const stockAlert = (over: Partial<StockAlert>): StockAlert => ({
    kind: 'expiresSoon',
    severity: 'warn',
    compoundIds: ['mots-c'],
    vialId: 'v1',
    date: new Date('2026-10-08T00:00'),
    days: 3,
    ...over,
  })
  const a1 = stockAlert({})
  const a2 = stockAlert({ kind: 'reorder', vialId: undefined, severity: 'danger' })
  const read1 = stockAlert({ vialId: 'v2' })
  const read2 = stockAlert({ vialId: 'v3' })

  it('marks every alert as read at once', async () => {
    const store = makeStore()
    renderInApp(<AlertsPanel alerts={[a1, a2]} read={[]} />, store)
    fireEvent.click(screen.getByRole('button', { name: 'Marcar todas como leídas' }))
    await waitFor(() =>
      expect(dismissalKeys(store).toSorted()).toEqual([alertKey(a1), alertKey(a2)].toSorted()),
    )
  })

  it('keeps what was read collapsed and brings alerts back one by one or all', async () => {
    const store = makeStore({
      alert_dismissals: [read1, read2].map((a, i) => ({
        id: `d${i}`,
        user_id: USER_ID,
        alert_key: alertKey(a),
        created_at: '2026-10-04T10:00:00Z',
      })),
    })
    renderInApp(<AlertsPanel alerts={[]} read={[read1, read2]} />, store)

    expect(screen.getByText('Todo en orden: no hay alertas pendientes.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Recuperar' })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: /Alertas leídas \(2\)/ }))

    const restoreButtons = screen.getAllByRole('button', { name: 'Recuperar' })
    expect(restoreButtons).toHaveLength(2)
    fireEvent.click(restoreButtons[0]!)
    await waitFor(() => expect(dismissalKeys(store)).toHaveLength(1))

    fireEvent.click(screen.getByRole('button', { name: 'Recuperar todas' }))
    await waitFor(() => expect(dismissalKeys(store)).toHaveLength(0))
  })
})
