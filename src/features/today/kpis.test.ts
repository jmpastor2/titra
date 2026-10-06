import { addDays } from 'date-fns'
import { describe, expect, it } from 'vitest'
import { activeCycles } from '@/features/cycle/items'
import { weeklyProtocol } from '@/features/exposure/testData'
import type { WeekCell, WeekDay, WeekStatus } from '@/features/doses/week'
import type { RestockLine } from '@/features/inventory/vials'
import { labAccount } from '@/features/exposure/testData'
import {
  adherenceAt,
  adherenceKpi,
  adherenceTone,
  COVER_HORIZON_DAYS,
  coverKpi,
  coverLabel,
  cycleKpi,
  cycleSteps,
  dayVerdict,
  orderNow,
  streakOf,
  streakTicks,
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

describe('streakTicks', () => {
  it('draws done days solid, misses rose, a started day half and the rest as stubs', () => {
    expect(
      streakTicks(run(['onTime'], ['missed'], [], ['extra'], ['onTime', 'upcoming'], ['due'])),
    ).toEqual(['full', 'missed', 'none', 'none', 'partial', 'none'])
  })
})

describe('adherence', () => {
  // Sunday evening of the lab account: week 4 of retatrutide and MOTS-c, week 2 of the blend.
  const SUNDAY = new Date(2026, 9, 4, 20, 30)
  const lab = labAccount(SUNDAY)

  it('is taken over expected across the plans being followed, over 28 days', () => {
    const a = adherenceAt(lab.protocols, lab.doses, SUNDAY)!
    expect(a.expected).toBeGreaterThan(0)
    expect(a.ratio).toBeCloseTo(a.taken / a.expected)
    expect(adherenceAt([], lab.doses, SUNDAY)).toBeNull()
    expect(
      adherenceAt(
        lab.protocols.map((p) => ({ ...p, status: 'paused' as const })),
        lab.doses,
        SUNDAY,
      ),
    ).toBeNull()
  })

  it('compares with the 28 days before in whole points, only when those had enough doses', () => {
    const k = adherenceKpi(lab.protocols, lab.doses, SUNDAY)!
    const before = adherenceAt(lab.protocols, lab.doses, addDays(SUNDAY, -28))
    if (before && before.expected >= 4) {
      expect(k.deltaPts).toBe(Math.round(k.ratio * 100) - Math.round(before.ratio * 100))
    } else {
      expect(k.deltaPts).toBeNull()
    }
    // A month earlier the plans had barely started: nothing to compare with.
    expect(adherenceKpi(lab.protocols, lab.doses, new Date(2026, 8, 14, 12))?.deltaPts).toBeNull()
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
    expect(k?.protocol.name).toBe('CJC-1295 + Ipamorelina')
    expect(k?.head).toEqual({ kind: 'week', week: 2, total: 12 })
  })
  it('falls back to the open titration, with no total', () => {
    const k = cycleKpi(activeCycles([titration], now))
    expect(k?.protocol.name).toBe('Retatrutida')
    expect(k?.head.kind).toBe('step')
    expect(k?.head.week).toBeGreaterThan(0)
  })
  it('says nothing without a running cycle', () => {
    expect(cycleKpi([])).toBeNull()
    expect(cycleKpi(activeCycles([blend], new Date(2026, 8, 1)))).toBeNull()
  })
})

describe('cycleSteps', () => {
  const now = new Date(2026, 9, 4, 12)
  // 100 → 150 → 200 mcg, then four weeks of rest: week 2 of 16 bars.
  const blend = weeklyProtocol({
    id: 'b',
    start_date: '2026-09-21',
    steps: [
      { doseMg: 0.1, intervalDays: 1, weekdays: [1, 2, 3, 4, 5], durationWeeks: 1 },
      { doseMg: 0.15, intervalDays: 1, weekdays: [1, 2, 3, 4, 5], durationWeeks: 1 },
      { doseMg: 0.2, intervalDays: 1, weekdays: [1, 2, 3, 4, 5], durationWeeks: 10 },
      { doseMg: 0, intervalDays: 1, pause: true, durationWeeks: 4 },
    ],
  })

  it('draws one bar per week, rising with the dose, the rest hatched', () => {
    const [cycle] = activeCycles([blend], now)
    const steps = cycleSteps(cycle!.info)
    expect(steps).toHaveLength(16)
    expect(steps.map((s) => s.kind).slice(0, 3)).toEqual(['done', 'current', 'planned'])
    const levels = steps.slice(0, 3).map((s) => s.level ?? 0)
    ;[0.5, 0.75, 1].forEach((l, i) => expect(levels[i]).toBeCloseTo(l))
    expect(steps.slice(-4).every((s) => s.kind === 'rest')).toBe(true)
  })

  it('cuts a long plan around the current week', () => {
    const [cycle] = activeCycles([blend], now)
    const steps = cycleSteps(cycle!.info, 8)
    expect(steps.length).toBeLessThanOrEqual(8)
    // The weeks left out end in one short stub.
    expect(steps.at(-1)).toEqual({ kind: 'planned', level: 0.18 })
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
    expect(k).toEqual({
      days: 15,
      compoundIds: ['b'],
      runsOutAt: new Date(2026, 9, 19),
      // Inventario's rule: order three weeks before it runs out.
      orderBy: new Date(2026, 8, 28),
    })
  })
  it('is open-ended when every supply outlasts the horizon, and nothing without lines', () => {
    expect(coverKpi([line('a', null)], now)).toEqual({
      days: null,
      compoundIds: [],
      runsOutAt: null,
      orderBy: null,
    })
    expect(coverKpi([], now)).toBeNull()
  })
  it('says "order now" once the order-by day has come', () => {
    expect(orderNow(coverKpi([line('a', new Date(2026, 9, 19))], now)!, now)).toBe(true)
    expect(orderNow(coverKpi([line('a', new Date(2026, 9, 25))], now)!, now)).toBe(true)
    expect(orderNow(coverKpi([line('a', new Date(2026, 9, 26))], now)!, now)).toBe(false)
    expect(orderNow(coverKpi([line('a', null)], now)!, now)).toBe(false)
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
})
