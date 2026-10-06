import { addDays } from 'date-fns'
import { describe, expect, it } from 'vitest'
import { activeCycles } from '@/features/cycle/items'
import { weeklyProtocol } from '@/features/exposure/testData'
import type { WeekCell, WeekDay, WeekStatus } from '@/features/doses/week'
import type { RestockLine } from '@/features/inventory/vials'
import {
  adherenceOf,
  adherenceTone,
  COVER_HORIZON_DAYS,
  coverFraction,
  coverKpi,
  coverLabel,
  cycleKpi,
  dayVerdict,
  streakOf,
  windowStarts,
} from './kpis'

const protocol = weeklyProtocol()
const start = new Date(2026, 9, 1)

const cell = (status: WeekStatus): WeekCell => ({
  protocol,
  plannedAt: start,
  takenAt: status === 'onTime' || status === 'late' || status === 'extra' ? start : null,
  deltaMin: null,
  status,
})
/** Days oldest to newest, one list of cell statuses each. */
const run = (...days: WeekStatus[][]): WeekDay[] =>
  days.map((statuses, i) => ({ day: addDays(start, i), cells: statuses.map(cell) }))

describe('dayVerdict', () => {
  it('is a rest day when nothing was planned, even with an extra dose', () => {
    expect(dayVerdict(run([])[0]!)).toBe('rest')
    expect(dayVerdict(run(['extra'])[0]!)).toBe('rest')
  })
  it('is done only when every planned dose was taken, on the hour or not', () => {
    expect(dayVerdict(run(['onTime', 'late'])[0]!)).toBe('done')
    expect(dayVerdict(run(['onTime', 'extra'])[0]!)).toBe('done')
  })
  it('is open while a dose is still to come, and broken once one was missed', () => {
    expect(dayVerdict(run(['onTime', 'upcoming'])[0]!)).toBe('open')
    expect(dayVerdict(run(['due'])[0]!)).toBe('open')
    expect(dayVerdict(run(['onTime', 'missed'])[0]!)).toBe('broken')
    expect(dayVerdict(run(['missed', 'upcoming'])[0]!)).toBe('broken')
  })
})

describe('streakOf', () => {
  it('counts the days with every dose taken, back from today', () => {
    expect(streakOf(run(['onTime'], ['onTime'], ['late']))).toBe(3)
  })
  it('stops at the first missed dose', () => {
    expect(streakOf(run(['onTime'], ['missed'], ['onTime'], ['onTime']))).toBe(2)
  })
  it('is zero when today is already missed', () => {
    expect(streakOf(run(['onTime'], ['onTime'], ['missed']))).toBe(0)
  })
  it('does not break on a day off nor on today while it is still open', () => {
    expect(streakOf(run(['onTime'], [], ['onTime'], ['upcoming']))).toBe(2)
    expect(streakOf(run(['onTime'], ['onTime'], ['onTime', 'due']))).toBe(2)
  })
  it('is zero with nothing planned', () => {
    expect(streakOf([])).toBe(0)
    expect(streakOf(run([], []))).toBe(0)
  })
})

describe('adherence', () => {
  it('is taken over planned, and nothing without a plan', () => {
    expect(adherenceOf({ planned: 8, taken: 6 })).toBe(0.75)
    expect(adherenceOf({ planned: 0, taken: 0 })).toBeNull()
    expect(adherenceOf({ planned: 2, taken: 3 })).toBe(1)
  })
  it('reads on track, slipping or worth a look', () => {
    expect(adherenceTone(1)).toBe('ok')
    expect(adherenceTone(0.8)).toBe('ok')
    expect(adherenceTone(0.7)).toBe('warn')
    expect(adherenceTone(0.4)).toBe('danger')
  })
})

describe('windowStarts', () => {
  it('lays seven-day windows that end today, newest first', () => {
    const [a, b] = windowStarts(new Date(2026, 9, 4, 20, 30), 2)
    expect(a).toEqual(new Date(2026, 9, -2)) // Sep 28
    expect(b).toEqual(new Date(2026, 8, 21))
  })
})

describe('cycleKpi', () => {
  const now = new Date(2026, 9, 4, 12)
  const blend = weeklyProtocol({
    id: 'b',
    name: 'CJC-1295 + Ipamorelina',
    start_date: '2026-09-21',
    created_at: '2026-09-21T00:00:00Z',
    steps: [{ doseMg: 0.1, intervalDays: 1, weekdays: [1, 2, 3, 4, 5], durationWeeks: 12 }],
  })
  const titration = weeklyProtocol({
    id: 't',
    created_at: '2026-01-05T00:00:00Z',
    start_date: '2026-09-14',
    steps: [
      { doseMg: 1, intervalDays: 1, weekdays: [1], durationWeeks: 4 },
      { doseMg: 1.5, intervalDays: 1, weekdays: [1], durationWeeks: null },
    ],
  })

  it('prefers the plan that has an end, with its week out of its total', () => {
    const k = cycleKpi(activeCycles([titration, blend], now))
    expect(k).toMatchObject({ name: 'CJC-1295 + Ipamorelina', week: 2, total: 12, rest: false })
  })
  it('falls back to the open titration, with no total', () => {
    const k = cycleKpi(activeCycles([titration], now))
    expect(k).toMatchObject({ name: 'Retatrutida', total: null })
    expect(k?.week).toBeGreaterThan(0)
  })
  it('says nothing without a running cycle', () => {
    expect(cycleKpi([])).toBeNull()
    expect(cycleKpi(activeCycles([blend], new Date(2026, 8, 1)))).toBeNull()
  })
})

describe('cover', () => {
  const now = new Date(2026, 9, 4, 12)
  const line = (compoundId: string, runsOutAt: Date | null): RestockLine => ({
    compoundId,
    partners: [compoundId],
    availableMg: 10,
    vials: 1,
    reserve: 0,
    runway: { doses: 3, runsOutAt, nextDoseMg: 1 },
  })

  it('is the supply that ends first', () => {
    const k = coverKpi(
      [line('a', new Date(2026, 10, 20)), line('b', new Date(2026, 9, 19)), line('c', null)],
      now,
    )
    expect(k).toEqual({ days: 15, compoundIds: ['b'] })
  })
  it('is open-ended when every supply outlasts the horizon, and nothing without lines', () => {
    expect(coverKpi([line('a', null)], now)).toEqual({ days: null, compoundIds: [] })
    expect(coverKpi([], now)).toBeNull()
  })
  it('never counts below zero', () => {
    expect(coverKpi([line('a', new Date(2026, 9, 1))], now)?.days).toBe(0)
  })
  it('reads days up to a hundred and months after that', () => {
    expect(coverLabel(15)).toEqual({ value: 15, unit: 'd', plus: false })
    expect(coverLabel(99)).toEqual({ value: 99, unit: 'd', plus: false })
    expect(coverLabel(100)).toEqual({ value: 3, unit: 'mo', plus: false })
    expect(coverLabel(null)).toEqual({ value: COVER_HORIZON_DAYS / 30, unit: 'mo', plus: true })
  })
  it('draws the gauge full at three months and never empty', () => {
    expect(coverFraction(null)).toBe(1)
    expect(coverFraction(120)).toBe(1)
    expect(coverFraction(45)).toBe(0.5)
    expect(coverFraction(0)).toBe(0.04)
  })
})
