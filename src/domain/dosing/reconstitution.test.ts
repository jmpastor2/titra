import { describe, expect, it } from 'vitest'
import { drawUp, penClicks, reconstitute, suggestDiluentMl } from './reconstitution'

describe('reconstitute', () => {
  it('5 mg in 2 mL → 2.5 mg/mL, 25 mcg per unit', () => {
    const r = reconstitute(5, 2)
    expect(r.concentrationMgPerMl).toBe(2.5)
    expect(r.mcgPerUnit).toBe(25)
  })
  it('rejects non-positive input', () => {
    expect(() => reconstitute(0, 2)).toThrow(RangeError)
    expect(() => reconstitute(5, -1)).toThrow(RangeError)
  })
})

describe('drawUp', () => {
  it('250 mcg from 2.5 mg/mL = 0.1 mL = 10 units, 20 doses per vial', () => {
    const r = reconstitute(5, 2)
    const du = drawUp(r, 250)
    expect(du.volumeMl).toBeCloseTo(0.1)
    expect(du.units).toBeCloseTo(10)
    expect(du.unitsRounded).toBe(10)
    expect(du.actualDoseMcg).toBeCloseTo(250)
    expect(du.dosesPerVial).toBe(20)
  })
  it('rounds to half units and reports the real dose', () => {
    const r = reconstitute(10, 3) // 33.33 mcg/unit
    const du = drawUp(r, 300) // 9 units exactly
    expect(du.unitsRounded).toBe(9)
    const du2 = drawUp(r, 320) // 9.6 → 9.5 units → 316.7 mcg
    expect(du2.unitsRounded).toBe(9.5)
    expect(du2.actualDoseMcg).toBeCloseTo(316.67, 1)
  })
})

describe('suggestDiluentMl', () => {
  it('finds the diluent that makes the dose a round 10 units', () => {
    const ml = suggestDiluentMl(5, 250, 10)
    expect(ml).toBe(2)
    const r = reconstitute(5, ml)
    expect(drawUp(r, 250).units).toBeCloseTo(10)
  })
})

describe('penClicks', () => {
  it('rounds to whole clicks', () => {
    expect(penClicks(0.25, 0.0125)).toEqual({ clicks: 20, actualMg: 0.25 })
    expect(penClicks(0.3, 0.0125).clicks).toBe(24)
  })
})
