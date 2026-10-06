/**
 * Today's agenda across every active protocol: one row per administration, with the
 * compounds drawn together in it and its state. Pure, unit-tested.
 */
import type { DoseRow, ProtocolRow } from '@/data/database.types'
import { toDoseEvent, toProtocolLike } from '@/data/mappers'
import { fmtDate, fmtHours, toTimeInputValue, type Locale } from '@/lib/format'
import { addDays, isSameDay, startOfDay } from 'date-fns'
import {
  componentsAt,
  currentStep,
  dayAgenda,
  matchDoses,
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
    // In the small hours, last night's shot (planned after midnight) belongs here too.
    const lastNight = dayAgenda(pl, history, now, addDays(now, -1)).filter(
      (a) => a.at >= startOfDay(now),
    )
    const agenda = [...lastNight, ...dayAgenda(pl, history, now)]
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
    const { extras } = matchDoses(
      scheduledDoses(pl, addDays(dayStart, -1), addDays(dayEnd, 1)),
      history,
      tolH,
    )
    const inAgenda = new Set(agenda.flatMap((a) => (a.takenAt ? [a.takenAt.getTime()] : [])))
    for (const d of extras) {
      if (d.at < dayStart || d.at >= dayEnd || inAgenda.has(d.at.getTime())) continue
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

/** Before this hour a planned time is "madrugada": a night shot, which belongs to the evening before. */
export const NIGHT_UNTIL_H = 6

/** After midnight and before 06:00. */
export function isNightSlot(at: Date): boolean {
  return at.getHours() < NIGHT_UNTIL_H
}

/** How a planned time reads next to the clock: "09:00", or "mar 6 · 01:00" on another day. */
export function slotWhen(at: Date, now: Date, locale: Locale): string {
  const clock = toTimeInputValue(at)
  return isSameDay(at, now) ? clock : `${fmtDate(at, locale, 'EEE d')} · ${clock}`
}

/**
 * Whether the agenda adds anything to the "next dose" card: not when its only row is the dose
 * that card already shows.
 */
export function agendaAddsToHero(items: readonly TodayItem[], focus: TodayItem | null): boolean {
  return items.length > 1 || (items.length === 1 && items[0] !== focus)
}

/** "L M X J V S D": the weekday's initial as the protocol screens write it (Wednesday is X). */
export function weekdayInitial(day: Date, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === 'es' ? 'es-ES' : 'en-US', {
    weekday: 'narrow',
  }).format(day)
}

/** A wait as a clock reads it: "45 min", "3 h 20 min", "12 h", "1 d 4 h". */
export function fmtWait(ms: number, locale: Locale): string {
  const min = Math.max(0, Math.round(ms / 60_000))
  if (min >= 6 * 60) return fmtHours(min / 60, locale)
  const h = Math.floor(min / 60)
  const rest = min % 60
  if (h === 0) return `${rest} min`
  return rest === 0 ? `${h} h` : `${h} h ${rest} min`
}
