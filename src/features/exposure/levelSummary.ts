/**
 * Pure helpers behind the compact level card on Today: a tiny exposure sparkline for
 * long-acting compounds and a 14-day dose strip for everything else, the next-dose line
 * and whether the vial is running low.
 */
import { addDays, differenceInCalendarDays, startOfDay } from 'date-fns'
import type { InventoryRow } from '@/data/database.types'
import { plannedDoses, type NextDose } from '@/domain/dosing/schedule'
import type { CurvePoint } from '@/domain/pk/engine'
import type { DoseEvent, PkParams, ProtocolLike } from '@/domain/types'
import { effectiveExpiry } from '@/features/inventory/alerts'
import { remainingOf, vialRunway } from '@/features/inventory/vials'
import { buildTimeline } from './doseTimeline'
import type { CompoundExposure } from './useExposure'

/**
 * A curve sampled every few hours only means something when the compound lingers
 * between doses. Short-acting peptides (ipamorelin, t½ 2 h) are pulses, not a level.
 */
export function hasMeaningfulCurve(pk: PkParams | undefined): pk is PkParams {
  return Boolean(pk && pk.halfLifeH >= 24)
}

/** What a series is drawn as: a level curve, or one mark per administration. */
export type LevelKind = 'curve' | 'timeline'

/**
 * Long-acting compounds with a model get the curve. The rest (no human pharmacokinetics,
 * short-acting pulses, routes the model does not cover) get the dose timeline.
 */
export function levelKind(x: Pick<CompoundExposure, 'pk' | 'nowMg'>): LevelKind {
  return hasMeaningfulCurve(x.pk) && x.nowMg !== null ? 'curve' : 'timeline'
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

/**
 * Map history + projection curves into a fixed SVG box sharing one scale. The history
 * should end exactly at "now" (see `curveToNow`): its last point is the lit one.
 */
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

/* ------------------------------------------------------------------ 14-day strip */

export type DayState = 'taken' | 'late' | 'extra' | 'missed' | 'planned' | 'rest'

export interface DayCell {
  day: Date
  state: DayState
  isToday: boolean
}

/**
 * The last `days` days ending today, judged administration by administration like the week
 * card: taken (or late when off the hour), missed once its grace window is over, planned
 * while it is still to come today, extra when only an off-plan dose was logged, rest
 * otherwise. A night shot after midnight counts for the evening it belongs to.
 */
export function doseDays(
  history: readonly DoseEvent[],
  protocol: ProtocolLike | null,
  now: Date,
  days = 14,
): DayCell[] {
  const today = startOfDay(now)
  const from = addDays(today, -(days - 1))
  // Two days past today so tonight's after-midnight slot is on the model.
  const model = buildTimeline({ protocol, history, from, to: addDays(today, 2), now })
  const byDay = new Map<number, typeof model.items>()
  for (const item of model.items) {
    const key = item.day.getTime()
    byDay.set(key, [...(byDay.get(key) ?? []), item])
  }
  const out: DayCell[] = []
  for (let i = 0; i < days; i++) {
    const day = addDays(from, i)
    const items = byDay.get(day.getTime()) ?? []
    const slots = items.filter((it) => it.plannedAt !== null)
    let state: DayState = 'rest'
    if (items.length > 0) {
      if (slots.some((it) => it.state === 'missed')) state = 'missed'
      else if (slots.some((it) => it.state === 'due' || it.state === 'planned')) state = 'planned'
      else if (slots.some((it) => it.state === 'late' || it.state === 'early')) state = 'late'
      else if (slots.length > 0 || !protocol) state = 'taken'
      else state = 'extra'
    }
    out.push({ day, state, isToday: day.getTime() === today.getTime() })
  }
  return out
}

/* ------------------------------------------------------------------ next dose line */

export type NextLine =
  { kind: 'overdue'; hours: number } | { kind: 'due' } | { kind: 'in'; hours: number }

/** What the "next" line of a level card says; null when nothing is planned. */
export function nextLine(next: NextDose | null, now: Date): NextLine | null {
  if (!next) return null
  if (next.status === 'overdue') return { kind: 'overdue', hours: next.overdueH }
  if (next.status === 'due') return { kind: 'due' }
  return { kind: 'in', hours: (next.at.getTime() - now.getTime()) / 3_600_000 }
}

/* ------------------------------------------------------------------ vial */

/**
 * The next administrations of a series, soonest first: the one coming up (even if due now)
 * and the planned ones after it. A vial's runway is walked against them.
 */
export function upcomingDoses(
  x: Pick<CompoundExposure, 'protocolLike' | 'history' | 'next'>,
  now: Date,
  count = 3,
  horizonDays = 120,
): { at: Date; doseMg: number }[] {
  if (!x.protocolLike) return []
  const first = x.next ? { at: x.next.at, doseMg: x.next.doseMg } : null
  const from = first ? new Date(first.at.getTime() + 1) : now
  const later = plannedDoses(x.protocolLike, x.history, from, addDays(now, horizonDays)).map(
    (p) => ({ at: p.at, doseMg: p.doseMg }),
  )
  return [...(first ? [first] : []), ...later].filter((d) => d.doseMg > 0).slice(0, count)
}

/**
 * Whether the vial icon wears its warning tick: it covers two more administrations or
 * fewer, or it expires within a week before it would be used up (the inventory page's
 * "low"), or, with no plan to walk, it is a fifth full or less.
 */
export function vialIsLow(
  vial: InventoryRow,
  compoundId: string,
  upcoming: readonly { at: Date; doseMg: number }[],
  now: Date,
): boolean {
  const total = Number(vial.total_mg)
  if (upcoming.length === 0) return total > 0 && Number(vial.remaining_mg) / total <= 0.2
  const runway = vialRunway(remainingOf(vial, compoundId), upcoming)
  if (runway.runsOutAt !== null && runway.doses <= 2) return true
  const expiry = effectiveExpiry(vial)
  if (!expiry) return false
  const expiresFirst = !runway.runsOutAt || expiry.date < runway.runsOutAt
  return expiresFirst && differenceInCalendarDays(expiry.date, now) <= 7
}
