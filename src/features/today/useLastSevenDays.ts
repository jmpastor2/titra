import { useMemo } from 'react'
import type { DoseRow, ProtocolRow } from '@/data/database.types'
import { summariseWeek, weekPlanVsActual } from '@/features/doses/week'
import { dayVerdict, streakOf, windowStarts, type DayVerdict } from './kpis'

/** How far back the streak looks: twelve weeks. */
const STREAK_WEEKS = 12

/**
 * The last seven days at a glance, one row per protocol and one column per day, and how the
 * days before them went: the streak of days with every dose taken and the verdict of each of
 * the seven days.
 */
export function useLastSevenDays(
  protocols: readonly ProtocolRow[],
  doses: readonly DoseRow[],
  now: Date,
) {
  return useMemo(() => {
    const active = protocols.filter((p) => p.status === 'active')
    // Oldest window first, so the days run oldest to newest and the last seven end today.
    const windows = windowStarts(now, STREAK_WEEKS)
      .toReversed()
      .map((from) => weekPlanVsActual(active, doses, from, now))
    const days = windows.at(-1) ?? []
    const trail: DayVerdict[] = days.map(dayVerdict)
    return { days, summary: summariseWeek(days), streak: streakOf(windows.flat()), trail }
  }, [protocols, doses, now])
}
