/**
 * Geometry shared by the hand-drawn SVG charts (PkChart, DoseTimelineChart): scales,
 * paths, label placement and nearest-point lookup. Pure and locale-free; the components
 * format the text. Everything is in CSS px of the chart's own box.
 */

/** Space reserved around the plot, in px. */
export interface Inset {
  left: number
  right: number
  top: number
  bottom: number
}

export interface PlotBox {
  x0: number
  x1: number
  /** Top edge of the plot. */
  y0: number
  /** The baseline (value zero). */
  y1: number
  width: number
  height: number
}

export function plotBox(width: number, height: number, inset: Inset): PlotBox {
  const x0 = inset.left
  const x1 = Math.max(x0 + 1, width - inset.right)
  const y0 = inset.top
  const y1 = Math.max(y0 + 1, height - inset.bottom)
  return { x0, x1, y0, y1, width: x1 - x0, height: y1 - y0 }
}

/** Linear map from the domain [d0, d1] to the range [r0, r1]; a flat domain maps to r0. */
export function scaleLinear(d0: number, d1: number, r0: number, r1: number): (v: number) => number {
  const span = d1 - d0
  return (v) => (span === 0 ? r0 : r0 + ((v - d0) / span) * (r1 - r0))
}

/** One decimal is plenty for screen px and keeps the path strings short. */
export function fx(v: number): number {
  return Math.round(v * 10) / 10
}

export type Pt = readonly [number, number]

export function linePath(points: readonly Pt[]): string {
  return points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${fx(x)} ${fx(y)}`).join(' ')
}

/** The line closed down to the baseline, for the soft fill under a curve. */
export function areaPath(points: readonly Pt[], baselineY: number): string {
  const first = points[0]
  const last = points.at(-1)
  if (!first || !last) return ''
  return `${linePath(points)} L${fx(last[0])} ${fx(baselineY)} L${fx(first[0])} ${fx(baselineY)} Z`
}

export interface LabelSpec {
  key: string
  /** Where the label wants to be centred. */
  x: number
  width: number
  /** The higher, the sooner it keeps its place when labels collide. */
  priority: number
}

export interface PlacedLabel {
  key: string
  /** Left edge, kept inside the bounds. */
  left: number
  /** 0 = the lane nearest the plot. */
  lane: number
}

/**
 * Puts labels in a few stacked lanes so none overlaps another and none leaves the chart.
 * Whatever does not fit in any lane is dropped (its guide line still marks the spot).
 */
export function placeLabels(
  labels: readonly LabelSpec[],
  [min, max]: readonly [number, number],
  lanes = 2,
  gap = 4,
): PlacedLabel[] {
  const used: { left: number; right: number }[][] = Array.from({ length: lanes }, () => [])
  const out: PlacedLabel[] = []
  for (const l of labels.toSorted((a, b) => b.priority - a.priority || a.x - b.x)) {
    const left = Math.min(Math.max(l.x - l.width / 2, min), Math.max(min, max - l.width))
    const right = left + l.width
    const lane = used.findIndex((spans) =>
      spans.every((s) => right + gap <= s.left || left - gap >= s.right),
    )
    if (lane < 0) continue
    used[lane]?.push({ left, right })
    out.push({ key: l.key, left, lane })
  }
  return out
}

/**
 * Nudges marks that sit on top of each other just far enough apart to be told apart, never
 * more than `maxShift` from where they belong. Positions come in time order and keep it.
 */
export function dodge(xs: readonly number[], minGap: number, maxShift = minGap / 2): number[] {
  const out = [...xs]
  for (let pass = 0; pass < 4; pass++) {
    let moved = false
    for (let i = 1; i < out.length; i++) {
      const prev = out[i - 1] ?? 0
      const here = out[i] ?? 0
      const gap = here - prev
      if (gap >= minGap) continue
      const push = (minGap - gap) / 2
      const a = Math.max((xs[i - 1] ?? 0) - maxShift, prev - push)
      const b = Math.min((xs[i] ?? 0) + maxShift, here + push)
      if (a !== prev || b !== here) moved = true
      out[i - 1] = a
      out[i] = b
    }
    if (!moved) break
  }
  return out
}

/** Rough text width in px for layout decisions only (the text itself is never measured). */
export function estimateTextWidth(text: string, fontSize = 10, pad = 8): number {
  return Math.ceil(text.length * fontSize * 0.58 + pad)
}

/** Index of the value in `sorted` nearest to `x`; -1 when empty. */
export function nearestIndex(sorted: readonly number[], x: number): number {
  if (sorted.length === 0) return -1
  let lo = 0
  let hi = sorted.length - 1
  while (lo < hi) {
    const mid = (lo + hi) >> 1
    if ((sorted[mid] ?? 0) < x) lo = mid + 1
    else hi = mid
  }
  const prev = sorted[lo - 1]
  const here = sorted[lo] ?? 0
  return prev !== undefined && x - prev < here - x ? lo - 1 : lo
}
