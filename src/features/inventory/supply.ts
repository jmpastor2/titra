/**
 * How long the stock of one compound really lasts: the vials are used one after another in
 * the order they would be (reconstituted ones first, oldest opened first, then the reserve),
 * and a vial that reaches the date on its label with product left is thrown away on that day.
 * Pure; see supply.test.ts.
 */
import { startOfDay } from 'date-fns'
import type { InventoryRow } from '@/data/database.types'
import { effectiveExpiry } from './alerts'
import { concentrationOf, remainingOf, type VialRunway } from './vials'

const EPS = 1e-9

export interface SupplyRunway extends Omit<VialRunway, 'limitedBy' | 'wastedMg'> {
  /**
   * What ends the supply: `expiry` when product would still be there but its vial has
   * expired (a new vial is needed earlier than the mg alone say), `amount` when it is simply
   * used up, null when it lasts past the horizon.
   */
  limitedBy: 'expiry' | 'amount' | null
  /** mg discarded along the way because a vial expires before it is used up. */
  wastedMg: number
}

/** Order of use: reconstituted vials first, the oldest opened first; then the reserve. */
function orderOfUse(vials: readonly InventoryRow[], compoundId: string): InventoryRow[] {
  const ready = (v: InventoryRow) => (concentrationOf(v) ? 0 : 1)
  return vials
    .filter((v) => !v.archived && remainingOf(v, compoundId) > EPS)
    .toSorted(
      (a, b) =>
        ready(a) - ready(b) ||
        (a.opened_at ?? '9999').localeCompare(b.opened_at ?? '9999') ||
        (a.expires_at ?? '9999').localeCompare(b.expires_at ?? '9999') ||
        a.created_at.localeCompare(b.created_at),
    )
}

/**
 * Last day a vial can be used: the date on its label. The usual in-use period after
 * reconstitution is only a guide (the alerts say it); counted as a hard stop it emptied the
 * supply of a vial still in use ("0 doses, order now" with 8 mg left).
 */
function lastDay(v: InventoryRow): Date | null {
  return v.expires_at ? (effectiveExpiry({ ...v, opened_at: null })?.date ?? null) : null
}

/**
 * Walk `upcoming` (this compound's doses, soonest first) through the vials that hold it.
 * A dose may be drawn from two vials (what is left in one plus the rest from the next).
 */
export function supplyRunway(
  vials: readonly InventoryRow[],
  compoundId: string,
  upcoming: readonly { at: Date; doseMg: number }[],
): SupplyRunway {
  const order = orderOfUse(vials, compoundId)
  const nextDoseMg = upcoming[0]?.doseMg ?? null
  let i = -1
  let left = 0
  let until: Date | null = null
  let wasted = 0
  let expiredSome = false

  const advance = () => {
    i++
    const v = order[i]
    left = v ? remainingOf(v, compoundId) : 0
    until = v ? lastDay(v) : null
  }
  // Vials past their last day are discarded with whatever is left in them.
  const dropExpired = (day: Date) => {
    while (i < order.length && until !== null && day > until) {
      if (left > EPS) {
        wasted += left
        expiredSome = true
      }
      advance()
    }
  }

  let doses = 0
  for (const u of upcoming) {
    const day = startOfDay(u.at)
    if (i === -1) advance()
    dropExpired(day)
    let need = u.doseMg
    while (need > EPS && i < order.length) {
      const take = Math.min(left, need)
      left -= take
      need -= take
      if (need > EPS || left <= EPS) {
        advance()
        dropExpired(day)
      }
    }
    if (need > EPS)
      return {
        doses,
        runsOutAt: u.at,
        nextDoseMg,
        limitedBy: expiredSome ? 'expiry' : 'amount',
        wastedMg: wasted,
      }
    doses++
  }
  return { doses, runsOutAt: null, nextDoseMg, limitedBy: null, wastedMg: wasted }
}
