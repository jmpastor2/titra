import { describe, expect, it } from 'vitest'
import type { ProtocolLike } from '@/domain/types'
import {
  amountScale,
  niceStep,
  niceYAxis,
  scaledAmount,
  stepChanges,
  timeTicks,
} from './chartScale'

const DAY = 86_400_000

describe('niceStep / niceYAxis', () => {
  it('rounds up to 1, 2, 2.5 or 5 × 10ⁿ', () => {
    expect(niceStep(1.47)).toBe(2)
    expect(niceStep(0.117)).toBe(0.2)
    expect(niceStep(2.2)).toBe(2.5)
    expect(niceStep(7)).toBe(10)
    expect(niceStep(0)).toBe(1)
  })
  it('builds a zero-based axis with headroom and even ticks', () => {
    expect(niceYAxis(4.4)).toEqual({ max: 6, ticks: [0, 2, 4, 6] })
    expect(niceYAxis(0.35)).toEqual({ max: 0.4, ticks: [0, 0.2, 0.4] })
    const a = niceYAxis(10)
    expect(a.max).toBeGreaterThanOrEqual(10)
    expect(a.ticks[0]).toBe(0)
    expect(a.ticks.at(-1)).toBe(a.max)
  })
  it('falls back for empty data', () => {
    expect(niceYAxis(0).max).toBe(1)
    expect(niceYAxis(Number.NaN).max).toBe(1)
  })
})

describe('amountScale', () => {
  it('switches to mcg for small amounts only', () => {
    expect(amountScale(0.1)).toEqual({ factor: 1000, unit: 'mcg' })
    expect(amountScale(2)).toEqual({ factor: 1, unit: 'mg' })
    expect(amountScale(0)).toEqual({ factor: 1, unit: 'mg' })
  })
  it('expresses an amount on the reference scale with readout digits', () => {
    expect(scaledAmount(4.23)).toEqual({ value: 4.23, unit: 'mg', digits: 1 })
    expect(scaledAmount(0.62)).toEqual({ value: 0.62, unit: 'mg', digits: 2 })
    expect(scaledAmount(0.002, 0.1)).toMatchObject({ unit: 'mcg', digits: 1 })
    expect(scaledAmount(0.2, 3)).toMatchObject({ unit: 'mg', value: 0.2 })
  })
})

describe('timeTicks', () => {
  const from = new Date(2026, 8, 1, 13).getTime()
  it('keeps ticks away from both edges so labels are not clipped', () => {
    const to = from + 42 * DAY
    const { ticks } = timeTicks(from, to, 5)
    expect(ticks.length).toBeGreaterThan(1)
    expect(ticks.length).toBeLessThanOrEqual(5)
    for (const t of ticks) {
      expect(t).toBeGreaterThan(from + 0.07 * 42 * DAY - 1)
      expect(t).toBeLessThan(to - 0.07 * 42 * DAY + 1)
    }
  })
  it('lands weekly ticks on local Mondays at midnight', () => {
    const { ticks, pattern } = timeTicks(from, from + 42 * DAY, 5)
    expect(pattern).toBe('d MMM')
    for (const t of ticks) {
      const d = new Date(t)
      expect(d.getDay()).toBe(1)
      expect(d.getHours()).toBe(0)
    }
  })
  it('uses day ticks for short spans and months for long ones', () => {
    expect(timeTicks(from, from + 5 * DAY, 5).pattern).toBe('EEE d')
    const long = timeTicks(from, from + 180 * DAY, 5)
    expect(long.pattern).toBe('MMM')
    for (const t of long.ticks) expect(new Date(t).getDate()).toBe(1)
  })
  it('returns nothing for an empty span', () => {
    expect(timeTicks(from, from).ticks).toEqual([])
  })
})

describe('stepChanges', () => {
  const RETA: ProtocolLike = {
    compoundId: 'retatrutide',
    startDate: '2026-08-03',
    times: ['09:00'],
    steps: [
      { doseMg: 2, intervalDays: 7, durationWeeks: 4 },
      { doseMg: 4, intervalDays: 7, durationWeeks: 4 },
      { doseMg: 4, intervalDays: 7, durationWeeks: 2 },
      { doseMg: 0, intervalDays: 7, pause: true, durationWeeks: 2 },
      { doseMg: 6, intervalDays: 7, durationWeeks: null },
    ],
  }
  it('reports the start, dose rises, pauses and resumes but not same-dose splits', () => {
    const changes = stepChanges(RETA, new Date(2026, 6, 1), new Date(2026, 11, 1))
    expect(changes.map((c) => c.kind)).toEqual(['start', 'up', 'pause', 'resume'])
    expect(changes[1]).toMatchObject({ doseMg: 4, prevDoseMg: 2 })
    expect(changes[1]!.at).toEqual(new Date(2026, 7, 31))
    expect(changes[3]).toMatchObject({ doseMg: 6, prevDoseMg: 0 })
  })
  it('only includes changes inside the window', () => {
    const changes = stepChanges(RETA, new Date(2026, 7, 10), new Date(2026, 8, 5))
    expect(changes.map((c) => c.kind)).toEqual(['up'])
  })
})
