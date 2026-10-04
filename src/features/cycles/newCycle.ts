/**
 * Starting the next cycle from the one that ended, and planning the rest in between.
 * The new cycle is a copy of the old protocol (substances, days, hours, steps) with a
 * new start date, so nothing is typed again and the old one stays as history.
 * Pure; see newCycle.test.ts.
 */
import { addDays, isValid, parseISO, startOfDay } from 'date-fns'
import type { Database, Json, ProtocolRow } from '@/data/database.types'
import { toProtocolLike } from '@/data/mappers'
import type { CycleInfo } from '@/domain/dosing/cycle'
import { splitNightTime } from '@/domain/dosing/schedule'
import { adjustStepWeeks, hasFiniteDuration } from '@/domain/dosing/stepEdit'
import type { ProtocolLike, ScheduleStep } from '@/domain/types'
import type { CycleView } from './model'

export type ProtocolInsert = Database['public']['Tables']['protocols']['Insert']

/* ------------------------------------------------------------------ new cycle */

/** The Monday on or after `from`: today when it already is one. */
export function nextMonday(from: Date): Date {
  const day = startOfDay(from)
  return addDays(day, (8 - day.getDay()) % 7)
}

export const isStartDate = (value: string): boolean =>
  /^\d{4}-\d{2}-\d{2}$/.test(value) && isValid(parseISO(value))

export interface StartChoice {
  /** Index into the previous plan's steps. */
  stepIndex: number
  doseMg: number
  /** The plan's first dosing step: starting over. */
  first: boolean
  /** The last dosing step the previous cycle reached: where it was left. */
  leftOff: boolean
}

/** The dosing steps the new cycle may begin with. */
export function startChoices(view: Pick<CycleView, 'info' | 'stopsOn'>, now: Date): StartChoice[] {
  const dosing = view.info.steps.filter((s) => !s.pause)
  const end = view.stopsOn ?? addDays(startOfDay(now), 1)
  const reached = dosing.findLast((s) => s.startsOn < end) ?? dosing[0]
  return dosing.map((s, i) => ({
    stepIndex: s.index,
    doseMg: s.doseMg,
    first: i === 0,
    leftOff: s === reached,
  }))
}

/** The previous plan from `fromStep` on: earlier steps are not repeated. */
export function nextCycleSteps(steps: readonly ScheduleStep[], fromStep: number): ScheduleStep[] {
  return steps.slice(fromStep).map((s) => structuredClone(s))
}

/** The new cycle as the schedule engine sees it, to preview its dates before saving. */
export function nextCycleLike(
  previous: ProtocolRow,
  startDate: string,
  fromStep: number,
): ProtocolLike {
  const like = toProtocolLike(previous)
  return { ...like, startDate, steps: nextCycleSteps(like.steps, fromStep) }
}

/**
 * The row that starts the next cycle: the same fields the protocol editor writes, copied
 * from the previous protocol, active and starting on `startDate`.
 */
export function buildNextCycle(args: {
  previous: ProtocolRow
  userId: string
  startDate: string
  fromStep: number
}): ProtocolInsert {
  const { previous, userId, startDate, fromStep } = args
  const next = nextCycleLike(previous, startDate, fromStep)
  return {
    patient_id: previous.patient_id,
    created_by: userId,
    compound_id: previous.compound_id,
    name: previous.name,
    route: previous.route,
    unit: previous.unit,
    start_date: startDate,
    // Postgres `time` has no 25:00: the clock time goes there, the full value in `times`.
    time_of_day: splitNightTime(next.times[0] ?? '09:00').clock,
    times: next.times,
    steps: next.steps as unknown as Json,
    components: (next.components ?? []) as unknown as Json,
    template_id: previous.template_id,
    notes: previous.notes,
    status: 'active',
  }
}

/** Statuses the previous cycle is closed from; a history row is left as it is. */
export const closesOnNewCycle = (status: ProtocolRow['status']): boolean =>
  status === 'active' || status === 'paused'

/* ------------------------------------------------------------------ rest */

/**
 * The rest the person usually takes between cycles, in their own words: 4–8 weeks. It is
 * shown as a reference and nothing enforces it; they decide how long each rest is.
 */
export const REST_GUIDE = { minWeeks: 4, maxWeeks: 8 } as const
/** A sanity cap on the rest, far beyond any guide. */
export const MAX_REST_WEEKS = 52

export interface RestPlan {
  stepIndex: number
  weeks: number
  startsOn: Date
  endsOn: Date
}

/** The rest a plan ends in: its last step, when that is a pause with a set length. */
export function trailingRest(info: Pick<CycleInfo, 'steps'>): RestPlan | null {
  const last = info.steps.at(-1)
  if (!last?.pause || last.weeks === null || last.endsOn === null) return null
  return { stepIndex: last.index, weeks: last.weeks, startsOn: last.startsOn, endsOn: last.endsOn }
}

/**
 * Lengthen or shorten the rest the plan ends in by whole weeks: never below one week or
 * above `MAX_REST_WEEKS`. A plan that does not end in a timed rest comes back unchanged.
 */
export function adjustRest(steps: readonly ScheduleStep[], deltaWeeks: number): ScheduleStep[] {
  const index = steps.length - 1
  if (!steps[index]?.pause || !hasFiniteDuration(steps[index])) {
    return steps.map((s) => structuredClone(s))
  }
  // `adjustStepWeeks` hands back copies, so capping the rest in place touches nothing given.
  const adjusted = adjustStepWeeks(steps, index, deltaWeeks)
  const rest = adjusted[index]
  if (rest && (rest.durationWeeks ?? 0) > MAX_REST_WEEKS) rest.durationWeeks = MAX_REST_WEEKS
  return adjusted
}

/**
 * The update that saves new steps on a protocol. The save hook takes the required columns
 * of the row along with what changes; they are written back as they are.
 */
export function stepsUpdate(
  row: ProtocolRow,
  steps: readonly ScheduleStep[],
): ProtocolInsert & { id: string } {
  return {
    id: row.id,
    patient_id: row.patient_id,
    created_by: row.created_by,
    compound_id: row.compound_id,
    name: row.name,
    start_date: row.start_date,
    steps: steps as unknown as Json,
  }
}
