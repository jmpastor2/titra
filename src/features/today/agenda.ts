/**
 * Today's agenda across every active protocol: one row per administration, with the
 * compounds drawn together in it and its state. Pure, unit-tested.
 */
import type { DoseRow, ProtocolRow } from '@/data/database.types'
import { toDoseEvent, toProtocolLike } from '@/data/mappers'
import { dayAgenda, type AgendaStatus } from '@/domain/dosing/schedule'
import type { StackComponent } from '@/domain/types'

export interface TodayItem {
  key: string
  protocol: ProtocolRow
  at: Date
  status: AgendaStatus
  takenAt: Date | null
  /** Every compound in this administration, primary first, with its dose in mg. */
  doses: StackComponent[]
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
    for (const item of dayAgenda(pl, history, now)) {
      items.push({
        key: `${protocol.id}:${item.at.getTime()}`,
        protocol,
        at: item.at,
        status: item.status,
        takenAt: item.takenAt,
        doses: [
          { compoundId: protocol.compound_id, doseMg: item.doseMg },
          ...(pl.components ?? []),
        ],
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
