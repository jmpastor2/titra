/**
 * What a protocol means right now, in the numbers a card or a detail page shows: the week
 * of the cycle, the dose in syringe units and in mass, and what changes next. A stack or a
 * premixed blend is one administration, so one syringe load. Pure; see cycleView.test.ts.
 */
import { compoundById } from '@/content/compounds'
import type { InventoryRow } from '@/data/database.types'
import { cycleInfo, type CycleChange, type CycleInfo } from '@/domain/dosing/cycle'
import { planDraw, type DrawPlan } from '@/domain/dosing/draw'
import { componentsAt } from '@/domain/dosing/schedule'
import type { DoseUnit, ProtocolLike } from '@/domain/types'
import { drawPartFor } from '@/features/inventory/vials'
import { fmtDoseList, fmtNumber, type Locale } from '@/lib/format'

export interface DoseView {
  /** The primary compound's dose in mg: the number the step stores. */
  doseMg: number
  /** Everything drawn in the administration at this dose: the primary plus its stack. */
  parts: { compoundId: string; doseMg: number }[]
  /** The syringe load; a blend is one load. Null without a dose or without any vial. */
  plan: DrawPlan | null
  /** Syringe units for the whole administration; null when a part has no vial concentration. */
  units: number | null
}

/** The administration at a primary dose: what is drawn, and how many units that is. */
export function doseView(
  protocol: ProtocolLike,
  doseMg: number,
  vials: readonly InventoryRow[],
): DoseView {
  const parts = [
    { compoundId: protocol.compoundId, doseMg },
    ...componentsAt(protocol, doseMg).map((c) => ({ compoundId: c.compoundId, doseMg: c.doseMg })),
  ]
  const plan = planDraw(parts.map((p) => drawPartFor(vials, p.compoundId, p.doseMg)))
  return { doseMg, parts, plan, units: plan && plan.unknown.length === 0 ? plan.totalUnits : null }
}

export interface CycleSummary {
  info: CycleInfo
  /** The n-th week with a dose and how many the plan has (null when open-ended). */
  week: { n: number; of: number | null } | null
  /** During a pause: its week and how many it lasts (null when open-ended). */
  rest: { n: number; of: number | null } | null
  /** The dose in force today; null before the start, in a rest and after the end. */
  dose: DoseView | null
  /** The next change and the dose after it (null for a pause or the end). */
  next: { change: CycleChange; dose: DoseView | null } | null
}

export function cycleSummary(
  protocol: ProtocolLike,
  vials: readonly InventoryRow[],
  now: Date,
): CycleSummary | null {
  const info = cycleInfo(protocol, now)
  if (!info) return null
  const step = info.step
  const change = info.next
  return {
    info,
    week: info.doseWeek === null ? null : { n: info.doseWeek, of: info.doseWeeks },
    rest: info.phase === 'rest' ? { n: info.weekInStep, of: info.stepWeeks } : null,
    dose: step && !step.pause ? doseView(protocol, step.doseMg, vials) : null,
    next: change
      ? {
          change,
          dose:
            change.doseMg && change.doseMg > 0 ? doseView(protocol, change.doseMg, vials) : null,
        }
      : null,
  }
}

const nativeUnit = (compoundId: string): DoseUnit => compoundById(compoundId)?.defaultUnit ?? 'mg'

/** "12 U" and "200 + 200 mcg": the two ways of reading one administration. */
export function fmtDoseView(
  view: DoseView,
  locale: Locale,
): { units: string | null; mass: string } {
  return {
    units: view.units === null ? null : `${fmtNumber(view.units, locale, 1)} U`,
    mass: fmtDoseList(
      view.parts.map((p) => ({ valueMg: p.doseMg, unit: nativeUnit(p.compoundId) })),
      locale,
    ),
  }
}

/** "12 U (200 + 200 mcg)", or just the mass when the vial is not known. */
export function fmtDoseLine(view: DoseView, locale: Locale): string {
  const { units, mass } = fmtDoseView(view, locale)
  return units ? `${units} (${mass})` : mass
}
