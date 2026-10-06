/**
 * What has been administered, compound by compound: the total in the window and the amount of
 * each of the last weeks, which draws the titration as a staircase. Pure; callers pass `now`.
 */
import { differenceInCalendarWeeks } from 'date-fns'
import type { DoseRow, ProtocolRow } from '@/data/database.types'
import { protocolCompoundIds } from '@/data/mappers'
import type { DoseUnit } from '@/domain/types'
import { HEAT_WEEKS } from './heatmap'
import { asDoseUnit } from './progress'

export interface CompoundTotal {
  compoundId: string
  /** The unit the person's protocol thinks in (mg, mcg…); the amounts below are in mg. */
  unit: DoseUnit
  totalMg: number
  /** Administrations counted in the total. */
  count: number
  /** The first of them. */
  since: Date
  /** Amount per week in mg, oldest first, the current week last: `weeks` entries. */
  weekly: number[]
}

const WEEK_OPTIONS = { weekStartsOn: 1 } as const

/**
 * Totals per compound, for the compounds given a dose in the last `weeks` weeks (the weeks the
 * bars show). Compounds of active protocols come first, in the order the protocols started, the
 * rest by their latest dose. The unit is the one of the protocol that carries the compound.
 */
export function cumulativeDoses(
  doses: readonly DoseRow[],
  protocols: readonly ProtocolRow[],
  now: Date,
  weeks = HEAT_WEEKS,
): CompoundTotal[] {
  const unitOf = new Map<string, DoseUnit>()
  const order = new Map<string, number>()
  const byStart = protocols.toSorted((a, b) => a.start_date.localeCompare(b.start_date))
  for (const row of [...byStart.filter((p) => p.status === 'active'), ...byStart]) {
    for (const id of protocolCompoundIds(row)) {
      if (!unitOf.has(id)) unitOf.set(id, asDoseUnit(row.unit))
      if (row.status === 'active' && !order.has(id)) order.set(id, order.size)
    }
  }

  const groups = new Map<string, { total: CompoundTotal; last: number }>()
  for (const dose of doses) {
    const at = new Date(dose.administered_at)
    const mg = Number(dose.dose_mg)
    if (Number.isNaN(at.getTime()) || at > now || !Number.isFinite(mg) || mg < 0) continue
    let group = groups.get(dose.compound_id)
    if (!group) {
      group = {
        total: {
          compoundId: dose.compound_id,
          unit: unitOf.get(dose.compound_id) ?? 'mg',
          totalMg: 0,
          count: 0,
          since: at,
          weekly: Array.from({ length: weeks }, () => 0),
        },
        last: at.getTime(),
      }
      groups.set(dose.compound_id, group)
    }
    const { total } = group
    total.totalMg += mg
    total.count += 1
    if (at < total.since) total.since = at
    group.last = Math.max(group.last, at.getTime())
    const index = weeks - 1 - differenceInCalendarWeeks(now, at, WEEK_OPTIONS)
    if (index >= 0 && index < weeks) total.weekly[index] = (total.weekly[index] ?? 0) + mg
  }

  return [...groups.values()]
    .filter(({ total }) => total.weekly.some((mg) => mg > 0))
    .toSorted((a, b) => {
      const ra = order.get(a.total.compoundId)
      const rb = order.get(b.total.compoundId)
      if (ra !== undefined && rb !== undefined) return ra - rb
      if (ra !== undefined) return -1
      if (rb !== undefined) return 1
      return b.last - a.last
    })
    .map(({ total }) => total)
}

/** Each week's share of the largest one, 0 to 1: the height of the bars. */
export function barHeights(weekly: readonly number[]): number[] {
  const max = Math.max(0, ...weekly)
  return weekly.map((mg) => (max > 0 ? mg / max : 0))
}
