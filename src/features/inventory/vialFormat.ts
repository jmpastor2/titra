/** One way to write the numbers of a vial everywhere in the inventory. */
import type { DoseUnit } from '@/domain/types'
import { fmtNumber, type Locale } from '@/lib/format'

/** "10 mg/mL"; decimals only when the figure is small enough to need them. */
export function fmtConc(mgPerMl: number, locale: Locale): string {
  return `${fmtNumber(mgPerMl, locale, mgPerMl >= 10 ? 1 : 2)} mg/mL`
}

/** "12 U" on a U-100 syringe, to the half-unit mark. */
export function fmtUnits(units: number, locale: Locale): string {
  return `${fmtNumber(units, locale, 1)} U`
}

/** "8,5 mg": what is in a vial. */
export function fmtMg(mg: number, locale: Locale): string {
  return `${fmtNumber(mg, locale, 2)} mg`
}

/**
 * What one syringe unit holds, in the unit the substance is dosed in: "0,1 mg" for a
 * milligram substance, "16,7 mcg" for a microgram one. A milligram figure under 0.1 mg is
 * easier to read in mcg ("33,3 mcg", not "0,033 mg"), and a microgram one over 1 mg in mg.
 */
export function fmtPerUnit(mgPerUnit: number, unit: DoseUnit, locale: Locale): string {
  const mcg = mgPerUnit * 1000
  const inMcg = unit === 'mcg' ? mgPerUnit < 1 : mgPerUnit < 0.1
  return inMcg
    ? `${fmtNumber(mcg, locale, mcg < 10 ? 2 : 1)} mcg`
    : `${fmtNumber(mgPerUnit, locale, 3)} mg`
}
