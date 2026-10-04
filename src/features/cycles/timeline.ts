/**
 * The cycles on one shared weekly axis: a lane per protocol, a block per step. Geometry
 * is in weeks from the start of the axis (a Monday), so the component only scales it.
 * Pure and locale-free; see timeline.test.ts.
 */
import { addDays, differenceInCalendarDays, max, min, startOfDay, startOfWeek } from 'date-fns'
import type { ProtocolStatus } from '@/data/database.types'
import { cycleCompoundIds, type CycleView } from './model'
import { stepWeeks } from './readout'

const DAY_MS = 86_400_000

/** Cycles that ended before this many weeks ago are left to their cards. */
const PAST_WEEKS = 26
/** Room kept to the right of today, so a plan that ends soon still has air after it. */
const OPEN_AHEAD_WEEKS = 6
/** An open-ended step is drawn at least this long from where it starts. */
const OPEN_MIN_WEEKS = 4

export type BlockState = 'past' | 'current' | 'future'

export interface TimelineBlock {
  key: string
  stepIndex: number
  /** Left edge and width on the axis, in weeks. */
  x: number
  w: number
  /** The step's own dates, not clipped to the axis. */
  startsOn: Date
  endsOn: Date | null
  doseMg: number
  pause: boolean
  /** Open-ended maintenance: drawn to the end of the axis. */
  open: boolean
  /** Dose against the lane's largest, 0–1; 0 for a rest. */
  intensity: number
  state: BlockState
  /** First and last dosing week of the cycle the step covers; null for a rest (`weekTo` also for an open step). */
  weekFrom: number | null
  weekTo: number | null
  /** The step began before the axis does. */
  clipped: boolean
}

export interface RulerWeek {
  x: number
  /** Dosing week of the cycle, null in a rest week. */
  n: number | null
  current: boolean
}

export interface TimelineLane {
  id: string
  name: string
  /** The protocol's primary compound: the lane takes its colour. */
  compoundId: string
  /** Every compound given, primary first. */
  compoundIds: string[]
  status: ProtocolStatus
  ordinal: number
  siblings: number
  blocks: TimelineBlock[]
  /** One mark per week of the cycle: the number to read "where am I" under the blocks. */
  ruler: RulerWeek[]
  /** The step a tap on the lane opens: today's, else the next to come, else the last. */
  focusStep: number
  /** Whole weeks since a cycle that is over stopped; null while it runs or is yet to start. */
  endedWeeksAgo: number | null
}

export interface Timeline {
  /** Monday the axis starts on. */
  start: Date
  weeks: number
  /** Where now falls on the axis, in weeks. */
  today: number
  lanes: TimelineLane[]
  /** One per Monday. */
  ticks: { x: number; date: Date; current: boolean }[]
  /** The ticks where a new month begins. */
  months: { x: number; date: Date }[]
  /** Cycles older than the window, left out of the lanes. */
  hidden: number
}

const weeksBetween = (a: Date, b: Date) => differenceInCalendarDays(b, a) / 7

interface Axis {
  start: Date
  end: Date
  today: Date
}

function buildLane(v: CycleView, axis: Axis): TimelineLane {
  const { steps } = v.info
  const laneEnd = min([v.stopsOn ?? axis.end, axis.end])
  const maxDose = Math.max(0, ...steps.filter((s) => !s.pause).map((s) => s.doseMg))

  const blocks: TimelineBlock[] = []
  const weekRanges = stepWeeks(steps)
  for (const s of steps) {
    const start = max([s.startsOn, axis.start])
    const end = min([s.endsOn ?? axis.end, laneEnd])
    if (differenceInCalendarDays(end, start) <= 0) continue
    blocks.push({
      key: `${v.row.id}:${s.index}`,
      stepIndex: s.index,
      x: weeksBetween(axis.start, start),
      w: weeksBetween(start, end),
      startsOn: s.startsOn,
      endsOn: s.endsOn,
      doseMg: s.doseMg,
      pause: s.pause,
      open: s.endsOn === null,
      intensity: s.pause ? 0 : maxDose > 0 ? s.doseMg / maxDose : 1,
      state: end <= axis.today ? 'past' : start > axis.today ? 'future' : 'current',
      weekFrom: weekRanges[s.index]?.from ?? null,
      weekTo: weekRanges[s.index]?.to ?? null,
      clipped: s.startsOn < axis.start,
    })
  }

  // Week numbers count dosing weeks only, as "week 3 of 12" does; a rest week has none.
  const ruler: RulerWeek[] = []
  let n = 0
  for (let day = v.info.startsOn; day < laneEnd; day = addDays(day, 7)) {
    const rest = steps.findLast((s) => s.startsOn <= day)?.pause ?? false
    if (!rest) n += 1
    if (day >= axis.start) {
      ruler.push({
        x: weeksBetween(axis.start, day),
        n: rest ? null : n,
        current: axis.today >= day && axis.today < addDays(day, 7),
      })
    }
  }

  return {
    id: v.row.id,
    name: v.row.name,
    compoundId: v.row.compound_id,
    compoundIds: cycleCompoundIds(v),
    status: v.row.status,
    ordinal: v.ordinal,
    siblings: v.siblings,
    blocks,
    ruler,
    focusStep:
      blocks.find((b) => b.state === 'current')?.stepIndex ??
      blocks.find((b) => b.state === 'future')?.stepIndex ??
      blocks.at(-1)?.stepIndex ??
      0,
    endedWeeksAgo:
      v.stopsOn && v.stopsOn <= axis.today
        ? Math.floor(differenceInCalendarDays(axis.today, v.stopsOn) / 7)
        : null,
  }
}

/**
 * Lanes for the cycles that overlap the last `PAST_WEEKS` weeks or lie ahead, in the order
 * given. The axis runs from the Monday of the earliest start in view to the end of the
 * latest plan, with room after today; open-ended steps are drawn to its end.
 */
export function buildTimeline(views: readonly CycleView[], now: Date): Timeline | null {
  const today = startOfDay(now)
  const windowStart = addDays(today, -PAST_WEEKS * 7)
  const visible = views.filter((v) => v.stopsOn === null || v.stopsOn > windowStart)
  if (visible.length === 0) return null

  const start = startOfWeek(
    max([windowStart, min([today, ...visible.map((v) => v.info.startsOn)])]),
    { weekStartsOn: 1 },
  )
  const reach = visible.map(
    (v) => v.stopsOn ?? addDays(v.info.steps.at(-1)?.startsOn ?? today, OPEN_MIN_WEEKS * 7),
  )
  const weeks = Math.ceil(
    differenceInCalendarDays(max([addDays(today, OPEN_AHEAD_WEEKS * 7), ...reach]), start) / 7,
  )
  const axis: Axis = { start, end: addDays(start, weeks * 7), today }

  const ticks = Array.from({ length: weeks }, (_, k) => {
    const date = addDays(start, k * 7)
    return { x: k, date, current: today >= date && today < addDays(date, 7) }
  })
  return {
    start,
    weeks,
    today: weeksBetween(start, today) + (now.getTime() - today.getTime()) / (7 * DAY_MS),
    lanes: visible.map((v) => buildLane(v, axis)),
    ticks,
    months: ticks
      .filter((tick, k) => k === 0 || tick.date.getMonth() !== ticks[k - 1]?.date.getMonth())
      .map(({ x, date }) => ({ x, date })),
    hidden: views.length - visible.length,
  }
}
