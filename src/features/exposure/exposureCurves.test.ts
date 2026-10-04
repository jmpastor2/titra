import { describe, expect, it } from 'vitest'
import { amountAt, rateConstants } from '@/domain/pk/engine'
import type { DoseEvent, PkParams, ProtocolLike } from '@/domain/types'
import { buildCurveBundle, stepBands } from './exposureCurves'

const RETA_PK: PkParams = { halfLifeH: 144, tmaxH: 36 }
const at = (m: number, d: number, h = 0, min = 0) => new Date(2026, m - 1, d, h, min)

// Weekly on Mondays at 09:00: 1 mg for two weeks, then 1.25, 1.5 and 2 mg open-ended.
const RETA: ProtocolLike = {
  compoundId: 'retatrutide',
  startDate: '2026-09-14',
  times: ['09:00'],
  steps: [
    { doseMg: 1, intervalDays: 1, weekdays: [1], durationWeeks: 2 },
    { doseMg: 1.25, intervalDays: 1, weekdays: [1], durationWeeks: 1 },
    { doseMg: 1.5, intervalDays: 1, weekdays: [1], durationWeeks: 1 },
    { doseMg: 2, intervalDays: 1, weekdays: [1], durationWeeks: null },
  ],
}
const taken: DoseEvent[] = [
  { at: at(9, 14, 9, 7), mg: 1 },
  { at: at(9, 21, 9, 3), mg: 1 },
  { at: at(9, 28, 9, 7), mg: 1.25 },
]

describe('buildCurveBundle', () => {
  const now = at(10, 5, 0, 5) // Monday 5 Oct, five past midnight: week 4
  const base = {
    compoundId: 'retatrutide',
    pk: RETA_PK,
    history: taken,
    protocol: RETA,
    daysToNextStep: 7,
    now,
  }

  it('ends the history exactly at now, on the reading', () => {
    const b = buildCurveBundle({ ...base, range: '4w' })
    const last = b.history.at(-1)!
    expect(last.at).toEqual(now)
    expect(last.mg).toBeCloseTo(amountAt(taken, now, rateConstants(RETA_PK)), 12)
  })

  it('continues the projection from that very point, without a jump', () => {
    const b = buildCurveBundle({ ...base, range: '4w' })
    expect(b.projection[0]!.at).toEqual(now)
    expect(b.projection[0]!.mg).toBeCloseTo(b.history.at(-1)!.mg, 9)
    // The first planned dose is Monday 09:00, nine hours ahead; the projection reaches past it.
    expect(b.planned[0]!.at).toEqual(at(10, 5, 9))
    expect(b.planned[0]!.mg).toBe(1.5)
    expect(b.projection.at(-1)!.at.getTime()).toBeGreaterThanOrEqual(b.to.getTime() - 3 * 3_600_000)
  })

  it('starts the history a day before the first dose, not weeks earlier', () => {
    const b = buildCurveBundle({ ...base, range: '12w' })
    expect(b.from).toEqual(at(9, 13, 9, 7))
    expect(b.history[0]!.mg).toBe(0)
  })

  it('reaches the next titration step in the default view', () => {
    const b = buildCurveBundle({ ...base, range: '4w' })
    // Next step in 7 days: the 14-day default is enough and shows the step on the chart.
    expect(b.steps.map((s) => [s.kind, s.doseMg])).toEqual([
      ['start', 1],
      ['up', 1.25],
      ['up', 1.5],
      ['up', 2],
    ])
    const farStep = buildCurveBundle({ ...base, daysToNextStep: 25, range: '4w' })
    expect(farStep.to.getTime() - now.getTime()).toBe(32 * 86_400_000)
  })

  it('draws a steady-state band for every dosing step, the step in force marked', () => {
    const b = buildCurveBundle({ ...base, range: '12w' })
    expect(b.bands).toHaveLength(4)
    expect(b.bands.map((x) => x.current)).toEqual([false, false, true, false])
    // Higher steps, higher ranges.
    const peaks = b.bands.map((x) => x.peakMg)
    expect(peaks.toSorted((a, c) => a - c)).toEqual(peaks)
    for (const band of b.bands) expect(band.troughMg).toBeLessThan(band.peakMg)
  })

  it('rises after a dose taken minutes ago and never dips below zero', () => {
    const justNow = at(10, 5, 9, 20)
    const doses: DoseEvent[] = [...taken, { at: at(10, 5, 9, 15), mg: 1.5 }]
    const b = buildCurveBundle({ ...base, history: doses, now: justNow, range: '7d' })
    const tail = b.history.filter((p) => p.at.getTime() >= at(10, 5, 9, 15).getTime())
    expect(tail.length).toBeGreaterThanOrEqual(2)
    for (let i = 1; i < tail.length; i++)
      expect(tail[i]!.mg).toBeGreaterThanOrEqual(tail[i - 1]!.mg)
    for (const p of [...b.history, ...b.projection]) expect(p.mg).toBeGreaterThanOrEqual(0)
    expect(b.history.at(-1)!.at).toEqual(justNow)
  })

  it('copes with no doses yet and with a first dose still ahead', () => {
    const none = buildCurveBundle({ ...base, history: [], range: '4w' })
    expect(none.history.at(-1)!.mg).toBe(0)
    expect(none.history.every((p) => p.mg === 0)).toBe(true)
    const ahead = buildCurveBundle({
      ...base,
      history: [{ at: at(10, 7, 9), mg: 1 }],
      range: '4w',
    })
    expect(ahead.history.at(-1)!.at).toEqual(now)
    expect(ahead.history.every((p) => p.mg === 0)).toBe(true)
    // The dose logged for later shows up in the projection instead.
    expect(Math.max(...ahead.projection.map((p) => p.mg))).toBeGreaterThan(0)
  })

  it('works without a protocol: history and an empty plan', () => {
    const free = buildCurveBundle({ ...base, protocol: null, daysToNextStep: null, range: '4w' })
    expect(free.planned).toEqual([])
    expect(free.steps).toEqual([])
    expect(free.bands).toEqual([])
    expect(free.projection.length).toBeGreaterThan(0)
  })
})

describe('stepBands', () => {
  it('draws consecutive steps with the same dose as one band', () => {
    const split: ProtocolLike = {
      ...RETA,
      steps: [
        { doseMg: 1.5, intervalDays: 1, weekdays: [1], durationWeeks: 2, label: 'A' },
        { doseMg: 1.5, intervalDays: 1, weekdays: [1], durationWeeks: 2, label: 'B' },
        { doseMg: 2, intervalDays: 1, weekdays: [1], durationWeeks: null },
      ],
    }
    const bands = stepBands(split, RETA_PK, at(9, 1), at(11, 30), at(10, 1))
    expect(bands).toHaveLength(2)
    expect(bands[0]!.from).toEqual(at(9, 14))
    expect(bands[0]!.to).toEqual(at(10, 12))
    expect(bands[0]!.current).toBe(true)
    expect(bands[1]!.current).toBe(false)
  })

  it('skips pauses and clips open-ended steps to the window', () => {
    const cycle: ProtocolLike = {
      ...RETA,
      steps: [
        { doseMg: 1, intervalDays: 1, weekdays: [1], durationWeeks: 2 },
        { doseMg: 0, intervalDays: 1, pause: true, durationWeeks: 2 },
        { doseMg: 1, intervalDays: 1, weekdays: [1], durationWeeks: null },
      ],
    }
    const bands = stepBands(cycle, RETA_PK, at(9, 1), at(11, 30), at(10, 15))
    expect(bands).toHaveLength(2)
    expect(bands[1]!.to).toEqual(at(11, 30))
    expect(bands.map((b) => b.current)).toEqual([false, true])
  })
})
