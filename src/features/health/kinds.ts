import type { MeasurementKind } from '@/data/database.types'

/** Canonical (metric) storage unit per measurement kind. */
export const KIND_UNIT: Record<MeasurementKind, string> = {
  weight: 'kg',
  waist: 'cm',
  body_fat_pct: '%',
  lean_mass: 'kg',
  bp_systolic: 'mmHg',
  bp_diastolic: 'mmHg',
  heart_rate: 'bpm',
  glucose_fasting: 'mg/dL',
  glucose_random: 'mg/dL',
  hba1c: '%',
  steps: 'steps',
  protein_g: 'g',
  resistance_session: 'session',
  sleep_hours: 'h',
  energy: 'score',
  sleep_quality: 'score',
  mood: 'score',
  recovery: 'score',
  libido: 'score',
  appetite: 'score',
  focus: 'score',
}

/** Fraction digits used when displaying each kind. */
export const KIND_DIGITS: Record<MeasurementKind, number> = {
  weight: 1,
  waist: 1,
  body_fat_pct: 1,
  lean_mass: 1,
  bp_systolic: 0,
  bp_diastolic: 0,
  heart_rate: 0,
  glucose_fasting: 0,
  glucose_random: 0,
  hba1c: 1,
  steps: 0,
  protein_g: 0,
  resistance_session: 0,
  sleep_hours: 1,
  energy: 0,
  sleep_quality: 0,
  mood: 0,
  recovery: 0,
  libido: 0,
  appetite: 0,
  focus: 0,
}

/** Kinds offered in the "log measurement" picker (diastolic is captured with systolic). */
export const LOGGABLE_KINDS: readonly MeasurementKind[] = [
  'weight',
  'waist',
  'body_fat_pct',
  'lean_mass',
  'bp_systolic',
  'heart_rate',
  'glucose_fasting',
  'glucose_random',
  'hba1c',
  'protein_g',
  'resistance_session',
  'sleep_hours',
  'steps',
]

const LB_PER_KG = 1 / 0.45359237
const IN_PER_CM = 1 / 2.54

/** Unit shown to the user for a kind given their unit system. */
export function displayUnit(kind: MeasurementKind, imperial: boolean): string {
  if (kind === 'weight' || kind === 'lean_mass') return imperial ? 'lb' : 'kg'
  if (kind === 'waist') return imperial ? 'in' : 'cm'
  if (kind === 'resistance_session') return 'min'
  return KIND_UNIT[kind]
}

/** Convert a user-entered value into the canonical metric unit for storage. */
export function toCanonical(kind: MeasurementKind, value: number, imperial: boolean): number {
  if (!imperial) return value
  if (kind === 'weight' || kind === 'lean_mass') return value / LB_PER_KG
  if (kind === 'waist') return value / IN_PER_CM
  return value
}
