/**
 * Reconstituting a vial, in the units people really measure with: a 1 mL insulin syringe
 * (U-100, 100 U = 1 mL). Pure; see reconstitute.test.ts.
 *
 * The trap this exists for: the water field once took mL, someone typed 100 meaning
 * 100 units (1 mL) and the vial was saved with 100 mL, a hundred times too weak. So water
 * is entered in units by default, the equivalent is always shown, and implausible amounts
 * are flagged (never blocked) with a one-tap correction.
 */
import type { InventoryRow, ProtocolRow } from '@/data/database.types'
import { toProtocolLike } from '@/data/mappers'
import { MIN_PRECISE_UNITS, planDraw } from '@/domain/dosing/draw'
import { UNITS_PER_ML_U100, vialConcentration } from '@/domain/dosing/reconstitution'
import { componentsAt, currentStep, stepWindows } from '@/domain/dosing/schedule'
import { concentrationFor, drawPartFor, vialContents, vialHas, type VialFields } from './vials'

export type WaterUnit = 'U' | 'mL'

/** More water than this for one vial is not plausible: ask before believing it. */
const MAX_PLAUSIBLE_ML = 10
/** A mL figure from this up is almost certainly syringe units: no vial takes that much water. */
const UNITS_TYPED_AS_ML = 20
/** Less water than this (10 U) is most likely a mL amount typed into the units field. */
const MIN_PLAUSIBLE_ML = 0.1
/** A 1 mL syringe holds 100 U. */
const MAX_DRAW_UNITS = UNITS_PER_ML_U100

/** Number from what was typed; accepts a decimal comma. NaN when it is not a number. */
export function parseAmount(text: string): number {
  const s = text.trim().replace(',', '.')
  return s === '' ? Number.NaN : Number(s)
}

export const isPositive = (n: number): boolean => Number.isFinite(n) && n > 0

export function waterToMl(amount: number, unit: WaterUnit): number {
  return unit === 'U' ? amount / UNITS_PER_ML_U100 : amount
}

export function mlToAmount(ml: number, unit: WaterUnit): number {
  return unit === 'U' ? ml * UNITS_PER_ML_U100 : ml
}

/** The water as the column keeps it (numeric(8,3)): never float noise. */
const roundMl = (ml: number) => Math.round(ml * 1000) / 1000

/** Plain number for a text field: no thousands separators, no float noise. */
export function plainAmount(n: number): string {
  return String(Math.round(n * 1000) / 1000)
}

/**
 * The same water in the other unit, as text for the field. Text that is not an amount yet
 * is left alone, so switching unit never throws away what is being typed.
 */
export function convertAmount(text: string, from: WaterUnit, to: WaterUnit): string {
  const n = parseAmount(text)
  if (!isPositive(n)) return text
  return plainAmount(mlToAmount(waterToMl(n, from), to))
}

/** Shortcut amounts in mL: 1–3 for peptide vials, 2–10 for the hundreds-of-mg kind. */
export function waterShortcuts(contentMg: number): readonly number[] {
  return contentMg >= 100 ? [2, 5, 10] : [1, 2, 3]
}

/** Total mg of everything in the vial, blend partners included. */
export function contentMgOf(vial: VialFields): number {
  return vialContents(vial).reduce((sum, c) => sum + c.mg, 0)
}

/* --------------------------------------------------------------- current doses */

export interface CurrentDose {
  protocolId: string
  protocolName: string
  compoundId: string
  doseMg: number
}

/**
 * The dose each active protocol gives now, for the compounds asked about: the step it is
 * on (the first one before it starts, the last one after it ends), blend and stack
 * partners following the titration in proportion. Off-cycle steps give nothing.
 */
export function currentDoses(
  protocols: readonly ProtocolRow[],
  compoundIds: readonly string[],
  now: Date,
): CurrentDose[] {
  const out: CurrentDose[] = []
  for (const p of protocols) {
    if (p.status !== 'active') continue
    const pl = toProtocolLike(p)
    const windows = stepWindows(pl)
    const first = windows[0]
    const active =
      currentStep(pl, now) ?? (first && now < first.start ? first : windows[windows.length - 1])
    const doseMg = active && !active.step.pause ? active.step.doseMg : 0
    if (!(doseMg > 0)) continue
    for (const part of [{ compoundId: p.compound_id, doseMg }, ...componentsAt(pl, doseMg)])
      if (compoundIds.includes(part.compoundId))
        out.push({ protocolId: p.id, protocolName: p.name, ...part })
  }
  return out
}

/* ----------------------------------------------------------------------- preview */

export interface PreviewCompound {
  compoundId: string
  /** mg of it in the whole vial. */
  mg: number
  concMgPerMl: number
  /** mg in one syringe unit (0.01 mL). */
  mgPerUnit: number
}

export interface PreviewDraw {
  protocolId: string
  protocolName: string
  /** What the protocol takes from this vial in one administration. */
  parts: { compoundId: string; doseMg: number }[]
  /** Syringe units for it, to the nearest half-unit mark. A blend is a single draw. */
  units: number
}

export interface ReconstitutionPreview {
  /** mg/mL of the vial's primary compound. */
  concentration: number
  compounds: PreviewCompound[]
  draws: PreviewDraw[]
}

/**
 * What adding `waterMl` gives: the concentration, how much of each compound is in one
 * syringe unit and the units the current doses would need. Null without usable water.
 */
export function reconstitutionPreview(
  vial: VialFields,
  waterMl: number,
  doses: readonly CurrentDose[],
): ReconstitutionPreview | null {
  const water = roundMl(waterMl)
  const concentration = isPositive(water) ? vialConcentration(Number(vial.total_mg), water) : null
  if (!concentration) return null
  const reconstituted: VialFields = {
    ...vial,
    diluent_ml: water,
    concentration_mg_per_ml: concentration,
  }

  const compounds = vialContents(reconstituted).flatMap((c): PreviewCompound[] => {
    const concMgPerMl = concentrationFor(reconstituted, c.compoundId)
    return concMgPerMl ? [{ ...c, concMgPerMl, mgPerUnit: concMgPerMl / UNITS_PER_ML_U100 }] : []
  })

  const byProtocol = new Map<string, CurrentDose[]>()
  for (const d of doses)
    if (vialHas(reconstituted, d.compoundId))
      byProtocol.set(d.protocolId, [...(byProtocol.get(d.protocolId) ?? []), d])
  const draws: PreviewDraw[] = []
  for (const [protocolId, parts] of byProtocol) {
    const plan = planDraw(parts.map((p) => drawPartFor([], p.compoundId, p.doseMg, reconstituted)))
    const first = parts[0]
    if (plan && first)
      draws.push({
        protocolId,
        protocolName: first.protocolName,
        parts: parts.map((p) => ({ compoundId: p.compoundId, doseMg: p.doseMg })),
        units: plan.totalUnits,
      })
  }
  return { concentration, compounds, draws }
}

/** What reconstituting changes in the row, and nothing else (label, content, lot stay). */
export function reconstitutionPatch(
  vial: Pick<InventoryRow, 'total_mg'>,
  waterMl: number,
  openedAt: string,
): Pick<InventoryRow, 'diluent_ml' | 'concentration_mg_per_ml' | 'opened_at'> | null {
  const water = roundMl(waterMl)
  const concentration = isPositive(water) ? vialConcentration(Number(vial.total_mg), water) : null
  if (!concentration) return null
  return { diluent_ml: water, concentration_mg_per_ml: concentration, opened_at: openedAt || null }
}

/* ------------------------------------------------------------------------ guard */

export type WaterIssue =
  /** Typed in mL what looks like syringe units: 100 mL, probably 100 U = 1 mL. */
  | { kind: 'unitsAsMl'; amount: number; ml: number; contentMg: number }
  /** Typed in units what looks like mL: 2 U of water, probably 2 mL. */
  | { kind: 'mlAsUnits'; amount: number }
  | { kind: 'tooMuch'; ml: number; contentMg: number; concMgPerMl: number }
  | { kind: 'doseTooSmall'; units: number; compoundIds: string[] }
  | { kind: 'doseTooBig'; units: number; compoundIds: string[] }
  /** Fits a 1 mL syringe but not the one this person injects with. */
  | { kind: 'overBarrel'; units: number; capacity: number; compoundIds: string[] }

export interface WaterCheck {
  amount: number
  unit: WaterUnit
  /** mg in the whole vial. */
  contentMg: number
  draws: readonly Pick<PreviewDraw, 'units' | 'parts'>[]
  /** Capacity in units of the syringe the person uses, when they chose one. */
  barrel?: number
}

/**
 * Reasons to doubt the water amount, most important first. Never a reason to refuse it:
 * the person knows their vial. Empty while the amount is not a number.
 */
export function waterIssues({ amount, unit, contentMg, draws, barrel }: WaterCheck): WaterIssue[] {
  if (!isPositive(amount)) return []
  const ml = waterToMl(amount, unit)
  const issues: WaterIssue[] = []

  // The reading as units has to be a sensible amount of water itself (up to 10 mL).
  const asUnitsMl = amount / UNITS_PER_ML_U100
  if (unit === 'mL' && amount >= UNITS_TYPED_AS_ML && asUnitsMl <= MAX_PLAUSIBLE_ML)
    issues.push({ kind: 'unitsAsMl', amount, ml: asUnitsMl, contentMg })
  else if (ml > MAX_PLAUSIBLE_ML)
    issues.push({ kind: 'tooMuch', ml, contentMg, concMgPerMl: contentMg / ml })
  if (unit === 'U' && ml < MIN_PLAUSIBLE_ML) issues.push({ kind: 'mlAsUnits', amount })
  // A doubtful amount of water makes every dose look wrong: fix that one first.
  if (issues.length > 0) return issues

  for (const d of draws) {
    const compoundIds = d.parts.map((p) => p.compoundId)
    if (d.units < MIN_PRECISE_UNITS)
      issues.push({ kind: 'doseTooSmall', units: d.units, compoundIds })
    else if (d.units > MAX_DRAW_UNITS)
      issues.push({ kind: 'doseTooBig', units: d.units, compoundIds })
    else if (barrel !== undefined && d.units > barrel)
      issues.push({ kind: 'overBarrel', units: d.units, capacity: barrel, compoundIds })
  }
  // Two protocols with the same dose of the same thing say it once.
  const seen = new Set<string>()
  return issues.filter((i) => !seen.has(issueKey(i)) && seen.add(issueKey(i)))
}

/** Identity of an issue, to show each one once and to key it in a list. */
export function issueKey(issue: WaterIssue): string {
  if (!('compoundIds' in issue)) return issue.kind
  return `${issue.kind}:${issue.units}:${issue.compoundIds.join('+')}`
}
