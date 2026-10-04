/**
 * The data side of the exposure chart: the curves merged into one row per instant, the
 * unit they read in and the steady-state bands clipped to what is on screen. Pure; see
 * pkModel.test.ts.
 */
import type { CurvePoint } from '@/domain/pk/engine'
import type { DoseUnit } from '@/domain/types'
import { amountScale, niceYAxis, tickDecimals, unitScale } from './chartScale'

/** One instant of the chart: the level so far (hist), the projection (proj), a scenario (alt). */
export interface PkRow {
  t: number
  hist?: number
  proj?: number
  alt?: number
}

/** The steady-state range of one dosing step: trough to peak, over the time the step lasts. */
export interface SsBand {
  from: Date
  to: Date
  troughMg: number
  peakMg: number
  /** The step in force now: its range sets the scale and is drawn a little stronger. */
  current?: boolean
}

export interface PkModelInput {
  history: readonly CurvePoint[]
  projection: readonly CurvePoint[]
  alt?: readonly CurvePoint[]
  bands?: readonly SsBand[]
  /** The unit the person doses in. Left out, tiny amounts switch to mcg on their own. */
  unit?: DoseUnit
}

export interface PkModel {
  rows: PkRow[]
  /** Row times, ascending, for nearest-point lookups. */
  times: number[]
  domain: [number, number]
  /** Engine mg → the chart's unit. */
  factor: number
  unit: string
  yMax: number
  yTicks: number[]
  decimals: number
}

/** Merge curves into rows by instant; the projection is continuous with the history at "now". */
export function mergeCurves(
  history: readonly CurvePoint[],
  projection: readonly CurvePoint[],
  alt: readonly CurvePoint[] = [],
): PkRow[] {
  const map = new Map<number, PkRow>()
  const put = (p: CurvePoint, key: 'hist' | 'proj' | 'alt') => {
    const t = p.at.getTime()
    const row = map.get(t) ?? { t }
    row[key] = p.mg
    map.set(t, row)
  }
  for (const p of history) put(p, 'hist')
  for (const p of projection) put(p, 'proj')
  for (const p of alt) put(p, 'alt')
  // A scenario starts from where the history ends.
  const last = history.at(-1)
  const seam = last ? map.get(last.at.getTime()) : undefined
  if (last && seam) {
    if (projection.length) seam.proj ??= last.mg
    if (alt.length) seam.alt ??= last.mg
  }
  return [...map.values()].toSorted((a, b) => a.t - b.t)
}

export function buildPkModel(input: PkModelInput): PkModel {
  const rows = mergeCurves(input.history, input.projection, input.alt)
  const domain: [number, number] = [rows[0]?.t ?? 0, rows.at(-1)?.t ?? 1]
  let rawMax = 0
  for (const r of rows) rawMax = Math.max(rawMax, r.hist ?? 0, r.proj ?? 0, r.alt ?? 0)
  // The step in force counts for the scale; later, higher steps may run off the top.
  for (const b of input.bands ?? []) if (b.current) rawMax = Math.max(rawMax, b.peakMg)
  const scale = input.unit
    ? unitScale(input.unit)
    : (() => {
        const a = amountScale(rawMax)
        return { factor: a.factor, label: a.unit }
      })()
  const y = niceYAxis(rawMax * scale.factor)
  return {
    rows,
    times: rows.map((r) => r.t),
    domain,
    factor: scale.factor,
    unit: scale.label,
    yMax: y.max,
    yTicks: y.ticks,
    decimals: tickDecimals(y.ticks),
  }
}
