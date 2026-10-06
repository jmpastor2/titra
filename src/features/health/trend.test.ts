import { describe, expect, it } from 'vitest'
import {
  baselineChange,
  dailyMeans,
  ema,
  EMA_TAU_DAYS,
  goalProgress,
  meanIn,
  weeklyRate,
} from './trend'

const at = (d: number, h = 8) => new Date(2026, 8, d, h)
const p = (d: number, value: number, h = 8) => ({ at: at(d, h), value })

describe('dailyMeans', () => {
  it('averages readings of the same day and sorts by day', () => {
    const out = dailyMeans([p(26, 78), p(25, 77.5), p(26, 77, 20)])
    expect(out.map((x) => x.value)).toEqual([77.5, 77.5])
    expect(out[1]!.at).toEqual(at(26, 20))
  })
})

describe('ema', () => {
  it('matches a 7-day EMA on a daily series (alpha = 0.25)', () => {
    expect(EMA_TAU_DAYS).toBeCloseTo(3.476, 2)
    const out = ema([p(1, 80), p(2, 76)])
    expect(out[0]!.value).toBe(80)
    expect(out[1]!.value).toBeCloseTo(79, 6)
  })

  it('lets a reading after a long gap pull harder', () => {
    const daily = ema([p(1, 80), p(2, 76)])[1]!.value
    const gap = ema([p(1, 80), p(8, 76)])[1]!.value
    expect(gap).toBeLessThan(daily)
    expect(gap).toBeGreaterThan(76)
  })

  it('smooths the real weigh-ins without leaving their range', () => {
    const out = ema([p(25, 77.5), p(26, 78.01), p(28, 77)])
    expect(out).toHaveLength(3)
    for (const x of out) {
      expect(x.value).toBeGreaterThanOrEqual(77)
      expect(x.value).toBeLessThanOrEqual(78.01)
    }
  })

  it('is empty for no points', () => {
    expect(ema([])).toEqual([])
  })
})

describe('weeklyRate', () => {
  it('needs 3 days of readings over at least 7 days', () => {
    expect(weeklyRate([p(25, 77.5), p(26, 78.01), p(28, 77)])).toBeNull()
    expect(weeklyRate([p(1, 80), p(9, 79)])).toBeNull()
  })

  it('is the least-squares slope per week', () => {
    const r = weeklyRate([p(1, 80), p(4, 79.7), p(8, 79.3), p(15, 78.6)])
    expect(r).not.toBeNull()
    expect(r!.perWeek).toBeCloseTo(-0.7, 2)
    expect(r!.n).toBe(4)
    expect(r!.spanDays).toBeCloseTo(14, 5)
  })

  it('only looks at the trailing window before the latest reading', () => {
    const old = [p(1, 90), p(2, 90)]
    const recent = [p(20, 80), p(24, 79.5), p(28, 79)]
    expect(weeklyRate([...old, ...recent], 10)!.perWeek).toBeCloseTo(-0.875, 3)
  })
})

describe('baselineChange', () => {
  const pts = [p(25, 77.5), p(26, 78.01), p(28, 77)]

  it('compares the latest reading with the first one near the cycle start', () => {
    const c = baselineChange(pts, at(29, 0))!
    expect(c.baseline!.value).toBe(77.5)
    expect(c.delta).toBeCloseTo(-0.5, 6)
    expect(c.pct).toBeCloseTo(-0.5 / 77.5, 6)
  })

  it('ignores readings long before the lookback', () => {
    const c = baselineChange([p(1, 85), ...pts], at(24, 0))!
    expect(c.baseline!.value).toBe(77.5)
  })

  it('has no change with a single day of readings', () => {
    const c = baselineChange([p(25, 91)], at(20, 0))!
    expect(c.latest.value).toBe(91)
    expect(c.delta).toBeNull()
    expect(c.baseline).toBeNull()
  })

  it('is null without readings', () => {
    expect(baselineChange([], at(1))).toBeNull()
  })
})

describe('meanIn', () => {
  it('averages the half-open window (to − days, to]', () => {
    const pts = [p(20, 80), p(25, 78), p(28, 77)]
    expect(meanIn(pts, at(28, 12), 7)).toBe(77.5)
    expect(meanIn(pts, at(21, 12), 7)).toBe(80)
    expect(meanIn(pts, at(10, 12), 7)).toBeNull()
  })
})

describe('goalProgress', () => {
  it('measures the way done from the start towards a lower goal', () => {
    const g = goalProgress(82, 77, 72)
    expect(g?.fraction).toBeCloseTo(0.5, 9)
    expect(g?.remaining).toBeCloseTo(5, 9)
  })

  it('works towards a higher goal too', () => {
    const g = goalProgress(60, 63, 66)
    expect(g?.fraction).toBeCloseTo(0.5, 9)
    expect(g?.remaining).toBeCloseTo(3, 9)
  })

  it('stays at the ends of the bar when the weight went the wrong way or past the goal', () => {
    expect(goalProgress(82, 84, 72)).toEqual({ fraction: 0, remaining: 12 })
    expect(goalProgress(82, 70, 72)).toEqual({ fraction: 1, remaining: 0 })
  })

  it('has nothing to measure when the goal is where the person started, or is not a number', () => {
    expect(goalProgress(72, 72, 72)).toBeNull()
    expect(goalProgress(82, Number.NaN, 72)).toBeNull()
  })
})
