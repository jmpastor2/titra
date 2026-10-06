import { compoundColor } from '@/content/substanceColor'
import type { Database, InventoryRow } from '@/data/database.types'
import { parseBlend } from '@/data/mappers'
import type { DrawPart } from '@/domain/dosing/draw'
import { vialConcentration } from '@/domain/dosing/reconstitution'

/**
 * What the syringe maths read from a vial. A vial that is not saved yet (the form being
 * filled in, the reconstitution being previewed) can be described with just these.
 */
export type VialFields = Pick<
  InventoryRow,
  'id' | 'compound_id' | 'total_mg' | 'components' | 'concentration_mg_per_ml' | 'diluent_ml'
>

export interface VialContent {
  compoundId: string
  /** mg of this compound in the whole vial. */
  mg: number
}

/** Rounding slack when comparing mg that went through divisions. */
const EPS = 1e-9

/** What a vial holds: its primary compound, plus the others when it is a blend. */
export function vialContents(item: VialFields): VialContent[] {
  return [
    { compoundId: item.compound_id, mg: Number(item.total_mg) },
    ...parseBlend(item.components),
  ]
}

/** A blend holds several compounds in one liquid, e.g. CJC-1295 + ipamorelin 5 + 5 mg. */
export function isBlend(item: VialFields): boolean {
  return parseBlend(item.components).length > 0
}

export function vialHas(item: VialFields, compoundId: string): boolean {
  return vialContents(item).some((c) => c.compoundId === compoundId)
}

/** mg/mL of one compound of the vial; for a blend, in proportion to its content. */
export function concentrationFor(item: VialFields, compoundId: string): number | null {
  const primary = concentrationOf(item)
  if (!primary) return null
  if (compoundId === item.compound_id) return primary
  const part = parseBlend(item.components).find((c) => c.compoundId === compoundId)
  const total = Number(item.total_mg)
  return part && total > 0 ? primary * (part.mg / total) : null
}

/** Concentration of a vial: stored, or derived from its content and bacteriostatic water. */
export function concentrationOf(item: VialFields): number | null {
  const c = Number(item.concentration_mg_per_ml)
  if (c > 0) return c
  return vialConcentration(Number(item.total_mg), item.diluent_ml ? Number(item.diluent_ml) : null)
}

/** How much of the vial is left, 0 to 1. */
export function fillOf(item: Pick<InventoryRow, 'total_mg' | 'remaining_mg'>): number {
  const total = Number(item.total_mg)
  return total > 0 ? Math.max(0, Math.min(1, Number(item.remaining_mg) / total)) : 0
}

/** mL of water a reconstituted vial got: as saved, else worked back from its concentration. */
export function waterOf(item: VialFields): number | null {
  const stored = Number(item.diluent_ml)
  if (stored > 0) return stored
  const conc = concentrationOf(item)
  const total = Number(item.total_mg)
  return conc && total > 0 ? total / conc : null
}

/** mg of one compound still in the vial; blend partners go down in proportion. */
export function remainingOf(item: InventoryRow, compoundId: string): number {
  const total = Number(item.total_mg)
  const left = Number(item.remaining_mg)
  const part = vialContents(item).find((c) => c.compoundId === compoundId)
  return part && total > 0 ? left * (part.mg / total) : 0
}

/** No concentration: no water has been added (or the product has none to add). */
export function isLyophilised(item: VialFields): boolean {
  return concentrationOf(item) === null
}

/** Powder still to be mixed with water. Pens and tablets come ready: they never do. */
export function needsReconstitution(item: VialFields & Pick<InventoryRow, 'form'>): boolean {
  return (item.form === 'vial' || item.form === 'cartridge') && isLyophilised(item)
}

/** In use, in reserve (powder still to mix, or not opened yet) or finished (empty or archived). */
export type VialState = 'inUse' | 'reserve' | 'finished'

export function vialState(item: InventoryRow): VialState {
  if (item.archived || Number(item.remaining_mg) <= 0) return 'finished'
  if (needsReconstitution(item)) return 'reserve'
  return concentrationOf(item) || item.opened_at ? 'inUse' : 'reserve'
}

/**
 * The vial a dose is drawn from: one with something left, reconstituted before
 * lyophilised, and the oldest opened first so it is used up before it expires.
 *
 * With `neededMg` (the dose about to be drawn) a vial that cannot cover it is passed
 * over for another reconstituted vial that can; when none can, the preferred vial stays.
 */
export function activeVial(
  vials: readonly InventoryRow[],
  compoundId: string,
  neededMg?: number,
): InventoryRow | undefined {
  const rank = (v: InventoryRow) => (concentrationOf(v) ? 0 : 1)
  const candidates = vials
    .filter((v) => vialHas(v, compoundId) && !v.archived && Number(v.remaining_mg) > 0)
    .toSorted(
      (a, b) => rank(a) - rank(b) || (a.opened_at ?? '9999').localeCompare(b.opened_at ?? '9999'),
    )
  const preferred = candidates[0]
  if (!preferred || !(neededMg !== undefined && neededMg > 0)) return preferred
  const covers = (v: InventoryRow) => remainingOf(v, compoundId) >= neededMg - EPS
  if (covers(preferred)) return preferred
  return candidates.find((v) => concentrationOf(v) && covers(v)) ?? preferred
}

export interface VialRunway {
  /** Upcoming administrations the vial still covers. */
  doses: number
  /** The first administration it cannot cover: have the next vial ready by then. */
  runsOutAt: Date | null
  /** Dose of the next administration, for "your dose → units". */
  nextDoseMg: number | null
  /** Set by the expiry-aware supply walk (supply.ts): what ends it, and mg thrown away. */
  limitedBy?: 'expiry' | 'amount' | null
  wastedMg?: number
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
    if (u.doseMg > left + EPS) {
      return { doses, runsOutAt: u.at, nextDoseMg: upcoming[0]?.doseMg ?? null }
    }
    left -= u.doseMg
    doses++
  }
  return { doses, runsOutAt: null, nextDoseMg: upcoming[0]?.doseMg ?? null }
}

/**
 * One compound's share of a draw from the vial it comes out of. Compounds of the same
 * blend vial carry the same blendKey, so they are drawn as a single load. Without an
 * explicit vial it is the one the dose is drawn from (see activeVial).
 */
export function drawPartFor(
  vials: readonly InventoryRow[],
  compoundId: string,
  doseMg: number,
  vial: VialFields | undefined = activeVial(vials, compoundId, doseMg),
): DrawPart {
  return {
    compoundId,
    doseMg,
    concMgPerMl: vial ? concentrationFor(vial, compoundId) : null,
    ...(vial && isBlend(vial) ? { blendKey: vial.id } : {}),
  }
}

export interface RestockLine {
  compoundId: string
  /** The compound plus any blend partners sharing its vials, for the label. */
  partners: string[]
  /** mg available across every vial that holds it, open or in reserve. */
  availableMg: number
  vials: number
  /** Vials still powder, to be reconstituted. */
  reserve: number
  runway: VialRunway
}

/**
 * Supply per compound in use: everything in stock, walked against the upcoming doses,
 * so a titration step-up shortens it. `upcoming` is per compound, soonest first. `walk`
 * decides how far the stock goes; by default all the mg are pooled, and the app passes
 * the expiry-aware walk (supply.ts) so a vial thrown away on its discard date counts.
 */
export function restockPlan(
  vials: readonly InventoryRow[],
  upcoming: ReadonlyMap<string, readonly { at: Date; doseMg: number }[]>,
  walk?: (
    holding: readonly InventoryRow[],
    compoundId: string,
    doses: readonly { at: Date; doseMg: number }[],
  ) => VialRunway,
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
      reserve: holding.filter((v) => needsReconstitution(v) && Number(v.remaining_mg) > 0).length,
      runway: walk ? walk(holding, compoundId, doses) : vialRunway(availableMg, doses),
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
  const contents = vialContents(item)
  return {
    color: compoundColor(item.compound_id),
    ...(contents.length > 1 ? { colors: contents.map((c) => compoundColor(c.compoundId)) } : {}),
    state: needsReconstitution(item) ? 'powder' : 'liquid',
    fill: fillOf(item),
  }
}

/** The row to insert for "another one like this": same compounds, label and content, unopened (powder stays powder). */
export type NewVial = Database['public']['Tables']['inventory']['Insert']

export function unopenedCopy(item: InventoryRow): NewVial {
  return {
    patient_id: item.patient_id,
    compound_id: item.compound_id,
    form: item.form,
    label: item.label,
    components: item.components,
    total_mg: item.total_mg,
    remaining_mg: item.total_mg,
    concentration_mg_per_ml: null,
    diluent_ml: null,
    opened_at: null,
    expires_at: null,
    lot: null,
    storage_notes: null,
  }
}

/** The newest vial of a compound, archived ones included: the best template for restocking it. */
export function latestVialOf(
  vials: readonly InventoryRow[],
  compoundId: string,
): InventoryRow | undefined {
  return vials
    .filter((v) => v.compound_id === compoundId)
    .toSorted((a, b) => b.created_at.localeCompare(a.created_at))[0]
}
