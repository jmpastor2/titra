/**
 * Dose drift: the person takes something other than the plan says. Doses are often raised
 * by feel before the plan gets there, and the cycle card would then announce a step-up that
 * already happened. Looks at the latest doses of the protocol's primary compound inside the
 * step in force; once the plan moves on, earlier deviations are history. Pure; see drift.test.ts.
 */
import { addDays, format, max, startOfDay } from 'date-fns'
import type { DoseRow } from '@/data/database.types'
import { toDoseEvent } from '@/data/mappers'
import {
  currentStep,
  matchDoses,
  matchToleranceH,
  normaliseTimes,
  ownerDay,
  scheduledDoses,
  stepWindows,
} from '@/domain/dosing/schedule'
import type { ProtocolLike } from '@/domain/types'

/** How far back doses are looked at. */
const LOOKBACK_DAYS = 14
/** Fewer doses than this in a row are a one-off, not a drift. */
const MIN_DOSES = 2
/** Doses count as "the same dose" when they are within this share of each other. */
const AGREE = 0.03
/** A dose differs from the plan when it is further than this share from it. */
const DIFFER = 0.05
/** Rounding slack for shares that went through divisions. */
const EPS = 1e-9

export interface DoseDrift {
  /** Dose of the step in force, in mg. */
  plannedMg: number
  /** What the latest doses actually were, in mg. */
  actualMg: number
  /** How many doses in a row, counting back from the latest. */
  doses: number
  /** The day the first of them belongs to (a shot after midnight belongs to the evening before). */
  sinceDay: Date
  /** The step in force: the one "update the plan" changes. */
  stepIndex: number
  /** The dose taken is the one the next step plans. */
  matchesNextStep: boolean
}

/**
 * Key under which "it was a one-off" is remembered (alert_dismissals). It carries the dose: if
 * the doses keep moving after that answer (20 U, then 22 U), it is a new question.
 */
export function driftKey(protocolId: string, sinceDay: Date, actualMg: number): string {
  return `drift:${protocolId}:${format(sinceDay, 'yyyy-MM-dd')}:${Math.round(actualMg * 1000)}`
}

const differs = (actual: number, planned: number) =>
  Math.abs(actual - planned) / planned > DIFFER + EPS

/**
 * The latest doses against the plan. `rows` are the doses of this protocol (other compounds
 * of a stack or blend ride along and are left out; so are doses that cover no planned
 * administration). A drift needs the two or more latest doses to agree with each other and
 * to differ from the planned dose, with no dose that follows the plan in between.
 *
 * It looks at the step in force, or at the step `stepIndex` when one is given: the step a
 * change just left, to tell whether the person already was at the dose it leads to.
 */
export function doseDrift(
  protocol: ProtocolLike,
  rows: readonly DoseRow[],
  now: Date,
  stepIndex?: number,
): DoseDrift | null {
  const window =
    stepIndex === undefined ? currentStep(protocol, now) : stepWindows(protocol)[stepIndex]
  if (!window || window.step.pause || !(window.step.doseMg > 0)) return null

  const from = startOfDay(max([window.start, addDays(now, -LOOKBACK_DAYS)]))
  // A day either side so a shot after midnight is matched to the evening it belongs to.
  const earliest = addDays(from, -1)
  const events = rows
    .filter((r) => r.compound_id === protocol.compoundId)
    .map(toDoseEvent)
    .filter((e) => e.mg > 0 && e.at >= earliest && e.at <= now)
  const mgAt = new Map(events.map((e) => [e.at.getTime(), e.mg]))

  const { slots } = matchDoses(
    scheduledDoses(protocol, earliest, addDays(now, 1)),
    events,
    matchToleranceH(window.step, normaliseTimes(protocol.times)),
  )
  const taken: { at: number; mg: number; day: Date }[] = []
  for (const s of slots) {
    if (!s.takenAt || s.stepIndex !== window.index || ownerDay(s) < from) continue
    const mg = mgAt.get(s.takenAt.getTime())
    if (mg !== undefined) taken.push({ at: s.takenAt.getTime(), mg, day: ownerDay(s) })
  }
  const latestFirst = taken.toSorted((a, b) => b.at - a.at)

  const planned = window.step.doseMg
  const newest = latestFirst[0]
  if (!newest || !differs(newest.mg, planned)) return null
  // The run: the latest doses that are all off the plan on the same side. They need not be
  // equal: raising by feel goes 20 U, then 22 U, and that is still one drift, read at the
  // dose taken now.
  const above = newest.mg > planned
  const run = [newest]
  for (const d of latestFirst.slice(1)) {
    if (!differs(d.mg, planned) || d.mg > planned !== above) break
    run.push(d)
  }
  const oldest = run.at(-1)
  if (!oldest || run.length < MIN_DOSES) return null

  // Steady doses read as their mean (rounding noise); a rising or falling run as the latest.
  const steady =
    (Math.max(...run.map((d) => d.mg)) - Math.min(...run.map((d) => d.mg))) /
      Math.max(...run.map((d) => d.mg)) <=
    AGREE + EPS
  const actualMg = steady
    ? Math.round((run.reduce((sum, d) => sum + d.mg, 0) / run.length) * 1e6) / 1e6
    : newest.mg
  const next = protocol.steps[window.index + 1]
  return {
    plannedMg: planned,
    actualMg,
    doses: run.length,
    sinceDay: oldest.day,
    stepIndex: window.index,
    matchesNextStep: Boolean(
      next && !next.pause && next.doseMg > 0 && !differs(actualMg, next.doseMg),
    ),
  }
}
