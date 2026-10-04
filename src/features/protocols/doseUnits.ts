/**
 * Typing a dose the way the person thinks of it: syringe units (U), mg or mcg. Units only
 * mean something against the vial the dose is drawn from, so they need its concentration.
 * Compounds dosed in IU, insulin units or mL have no conversion: their number is kept as
 * typed ("native"). Pure; see doseUnits.test.ts.
 */
import type { DoseUnit } from '@/domain/types'
import { mgToUnits, unitsToMg } from '@/domain/dosing/reconstitution'
import { fmtDose, fmtNumber, type Locale } from '@/lib/format'

export type DoseEntry = 'units' | 'mg' | 'mcg' | 'native'

const isMass = (native: DoseUnit) => native === 'mg' || native === 'mcg'
const positive = (n: number) => Number.isFinite(n) && n > 0
const round6 = (n: number) => Math.round(n * 1e6) / 1e6

/** Entries offered for a compound: U only when the vial's concentration is known. */
export function entriesFor(native: DoseUnit, concMgPerMl: number | null): DoseEntry[] {
  if (!isMass(native)) return ['native']
  return positive(concMgPerMl ?? 0) ? ['units', 'mg', 'mcg'] : ['mg', 'mcg']
}

/** Where a person starts: syringe units when the vial allows it (it is what he draws). */
export function defaultEntry(native: DoseUnit, concMgPerMl: number | null): DoseEntry {
  if (!isMass(native)) return 'native'
  if (positive(concMgPerMl ?? 0)) return 'units'
  return native === 'mcg' ? 'mcg' : 'mg'
}

/** mg for an amount typed in `entry`; null when it is not a positive number or U has no vial. */
export function entryToMg(
  amount: number,
  entry: DoseEntry,
  concMgPerMl: number | null,
): number | null {
  if (!positive(amount)) return null
  if (entry === 'units') {
    const conc = concMgPerMl ?? 0
    return conc > 0 ? round6(unitsToMg(amount, conc)) : null
  }
  return round6(entry === 'mcg' ? amount / 1000 : amount)
}

/** The same dose written in `entry`; null for U without a concentration. */
export function mgToEntry(mg: number, entry: DoseEntry, concMgPerMl: number | null): number | null {
  if (!positive(mg)) return null
  if (entry === 'units') {
    const conc = concMgPerMl ?? 0
    return conc > 0 ? mgToUnits(mg, conc) : null
  }
  return entry === 'mcg' ? mg * 1000 : mg
}

/** What the input holds: a number typed with a comma or a dot; NaN while empty. */
export function parseAmount(text: string): number {
  const s = text.trim().replace(',', '.')
  return s === '' ? Number.NaN : Number(s)
}

/**
 * Fine enough that switching units and back never changes what was typed: U to 0.01, mg
 * to 0.1 mcg. Dot decimals, as the inputs take them.
 */
const DECIMALS: Record<DoseEntry, number> = { units: 2, mg: 4, mcg: 2, native: 3 }

export function formatAmount(amount: number, entry: DoseEntry): string {
  const f = 10 ** DECIMALS[entry]
  return String(Math.round(amount * f) / f)
}

/**
 * The text of the same dose after switching entries, so changing the toggle never silently
 * changes the dose. Left as typed when it cannot be converted (empty, or U without a vial).
 */
export function convertText(
  text: string,
  from: DoseEntry,
  to: DoseEntry,
  concMgPerMl: number | null,
): string {
  const mg = entryToMg(parseAmount(text), from, concMgPerMl)
  const next = mg === null ? null : mgToEntry(mg, to, concMgPerMl)
  return next === null ? text : formatAmount(next, to)
}

export interface Equivalent {
  entry: DoseEntry
  amount: number
}

/** The same dose in the entries not being typed, in reading order: U, mg, mcg. */
export function equivalents(
  mg: number,
  current: DoseEntry,
  native: DoseUnit,
  concMgPerMl: number | null,
): Equivalent[] {
  return entriesFor(native, concMgPerMl)
    .filter((entry) => entry !== current && entry !== 'native')
    .flatMap((entry) => {
      const amount = mgToEntry(mg, entry, concMgPerMl)
      return amount === null ? [] : [{ entry, amount }]
    })
}

/** "12 U", "0,2 mg", "200 mcg" for an equivalent. */
export function fmtEquivalent(e: Equivalent, locale: Locale): string {
  if (e.entry === 'units') return `${fmtNumber(e.amount, locale, 1)} U`
  if (e.entry === 'mcg') return fmtDose(e.amount / 1000, 'mcg', locale)
  return fmtDose(e.amount, 'mg', locale)
}

/** "= 0,2 mg · 200 mcg": what the typed dose is in the other entries, or '' when none apply. */
export function fmtEquivalents(
  mg: number | null,
  current: DoseEntry,
  native: DoseUnit,
  concMgPerMl: number | null,
  locale: Locale,
): string {
  if (mg === null) return ''
  const list = equivalents(mg, current, native, concMgPerMl)
  return list.length ? `= ${list.map((e) => fmtEquivalent(e, locale)).join(' · ')}` : ''
}

/** What one syringe unit holds of a compound at that concentration: "16,7 mcg", "0,1 mg". */
export function fmtPerUnit(concMgPerMl: number, locale: Locale): string {
  const mg = concMgPerMl / 100
  return mg >= 0.1 ? `${fmtNumber(mg, locale, 2)} mg` : `${fmtNumber(mg * 1000, locale, 1)} mcg`
}
