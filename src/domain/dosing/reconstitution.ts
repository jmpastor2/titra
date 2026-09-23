/**
 * Reconstitution & syringe maths for lyophilised peptides.
 * U-100 insulin syringes: 100 units = 1 mL, so 1 unit = 0.01 mL.
 */

export const UNITS_PER_ML_U100 = 100

export interface Reconstitution {
  vialMg: number
  diluentMl: number
  /** mg per mL after reconstitution. */
  concentrationMgPerMl: number
  /** mcg per U-100 unit (0.01 mL). */
  mcgPerUnit: number
}

export function reconstitute(vialMg: number, diluentMl: number): Reconstitution {
  assertPositive(vialMg, 'vialMg')
  assertPositive(diluentMl, 'diluentMl')
  const concentrationMgPerMl = vialMg / diluentMl
  return {
    vialMg,
    diluentMl,
    concentrationMgPerMl,
    mcgPerUnit: (concentrationMgPerMl * 1000) / UNITS_PER_ML_U100,
  }
}

export interface DrawUp {
  doseMcg: number
  volumeMl: number
  /** Units on a U-100 syringe. */
  units: number
  /** Units rounded to the nearest half-unit mark, and the resulting actual dose. */
  unitsRounded: number
  actualDoseMcg: number
  /** Number of doses obtainable from the vial. */
  dosesPerVial: number
}

export function drawUp(rec: Reconstitution, doseMcg: number): DrawUp {
  assertPositive(doseMcg, 'doseMcg')
  const volumeMl = doseMcg / 1000 / rec.concentrationMgPerMl
  const units = volumeMl * UNITS_PER_ML_U100
  const unitsRounded = Math.round(units * 2) / 2
  const actualDoseMcg = unitsRounded * rec.mcgPerUnit
  return {
    doseMcg,
    volumeMl,
    units,
    unitsRounded,
    actualDoseMcg,
    dosesPerVial: Math.floor((rec.vialMg * 1000) / doseMcg + 1e-9),
  }
}

/** Given a target dose and a wish for a "nice" unit count, suggest a diluent volume. */
export function suggestDiluentMl(vialMg: number, doseMcg: number, targetUnits = 10): number {
  assertPositive(vialMg, 'vialMg')
  assertPositive(doseMcg, 'doseMcg')
  assertPositive(targetUnits, 'targetUnits')
  // units = doseMcg / mcgPerUnit, mcgPerUnit = vialMg*1000/diluentMl/100
  // → diluentMl = units * vialMg * 10 / doseMcg
  return (targetUnits * vialMg * 10) / doseMcg
}

export function mcgToMg(mcg: number): number {
  return mcg / 1000
}
export function mgToMcg(mg: number): number {
  return mg * 1000
}

/**
 * Pen "clicks" for multi-dose pens dialled in mg (e.g. compounded semaglutide pens).
 * Given the pen's mg per click, return clicks for a dose (rounded to nearest click).
 */
export function penClicks(
  doseMg: number,
  mgPerClick: number,
): { clicks: number; actualMg: number } {
  assertPositive(doseMg, 'doseMg')
  assertPositive(mgPerClick, 'mgPerClick')
  const clicks = Math.round(doseMg / mgPerClick)
  return { clicks, actualMg: clicks * mgPerClick }
}

function assertPositive(v: number, name: string): void {
  if (!(Number.isFinite(v) && v > 0)) throw new RangeError(`${name} must be a positive number`)
}
