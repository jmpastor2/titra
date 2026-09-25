/**
 * The week as planned against what was actually injected: for every scheduled
 * administration, when it was due, when (if) it was taken and how far off. Pure.
 */
import { addDays, startOfDay } from 'date-fns'
import type { DoseRow, ProtocolRow } from '@/data/database.types'
import { toDoseEvent, toProtocolLike } from '@/data/mappers'
import {
  currentStep,
  matchOccurrences,
  matchToleranceH,
  normaliseTimes,
  scheduledDoses,
} from '@/domain/dosing/schedule'

/** Within this of the planned time counts as on time. */
export const ON_TIME_MIN = 30

export type WeekStatus = 'onTime' | 'late' | 'early' | 'missed' | 'due' | 'upcoming'

export interface WeekCell {
  protocol: ProtocolRow
  plannedAt: Date
  takenAt: Date | null
  /** Minutes taken after (+) or before (−) the planned time. */
  deltaMin: number | null
  status: WeekStatus
}

export interface WeekDay {
  day: Date
  cells: WeekCell[]
}

export interface WeekSummary {
  planned: number
  taken: number
  onTime: number
  offTime: number
  missed: number
}

export function weekPlanVsActual(
  protocols: readonly ProtocolRow[],
  doses: readonly DoseRow[],
  weekStart: Date,
  now: Date,
): WeekDay[] {
  const from = startOfDay(weekStart)
  const to = addDays(from, 7)
  const days: WeekDay[] = Array.from({ length: 7 }, (_, i) => ({
    day: addDays(from, i),
    cells: [],
  }))

  for (const protocol of protocols) {
    if (protocol.status === 'archived') continue
    const pl = toProtocolLike(protocol)
    const tolH = matchToleranceH(currentStep(pl, from)?.step, normaliseTimes(pl.times))
    const history = doses
      .filter(
        (d) =>
          d.compound_id === protocol.compound_id &&
          (!d.protocol_id || d.protocol_id === protocol.id),
      )
      .map(toDoseEvent)
    for (const o of matchOccurrences(scheduledDoses(pl, from, to), history, tolH)) {
      const deltaMin = o.takenAt
        ? Math.round((o.takenAt.getTime() - o.at.getTime()) / 60_000)
        : null
      let status: WeekStatus
      if (deltaMin !== null)
        status = Math.abs(deltaMin) <= ON_TIME_MIN ? 'onTime' : deltaMin > 0 ? 'late' : 'early'
      else if (o.at.getTime() + tolH * 3_600_000 < now.getTime()) status = 'missed'
      else status = o.at <= now ? 'due' : 'upcoming'
      const cell = { protocol, plannedAt: o.at, takenAt: o.takenAt, deltaMin, status }
      days[Math.floor((startOfDay(o.at).getTime() - from.getTime()) / 86_400_000)]?.cells.push(cell)
    }
  }
  for (const d of days) d.cells.sort((a, b) => a.plannedAt.getTime() - b.plannedAt.getTime())
  return days
}

export function summariseWeek(days: readonly WeekDay[]): WeekSummary {
  const cells = days.flatMap((d) => d.cells).filter((c) => c.status !== 'upcoming')
  return {
    planned: cells.length,
    taken: cells.filter((c) => c.takenAt).length,
    onTime: cells.filter((c) => c.status === 'onTime').length,
    offTime: cells.filter((c) => c.status === 'late' || c.status === 'early').length,
    missed: cells.filter((c) => c.status === 'missed').length,
  }
}
