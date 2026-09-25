/**
 * Common premixed vials. The first compound is the vial's primary (its mg is total_mg);
 * the rest go to `components`. Amounts are the usual label contents; edit if yours differ.
 */
export interface BlendPreset {
  id: string
  name: string
  parts: { compoundId: string; mg: number }[]
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
]
