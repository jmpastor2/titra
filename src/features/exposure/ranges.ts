/**
 * The time ranges of the level charts (7 d / 4 w / 12 w / cycle): whole local days, with a
 * few days ahead so what comes next is on the chart. Pure; see ranges.test.ts.
 */
import { addDays, parseISO, startOfDay } from 'date-fns'
import { cycleInfo } from '@/domain/dosing/cycle'
import type { DoseEvent, ProtocolLike } from '@/domain/types'

export type RangeKey = '7d' | '4w' | '12w' | 'cycle'
export const RANGES: readonly RangeKey[] = ['7d', '4w', '12w', 'cycle']

export interface TimeWindow {
  from: Date
  to: Date
}

/** Days shown before today and after it (the end is the start of that later day). */
const SPAN: Record<Exclude<RangeKey, 'cycle'>, { back: number; ahead: number }> = {
  '7d': { back: 6, ahead: 2 },
  '4w': { back: 27, ahead: 5 },
  '12w': { back: 83, ahead: 8 },
}
/** A cycle view never reaches further back than this, or past a year in all. */
const CYCLE_BACK_DAYS = 182
const CYCLE_MAX_DAYS = 366

/**
 * The window of the dose timeline. "Cycle" runs from the start of the protocol to its end
 * (two weeks past today when it has none, the last four weeks when there is no protocol).
 */
export function timelineWindow(
  range: RangeKey,
  now: Date,
  protocol: ProtocolLike | null,
): TimeWindow {
  const today = startOfDay(now)
  if (range !== 'cycle') {
    const { back, ahead } = SPAN[range]
    return { from: addDays(today, -back), to: addDays(today, ahead) }
  }
  const info = protocol ? cycleInfo(protocol, now) : null
  const earliest = addDays(today, -CYCLE_BACK_DAYS)
  const startsOn = info?.startsOn ?? addDays(today, -27)
  const from = startsOn > earliest ? startsOn : earliest
  const end = info?.endsOn ?? addDays(today, 14)
  const floor = addDays(from, 7).getTime()
  const ceiling = addDays(from, CYCLE_MAX_DAYS).getTime()
  return { from, to: new Date(Math.min(Math.max(end.getTime(), floor), ceiling)) }
}

/** Never crop a window to less than this, so the marks have room and the axis still reads. */
const MIN_SPAN_DAYS = 7

/** When something first happened: the protocol's start or the first dose, whichever is earlier. */
export function firstActivity(
  protocol: ProtocolLike | null,
  history: readonly Pick<DoseEvent, 'at'>[],
): Date | null {
  const times = [
    protocol?.startDate ? startOfDay(parseISO(protocol.startDate)).getTime() : null,
    history[0]?.at.getTime() ?? null,
  ].filter((t): t is number => t !== null && Number.isFinite(t))
  return times.length ? new Date(Math.min(...times)) : null
}

/**
 * The window with its empty beginning cut off: a protocol or a first dose that starts later
 * than the range does puts the chart's start a day before it, so a young regimen is not lost
 * in a long axis.
 */
export function cropToActivity(win: TimeWindow, first: Date | null): TimeWindow {
  if (!first) return win
  const start = addDays(startOfDay(first), -1)
  if (start <= win.from) return win
  const latest = addDays(win.to, -MIN_SPAN_DAYS)
  return { from: start < latest ? start : latest, to: win.to }
}

/** The projection of the 4-week view stretches to the next dose change when it is this close. */
const MAX_PROJECTION_DAYS = 35
const DEFAULT_PROJECTION_DAYS = 14

/**
 * The window of the exposure curve: the history it draws and how far the projection runs.
 * The projection of the default view is long enough to reach the next titration step.
 */
export function curveWindow(
  range: RangeKey,
  now: Date,
  protocol: ProtocolLike | null,
  daysToNextStep: number | null,
): TimeWindow {
  const day = 86_400_000
  const at = (days: number) => new Date(now.getTime() + days * day)
  if (range === '7d') return { from: at(-7), to: at(7) }
  if (range === '12w') return { from: at(-84), to: at(28) }
  if (range === '4w') {
    const reach =
      daysToNextStep !== null && daysToNextStep >= DEFAULT_PROJECTION_DAYS - 3
        ? Math.min(MAX_PROJECTION_DAYS, Math.max(DEFAULT_PROJECTION_DAYS, daysToNextStep + 7))
        : DEFAULT_PROJECTION_DAYS
    return { from: at(-28), to: at(reach) }
  }
  const w = timelineWindow('cycle', now, protocol)
  // The curve needs a look ahead even when the plan ends today.
  const to = new Date(Math.max(w.to.getTime(), at(14).getTime()))
  return { from: w.from, to }
}
