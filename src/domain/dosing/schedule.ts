/**
 * Protocol schedules: titration steps, weekday and multi-time regimens, off-cycles,
 * planned administrations, next due dose, today's agenda and adherence.
 *
 * Two scheduling modes coexist:
 * - Anchored: long-interval regimens (weekly GLP-1, twice-weekly) follow the patient's
 *   real rhythm — "7 days after my last shot" — so a late dose shifts the next one.
 * - Calendar: daily, weekday and multi-time regimens (CJC + ipamorelin 5 on / 2 off
 *   at night, BPC-157 twice daily) follow the calendar; a missed dose is just missed.
 *
 * All date maths is local time via date-fns. Pure functions; callers pass `now`.
 */
import { addDays, differenceInCalendarDays, parseISO, set, startOfDay } from 'date-fns'
import type { DoseEvent, ProtocolLike, ScheduleStep } from '../types'

const DAY_MS = 86_400_000
const HOUR_MS = 3_600_000
const DEFAULT_TIME = '09:00'

export interface StepWindow {
  index: number
  step: ScheduleStep
  /** Inclusive start of the step (local midnight). */
  start: Date
  /** Exclusive end; null for open-ended maintenance. */
  end: Date | null
}

export interface PlannedDose {
  at: Date
  doseMg: number
  stepIndex: number
}

/* ------------------------------------------------------------------ times */

/** Normalise "H:mm"/"HH:mm" strings: valid, unique, sorted. Falls back to 09:00. */
export function normaliseTimes(times: readonly string[] | undefined): string[] {
  const valid = (times ?? [])
    .map((t) => t.trim())
    .filter((t) => /^\d{1,2}:\d{2}$/.test(t))
    .map((t) => {
      const [h = 0, m = 0] = t.split(':').map(Number)
      return `${String(Math.min(23, h)).padStart(2, '0')}:${String(Math.min(59, m)).padStart(2, '0')}`
    })
  const unique = [...new Set(valid)].toSorted()
  return unique.length ? unique : [DEFAULT_TIME]
}

/** Apply "HH:mm" to a date, defaulting to 09:00. */
export function atTimeOfDay(date: Date, timeOfDay: string | undefined): Date {
  const [h, m] = (timeOfDay ?? DEFAULT_TIME).split(':').map((v) => Number.parseInt(v, 10))
  return set(startOfDay(date), {
    hours: Number.isFinite(h) ? h : 9,
    minutes: Number.isFinite(m) ? m : 0,
    seconds: 0,
    milliseconds: 0,
  })
}

/** Smallest gap between consecutive administration times on a day, in hours (Infinity for one time). */
export function minTimeSpacingH(times: readonly string[]): number {
  const mins = normaliseTimes(times).map((t) => {
    const [h = 0, m = 0] = t.split(':').map(Number)
    return h * 60 + m
  })
  if (mins.length < 2) return Number.POSITIVE_INFINITY
  let gap = 24 * 60 - (mins[mins.length - 1]! - mins[0]!)
  for (let i = 1; i < mins.length; i++) gap = Math.min(gap, mins[i]! - mins[i - 1]!)
  return gap / 60
}

/* ------------------------------------------------------------------ steps */

/** Absolute windows for each step of the protocol. */
export function stepWindows(protocol: ProtocolLike): StepWindow[] {
  const out: StepWindow[] = []
  let cursor = startOfDay(parseISO(protocol.startDate))
  protocol.steps.forEach((step, index) => {
    const end = step.durationWeeks == null ? null : addDays(cursor, step.durationWeeks * 7)
    out.push({ index, step, start: cursor, end })
    if (end) cursor = end
  })
  return out
}

/** Which step is active at `at`; null before start or after a finite protocol has ended. */
export function currentStep(protocol: ProtocolLike, at: Date): StepWindow | null {
  for (const w of stepWindows(protocol)) {
    if (at >= w.start && (w.end === null || at < w.end)) return w
  }
  return null
}

function lastStep(protocol: ProtocolLike): StepWindow | null {
  return stepWindows(protocol).at(-1) ?? null
}

function hasWeekdays(step: ScheduleStep): step is ScheduleStep & { weekdays: number[] } {
  return Array.isArray(step.weekdays) && step.weekdays.length > 0
}

/**
 * Long-interval, single-time steps follow the patient's real rhythm (anchored to the
 * last administration). Everything else follows the calendar.
 */
export function isAnchoredStep(step: ScheduleStep, times: readonly string[]): boolean {
  return (
    !step.pause &&
    !hasWeekdays(step) &&
    normaliseTimes(times).length === 1 &&
    step.intervalDays >= 2
  )
}

/** Average hours between administrations for a step (used for steady-state maths). */
export function effectiveIntervalH(step: ScheduleStep, times: readonly string[]): number {
  const perDay = normaliseTimes(times).length
  if (hasWeekdays(step)) return (24 * 7) / (step.weekdays.length * perDay)
  return (step.intervalDays * 24) / perDay
}

/* ------------------------------------------------------------------ calendar */

/** Planned administrations strictly by calendar, in [from, to). Pause steps produce none. */
export function scheduledDoses(protocol: ProtocolLike, from: Date, to: Date): PlannedDose[] {
  const times = normaliseTimes(protocol.times)
  const out: PlannedDose[] = []
  for (const w of stepWindows(protocol)) {
    if (w.step.pause || !(w.step.doseMg > 0)) continue
    const end = w.end ? Math.min(w.end.getTime(), to.getTime()) : to.getTime()
    if (end <= from.getTime() || w.start.getTime() >= end) continue

    if (hasWeekdays(w.step)) {
      const days = new Set(w.step.weekdays)
      let day = startOfDay(from > w.start ? from : w.start)
      while (day.getTime() < end) {
        if (days.has(day.getDay())) {
          for (const time of times) {
            const at = atTimeOfDay(day, time)
            if (at >= from && at >= w.start && at.getTime() < end) {
              out.push({ at, doseMg: w.step.doseMg, stepIndex: w.index })
            }
          }
        }
        day = addDays(day, 1)
      }
      continue
    }

    const intervalMs = w.step.intervalDays * DAY_MS
    if (!(intervalMs > 0)) continue
    for (const time of times) {
      let t = atTimeOfDay(w.start, time).getTime()
      // Jump straight to the first occurrence at or after `from`.
      if (t < from.getTime()) t += Math.ceil((from.getTime() - t) / intervalMs) * intervalMs
      for (; t < end; t += intervalMs) {
        out.push({ at: new Date(t), doseMg: w.step.doseMg, stepIndex: w.index })
      }
    }
  }
  return out.toSorted((a, b) => a.at.getTime() - b.at.getTime())
}

/* ------------------------------------------------------------------ planning */

/**
 * Planned future administrations in [from, to]. Anchored steps are projected from the
 * last real dose; calendar steps (and anything after a switch to one) use the calendar.
 */
export function plannedDoses(
  protocol: ProtocolLike,
  history: readonly DoseEvent[],
  from: Date,
  to: Date,
): PlannedDose[] {
  const times = normaliseTimes(protocol.times)
  const last = history.toSorted((a, b) => b.at.getTime() - a.at.getTime())[0]
  const stepAtLast = last ? (currentStep(protocol, last.at) ?? lastStep(protocol)) : null
  if (!last || !stepAtLast || !isAnchoredStep(stepAtLast.step, times)) {
    return scheduledDoses(protocol, from, to)
  }

  const out: PlannedDose[] = []
  let t = last.at
  for (let guard = 0; guard < 10_000; guard++) {
    const w = currentStep(protocol, t) ?? lastStep(protocol)
    if (!w || !isAnchoredStep(w.step, times)) break
    t = new Date(t.getTime() + w.step.intervalDays * DAY_MS)
    if (t.getTime() > to.getTime()) return out
    // The dose belongs to whichever step is active at the planned time.
    const stepAtT = currentStep(protocol, t)
    if (!stepAtT) return out
    if (!isAnchoredStep(stepAtT.step, times)) {
      // Regimen switches to a pause or calendar step: continue on the calendar from its start.
      const resume = stepAtT.start > from ? stepAtT.start : from
      return [...out, ...scheduledDoses(protocol, resume, to)]
    }
    if (t >= from) out.push({ at: t, doseMg: stepAtT.step.doseMg, stepIndex: stepAtT.index })
  }
  return out
}

/* ------------------------------------------------------------------ matching */

/** Grace window in hours before a dose counts as late, scaled by interval. */
export function graceHours(intervalDays: number): number {
  if (intervalDays >= 6) return 24 // weekly: a day of tolerance
  if (intervalDays >= 1) return 4
  return 1
}

/** Tolerance used to match a real dose to a planned occurrence. */
export function matchToleranceH(step: ScheduleStep | undefined, times: readonly string[]): number {
  const interval = step && !hasWeekdays(step) ? step.intervalDays : 1
  return Math.min(graceHours(interval), minTimeSpacingH(times) / 2)
}

export interface MatchedOccurrence extends PlannedDose {
  takenAt: Date | null
}

/**
 * Greedy one-to-one matching of doses to occurrences: each dose satisfies at most
 * one occurrence, the closest unmatched one within tolerance.
 */
export function matchOccurrences(
  occurrences: readonly PlannedDose[],
  doses: readonly DoseEvent[],
  toleranceH: number,
): MatchedOccurrence[] {
  const tol = toleranceH * HOUR_MS
  const pool = doses.map((d) => d.at.getTime()).toSorted((a, b) => a - b)
  const used = Array.from({ length: pool.length }, () => false)
  return occurrences
    .toSorted((a, b) => a.at.getTime() - b.at.getTime())
    .map((o) => {
      const target = o.at.getTime()
      let best = -1
      let bestGap = Number.POSITIVE_INFINITY
      for (let i = 0; i < pool.length; i++) {
        if (used[i]) continue
        const gap = Math.abs(pool[i]! - target)
        if (gap <= tol && gap < bestGap) {
          best = i
          bestGap = gap
        }
      }
      if (best >= 0) used[best] = true
      return { ...o, takenAt: best >= 0 ? new Date(pool[best]!) : null }
    })
}

/* ------------------------------------------------------------------ next dose */

export interface NextDose extends PlannedDose {
  /** Negative when due in the future, positive hours overdue. */
  overdueH: number
  status: 'upcoming' | 'due' | 'overdue'
}

export function nextDose(
  protocol: ProtocolLike,
  history: readonly DoseEvent[],
  now: Date,
): NextDose | null {
  const times = normaliseTimes(protocol.times)
  const horizon = new Date(now.getTime() + 400 * DAY_MS)
  const active = currentStep(protocol, now) ?? lastStep(protocol)
  const last = history.toSorted((a, b) => b.at.getTime() - a.at.getTime())[0]

  // Anchored regimen: the next shot is one interval after the last real one.
  if (active && isAnchoredStep(active.step, times) && last) {
    const next = plannedDoses(protocol, history, last.at, horizon)[0]
    if (!next) return null
    const grace = graceHours(protocol.steps[next.stepIndex]?.intervalDays ?? 7)
    const overdueH = (now.getTime() - next.at.getTime()) / HOUR_MS
    const status: NextDose['status'] =
      overdueH > grace ? 'overdue' : overdueH >= -grace ? 'due' : 'upcoming'
    return { ...next, overdueH, status }
  }

  // Calendar regimen: the first occurrence not yet taken and not already left behind.
  const tolH = matchToleranceH(active?.step, times)
  const window = scheduledDoses(protocol, new Date(now.getTime() - tolH * HOUR_MS), horizon)
  const matched = matchOccurrences(window.slice(0, 64), history, tolH)
  const next = matched.find((o) => !o.takenAt) ?? window[64]
  if (!next) return null
  const overdueH = (now.getTime() - next.at.getTime()) / HOUR_MS
  return {
    at: next.at,
    doseMg: next.doseMg,
    stepIndex: next.stepIndex,
    overdueH,
    status: Math.abs(overdueH) <= tolH ? 'due' : 'upcoming',
  }
}

/* ------------------------------------------------------------------ today */

export type AgendaStatus = 'taken' | 'due' | 'upcoming' | 'missed' | 'overdue'

export interface AgendaItem extends PlannedDose {
  status: AgendaStatus
  takenAt: Date | null
}

/**
 * Today's administrations for one protocol, with their state. Weekly regimens show the
 * planned shot on its day, or an overdue shot until it is taken.
 */
export function dayAgenda(
  protocol: ProtocolLike,
  history: readonly DoseEvent[],
  now: Date,
): AgendaItem[] {
  const times = normaliseTimes(protocol.times)
  const dayStart = startOfDay(now)
  const dayEnd = addDays(dayStart, 1)
  const active = currentStep(protocol, now) ?? lastStep(protocol)

  if (active && isAnchoredStep(active.step, times) && history.length > 0) {
    const takenToday = history
      .filter((d) => d.at >= dayStart && d.at < dayEnd)
      .map<AgendaItem>((d) => ({
        at: d.at,
        doseMg: d.mg,
        stepIndex: active.index,
        status: 'taken',
        takenAt: d.at,
      }))
    const next = nextDose(protocol, history, now)
    if (next && (next.status === 'overdue' || (next.at >= dayStart && next.at < dayEnd))) {
      return [...takenToday, { ...next, status: next.status, takenAt: null }]
    }
    return takenToday
  }

  const tolH = matchToleranceH(active?.step, times)
  const occurrences = scheduledDoses(protocol, dayStart, dayEnd)
  return matchOccurrences(occurrences, history, tolH).map((o) => {
    if (o.takenAt) return { ...o, status: 'taken' as const }
    const deltaH = (now.getTime() - o.at.getTime()) / HOUR_MS
    const status: AgendaStatus = deltaH > tolH ? 'missed' : deltaH >= -tolH ? 'due' : 'upcoming'
    return { ...o, status }
  })
}

/* ------------------------------------------------------------------ adherence */

export interface Adherence {
  expected: number
  taken: number
  /** taken / expected clamped to [0,1]; 1 when nothing was expected. */
  ratio: number
  windowDays: number
}

/**
 * Occurrence-based adherence over a trailing window. Occurrences still inside their
 * grace window only count once they are taken, so "due now" never lowers the score.
 */
export function adherence(
  protocol: ProtocolLike,
  history: readonly DoseEvent[],
  now: Date,
  windowDays = 28,
): Adherence {
  const times = normaliseTimes(protocol.times)
  const from = new Date(now.getTime() - windowDays * DAY_MS)
  const start = startOfDay(parseISO(protocol.startDate))
  const effectiveFrom = from > start ? from : start
  const active = currentStep(protocol, now) ?? lastStep(protocol)
  const tolH = matchToleranceH(active?.step, times)
  const occurrences = scheduledDoses(protocol, effectiveFrom, new Date(now.getTime() + 1))
  const matched = matchOccurrences(
    occurrences,
    history,
    Math.max(tolH, anchoredSlackH(protocol, now)),
  )
  const counted = matched.filter(
    (o) => o.takenAt || o.at.getTime() <= now.getTime() - tolH * HOUR_MS,
  )
  const taken = counted.filter((o) => o.takenAt).length
  const expected = counted.length
  return { expected, taken, ratio: expected === 0 ? 1 : Math.min(1, taken / expected), windowDays }
}

/** Weekly shots may drift by a day or two and still count as the same administration. */
function anchoredSlackH(protocol: ProtocolLike, now: Date): number {
  const active = currentStep(protocol, now) ?? lastStep(protocol)
  if (!active || !isAnchoredStep(active.step, protocol.times)) return 0
  return (active.step.intervalDays * 24) / 2
}

/* ------------------------------------------------------------------ titration */

export interface TitrationStatus {
  stepIndex: number
  totalSteps: number
  doseMg: number
  intervalDays: number
  /** Days since the step started. */
  daysInStep: number
  /** Days until the next step, null on open-ended maintenance. */
  daysToNextStep: number | null
  nextDoseMg: number | null
  isMaintenance: boolean
  isPaused: boolean
}

export function titrationStatus(protocol: ProtocolLike, now: Date): TitrationStatus | null {
  const w = currentStep(protocol, now)
  if (!w) return null
  const next = protocol.steps[w.index + 1]
  return {
    stepIndex: w.index,
    totalSteps: protocol.steps.length,
    doseMg: w.step.doseMg,
    intervalDays: w.step.intervalDays,
    daysInStep: differenceInCalendarDays(now, w.start),
    daysToNextStep: w.end ? differenceInCalendarDays(w.end, now) : null,
    nextDoseMg: next ? (next.pause ? 0 : next.doseMg) : null,
    isMaintenance: w.end === null,
    isPaused: Boolean(w.step.pause),
  }
}

/** Reference regimen (dose + mean interval) for steady-state comparisons at `now`. */
export function referenceRegimen(
  protocol: ProtocolLike,
  now: Date,
): { doseMg: number; intervalH: number } {
  const w = currentStep(protocol, now) ?? lastStep(protocol)
  if (!w || w.step.pause) return { doseMg: 0, intervalH: 24 }
  return { doseMg: w.step.doseMg, intervalH: effectiveIntervalH(w.step, protocol.times) }
}
