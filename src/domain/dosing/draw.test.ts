import { describe, expect, it } from 'vitest'
import { planDraw, roundUnits, syringeFor, syringeScale } from './draw'

describe('planDraw', () => {
  it('stacks two compounds in one syringe with cumulative marks', () => {
    // Mod GRF 2 mg in 2 mL (1 mg/mL) and ipamorelin 5 mg in 2.5 mL (2 mg/mL), 100 mcg each.
    const plan = planDraw([
      { compoundId: 'mod-grf-1-29', doseMg: 0.1, concMgPerMl: 1 },
      { compoundId: 'ipamorelin', doseMg: 0.1, concMgPerMl: 2 },
    ])!
    expect(plan.loads.map((l) => [l.units, l.from, l.to])).toEqual([
      [10, 0, 10],
      [5, 10, 15],
    ])
    expect(plan.totalUnits).toBe(15)
    expect(plan.totalMl).toBeCloseTo(0.15, 10)
    expect(plan.capacity).toBe(30)
    expect(plan.fits).toBe(true)
    expect(plan.imprecise).toEqual([])
  })

  it('picks the barrel that fits and flags draws over 1 mL', () => {
    const reta = planDraw([{ compoundId: 'retatrutide', doseMg: 2, concMgPerMl: 5 }])!
    expect(reta.totalUnits).toBe(40)
    expect(reta.capacity).toBe(50)
    const big = planDraw([{ compoundId: 'mots-c', doseMg: 10, concMgPerMl: 5 }])!
    expect(big.totalUnits).toBe(200)
    expect(big.fits).toBe(false)
    expect(big.capacity).toBe(100)
  })

  it('reports loads too small to measure and compounds without a known vial', () => {
    const plan = planDraw([
      { compoundId: 'a', doseMg: 0.05, concMgPerMl: 5 }, // 1 U
      { compoundId: 'b', doseMg: 0.1, concMgPerMl: null },
    ])!
    expect(plan.imprecise).toEqual(['a'])
    expect(plan.unknown).toEqual(['b'])
    expect(plan.loads).toHaveLength(1)
  })

  it('returns null when nothing can be converted', () => {
    expect(planDraw([{ compoundId: 'x', doseMg: 1, concMgPerMl: null }])).toBeNull()
    expect(planDraw([])).toBeNull()
  })
})

describe('blend vials', () => {
  it('draws a premixed blend once and checks the proportion', () => {
    // CJC-1295 + ipamorelin 5 + 5 mg in 3 mL: 1.667 mg/mL of each, 6 U = 100 mcg of each.
    const conc = 5 / 3
    const plan = planDraw([
      { compoundId: 'mod-grf-1-29', doseMg: 0.1, concMgPerMl: conc, blendKey: 'v1' },
      { compoundId: 'ipamorelin', doseMg: 0.1, concMgPerMl: conc, blendKey: 'v1' },
    ])!
    expect(plan.loads).toHaveLength(1)
    expect(plan.loads[0]!.compoundIds).toEqual(['mod-grf-1-29', 'ipamorelin'])
    expect(plan.totalUnits).toBe(6)
    expect(plan.offRatio).toEqual([])

    const off = planDraw([
      { compoundId: 'mod-grf-1-29', doseMg: 0.1, concMgPerMl: conc, blendKey: 'v1' },
      { compoundId: 'ipamorelin', doseMg: 0.2, concMgPerMl: conc, blendKey: 'v1' },
    ])!
    expect(off.offRatio).toEqual(['ipamorelin'])
  })
})

describe('syringe helpers', () => {
  it('rounds to the half-unit mark', () => {
    expect(roundUnits(12.26)).toBe(12.5)
    expect(roundUnits(12.24)).toBe(12)
  })

  it('chooses the smallest barrel and its printed scale', () => {
    expect(syringeFor(30)).toBe(30)
    expect(syringeFor(30.5)).toBe(50)
    expect(syringeFor(80)).toBe(100)
    expect(syringeScale(30)).toEqual([1, 5, 5])
    expect(syringeScale(100)).toEqual([2, 10, 20])
  })
})
