import { describe, expect, it } from 'vitest'
import type { DoseEvent, PkParams } from '../types'
import {
  amountAt,
  amountToConcentration,
  exposureCurve,
  halfLifeToKe,
  rateConstants,
  singleDoseAmount,
  solveKa,
  steadyState,
  steadyStateAtPhase,
  steadyStateProgress,
  tmaxFor,
  washoutHours,
} from './engine'

/** Semaglutide-like: t½ ≈ 7 days, tmax ≈ 2 days. */
const SEMA: PkParams = { halfLifeH: 168, tmaxH: 48 }
/** Bolus-like reference for analytic checks. */
const BOLUS: PkParams = { halfLifeH: 24 }

const H = 3_600_000
const t0 = new Date('2026-01-01T09:00:00Z')
const plusH = (h: number) => new Date(t0.getTime() + h * H)

describe('rate constants', () => {
  it('converts half-life to ke', () => {
    expect(halfLifeToKe(24)).toBeCloseTo(Math.LN2 / 24, 12)
    expect(() => halfLifeToKe(0)).toThrow(RangeError)
  })

  it('solveKa reproduces the requested tmax', () => {
    const ke = halfLifeToKe(168)
    const ka = solveKa(48, ke)
    expect(tmaxFor(ka, ke)).toBeCloseTo(48, 6)
    expect(ka).toBeGreaterThan(ke)
  })

  it('handles flip-flop kinetics (tmax longer than 1/ke)', () => {
    const ke = halfLifeToKe(10) // 1/ke ≈ 14.4 h
    const ka = solveKa(40, ke)
    expect(ka).toBeLessThan(ke)
    expect(tmaxFor(ka, ke)).toBeCloseTo(40, 6)
  })

  it('bolus when tmax missing', () => {
    expect(rateConstants(BOLUS).ka).toBe(Number.POSITIVE_INFINITY)
  })
})

describe('singleDoseAmount', () => {
  it('bolus decays by half every half-life', () => {
    const rc = rateConstants(BOLUS)
    expect(singleDoseAmount(10, 0, rc)).toBeCloseTo(10)
    expect(singleDoseAmount(10, 24, rc)).toBeCloseTo(5)
    expect(singleDoseAmount(10, 48, rc)).toBeCloseTo(2.5)
    expect(singleDoseAmount(10, -1, rc)).toBe(0)
  })

  it('first-order absorption starts at 0 and peaks at tmax', () => {
    const rc = rateConstants(SEMA)
    expect(singleDoseAmount(2.4, 0, rc)).toBeCloseTo(0, 9)
    const atPeak = singleDoseAmount(2.4, 48, rc)
    expect(singleDoseAmount(2.4, 40, rc)).toBeLessThan(atPeak)
    expect(singleDoseAmount(2.4, 56, rc)).toBeLessThan(atPeak)
    expect(atPeak).toBeLessThan(2.4)
    expect(atPeak).toBeGreaterThan(1.5)
  })

  it('mass balance: absorbed amount never exceeds the dose', () => {
    const rc = rateConstants(SEMA)
    for (let t = 0; t < 2000; t += 7) {
      expect(singleDoseAmount(1, t, rc)).toBeLessThanOrEqual(1 + 1e-12)
    }
  })
})

describe('superposition', () => {
  it('adds contributions of past doses only', () => {
    const rc = rateConstants(BOLUS)
    const doses: DoseEvent[] = [
      { at: plusH(0), mg: 10 },
      { at: plusH(24), mg: 10 },
      { at: plusH(1000), mg: 100 }, // future, ignored
    ]
    expect(amountAt(doses, plusH(24), rc)).toBeCloseTo(5 + 10)
    expect(amountAt(doses, plusH(48), rc)).toBeCloseTo(2.5 + 5)
  })

  it('exposureCurve samples a regular grid and refines at doses', () => {
    const doses: DoseEvent[] = [{ at: plusH(24), mg: 1 }]
    const pts = exposureCurve(doses, BOLUS, { from: plusH(0), to: plusH(72), stepH: 12 })
    expect(pts).toHaveLength(7)
    const refined = exposureCurve(doses, BOLUS, {
      from: plusH(0),
      to: plusH(72),
      stepH: 12,
      refineAtDoses: true,
    })
    expect(refined.length).toBeGreaterThan(pts.length)
    for (let i = 1; i < refined.length; i++) {
      expect(refined[i]!.at.getTime()).toBeGreaterThanOrEqual(refined[i - 1]!.at.getTime())
    }
  })
})

describe('steady state', () => {
  it('bolus weekly regimen matches analytic accumulation', () => {
    const ss = steadyState(10, 24, BOLUS) // dose every half-life
    // trough = D·e^-kτ/(1-e^-kτ) = 10·0.5/0.5 = 10 ; peak = trough + D = 20
    expect(ss.troughMg).toBeCloseTo(10, 9)
    expect(ss.peakMg).toBeCloseTo(20, 9)
    expect(ss.accumulationRatio).toBeCloseTo(2, 9)
    // average = D/(ke·τ) = 10/(ln2) ≈ 14.43
    expect(ss.avgMg).toBeCloseTo(10 / Math.LN2, 9)
    expect(ss.hoursTo90).toBeCloseTo(24 * Math.log2(10), 6)
  })

  it('semaglutide 2.4 mg weekly: average on board ≈ 3.5 mg, peak > avg > trough', () => {
    const ss = steadyState(2.4, 168, SEMA)
    expect(ss.avgMg).toBeCloseTo(2.4 / Math.LN2, 6) // ≈ 3.46 mg
    expect(ss.peakMg).toBeGreaterThan(ss.avgMg)
    expect(ss.troughMg).toBeLessThan(ss.avgMg)
    expect(ss.tPeakH).toBeGreaterThan(0)
    expect(ss.tPeakH).toBeLessThan(168)
    // ~5 half-lives to 97%
    expect(ss.hoursTo97 / 168).toBeCloseTo(5.06, 1)
  })

  it('steadyStateAtPhase is periodic and continuous with the trough', () => {
    const a = steadyStateAtPhase(2.4, 168, 0, SEMA)
    const b = steadyStateAtPhase(2.4, 168, 168, SEMA)
    expect(a).toBeCloseTo(b, 9)
    const ss = steadyState(2.4, 168, SEMA)
    expect(a).toBeCloseTo(ss.troughMg, 6)
  })

  it('numeric superposition converges to the analytic steady state', () => {
    // 40 weekly doses, then compare with analytic curve at the same phase.
    const doses: DoseEvent[] = Array.from({ length: 40 }, (_, i) => ({
      at: plusH(i * 168),
      mg: 2.4,
    }))
    const rc = rateConstants(SEMA)
    const lastDose = doses[39]!.at
    for (const phase of [0, 24, 48, 100, 167]) {
      const numeric = amountAt(doses, new Date(lastDose.getTime() + phase * H), rc)
      const analytic = steadyStateAtPhase(2.4, 168, phase, SEMA)
      expect(numeric / analytic).toBeCloseTo(1, 3)
    }
  })
})

describe('steadyStateProgress', () => {
  it('reports ~0 with no doses and →1 after many doses', () => {
    const none = steadyStateProgress([], 2.4, 168, plusH(0), SEMA)
    expect(none.fraction).toBe(0)
    expect(none.hoursTo90).toBeGreaterThan(0)

    const many: DoseEvent[] = Array.from({ length: 30 }, (_, i) => ({
      at: plusH(i * 168),
      mg: 2.4,
    }))
    const p = steadyStateProgress(many, 2.4, 168, plusH(29 * 168 + 24), SEMA)
    expect(p.fraction).toBeCloseTo(1, 2)
    expect(p.hoursTo90).toBe(0)
  })

  it('first dose is far from steady state and progress grows dose by dose', () => {
    const h = (n: number): DoseEvent[] =>
      Array.from({ length: n }, (_, i) => ({ at: plusH(i * 168), mg: 2.4 }))
    const f1 = steadyStateProgress(h(1), 2.4, 168, plusH(24), SEMA).fraction
    const f2 = steadyStateProgress(h(2), 2.4, 168, plusH(168 + 24), SEMA).fraction
    const f4 = steadyStateProgress(h(4), 2.4, 168, plusH(3 * 168 + 24), SEMA).fraction
    expect(f1).toBeLessThan(f2)
    expect(f2).toBeLessThan(f4)
    expect(f1).toBeGreaterThan(0.3)
    expect(f1).toBeLessThan(0.6)
    expect(f4).toBeGreaterThan(0.85)
  })

  it('exceeds 1 after a dose reduction (clamped at 1.5)', () => {
    const doses: DoseEvent[] = Array.from({ length: 20 }, (_, i) => ({
      at: plusH(i * 168),
      mg: 2.4,
    }))
    const p = steadyStateProgress(doses, 1.0, 168, plusH(19 * 168 + 24), SEMA)
    expect(p.fraction).toBeGreaterThan(1)
    expect(p.fraction).toBeLessThanOrEqual(1.5)
  })
})

describe('washout & concentration', () => {
  it('washoutHours to 10% ≈ 3.32 half-lives', () => {
    expect(washoutHours(0.1, SEMA) / 168).toBeCloseTo(Math.log2(10), 6)
    expect(() => washoutHours(1, SEMA)).toThrow(RangeError)
  })

  it('concentration derived only when volume is known', () => {
    expect(amountToConcentration(1, SEMA)).toEqual({})
    const c = amountToConcentration(1.25, { halfLifeH: 168, apparentVolumeL: 12.5 })
    expect(c.ngPerMl).toBeCloseTo(100)
    const c2 = amountToConcentration(1.25, {
      halfLifeH: 168,
      apparentVolumeL: 12.5,
      molarMassGPerMol: 4113.6,
    })
    expect(c2.nmolPerL).toBeCloseTo((0.1 / 4113.6) * 1e6, 6)
  })
})
