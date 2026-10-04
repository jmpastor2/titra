/**
 * A step's dose the way the person thinks of it: syringe units when a vial says how to
 * draw it, else mg or mcg. Pure; see dose.test.ts.
 */
import type { InventoryRow } from '@/data/database.types'
import { planDraw } from '@/domain/dosing/draw'
import { componentsAt } from '@/domain/dosing/schedule'
import type { DoseUnit, ProtocolLike } from '@/domain/types'
import { drawPartFor } from '@/features/inventory/vials'
import { fmtDose, fmtDoseValue, fmtNumber, type Locale } from '@/lib/format'

export interface StepDose {
  /** Dose of the protocol's primary compound, in mg. */
  mg: number
  /** Units to draw for the whole administration (a blend or stack is one draw); null when unknown. */
  units: number | null
}

/**
 * The dose with the units to draw: the stack or blend that rides along is part of the draw.
 * A pause has no dose and so no draw.
 */
export function stepDose(
  protocol: ProtocolLike,
  vials: readonly InventoryRow[],
  doseMg: number,
): StepDose {
  if (!(doseMg > 0)) return { mg: doseMg, units: null }
  const parts = [{ compoundId: protocol.compoundId, doseMg }, ...componentsAt(protocol, doseMg)]
  const plan = planDraw(parts.map((p) => drawPartFor(vials, p.compoundId, p.doseMg)))
  return { mg: doseMg, units: plan && plan.unknown.length === 0 ? plan.totalUnits : null }
}

/** "9 U" when the draw is known, else the dose itself: "150 mcg". */
export function doseMain(d: StepDose, unit: DoseUnit, locale: Locale): string {
  return d.units === null ? fmtDose(d.mg, unit, locale) : `${fmtNumber(d.units, locale, 1)} U`
}

/** The dose in mg or mcg beside the units, or null when that already is the main figure. */
export function doseDetail(d: StepDose, unit: DoseUnit, locale: Locale): string | null {
  return d.units === null ? null : fmtDose(d.mg, unit, locale)
}

/** "9 U (150 mcg)" for running text, "150 mcg" without a known draw. */
export function doseInline(d: StepDose, unit: DoseUnit, locale: Locale): string {
  const detail = doseDetail(d, unit, locale)
  return detail ? `${doseMain(d, unit, locale)} (${detail})` : doseMain(d, unit, locale)
}

/** "150 → 200 mcg": a step in the substance's own unit, or null when units are all there is. */
export function doseShift(
  from: StepDose,
  to: StepDose,
  unit: DoseUnit,
  locale: Locale,
): string | null {
  if (to.units === null || from.units === null) return null
  return `${fmtDoseValue(from.mg, unit, locale)} → ${fmtDose(to.mg, unit, locale)}`
}
