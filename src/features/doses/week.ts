/**
 * The week as planned against what was actually injected: for every scheduled
 * administration, when it was due, when (if) it was taken and how far off. Pure.
 */
import { addDays, differenceInCalendarDays, startOfDay, startOfWeek } from 'date-fns'
import type { DoseRow, ProtocolRow } from '@/data/database.types'
import { toDoseEvent, toProtocolLike } from '@/data/mappers'
import {
  currentStep,
  matchDoses,
  matchToleranceH,
  normaliseTimes,
  ownerDay,
  scheduledDoses,
} from '@/domain/dosing/schedule'
import type { DoseEvent, ProtocolLike } from '@/domain/types'
import { administrationKey } from './administrations'
import { ON_TIME_MIN } from './delta'

export { ON_TIME_MIN }

export type WeekStatus = 'onTime' | 'late' | 'early' | 'missed' | 'due' | 'upcoming' | 'extra'

export interface WeekCell {
  protocol: ProtocolRow
  plannedAt: Date
  takenAt: Date | null
  /** Minutes taken after (+) or before (−) the planned time. */
  deltaMin: number | null
  status: WeekStatus
  /** Key of the administration (see `administrationKey`) that covers it; absent when none does. */
  doseKey?: string
  /** The day the planned administration belongs to (a night one, the evening before); none for an extra. */
  slotDay?: Date
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

/**
 * The rows that count as a protocol's administrations: its primary compound's, taken under
 * the protocol or logged freely (a dose with no protocol still belongs to the plan by time).
 */
export function protocolDoseRows(protocol: ProtocolRow, doses: readonly DoseRow[]): DoseRow[] {
  return doses.filter(
    (d) =>
      d.compound_id === protocol.compound_id && (!d.protocol_id || d.protocol_id === protocol.id),
  )
}

/** A protocol's administrations ready to be matched, with the row behind every event. */
interface ProtocolDoses {
  protocol: ProtocolRow
  pl: ProtocolLike
  events: DoseEvent[]
  /** The matcher hands back the very Date it was given, so the row is found by identity. */
  rowAt: Map<Date, DoseRow>
}

function protocolDoses(protocol: ProtocolRow, doses: readonly DoseRow[]): ProtocolDoses {
  const rowAt = new Map<Date, DoseRow>()
  const events = protocolDoseRows(protocol, doses).map((row) => {
    const event = toDoseEvent(row)
    rowAt.set(event.at, row)
    return event
  })
  return { protocol, pl: toProtocolLike(protocol), events, rowAt }
}

/** The cells of the seven days from `from`, each with the index of its day. */
function weekCells(
  h: ProtocolDoses,
  from: Date,
  now: Date,
): { dayIndex: number; cell: WeekCell }[] {
  const { protocol, pl } = h
  const to = addDays(from, 7)
  const tolH = matchToleranceH(currentStep(pl, from)?.step, normaliseTimes(pl.times))
  const keyOf = (at: Date | null) => {
    const row = at ? h.rowAt.get(at) : undefined
    return row ? { doseKey: administrationKey(row) } : {}
  }
  // Match against a day either side so a shot after midnight lands on its evening.
  const { slots: matched, extras } = matchDoses(
    scheduledDoses(pl, addDays(from, -1), addDays(to, 1)),
    h.events,
    tolH,
  )
  const out: { dayIndex: number; cell: WeekCell }[] = []
  for (const d of extras) {
    if (d.at < from || d.at >= to) continue
    out.push({
      dayIndex: differenceInCalendarDays(d.at, from),
      cell: {
        protocol,
        plannedAt: d.at,
        takenAt: d.at,
        deltaMin: null,
        status: 'extra',
        ...keyOf(d.at),
      },
    })
  }
  for (const o of matched.filter((m) => ownerDay(m) >= from && ownerDay(m) < to)) {
    const deltaMin = o.takenAt ? Math.round((o.takenAt.getTime() - o.at.getTime()) / 60_000) : null
    let status: WeekStatus
    if (deltaMin !== null)
      status = Math.abs(deltaMin) <= ON_TIME_MIN ? 'onTime' : deltaMin > 0 ? 'late' : 'early'
    else if (o.at.getTime() + tolH * 3_600_000 < now.getTime()) status = 'missed'
    else status = o.at <= now ? 'due' : 'upcoming'
    out.push({
      dayIndex: differenceInCalendarDays(ownerDay(o), from),
      cell: {
        protocol,
        plannedAt: o.at,
        takenAt: o.takenAt,
        deltaMin,
        status,
        slotDay: ownerDay(o),
        ...keyOf(o.takenAt),
      },
    })
  }
  return out
}

export function weekPlanVsActual(
  protocols: readonly ProtocolRow[],
  doses: readonly DoseRow[],
  weekStart: Date,
  now: Date,
): WeekDay[] {
  const from = startOfDay(weekStart)
  const days: WeekDay[] = Array.from({ length: 7 }, (_, i) => ({
    day: addDays(from, i),
    cells: [],
  }))

  for (const protocol of protocols) {
    if (protocol.status === 'archived') continue
    for (const { dayIndex, cell } of weekCells(protocolDoses(protocol, doses), from, now))
      days[dayIndex]?.cells.push(cell)
  }
  for (const d of days) d.cells.sort((a, b) => a.plannedAt.getTime() - b.plannedAt.getTime())
  return days
}

/**
 * Every administration of the protocols' primary compounds since `since`, by the key of the
 * administration, judged week by week exactly as the week card and the Today ring judge it:
 * what each one covered and how far off it was, or that it covered nothing (an extra).
 */
export function doseCells(
  protocols: readonly ProtocolRow[],
  doses: readonly DoseRow[],
  since: Date,
  now: Date,
): Map<string, WeekCell> {
  const histories = protocols
    .filter((p) => p.status !== 'archived')
    .map((p) => protocolDoses(p, doses))
  const out = new Map<string, WeekCell>()
  for (
    let weekStart = startOfWeek(since, { weekStartsOn: 1 });
    weekStart <= now;
    weekStart = addDays(weekStart, 7)
  ) {
    for (const h of histories)
      for (const { cell } of weekCells(h, weekStart, now))
        if (cell.doseKey && !out.has(cell.doseKey)) out.set(cell.doseKey, cell)
  }
  return out
}

/**
 * What was planned and how it went. An extra is a dose nobody planned: it is neither one of
 * the planned administrations nor one of those done, so it does not inflate "taken".
 */
export function summariseWeek(days: readonly WeekDay[]): WeekSummary {
  const cells = days
    .flatMap((d) => d.cells)
    .filter((c) => c.status !== 'upcoming' && c.status !== 'extra')
  return {
    planned: cells.length,
    taken: cells.filter((c) => c.takenAt).length,
    onTime: cells.filter((c) => c.status === 'onTime').length,
    offTime: cells.filter((c) => c.status === 'late' || c.status === 'early').length,
    missed: cells.filter((c) => c.status === 'missed').length,
  }
}
