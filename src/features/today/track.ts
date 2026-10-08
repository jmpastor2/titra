/**
 * The doses around now, for the hero of Hoy: every administration on the rolling day track
 * (a few hours back, the rest of the day ahead), how each marker is drawn, and the rows that
 * name them under the track. Pure; see track.test.ts.
 */
import { addDays } from 'date-fns'
import type { TrackItem } from '@/components/kpi/DayTrack'
import { compoundColor } from '@/content/substanceColor'
import type { DoseRow, ProtocolRow } from '@/data/database.types'
import { buildToday, type TodayItem } from './agenda'

/** The track looks this many hours back… */
export const TRACK_BEFORE_H = 4
/** …and this many ahead: 24 hours in all, now included. */
export const TRACK_AFTER_H = 20

const HOUR_MS = 3_600_000

/** When an administration happened, or is planned to happen. */
export function itemTime(item: TodayItem): Date {
  return item.takenAt ?? item.at
}

/** The key `buildToday` gives a planned administration, so a later day's dose can be matched. */
export function slotKey(protocolId: string, at: Date): string {
  return `${protocolId}:${at.getTime()}`
}

const byTime = (a: TodayItem, b: TodayItem) => itemTime(a).getTime() - itemTime(b).getTime()

/** The same administration listed by two days (tonight's 01:00 shot) is kept once. */
function unique(items: Iterable<TodayItem>): TodayItem[] {
  const out = new Map<string, TodayItem>()
  for (const item of items) if (!out.has(item.key)) out.set(item.key, item)
  return [...out.values()]
}

/**
 * Every administration from `before` hours ago to `after` hours ahead, taken or not, oldest
 * first. The window crosses midnight, so yesterday, today and tomorrow are all read.
 */
export function windowItems(
  protocols: readonly ProtocolRow[],
  doses: readonly DoseRow[],
  now: Date,
  before = TRACK_BEFORE_H,
  after = TRACK_AFTER_H,
): TodayItem[] {
  const from = now.getTime() - before * HOUR_MS
  const to = now.getTime() + after * HOUR_MS
  return unique([-1, 0, 1].flatMap((d) => buildToday(protocols, doses, now, addDays(now, d))))
    .filter((i) => {
      const t = itemTime(i).getTime()
      return t >= from && t <= to
    })
    .toSorted(byTime)
}

/** How a marker is drawn: taken, the one the hero is about, still to come, or missed. */
export function trackState(item: TodayItem, heroKey: string | null): TrackItem['state'] {
  if (item.status === 'taken') return 'done'
  if (item.key === heroKey) return 'next'
  if (item.status === 'missed') return 'missed'
  return 'later'
}

/** The markers of the track, in the colour of each administration's substance. */
export function trackItems(items: readonly TodayItem[], heroKey: string | null): TrackItem[] {
  return items.map((item) => ({
    at: itemTime(item),
    color: compoundColor(item.protocol.compound_id),
    state: trackState(item, heroKey),
  }))
}

/**
 * The rows under the track: what the track shows, plus anything of today's agenda still
 * waiting (missed, due, to come), without the dose the hero is about, in time order. A dose
 * taken before the track starts is left out: last night's 00:23 shot listed as "01:00 · done"
 * next to tonight's 01:00 read as if tonight's were done.
 */
export function heroRows(
  today: readonly TodayItem[],
  window: readonly TodayItem[],
  heroKey: string | null,
): TodayItem[] {
  const shown = new Set(window.map((i) => i.key))
  return unique([...window, ...today.filter((i) => i.status !== 'taken' || shown.has(i.key))])
    .filter((i) => i.key !== heroKey)
    .toSorted(byTime)
}
