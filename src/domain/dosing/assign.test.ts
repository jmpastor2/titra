import { describe, expect, it } from 'vitest'
import type { DoseEvent, ProtocolLike } from '../types'
import { slotChoices } from './assign'
import { dayAgenda, matchDoses, scheduledDoses, adherence } from './schedule'

const d = (iso: string) => new Date(iso)

// Mon–Fri nights at "25:00" (01:00 of the next morning), 100 mcg.
const CJC: ProtocolLike = {
  compoundId: 'mod-grf-1-29',
  startDate: '2026-09-21',
  times: ['25:00'],
  steps: [{ doseMg: 0.1, intervalDays: 1, weekdays: [1, 2, 3, 4, 5], durationWeeks: null }],
}

describe('explicit assignment of a dose to a planned administration', () => {
  it('lets a make-up dose cover the slot that was missed, instead of leaving missed + extra', () => {
    // Monday's slot (Tue 01:00) was missed; Tue–Fri were taken on time; on Sunday morning
    // the user took an extra one to make up for Monday.
    const slots = scheduledDoses(CJC, d('2026-09-28T00:00'), d('2026-10-04T00:00'))
    expect(slots.map((s) => s.at)).toEqual([
      d('2026-09-29T01:00'),
      d('2026-09-30T01:00'),
      d('2026-10-01T01:00'),
      d('2026-10-02T01:00'),
      d('2026-10-03T01:00'),
    ])
    const onTime: DoseEvent[] = [
      { at: d('2026-09-30T01:00'), mg: 0.1 },
      { at: d('2026-10-01T01:00'), mg: 0.1 },
      { at: d('2026-10-02T01:00'), mg: 0.1 },
      { at: d('2026-10-03T01:00'), mg: 0.1 },
    ]
    const makeUp: DoseEvent = { at: d('2026-10-04T08:00'), mg: 0.1 }

    const without = matchDoses(slots, [...onTime, makeUp], 4)
    expect(without.slots[0]!.takenAt).toBeNull() // Monday missed…
    expect(without.extras).toEqual([makeUp]) // …and Sunday an extra

    const assigned = { ...makeUp, plannedAt: d('2026-09-29T01:00') }
    const withIt = matchDoses(slots, [...onTime, assigned], 4)
    expect(withIt.slots[0]!.takenAt).toEqual(makeUp.at)
    expect(withIt.extras).toEqual([])
  })

  it('counts the make-up dose in adherence', () => {
    const history: DoseEvent[] = [
      { at: d('2026-09-30T01:00'), mg: 0.1 },
      { at: d('2026-10-01T01:00'), mg: 0.1 },
      { at: d('2026-10-02T01:00'), mg: 0.1 },
      { at: d('2026-10-03T01:00'), mg: 0.1 },
      { at: d('2026-10-04T08:00'), mg: 0.1 },
    ]
    const now = d('2026-10-04T12:00')
    expect(adherence(CJC, history, now, 7).taken).toBe(4)
    const assigned = history.map((h, i) =>
      i === 4 ? { ...h, plannedAt: d('2026-09-29T01:00') } : h,
    )
    const a = adherence(CJC, assigned, now, 7)
    expect(a.taken).toBe(a.expected)
  })

  it('does not let an assigned dose steal today’s own slot', () => {
    // Taken Wednesday 00:30 (close to Wednesday's slot at 01:00) but assigned to Monday's.
    const dose: DoseEvent = { at: d('2026-09-30T00:30'), mg: 0.1, plannedAt: d('2026-09-29T01:00') }
    const today = dayAgenda(CJC, [dose], d('2026-09-29T10:00'), d('2026-09-30T00:00'))
    expect(today.every((a) => a.takenAt === null)).toBe(true)
  })

  it('falls back to matching by time when the assigned slot no longer exists', () => {
    // The schedule changed: nothing is planned near the old assignment, inside the window.
    const dose: DoseEvent = { at: d('2026-10-01T01:10'), mg: 0.1, plannedAt: d('2026-10-01T05:00') }
    const slots = scheduledDoses(CJC, d('2026-09-30T00:00'), d('2026-10-03T00:00'))
    const { slots: m, extras } = matchDoses(slots, [dose], 4)
    expect(m.find((s) => s.at.getTime() === d('2026-10-01T01:00').getTime())!.takenAt).toEqual(
      dose.at,
    )
    expect(extras).toEqual([])
  })
})

describe('slotChoices', () => {
  // Everything taken on time since the start, except Monday's and Friday's slots.
  const history: DoseEvent[] = scheduledDoses(CJC, d('2026-09-20T00:00'), d('2026-10-04T00:00'))
    .filter(
      (s) =>
        ![d('2026-09-29T01:00').getTime(), d('2026-10-03T01:00').getTime()].includes(
          s.at.getTime(),
        ),
    )
    .map((s) => ({ at: s.at, mg: s.doseMg }))

  it('offers the missed administrations when a dose lands far from any slot', () => {
    const now = d('2026-10-04T09:00')
    const choices = slotChoices(CJC, history, d('2026-10-04T08:00'), now)
    expect(choices.auto).toBeNull()
    expect(choices.missed.map((m) => m.at)).toEqual([d('2026-10-03T01:00'), d('2026-09-29T01:00')])
  })

  it('reports where a dose taken on time lands by itself', () => {
    const now = d('2026-10-03T01:30')
    const choices = slotChoices(CJC, history, d('2026-10-03T01:05'), now)
    expect(choices.auto?.at).toEqual(d('2026-10-03T01:00'))
    expect(choices.missed.map((m) => m.at)).toEqual([d('2026-09-29T01:00')])
  })

  it('does not call a slot missed while it is still inside its grace window', () => {
    const now = d('2026-10-03T02:00') // Friday’s slot at 01:00, four-hour grace
    const choices = slotChoices(CJC, history, d('2026-10-03T02:00'), now)
    expect(choices.missed.map((m) => m.at)).toEqual([d('2026-09-29T01:00')])
  })
})
