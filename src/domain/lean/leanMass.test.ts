import { describe, expect, it } from 'vitest'
import { compositionTrend, proteinTarget, rateFlag } from './leanMass'

describe('proteinTarget', () => {
  it('defaults to 1.6 g/kg', () => {
    expect(proteinTarget(90)).toBe(144)
    expect(proteinTarget(90, 2)).toBe(180)
    expect(proteinTarget(0)).toBe(0)
  })
})

describe('compositionTrend', () => {
  const d = (n: number) => new Date(2026, 0, 1 + n)
  it('needs at least two points', () => {
    expect(compositionTrend([{ at: d(0), kg: 90 }], 30)).toBeNull()
  })
  it('computes delta, rate and lean share', () => {
    const t = compositionTrend(
      [
        { at: d(0), kg: 100, leanKg: 70 },
        { at: d(28), kg: 96, leanKg: 69 },
      ],
      30,
    )!
    expect(t.deltaKg).toBeCloseTo(-4)
    expect(t.deltaLeanKg).toBeCloseTo(-1)
    expect(t.leanShare).toBeCloseTo(0.25)
    expect(t.kgPerWeek).toBeCloseTo(-1)
  })
  it('restricts to the window', () => {
    const t = compositionTrend(
      [
        { at: d(0), kg: 110 },
        { at: d(20), kg: 100 },
        { at: d(30), kg: 98 },
      ],
      14,
    )!
    expect(t.deltaKg).toBeCloseTo(-2)
  })
})

describe('rateFlag', () => {
  it('flags >1%/week as fast', () => {
    expect(rateFlag(-1.2, 100)).toBe('fast')
    expect(rateFlag(-0.5, 100)).toBe('ok')
    expect(rateFlag(0.3, 100)).toBe('gaining')
  })
})
