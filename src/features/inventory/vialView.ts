/**
 * What a vial card says, worked out once: the one number (doses left, or mg), how long the
 * vial lasts and the expiry ring. Pure; see vialView.test.ts.
 */
import { differenceInCalendarDays, startOfDay } from 'date-fns'
import type { InventoryRow } from '@/data/database.types'
import { inUseProgress, vialOutlook } from './alerts'
import type { SupplyTone } from './stockKpis'
import { fillOf, needsReconstitution, vialContents, type VialRunway } from './vials'

export interface VialExpiry {
  /** Days to the discard date; negative once it has passed. */
  days: number
  /** 0..1 of the in-use period still ahead: the ring empties as the vial gets old. */
  left: number
  /** The date comes from the usual in-use period, not from the label. */
  estimated: boolean
  tone: SupplyTone
}

/**
 * mg in the whole vial and mg left of it. The row stores the first compound's amounts; a
 * blend holds more, in proportion, so the vial it is labelled as ("10 mg") adds them up.
 */
export function vialMg(item: InventoryRow): { left: number; total: number } {
  const total = Number(item.total_mg)
  const content = vialContents(item).reduce((sum, c) => sum + c.mg, 0)
  const scale = total > 0 ? content / total : 1
  return { left: Number(item.remaining_mg) * scale, total: content }
}

export interface VialView {
  /** The one number of the card: the doses the vial still covers, else the mg left. */
  hero: { kind: 'doses'; count: number } | { kind: 'mg'; mg: number }
  /** The whole vial in mg and what is left of it, for "3,7 mg de 5 mg". */
  totalMg: number
  leftMg: number
  /** Still powder: nothing has been added to it yet. */
  powder: boolean
  /** Days until the first dose it cannot cover; null when it covers every dose planned. */
  coverDays: number | null
  /** The day that first dose falls on. */
  coverDate: Date | null
  /** Set for a reconstituted vial: how much of its use-by period is left. */
  expiry: VialExpiry | null
  /** Two doses or fewer left, or (nothing planned) a fifth of the vial. */
  low: boolean
  expired: boolean
  /** A date within the month, for vials that have no ring to show it. */
  expiring: boolean
  /** Days to the date the vial should not be used after; negative once it has passed. */
  expiryDays: number | null
  /** That date is only the usual in-use period. */
  expiryEstimated: boolean
  /** The next vial has to be ready by then: it runs out or expires first. */
  short: boolean
  needBy: Date | null
  expiresFirst: boolean
}

export function vialView(item: InventoryRow, runway: VialRunway | undefined, now: Date): VialView {
  const outlook = vialOutlook(item, runway, now)
  const progress = inUseProgress(item, now)
  const powder = needsReconstitution(item)
  const mg = vialMg(item)
  const runsOutAt = runway?.runsOutAt ?? null
  const days = outlook.expiryDays

  return {
    hero:
      runway && runsOutAt && !powder
        ? { kind: 'doses', count: runway.doses }
        : { kind: 'mg', mg: mg.left },
    totalMg: mg.total,
    leftMg: mg.left,
    powder,
    coverDays: runsOutAt ? Math.max(0, differenceInCalendarDays(runsOutAt, startOfDay(now))) : null,
    coverDate: runsOutAt,
    expiry:
      progress && days !== null
        ? {
            days,
            left: Math.max(0, Math.min(1, days / progress.of)),
            estimated: progress.estimated,
            tone: days < 0 ? 'danger' : days <= 7 ? 'warn' : 'ok',
          }
        : null,
    low: outlook.runningLow || (!runway && !powder && fillOf(item) <= 0.2),
    expired: days !== null && days < 0,
    expiring: days !== null && days >= 0 && days <= 30,
    expiryDays: days,
    expiryEstimated: outlook.expiry?.estimated ?? false,
    short: outlook.short,
    needBy: outlook.needBy,
    expiresFirst: outlook.expiresFirst,
  }
}
