/**
 * A dose the way the person thinks of it: the number and unit of each compound in the
 * syringe (mg or mcg) and, when the vial it comes from is known, the units to draw.
 * Pure; see doseLabel.test.ts.
 */
import { compoundById } from '@/content/compounds'
import type { InventoryRow } from '@/data/database.types'
import { planDraw } from '@/domain/dosing/draw'
import { componentsAt } from '@/domain/dosing/schedule'
import type { DoseUnit, ProtocolLike } from '@/domain/types'
import { drawPartFor } from '@/features/inventory/vials'
import { fmtDose, fmtDoseList, fmtDoseValue, fmtNumber, type Locale } from '@/lib/format'

export interface DoseLabel {
  /** The primary compound's number without its unit: "1,25". */
  value: string
  /** The primary compound with its unit: "1,25 mg". */
  short: string
  /** The whole administration: "100 + 100 mcg" for a blend, else the same as `short`. */
  full: string
  /** Syringe units to draw ("6 U"); null unless every compound has a known vial. */
  units: string | null
}

const unitOf = (compoundId: string): DoseUnit => compoundById(compoundId)?.defaultUnit ?? 'mg'

/**
 * Label for one dose step. `withUnits` asks for the syringe reading: it comes from the
 * vial in use today, so it only makes sense for a dose that is still to be drawn.
 */
export function doseLabel(args: {
  like: ProtocolLike
  doseMg: number
  vials: readonly InventoryRow[]
  locale: Locale
  withUnits: boolean
}): DoseLabel {
  const { like, doseMg, vials, locale, withUnits } = args
  const parts = [{ compoundId: like.compoundId, doseMg }, ...componentsAt(like, doseMg)]
  const primaryUnit = unitOf(like.compoundId)
  const plan = withUnits
    ? planDraw(parts.map((p) => drawPartFor(vials, p.compoundId, p.doseMg)))
    : null
  return {
    value: fmtDoseValue(doseMg, primaryUnit, locale),
    short: fmtDose(doseMg, primaryUnit, locale),
    full: fmtDoseList(
      parts.map((p) => ({ valueMg: p.doseMg, unit: unitOf(p.compoundId) })),
      locale,
    ),
    units: plan && plan.unknown.length === 0 ? `${fmtNumber(plan.totalUnits, locale, 1)} U` : null,
  }
}
