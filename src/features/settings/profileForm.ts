/**
 * The numbers of the profile form, read as the person types them: a goal weight in the unit
 * they use (kg or lb, with a comma or a point) and the protein per kilo. Pure; see
 * profileForm.test.ts.
 */
import { fromCanonical } from '@/features/health/kinds'
import { inRange, parseNumber, stepSpec, toStored } from '@/features/quicklog/stepper'
import { fmtNumber, type Locale } from '@/lib/format'

/** The goal weight, stored in kg, as it reads in the form: "72" or "158,7". */
export function goalText(goalKg: number | null, imperial: boolean, locale: Locale): string {
  return goalKg === null ? '' : fmtNumber(fromCanonical('weight', goalKg, imperial), locale, 1)
}

/** Empty clears the goal; a typo (letters, 7 kg, 700 kg) is refused instead of saved. */
export function parseGoal(
  text: string,
  imperial: boolean,
): { ok: true; kg: number | null } | { ok: false } {
  if (text.trim() === '') return { ok: true, kg: null }
  const value = parseNumber(text, 1)
  if (value === null || !inRange(stepSpec('weight', imperial), value)) return { ok: false }
  return { ok: true, kg: toStored('weight', value, imperial) }
}

/** g of protein per kg of body weight: anything from a typo guard's idea of plausible. */
export const PROTEIN_RANGE = { min: 0.1, max: 5 } as const

export function parseProtein(text: string): number | null {
  const value = parseNumber(text, 1)
  return value !== null && value >= PROTEIN_RANGE.min && value <= PROTEIN_RANGE.max ? value : null
}
