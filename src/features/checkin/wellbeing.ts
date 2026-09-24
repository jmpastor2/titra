import type { MeasurementKind } from '@/data/database.types'

/** Wellbeing dimensions, 0–10, that peptide users most often want to correlate with dosing. */
export const WELLBEING: readonly MeasurementKind[] = [
  'energy',
  'sleep_quality',
  'mood',
  'recovery',
  'focus',
  'appetite',
  'libido',
]
