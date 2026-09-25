/**
 * Drawing an administration into one insulin syringe. Several compounds can share the
 * syringe (Mod GRF 1-29 + ipamorelin): each one is drawn from its own vial on top of
 * the previous, so the plunger marks are cumulative. Pure; see draw.test.ts.
 */
import { mgToUnits } from './reconstitution'

/** U-100 syringe barrels sold in 0.3, 0.5 and 1 mL. */
export type SyringeCapacity = 30 | 50 | 100
export const SYRINGE_CAPACITIES: readonly SyringeCapacity[] = [30, 50, 100]

/** Below this a load is hard to measure accurately; more diluent makes it easier. */
export const MIN_PRECISE_UNITS = 2

export interface DrawPart {
  compoundId: string
  doseMg: number
  /** Vial concentration in mg/mL; null when the vial or its diluent is unknown. */
  concMgPerMl: number | null
}

export interface DrawLoad {
  compoundId: string
  doseMg: number
  units: number
  /** Plunger mark before and after this load, in units. */
  from: number
  to: number
}

export interface DrawPlan {
  loads: DrawLoad[]
  totalUnits: number
  totalMl: number
  capacity: SyringeCapacity
  /** False when the total does not fit in a 1 mL syringe. */
  fits: boolean
  /** Compounds whose load is under MIN_PRECISE_UNITS. */
  imprecise: string[]
  /** Compounds that could not be converted because their concentration is unknown. */
  unknown: string[]
}

/** Half-unit marks are the finest a user can read on a 0.3 mL barrel. */
export function roundUnits(units: number): number {
  return Math.round(units * 2) / 2
}

/** Smallest barrel that holds the draw, so the marks are as far apart as possible. */
export function syringeFor(totalUnits: number): SyringeCapacity {
  return SYRINGE_CAPACITIES.find((c) => totalUnits <= c) ?? 100
}

/** Tick spacing printed on each barrel: [minor, major, label]. */
export function syringeScale(capacity: SyringeCapacity): [number, number, number] {
  if (capacity === 30) return [1, 5, 5]
  if (capacity === 50) return [1, 5, 10]
  return [2, 10, 20]
}

export function planDraw(parts: readonly DrawPart[]): DrawPlan | null {
  const unknown = parts
    .filter((p) => !(p.concMgPerMl && p.concMgPerMl > 0))
    .map((p) => p.compoundId)
  const known = parts.filter((p) => p.concMgPerMl && p.concMgPerMl > 0 && p.doseMg > 0)
  if (known.length === 0) return null

  let mark = 0
  const loads = known.map<DrawLoad>((p) => {
    const units = roundUnits(mgToUnits(p.doseMg, p.concMgPerMl!))
    const load = { compoundId: p.compoundId, doseMg: p.doseMg, units, from: mark, to: mark + units }
    mark += units
    return load
  })
  return {
    loads,
    totalUnits: mark,
    totalMl: mark / 100,
    capacity: syringeFor(mark),
    fits: mark <= 100,
    imprecise: loads.filter((l) => l.units < MIN_PRECISE_UNITS).map((l) => l.compoundId),
    unknown,
  }
}
