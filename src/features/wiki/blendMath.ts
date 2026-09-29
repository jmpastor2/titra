import type { BlendComponent } from '@/content/schema'

/** U-100 insulin syringe: 100 units per mL. */
export const UNITS_PER_ML = 100

export interface BlendShare {
  compoundId: string
  /** Concentration of this component after reconstitution, mg/mL. */
  mgPerMl: number
  /** Amount of this component in the drawn volume, mg. */
  mg: number
}

/**
 * What a draw from a reconstituted blend vial contains: every component goes in at the
 * same volume, so each one's amount is its label mg ÷ diluent mL × drawn mL.
 * Example: 5 + 5 mg in 3 mL, 6 U → 0.1 mg of each.
 */
export function blendShares(
  components: readonly BlendComponent[],
  diluentMl: number,
  units: number,
): BlendShare[] {
  if (!(diluentMl > 0) || !(units >= 0)) return components.map((c) => ({ ...c, mgPerMl: 0, mg: 0 }))
  const ml = units / UNITS_PER_ML
  return components.map((c) => {
    const mgPerMl = c.mg / diluentMl
    return { compoundId: c.compoundId, mgPerMl, mg: mgPerMl * ml }
  })
}
