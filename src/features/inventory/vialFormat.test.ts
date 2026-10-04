import { describe, expect, it } from 'vitest'
import { fmtConc, fmtMg, fmtPerUnit, fmtUnits } from './vialFormat'

describe('vial number formats', () => {
  it('writes concentration, units and mg the same way everywhere', () => {
    expect(fmtConc(10, 'es')).toBe('10 mg/mL')
    expect(fmtConc(5 / 3, 'es')).toBe('1,67 mg/mL')
    expect(fmtConc(16.6667, 'es')).toBe('16,7 mg/mL')
    expect(fmtConc(5 / 3, 'en')).toBe('1.67 mg/mL')
    expect(fmtUnits(12, 'es')).toBe('12 U')
    expect(fmtUnits(7.5, 'es')).toBe('7,5 U')
    expect(fmtMg(8.5, 'es')).toBe('8,5 mg')
    expect(fmtMg(10, 'es')).toBe('10 mg')
  })

  it('says what a unit holds in the unit the substance is dosed in', () => {
    // MOTS-c, 10 mg/mL: 1 U = 0.1 mg, and it is dosed in mg.
    expect(fmtPerUnit(0.1, 'mg', 'es')).toBe('0,1 mg')
    expect(fmtPerUnit(0.1667, 'mg', 'es')).toBe('0,167 mg')
    // CJC-1295 in 3 mL: 1.667 mg/mL, 1 U = 16.7 mcg, dosed in mcg.
    expect(fmtPerUnit(5 / 300, 'mcg', 'es')).toBe('16,7 mcg')
    expect(fmtPerUnit(0.1, 'mcg', 'es')).toBe('100 mcg')
  })

  it('switches a milligram substance to mcg when the figure gets small', () => {
    expect(fmtPerUnit(0.0333, 'mg', 'es')).toBe('33,3 mcg')
    expect(fmtPerUnit(0.005, 'mg', 'es')).toBe('5 mcg')
    expect(fmtPerUnit(0.00333, 'mg', 'en')).toBe('3.33 mcg')
  })

  it('switches a microgram substance to mg from a milligram up', () => {
    expect(fmtPerUnit(1.2, 'mcg', 'es')).toBe('1,2 mg')
  })
})
