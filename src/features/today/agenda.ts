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

/**
 * The administrations of one day (today unless `day` says otherwise), judged against `now`:
 * the ones planned for it, the night shot of the evening before that falls after its midnight,
 * and the doses logged on it that no plan asked for.
 */
export function buildToday(
  protocols: readonly ProtocolRow[],
  doses: readonly DoseRow[],
  now: Date,
  day: Date = now,
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
    const lastNight = dayAgenda(pl, history, now, addDays(day, -1)).filter(
      (a) => a.at >= startOfDay(day),
    )
    const agenda = [...lastNight, ...dayAgenda(pl, history, now, day)]
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

    // Doses logged that day that belong to no planned administration: a rest-day shot, a
    // second one… A late dose after midnight still belongs to the evening before.
    const dayStart = startOfDay(day)
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

/** The day in words, as a heading: "Domingo, 4 de octubre" / "Sunday, October 4". */
export function longDate(day: Date, locale: Locale): string {
  const text = fmtDate(day, locale, locale === 'es' ? "EEEE, d 'de' MMMM" : 'EEEE, MMMM d')
  return text.charAt(0).toLocaleUpperCase(locale) + text.slice(1)
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
