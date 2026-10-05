/** The geometry of the tiles' sparklines. Pure; see sparkline.test.ts. */

/** Height of the sparkline's own coordinate space; the SVG stretches it to the tile. */
export const SPARK_H = 100
const SPARK_PAD = 3

/**
 * Where each value sits on a sparkline (0 = top, 100 = bottom). The line is zoomed to its
 * own range, but never past `minSpan`: a half-kilo wobble must not be drawn as a cliff.
 * A short range is centred in the span rather than pinned to the bottom.
 */
export function sparkY(values: readonly number[], minSpan = 0): number[] {
  if (values.length === 0) return []
  const lo = Math.min(...values)
  const hi = Math.max(...values)
  const span = Math.max(hi - lo, minSpan) || 1
  const floor = (lo + hi) / 2 - span / 2
  return values.map((v) => SPARK_PAD + (1 - (v - floor) / span) * (SPARK_H - 2 * SPARK_PAD))
}
