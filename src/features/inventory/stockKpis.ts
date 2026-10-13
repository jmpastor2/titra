/**
 * The numbers at the top of the inventory: how many vials are open or waiting, how long the
 * whole stock lasts, what expires first and when to order. Pure; see stockKpis.test.ts.
 */
import { addDays, differenceInCalendarDays, startOfDay } from 'date-fns'
import type { InventoryRow } from '@/data/database.types'
import { effectiveExpiry, REORDER_DAYS } from './alerts'
import { vialState, type RestockLine } from './vials'

/** How worried to be about a supply: days left against the usual order lead time. */
export type SupplyTone = 'ok' | 'warn' | 'danger'

/** A supply gauge is full at two months: the order point (21 days) sits about a third along. */
export const COVER_GAUGE_DAYS = 60

/** Two weeks or less is urgent, a month or less is worth a look; no run-out date is fine. */
export function supplyTone(days: number | null): SupplyTone {
  if (days === null) return 'ok'
  return days <= 14 ? 'danger' : days <= 30 ? 'warn' : 'ok'
}

/** A use-by date: past it is wrong, the last week careful, anything later fine. */
export function expiryTone(days: number): SupplyTone {
  return days < 0 ? 'danger' : days <= 7 ? 'warn' : 'ok'
}

/** The order-by day: gone by means order now, within a week means soon. */
export function reorderTone(days: number): SupplyTone {
  return days <= 0 ? 'danger' : days <= 7 ? 'warn' : 'ok'
}

/** The text colour of a tone: fine stays quiet, the others say it in colour. */
export const TONE_TEXT: Record<SupplyTone, string> = {
  ok: 'text-muted',
  warn: 'text-warn',
  danger: 'text-danger',
}

/** The colour token of a tone: good is the signal colour, careful amber, wrong rose. */
export const TONE_COLOR: Record<SupplyTone, string> = {
  ok: 'var(--signal)',
  warn: 'var(--warn)',
  danger: 'var(--danger)',
}

/** 0..1 of a gauge: full at `COVER_GAUGE_DAYS` or more, or when nothing runs out. */
export function coverGauge(days: number | null): number {
  return days === null ? 1 : Math.max(0, Math.min(1, days / COVER_GAUGE_DAYS))
}

export interface StockCover {
  /** Days until the first substance of the stock runs out; null when nothing runs out in the horizon. */
  days: number | null
  /** The day it runs out. */
  date: Date | null
  /** The substance(s) that run out first. */
  compoundIds: string[]
}

export interface StockExpiry {
  date: Date
  /** Days from today; negative once it has passed. */
  days: number
  label: string
  compoundId: string
  /** Counted from the in-use period, not from a date on the label. */
  estimated: boolean
}

export interface StockReorder {
  /** The day to place the order by: the run-out day less the usual delivery margin. */
  date: Date
  /** Days from today; zero or less means it is time to order now. */
  days: number
  /** The day the substance runs out. */
  runsOutAt: Date
  compoundIds: string[]
}

export interface StockKpis {
  inUse: number
  reserve: number
  /** Null when no protocol takes anything from the stock. */
  cover: StockCover | null
  /** The vial with something left that expires first. */
  nextExpiry: StockExpiry | null
  /** The substance that needs ordering first. */
  reorder: StockReorder | null
}

/** The line of the substance that runs out first, with the days to go. */
function soonest(lines: readonly RestockLine[], today: Date) {
  let first: { line: RestockLine; runsOutAt: Date } | null = null
  for (const line of lines) {
    const runsOutAt = line.runway.runsOutAt
    if (runsOutAt && (!first || runsOutAt < first.runsOutAt)) first = { line, runsOutAt }
  }
  return first
    ? {
        ...first,
        days: Math.max(0, differenceInCalendarDays(first.runsOutAt, today)),
      }
    : null
}

export function stockKpis(
  vials: readonly InventoryRow[],
  restock: readonly RestockLine[],
  now: Date,
): StockKpis {
  const today = startOfDay(now)
  const live = vials.filter((v) => !v.archived && Number(v.remaining_mg) > 0)

  let nextExpiry: StockExpiry | null = null
  for (const v of live) {
    const exp = effectiveExpiry(v)
    if (exp && (!nextExpiry || exp.date < nextExpiry.date))
      nextExpiry = {
        date: exp.date,
        days: differenceInCalendarDays(exp.date, today),
        label: v.label,
        compoundId: v.compound_id,
        estimated: exp.estimated,
      }
  }

  const first = soonest(restock, today)
  const orderBy = first ? addDays(first.runsOutAt, -REORDER_DAYS) : null

  return {
    inUse: live.filter((v) => vialState(v) === 'inUse').length,
    reserve: live.filter((v) => vialState(v) === 'reserve').length,
    cover:
      restock.length === 0
        ? null
        : first
          ? { days: first.days, date: first.runsOutAt, compoundIds: first.line.partners }
          : { days: null, date: null, compoundIds: [] },
    nextExpiry,
    reorder:
      first && orderBy
        ? {
            date: orderBy,
            days: differenceInCalendarDays(orderBy, today),
            runsOutAt: first.runsOutAt,
            compoundIds: first.line.partners,
          }
        : null,
  }
}
