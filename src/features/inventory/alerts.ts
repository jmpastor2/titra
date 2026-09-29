/**
 * Stock alerts: what to do about vials before it becomes a problem. Pure; see
 * alerts.test.ts. Expiry without a label date is estimated from reconstitution.
 */
import { addDays, differenceInCalendarDays, startOfDay } from 'date-fns'
import type { InventoryRow } from '@/data/database.types'
import { concentrationOf, vialContents, type RestockLine, type VialRunway } from './vials'

/**
 * In-use period commonly given for reconstituted peptides kept at 2–8 °C. Guidance, not
 * published stability data, so an expiry derived from it is always marked as estimated.
 */
export const IN_USE_DAYS = 28
/** Order when the total supply lasts less than this. */
export const REORDER_DAYS = 21

export type StockAlertKind =
  'expired' | 'expiresSoon' | 'runsOut' | 'reconstitute' | 'reorder' | 'expiresBeforeEmpty'

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
  /** The date is estimated (no expiry on the label). */
  estimated?: boolean
}

/** Label expiry, else reconstitution day + IN_USE_DAYS for a reconstituted vial. */
export function effectiveExpiry(v: InventoryRow): { date: Date; estimated: boolean } | null {
  if (v.expires_at) return { date: startOfDay(new Date(v.expires_at)), estimated: false }
  if (v.opened_at && concentrationOf(v))
    return { date: addDays(startOfDay(new Date(v.opened_at)), IN_USE_DAYS), estimated: true }
  return null
}

const SEVERITY: Record<StockAlert['severity'], number> = { danger: 0, warn: 1, info: 2 }

export function stockAlerts(
  vials: readonly InventoryRow[],
  restock: readonly RestockLine[],
  runways: ReadonlyMap<string, VialRunway>,
  now: Date,
): StockAlert[] {
  const today = startOfDay(now)
  const out: StockAlert[] = []
  const live = vials.filter((v) => !v.archived && Number(v.remaining_mg) > 0)

  for (const v of live) {
    const ids = vialContents(v).map((c) => c.compoundId)
    const exp = effectiveExpiry(v)
    const runway = runways.get(v.id)
    if (exp) {
      const days = differenceInCalendarDays(exp.date, today)
      if (days < 0)
        out.push({
          kind: 'expired',
          severity: 'danger',
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
      const reserve = live.find(
        (r) => r.id !== v.id && !concentrationOf(r) && r.compound_id === v.compound_id,
      )
      out.push({
        kind: reserve ? 'reconstitute' : 'runsOut',
        severity: runway.doses === 0 ? 'danger' : 'warn',
        compoundIds: ids,
        vialId: v.id,
        label: v.label,
        date: runway.runsOutAt,
        doses: runway.doses,
      })
    }
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

  return out.toSorted(
    (a, b) =>
      SEVERITY[a.severity] - SEVERITY[b.severity] ||
      (a.date?.getTime() ?? 0) - (b.date?.getTime() ?? 0),
  )
}
