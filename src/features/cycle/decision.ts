/**
 * The weekly decision: when the dose is about to change, the person says whether to go
 * ahead or to stay a week longer. Which change needs an answer, what each answer does to
 * the plan and the key that remembers "dealt with". Pure; see decision.test.ts.
 */
import { differenceInCalendarDays, format, startOfDay } from 'date-fns'
import { changeKind, DECISION_DAYS, type CycleInfo, type CycleStep } from '@/domain/dosing/cycle'

export type DecisionKind =
  /** The dose goes up: go ahead, or hold one more week. */
  | 'increase'
  /** The dosing weeks are over and a pause begins. */
  | 'rest'
  /** A pause ends and dosing resumes. */
  | 'resume'
  /** The last step is about to end. */
  | 'end'
  /** The plan has ended and nothing follows. */
  | 'finished'

export interface CycleDecision {
  kind: DecisionKind
  /** `ahead`: the change is still to come; `today`: the new step starts today. */
  timing: 'ahead' | 'today'
  /** The day the change takes (took) effect; the end of the plan for `end` and `finished`. */
  on: Date
  /** Days until `on`; 0 when it is today. */
  daysAway: number
  /** The step the plan leaves. */
  from: CycleStep | null
  /** The step it moves to; null when the plan ends. */
  to: CycleStep | null
  /** The step that one more week is added to; null when this cannot be held. */
  holdIndex: number | null
}

/** Key under which "dealt with" is remembered (alert_dismissals). */
export function decisionKey(protocolId: string, d: Pick<CycleDecision, 'to' | 'on'>): string {
  return d.to
    ? `step:${protocolId}:${d.to.index}`
    : `end:${protocolId}:${format(d.on, 'yyyy-MM-dd')}`
}

/**
 * What needs the person's answer today, if anything. A change within `DECISION_DAYS` asks
 * for it, and so does the day the new step starts (the shot itself is that morning). With
 * `focused` (they came from the notification) any coming change is shown.
 */
export function cycleDecision(
  info: CycleInfo,
  now: Date,
  { focused = false }: { focused?: boolean } = {},
): CycleDecision | null {
  if (info.phase === 'before') return null
  const today = startOfDay(now)

  if (info.phase === 'finished') {
    return {
      kind: 'finished',
      timing: 'today',
      on: info.endsOn ?? today,
      daysAway: 0,
      from: info.steps.at(-1) ?? null,
      to: null,
      holdIndex: null,
    }
  }

  const step = info.step
  if (!step) return null

  const prev = info.steps[step.index - 1]
  if (prev && differenceInCalendarDays(today, step.startsOn) === 0) {
    const kind = changeKind(prev, step)
    if (kind === 'increase' || kind === 'rest' || kind === 'resume') {
      return {
        kind,
        timing: 'today',
        on: step.startsOn,
        daysAway: 0,
        from: prev,
        to: step,
        holdIndex: kind === 'resume' ? null : prev.index,
      }
    }
  }

  const next = info.next
  if (!next || !(focused || next.daysAway <= DECISION_DAYS)) return null
  if (next.kind === 'end') {
    return {
      kind: 'end',
      timing: 'ahead',
      on: next.on,
      daysAway: next.daysAway,
      from: step,
      to: null,
      holdIndex: null,
    }
  }
  const to = next.stepIndex === null ? undefined : info.steps[next.stepIndex]
  if (!to || (next.kind !== 'increase' && next.kind !== 'rest' && next.kind !== 'resume')) {
    return null
  }
  return {
    kind: next.kind,
    timing: 'ahead',
    on: next.on,
    daysAway: next.daysAway,
    from: step,
    to,
    holdIndex: next.kind === 'resume' ? null : step.index,
  }
}
