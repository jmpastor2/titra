import { describe, expect, it } from 'vitest'
import { cycleInfo } from '@/domain/dosing/cycle'
import type { ProtocolLike, ScheduleStep } from '@/domain/types'
import { headline, nextLine, stepState, TRACK_MAX, weekTrack, type TrackCell } from './view'

const d = (iso: string) => new Date(iso)
const W15 = [1, 2, 3, 4, 5]
const dosing = (doseMg: number, durationWeeks: number | null): ScheduleStep => ({
  doseMg,
  intervalDays: 1,
  weekdays: W15,
  durationWeeks,
})
const REST: ScheduleStep = { doseMg: 0, intervalDays: 1, pause: true, durationWeeks: 4 }

const CJC: ProtocolLike = {
  compoundId: 'mod-grf-1-29',
  startDate: '2026-09-21',
  times: ['25:00'],
  steps: [dosing(0.1, 1), dosing(0.15, 1), dosing(0.2, 10), REST],
}
// Retatrutide: weekly titration that ends in open-ended maintenance. Starts Monday Sep 7.
const RETA: ProtocolLike = {
  compoundId: 'retatrutide',
  startDate: '2026-09-07',
  times: ['09:00'],
  steps: [dosing(1, 2), dosing(1.25, 1), dosing(1.5, 1), dosing(1.75, 1), dosing(2.5, null)],
}
const info = (p: ProtocolLike, iso: string) => cycleInfo(p, d(iso))!

const states = (cells: TrackCell[]) =>
  cells.map((c) =>
    c.kind === 'more' ? `+${c.count}` : `${c.state[0]}${c.kind === 'open' ? '~' : ''}`,
  )

describe('headline', () => {
  it('counts the dosing weeks of a finite plan', () => {
    expect(headline(info(CJC, '2026-10-04T10:00'))).toEqual({ kind: 'week', week: 2, total: 12 })
  })

  it('shows the week and step of an open-ended titration', () => {
    expect(headline(info(RETA, '2026-10-04T10:00'))).toEqual({
      kind: 'step',
      week: 4,
      step: 3,
      steps: 5,
    })
  })

  it('names rest, maintenance, not started and finished', () => {
    expect(headline(info(CJC, '2026-12-22T10:00'))).toEqual({ kind: 'rest', week: 2, total: 4 })
    expect(headline(info(RETA, '2026-11-30T10:00'))).toEqual({ kind: 'maintenance', week: 13 })
    expect(headline(info(CJC, '2026-09-14T10:00'))).toEqual({
      kind: 'before',
      on: d('2026-09-21T00:00'),
    })
    expect(headline(info(CJC, '2027-02-01T10:00'))).toEqual({
      kind: 'finished',
      on: d('2027-01-11T00:00'),
    })
  })
})

describe('stepState', () => {
  it('marks the steps behind, in force and ahead', () => {
    const c = info(CJC, '2026-10-04T10:00')
    expect([0, 1, 2, 3].map((i) => stepState(c, i))).toEqual([
      'done',
      'current',
      'future',
      'future',
    ])
    expect(stepState(info(CJC, '2026-09-14T10:00'), 0)).toBe('future')
    expect(stepState(info(CJC, '2027-02-01T10:00'), 3)).toBe('done')
  })
})

describe('weekTrack', () => {
  it('draws one segment per week, with the current one lit and the rest hatched', () => {
    const cells = weekTrack(info(CJC, '2026-10-04T10:00'))
    expect(cells).toHaveLength(16)
    // Week 2 of 16 is the current one: the first step is done, the second is this week.
    expect(states(cells).slice(0, 4)).toEqual(['d', 'c', 'f', 'f'])
    expect(cells.filter((c) => c.kind === 'week' && c.rest)).toHaveLength(4)
    expect(cells.filter((c) => c.kind === 'week' && c.stepStart)).toHaveLength(4)
  })

  it('lights the right week inside a long step', () => {
    const cells = weekTrack(info(CJC, '2026-11-02T10:00')) // week 7: the 5th week of step 3
    expect(states(cells).slice(0, 8)).toEqual(['d', 'd', 'd', 'd', 'd', 'd', 'c', 'f'])
  })

  it('ends an open-ended plan with a single open segment', () => {
    const cells = weekTrack(info(RETA, '2026-10-04T10:00'))
    expect(states(cells)).toEqual(['d', 'd', 'd', 'c', 'f', 'f~'])
    expect(states(weekTrack(info(RETA, '2026-11-30T10:00'))).at(-1)).toBe('c~')
  })

  it('is all future before the start and all done after the end', () => {
    expect(new Set(states(weekTrack(info(CJC, '2026-09-14T10:00'))))).toEqual(new Set(['f']))
    expect(new Set(states(weekTrack(info(CJC, '2027-02-01T10:00'))))).toEqual(new Set(['d']))
  })

  it('collapses a long plan around the current week with "+N" at either end', () => {
    const long: ProtocolLike = { ...CJC, steps: [dosing(0.1, 60)] }
    const cells = weekTrack(info(long, '2027-04-05T10:00')) // week 29
    expect(cells.length).toBeLessThanOrEqual(TRACK_MAX)
    expect(cells[0]).toMatchObject({ kind: 'more', state: 'done' })
    expect(cells.at(-1)).toMatchObject({ kind: 'more', state: 'future' })
    expect(cells.filter((c) => c.kind === 'week' && c.state === 'current')).toHaveLength(1)
    // Every week is accounted for.
    const shown = cells.reduce((n, c) => n + (c.kind === 'more' ? c.count : 1), 0)
    expect(shown).toBe(60)
  })

  it('keeps the start of a long plan in view when it has barely begun, and the end when over', () => {
    const long: ProtocolLike = { ...CJC, steps: [dosing(0.1, 60)] }
    const first = weekTrack(info(long, '2026-09-22T10:00'))
    expect(first[0]).toMatchObject({ kind: 'week', state: 'current' })
    expect(first.at(-1)).toMatchObject({ kind: 'more', state: 'future' })
    const over = weekTrack(info(long, '2028-01-01T10:00'))
    expect(over[0]).toMatchObject({ kind: 'more', state: 'done' })
    expect(over.at(-1)).toMatchObject({ kind: 'week', state: 'done' })
  })
})

describe('nextLine', () => {
  it('announces an increase with the step it leads to', () => {
    const n = nextLine(info(CJC, '2026-10-04T10:00'))
    expect(n).toMatchObject({ kind: 'increase', days: 1 })
    expect(n.kind === 'increase' && n.to.doseMg).toBe(0.2)
  })

  it('announces the rest, the end and a decrease', () => {
    expect(nextLine(info(CJC, '2026-12-07T10:00'))).toMatchObject({ kind: 'rest', days: 7 })
    expect(nextLine(info(CJC, '2026-12-22T10:00'))).toMatchObject({ kind: 'end', days: 20 })
    const down: ProtocolLike = { ...CJC, steps: [dosing(0.2, 1), dosing(0.1, 1)] }
    expect(nextLine(info(down, '2026-09-27T10:00'))).toMatchObject({ kind: 'decrease' })
  })

  it('announces a step with the same dose by its number', () => {
    const same: ProtocolLike = { ...CJC, steps: [dosing(0.2, 1), dosing(0.2, 1)] }
    expect(nextLine(info(same, '2026-09-27T10:00'))).toMatchObject({ kind: 'same', step: 2 })
  })

  it('knows the start, the open-ended end of changes and the end of the plan', () => {
    const start = nextLine(info(CJC, '2026-09-14T10:00'))
    expect(start).toMatchObject({ kind: 'start', days: 7 })
    expect(nextLine(info(RETA, '2026-11-30T10:00'))).toEqual({ kind: 'none' })
    expect(nextLine(info(CJC, '2027-02-01T10:00'))).toEqual({
      kind: 'ended',
      on: d('2027-01-11T00:00'),
    })
  })
})
