import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { labAccount } from '@/features/exposure/testData'
import { upcomingAdministrations } from '@/features/reminders/plan'
import i18n from '@/i18n'
import { buildToday, focusItem } from './agenda'
import { NextDoseCard, type HeroDose } from './NextDoseCard'
import { heroRows, slotKey, trackItems, windowItems } from './track'

// Sunday evening: nothing is planned today, retatrutide goes up tomorrow at 09:00.
const SUNDAY = new Date(2026, 9, 4, 20, 30)
// Monday 20 minutes past the retatrutide and MOTS-c hour, with nothing logged yet.
const MONDAY = new Date(2026, 9, 5, 9, 20)

beforeAll(async () => {
  await i18n.changeLanguage('es')
})
afterEach(cleanup)

type Props = Parameters<typeof NextDoseCard>[0]

/** The hero as Hoy builds it, from the lab account at `now` (doses left out with `fresh`). */
function props(now: Date, { fresh = false } = {}): Props {
  const lab = labAccount(now)
  const doses = fresh ? [] : lab.doses
  const today = buildToday(lab.protocols, doses, now)
  const focus = focusItem(today)
  const next = focus
    ? null
    : upcomingAdministrations(lab.protocols, doses, lab.vials, now, { horizonDays: 14 })[0]!
  const dose: HeroDose = focus ?? { ...next!, status: 'upcoming' }
  const heroKey = slotKey(dose.protocol.id, dose.at)
  const window = windowItems(lab.protocols, doses, now)
  return {
    dose,
    units: focus ? 15 : (next?.totalUnits ?? null),
    track: trackItems(window, heroKey),
    rows: heroRows(today, window, heroKey),
    unitsOf: () => null,
    now,
    readOnly: false,
    onLog: vi.fn(),
    onLogItem: vi.fn(),
    onLogOther: vi.fn(),
  }
}

function show(p: Props) {
  render(<NextDoseCard {...p} />)
  return p
}

describe('NextDoseCard', () => {
  it('says what to load for the next dose, with the mass under it, and when', () => {
    show(props(SUNDAY))
    const hero = screen.getByRole('region', { name: 'Próxima toma' })
    expect(hero).toHaveTextContent('Retatrutida')
    expect(screen.getByRole('group', { name: 'Cargar 17,5 U (1,75 mg)' })).toBeInTheDocument()
    expect(hero).toHaveTextContent('17,5U')
    expect(hero).toHaveTextContent('1,75 mg')
    expect(hero).toHaveTextContent('lun 5 · 09:00 · en 13 h')
  })

  it('draws the next 24 hours, and names the other doses in them', () => {
    const p = show(props(SUNDAY))
    expect(screen.getByRole('img', { name: 'Próximas 24 horas: 2 tomas' })).toBeInTheDocument()
    expect(p.track.map((m) => m.state)).toEqual(['next', 'later'])
    const rows = within(screen.getByRole('list')).getAllByRole('listitem')
    expect(rows).toHaveLength(1)
    expect(rows[0]).toHaveTextContent('MOTS-c')
    expect(rows[0]).toHaveTextContent('09:00')
    expect(rows[0]).toHaveTextContent('en 13 h')
  })

  it('offers a quiet link to log another dose while the next one is far off', () => {
    const p = show(props(SUNDAY))
    fireEvent.click(screen.getByRole('button', { name: 'Registrar otra toma' }))
    expect(p.onLogOther).toHaveBeenCalledOnce()
    expect(screen.queryByRole('button', { name: 'Registrar' })).toBeNull()
  })

  it('turns amber when the dose is due and logs it with the one ink button', () => {
    const p = show(props(MONDAY, { fresh: true }))
    const hero = screen.getByRole('region', { name: 'Próxima toma' })
    expect(within(hero).getByText(/^(Toca ahora|Retrasada .+) · 09:00$/)).toHaveClass('text-warn')
    fireEvent.click(screen.getByRole('button', { name: 'Registrar' }))
    expect(p.onLog).toHaveBeenCalledOnce()
    expect(hero).toHaveTextContent('15U')
  })

  it('lets a due dose in the rows be logged on its own', () => {
    const p = show(props(MONDAY, { fresh: true }))
    // Retatrutide and MOTS-c are both due at 09:00: one is the hero, the other a row.
    const log = screen.getByRole('button', { name: /^Registrar toma: / })
    fireEvent.click(log)
    expect(p.onLogItem).toHaveBeenCalledOnce()
  })

  it('leaves out every button in a shared, read-only view', () => {
    show({ ...props(MONDAY, { fresh: true }), readOnly: true })
    expect(screen.queryByRole('button')).toBeNull()
  })

  it('says when nothing is planned', () => {
    show({ ...props(SUNDAY), dose: null, units: null, track: [], rows: [] })
    expect(screen.getByText('Sin tomas previstas en los próximos 14 días.')).toBeInTheDocument()
    expect(screen.queryByRole('img')).toBeNull()
    expect(screen.getByRole('button', { name: 'Registrar otra toma' })).toBeInTheDocument()
  })

  it('shows the dose in its own unit, big, when the units are not known', () => {
    show({ ...props(SUNDAY), units: null })
    const hero = screen.getByRole('region', { name: 'Próxima toma' })
    expect(hero).toHaveTextContent('1,75mg')
    expect(screen.queryByRole('group')).toBeNull()
  })

  it('reads in English too', async () => {
    await i18n.changeLanguage('en')
    try {
      show(props(SUNDAY))
      expect(screen.getByRole('region', { name: 'Next dose' })).toHaveTextContent(
        'Mon 5 · 09:00 · in 13 h',
      )
      expect(screen.getByRole('img', { name: 'Next 24 hours: 2 doses' })).toBeInTheDocument()
    } finally {
      await i18n.changeLanguage('es')
    }
  })
})
