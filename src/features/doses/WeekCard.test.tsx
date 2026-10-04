import { fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { administrationKey } from './administrations'
import { findExtras } from './extras'
import { setSpanish } from './testHarness'
import { blendDose, cjcProtocol } from './testData'
import { WeekCard } from './WeekCard'
import { doseCells } from './week'

beforeAll(setSpanish)
afterEach(() => vi.useRealTimers())

const now = new Date('2026-10-04T12:00')

// Tue–Fri nights taken, Monday 28's night forgotten, and an extra shot on Sunday morning.
const NIGHTS = ['2026-09-30T01:02', '2026-10-01T00:58', '2026-10-02T01:05', '2026-10-03T01:00']

function setup(over: { planned?: boolean } = {}) {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(now)
  const sunday = blendDose(
    '2026-10-04T08:00',
    over.planned ? { planned_at: new Date('2026-09-29T01:00').toISOString() } : {},
  )
  const doses = [...NIGHTS.flatMap((at) => blendDose(at)), ...sunday]
  const extras = findExtras(
    doseCells([cjcProtocol], doses, new Date('2026-09-14T00:00'), now),
    doses,
    now,
  )
  const handlers = { onLog: vi.fn(), onEdit: vi.fn(), onAssign: vi.fn() }
  render(<WeekCard protocols={[cjcProtocol]} doses={doses} extras={extras} {...handlers} />)
  return { sunday, handlers, extras }
}

/** The row of the week for a day, by its short name and number. */
function dayRow(name: string, num: string) {
  const label = screen.getByText(name, { selector: '.spec' })
  const row = label.closest('li')
  if (!row || !row.textContent?.includes(num)) throw new Error(`no row ${name} ${num}`)
  return within(row)
}

describe('WeekCard', () => {
  it('shows what was missed and what was an extra, each with what a tap does', () => {
    const { sunday, handlers, extras } = setup()

    const monday = dayRow('lun', '28')
    expect(monday.getByText('Perdida')).toBeInTheDocument()
    fireEvent.click(monday.getByRole('button', { name: /toca para registrar/ }))
    expect(handlers.onLog).toHaveBeenCalledWith('cjc', new Date('2026-09-29T01:00'))

    const sun = dayRow('dom', '4')
    expect(sun.getByText('Extra')).toBeInTheDocument()
    // The extra offers the missed night it could be.
    fireEvent.click(sun.getByRole('button', { name: '¿Era la del lun 28?' }))
    expect(handlers.onAssign).toHaveBeenCalledWith(extras.get(administrationKey(sunday[0]!)))
    // A tap on the dose itself opens it.
    fireEvent.click(sun.getAllByRole('button').find((b) => b.textContent?.includes('08:00'))!)
    expect(handlers.onEdit).toHaveBeenCalledWith(administrationKey(sunday[0]!))
  })

  it('reads a make-up as days and hours late, never as a pile of hours', () => {
    setup({ planned: true })

    const monday = dayRow('lun', '28')
    expect(monday.getByText('+5 d 7 h')).toBeInTheDocument()
    // Planned 01:00, taken Sunday 08:00.
    expect(monday.getByRole('button')).toHaveTextContent(/01:00 → 08:00 · dom 4/)
    expect(monday.queryByText('Perdida')).not.toBeInTheDocument()
    // And it is no longer an extra on Sunday.
    expect(screen.queryByRole('button', { name: /¿Era la del/ })).not.toBeInTheDocument()
    expect(dayRow('dom', '4').getByText('Descanso')).toBeInTheDocument()
  })

  it('explains the marks and offers no action on a dose when nobody can edit', () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(now)
    render(<WeekCard protocols={[cjcProtocol]} doses={blendDose('2026-09-30T01:02')} />)
    for (const label of ['A su hora', 'Con retraso', 'Perdida', 'Extra', 'Pendiente'])
      expect(screen.getAllByText(label).length).toBeGreaterThan(0)
    expect(screen.queryByRole('button', { name: /toca para registrar/ })).not.toBeInTheDocument()
  })
})
