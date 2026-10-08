/**
 * The slim rows of Hoy: the one stock alert that cannot wait (a vial that expires today or
 * tomorrow, one that is empty or about to be, one to reconstitute before the next dose).
 * Running low is not here: the Stock tile already says it. Pure; see urgentStock.test.ts.
 */
import type { StockAlert } from '@/features/inventory/alerts'

/** An expiry this many days away or less is worth a row on Hoy. */
export const EXPIRY_URGENT_DAYS = 1

export function isUrgent(a: StockAlert): boolean {
  switch (a.kind) {
    case 'expired':
      // Past the label date, yes; past the usual in-use guide is for the inventory to say.
      return !a.estimated
    case 'runsOut':
    case 'reconstitute':
      return true
    case 'expiresSoon':
      return (a.days ?? Infinity) <= EXPIRY_URGENT_DAYS
    case 'reorder':
    case 'expiresBeforeEmpty':
    case 'leftover':
      return false
  }
}

/** The most pressing urgent alert (alerts come most severe first) and how many more there are. */
export function urgentStock(
  alerts: readonly StockAlert[],
): { alert: StockAlert; more: number } | null {
  const urgent = alerts.filter(isUrgent)
  const [first] = urgent
  return first ? { alert: first, more: urgent.length - 1 } : null
}
