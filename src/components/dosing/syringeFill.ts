/**
 * Pure timing for the syringe "drawing up" animation. A single number (the plunger
 * mark, in units) is tweened; every band, the stopper and the rod derive from it.
 * Crossing a load boundary starts a new ease-out segment, so two vials drawn into one
 * syringe fill one after the other.
 */

export interface FillSpan {
  from: number
  to: number
}

export interface FillSegment extends FillSpan {
  /** Offset from the start of the tween, ms. */
  start: number
  duration: number
}

export interface FillTimeline {
  from: number
  to: number
  segments: FillSegment[]
  duration: number
}

export const MS_PER_LOAD = 450
/** A sliver of a load (topping up 9.5 to 10 U) still gets a readable share of time. */
const MIN_SHARE = 0.35

const clamp01 = (t: number) => (t <= 0 ? 0 : t >= 1 ? 1 : t)

export function easeOutCubic(t: number): number {
  return 1 - (1 - clamp01(t)) ** 3
}

/** Stable string for the loads' geometry, so an effect can depend on it by value. */
export function spansKey(spans: readonly FillSpan[]): string {
  return spans.map((s) => `${s.from}:${s.to}`).join('|')
}

export function parseSpans(key: string): FillSpan[] {
  if (!key) return []
  return key.split('|').map((part) => {
    const [a = '0', b = '0'] = part.split(':')
    return { from: Number(a), to: Number(b) }
  })
}

/**
 * Segments from `from` to `to`, cut at every load boundary in between, in the order
 * the plunger passes them. Each whole load takes `msPerLoad`; a partial load takes its
 * share of it (never less than MIN_SHARE).
 */
export function fillTimeline(
  from: number,
  to: number,
  spans: readonly FillSpan[],
  msPerLoad = MS_PER_LOAD,
): FillTimeline {
  if (!Number.isFinite(from) || !Number.isFinite(to) || from === to) {
    return { from: to, to, segments: [], duration: 0 }
  }
  const up = to > from
  const lo = Math.min(from, to)
  const hi = Math.max(from, to)
  const cuts = [...new Set(spans.flatMap((s) => [s.from, s.to]))]
    .filter((b) => b > lo && b < hi)
    .toSorted((a, b) => (up ? a - b : b - a))
  const points = [from, ...cuts, to]

  const segments: FillSegment[] = []
  let start = 0
  points.slice(1).forEach((b, i) => {
    const a = points[i] ?? from
    const mid = (a + b) / 2
    const load = spans.find((s) => mid >= s.from && mid <= s.to && s.to > s.from)
    const share = load ? Math.abs(b - a) / (load.to - load.from) : 1
    const duration = msPerLoad * Math.min(1, Math.max(MIN_SHARE, share))
    segments.push({ from: a, to: b, start, duration })
    start += duration
  })
  return { from, to, segments, duration: start }
}

/** Plunger mark `elapsed` ms into the tween. */
export function unitsAt(timeline: FillTimeline, elapsed: number): number {
  if (elapsed >= timeline.duration) return timeline.to
  if (elapsed <= 0) return timeline.from
  const seg = timeline.segments.find((s) => elapsed < s.start + s.duration)
  if (!seg) return timeline.to
  const k = easeOutCubic((elapsed - seg.start) / seg.duration)
  return seg.from + (seg.to - seg.from) * k
}

/**
 * Where a load's band ends for the current plunger mark. The last band follows the
 * stopper past its own end, so shrinking a dose pushes liquid out instead of leaving
 * an empty gap in front of the stopper.
 */
export function bandEnd(span: FillSpan, units: number, isLast: boolean): number {
  if (isLast) return Math.max(span.from, units)
  return Math.min(span.to, Math.max(span.from, units))
}

export function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}
