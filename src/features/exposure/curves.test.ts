import { describe, expect, it } from 'vitest'
import { exposureCurve, amountAt, rateConstants } from '@/domain/pk/engine'
import type { DoseEvent, PkParams } from '@/domain/types'
import { curveStepH, curveToNow } from './curves'

const RETA: PkParams = { halfLifeH: 144, tmaxH: 36 }
const at = (d: number, h = 0, min = 0) => new Date(2026, 9, d, h, min)

describe('curveStepH', () => {
  it('is finer for short views and coarser for long ones', () => {
    expect(curveStepH(7)).toBe(2)
    expect(curveStepH(28)).toBe(3)
    expect(curveStepH(84)).toBe(6)
    expect(curveStepH(180)).toBe(12)
  })
})

describe('curveToNow', () => {
  const points = [
    { at: at(1), mg: 0 },
    { at: at(1, 3), mg: 0.2 },
  ]
  it('closes the curve with an exact sample at now', () => {
    const now = at(1, 4, 20)
    const out = curveToNow(points, now, 0.3)
    expect(out).toHaveLength(3)
    expect(out.at(-1)).toEqual({ at: now, mg: 0.3 })
    // The input is left alone.
    expect(points).toHaveLength(2)
  })
  it('does not duplicate a sample that is already at or past now', () => {
    expect(curveToNow(points, at(1, 3), 0.2)).toHaveLength(2)
    expect(curveToNow(points, at(1, 2), 0.2)).toHaveLength(2)
  })
  it('starts a curve that has no samples yet', () => {
    expect(curveToNow([], at(1), 0)).toEqual([{ at: at(1), mg: 0 }])
  })
})

describe('the first minutes after a dose', () => {
  // The brief: the curve must rise, never jump or go negative.
  const dose: DoseEvent = { at: at(5, 9), mg: 1.5 }
  const rc = rateConstants(RETA)
  it('climbs smoothly from the level before the dose', () => {
    const before = amountAt([], new Date(dose.at.getTime() - 1), rc)
    const levels = [0, 1, 5, 30, 120].map((m) =>
      amountAt([dose], new Date(dose.at.getTime() + m * 60_000), rc),
    )
    expect(before).toBe(0)
    expect(levels[0]).toBe(0)
    for (let i = 1; i < levels.length; i++) {
      expect(levels[i]).toBeGreaterThan(levels[i - 1]!)
      expect(levels[i]).toBeGreaterThanOrEqual(0)
    }
    // Two hours in, a depot that peaks at 36 h has released well under a fifth of the dose.
    expect(levels[4]!).toBeLessThan(0.2 * dose.mg)
  })
  it('never goes negative anywhere on a sampled curve, with doses a minute apart', () => {
    const doses: DoseEvent[] = [dose, { at: new Date(dose.at.getTime() + 60_000), mg: 0.5 }]
    const curve = exposureCurve(doses, RETA, {
      from: at(4),
      to: at(12),
      stepH: curveStepH(8),
      refineAtDoses: true,
    })
    expect(Math.min(...curve.map((p) => p.mg))).toBeGreaterThanOrEqual(0)
    // And it is monotone up to the peak after the last dose.
    const after = curve.filter((p) => p.at.getTime() >= dose.at.getTime()).slice(0, 12)
    for (let i = 1; i < after.length; i++)
      expect(after[i]!.mg).toBeGreaterThanOrEqual(after[i - 1]!.mg)
  })
})
