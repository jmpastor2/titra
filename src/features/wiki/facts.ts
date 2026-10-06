import { EVIDENCE_ORDER } from '@/content/compounds'
import type { ProtocolTemplate } from '@/content/schema'
import type { DoseUnit, EvidenceTier } from '@/domain/types'
import { fmtDose, fmtDoseValue, type Locale } from '@/lib/format'

/** How many rungs of the evidence ladder there are (one per tier). */
export const EVIDENCE_RUNGS = EVIDENCE_ORDER.length

/**
 * Where a tier sits on the ladder, 1 (anecdotal) to 7 (approved), for the little meter on the
 * entry page. Reads off the catalogue's own order, so a new tier lands where it belongs.
 */
export function evidenceLevel(tier: EvidenceTier): number {
  return EVIDENCE_RUNGS - EVIDENCE_ORDER.indexOf(tier)
}

/** Smallest and largest dose, in mg, across the steps of the templates (pauses do not count). */
export function templateDoseRange(
  templates: readonly Pick<ProtocolTemplate, 'steps'>[],
): { min: number; max: number } | null {
  const doses = templates.flatMap((t) =>
    t.steps.filter((s) => !s.pause && s.doseMg > 0).map((s) => s.doseMg),
  )
  if (doses.length === 0) return null
  return { min: Math.min(...doses), max: Math.max(...doses) }
}

/** "0,25–2,4 mg": one unit for the pair, the way a label would print it. */
export function fmtDoseRange(
  range: { min: number; max: number },
  unit: DoseUnit,
  locale: Locale,
): string {
  if (range.min === range.max) return fmtDose(range.max, unit, locale)
  return `${fmtDoseValue(range.min, unit, locale)}–${fmtDose(range.max, unit, locale)}`
}
