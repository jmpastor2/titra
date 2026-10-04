/**
 * The changes people make to a plan they are following (stay another week on this dose,
 * move up a week sooner, change this step's dose), worked out before they are made so a
 * sheet can show "before → after" and the change can be undone. Builds on stepEdit.ts.
 * Pure; see stepChange.test.ts.
 */
import { cycleInfo, type CycleChange, type CycleInfo } from '@/domain/dosing/cycle'
import { hasFiniteDuration, holdStep, moveUpStep, setStepDose } from '@/domain/dosing/stepEdit'
import type { ProtocolLike, ScheduleStep, StackComponent } from '@/domain/types'

const round6 = (n: number) => Math.round(n * 1e6) / 1e6
const copy = (steps: readonly ScheduleStep[]): ScheduleStep[] => steps.map((s) => ({ ...s }))

/** Index of the step in force today; null before the start, after the end and without steps. */
export function currentStepIndex(info: CycleInfo | null): number | null {
  return info?.step?.index ?? null
}

export type StepAction =
  | { kind: 'hold' }
  | { kind: 'moveUp' }
  /** The dose of the step in force, from this week on. */
  | { kind: 'setDose'; doseMg: number }

/** What the plan becomes: the steps and the doses of the stack that rides with them. */
export interface PlanEdit {
  steps: ScheduleStep[]
  components: StackComponent[]
}

/** Stack doses scaled by the same factor as the primary: a blend keeps its proportion. */
export function scaleStack(components: readonly StackComponent[], ratio: number): StackComponent[] {
  return components.map((c) => ({ ...c, doseMg: round6(c.doseMg * ratio) }))
}

/** Whether a step already has weeks behind it that a split could leave as they were. */
export function canSplitAt(step: ScheduleStep, weeksBehind: number): boolean {
  const total = step.durationWeeks ?? null
  return weeksBehind > 0 && (total === null || weeksBehind < total)
}

/**
 * A step cut after the weeks already lived: those weeks keep `behindDoseMg`, the rest keeps
 * the step as it is now. Both parts carry the step's days, label and everything else.
 */
export function splitStep(
  step: ScheduleStep,
  weeksBehind: number,
  behindDoseMg: number,
): [ScheduleStep, ScheduleStep] {
  const total = step.durationWeeks ?? null
  return [
    { ...step, doseMg: behindDoseMg, durationWeeks: weeksBehind },
    { ...step, durationWeeks: total === null ? null : total - weeksBehind },
  ]
}

/**
 * Change the dose of a step that already started without touching the weeks behind us: the
 * weeks already lived keep the old dose in a step of their own, the rest takes the new one.
 * Before the step's second week there is nothing behind it, so it is a plain dose change.
 */
export function setDoseFromThisWeek(
  steps: readonly ScheduleStep[],
  index: number,
  weeksElapsed: number,
  doseMg: number,
): ScheduleStep[] {
  const step = steps[index]
  if (!step || step.pause) return copy(steps)
  if (!canSplitAt(step, weeksElapsed)) return setStepDose(steps, index, doseMg)
  const [behind, ahead] = splitStep({ ...step, doseMg }, weeksElapsed, step.doseMg)
  return [...copy(steps.slice(0, index)), behind, ahead, ...copy(steps.slice(index + 1))]
}

/**
 * Apply an action to the step in force today. Null when it does not apply: no step in
 * force, a step without an end date to move (or a single week to shorten), or a dose that
 * is not a change.
 */
export function applyStepAction(
  protocol: ProtocolLike,
  now: Date,
  action: StepAction,
): PlanEdit | null {
  const info = cycleInfo(protocol, now)
  const index = currentStepIndex(info)
  const step = index === null ? undefined : protocol.steps[index]
  if (!info || index === null || !step) return null
  const components = protocol.components ?? []

  switch (action.kind) {
    case 'hold':
      return hasFiniteDuration(step)
        ? { steps: holdStep(protocol.steps, index), components: [...components] }
        : null
    case 'moveUp':
      return hasFiniteDuration(step) && (step.durationWeeks ?? 0) > 1
        ? { steps: moveUpStep(protocol.steps, index), components: [...components] }
        : null
    case 'setDose': {
      if (step.pause || !(action.doseMg > 0) || Math.abs(action.doseMg - step.doseMg) < 1e-9) {
        return null
      }
      const behind = info.weekInStep - 1
      if (behind > 0) {
        // Past weeks keep their dose; the stack follows through the first dosing step's base.
        return {
          steps: setDoseFromThisWeek(protocol.steps, index, behind, action.doseMg),
          components: [...components],
        }
      }
      const first = protocol.steps.findIndex((s) => !s.pause && s.doseMg > 0)
      return {
        steps: setStepDose(protocol.steps, index, action.doseMg),
        // The stack is entered for the first dosing step: changing it keeps the proportion.
        components:
          index === first ? scaleStack(components, action.doseMg / step.doseMg) : [...components],
      }
    }
  }
}

export interface DateChange {
  before: Date | null
  after: Date | null
}

export interface ChangeSummary {
  /** The next dose change: when and what it is, before and after. */
  next: { before: CycleChange | null; after: CycleChange | null }
  /** When the plan ends (null: open-ended). */
  end: DateChange
  /** Weeks of the whole plan, rest included (null: open-ended). */
  totalWeeks: { before: number | null; after: number | null }
  /** Primary dose in force today in mg (null in a rest or outside the plan). */
  doseNow: { before: number | null; after: number | null }
  /** Steps that start on another day, in plan order. */
  shifted: { index: number; pause: boolean; label?: string; from: Date; to: Date }[]
}

const doseNowOf = (info: CycleInfo) => (info.step && !info.step.pause ? info.step.doseMg : null)

/** What a change does to the dates and the dose today, before it is made. */
export function describeChange(
  before: ProtocolLike,
  after: ProtocolLike,
  now: Date,
): ChangeSummary | null {
  const a = cycleInfo(before, now)
  const b = cycleInfo(after, now)
  if (!a || !b) return null
  const sameShape = a.steps.length === b.steps.length
  return {
    next: { before: a.next, after: b.next },
    end: { before: a.endsOn, after: b.endsOn },
    totalWeeks: { before: a.totalWeeks, after: b.totalWeeks },
    doseNow: { before: doseNowOf(a), after: doseNowOf(b) },
    shifted: sameShape
      ? b.steps.flatMap((s, i) => {
          const was = a.steps[i]
          return was && was.startsOn.getTime() !== s.startsOn.getTime()
            ? [
                {
                  index: i,
                  pause: s.pause,
                  ...(s.label ? { label: s.label } : {}),
                  from: was.startsOn,
                  to: s.startsOn,
                },
              ]
            : []
        })
      : [],
  }
}

export type ChangeRow =
  | { kind: 'next'; before: Date; after: Date }
  | { kind: 'end'; before: Date; after: Date }
  | { kind: 'weeks'; before: number; after: number }
  | { kind: 'dose'; before: number | null; after: number | null }

const sameDay = (a: Date, b: Date) => a.getTime() === b.getTime()

/** What to show as "before → after": only what a change actually moves. */
export function changeRows(summary: ChangeSummary): ChangeRow[] {
  const { next, end, totalWeeks, doseNow } = summary
  const rows: ChangeRow[] = []
  if (next.before && next.after && !sameDay(next.before.on, next.after.on)) {
    rows.push({ kind: 'next', before: next.before.on, after: next.after.on })
  }
  if (end.before && end.after && !sameDay(end.before, end.after)) {
    rows.push({ kind: 'end', before: end.before, after: end.after })
  }
  if (
    totalWeeks.before !== null &&
    totalWeeks.after !== null &&
    totalWeeks.before !== totalWeeks.after
  ) {
    rows.push({ kind: 'weeks', before: totalWeeks.before, after: totalWeeks.after })
  }
  if (doseNow.before !== doseNow.after) {
    rows.push({ kind: 'dose', before: doseNow.before, after: doseNow.after })
  }
  return rows
}

/** The protocol with an edit applied; the start, times and everything else stay. */
export function withEdit(protocol: ProtocolLike, edit: PlanEdit): ProtocolLike {
  return { ...protocol, steps: edit.steps, components: edit.components }
}

export interface ActionPreview {
  edit: PlanEdit
  after: ProtocolLike
  summary: ChangeSummary
}

/** An action together with what it would do, or null when it does not apply. */
export function previewAction(
  protocol: ProtocolLike,
  now: Date,
  action: StepAction,
): ActionPreview | null {
  const edit = applyStepAction(protocol, now, action)
  if (!edit) return null
  const after = withEdit(protocol, edit)
  const summary = describeChange(protocol, after, now)
  return summary ? { edit, after, summary } : null
}
