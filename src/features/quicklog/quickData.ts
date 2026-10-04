/**
 * Everything the measurement-backed tiles show, derived in one pass from the panel's rows
 * and the profile. Pure; callers pass `now`. See quickData.test.ts.
 */
import type { MeasurementRow, ProfileRow } from '@/data/database.types'
import {
  checkInSummary,
  entriesOn,
  latestReading,
  recentValues,
  strengthWeek,
  type CheckInSummary,
  type LatestReading,
  type StrengthWeek,
} from './readings'
import { proteinTargetG } from './tiles'

/** Points of the weight sparkline. */
const SPARK_POINTS = 14

export interface DayCounter {
  /** Entries of today, newest first (the last one is what "Deshacer" takes back). */
  entries: MeasurementRow[]
  total: number
}

export interface QuickData {
  imperial: boolean
  /** Weight and waist in storage units (kg, cm). */
  weight: LatestReading | null
  weightSpark: number[]
  waist: LatestReading | null
  water: DayCounter
  protein: DayCounter & { target: number | null }
  strength: StrengthWeek
  checkIn: CheckInSummary
}

type Profile = Pick<ProfileRow, 'unit_system' | 'protein_g_per_kg' | 'goal_weight_kg'>

function counter(rows: readonly MeasurementRow[], kind: 'hydration_ml' | 'protein_g', now: Date) {
  const entries = entriesOn(rows, kind, now)
  return { entries, total: entries.reduce((sum, r) => sum + Number(r.value), 0) }
}

export function deriveQuickData(
  rows: readonly MeasurementRow[],
  profile: Profile | null,
  now: Date,
): QuickData {
  const weight = latestReading(rows, 'weight')
  return {
    imperial: profile?.unit_system === 'imperial',
    weight,
    weightSpark: recentValues(rows, 'weight', SPARK_POINTS),
    waist: latestReading(rows, 'waist'),
    water: counter(rows, 'hydration_ml', now),
    protein: {
      ...counter(rows, 'protein_g', now),
      target: proteinTargetG(
        weight?.value ?? null,
        profile?.goal_weight_kg ?? null,
        Number(profile?.protein_g_per_kg ?? 1.6),
      ),
    },
    strength: strengthWeek(rows, now),
    checkIn: checkInSummary(rows, now),
  }
}
