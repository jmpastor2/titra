/**
 * The tier of every tile from the data behind it: the glue between the readings and
 * tiles.ts. Pure; see ranks.test.ts.
 */
import type { DoseGlance } from './doseGlance'
import type { QuickData } from './quickData'
import { daysAgo } from './readings'
import {
  tierCheckIn,
  tierCount,
  tierDose,
  tierFasting,
  tierGirth,
  tierStrength,
  tierWeight,
  type TileRank,
} from './tiles'

export function buildRanks(input: {
  data: QuickData
  glance: DoseGlance
  /** Daily water goal in ml. */
  goalMl: number
  now: Date
}): TileRank[] {
  const { data, glance, goalMl, now } = input
  const ageOf = (reading: { at: Date } | null) => (reading ? daysAgo(reading.at, now) : null)
  const ranks: TileRank[] = [
    { id: 'dose', tier: tierDose(glance.status, glance.hoursAhead) },
    { id: 'water', tier: tierCount(data.water.total, goalMl) },
    { id: 'weight', tier: tierWeight(ageOf(data.weight)) },
    { id: 'checkin', tier: tierCheckIn(data.checkIn.doneToday, data.checkIn.ageDays) },
    { id: 'symptom', tier: 1 },
    { id: 'protein', tier: tierCount(data.protein.total, data.protein.target) },
    { id: 'strength', tier: tierStrength(data.strength.count) },
    { id: 'waist', tier: tierGirth(ageOf(data.waist)) },
  ]
  const fasting = tierFasting({
    available: glance.fastingAvailable,
    near: glance.fastFor !== null,
  })
  if (fasting !== null) ranks.push({ id: 'fasting', tier: fasting })
  return ranks
}
