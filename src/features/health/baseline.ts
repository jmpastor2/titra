/**
 * Wellbeing baseline: the first check-in is the "before" picture, and every later one is
 * read against it, dimension by dimension. Pure.
 */
import type { MeasurementKind } from '@/data/database.types'
import type { TimePoint } from './progress'
import { dailyMeans } from './trend'

export interface DimensionBaseline {
  kind: MeasurementKind
  baseline: number
  baselineAt: Date
  latest: number
  latestAt: Date
  /** latest − baseline, or null while there is only one check-in day. */
  delta: number | null
}

/** Baseline and latest day per dimension, in the order of `kinds`; absent ones are skipped. */
export function wellbeingBaseline(
  series: ReadonlyMap<MeasurementKind, readonly TimePoint[]>,
  kinds: readonly MeasurementKind[],
): DimensionBaseline[] {
  return kinds.flatMap((kind): DimensionBaseline[] => {
    const days = dailyMeans(series.get(kind) ?? [])
    const first = days[0]
    const last = days[days.length - 1]
    if (!first || !last) return []
    return [
      {
        kind,
        baseline: first.value,
        baselineAt: first.at,
        latest: last.value,
        latestAt: last.at,
        delta: days.length > 1 ? last.value - first.value : null,
      },
    ]
  })
}

/** Mean score of a set of dimensions, or null when empty. */
export function meanScore(values: readonly number[]): number | null {
  return values.length ? values.reduce((s, v) => s + v, 0) / values.length : null
}
