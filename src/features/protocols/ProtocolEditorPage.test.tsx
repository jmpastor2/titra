import { act, fireEvent, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import i18n from '@/i18n'
import { ProtocolEditorPage } from './ProtocolEditorPage'
import { blendVial, cjcProtocol, renderRoutes, storeWith, stubDialog } from './testApp'

const routes = [
  { path: '/protocols', element: <div>lista</div> },
  { path: '/protocols/new', element: <ProtocolEditorPage /> },
  { path: '/protocols/:protocolId/edit', element: <ProtocolEditorPage /> },
]

type Step = { doseMg: number; durationWeeks: number | null; pause?: boolean }
const steps = (row: Record<string, unknown> | undefined) => (row?.steps ?? []) as Step[]

beforeAll(async () => {
  stubDialog()
  await i18n.changeLanguage('es')
})
// Monday Oct 19: week 3 of the ten-week step, which began on Oct 5.
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date('2026-10-19T10:00:00'))
})
afterEach(() => vi.useRealTimers())

function open(path = '/protocols/cjc/edit', rows: Parameters<typeof storeWith>[0] = {}) {
  const store = storeWith({ protocols: [cjcProtocol()], inventory: [blendVial()], ...rows })
  return { store, ...renderRoutes(routes, path, store) }
}

/** The card of a section by its title. */
const card = (title: string) => screen.getByRole('heading', { name: title }).closest('section')!
const doses = () => within(card('Escalones')).getAllByLabelText('Dosis') as HTMLInputElement[]
const weeksFields = () =>
  within(card('Escalones')).getAllByLabelText('Duración') as HTMLInputElement[]
const type = (el: HTMLElement, value: string) => fireEvent.change(el, { target: { value } })
const values = (els: HTMLInputElement[]) => els.map((e) => e.value)
const save = () => fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))

describe('ProtocolEditorPage · opening a protocol', () => {
  it('shows the doses in syringe units and where you are in the plan', async () => {
    open()
    await screen.findByText('Escalones')
    expect(values(doses())).toEqual(['6', '9', '12'])
    expect(values(weeksFields())).toEqual(['1', '1', '10', '4'])
    // Equivalents under every field, and the whole syringe of a blend.
    expect(within(card('Escalones')).getAllByText('= 0,2 mg · 200 mcg')).toHaveLength(1)
    expect(within(card('Escalones')).getByText('Jeringa: 12 U (200 + 200 mcg)')).toBeInTheDocument()

    const rows = within(card('Escalones')).getAllByRole('listitem')
    expect(within(rows[0]!).getByText('Ya pasó')).toBeInTheDocument()
    expect(within(rows[1]!).getByText('Ya pasó')).toBeInTheDocument()
    expect(rows[2]).toHaveAttribute('aria-current', 'step')
    expect(within(rows[2]!).getByText('Estás aquí')).toBeInTheDocument()
    expect(rows[2]).toHaveTextContent('5 oct → 13 dic · Semana 3 de 10')
  })

  it('draws the plan as dates, live', async () => {
    open()
    await screen.findByText('Fechas del plan')
    const plan = card('Fechas del plan')
    expect(within(plan).getByText(/Semana 5 de 12/)).toHaveTextContent('12 U (200 + 200 mcg)')
    expect(within(plan).getByText(/El lun 14 dic empieza el descanso/)).toBeInTheDocument()
    expect(within(plan).getByText('Termina el dom 10 ene · 16 semanas')).toBeInTheDocument()
    expect(within(plan).getAllByText('Estás aquí')).toHaveLength(1)

    // Longer step in force: everything after it moves.
    type(weeksFields()[2]!, '12')
    expect(within(plan).getByText(/El lun 28 dic empieza el descanso/)).toBeInTheDocument()
    expect(within(plan).getByText('Termina el dom 24 ene · 18 semanas')).toBeInTheDocument()
  })

  it('is quiet until something changes, then says so in the save bar', async () => {
    open()
    await screen.findByText('Escalones')
    expect(screen.getByText('Sin cambios')).toBeInTheDocument()
    type(doses()[2]!, '13')
    expect(screen.getByText('Cambios sin guardar')).toBeInTheDocument()
    type(doses()[2]!, '12')
    expect(screen.getByText('Sin cambios')).toBeInTheDocument()
  })
})

describe('ProtocolEditorPage · typing doses in U, mg or mcg', () => {
  it('converts every step when the unit changes, and comes back to the same numbers', async () => {
    open()
    await screen.findByText('Escalones')
    const toggle = within(card('Escalones'))
    fireEvent.click(toggle.getByRole('tab', { name: 'mg' }))
    expect(values(doses())).toEqual(['0.1', '0.15', '0.2'])
    fireEvent.click(toggle.getByRole('tab', { name: 'mcg' }))
    expect(values(doses())).toEqual(['100', '150', '200'])
    expect(within(card('Escalones')).getAllByText('= 6 U · 0,1 mg')).toHaveLength(1)
    fireEvent.click(toggle.getByRole('tab', { name: 'Unidades' }))
    expect(values(doses())).toEqual(['6', '9', '12'])
    // Switching units is not a change.
    expect(screen.getByText('Sin cambios')).toBeInTheDocument()
  })

  it('saves what was typed in units as mg', async () => {
    // Monday Oct 5: the first week of the ten-week step, nothing behind it: a plain change.
    vi.setSystemTime(new Date('2026-10-05T10:00:00'))
    const { store } = open()
    await screen.findByText('Escalones')
    type(doses()[2]!, '15')
    save()
    await waitFor(() => expect(steps(store.protocols[0])[2]?.doseMg).toBe(0.25))
    expect(steps(store.protocols[0])).toHaveLength(4)
  })

  it('says why units are missing without a reconstituted vial', async () => {
    open('/protocols/new?compound=retatrutide', { protocols: [], inventory: [] })
    await screen.findByText('Escalones')
    expect(within(card('Escalones')).queryByRole('tab', { name: 'Unidades' })).toBeNull()
    expect(within(card('Escalones')).getByRole('tab', { name: 'mg' })).toBeInTheDocument()
    expect(
      screen.getByText(/Sin un vial de Retatrutida con su agua bacteriostática/),
    ).toBeInTheDocument()
    expect(within(card('Escalones')).getByRole('link', { name: 'Añadir vial' })).toHaveAttribute(
      'href',
      '/inventory',
    )
  })

  it('starts in units when the vial is known', async () => {
    const reta = blendVial({
      id: 'reta-vial',
      compound_id: 'retatrutide',
      label: 'Retatrutida 15 mg',
      total_mg: 15,
      remaining_mg: 15,
      diluent_ml: 1.5,
      concentration_mg_per_ml: 10,
      components: [],
    })
    open('/protocols/new?compound=retatrutide', { protocols: [], inventory: [reta] })
    await screen.findByText('Escalones')
    expect(within(card('Escalones')).getByRole('tab', { name: 'Unidades' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    type(doses()[0]!, '12.5')
    expect(within(card('Escalones')).getByText(/= 1,25 mg · 1\.?250 mcg/)).toBeInTheDocument()
    expect(
      within(card('Escalones')).getByText(/Con el vial «Retatrutida 15 mg»: 1 U = 0,1 mg/),
    ).toBeInTheDocument()
  })
})

describe('ProtocolEditorPage · editing what already happened', () => {
  it('warns that changing past weeks moves every later date', async () => {
    open()
    await screen.findByText('Escalones')
    const warning =
      'Cambiar semanas pasadas mueve las fechas de todos los escalones siguientes. Tus tomas registradas no cambian.'
    expect(screen.queryByText(warning)).toBeNull()
    type(weeksFields()[0]!, '2')
    expect(screen.getByText(warning)).toBeInTheDocument()
    // The step in force moved with them: it is week 2 of it now.
    expect(
      within(card('Escalones')).getByText(/12 oct → 20 dic · Semana 2 de 10/),
    ).toBeInTheDocument()
    expect(within(card('Fechas del plan')).getByText(/Semana 5 de 13/)).toBeInTheDocument()
  })

  it("says when today's dose moves because the past changed, not because it was edited", async () => {
    open()
    await screen.findByText('Escalones')
    const plan = card('Fechas del plan')
    expect(plan).not.toHaveTextContent('la dosis de hoy sería otra')
    // Four weeks for the first step pushes the next two later: today falls in the 9 U step.
    type(weeksFields()[0]!, '4')
    expect(plan).toHaveTextContent('9 U (150 + 150 mcg)')
    expect(plan).toHaveTextContent(
      'Con estos cambios la dosis de hoy sería otra (antes 12 U (200 + 200 mcg)).',
    )
  })

  it('offers to apply a dose change from this week and saves the weeks behind untouched', async () => {
    const { store, router } = open()
    await screen.findByText('Escalones')
    type(doses()[2]!, '15')
    const offer = screen.getByRole('switch', { name: /Aplicar desde esta semana/ })
    expect(offer).toBeChecked()
    expect(
      screen.getByText(/Las 2 semanas que ya pasaron se quedan con 12 U \(200 \+ 200 mcg\)/),
    ).toBeInTheDocument()
    expect(card('Fechas del plan')).toHaveTextContent('El escalón en curso se guarda en dos')
    // Typing over today's dose is the point: no need to warn that it changed.
    expect(card('Fechas del plan')).not.toHaveTextContent('la dosis de hoy sería otra')

    save()
    await waitFor(() => expect(steps(store.protocols[0])).toHaveLength(5))
    expect(steps(store.protocols[0]).map((s) => [s.doseMg, s.durationWeeks])).toEqual([
      [0.1, 1],
      [0.15, 1],
      [0.2, 2],
      [0.25, 8],
      [0, 4],
    ])
    await waitFor(() => expect(router.state.location.pathname).toBe('/protocols'))
  })

  it('changes the whole step when told not to apply it from this week', async () => {
    const { store } = open()
    await screen.findByText('Escalones')
    type(doses()[2]!, '15')
    fireEvent.click(screen.getByRole('switch', { name: /Aplicar desde esta semana/ }))
    expect(screen.getByText(/Se cambia todo el escalón/)).toBeInTheDocument()
    save()
    await waitFor(() => expect(steps(store.protocols[0])[2]?.doseMg).toBe(0.25))
    expect(steps(store.protocols[0])).toHaveLength(4)
  })

  it('does not offer it for a step that has not started', async () => {
    open()
    await screen.findByText('Escalones')
    fireEvent.click(screen.getByRole('button', { name: 'Añadir escalón' }))
    type(doses()[3]!, '14')
    expect(screen.queryByRole('switch', { name: /Aplicar desde esta semana/ })).toBeNull()
  })
})

describe('ProtocolEditorPage · night doses', () => {
  it('explains the 01:00 shot in plain words and saves it as 25:00', async () => {
    vi.setSystemTime(new Date('2026-10-05T10:00:00'))
    const { store } = open()
    await screen.findByText('Horario')
    expect(
      screen.getByText(
        'Ejemplo: la toma del lunes se hace a las 01:00 del martes y cuenta como la toma del lunes.',
      ),
    ).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Noche anterior' })).toHaveAttribute(
      'aria-selected',
      'true',
    )

    fireEvent.click(screen.getByRole('tab', { name: 'Mismo día' }))
    expect(
      screen.getByText(
        'Ejemplo: la toma del lunes se hace ese mismo día a las 01:00, de madrugada.',
      ),
    ).toBeInTheDocument()
    fireEvent.click(screen.getByRole('tab', { name: 'Noche anterior' }))
    expect(screen.getByText('Sin cambios')).toBeInTheDocument()

    type(doses()[2]!, '13')
    save()
    await waitFor(() => expect(steps(store.protocols[0])[2]?.doseMg).toBe(0.216667))
    expect(store.protocols[0]?.times).toEqual(['25:00'])
    expect(store.protocols[0]?.time_of_day).toBe('01:00')
  })
})

describe('ProtocolEditorPage · a stack in one syringe', () => {
  it('warns when the stack dose does not fill the same volume as the blend, and fixes it', async () => {
    open()
    await screen.findByText('Escalones')
    const stack = within(card('Sustancias'))
    const field = stack.getByLabelText('Ipamorelina · Dosis') as HTMLInputElement
    expect(field.value).toBe('6')
    expect(stack.queryByText('Igualar a la mezcla')).toBeNull()

    type(field, '3')
    expect(
      stack.getByText(
        /con 6 U de la principal, Ipamorelina son 6 U\. Esta dosis no cuadra con la mezcla/,
      ),
    ).toBeInTheDocument()
    fireEvent.click(stack.getByRole('button', { name: 'Igualar a la mezcla' }))
    expect(field.value).toBe('6')
    expect(stack.queryByText('Igualar a la mezcla')).toBeNull()
  })
})

describe('ProtocolEditorPage · leaving with unsaved changes', () => {
  it('asks first, lets you keep editing or discard', async () => {
    const { router } = open()
    await screen.findByText('Escalones')
    type(doses()[2]!, '13')

    act(() => void router.navigate('/protocols'))
    const sheet = await screen.findByRole('dialog')
    expect(within(sheet).getByText('¿Salir sin guardar?')).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/protocols/cjc/edit')

    fireEvent.click(within(sheet).getByRole('button', { name: 'Seguir editando' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(router.state.location.pathname).toBe('/protocols/cjc/edit')

    act(() => void router.navigate('/protocols'))
    fireEvent.click(
      within(await screen.findByRole('dialog')).getByRole('button', { name: 'Descartar cambios' }),
    )
    await waitFor(() => expect(router.state.location.pathname).toBe('/protocols'))
  })

  it('lets you go when nothing changed', async () => {
    const { router } = open()
    await screen.findByText('Escalones')
    act(() => void router.navigate('/protocols'))
    await waitFor(() => expect(router.state.location.pathname).toBe('/protocols'))
  })
})

describe('ProtocolEditorPage · new protocols', () => {
  it('copies a protocol into a new one that starts today', async () => {
    const { store } = open('/protocols/new?copy=cjc')
    await screen.findByText('Escalones')
    expect(screen.getByText(/Copia de «CJC-1295 \+ Ipamorelina»: empieza hoy/)).toBeInTheDocument()
    expect(screen.getByLabelText('Nombre')).toHaveValue('CJC-1295 + Ipamorelina (copia)')
    expect(screen.getByLabelText('Fecha de inicio')).toHaveValue('2026-10-19')
    // A new protocol has no past to protect.
    expect(screen.queryByText('Ya pasó')).toBeNull()

    save()
    await waitFor(() => expect(store.protocols).toHaveLength(2))
    expect(store.protocols[1]).toMatchObject({
      name: 'CJC-1295 + Ipamorelina (copia)',
      start_date: '2026-10-19',
      status: 'active',
      times: ['25:00'],
    })
    expect(steps(store.protocols[1])).toHaveLength(4)
    // The original is untouched.
    expect(store.protocols[0]?.start_date).toBe('2026-09-21')
  })

  it('starts from a label template and keeps the template choice', async () => {
    const { store } = open('/protocols/new?template=semaglutide-wegovy', {
      protocols: [],
      inventory: [],
    })
    await screen.findByText('Escalones')
    expect(values(doses())).toEqual(['0.25', '0.5', '1', '1.7', '2.4'])
    save()
    await waitFor(() => expect(store.protocols).toHaveLength(1))
    expect(store.protocols[0]).toMatchObject({ template_id: 'semaglutide-wegovy' })
  })
})
