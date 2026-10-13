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
 * The water that makes `doseMg` of a vial of `contentMg` a whole number of units within the
 * barrel, nearest 10 U; half-millilitre steps first, then tenths.
 */
export function proposeWater(
  doseMg: number,
  contentMg: number,
  barrelU: number,
): { waterMl: number; units: number } | null {
  if (!(doseMg > 0 && contentMg > 0)) return null
  const unitsFor = (ml: number) => (100 * doseMg * ml) / contentMg
  const maxMl = contentMg >= 100 ? 10 : 5
  const pick = (step: number, whole: boolean) => {
    let best: { waterMl: number; units: number } | null = null
    for (let i = 1; i * step <= maxMl + EPS; i++) {
      const ml = Math.round(i * step * 10) / 10
      const u = unitsFor(ml)
      if (u < MIN_U - EPS || u > barrelU + EPS) continue
      if (whole && Math.abs(u - Math.round(u)) > 0.05) continue
      if (!best || Math.abs(u - TARGET_U) < Math.abs(best.units - TARGET_U))
        best = { waterMl: ml, units: whole ? Math.round(u) : Math.round(u * 10) / 10 }
    }
    return best
  }
  return pick(0.5, true) ?? pick(0.1, true) ?? pick(0.1, false)
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
  const water = proposeWater(events[0]!.mg, Number(vial.total_mg), barrelU)
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
