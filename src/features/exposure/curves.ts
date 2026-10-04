/**
 * Sampling helpers for the exposure curves. The engine samples on a regular grid, so the
 * last sample of a history curve is usually a few hours before "now"; the charts and the
 * level cards need the curve to end exactly where the readout is.
 */
import type { CurvePoint } from '@/domain/pk/engine'

/**
 * Grid step in hours for a curve over `spanDays`: fine enough to show absorption between
 * doses, coarse enough that a 12-week view stays a few hundred points.
 */
export function curveStepH(spanDays: number): number {
  if (spanDays <= 14) return 2
  if (spanDays <= 45) return 3
  if (spanDays <= 120) return 6
  return 12
}

/**
 * The curve closed with an exact sample at `now`, so the marker sits on the reading and
 * the projection that starts at `now` continues from it without a gap.
 */
export function curveToNow(
  points: readonly CurvePoint[],
  now: Date,
  mgAtNow: number,
): CurvePoint[] {
  const last = points.at(-1)
  if (last && last.at.getTime() >= now.getTime()) return [...points]
  return [...points, { at: now, mg: mgAtNow }]
}
