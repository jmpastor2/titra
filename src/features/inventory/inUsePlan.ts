/**
 * What a vial will give once it has water: a reconstituted vial is good for `IN_USE_DAYS`, so
 * the plan walks the person's doses over those days (how many it covers, the mg used, the mg
 * thrown away when the period ends) and proposes the water that makes each dose a whole
 * number of syringe units that fits the barrel. Pure; see inUsePlan.test.ts.
 */
import { addDays } from 'date-fns'
import type { InventoryRow, ProtocolRow } from '@/data/database.types'
import { toProtocolLike } from '@/data/mappers'
import { componentsAt, scheduledDoses } from '@/domain/dosing/schedule'
import { IN_USE_DAYS } from './alerts'

const EPS = 1e-9
/** Units a dose is best drawn at: big enough to measure, small enough to fit. */
const TARGET_U = 10
const MIN_U = 4

export interface InUsePlan {
  /** Administrations in the in-use period the vial covers. */
  doses: number
  /** Administrations planned in the period. */
  planned: number
  /** mg of the vial's own compound used in the period, and what is left at its end. */
  usedMg: number
  leftMg: number
  /** The first administration it cannot cover, when it runs out inside the period. */
  runsOutAt: Date | null
  /** Last day of the in-use period. */
  until: Date
  /** The proposed water, and the units of the first dose with it. */
  waterMl: number | null
  units: number | null
}

type VialLike = Pick<InventoryRow, 'compound_id' | 'total_mg' | 'remaining_mg'>

/** mg of `compoundId` each administration of `protocol` gives, over [from, to). */
function dosesOf(protocol: ProtocolRow, compoundId: string, from: Date, to: Date) {
  const pl = toProtocolLike(protocol)
  return scheduledDoses(pl, from, to).flatMap((s) => {
    const mg =
      protocol.compound_id === compoundId
        ? s.doseMg
        : componentsAt(pl, s.doseMg).find((c) => c.compoundId === compoundId)?.doseMg
    return mg && mg > 0 ? [{ at: s.at, mg }] : []
  })
}

/**
 * The water for a vial of `contentMg` whose doses (`dosesMg`, the ones of its 28 days) all
 * fit the barrel and are at least `MIN_U`: half-millilitre steps (what is measured with a
 * syringe of water), preferring the most doses drawn at a whole number of units, then a first
 * dose nearest 10 U. Whole units never win over fitting: 45 U does not go in a 30 U syringe.
 */
export function proposeWater(
  dosesMg: number | readonly number[],
  contentMg: number,
  barrelU: number,
): { waterMl: number; units: number } | null {
  const doses = (typeof dosesMg === 'number' ? [dosesMg] : [...new Set(dosesMg)]).filter(
    (d) => d > 0,
  )
  if (doses.length === 0 || !(contentMg > 0)) return null
  const unitsFor = (mg: number, ml: number) => (100 * mg * ml) / contentMg
  const maxMl = contentMg >= 100 ? 10 : 5
  let best: { waterMl: number; units: number; whole: number; gap: number } | null = null
  for (let i = 1; i * 0.5 <= maxMl + EPS; i++) {
    const ml = i * 0.5
    const units = doses.map((d) => unitsFor(d, ml))
    if (Math.min(...units) < MIN_U - EPS || Math.max(...units) > barrelU + EPS) continue
    const whole = units.filter((u) => Math.abs(u - Math.round(u)) <= 0.05).length
    const gap = Math.abs(units[0]! - TARGET_U)
    if (!best || whole > best.whole || (whole === best.whole && gap < best.gap))
      best = { waterMl: ml, units: Math.round(units[0]! * 10) / 10, whole, gap }
  }
  return best && { waterMl: best.waterMl, units: best.units }
}

export function inUsePlan(
  vial: VialLike,
  protocols: readonly ProtocolRow[],
  start: Date,
  barrelU: number,
): InUsePlan | null {
  const until = addDays(start, IN_USE_DAYS)
  const events = protocols
    .filter((p) => p.status === 'active')
    .flatMap((p) => dosesOf(p, vial.compound_id, start, until))
    .toSorted((a, b) => a.at.getTime() - b.at.getTime())
  if (events.length === 0) return null

  const content = Number(vial.remaining_mg)
  let left = content
  let doses = 0
  let runsOutAt: Date | null = null
  for (const e of events) {
    if (e.mg > left + EPS) {
      runsOutAt = e.at
      break
    }
    left -= e.mg
    doses++
  }
  // The syringe's capacity first; a bigger one only when no water fits it.
  const doseList = events.map((e) => e.mg)
  const water =
    proposeWater(doseList, Number(vial.total_mg), barrelU) ??
    proposeWater(doseList, Number(vial.total_mg), 100)
  return {
    doses,
    planned: events.length,
    usedMg: content - left,
    leftMg: runsOutAt ? 0 : Math.max(0, left),
    runsOutAt,
    until: addDays(until, -1),
    waterMl: water?.waterMl ?? null,
    units: water?.units ?? null,
  }
}
