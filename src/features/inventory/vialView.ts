/**
 * What a vial card says, worked out once: the one number (doses left, or mg), how long the
 * vial lasts, its use-by date and what to have ready next. Pure; see vialView.test.ts.
 */
import { differenceInCalendarDays, startOfDay } from 'date-fns'
import type { InventoryRow } from '@/data/database.types'
import { vialOutlook } from './alerts'
import { expiryTone, type SupplyTone } from './stockKpis'
import { fillOf, needsReconstitution, vialContents, type VialRunway } from './vials'

export interface VialExpiry {
  /** The day the vial should not be used after. */
  date: Date
  /** Days to that day; negative once it has passed. */
  days: number
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

/** The line about the next vial: it expires before it is used up, or it is running out. */
export type NextVialNote = { kind: 'beforeEmpty' } | { kind: 'readyBy'; date: Date } | null

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
  /** The use-by date, from the label or the in-use period; null when there is none. */
  expiry: VialExpiry | null
  /** Two doses or fewer left, or (nothing planned) a fifth of the vial. */
  low: boolean
  expired: boolean
  /** The next vial has to be ready by then: it runs out or expires first. */
  short: boolean
  needBy: Date | null
  expiresFirst: boolean
  /** What to say about the next vial, without repeating a date the card already shows. */
  nextVial: NextVialNote
}

export function vialView(item: InventoryRow, runway: VialRunway | undefined, now: Date): VialView {
  const outlook = vialOutlook(item, runway, now)
  const powder = needsReconstitution(item)
  const mg = vialMg(item)
  const runsOutAt = runway?.runsOutAt ?? null
  const days = outlook.expiryDays
  const doses = Boolean(runway && runsOutAt && !powder)

  // Expiring first: the use-by line already has the date. Running out: the hero line has it,
  // so it is repeated only when it is urgent, or when the card leads with mg (powder).
  const nextVial: NextVialNote =
    runway && outlook.needBy
      ? outlook.expiresFirst
        ? { kind: 'beforeEmpty' }
        : outlook.short || !doses
          ? { kind: 'readyBy', date: outlook.needBy }
          : null
      : null

  return {
    hero: doses && runway ? { kind: 'doses', count: runway.doses } : { kind: 'mg', mg: mg.left },
    totalMg: mg.total,
    leftMg: mg.left,
    powder,
    coverDays: runsOutAt ? Math.max(0, differenceInCalendarDays(runsOutAt, startOfDay(now))) : null,
    coverDate: runsOutAt,
    expiry:
      outlook.expiry && days !== null
        ? {
            date: outlook.expiry.date,
            days,
            estimated: outlook.expiry.estimated,
            tone: expiryTone(days, outlook.expiry.estimated),
          }
        : null,
    low: outlook.runningLow || (!runway && !powder && fillOf(item) <= 0.2),
    expired: days !== null && days < 0,
    short: outlook.short,
    needBy: outlook.needBy,
    expiresFirst: outlook.expiresFirst,
    nextVial,
  }
}
