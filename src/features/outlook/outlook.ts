/**
 * Outlook maths: weeks on treatment, the trial reference band for a horizon given the
 * protocol's dose steps, and the user's own weight trend with a linear extrapolation.
 *
 * Nothing here predicts anything for the user. The band is what a trial observed in the
 * arms that bracket his dose; the trend is his own data drawn forward, flagged as such.
 * Pure and formatting-agnostic; callers pass `now`.
 */
import { addDays, addMonths, differenceInCalendarDays, parseISO, startOfDay } from 'date-fns'
import type { TrialTimepoint, WeightTrialReference } from '@/content/outlook'
import { stepWindows } from '@/domain/dosing/schedule'
import type { ProtocolLike } from '@/domain/types'

const DAY_MS = 86_400_000
const WEEK_MS = 7 * DAY_MS

export type Horizon = 3 | 6 | 12
export const HORIZONS: readonly Horizon[] = [3, 6, 12]

export function horizonDate(now: Date, months: Horizon): Date {
  return addMonths(now, months)
}

/* ------------------------------------------------------------------ treatment time */

/** Days from a local midnight to `to`, counted on the calendar so DST shifts do not leak in. */
function daysFrom(midnight: Date, to: Date): number {
  return differenceInCalendarDays(to, midnight) + (to.getTime() - startOfDay(to).getTime()) / DAY_MS
}

/** Dosing weeks between the protocol start and `at`: pause steps and time after a finite end do not count. */
export function treatmentWeeks(protocol: ProtocolLike, at: Date): number {
  let days = 0
  for (const w of stepWindows(protocol)) {
    if (w.step.pause || at <= w.start) continue
    const end = w.end && w.end < at ? w.end : at
    days += daysFrom(w.start, end)
  }
  return days / 7
}

/** First instant at which the protocol has accumulated `weeks` dosing weeks; null if it never does. */
export function dateAtTreatmentWeeks(protocol: ProtocolLike, weeks: number): Date | null {
  let left = weeks * 7
  if (left <= 0) return startOfDay(parseISO(protocol.startDate))
  for (const w of stepWindows(protocol)) {
    if (w.step.pause) continue
    const len = w.end ? differenceInCalendarDays(w.end, w.start) : Number.POSITIVE_INFINITY
    if (left <= len) {
      const whole = Math.floor(left)
      return new Date(addDays(w.start, whole).getTime() + (left - whole) * DAY_MS)
    }
    left -= len
  }
  return null
}

/**
 * Dose per administration that the protocol runs at `at`. During a pause, or after a
 * finite protocol ends, it is the last dose given; before the start, the first one.
 */
export function doseAt(protocol: ProtocolLike, at: Date): number | null {
  let last: number | null = null
  let first: number | null = null
  for (const w of stepWindows(protocol)) {
    if (w.step.pause || !(w.step.doseMg > 0)) continue
    first ??= w.step.doseMg
    if (w.start.getTime() <= at.getTime()) last = w.step.doseMg
  }
  return last ?? first
}

/* ------------------------------------------------------------------ reference band */

/** Latest published time point at or before `weeks`; null when none has been reached. */
export function pickTimepoint(
  timepoints: readonly TrialTimepoint[],
  weeks: number,
): TrialTimepoint | null {
  let best: TrialTimepoint | null = null
  for (const tp of timepoints)
    if (tp.week <= weeks + 1e-9 && (!best || tp.week > best.week)) best = tp
  return best
}

/** First published time point after `weeks`, or null. */
export function nextTimepoint(
  timepoints: readonly TrialTimepoint[],
  weeks: number,
): TrialTimepoint | null {
  let best: TrialTimepoint | null = null
  for (const tp of timepoints)
    if (tp.week > weeks + 1e-9 && (!best || tp.week < best.week)) best = tp
  return best
}

/**
 * Where the user's dose sits among the trial arms:
 * - exact: it matches an arm, the band collapses to that arm's mean;
 * - between: the band spans the two arms that bracket it;
 * - below: under the lowest arm, the band spans placebo to that arm;
 * - above: over the highest arm, only that arm is shown (dose outside what was studied).
 */
export type BandPosition = 'exact' | 'between' | 'below' | 'above'

export interface ReferenceBand {
  week: number
  position: BandPosition
  /** Lower-dose edge; 0 means placebo. */
  lowerDoseMg: number
  upperDoseMg: number
  /** Observed mean at the lower-dose edge (the smaller loss). */
  lowerPct: number
  /** Observed mean at the higher-dose edge (the larger loss). */
  upperPct: number
  placeboPct: number
}

export function bandAt(tp: TrialTimepoint, doseMg: number): ReferenceBand | null {
  const arms = tp.arms.toSorted((a, b) => a.doseMg - b.doseMg)
  const lo = arms[0]
  const hi = arms[arms.length - 1]
  if (!lo || !hi || !(doseMg > 0)) return null
  const base = { week: tp.week, placeboPct: tp.placeboPct }
  const exact = arms.find((a) => Math.abs(a.doseMg - doseMg) < 1e-9)
  if (exact) {
    return {
      ...base,
      position: 'exact',
      lowerDoseMg: exact.doseMg,
      upperDoseMg: exact.doseMg,
      lowerPct: exact.meanPct,
      upperPct: exact.meanPct,
    }
  }
  if (doseMg < lo.doseMg) {
    return {
      ...base,
      position: 'below',
      lowerDoseMg: 0,
      upperDoseMg: lo.doseMg,
      lowerPct: tp.placeboPct,
      upperPct: lo.meanPct,
    }
  }
  if (doseMg > hi.doseMg) {
    return {
      ...base,
      position: 'above',
      lowerDoseMg: hi.doseMg,
      upperDoseMg: hi.doseMg,
      lowerPct: hi.meanPct,
      upperPct: hi.meanPct,
    }
  }
  for (let i = 1; i < arms.length; i++) {
    const a = arms[i - 1]!
    const b = arms[i]!
    if (doseMg > a.doseMg && doseMg < b.doseMg) {
      return {
        ...base,
        position: 'between',
        lowerDoseMg: a.doseMg,
        upperDoseMg: b.doseMg,
        lowerPct: a.meanPct,
        upperPct: b.meanPct,
      }
    }
  }
  return null
}

export interface HorizonReference {
  targetDate: Date
  /** Dosing weeks the protocol will have accumulated by the target date. */
  weeksAtTarget: number
  /** Dose the protocol runs at the target date. */
  doseMg: number | null
  /** Published time point used (≤ weeksAtTarget), or null if none reached yet. */
  timepoint: TrialTimepoint | null
  band: ReferenceBand | null
  /** Next published time point beyond the target and when the protocol reaches it. */
  next: { timepoint: TrialTimepoint; date: Date | null } | null
}

export function referenceForHorizon(
  protocol: ProtocolLike,
  reference: WeightTrialReference,
  now: Date,
  months: Horizon,
): HorizonReference {
  const targetDate = horizonDate(now, months)
  const weeksAtTarget = treatmentWeeks(protocol, targetDate)
  const doseMg = doseAt(protocol, targetDate)
  const timepoint = pickTimepoint(reference.timepoints, weeksAtTarget)
  const band = timepoint && doseMg !== null ? bandAt(timepoint, doseMg) : null
  const nextTp = nextTimepoint(reference.timepoints, weeksAtTarget)
  return {
    targetDate,
    weeksAtTarget,
    doseMg,
    timepoint,
    band,
    next: nextTp ? { timepoint: nextTp, date: dateAtTreatmentWeeks(protocol, nextTp.week) } : null,
  }
}

export interface BandPoint {
  week: number
  lowerPct: number
  upperPct: number
  placeboPct: number
  /** False for the week-0 origin, true for published time points. */
  observed: boolean
}

/** Band over time for a dose: the origin at week 0, then every published time point. */
export function bandSeries(reference: WeightTrialReference, doseMg: number): BandPoint[] {
  const out: BandPoint[] = [{ week: 0, lowerPct: 0, upperPct: 0, placeboPct: 0, observed: false }]
  for (const tp of reference.timepoints.toSorted((a, b) => a.week - b.week)) {
    const b = bandAt(tp, doseMg)
    if (b) {
      out.push({
        week: tp.week,
        lowerPct: b.lowerPct,
        upperPct: b.upperPct,
        placeboPct: b.placeboPct,
        observed: true,
      })
    }
  }
  return out
}

/** A % band applied to a body weight, e.g. −8.7 % and −17.1 % of 90 kg. */
export function bandInKg(
  weightKg: number,
  band: Pick<ReferenceBand, 'lowerPct' | 'upperPct'>,
): { lowerKg: number; upperKg: number } {
  return { lowerKg: (weightKg * band.lowerPct) / 100, upperKg: (weightKg * band.upperPct) / 100 }
}

/* ------------------------------------------------------------------ personal trend */

export interface WeightPoint {
  at: Date
  kg: number
}

/** Weight readings from measurement rows, oldest first; invalid values are dropped. */
export function weightPoints(
  rows: readonly { kind: string; measured_at: string; value: number }[],
): WeightPoint[] {
  return rows
    .filter((r) => r.kind === 'weight')
    .map((r) => ({ at: new Date(r.measured_at), kg: Number(r.value) }))
    .filter((p) => Number.isFinite(p.kg) && p.kg > 0 && !Number.isNaN(p.at.getTime()))
    .toSorted((a, b) => a.at.getTime() - b.at.getTime())
}

/** A weigh-in this many days before the start still counts as the starting weight. */
export const BASELINE_LOOKBACK_DAYS = 14
/** Fewest readings, distinct days and days of span before a trend is drawn forward. */
export const MIN_TREND_POINTS = 3
export const MIN_TREND_SPAN_DAYS = 14
/** Extrapolating further ahead than this many times the observed span is flagged… */
export const WEAK_EXTRAPOLATION_RATIO = 2
/** …and beyond this it is not shown at all. */
export const MAX_EXTRAPOLATION_RATIO = 4

export interface PersonalTrend {
  baseline: WeightPoint
  latest: WeightPoint
  /** Readings used, from the baseline onwards. */
  points: WeightPoint[]
  /** (latest − baseline) / baseline, in %. */
  changePct: number
  /** Least-squares fit over the readings; null with too few readings or too short a span. */
  fit: { kgPerWeek: number; interceptKg: number; originMs: number } | null
}

/**
 * The user's weight since `since`: the starting weight (a weigh-in up to two weeks
 * before, else the first one after), the latest reading and a linear fit when there
 * are enough readings over enough time.
 */
export function personalTrend(
  points: readonly WeightPoint[],
  since: Date,
  now: Date,
): PersonalTrend | null {
  const sorted = points
    .filter((p) => p.at.getTime() <= now.getTime())
    .toSorted((a, b) => a.at.getTime() - b.at.getTime())
  const lookback = since.getTime() - BASELINE_LOOKBACK_DAYS * DAY_MS
  const before = sorted.findLast((p) => p.at.getTime() >= lookback && p.at < since)
  const after = sorted.filter((p) => p.at >= since)
  const baseline = before ?? after[0]
  if (!baseline) return null
  const used = before ? [before, ...after] : after
  const latest = used[used.length - 1] ?? baseline
  const changePct = ((latest.kg - baseline.kg) / baseline.kg) * 100

  const days = new Set(used.map((p) => startOfDay(p.at).getTime()))
  const spanDays = (latest.at.getTime() - baseline.at.getTime()) / DAY_MS
  let fit: PersonalTrend['fit'] = null
  if (
    used.length >= MIN_TREND_POINTS &&
    days.size >= MIN_TREND_POINTS &&
    spanDays >= MIN_TREND_SPAN_DAYS
  ) {
    const originMs = baseline.at.getTime()
    const xs = used.map((p) => (p.at.getTime() - originMs) / WEEK_MS)
    const ys = used.map((p) => p.kg)
    const mx = xs.reduce((s, x) => s + x, 0) / xs.length
    const my = ys.reduce((s, y) => s + y, 0) / ys.length
    let sxy = 0
    let sxx = 0
    xs.forEach((x, i) => {
      sxy += (x - mx) * (ys[i]! - my)
      sxx += (x - mx) ** 2
    })
    if (sxx > 0) {
      const kgPerWeek = sxy / sxx
      fit = { kgPerWeek, interceptKg: my - kgPerWeek * mx, originMs }
    }
  }
  return { baseline, latest, points: used, changePct, fit }
}

export type ProjectionReliability = 'ok' | 'weak'

export interface Projection {
  at: Date
  kg: number
  /** Versus the starting weight. */
  deltaKg: number
  deltaPct: number
  reliability: ProjectionReliability
}

/** Why a projection is not shown. */
export type NoProjection = 'no_data' | 'need_more' | 'too_far'

/**
 * The fitted line drawn forward to `at`. Flagged as weak past twice the observed span
 * and withheld past four times it, or if it would reach an impossible weight.
 */
export function projectTrend(
  trend: PersonalTrend | null,
  at: Date,
): Projection | { none: NoProjection } {
  if (!trend) return { none: 'no_data' }
  const { fit, baseline, latest } = trend
  if (!fit) return { none: 'need_more' }
  const span = latest.at.getTime() - baseline.at.getTime()
  const ahead = at.getTime() - latest.at.getTime()
  const ratio = span > 0 ? Math.max(0, ahead) / span : Number.POSITIVE_INFINITY
  if (ratio > MAX_EXTRAPOLATION_RATIO) return { none: 'too_far' }
  const kg = fit.interceptKg + fit.kgPerWeek * ((at.getTime() - fit.originMs) / WEEK_MS)
  if (!(kg > 0)) return { none: 'too_far' }
  const deltaKg = kg - baseline.kg
  return {
    at,
    kg,
    deltaKg,
    deltaPct: (deltaKg / baseline.kg) * 100,
    reliability: ratio > WEAK_EXTRAPOLATION_RATIO ? 'weak' : 'ok',
  }
}

export function isProjection(p: Projection | { none: NoProjection }): p is Projection {
  return !('none' in p)
}

/** The user's readings as % change from the starting weight, placed on the treatment-week axis. */
export function trendOnTreatmentAxis(
  trend: PersonalTrend,
  protocol: ProtocolLike,
): { week: number; pct: number }[] {
  return trend.points.map((p) => ({
    week: treatmentWeeks(protocol, p.at),
    pct: ((p.kg - trend.baseline.kg) / trend.baseline.kg) * 100,
  }))
}

/** Upper end of the chart's week axis: the largest of `weeks`, rounded up to whole 12-week blocks. */
export function chartWeeks(...weeks: number[]): number {
  const max = Math.max(0, ...weeks.filter((w) => Number.isFinite(w)))
  return Math.max(12, Math.ceil(max / 12) * 12)
}

/**
 * The protocol seen from one of its compounds. For a stack component the steps carry
 * that compound's dose, scaled with the titration as a premixed blend is.
 */
export function asCompoundProtocol(
  protocol: ProtocolLike,
  compoundId: string,
): ProtocolLike | null {
  if (protocol.compoundId === compoundId) return protocol
  const component = protocol.components?.find((c) => c.compoundId === compoundId)
  const base = protocol.steps.find((s) => !s.pause && s.doseMg > 0)?.doseMg
  if (!component || !base) return null
  const k = component.doseMg / base
  return {
    ...protocol,
    compoundId,
    components: [],
    steps: protocol.steps.map((s) => (s.pause ? s : { ...s, doseMg: s.doseMg * k })),
  }
}
