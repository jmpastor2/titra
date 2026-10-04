/**
 * What happened during a cycle, or any stretch of one: adherence, doses taken and the
 * change in weight, plus the comparison with the cycle before and the retrospective of a
 * finished one. Pure; callers pass `now`. See stats.test.ts.
 */
import { differenceInCalendarDays } from 'date-fns'
import type { MeasurementRow } from '@/data/database.types'
import { adherence, type Adherence } from '@/domain/dosing/schedule'
import type { DoseEvent, ProtocolLike } from '@/domain/types'
import { closedEarly, type CycleView } from './model'

const DAY_MS = 86_400_000

/** How far back the doses are loaded; nothing is measured from before it. */
export const DOSE_WINDOW_DAYS = 365
/** A weigh-in this many days before the start still counts as the starting weight. */
const BASELINE_LOOKBACK_DAYS = 14

/* ------------------------------------------------------------------ weight */

export interface Reading {
  at: Date
  kg: number
}

/** Weight readings from measurement rows, oldest first; invalid values are dropped. */
export function weightReadings(
  rows: readonly Pick<MeasurementRow, 'kind' | 'measured_at' | 'value'>[],
): Reading[] {
  return rows
    .filter((r) => r.kind === 'weight')
    .map((r) => ({ at: new Date(r.measured_at), kg: Number(r.value) }))
    .filter((r) => Number.isFinite(r.kg) && r.kg > 0 && !Number.isNaN(r.at.getTime()))
    .toSorted((a, b) => a.at.getTime() - b.at.getTime())
}

export interface WeightChange {
  baseline: Reading
  latest: Reading
  deltaKg: number
}

/**
 * Weight from the start of a stretch to its last reading. The starting weight is the
 * latest weigh-in up to two weeks before `from`, else the first one after it (the same
 * rule as the outlook's starting weight). Needs two readings: one is not a change.
 */
export function weightChange(
  readings: readonly Reading[],
  from: Date,
  to: Date,
): WeightChange | null {
  const upTo = readings.filter((r) => r.at <= to)
  const lookback = from.getTime() - BASELINE_LOOKBACK_DAYS * DAY_MS
  const before = upTo.findLast((r) => r.at.getTime() >= lookback && r.at < from)
  const inside = upTo.filter((r) => r.at >= from)
  const baseline = before ?? inside[0]
  const latest = inside.at(-1)
  if (!baseline || !latest || latest === baseline) return null
  return { baseline, latest, deltaKg: latest.kg - baseline.kg }
}

/* ------------------------------------------------------------------ stretches */

export interface WindowStats {
  /** Planned administrations that fell due and how many were taken; null when unknown. */
  adherence: Adherence | null
  /** Doses logged in the stretch, extras included; null when it starts before the doses loaded. */
  taken: number | null
  weight: WeightChange | null
}

export interface StatsInput {
  like: ProtocolLike
  /** The doses of the protocol's primary compound that belong to it. */
  history: readonly DoseEvent[]
  readings: readonly Reading[]
  /** Doses older than this are not loaded: nothing is counted from before it. */
  knownSince: Date
}

/** Adherence over [from, to); `adherence` looks back from the instant it is given. */
export function adherenceBetween(
  like: ProtocolLike,
  history: readonly DoseEvent[],
  from: Date,
  to: Date,
): Adherence {
  const at = new Date(to.getTime() - 1)
  return adherence(like, history, at, (at.getTime() - from.getTime()) / DAY_MS)
}

export function windowStats(
  input: StatsInput,
  from: Date,
  to: Date,
  options: { adherence?: boolean } = {},
): WindowStats {
  const covered = from >= input.knownSince
  const measurable = covered && to > from && options.adherence !== false
  return {
    adherence: measurable ? adherenceBetween(input.like, input.history, from, to) : null,
    taken: covered ? input.history.filter((d) => d.at >= from && d.at <= to).length : null,
    weight: weightChange(input.readings, from, to),
  }
}

/** The instant a cycle's figures run to: now, or the day it stopped. */
const statsEnd = (view: Pick<CycleView, 'stopsOn'>, now: Date): Date =>
  view.stopsOn && view.stopsOn < now ? view.stopsOn : now

/**
 * Figures of a cycle so far (or in full once it stopped); null before it starts. A paused
 * protocol keeps its figures but not its adherence: its planned doses are not expected.
 */
export function cycleStats(
  view: CycleView,
  input: Omit<StatsInput, 'like'>,
  now: Date,
): WindowStats | null {
  if (view.info.phase === 'before') return null
  return windowStats({ ...input, like: view.like }, view.info.startsOn, statsEnd(view, now), {
    adherence: view.row.status !== 'paused',
  })
}

/* ------------------------------------------------------------------ comparison */

export interface Comparison {
  /** Whole weeks both cycles are compared over, from their starts. */
  weeks: number
  current: WindowStats
  previous: WindowStats
}

/**
 * This cycle against the one before it over the same stretch from their starts, so a
 * cycle in its third week is held against the previous one's third week, not its whole
 * run. Null when there is not a day to compare yet.
 */
export function compareCycles(
  cur: CycleView,
  prev: CycleView,
  inputs: { current: Omit<StatsInput, 'like'>; previous: Omit<StatsInput, 'like'> },
  now: Date,
): Comparison | null {
  const length = (v: CycleView) => statsEnd(v, now).getTime() - v.info.startsOn.getTime()
  const span = Math.min(length(cur), length(prev))
  if (!(span >= DAY_MS)) return null
  const over = (v: CycleView, input: Omit<StatsInput, 'like'>) =>
    windowStats(
      { ...input, like: v.like },
      v.info.startsOn,
      new Date(v.info.startsOn.getTime() + span),
      { adherence: v.row.status !== 'paused' },
    )
  return {
    weeks: Math.max(1, Math.round(span / (7 * DAY_MS))),
    current: over(cur, inputs.current),
    previous: over(prev, inputs.previous),
  }
}

/* ------------------------------------------------------------------ retrospective */

export interface Retrospective {
  startsOn: Date
  /** The day after the last day of the cycle. */
  stopsOn: Date
  weeks: number
  doseWeeks: number
  restWeeks: number
  /** Primary dose of the last dosing step the cycle reached. */
  lastDoseMg: number | null
  /** Closed before its plan ran out. */
  early: boolean
}

/** The shape of a cycle that is over: how long it ran, in dosing and in rest, and where it ended. */
export function retrospective(view: CycleView, now: Date): Retrospective {
  const stopsOn = statsEnd(view, now)
  let doseDays = 0
  let restDays = 0
  for (const s of view.info.steps) {
    const end = s.endsOn && s.endsOn < stopsOn ? s.endsOn : stopsOn
    const days = Math.max(0, differenceInCalendarDays(end, s.startsOn))
    if (s.pause) restDays += days
    else doseDays += days
  }
  const last = view.info.steps.findLast((s) => !s.pause && s.startsOn < stopsOn)
  return {
    startsOn: view.info.startsOn,
    stopsOn,
    weeks: Math.max(1, Math.round((doseDays + restDays) / 7)),
    doseWeeks: Math.round(doseDays / 7),
    restWeeks: Math.round(restDays / 7),
    lastDoseMg: last?.doseMg ?? null,
    early: closedEarly(view),
  }
}
