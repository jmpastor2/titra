import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import i18n from '@/i18n'
import { ProtocolsPage } from './ProtocolsPage'
import { blendVial, cjcProtocol, renderRoutes, storeWith, stubDialog, USER } from './testApp'

const routes = [
  { path: '/protocols', element: <ProtocolsPage /> },
  { path: '/protocols/new', element: <div>nueva</div> },
  { path: '/protocols/:protocolId', element: <div>detalle</div> },
  { path: '/protocols/:protocolId/edit', element: <div>editor</div> },
]

const weeks = (row: Record<string, unknown> | undefined) =>
  ((row?.steps ?? []) as { durationWeeks: number | null }[]).map((s) => s.durationWeeks)

beforeAll(async () => {
  stubDialog()
  await i18n.changeLanguage('es')
})
// Sunday evening: the CJC steps up to 12 U on Monday.
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date('2026-10-04T20:30:00'))
})
afterEach(() => vi.useRealTimers())

function open(rows: Parameters<typeof storeWith>[0] = {}) {
  const store = storeWith({ protocols: [cjcProtocol()], inventory: [blendVial()], ...rows })
  return { store, ...renderRoutes(routes, '/protocols', store) }
}

describe('ProtocolsPage', () => {
  it('says where each protocol stands: week, dose in units and what changes next', async () => {
    open()
    // The staircase of weeks, the dose in units as the big figure and, under it, in mass.
    await screen.findByRole('img', { name: 'Semana 2 de 12' })
    expect(screen.getByText('9', { selector: 'span' })).toHaveTextContent('9U')
    expect(screen.getByText('150 + 150 mcg')).toBeInTheDocument()
    expect(screen.getByText('Semana 2 de 12 · sube el lun 5 a 12 U')).toBeInTheDocument()
    // With the step-up close, the card only flags it and leads to Ciclos, where it is taken.
    expect(screen.getByRole('link', { name: 'Toca decidir mañana' })).toHaveAttribute(
      'href',
      '/cycles',
    )
    expect(screen.queryByText('Si no haces nada, sube ese día.')).toBeNull()
  })

  it('says what comes next where there is nothing to decide yet', async () => {
    vi.setSystemTime(new Date('2026-10-06T10:00:00'))
    open()
    await screen.findByRole('img', { name: 'Semana 3 de 12' })
    expect(screen.queryByText(/Toca decidir/)).not.toBeInTheDocument()
    expect(screen.getByText('Semana 3 de 12 · descanso desde el lun 14 dic')).toBeInTheDocument()
  })

  it('shows Edit and the menu on the card, both as big as a thumb', async () => {
    const { router } = open()
    await screen.findByRole('img', { name: 'Semana 2 de 12' })
    expect(screen.getByRole('button', { name: 'Más acciones' })).toHaveClass('size-11')
    fireEvent.click(screen.getByRole('button', { name: 'Editar' }))
    expect(router.state.location.pathname).toBe('/protocols/cjc/edit')
  })

  it('keeps this week after showing before and after, and undoes it', async () => {
    const { store } = open()
    await screen.findByRole('img', { name: 'Semana 2 de 12' })
    fireEvent.click(screen.getByRole('button', { name: 'Más acciones' }))
    fireEvent.click(await screen.findByRole('button', { name: /Mantener una semana más/ }))

    const sheet = await screen.findByRole('dialog')
    expect(
      within(sheet).getByText('El próximo cambio pasa del lun 5 oct al lun 12 oct'),
    ).toBeInTheDocument()
    expect(within(sheet).getByText('16 semanas')).toBeInTheDocument()
    expect(within(sheet).getByText('17 semanas')).toBeInTheDocument()
    // Nothing moves until it is confirmed.
    expect(weeks(store.protocols[0])).toEqual([1, 1, 10, 4])

    fireEvent.click(within(sheet).getByRole('button', { name: 'Mantener una semana más' }))
    await waitFor(() => expect(weeks(store.protocols[0])).toEqual([1, 2, 10, 4]))
    expect(await screen.findByRole('img', { name: 'Semana 2 de 13' })).toBeInTheDocument()
    expect(screen.getByText(/sube el lun 12 oct a 12 U/)).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent(
      'Mantienes esta semana. El próximo cambio pasa al lun 12 oct.',
    )

    fireEvent.click(screen.getByRole('button', { name: 'Deshacer' }))
    await waitFor(() => expect(weeks(store.protocols[0])).toEqual([1, 1, 10, 4]))
    expect(await screen.findByRole('img', { name: 'Semana 2 de 12' })).toBeInTheDocument()
  })

  it('moves up a week sooner from the menu', async () => {
    // Monday Oct 5: week 1 of the ten-week step.
    vi.setSystemTime(new Date('2026-10-05T10:00:00'))
    const { store } = open()
    await screen.findByRole('img', { name: 'Semana 3 de 12' })
    fireEvent.click(screen.getByRole('button', { name: 'Más acciones' }))
    fireEvent.click(await screen.findByRole('button', { name: /Subir una semana antes/ }))
    const sheet = await screen.findByRole('dialog')
    expect(
      within(sheet).getByText('El próximo cambio pasa del lun 14 dic al lun 7 dic'),
    ).toBeInTheDocument()
    fireEvent.click(within(sheet).getByRole('button', { name: 'Subir una semana antes' }))
    await waitFor(() => expect(weeks(store.protocols[0])).toEqual([1, 1, 9, 4]))
  })

  it('offers no hold where the step has no end date', async () => {
    const reta = cjcProtocol({
      id: 'reta',
      compound_id: 'retatrutide',
      name: 'Retatrutida',
      components: [],
      times: ['09:00'],
      time_of_day: '09:00',
      steps: [{ doseMg: 2.5, intervalDays: 1, weekdays: [1], durationWeeks: null }],
    })
    open({ protocols: [reta], inventory: [] })
    expect(await screen.findByText('Mantenimiento · semana 2')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Mantener una semana más' })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Más acciones' }))
    const menu = await screen.findByRole('dialog')
    expect(within(menu).queryByText('Mantener una semana más')).toBeNull()
    expect(within(menu).getByText('Editar pauta')).toBeInTheDocument()
  })

  it('changes the dose of the step in force, in units, showing before and after', async () => {
    const { store } = open()
    await screen.findByRole('img', { name: 'Semana 2 de 12' })
    fireEvent.click(screen.getByRole('button', { name: 'Más acciones' }))
    fireEvent.click(await screen.findByRole('button', { name: /Cambiar dosis de este escalón/ }))

    const sheet = await screen.findByRole('dialog')
    const input = within(sheet).getByLabelText('Dosis nueva')
    // It opens in units, with today's dose.
    expect(input).toHaveValue('9')
    fireEvent.change(input, { target: { value: '10' } })
    expect(within(sheet).getByText('= 0,167 mg · 167 mcg')).toBeInTheDocument()
    expect(within(sheet).getByText('9 U (150 + 150 mcg)')).toBeInTheDocument()
    expect(within(sheet).getByText('10 U (167 + 167 mcg)')).toBeInTheDocument()

    fireEvent.click(within(sheet).getByRole('button', { name: 'Guardar dosis' }))
    await waitFor(() =>
      expect(((store.protocols[0]?.steps ?? []) as { doseMg: number }[])[1]?.doseMg).toBe(0.166667),
    )
    expect(await screen.findByText('10', { selector: 'span' })).toHaveTextContent('10U')
  })

  it('archives after asking, and brings it back on undo', async () => {
    const { store } = open()
    await screen.findByRole('img', { name: 'Semana 2 de 12' })
    fireEvent.click(screen.getByRole('button', { name: 'Más acciones' }))
    fireEvent.click(await screen.findByRole('button', { name: /Archivar/ }))
    const sheet = await screen.findByRole('dialog')
    expect(within(sheet).getByText('¿Archivar «CJC-1295 + Ipamorelina»?')).toBeInTheDocument()
    expect(store.protocols[0]?.status).toBe('active')

    fireEvent.click(within(sheet).getByRole('button', { name: 'Archivar' }))
    await waitFor(() => expect(store.protocols[0]?.status).toBe('archived'))
    // It moved to the history, and the offer to undo outlived its card.
    fireEvent.click(await screen.findByRole('button', { name: 'Deshacer' }))
    await waitFor(() => expect(store.protocols[0]?.status).toBe('active'))
  })

  it('puts the way back in sight for a protocol that is not running', async () => {
    const { store } = open({ protocols: [cjcProtocol({ status: 'paused' })] })
    await screen.findByText('Pausado')
    fireEvent.click(screen.getByRole('button', { name: 'Reanudar' }))
    await waitFor(() => expect(store.protocols[0]?.status).toBe('active'))
    await waitFor(() => expect(screen.queryByText('Pausado')).not.toBeInTheDocument())
  })

  it('pauses at once and undoes it', async () => {
    const { store } = open()
    await screen.findByRole('img', { name: 'Semana 2 de 12' })
    fireEvent.click(screen.getByRole('button', { name: 'Más acciones' }))
    fireEvent.click(await screen.findByRole('button', { name: /Pausar/ }))
    await waitFor(() => expect(store.protocols[0]?.status).toBe('paused'))
    fireEvent.click(await screen.findByRole('button', { name: 'Deshacer' }))
    await waitFor(() => expect(store.protocols[0]?.status).toBe('active'))
  })

  it('saves it as a reusable protocol, and the undo takes it away again', async () => {
    const { store } = open()
    await screen.findByRole('img', { name: 'Semana 2 de 12' })
    fireEvent.click(screen.getByRole('button', { name: 'Más acciones' }))
    fireEvent.click(await screen.findByRole('button', { name: /Guardar como pauta reutilizable/ }))
    await waitFor(() => expect(store.saved_protocols).toHaveLength(1))
    expect(store.saved_protocols[0]).toMatchObject({
      owner_id: USER.id,
      name: 'CJC-1295 + Ipamorelina',
      compound_id: 'mod-grf-1-29',
    })
    fireEvent.click(await screen.findByRole('button', { name: 'Deshacer' }))
    await waitFor(() => expect(store.saved_protocols).toHaveLength(0))
  })

  it('duplicates into a new protocol that starts from this one', async () => {
    const { router } = open()
    await screen.findByRole('img', { name: 'Semana 2 de 12' })
    fireEvent.click(screen.getByRole('button', { name: 'Más acciones' }))
    fireEvent.click(await screen.findByRole('button', { name: /Duplicar/ }))
    expect(router.state.location.pathname).toBe('/protocols/new')
    expect(router.state.location.search).toBe('?copy=cjc')
  })
})
