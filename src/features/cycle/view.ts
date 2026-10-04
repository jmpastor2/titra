/**
 * What the cycle card says about a protocol, as plain data the components turn into words
 * and shapes: the headline ("week 3 of 12"), one segment per week for the track, and the next
 * change. Pure; see view.test.ts.
 */
import type { CycleInfo, CycleStep } from '@/domain/dosing/cycle'

export type Headline =
  | { kind: 'before'; on: Date }
  /** Dosing week N of M: weeks of rest are not counted. */
  | { kind: 'week'; week: number; total: number }
  /** Open-ended titration: the week since the start and the step it is on. */
  | { kind: 'step'; week: number; step: number; steps: number }
  | { kind: 'rest'; week: number; total: number | null }
  | { kind: 'maintenance'; week: number }
  | { kind: 'finished'; on: Date | null }

export function headline(info: CycleInfo): Headline {
  switch (info.phase) {
    case 'before':
      return { kind: 'before', on: info.startsOn }
    case 'finished':
      return { kind: 'finished', on: info.endsOn }
    case 'rest':
      return { kind: 'rest', week: info.weekInStep, total: info.stepWeeks }
    case 'maintenance':
      return { kind: 'maintenance', week: info.week }
    default:
      return info.doseWeek !== null && info.doseWeeks !== null
        ? { kind: 'week', week: info.doseWeek, total: info.doseWeeks }
        : { kind: 'step', week: info.week, step: info.stepNumber, steps: info.stepCount }
  }
}

export type TrackState = 'done' | 'current' | 'future'

/** Where a step stands today: behind us, the one in force, or still to come. */
export function stepState(info: CycleInfo, index: number): TrackState {
  if (info.phase === 'before') return 'future'
  if (info.phase === 'finished' || !info.step) return 'done'
  if (index < info.step.index) return 'done'
  return index === info.step.index ? 'current' : 'future'
}

export type TrackCell =
  /** Week `n` of the plan; a week of rest is hatched; the first week of a step opens a group. */
  | { kind: 'week'; n: number; state: TrackState; rest: boolean; stepStart: boolean }
  /** An open-ended step (maintenance) has no weeks to count. */
  | { kind: 'open'; state: TrackState }
  /** Weeks left out of a long plan: "+N". */
  | { kind: 'more'; state: TrackState; count: number }

/** Segments that fit a phone-wide track comfortably. */
export const TRACK_MAX = 24

/** One cell per week of the plan, collapsed around the current week when the plan is long. */
export function weekTrack(info: CycleInfo, max: number = TRACK_MAX): TrackCell[] {
  let weeks = 0
  const cells = info.steps.flatMap((s): TrackCell[] => {
    const state = stepState(info, s.index)
    if (s.weeks === null) return [{ kind: 'open', state }]
    const first = weeks
    weeks += Math.max(1, Math.ceil(s.weeks))
    return Array.from({ length: weeks - first }, (_, i): TrackCell => {
      const inStep = i + 1
      return {
        kind: 'week',
        n: first + inStep,
        rest: s.pause,
        stepStart: i === 0,
        state:
          state !== 'current'
            ? state
            : inStep < info.weekInStep
              ? 'done'
              : inStep === info.weekInStep
                ? 'current'
                : 'future',
      }
    })
  })
  if (cells.length <= max) return cells

  const found = cells.findIndex((c) => c.state === 'current')
  const at = info.phase === 'finished' ? cells.length - 1 : Math.max(0, found)
  // Two of the slots may go to "+N" markers at either end.
  const room = max - 2
  const start = Math.min(Math.max(0, at - Math.floor(room / 2)), cells.length - room)
  const end = start + room
  return [
    ...(start > 0 ? [{ kind: 'more', state: 'done', count: start } as const] : []),
    ...cells.slice(start, end),
    ...(end < cells.length
      ? [{ kind: 'more', state: 'future', count: cells.length - end } as const]
      : []),
  ]
}

export type NextLine =
  | { kind: 'increase' | 'decrease' | 'resume' | 'start'; on: Date; days: number; to: CycleStep }
  /** A new step with the same dose. */
  | { kind: 'same'; on: Date; days: number; step: number }
  | { kind: 'rest' | 'end'; on: Date; days: number }
  | { kind: 'ended'; on: Date | null }
  /** Nothing is planned to change (maintenance). */
  | { kind: 'none' }

/** The next change of dose, in the order the card announces it. */
export function nextLine(info: CycleInfo): NextLine {
  if (info.phase === 'finished') return { kind: 'ended', on: info.endsOn }
  const first = info.steps[0]
  if (info.phase === 'before') {
    return first && info.next
      ? { kind: 'start', on: info.startsOn, days: info.next.daysAway, to: first }
      : { kind: 'none' }
  }
  const next = info.next
  if (!next) return { kind: 'none' }
  const to = next.stepIndex === null ? undefined : info.steps[next.stepIndex]
  switch (next.kind) {
    case 'end':
    case 'rest':
      return { kind: next.kind, on: next.on, days: next.daysAway }
    case 'same':
      return { kind: 'same', on: next.on, days: next.daysAway, step: (next.stepIndex ?? 0) + 1 }
    default:
      return to
        ? { kind: next.kind, on: next.on, days: next.daysAway, to }
        : { kind: 'end', on: next.on, days: next.daysAway }
  }
}
