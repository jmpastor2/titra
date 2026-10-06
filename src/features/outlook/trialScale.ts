/**
 * The scale at the top of "Futuro": one axis of % change in body weight, from no change (or the
 * gain the person has, if any) to a loss of at least 20 %, with the band the trial observed for
 * his dose, placebo, where he is today and, when it can be drawn, where his own trend would take
 * him by the horizon. Pure: positions are fractions of the width, 0 at the left.
 */

export interface ScaleInput {
  /** The trial band at the horizon: `lowerPct` the smaller loss, `upperPct` the larger. */
  band: { lowerPct: number; upperPct: number } | null
  placeboPct?: number | null
  /** The person's change since the start, in %. */
  youPct?: number | null
  /** His trend drawn forward to the horizon, in %. */
  projectionPct?: number | null
}

export interface TrialScale {
  /** Left end of the axis in %: 0, or the whole 5 above a gain. */
  from: number
  /** Right end in %: a whole 5, −20 or further. */
  to: number
  ticks: number[]
  /** [left, right] of the band, as fractions of the width. */
  band: [number, number] | null
  placebo: number | null
  you: number | null
  projection: number | null
}

/** The axis never shows less than this much loss, so a small band does not fill the bar. */
export const SCALE_MIN_LOSS = 20

const finite = (v: number | null | undefined): v is number =>
  typeof v === 'number' && Number.isFinite(v)

export function trialScale(input: ScaleInput): TrialScale {
  const { band } = input
  const values = [
    band?.lowerPct,
    band?.upperPct,
    input.placeboPct,
    input.youPct,
    input.projectionPct,
  ].filter(finite)
  const top = Math.max(0, ...values)
  const bottom = Math.min(0, ...values)
  const from = top > 0 ? Math.ceil(top / 5) * 5 : 0
  // Half a point of air past the furthest mark, so it never sits on the end of the bar.
  const to = Math.min(-SCALE_MIN_LOSS, Math.floor((bottom - 0.5) / 5) * 5)
  const step = from - to > 30 ? 10 : 5
  const ticks: number[] = []
  for (let v = from; v >= to; v -= step) ticks.push(v)
  if (ticks.at(-1) !== to) ticks.push(to)

  const at = (pct: number | null | undefined) => (finite(pct) ? scalePos(from, to, pct) : null)
  const left = band ? scalePos(from, to, Math.max(band.lowerPct, band.upperPct)) : null
  const right = band ? scalePos(from, to, Math.min(band.lowerPct, band.upperPct)) : null
  return {
    from,
    to,
    ticks,
    band: left !== null && right !== null ? [left, right] : null,
    placebo: at(input.placeboPct),
    you: at(input.youPct),
    projection: at(input.projectionPct),
  }
}

/** Where a % change sits along the axis, 0 at `from` and 1 at `to`. */
export function scalePos(from: number, to: number, pct: number): number {
  if (!(from > to)) return 0
  return Math.min(1, Math.max(0, (from - pct) / (from - to)))
}

/**
 * How a label hangs from its mark: from the left edge near the start of the bar, from the right
 * edge near its end, centred elsewhere, so it is never cut by the card.
 */
export function labelAnchor(pos: number, margin = 0.16): 'start' | 'middle' | 'end' {
  if (pos < margin) return 'start'
  if (pos > 1 - margin) return 'end'
  return 'middle'
}
