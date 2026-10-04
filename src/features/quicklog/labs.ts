/**
 * Lab results for fast entry: the usual analytes with their adult reference ranges, the ones
 * the person has already logged (most recent first, with their unit and range) and the
 * in/out-of-range flag. Pure; see labs.test.ts.
 */
import type { LabResultRow } from '@/data/database.types'

export interface LabPreset {
  analyte: string
  unit: string
  low?: number
  high?: number
}

/** Common analytes for GLP-1 / peptide follow-up, with usual adult reference ranges. */
export const LAB_PRESETS: readonly LabPreset[] = [
  { analyte: 'HbA1c', unit: '%', low: 4, high: 5.6 },
  { analyte: 'Glucosa en ayunas', unit: 'mg/dL', low: 70, high: 99 },
  { analyte: 'Insulina basal', unit: 'µU/mL', low: 2, high: 25 },
  { analyte: 'Colesterol total', unit: 'mg/dL', high: 200 },
  { analyte: 'LDL', unit: 'mg/dL', high: 130 },
  { analyte: 'HDL', unit: 'mg/dL', low: 40 },
  { analyte: 'Triglicéridos', unit: 'mg/dL', high: 150 },
  { analyte: 'ALT', unit: 'U/L', low: 7, high: 56 },
  { analyte: 'AST', unit: 'U/L', low: 10, high: 40 },
  { analyte: 'Lipasa', unit: 'U/L', low: 13, high: 60 },
  { analyte: 'Amilasa', unit: 'U/L', low: 30, high: 110 },
  { analyte: 'Creatinina', unit: 'mg/dL', low: 0.6, high: 1.3 },
  { analyte: 'eGFR', unit: 'mL/min/1.73m²', low: 90 },
  { analyte: 'TSH', unit: 'µU/mL', low: 0.4, high: 4 },
  { analyte: 'IGF-1', unit: 'ng/mL', low: 100, high: 300 },
  { analyte: 'Testosterona total', unit: 'ng/dL', low: 300, high: 1000 },
  { analyte: 'Estradiol', unit: 'pg/mL', low: 10, high: 40 },
  { analyte: 'Vitamina B12', unit: 'pg/mL', low: 200, high: 900 },
  { analyte: 'Calcitonina', unit: 'pg/mL', high: 10 },
]

/** An analyte the person has logged before, as they logged it last. */
export interface LoggedAnalyte {
  analyte: string
  unit: string
  low: number | null
  high: number | null
  last: LabResultRow
}

const key = (name: string) => name.trim().toLocaleLowerCase()
const time = (r: LabResultRow) => Date.parse(`${r.drawn_at}T12:00`) || Date.parse(r.created_at) || 0

/** One entry per analyte, the most recently drawn first, carrying its latest result. */
export function loggedAnalytes(rows: readonly LabResultRow[]): LoggedAnalyte[] {
  const latest = new Map<string, LabResultRow>()
  for (const r of rows.toSorted((a, b) => time(b) - time(a))) {
    if (!latest.has(key(r.analyte))) latest.set(key(r.analyte), r)
  }
  return [...latest.values()].map((last) => ({
    analyte: last.analyte,
    unit: last.unit === '—' ? '' : last.unit,
    low: last.ref_low === null ? null : Number(last.ref_low),
    high: last.ref_high === null ? null : Number(last.ref_high),
    last,
  }))
}

export type LabFlag = 'low' | 'high' | 'ok'

/** Against the reference range; null when there is no range or no value. */
export function labFlag(
  value: number | null,
  low: number | null,
  high: number | null,
): LabFlag | null {
  if (value === null || !Number.isFinite(value)) return null
  if (low === null && high === null) return null
  if (low !== null && value < low) return 'low'
  if (high !== null && value > high) return 'high'
  return 'ok'
}

/** The unit and range to start from for an analyte: the person's own last, else the preset. */
export function defaultsFor(
  analyte: string,
  logged: readonly LoggedAnalyte[],
): { unit: string; low: number | null; high: number | null } | null {
  const own = logged.find((l) => key(l.analyte) === key(analyte))
  if (own) return { unit: own.unit, low: own.low, high: own.high }
  const preset = LAB_PRESETS.find((p) => key(p.analyte) === key(analyte))
  return preset ? { unit: preset.unit, low: preset.low ?? null, high: preset.high ?? null } : null
}
