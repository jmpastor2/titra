/**
 * Paths of the trend charts: the smooth line through a series of readings and the band
 * between two lines. Pure; numbers are written to a tenth of a pixel like the other charts.
 */
import { fx, linePath, type Pt } from './chartLayout'

const sign = (v: number) => (v < 0 ? -1 : 1)

/**
 * The slope (dy/dx) the curve has at each point: a monotone cubic after Steffen (1990), the
 * curve d3 calls monotoneX. Between two readings the line never rises above the higher one
 * nor falls below the lower one, so it cannot draw a peak that was never measured.
 */
export function monotoneTangents(pts: readonly Pt[]): number[] {
  const dx: number[] = []
  const slope: number[] = []
  pts.forEach((p, i) => {
    const q = pts[i + 1]
    if (!q) return
    const h = q[0] - p[0]
    dx.push(h)
    // Two readings on the same pixel column have no slope to speak of.
    slope.push(h === 0 ? 0 : (q[1] - p[1]) / h)
  })
  const n = pts.length
  const tan = Array.from({ length: n }, () => 0)
  for (let i = 1; i < n - 1; i++) {
    const h0 = dx[i - 1] ?? 0
    const h1 = dx[i] ?? 0
    const s0 = slope[i - 1] ?? 0
    const s1 = slope[i] ?? 0
    const p = h0 + h1 === 0 ? 0 : (s0 * h1 + s1 * h0) / (h0 + h1)
    // Zero at a turning point, else the gentler of the two sides (and of half the parabola's).
    tan[i] = (sign(s0) + sign(s1)) * Math.min(Math.abs(s0), Math.abs(s1), 0.5 * Math.abs(p)) || 0
  }
  if (n >= 3) {
    tan[0] = (3 * (slope[0] ?? 0) - (tan[1] ?? 0)) / 2
    tan[n - 1] = (3 * (slope[n - 2] ?? 0) - (tan[n - 2] ?? 0)) / 2
  }
  return tan
}

/**
 * A smooth line through the points, as cubic Béziers. Two points make a straight line and
 * one or none make no line. The points come in order of x.
 */
export function monotonePath(pts: readonly Pt[]): string {
  if (pts.length < 3) return linePath(pts)
  const tan = monotoneTangents(pts)
  const parts: string[] = []
  pts.forEach((p, i) => {
    if (i === 0) parts.push(`M${fx(p[0])} ${fx(p[1])}`)
    const q = pts[i + 1]
    if (!q) return
    const h = (q[0] - p[0]) / 3
    const t0 = tan[i] ?? 0
    const t1 = tan[i + 1] ?? 0
    parts.push(
      `C${fx(p[0] + h)} ${fx(p[1] + h * t0)} ${fx(q[0] - h)} ${fx(q[1] - h * t1)} ${fx(q[0])} ${fx(q[1])}`,
    )
  })
  return parts.join(' ')
}

/** The area between two lines that run over the same x range, for a shaded band. */
export function bandPath(top: readonly Pt[], bottom: readonly Pt[]): string {
  if (top.length === 0 || bottom.length === 0) return ''
  const back = bottom.toReversed().map(([x, y]) => `L${fx(x)} ${fx(y)}`)
  return `${linePath(top)} ${back.join(' ')} Z`
}
