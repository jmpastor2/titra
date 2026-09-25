import type { InventoryRow } from '@/data/database.types'
import { compoundColor } from '@/content/substanceColor'
import { parseBlend } from '@/data/mappers'
import type { DrawPart } from '@/domain/dosing/draw'
import { vialConcentration } from '@/domain/dosing/reconstitution'

export interface VialContent {
  compoundId: string
  /** mg of this compound in the whole vial. */
  mg: number
}

/** What a vial holds: its primary compound, plus the others when it is a blend. */
export function vialContents(item: InventoryRow): VialContent[] {
  return [
    { compoundId: item.compound_id, mg: Number(item.total_mg) },
    ...parseBlend(item.components),
  ]
}

/** A blend holds several compounds in one liquid, e.g. CJC-1295 + ipamorelin 5 + 5 mg. */
export function isBlend(item: InventoryRow): boolean {
  return parseBlend(item.components).length > 0
}

export function vialHas(item: InventoryRow, compoundId: string): boolean {
  return vialContents(item).some((c) => c.compoundId === compoundId)
}

/** mg/mL of one compound of the vial; for a blend, in proportion to its content. */
export function concentrationFor(item: InventoryRow, compoundId: string): number | null {
  const primary = concentrationOf(item)
  if (!primary) return null
  if (compoundId === item.compound_id) return primary
  const part = parseBlend(item.components).find((c) => c.compoundId === compoundId)
  const total = Number(item.total_mg)
  return part && total > 0 ? primary * (part.mg / total) : null
}

/** Concentration of a vial: stored, or derived from its content and bacteriostatic water. */
export function concentrationOf(item: InventoryRow): number | null {
  const c = Number(item.concentration_mg_per_ml)
  if (c > 0) return c
  return vialConcentration(Number(item.total_mg), item.diluent_ml ? Number(item.diluent_ml) : null)
}

/**
 * The vial a dose is drawn from: one with something left, reconstituted before
 * lyophilised, and the oldest opened first so it is used up before it expires.
 */
export function activeVial(
  vials: readonly InventoryRow[],
  compoundId: string,
): InventoryRow | undefined {
  const rank = (v: InventoryRow) => (concentrationOf(v) ? 0 : 1)
  return vials
    .filter((v) => vialHas(v, compoundId) && !v.archived && Number(v.remaining_mg) > 0)
    .toSorted(
      (a, b) => rank(a) - rank(b) || (a.opened_at ?? '9999').localeCompare(b.opened_at ?? '9999'),
    )[0]
}

export interface VialRunway {
  /** Upcoming administrations the vial still covers. */
  doses: number
  /** The first administration it cannot cover: have the next vial ready by then. */
  runsOutAt: Date | null
  /** Dose of the next administration, for "your dose → units". */
  nextDoseMg: number | null
}

/**
 * How far a vial goes, walking the upcoming administrations in order (so a titration
 * step up is accounted for). `upcoming` holds this compound's doses, soonest first.
 */
export function vialRunway(
  remainingMg: number,
  upcoming: readonly { at: Date; doseMg: number }[],
): VialRunway {
  let left = remainingMg
  let doses = 0
  for (const u of upcoming) {
    if (u.doseMg > left + 1e-9) {
      return { doses, runsOutAt: u.at, nextDoseMg: upcoming[0]?.doseMg ?? null }
    }
    left -= u.doseMg
    doses++
  }
  return { doses, runsOutAt: null, nextDoseMg: upcoming[0]?.doseMg ?? null }
}

/**
 * One compound's share of a draw from the vial it comes out of. Compounds of the same
 * blend vial carry the same blendKey, so they are drawn as a single load.
 */
export function drawPartFor(
  vials: readonly InventoryRow[],
  compoundId: string,
  doseMg: number,
  vial: InventoryRow | undefined = activeVial(vials, compoundId),
): DrawPart {
  return {
    compoundId,
    doseMg,
    concMgPerMl: vial ? concentrationFor(vial, compoundId) : null,
    ...(vial && isBlend(vial) ? { blendKey: vial.id } : {}),
  }
}

/** mg of one compound still in the vial; blend partners go down in proportion. */
export function remainingOf(item: InventoryRow, compoundId: string): number {
  const total = Number(item.total_mg)
  const left = Number(item.remaining_mg)
  const part = vialContents(item).find((c) => c.compoundId === compoundId)
  return part && total > 0 ? left * (part.mg / total) : 0
}

export interface RestockLine {
  compoundId: string
  /** The compound plus any blend partners sharing its vials, for the label. */
  partners: string[]
  /** mg available across every vial that holds it, open or in reserve. */
  availableMg: number
  vials: number
  /** Vials still lyophilised (not reconstituted). */
  reserve: number
  runway: VialRunway
}

/**
 * Supply per compound in use: everything in stock, walked against the upcoming doses,
 * so a titration step-up shortens it. `upcoming` is per compound, soonest first.
 */
export function restockPlan(
  vials: readonly InventoryRow[],
  upcoming: ReadonlyMap<string, readonly { at: Date; doseMg: number }[]>,
): RestockLine[] {
  return [...upcoming.entries()].map(([compoundId, doses]) => {
    const holding = vials.filter((v) => !v.archived && vialHas(v, compoundId))
    const availableMg = holding.reduce((s, v) => s + remainingOf(v, compoundId), 0)
    const partners = [
      compoundId,
      ...new Set(
        holding
          .flatMap((v) => vialContents(v).map((c) => c.compoundId))
          .filter((c) => c !== compoundId),
      ),
    ]
    return {
      compoundId,
      partners,
      availableMg,
      vials: holding.filter((v) => Number(v.remaining_mg) > 0).length,
      reserve: holding.filter((v) => !concentrationOf(v) && Number(v.remaining_mg) > 0).length,
      runway: vialRunway(availableMg, doses),
    }
  })
}

/** How the vial icon should look: powder until reconstituted, striped for a blend. */
export function vialLook(item: InventoryRow): {
  color: string
  colors?: string[]
  state: 'liquid' | 'powder'
  fill: number
} {
  const total = Number(item.total_mg)
  const contents = vialContents(item)
  return {
    color: compoundColor(item.compound_id),
    ...(contents.length > 1 ? { colors: contents.map((c) => compoundColor(c.compoundId)) } : {}),
    state: concentrationOf(item) ? 'liquid' : 'powder',
    fill: total > 0 ? Number(item.remaining_mg) / total : 0,
  }
}
