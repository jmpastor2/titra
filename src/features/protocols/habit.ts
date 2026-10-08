/**
 * The time a person actually takes a protocol, when it differs steadily from the planned one:
 * the plan says 01:00 and the shots go in around 00:15 night after night. Moving the plan
 * there makes the reminders, the "on time" marks and the levels follow real life. Pure; see
 * habit.test.ts.
 */
import { subDays } from 'date-fns'
import type { DoseRow } from '@/data/database.types'
import { toDoseEvent } from '@/data/mappers'
import {
  currentStep,
  matchDoses,
  matchToleranceH,
  normaliseTimes,
  scheduledDoses,
} from '@/domain/dosing/schedule'
import type { ProtocolLike } from '@/domain/types'

/** Doses looked at, newest first. */
const RECENT = 8
/** Fewer than this is not a habit yet. */
const MIN_DOSES = 4
/** A shift smaller than this is just on time. */
const MIN_SHIFT_MIN = 30
/** How close to the typical shift most doses must be for it to be a habit. */
const SPREAD_MIN = 60
/** The suggested time is rounded to this. */
const ROUND_MIN = 15
/** Night times go up to 29:59 (the small hours of the next morning). */
const MAX_MIN = 30 * 60

export interface Habit {
  /** "HH:MM" as stored, past 24:00 for the small hours of a night protocol. */
  time: string
  /** Minutes from the planned time: negative is earlier. */
  shiftMin: number
  /** Doses the habit is read from. */
  doses: number
}

const toMin = (time: string) => {
  const [h = 0, m = 0] = time.split(':').map(Number)
  return h * 60 + m
}
const fromMin = (min: number) =>
  `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`

function median(xs: readonly number[]): number {
  const s = xs.toSorted((a, b) => a - b)
  const mid = Math.floor(s.length / 2)
  return s.length % 2 ? s[mid]! : (s[mid - 1]! + s[mid]!) / 2
}

/** The time the doses of the last weeks suggest, or null when they follow the plan. */
export function habitTime(
  protocol: ProtocolLike,
  doses: readonly DoseRow[],
  now: Date,
): Habit | null {
  const times = normaliseTimes(protocol.times)
  if (times.length !== 1) return null
  const planned = toMin(times[0]!)
  const step = currentStep(protocol, now)?.step
  const events = doses
    .filter((d) => d.compound_id === protocol.compoundId)
    .map(toDoseEvent)
    .filter((e) => e.mg > 0 && e.at <= now)
  const { slots } = matchDoses(
    scheduledDoses(protocol, subDays(now, 28), now),
    events,
    matchToleranceH(step, times),
  )
  const shifts = slots
    .filter((s) => s.takenAt)
    .toSorted((a, b) => b.at.getTime() - a.at.getTime())
    .slice(0, RECENT)
    .map((s) => Math.round((s.takenAt!.getTime() - s.at.getTime()) / 60_000))
  if (shifts.length < MIN_DOSES) return null

  const typical = median(shifts)
  if (Math.abs(typical) < MIN_SHIFT_MIN) return null
  const close = shifts.filter(
    (x) => Math.sign(x) === Math.sign(typical) && Math.abs(x - typical) <= SPREAD_MIN,
  )
  if (close.length < Math.ceil(shifts.length * 0.75)) return null

  const suggested = Math.round((planned + typical) / ROUND_MIN) * ROUND_MIN
  if (suggested < 0 || suggested >= MAX_MIN || suggested === planned) return null
  return { time: fromMin(suggested), shiftMin: suggested - planned, doses: shifts.length }
}
