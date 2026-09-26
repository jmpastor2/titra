/**
 * Today's agenda across every active protocol: one row per administration, with the
 * compounds drawn together in it and its state. Pure, unit-tested.
 */
import type { DoseRow, ProtocolRow } from '@/data/database.types'
import { toDoseEvent, toProtocolLike } from '@/data/mappers'
import { addDays, startOfDay } from 'date-fns'
import {
  componentsAt,
  currentStep,
  dayAgenda,
  matchOccurrences,
  matchToleranceH,
  normaliseTimes,
  scheduledDoses,
  type AgendaStatus,
} from '@/domain/dosing/schedule'
import type { StackComponent } from '@/domain/types'

export interface TodayItem {
  key: string
  protocol: ProtocolRow
  at: Date
  status: AgendaStatus
  takenAt: Date | null
  /** Every compound in this administration, primary first, with its dose in mg. */
  doses: StackComponent[]
  /** Logged today although no administration of this protocol was planned for it. */
  extra?: boolean
}

const STATUS_ORDER: Record<AgendaStatus, number> = {
  overdue: 0,
  due: 1,
  upcoming: 2,
  missed: 3,
  taken: 4,
}

export function buildToday(
  protocols: readonly ProtocolRow[],
  doses: readonly DoseRow[],
  now: Date,
): TodayItem[] {
  const items: TodayItem[] = []
  for (const protocol of protocols) {
    if (protocol.status !== 'active') continue
    const pl = toProtocolLike(protocol)
    // Adherence is tracked on the primary compound; stack rows share its timestamp.
    const history = doses
      .filter(
        (d) =>
          d.compound_id === protocol.compound_id &&
          (!d.protocol_id || d.protocol_id === protocol.id),
      )
      .map(toDoseEvent)
    const agenda = dayAgenda(pl, history, now)
    for (const item of agenda) {
      items.push({
        key: `${protocol.id}:${item.at.getTime()}`,
        protocol,
        at: item.at,
        status: item.status,
        takenAt: item.takenAt,
        doses: [
          { compoundId: protocol.compound_id, doseMg: item.doseMg },
          ...componentsAt(pl, item.doseMg),
        ],
      })
    }

    // Doses logged today that belong to no planned administration: a rest-day shot, a
    // second one… A late dose after midnight still belongs to yesterday's evening.
    const dayStart = startOfDay(now)
    const dayEnd = addDays(dayStart, 1)
    const tolH = matchToleranceH(currentStep(pl, now)?.step, normaliseTimes(pl.times))
    const around = matchOccurrences(
      scheduledDoses(pl, addDays(dayStart, -1), addDays(dayEnd, 1)),
      history,
      tolH,
    )
    const accounted = new Set(
      [...around.map((o) => o.takenAt), ...agenda.map((a) => a.takenAt)]
        .filter((d): d is Date => d !== null)
        .map((d) => d.getTime()),
    )
    for (const d of history) {
      if (d.at < dayStart || d.at >= dayEnd || accounted.has(d.at.getTime())) continue
      items.push({
        key: `${protocol.id}:extra:${d.at.getTime()}`,
        protocol,
        at: d.at,
        status: 'taken',
        takenAt: d.at,
        doses: [{ compoundId: protocol.compound_id, doseMg: d.mg }, ...componentsAt(pl, d.mg)],
        extra: true,
      })
    }
  }
  return items.toSorted((a, b) => a.at.getTime() - b.at.getTime())
}

/** The item that needs the user's attention first: overdue, then due, then the next upcoming. */
export function focusItem(items: readonly TodayItem[]): TodayItem | null {
  return (
    items
      .filter((i) => i.status !== 'taken' && i.status !== 'missed')
      .toSorted(
        (a, b) =>
          STATUS_ORDER[a.status] - STATUS_ORDER[b.status] || a.at.getTime() - b.at.getTime(),
      )[0] ?? null
  )
}

export interface DaySummary {
  total: number
  taken: number
  pending: number
  missed: number
}

export function summarise(items: readonly TodayItem[]): DaySummary {
  return {
    total: items.length,
    taken: items.filter((i) => i.status === 'taken').length,
    pending: items.filter(
      (i) => i.status === 'due' || i.status === 'upcoming' || i.status === 'overdue',
    ).length,
    missed: items.filter((i) => i.status === 'missed').length,
  }
}
