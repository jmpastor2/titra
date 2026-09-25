/**
 * Pure helpers behind the compact level card on Today: a tiny exposure sparkline for
 * long-acting compounds and a 14-day dose strip for everything else.
 */
import { addDays, startOfDay } from 'date-fns'
import { scheduledDoses } from '@/domain/dosing/schedule'
import type { CurvePoint } from '@/domain/pk/engine'
import type { DoseEvent, PkParams, ProtocolLike } from '@/domain/types'

/**
 * A curve sampled every few hours only means something when the compound lingers
 * between doses. Short-acting peptides (ipamorelin, t½ 2 h) are pulses, not a level.
 */
export function hasMeaningfulCurve(pk: PkParams | undefined): pk is PkParams {
  return Boolean(pk && pk.halfLifeH >= 24)
}

export interface SparkBox {
  width: number
  height: number
  /** Inner padding so the glowing end point and stroke are never clipped. */
  pad: number
}

export interface Spark {
  /** SVG path for the history part (solid). */
  history: string
  /** SVG path for the projection part (dashed), starting at the seam. */
  projection: string
  /** The "now" point. */
  now: { x: number; y: number } | null
  /** Dose ticks along the baseline. */
  doses: number[]
  baselineY: number
}

/** Map history + projection curves into a fixed SVG box sharing one scale. */
export function sparkline(
  history: readonly CurvePoint[],
  projection: readonly CurvePoint[],
  doses: readonly DoseEvent[],
  from: Date,
  to: Date,
  box: SparkBox,
): Spark {
  const t0 = from.getTime()
  const span = Math.max(1, to.getTime() - t0)
  let max = 0
  for (const p of history) max = Math.max(max, p.mg)
  for (const p of projection) max = Math.max(max, p.mg)
  const innerW = box.width - box.pad * 2
  const innerH = box.height - box.pad * 2
  const x = (ms: number) => box.pad + ((ms - t0) / span) * innerW
  const y = (mg: number) => box.pad + innerH - (max > 0 ? (mg / max) * innerH : 0)
  const path = (pts: readonly CurvePoint[]) =>
    pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${fx(x(p.at.getTime()))} ${fx(y(p.mg))}`).join(' ')
  const last = history[history.length - 1]
  const proj = last && projection.length ? [last, ...projection.filter((p) => p.at > last.at)] : []
  return {
    history: path(history),
    projection: path(proj),
    now: last ? { x: fx(x(last.at.getTime())), y: fx(y(last.mg)) } : null,
    doses: doses
      .map((d) => d.at.getTime())
      .filter((ms) => ms >= t0 && ms <= to.getTime())
      .map((ms) => fx(x(ms))),
    baselineY: fx(box.pad + innerH),
  }
}

function fx(v: number): number {
  return Math.round(v * 10) / 10
}

function dayKey(d: Date): number {
  return startOfDay(d).getTime()
}

export type DayState = 'taken' | 'missed' | 'planned' | 'rest'

export interface DayCell {
  day: Date
  state: DayState
  isToday: boolean
}

/**
 * The last `days` days ending today: taken when any dose was logged that day, missed
 * when the protocol planned one and nothing was logged (today stays "planned" until it
 * ends), rest otherwise.
 */
export function doseDays(
  history: readonly DoseEvent[],
  protocol: ProtocolLike | null,
  now: Date,
  days = 14,
): DayCell[] {
  const today = startOfDay(now)
  const from = addDays(today, -(days - 1))
  const end = addDays(today, 1)
  const taken = new Set(history.filter((d) => d.at >= from && d.at < end).map((d) => dayKey(d.at)))
  const planned = new Set(
    protocol ? scheduledDoses(protocol, from, end).map((p) => dayKey(p.at)) : [],
  )
  const out: DayCell[] = []
  for (let i = 0; i < days; i++) {
    const day = addDays(from, i)
    const k = day.getTime()
    const isToday = k === today.getTime()
    const state: DayState = taken.has(k)
      ? 'taken'
      : planned.has(k)
        ? isToday
          ? 'planned'
          : 'missed'
        : 'rest'
    out.push({ day, state, isToday })
  }
  return out
}
