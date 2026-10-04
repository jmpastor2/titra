/**
 * Common vials to add in one tap. The first compound is the vial's primary (its mg is
 * total_mg); the rest go to `components`. Amounts are the usual label contents; the form
 * says so and every one of them can be edited when the vial in hand is different.
 */
export interface BlendPreset {
  id: string
  name: string
  parts: { compoundId: string; mg: number }[]
  /**
   * Other contents (mg) the same single-substance vial is commonly sold in, offered as a
   * choice next to the preset's own. Not for blends, whose ratio is fixed by the vendor.
   */
  sizes?: readonly number[]
}

export const BLEND_PRESETS: readonly BlendPreset[] = [
  {
    id: 'cjc-ipa-10',
    name: 'CJC-1295 (sin DAC) + Ipamorelina 10 mg',
    parts: [
      { compoundId: 'mod-grf-1-29', mg: 5 },
      { compoundId: 'ipamorelin', mg: 5 },
    ],
  },
  {
    id: 'klow-80',
    name: 'KLOW 80 mg',
    parts: [
      { compoundId: 'ghk-cu', mg: 50 },
      { compoundId: 'bpc-157', mg: 10 },
      { compoundId: 'tb-500', mg: 10 },
      { compoundId: 'kpv', mg: 10 },
    ],
  },
  {
    id: 'glow-70',
    name: 'GLOW 70 mg',
    parts: [
      { compoundId: 'ghk-cu', mg: 50 },
      { compoundId: 'bpc-157', mg: 10 },
      { compoundId: 'tb-500', mg: 10 },
    ],
  },
  {
    id: 'bpc-tb-10',
    name: 'BPC-157 + TB-500 10 mg',
    parts: [
      { compoundId: 'bpc-157', mg: 5 },
      { compoundId: 'tb-500', mg: 5 },
    ],
  },
  {
    id: 'nad-plus-500',
    name: 'NAD+ 500 mg',
    parts: [{ compoundId: 'nad-plus', mg: 500 }],
    sizes: [100, 500, 1000],
  },
]
