/**
 * The dose timeline: what happened to every planned administration of a protocol over a
 * window, and where the plan goes next. It is the honest picture for substances whose level
 * is not worth a curve (short-acting pulses, no human pharmacokinetics): one mark per
 * administration, judged exactly as the week card and the Today ring judge it.
 *
 * Pure; see doseTimeline.test.ts.
 */
import { addDays, startOfDay } from 'date-fns'
import {
  componentsAt,
  currentStep,
  isAnchoredStep,
  matchDoses,
  matchToleranceH,
  normaliseTimes,
  ownerDay,
  plannedDoses,
  scheduledDoses,
  stepWindows,
  type PlannedDose,
} from '@/domain/dosing/schedule'
import type { DoseEvent, ProtocolLike } from '@/domain/types'
import { ON_TIME_MIN } from '@/features/doses/delta'
import { stepChanges, type StepChange } from './chartScale'

const HOUR_MS = 3_600_000
const MIN_MS = 60_000

/**
 * - taken: covers a planned administration within the hour, or is a free dose (no plan)
 * - late / early: covers one, but more than the hour after / before its time
 * - extra: covers none (outside the plan)
 * - missed: planned, its grace window is over and nothing covers it
 * - due: planned, its time has come and nothing covers it yet
 * - planned: still ahead
 */
export type AdminState = 'taken' | 'late' | 'early' | 'extra' | 'missed' | 'due' | 'planned'

/** Legend and stacking order. */
export const ADMIN_STATES: readonly AdminState[] = [
  'taken',
  'late',
  'early',
  'extra',
  'missed',
  'due',
  'planned',
]

export interface TimelineItem {
  /** Unique within a model. */
  key: string
  state: AdminState
  /** Where it sits on the time axis: when it was taken, else when it was planned. */
  at: Date
  /** The local day it belongs to: a night shot after midnight counts for its evening. */
  day: Date
  plannedAt: Date | null
  takenAt: Date | null
  /** The dose taken, or the planned dose for an administration nobody covered. */
  doseMg: number
  /** The dose the plan asked for; null for extras and free doses. */
  plannedMg: number | null
  /** Minutes after (+) or before (−) the planned time; null when nothing was matched. */
  deltaMin: number | null
  /** The other compounds drawn in the same administration (a blend or stack), in mg. */
  partners: { compoundId: string; mg: number }[]
  stepIndex: number | null
}

export interface TimelineSummary {
  /** Planned administrations whose grace window has ended, or that were taken. */
  expected: number
  taken: number
  onTime: number
  offTime: number
  missed: number
  extras: number
  /** taken / expected; 1 when nothing was expected. */
  ratio: number
}

export interface TimelineModel {
  from: Date
  to: Date
  items: TimelineItem[]
  steps: StepChange[]
  summary: TimelineSummary
  /** The tallest bar, in mg. */
  maxMg: number
  /** The first administration still to come (due now or planned). */
  next: TimelineItem | null
  /** The states present, in legend order. */
  states: AdminState[]
  /** The compound has a plan to judge doses against. */
  hasPlan: boolean
}

export interface PartnerHistory {
  compoundId: string
  history: readonly DoseEvent[]
}

export interface TimelineInput {
  protocol: ProtocolLike | null
  /** Every dose of the series' primary compound, any time (the plan anchors on the last). */
  history: readonly DoseEvent[]
  /** The other compounds of a blend or stack, to read what went in each administration. */
  partners?: readonly PartnerHistory[]
  from: Date
  to: Date
  now: Date
}

interface Slots {
  slots: PlannedDose[]
  /** Extra tolerance of a regimen anchored on the last dose: weekly shots drift. */
  slackH: number
}

/**
 * The planned administrations around a window. A regimen anchored on the last real dose
 * (a weekly shot "7 days after the last") follows the calendar up to that dose and its own
 * rhythm after it, as `nextDose` does.
 */
function windowSlots(
  protocol: ProtocolLike,
  history: readonly DoseEvent[],
  from: Date,
  to: Date,
): Slots {
  const times = normaliseTimes(protocol.times)
  const lo = addDays(from, -1)
  const hi = addDays(to, 1)
  const last = history.reduce<DoseEvent | null>((a, d) => (!a || d.at > a.at ? d : a), null)
  const stepAtLast = last ? (currentStep(protocol, last.at) ?? stepWindows(protocol).at(-1)) : null
  if (!last || !stepAtLast || !isAnchoredStep(stepAtLast.step, times)) {
    return { slots: scheduledDoses(protocol, lo, hi), slackH: 0 }
  }
  const slackH = (stepAtLast.step.intervalDays * 24) / 2
  const upTo = new Date(last.at.getTime() + slackH * HOUR_MS)
  return {
    slots: [...scheduledDoses(protocol, lo, upTo), ...plannedDoses(protocol, history, last.at, hi)],
    slackH,
  }
}

function summarise(items: readonly TimelineItem[]): TimelineSummary {
  const covered = items.filter((i) => i.plannedAt !== null && i.takenAt !== null)
  const missed = items.filter((i) => i.state === 'missed').length
  const onTime = covered.filter((i) => i.state === 'taken').length
  const expected = covered.length + missed
  return {
    expected,
    taken: covered.length,
    onTime,
    offTime: covered.length - onTime,
    missed,
    extras: items.filter((i) => i.state === 'extra').length,
    ratio: expected === 0 ? 1 : covered.length / expected,
  }
}

export function buildTimeline(input: TimelineInput): TimelineModel {
  const { protocol, history, from, to, now } = input
  const fromMs = from.getTime()
  const toMs = to.getTime()
  const partnerAt = (input.partners ?? []).map((p) => ({
    compoundId: p.compoundId,
    byTime: new Map(p.history.map((d) => [d.at.getTime(), d.mg])),
  }))
  const partnersOf = (takenAt: Date) =>
    partnerAt.flatMap((p) => {
      const mg = p.byTime.get(takenAt.getTime())
      return mg === undefined ? [] : [{ compoundId: p.compoundId, mg }]
    })

  // Doses a little outside the window still decide which administration they cover.
  const events = history.filter(
    (d) => d.at.getTime() >= fromMs - 2 * 86_400_000 && d.at.getTime() <= toMs + 2 * 86_400_000,
  )
  const byDate = new Map<Date, DoseEvent>(events.map((d) => [d.at, d]))
  const items: TimelineItem[] = []

  if (!protocol) {
    for (const [n, d] of events.entries()) {
      if (d.at.getTime() < fromMs || d.at.getTime() >= toMs) continue
      items.push({
        key: `free-${d.at.getTime()}-${n}`,
        state: 'taken',
        at: d.at,
        day: startOfDay(d.at),
        plannedAt: null,
        takenAt: d.at,
        doseMg: d.mg,
        plannedMg: null,
        deltaMin: null,
        partners: partnersOf(d.at),
        stepIndex: null,
      })
    }
  } else {
    const times = normaliseTimes(protocol.times)
    const active = currentStep(protocol, now) ?? stepWindows(protocol).at(-1)
    const { slots, slackH } = windowSlots(protocol, history, from, to)
    const tolH = Math.max(matchToleranceH(active?.step, times), slackH)
    const graceMs = matchToleranceH(active?.step, times) * HOUR_MS
    const { slots: matched, extras } = matchDoses(slots, events, tolH)

    for (const s of matched) {
      const at = s.at.getTime()
      if (at < fromMs || at >= toMs) continue
      const dose = s.takenAt ? byDate.get(s.takenAt) : undefined
      if (s.takenAt && dose) {
        const deltaMin = Math.round((s.takenAt.getTime() - at) / MIN_MS)
        items.push({
          key: `slot-${at}`,
          state: Math.abs(deltaMin) <= ON_TIME_MIN ? 'taken' : deltaMin > 0 ? 'late' : 'early',
          at: s.takenAt,
          day: ownerDay(s),
          plannedAt: s.at,
          takenAt: s.takenAt,
          doseMg: dose.mg,
          plannedMg: s.doseMg,
          deltaMin,
          partners: partnersOf(s.takenAt),
          stepIndex: s.stepIndex,
        })
      } else {
        items.push({
          key: `slot-${at}`,
          state: at + graceMs < now.getTime() ? 'missed' : at <= now.getTime() ? 'due' : 'planned',
          at: s.at,
          day: ownerDay(s),
          plannedAt: s.at,
          takenAt: null,
          doseMg: s.doseMg,
          plannedMg: s.doseMg,
          deltaMin: null,
          partners: componentsAt(protocol, s.doseMg).map((c) => ({
            compoundId: c.compoundId,
            mg: c.doseMg,
          })),
          stepIndex: s.stepIndex,
        })
      }
    }
    for (const [n, d] of extras.entries()) {
      if (d.at.getTime() < fromMs || d.at.getTime() >= toMs) continue
      items.push({
        key: `extra-${d.at.getTime()}-${n}`,
        state: 'extra',
        at: d.at,
        day: startOfDay(d.at),
        plannedAt: null,
        takenAt: d.at,
        doseMg: d.mg,
        plannedMg: null,
        deltaMin: null,
        partners: partnersOf(d.at),
        stepIndex: currentStep(protocol, d.at)?.index ?? null,
      })
    }
  }

  items.sort((a, b) => a.at.getTime() - b.at.getTime() || a.key.localeCompare(b.key))
  const present = new Set(items.map((i) => i.state))
  return {
    from,
    to,
    items,
    steps: protocol ? stepChanges(protocol, from, to) : [],
    summary: summarise(items),
    maxMg: items.reduce((m, i) => Math.max(m, i.doseMg, i.plannedMg ?? 0), 0),
    next: items.find((i) => i.state === 'due' || i.state === 'planned') ?? null,
    states: ADMIN_STATES.filter((s) => present.has(s)),
    hasPlan: protocol !== null,
  }
}

/** Taken, but more than an hour from the time the plan asked for. */
export function isOffTime(state: AdminState): boolean {
  return state === 'late' || state === 'early'
}

/** The administrations that really happened (something was injected). */
export function isTakenState(state: AdminState): boolean {
  return state === 'taken' || state === 'late' || state === 'early' || state === 'extra'
}
