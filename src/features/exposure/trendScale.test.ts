import { describe, expect, it } from 'vitest'
import { hourTicks, spaceOut, tickStep, trendTimeTicks, valueAxis } from './trendScale'

const DAY = 86_400_000

describe('tickStep', () => {
  it('takes the smallest nice step that is not under what was asked', () => {
    expect(tickStep(1.8, 1)).toBe(2)
    expect(tickStep(2.43, 1)).toBe(2.5)
    expect(tickStep(0.04, 2)).toBe(0.05)
    expect(tickStep(130, 0)).toBe(200)
  })
  it('never goes finer than the precision of the readings', () => {
    // A heart rate in whole beats cannot have ticks of 0.5 or 2.5.
    expect(tickStep(0.2, 0)).toBe(1)
    expect(tickStep(2.2, 0)).toBe(5)
    // A weight in tenths can.
    expect(tickStep(0.04, 1)).toBe(0.1)
    expect(tickStep(0.325, 1)).toBe(0.5)
  })
  it('survives nothing and rubbish', () => {
    expect(tickStep(0, 0)).toBe(1)
    expect(tickStep(Number.NaN, 1)).toBe(0.1)
  })
})

describe('valueAxis', () => {
  function evenly(ticks: number[]) {
    const step = ticks[1]! - ticks[0]!
    ticks.forEach((t, i) => expect(t).toBeCloseTo(ticks[0]! + i * step, 9))
  }

  it('gives a weight a tidy axis with a tick on each edge', () => {
    const a = valueAxis({ lo: 74.9, hi: 80.5, plotHeight: 120, digits: 1 })
    expect(a.ticks[0]).toBe(a.domain[0])
    expect(a.ticks.at(-1)).toBe(a.domain[1])
    expect(a.domain[0]).toBeLessThan(74.9)
    expect(a.domain[1]).toBeGreaterThan(80.5)
    expect(a.ticks.length).toBeGreaterThanOrEqual(3)
    expect(a.ticks.length).toBeLessThanOrEqual(5)
    evenly(a.ticks)
  })

  it('asks for fewer ticks of a short plot, so the labels never touch', () => {
    const small = valueAxis({ lo: 5, hi: 9, plotHeight: 60, digits: 0 })
    const tall = valueAxis({ lo: 5, hi: 9, plotHeight: 160, digits: 0 })
    expect(small.ticks.length).toBeLessThanOrEqual(tall.ticks.length)
    // At 60 px, 3 ticks are 30 px apart at the most; never closer than a label is tall.
    expect(60 / (small.ticks.length - 1)).toBeGreaterThan(24)
  })

  it('gives a flat series a span to sit in, and never divides by zero', () => {
    for (const v of [77.2, 0, 5.6, -3, 1e-4, 1e9]) {
      const a = valueAxis({ lo: v, hi: v, plotHeight: 100, digits: 1 })
      expect(a.domain[1]).toBeGreaterThan(a.domain[0])
      expect(a.domain[0]).toBeLessThanOrEqual(v)
      expect(a.domain[1]).toBeGreaterThanOrEqual(v)
      expect(a.ticks.every(Number.isFinite)).toBe(true)
    }
    expect(valueAxis({ lo: 0, hi: 0, plotHeight: 100, digits: 1 }).ticks).toEqual([-0.2, 0, 0.2])
  })

  it('keeps ticks writable with the digits of the readings', () => {
    // Whole beats: ticks are whole numbers, never 60.5.
    const hr = valueAxis({ lo: 60, hi: 62, plotHeight: 120, digits: 0 })
    expect(hr.ticks.every(Number.isInteger)).toBe(true)
    expect(hr.decimals).toBe(0)
    // Tenths of a percent.
    const a1c = valueAxis({ lo: 5.4, hi: 5.9, plotHeight: 120, digits: 1 })
    expect(a1c.decimals).toBeLessThanOrEqual(1)
  })

  it('pins a fixed domain and marks its ends and its middle', () => {
    const a = valueAxis({ lo: 3, hi: 8, plotHeight: 64, digits: 0, fixed: [0, 10] })
    expect(a).toEqual({ domain: [0, 10], ticks: [0, 5, 10], decimals: 0 })
    // Given the wrong way round it still works.
    expect(valueAxis({ lo: 0, hi: 1, plotHeight: 64, digits: 0, fixed: [10, 0] }).domain).toEqual([
      0, 10,
    ])
    // A fixed range with no width is ignored for the data's own.
    const flat = valueAxis({ lo: 4, hi: 6, plotHeight: 64, digits: 0, fixed: [5, 5] })
    expect(flat.domain[1]).toBeGreaterThan(flat.domain[0])
  })
})

describe('hourTicks / trendTimeTicks', () => {
  const at = (d: number, h: number, m = 0) => new Date(2026, 9, d, h, m).getTime()

  it('puts ticks on whole hours inside a working day', () => {
    const { ticks, pattern } = hourTicks(at(5, 8), at(5, 16), 4)
    expect(pattern).toBe('HH:mm')
    expect(ticks.length).toBeGreaterThan(1)
    expect(ticks.length).toBeLessThanOrEqual(4)
    for (const t of ticks) {
      expect(new Date(t).getMinutes()).toBe(0)
      expect(t).toBeGreaterThan(at(5, 8))
      expect(t).toBeLessThan(at(5, 16))
    }
  })

  it('names the weekday when the hours reach into another day', () => {
    expect(hourTicks(at(5, 20), at(7, 8), 5).pattern).toBe('EEE HH:mm')
  })

  it('falls back to hours when two readings are hours apart', () => {
    const from = at(5, 8, 10)
    const to = at(5, 12, 10)
    const t = trendTimeTicks(from, to, 4)
    expect(t.pattern).toBe('HH:mm')
    expect(t.ticks.length).toBeGreaterThan(1)
  })

  it('leaves days, weeks and months to the level charts', () => {
    const from = at(1, 13)
    expect(trendTimeTicks(from, from + 5 * DAY, 5).pattern).toBe('EEE d')
    expect(trendTimeTicks(from, from + 42 * DAY, 5).pattern).toBe('d MMM')
    expect(trendTimeTicks(from, from + 200 * DAY, 5).pattern).toBe('MMM')
  })

  it('returns nothing for an empty span', () => {
    expect(trendTimeTicks(at(5, 8), at(5, 8)).ticks).toEqual([])
    expect(hourTicks(at(5, 8), at(5, 8)).ticks).toEqual([])
  })
})

describe('spaceOut', () => {
  it('keeps the first of two labels that would touch', () => {
    const labels = [
      { key: 'a', left: 0, right: 40 },
      { key: 'b', left: 42, right: 80 },
      { key: 'c', left: 60, right: 100 },
      { key: 'd', left: 110, right: 150 },
    ]
    expect(spaceOut(labels, 6).map((l) => l.key)).toEqual(['a', 'c', 'd'])
    expect(spaceOut(labels, 0).map((l) => l.key)).toEqual(['a', 'b', 'd'])
    expect(spaceOut([], 6)).toEqual([])
  })
})
