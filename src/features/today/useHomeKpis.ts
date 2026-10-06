import { useMemo } from 'react'
import type { DoseRow, ProtocolRow } from '@/data/database.types'
import { useCycleInfos } from '@/features/cycle/useCycleInfos'
import { weekPlanVsActual } from '@/features/doses/week'
import type { RestockLine } from '@/features/inventory/vials'
import { adherenceKpi, coverKpi, cycleKpi, streakOf, streakTicks, windowStarts } from './kpis'

/** How far back the streak looks: twelve weeks. */
const STREAK_WEEKS = 12
/** Days drawn under the streak. */
export const TICK_DAYS = 14

/**
 * The four figures of Hoy from the shared queries: the streak with its last two weeks, the
 * adherence of 28 days against the 28 before, the cycle in course and the days of supply.
 * `restock` is null where the supply is not the viewer's to see (a shared view).
 */
export function useHomeKpis(
  protocols: readonly ProtocolRow[],
  doses: readonly DoseRow[],
  restock: readonly RestockLine[] | null,
  now: Date,
) {
  const cycles = useCycleInfos(now)

  const streak = useMemo(() => {
    const active = protocols.filter((p) => p.status === 'active')
    // Oldest window first, so the days run oldest to newest and the last one is today.
    const days = windowStarts(now, STREAK_WEEKS)
      .toReversed()
      .flatMap((from) => weekPlanVsActual(active, doses, from, now))
    return { days: streakOf(days), ticks: streakTicks(days.slice(-TICK_DAYS)) }
  }, [protocols, doses, now])

  const adherence = useMemo(() => adherenceKpi(protocols, doses, now), [protocols, doses, now])
  const cycle = useMemo(() => cycleKpi(cycles), [cycles])
  const cover = useMemo(() => (restock ? coverKpi(restock, now) : null), [restock, now])

  return { streak, adherence, cycle, cover }
}

export type HomeKpis = ReturnType<typeof useHomeKpis>
