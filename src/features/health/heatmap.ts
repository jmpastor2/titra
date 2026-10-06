/**
 * The adherence calendar: the last N weeks as a grid of days, weeks across and Monday to Sunday
 * down, each day tinted by the share of its scheduled doses that were taken. Pure: the days come
 * from `adherenceDays`, callers pass `now`.
 */
import { addDays, differenceInCalendarDays, startOfDay, startOfWeek } from 'date-fns'
import type { AdherenceDay } from './consistency'

/** Weeks the calendar shows. */
export const HEAT_WEEKS = 12

/**
 * How much of a day's scheduled doses were taken:
 * - none: nothing was due (or the day has not come);
 * - missed: something was due and none of it was taken;
 * - low: under half; mid: half or more but not all; full: everything.
 */
export type HeatLevel = 'none' | 'missed' | 'low' | 'mid' | 'full'

export function heatLevel(taken: number, expected: number): HeatLevel {
  if (!(expected > 0)) return 'none'
  const share = taken / expected
  if (share >= 1) return 'full'
  if (!(share > 0)) return 'missed'
  return share < 0.5 ? 'low' : 'mid'
}

export interface HeatCell {
  day: Date
  taken: number
  expected: number
  level: HeatLevel
  /** A day of the current week that has not come yet: drawn as an empty slot. */
  future: boolean
  today: boolean
}

export interface HeatGrid {
  /** Oldest week first; each has seven cells, Monday first. */
  weeks: HeatCell[][]
}

const WEEK_OPTIONS = { weekStartsOn: 1 } as const

/** The Monday of the first week of the calendar. */
export function heatStart(now: Date, weeks = HEAT_WEEKS): Date {
  return addDays(startOfWeek(now, WEEK_OPTIONS), -(weeks - 1) * 7)
}

/** How many days ending today `adherenceDays` must cover for the calendar to be complete. */
export function heatSpanDays(now: Date, weeks = HEAT_WEEKS): number {
  return differenceInCalendarDays(now, heatStart(now, weeks)) + 1
}

export function heatGrid(days: readonly AdherenceDay[], now: Date, weeks = HEAT_WEEKS): HeatGrid {
  const byDay = new Map(days.map((d) => [startOfDay(d.day).getTime(), d]))
  const today = startOfDay(now).getTime()
  const start = heatStart(now, weeks)
  return {
    weeks: Array.from({ length: weeks }, (_week, w) =>
      Array.from({ length: 7 }, (_day, d): HeatCell => {
        const day = addDays(start, w * 7 + d)
        const time = day.getTime()
        const known = byDay.get(time)
        const future = time > today
        const taken = known?.taken ?? 0
        const expected = known?.expected ?? 0
        return {
          day,
          taken,
          expected,
          level: future ? 'none' : heatLevel(taken, expected),
          future,
          today: time === today,
        }
      }),
    ),
  }
}

/** Where a calendar day sits in the grid, or null when it is outside it. */
export function cellAt(grid: HeatGrid, week: number, weekday: number): HeatCell | null {
  return grid.weeks[week]?.[weekday] ?? null
}

/** The month label of a column: its first day's month, only where the month changes. */
export function monthStarts(grid: HeatGrid): (Date | null)[] {
  return grid.weeks.map((week, i) => {
    const first = week[0]
    if (!first) return null
    const prev = grid.weeks[i - 1]?.[0]
    return !prev || prev.day.getMonth() !== first.day.getMonth() ? first.day : null
  })
}
