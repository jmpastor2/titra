/**
 * Protocol schedules: titration steps, planned doses, next due dose and adherence.
 * All date maths uses date-fns on local time; the UI passes `now`.
 */
import { addDays, differenceInCalendarDays, parseISO, set, startOfDay } from 'date-fns'
import type { DoseEvent, ProtocolLike, ScheduleStep } from '../types'

const DAY_MS = 86_400_000

export interface StepWindow {
  index: number
  step: ScheduleStep
  /** Inclusive start of the step (local midnight of the day). */
  start: Date
  /** Exclusive end; null for open-ended maintenance. */
  end: Date | null
}

export interface PlannedDose {
  at: Date
  doseMg: number
  stepIndex: number
}

/** Apply protocol.timeOfDay ("HH:mm") to a date, defaulting to 09:00. */
export function atTimeOfDay(date: Date, timeOfDay: string | undefined): Date {
  const [h, m] = (timeOfDay ?? '09:00').split(':').map((v) => Number.parseInt(v, 10))
  return set(startOfDay(date), {
    hours: Number.isFinite(h) ? h : 9,
    minutes: Number.isFinite(m) ? m : 0,
    seconds: 0,
    milliseconds: 0,
  })
}

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

/** Planned administrations strictly by calendar (ignores what was actually taken). */
export function scheduledDoses(protocol: ProtocolLike, from: Date, to: Date): PlannedDose[] {
  const out: PlannedDose[] = []
  for (const w of stepWindows(protocol)) {
    const intervalMs = w.step.intervalDays * DAY_MS
    if (!(intervalMs > 0)) continue
    let t = atTimeOfDay(w.start, protocol.timeOfDay)
    const hardEnd = w.end ? Math.min(w.end.getTime(), to.getTime()) : to.getTime()
    while (t.getTime() < hardEnd) {
      if (t >= from) out.push({ at: t, doseMg: w.step.doseMg, stepIndex: w.index })
      t = new Date(t.getTime() + intervalMs)
    }
  }
  return out.toSorted((a, b) => a.at.getTime() - b.at.getTime())
}

/**
 * Planned future doses anchored to the last actual administration, the way
 * patients really dose ("every 7 days from my last shot"). Falls back to the
 * calendar schedule when there is no history.
 */
export function plannedDoses(
  protocol: ProtocolLike,
  history: readonly DoseEvent[],
  from: Date,
  to: Date,
): PlannedDose[] {
  const last = history.toSorted((a, b) => b.at.getTime() - a.at.getTime())[0]
  if (!last) return scheduledDoses(protocol, from, to)
  const out: PlannedDose[] = []
  let t = last.at
  for (let i = 0; i < 10_000; i++) {
    const w = currentStep(protocol, t) ?? lastStep(protocol)
    if (!w) break
    const intervalMs = w.step.intervalDays * DAY_MS
    if (!(intervalMs > 0)) break
    t = new Date(t.getTime() + intervalMs)
    if (t.getTime() > to.getTime()) break
    // The dose belongs to whichever step is active at the *planned* time.
    const stepAtT = currentStep(protocol, t)
    if (!stepAtT) break
    if (t >= from) out.push({ at: t, doseMg: stepAtT.step.doseMg, stepIndex: stepAtT.index })
  }
  return out
}

export interface NextDose extends PlannedDose {
  /** Negative when due in the future, positive hours overdue. */
  overdueH: number
  status: 'upcoming' | 'due' | 'overdue'
}

/** Grace window in hours before a dose is flagged as overdue, scaled by interval. */
export function graceHours(intervalDays: number): number {
  if (intervalDays >= 6) return 24 // weekly: a day of tolerance
  if (intervalDays >= 1) return 4
  return 1
}

export function nextDose(
  protocol: ProtocolLike,
  history: readonly DoseEvent[],
  now: Date,
): NextDose | null {
  const horizon = new Date(now.getTime() + 400 * DAY_MS)
  const last = history.toSorted((a, b) => b.at.getTime() - a.at.getTime())[0]
  const candidates = last
    ? plannedDoses(protocol, history, last.at, horizon)
    : scheduledDoses(protocol, startOfDay(parseISO(protocol.startDate)), horizon)
  const next = candidates[0]
  if (!next) return null
  const step = protocol.steps[next.stepIndex]
  const grace = graceHours(step?.intervalDays ?? 7)
  const overdueH = (now.getTime() - next.at.getTime()) / 3_600_000
  const status: NextDose['status'] =
    overdueH > grace ? 'overdue' : overdueH >= -grace ? 'due' : 'upcoming'
  return { ...next, overdueH, status }
}

export interface Adherence {
  expected: number
  taken: number
  /** taken / expected clamped to [0,1]; 1 when nothing was expected. */
  ratio: number
  windowDays: number
}

/** Simple count-based adherence over a trailing window. */
export function adherence(
  protocol: ProtocolLike,
  history: readonly DoseEvent[],
  now: Date,
  windowDays = 28,
): Adherence {
  const from = new Date(now.getTime() - windowDays * DAY_MS)
  const start = startOfDay(parseISO(protocol.startDate))
  const effectiveFrom = from > start ? from : start
  const expected = scheduledDoses(protocol, effectiveFrom, now).length
  const taken = history.filter((d) => d.at >= effectiveFrom && d.at <= now).length
  const ratio = expected === 0 ? 1 : Math.min(1, taken / expected)
  return { expected, taken, ratio, windowDays }
}

export interface TitrationStatus {
  stepIndex: number
  totalSteps: number
  doseMg: number
  intervalDays: number
  /** Days since the step started. */
  daysInStep: number
  /** Days until the next escalation, null on maintenance. */
  daysToNextStep: number | null
  nextDoseMg: number | null
  isMaintenance: boolean
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
    nextDoseMg: next ? next.doseMg : null,
    isMaintenance: w.end === null,
  }
}

/** Reference regimen (dose + interval) for steady-state comparisons at `now`. */
export function referenceRegimen(
  protocol: ProtocolLike,
  now: Date,
): { doseMg: number; intervalH: number } {
  const w = currentStep(protocol, now) ?? lastStep(protocol)
  return { doseMg: w?.step.doseMg ?? 0, intervalH: (w?.step.intervalDays ?? 7) * 24 }
}
