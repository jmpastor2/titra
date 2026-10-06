import { fireEvent, screen, within } from '@testing-library/react'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import i18n from '@/i18n'
import { ProtocolDetailPage } from './ProtocolDetailPage'
import { blendVial, cjcProtocol, renderRoutes, storeWith, stubDialog, USER } from './testApp'

const routes = [
  { path: '/protocols', element: <div>lista</div> },
  { path: '/protocols/:protocolId', element: <ProtocolDetailPage /> },
  { path: '/protocols/:protocolId/edit', element: <div>editor</div> },
  { path: '/cycles', element: <div>ciclos</div> },
]

/** One administration of the blend: two rows tied by a batch, like the app writes them. */
const shot = (at: string, id: string) =>
  ['mod-grf-1-29', 'ipamorelin'].map((compound) => ({
    id: `${id}-${compound}`,
    patient_id: USER.id,
    protocol_id: 'cjc',
    compound_id: compound,
    dose_mg: 0.15,
    administered_at: new Date(at).toISOString(),
    site_id: null,
    inventory_id: null,
    batch_id: id,
    planned_at: null,
    notes: null,
    created_at: new Date(at).toISOString(),
  }))

// The week of Sep 28: Mon–Wed nights taken, Thursday's missed, Friday's taken, and one
// extra shot on Saturday morning.
const DOSES = [
  ...shot('2026-09-29T01:09', 'a'),
  ...shot('2026-09-30T01:15', 'b'),
  ...shot('2026-10-01T01:06', 'c'),
  ...shot('2026-10-03T01:04', 'e'),
  ...shot('2026-10-03T08:00', 'x'),
]

beforeAll(async () => {
  stubDialog()
  await i18n.changeLanguage('es')
})
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date('2026-10-04T20:30:00'))
})
afterEach(() => vi.useRealTimers())

function open(path = '/protocols/cjc') {
  const store = storeWith({
    protocols: [cjcProtocol()],
    inventory: [blendVial()],
    doses: DOSES,
  })
  return { store, ...renderRoutes(routes, path, store) }
}

describe('ProtocolDetailPage', () => {
  it('reads first: where the cycle stands, with the dose in units and mass', async () => {
    open()
    expect(await screen.findByText('Semana 2 de 12 · sube el lun 5 a 12 U')).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { level: 1, name: 'CJC-1295 + Ipamorelina' }),
    ).toBeInTheDocument()
    expect(screen.getByText('CJC-1295 (sin DAC) + Ipamorelina')).toBeInTheDocument()
    const hero = within(screen.getByText('Dosis ahora').closest('section')!)
    expect(hero.getByText('9', { selector: 'span' })).toHaveTextContent('9U')
    expect(hero.getByText('150 + 150 mcg')).toBeInTheDocument()
    // The weeks of the cycle as a staircase, from its first day to its last.
    expect(hero.getByRole('img', { name: 'Semana 2 de 12' })).toBeInTheDocument()
    expect(hero.getByText('21 sep 2026')).toBeInTheDocument()
    expect(hero.getByText('10 ene 2027')).toBeInTheDocument()
    // Sunday evening before a step-up: flagged, and decided on Ciclos.
    expect(hero.getByRole('link', { name: 'Toca decidir mañana' })).toHaveAttribute(
      'href',
      '/cycles',
    )
  })

  it('lists every step with its dates and says where you are', async () => {
    open()
    await screen.findByText('Semana 2 de 12 · sube el lun 5 a 12 U')
    const timeline = screen.getByRole('heading', { name: 'Escalones y fechas' }).closest('section')!
    const steps = within(timeline).getAllByRole('listitem')
    expect(steps).toHaveLength(4)
    expect(steps[0]).toHaveTextContent('21 sep → 27 sep')
    expect(steps[0]).toHaveTextContent('6 U')
    expect(steps[1]).toHaveAttribute('aria-current', 'step')
    expect(steps[1]).toHaveTextContent('Estás aquí')
    expect(steps[1]).toHaveTextContent('28 sep → 4 oct')
    expect(steps[2]).toHaveTextContent('5 oct → 13 dic · 10 sem')
    expect(steps[2]).toHaveTextContent('12 U')
    expect(steps[3]).toHaveTextContent('Descanso')
    expect(steps[3]).toHaveTextContent('14 dic → 10 ene 2027')
    expect(within(timeline).getAllByText('Estás aquí')).toHaveLength(1)
  })

  it("sets the week's doses planned against taken", async () => {
    open()
    await screen.findByText('Semana 2 de 12 · sube el lun 5 a 12 U')
    const week = screen.getByRole('heading', { name: 'Esta semana' }).closest('section')!
    expect(within(week).getByText('9 U por toma')).toBeInTheDocument()
    // Four of the five planned nights were taken, plus the extra shot on its own.
    expect(within(week).getByText('+1 extra')).toBeInTheDocument()
    const rows = within(week).getAllByRole('listitem')
    expect(rows).toHaveLength(6)
    expect(rows[0]).toHaveTextContent('lun 28')
    expect(rows[0]).toHaveTextContent('Hecha 01:09')
    expect(within(week).getByText('Perdida')).toBeInTheDocument()
    expect(within(week).getByText('Fuera de pauta · 08:00')).toBeInTheDocument()
    // The 01:00 shots belong to the evening before: the moon says so.
    expect(within(rows[0]!).getByLabelText('de madrugada')).toBeInTheDocument()
    expect(within(week).getByText('Adherencia 28 d')).toBeInTheDocument()
  })

  it('shows the vial in use, the notes and the big actions', async () => {
    const { router } = open()
    await screen.findByText('Semana 2 de 12 · sube el lun 5 a 12 U')
    const vial = screen.getByRole('heading', { name: 'Vial en uso' }).closest('section')!
    expect(within(vial).getByText('CJC-1295 + Ipamorelina 10 mg')).toBeInTheDocument()
    expect(within(vial).getByText('Quedan 4 de 5 mg')).toBeInTheDocument()
    expect(within(vial).getByText('1 U = 16,7 mcg')).toBeInTheDocument()
    expect(screen.getByText('En ayunas.')).toBeInTheDocument()

    for (const name of [
      'Mantener una semana más',
      'Pausar',
      'Duplicar',
      'Archivar',
      'Más acciones',
    ]) {
      expect(screen.getAllByRole('button', { name: new RegExp(name) }).length).toBeGreaterThan(0)
    }
    fireEvent.click(screen.getByRole('button', { name: 'Editar pauta' }))
    expect(router.state.location.pathname).toBe('/protocols/cjc/edit')
  })

  it('links a rest to the cycles page', async () => {
    vi.setSystemTime(new Date('2026-12-20T10:00:00'))
    open()
    expect(await screen.findByText('Descanso · semana 1 de 4')).toBeInTheDocument()
    // The rest is the last thing in the plan: it ends on its last day, three weeks away.
    expect(screen.getByText('Termina el dom 10 ene · en 21 días')).toBeInTheDocument()
    const link = screen.getByRole('link', { name: /Ver ciclos/ })
    expect(link).toHaveAttribute('href', '/cycles')
    // No dose in a rest, and no hold to offer on a finished week.
    expect(screen.queryByText('Dosis ahora')).toBeNull()
  })

  it('links a finished cycle to the cycles page too', async () => {
    vi.setSystemTime(new Date('2027-02-01T10:00:00'))
    open()
    expect(await screen.findByText('Ciclo terminado el dom 10 ene')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Ver ciclos/ })).toHaveAttribute('href', '/cycles')
    expect(screen.queryByRole('button', { name: 'Mantener una semana más' })).toBeNull()
  })

  it('says so when the protocol does not exist', async () => {
    open('/protocols/nope')
    expect(await screen.findByText('No encontrado')).toBeInTheDocument()
  })
})
