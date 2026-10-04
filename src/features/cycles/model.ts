/**
 * What the Ciclos screen knows about each protocol: where it stands, which substance
 * it is a cycle of, and when it stopped. A protocol row is one cycle: starting the next
 * one creates a new row, so history is never rewritten. Pure; see model.test.ts.
 */
import { addDays, startOfDay } from 'date-fns'
import type { ProtocolRow, ProtocolStatus } from '@/data/database.types'
import { parseComponents, toProtocolLike } from '@/data/mappers'
import { cycleInfo, type CycleInfo } from '@/domain/dosing/cycle'
import type { ProtocolLike } from '@/domain/types'

export interface CycleView {
  row: ProtocolRow
  like: ProtocolLike
  info: CycleInfo
  /** Same primary compound and same blend partners: the cycles of one substance share it. */
  substanceKey: string
  /** 1-based position among the cycles of this substance, oldest first. */
  ordinal: number
  /** How many cycles of this substance exist. */
  siblings: number
  /** The cycle right before this one in the same substance, if any. */
  previousId: string | null
  /**
   * Day the cycle stops (exclusive): the end of its plan, or the day after it was closed
   * when that came first. Null while an open-ended plan keeps running.
   */
  stopsOn: Date | null
}

/** Badge tone of each status, as on the Pautas screen. */
export const STATUS_TONE: Record<ProtocolStatus, 'ok' | 'warn' | 'neutral'> = {
  active: 'ok',
  paused: 'warn',
  completed: 'neutral',
  archived: 'neutral',
}

/** Active and paused protocols are the cycles in progress; the rest are history. */
export const isCurrent = (status: ProtocolStatus): boolean =>
  status === 'active' || status === 'paused'

export function substanceKey(row: Pick<ProtocolRow, 'compound_id' | 'components'>): string {
  const partners = parseComponents(row.components)
    .map((c) => c.compoundId)
    .toSorted()
  return [row.compound_id, ...partners].join('+')
}

/**
 * When a cycle stops. A protocol still in progress stops where its plan ends. One that
 * was closed (completed or archived) stops when its plan ends or the day it was closed,
 * whichever came first: `closedAt` is the row's last update.
 */
export function cycleStopsOn(
  info: Pick<CycleInfo, 'startsOn' | 'endsOn'>,
  status: ProtocolStatus,
  closedAt: string,
): Date | null {
  if (isCurrent(status)) return info.endsOn
  const closed = new Date(closedAt)
  if (Number.isNaN(closed.getTime())) return info.endsOn
  const closedEnd = addDays(startOfDay(closed), 1)
  const stop = closedEnd < info.startsOn ? info.startsOn : closedEnd
  return info.endsOn && info.endsOn < stop ? info.endsOn : stop
}

/** A closed cycle that stopped before its plan did. */
export function closedEarly(view: Pick<CycleView, 'row' | 'info' | 'stopsOn'>): boolean {
  if (isCurrent(view.row.status) || view.stopsOn === null) return false
  return view.info.endsOn === null || view.stopsOn < view.info.endsOn
}

const STATUS_RANK: Record<ProtocolStatus, number> = {
  active: 0,
  paused: 1,
  completed: 2,
  archived: 3,
}

const stoppedAt = (v: CycleView) => (v.stopsOn ?? v.info.startsOn).getTime()

/**
 * Cycles in progress first (a plan that ran out and waits for the next cycle leads, since
 * it needs a decision), oldest start first; then history, most recently stopped first.
 */
function displayOrder(a: CycleView, b: CycleView): number {
  const current = Number(isCurrent(b.row.status)) - Number(isCurrent(a.row.status))
  if (current) return current
  if (isCurrent(a.row.status)) {
    return (
      STATUS_RANK[a.row.status] - STATUS_RANK[b.row.status] ||
      Number(b.info.phase === 'finished') - Number(a.info.phase === 'finished') ||
      a.info.startsOn.getTime() - b.info.startsOn.getTime() ||
      a.row.name.localeCompare(b.row.name)
    )
  }
  return (
    stoppedAt(b) - stoppedAt(a) ||
    b.info.startsOn.getTime() - a.info.startsOn.getTime() ||
    STATUS_RANK[a.row.status] - STATUS_RANK[b.row.status]
  )
}

/** One view per protocol that has steps, numbered per substance and in display order. */
export function buildCycleViews(rows: readonly ProtocolRow[], now: Date): CycleView[] {
  const groups = new Map<string, Omit<CycleView, 'ordinal' | 'siblings' | 'previousId'>[]>()
  for (const row of rows) {
    const like = toProtocolLike(row)
    const info = cycleInfo(like, now)
    if (!info) continue
    const key = substanceKey(row)
    const entry = {
      row,
      like,
      info,
      substanceKey: key,
      stopsOn: cycleStopsOn(info, row.status, row.updated_at),
    }
    groups.set(key, [...(groups.get(key) ?? []), entry])
  }

  const views: CycleView[] = []
  for (const group of groups.values()) {
    const ordered = group.toSorted(
      (a, b) =>
        a.info.startsOn.getTime() - b.info.startsOn.getTime() ||
        a.row.created_at.localeCompare(b.row.created_at),
    )
    ordered.forEach((entry, i) =>
      views.push({
        ...entry,
        ordinal: i + 1,
        siblings: ordered.length,
        previousId: ordered[i - 1]?.row.id ?? null,
      }),
    )
  }
  return views.toSorted(displayOrder)
}

/** Every compound a cycle gives, primary first, for the substance dots. */
export function cycleCompoundIds(view: Pick<CycleView, 'like'>): string[] {
  return [view.like.compoundId, ...(view.like.components ?? []).map((c) => c.compoundId)]
}

/**
 * The cycle a new one could continue: the latest of its substance. An earlier cycle
 * already has a successor, so offering "start a new cycle" on it would fork the history.
 */
export function isLatestOfSubstance(view: CycleView, views: readonly CycleView[]): boolean {
  return !views.some((v) => v.substanceKey === view.substanceKey && v.ordinal > view.ordinal)
}
