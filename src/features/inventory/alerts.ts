/**
 * Stock alerts: what to do about vials before it becomes a problem. Pure; see
 * alerts.test.ts. Expiry without a label date is estimated from reconstitution.
 */
import { addDays, differenceInCalendarDays, format, parseISO, startOfDay } from 'date-fns'
import type { InventoryRow } from '@/data/database.types'
import {
  concentrationOf,
  needsReconstitution,
  remainingOf,
  vialContents,
  type RestockLine,
  type VialFields,
  type VialRunway,
} from './vials'

/**
 * In-use period commonly given for reconstituted peptides kept at 2–8 °C. Guidance, not
 * published stability data, so an expiry derived from it is always marked as estimated.
 */
export const IN_USE_DAYS = 28
/** Order when the total supply lasts less than this. */
export const REORDER_DAYS = 21

export type StockAlertKind =
  | 'expired'
  | 'expiresSoon'
  | 'runsOut'
  | 'reconstitute'
  | 'reorder'
  | 'expiresBeforeEmpty'
  | 'leftover'

export interface StockAlert {
  kind: StockAlertKind
  severity: 'danger' | 'warn' | 'info'
  compoundIds: string[]
  vialId?: string
  label?: string
  /** The date the alert is about: expiry, run-out, order-by. */
  date?: Date
  days?: number
  doses?: number
  /** mg still in the vial (leftover). */
  mg?: number
  /** The lyophilised vial to reconstitute next (reconstitute). */
  reserveVialId?: string
  /** The date is estimated (no expiry on the label). */
  estimated?: boolean
}

/** A vial's content and dates: all the expiry maths read. */
type ExpiryFields = VialFields & Pick<InventoryRow, 'expires_at' | 'opened_at'>

/** Day a date-only column ("2026-10-05") falls on, in local time whatever the time zone. */
const dayOf = (iso: string) => startOfDay(parseISO(iso))

/**
 * Date after which a vial should not be used: the label date and, once reconstituted,
 * the in-use period counted from that day, whichever comes first. The in-use one is
 * only an estimate.
 */
export function effectiveExpiry(v: ExpiryFields): { date: Date; estimated: boolean } | null {
  const label = v.expires_at ? dayOf(v.expires_at) : null
  const inUse = v.opened_at && concentrationOf(v) ? addDays(dayOf(v.opened_at), IN_USE_DAYS) : null
  if (label && inUse)
    return inUse < label ? { date: inUse, estimated: true } : { date: label, estimated: false }
  if (label) return { date: label, estimated: false }
  return inUse ? { date: inUse, estimated: true } : null
}

export interface InUseProgress {
  /** Day of the in-use period, 1 on the day of reconstitution; stays at `of` once past it. */
  day: number
  of: number
  /** 0..1 of the way to the discard date. */
  fraction: number
  endsAt: Date
  estimated: boolean
  /** The discard date has gone by. */
  over: boolean
}

/** "Day 14 of 28" for a reconstituted vial; null while it is still powder. */
export function inUseProgress(v: ExpiryFields, now: Date): InUseProgress | null {
  const exp = effectiveExpiry(v)
  if (!exp || !v.opened_at || !concentrationOf(v)) return null
  const opened = dayOf(v.opened_at)
  const length = Math.max(1, differenceInCalendarDays(exp.date, opened))
  const elapsed = Math.max(0, differenceInCalendarDays(startOfDay(now), opened))
  return {
    day: Math.min(elapsed + 1, length),
    of: length,
    fraction: Math.min(1, (elapsed + 1) / length),
    endsAt: exp.date,
    estimated: exp.estimated,
    over: elapsed > length,
  }
}

export interface VialOutlook {
  expiry: { date: Date; estimated: boolean } | null
  expiryDays: number | null
  /** It expires before it runs out: the expiry date is what forces the next vial. */
  expiresFirst: boolean
  /** The date by which the next vial has to be ready. */
  needBy: Date | null
  /** Two doses or fewer left in it, by the schedule. */
  runningLow: boolean
  /** Running low or about to expire before it runs out: worth drawing attention to. */
  short: boolean
}

export function vialOutlook(
  v: InventoryRow,
  runway: VialRunway | undefined,
  now: Date,
): VialOutlook {
  const expiry = effectiveExpiry(v)
  const expiryDays = expiry ? differenceInCalendarDays(expiry.date, startOfDay(now)) : null
  const expiresFirst =
    runway && expiry ? !runway.runsOutAt || expiry.date < runway.runsOutAt : false
  const needBy = expiresFirst && expiry ? expiry.date : (runway?.runsOutAt ?? null)
  const runningLow = runway ? runway.runsOutAt !== null && runway.doses <= 2 : false
  const short = runningLow || (expiresFirst && expiryDays !== null && expiryDays <= 7)
  return { expiry, expiryDays, expiresFirst, needBy, runningLow, short }
}

const SEVERITY: Record<StockAlert['severity'], number> = { danger: 0, warn: 1, info: 2 }
const timeOf = (a: StockAlert) => a.date?.getTime() ?? Number.POSITIVE_INFINITY
/** A key must fit the 200 characters the table allows. */
const KEY_MAX = 200

/**
 * Identity of an alert's situation, so "read" sticks: the same situation keeps its key,
 * a different one gets a new key and shows again. It has the kind, what it is about (the
 * vial, else the substances), the severity (an escalation to danger is a new alert) and
 * the date, except for kinds whose date only follows the schedule: a run-out date moves
 * when a dose is skipped or taken late and that must not bring the alert back, and a
 * leftover is once per vial. Changing an expiry date does make a new alert.
 */
export function alertKey(a: StockAlert): string {
  const subject = a.vialId ?? a.compoundIds.join('+')
  const followsSchedule = a.kind === 'runsOut' || a.kind === 'reconstitute' || a.kind === 'leftover'
  const when = a.date && !followsSchedule ? format(a.date, 'yyyy-MM-dd') : '-'
  return `${a.kind}:${subject}:${a.severity}:${when}`.slice(0, KEY_MAX)
}

/** Split alerts into the ones still to read and the ones already marked as read. */
export function splitDismissed(
  alerts: readonly StockAlert[],
  dismissedKeys: ReadonlySet<string>,
): { active: StockAlert[]; read: StockAlert[] } {
  const active: StockAlert[] = []
  const read: StockAlert[] = []
  for (const a of alerts) (dismissedKeys.has(alertKey(a)) ? read : active).push(a)
  return { active, read }
}

export function stockAlerts(
  vials: readonly InventoryRow[],
  restock: readonly RestockLine[],
  runways: ReadonlyMap<string, VialRunway>,
  now: Date,
): StockAlert[] {
  const today = startOfDay(now)
  const out: StockAlert[] = []
  const live = vials.filter((v) => !v.archived && Number(v.remaining_mg) > 0)

  // The vial each compound is being drawn from, and the dose it has to cover next.
  const drawingFrom = new Map<string, { vialId: string; nextDoseMg: number }>()
  for (const v of live) {
    const nextDoseMg = runways.get(v.id)?.nextDoseMg
    if (nextDoseMg) drawingFrom.set(v.compound_id, { vialId: v.id, nextDoseMg })
  }

  for (const v of live) {
    const ids = vialContents(v).map((c) => c.compoundId)
    const exp = effectiveExpiry(v)
    const runway = runways.get(v.id)
    if (exp) {
      const days = differenceInCalendarDays(exp.date, today)
      if (days < 0)
        out.push({
          kind: 'expired',
          // Past the usual in-use period only (no label date): a guide, not a hard stop.
          severity: exp.estimated ? 'warn' : 'danger',
          compoundIds: ids,
          vialId: v.id,
          label: v.label,
          date: exp.date,
          days,
          estimated: exp.estimated,
        })
      else if (days <= 7)
        out.push({
          kind: 'expiresSoon',
          severity: 'warn',
          compoundIds: ids,
          vialId: v.id,
          label: v.label,
          date: exp.date,
          days,
          estimated: exp.estimated,
        })
      else if (runway?.runsOutAt && exp.date < runway.runsOutAt && days <= 21)
        out.push({
          kind: 'expiresBeforeEmpty',
          severity: 'info',
          compoundIds: ids,
          vialId: v.id,
          label: v.label,
          date: exp.date,
          days,
          estimated: exp.estimated,
        })
    }

    if (runway?.runsOutAt && runway.doses <= 2) {
      const others = live.filter((r) => r.id !== v.id && r.compound_id === v.compound_id)
      // Another vial already reconstituted and able to take over: nothing to prepare.
      const ready = others.some(
        (r) =>
          !needsReconstitution(r) &&
          remainingOf(r, v.compound_id) >= (runway.nextDoseMg ?? 0) - 1e-9,
      )
      const reserve = others.find(needsReconstitution)
      if (!ready)
        out.push({
          kind: reserve ? 'reconstitute' : 'runsOut',
          severity: runway.doses === 0 ? 'danger' : 'warn',
          compoundIds: ids,
          vialId: v.id,
          label: v.label,
          date: runway.runsOutAt,
          doses: runway.doses,
          ...(reserve ? { reserveVialId: reserve.id } : {}),
        })
    }

    // Ready to use, but another vial took over because what is left cannot cover a dose.
    const current = drawingFrom.get(v.compound_id)
    if (
      current &&
      current.vialId !== v.id &&
      !needsReconstitution(v) &&
      remainingOf(v, v.compound_id) < current.nextDoseMg - 1e-9
    )
      out.push({
        kind: 'leftover',
        severity: 'info',
        compoundIds: ids,
        vialId: v.id,
        label: v.label,
        mg: Number(v.remaining_mg),
      })
  }

  for (const line of restock) {
    if (!line.runway.runsOutAt) continue
    const days = differenceInCalendarDays(line.runway.runsOutAt, today)
    if (days <= REORDER_DAYS)
      out.push({
        kind: 'reorder',
        severity: days <= 10 ? 'danger' : 'warn',
        compoundIds: line.partners,
        date: line.runway.runsOutAt,
        days,
      })
  }

  // Most severe first, then the soonest date; alerts without a date last.
  return out.toSorted((a, b) => {
    if (a.severity !== b.severity) return SEVERITY[a.severity] - SEVERITY[b.severity]
    return timeOf(a) === timeOf(b) ? 0 : timeOf(a) < timeOf(b) ? -1 : 1
  })
}
