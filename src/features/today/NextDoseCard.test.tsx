import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { labAccount } from '@/features/exposure/testData'
import { upcomingAdministrations } from '@/features/reminders/plan'
import i18n from '@/i18n'
import { buildToday, focusItem, summarise } from './agenda'
import { NextDoseCard } from './NextDoseCard'

// Sunday evening: nothing is planned today, retatrutide goes up tomorrow at 09:00.
const SUNDAY = new Date(2026, 9, 4, 20, 30)
// Monday 20 minutes past the retatrutide and MOTS-c hour, with nothing logged yet.
const MONDAY = new Date(2026, 9, 5, 9, 20)

beforeAll(async () => {
  await i18n.changeLanguage('es')
})
afterEach(cleanup)

function sunday() {
  const lab = labAccount(SUNDAY)
  const items = buildToday(lab.protocols, lab.doses, SUNDAY)
  const nextUp = upcomingAdministrations(lab.protocols, lab.doses, lab.vials, SUNDAY, {
    horizonDays: 14,
  })[0]!
  return { items, nextUp }
}

function show(over: Partial<Parameters<typeof NextDoseCard>[0]> = {}) {
  const { items, nextUp } = sunday()
  const props: Parameters<typeof NextDoseCard>[0] = {
    focus: focusItem(items),
    nextUp,
    units: nextUp.totalUnits,
    summary: summarise(items),
    note: '',
    now: SUNDAY,
    readOnly: false,
    onLog: vi.fn(),
    onLogOther: vi.fn(),
    ...over,
  }
  render(<NextDoseCard {...props} />)
  return props
}

describe('NextDoseCard', () => {
  it('on a day off says so in the ring and counts down to the next dose, with its units', () => {
    show()
    expect(screen.getByRole('img', { name: 'libre' })).toBeInTheDocument()
    expect(screen.getByText('Retatrutida')).toBeInTheDocument()
    const left = screen.getByText('Falta').closest('div')!
    expect(left).toHaveTextContent('13 h')
    expect(left).toHaveTextContent('lun 5 · 09:00')
    const draw = screen.getByText('Cargar').closest('div')!
    expect(draw).toHaveTextContent('17,5U')
    expect(draw).toHaveTextContent('1,75 mg')
  })

  it('offers to log another dose, not the next one, when nothing is left today', () => {
    const props = show()
    fireEvent.click(screen.getByRole('button', { name: 'Registrar otra toma' }))
    expect(props.onLogOther).toHaveBeenCalledOnce()
    expect(screen.queryByRole('button', { name: 'Registrar ahora' })).toBeNull()
  })

  it('shows the doses of today in the ring, done of planned', () => {
    show({ summary: { total: 3, taken: 2, pending: 1, missed: 0 } })
    const ring = screen.getByRole('img', { name: '2 de 3 tomas de hoy' })
    expect(ring).toHaveTextContent('2/3')
    expect(ring).toHaveTextContent('hoy')
  })

  it('says "hecho" when the day is complete, and counts what was missed in rose', () => {
    show({ summary: { total: 3, taken: 3, pending: 0, missed: 0 } })
    expect(screen.getByRole('img', { name: '3 de 3 tomas de hoy' })).toHaveTextContent('hecho')
    cleanup()
    show({ summary: { total: 3, taken: 2, pending: 0, missed: 1 } })
    expect(screen.getByText('1 perdida')).toHaveClass('text-danger')
  })

  it('turns amber and offers the log button when a dose is due', () => {
    const lab = labAccount(MONDAY)
    const items = buildToday(lab.protocols, [], MONDAY)
    const focus = focusItem(items)!
    const onLog = vi.fn()
    const { container } = render(
      <NextDoseCard
        focus={focus}
        nextUp={null}
        units={15}
        summary={summarise(items)}
        note=""
        now={MONDAY}
        readOnly={false}
        onLog={onLog}
        onLogOther={vi.fn()}
      />,
    )
    expect(container.firstElementChild).toHaveClass('border-warn/30')
    const status = within(container).getByText(/Toca ahora|Retraso/)
    expect(status).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Registrar ahora' }))
    expect(onLog).toHaveBeenCalledOnce()
    expect(container).toHaveTextContent('15U')
  })

  it('leaves out the buttons in a shared, read-only view', () => {
    show({ readOnly: true })
    expect(screen.queryByRole('button')).toBeNull()
  })

  it('says what to say when there is no dose at all', () => {
    render(
      <NextDoseCard
        focus={null}
        nextUp={null}
        units={null}
        summary={{ total: 0, taken: 0, pending: 0, missed: 0 }}
        note="Hoy no toca ninguna toma."
        now={SUNDAY}
        readOnly
        onLog={vi.fn()}
        onLogOther={vi.fn()}
      />,
    )
    expect(screen.getByText('Hoy no toca ninguna toma.')).toBeInTheDocument()
    expect(screen.queryByText('Falta')).toBeNull()
  })

  it('shows the dose in its own unit when the units are not known', () => {
    show({ units: null })
    const draw = screen.getByText('Dosis').closest('div')!
    expect(draw).toHaveTextContent('1,75 mg')
  })
})
