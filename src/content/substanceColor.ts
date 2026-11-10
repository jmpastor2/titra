import type { CompoundCategory } from '@/domain/types'
import { compoundById } from './compounds'

/**
 * Substance identity colour. Colour follows the family, never the list position,
 * and is always shown next to the substance name (validated palette, DESIGN.md).
 */
const CATEGORY_HUE: Record<CompoundCategory, string> = {
  incretin: 'var(--sub-mint)',
  gh_axis: 'var(--sub-violet)',
  hormonal: 'var(--sub-orange)',
  immune: 'var(--sub-orange)',
  metabolic: 'var(--sub-sky)',
  insulin: 'var(--sub-sky)',
  repair: 'var(--sub-amber)',
  sexual: 'var(--sub-pink)',
  cognitive: 'var(--sub-lime)',
  longevity: 'var(--sub-lime)',
  other: 'var(--sub-gray)',
}

export function categoryColor(category: CompoundCategory | undefined): string {
  return category ? CATEGORY_HUE[category] : 'var(--sub-gray)'
}

/**
 * The exception to "colour follows the family": two substances of one family that are taken on
 * the same days would be told apart by nothing on the day track or in a shared syringe.
 */
const OWN_HUE: Record<string, string> = {
  // With MOTS-c (metabolic, sky): both mitochondrial peptides, usually run together.
  elamipretide: 'var(--sub-pink)',
}

export function compoundColor(compoundId: string): string {
  return OWN_HUE[compoundId] ?? categoryColor(compoundById(compoundId)?.category)
}
