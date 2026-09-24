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

export function compoundColor(compoundId: string): string {
  return categoryColor(compoundById(compoundId)?.category)
}
