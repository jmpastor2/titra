import { addDays, startOfDay } from 'date-fns'
import { useMemo } from 'react'
import type { DoseRow, ProtocolRow } from '@/data/database.types'
import { summariseWeek, weekPlanVsActual } from '@/features/doses/week'

/** The last seven days at a glance: one row per protocol, one column per day. */
export function useLastSevenDays(
  protocols: readonly ProtocolRow[],
  doses: readonly DoseRow[],
  now: Date,
) {
  return useMemo(() => {
    const from = addDays(startOfDay(now), -6)
    const days = weekPlanVsActual(
      protocols.filter((p) => p.status === 'active'),
      doses,
      from,
      now,
    )
    return { days, summary: summariseWeek(days) }
  }, [protocols, doses, now])
}
