import { describe, expect, it } from 'vitest'
import {
  convertText,
  defaultEntry,
  entriesFor,
  entryToMg,
  equivalents,
  fmtEquivalents,
  fmtPerUnit,
  formatAmount,
  mgToEntry,
  parseAmount,
} from './doseUnits'

// The CJC-1295 + ipamorelin blend: 5 mg of each in 3 mL → 1.667 mg/mL of each, 1 U = 16.7 mcg.
const BLEND = 5 / 3
// Retatrutide 15 mg in 1.5 mL → 10 mg/mL, 1 U = 0.1 mg.
const RETA = 10

describe('entries offered', () => {
  it('offers syringe units only when the vial concentration is known', () => {
    expect(entriesFor('mcg', BLEND)).toEqual(['units', 'mg', 'mcg'])
    expect(entriesFor('mcg', null)).toEqual(['mg', 'mcg'])
    expect(entriesFor('mg', 0)).toEqual(['mg', 'mcg'])
  })

  it('keeps IU, insulin units and mL as they are', () => {
    expect(entriesFor('iu', 10)).toEqual(['native'])
    expect(entriesFor('units', null)).toEqual(['native'])
    expect(defaultEntry('ml', 5)).toBe('native')
  })

  it('starts in units when a vial allows it, else in the compound own unit', () => {
    expect(defaultEntry('mcg', BLEND)).toBe('units')
    expect(defaultEntry('mcg', null)).toBe('mcg')
    expect(defaultEntry('mg', null)).toBe('mg')
  })
})

describe('converting a dose', () => {
  it('12 U of the blend are 0.2 mg of each compound', () => {
    expect(entryToMg(12, 'units', BLEND)).toBe(0.2)
    expect(mgToEntry(0.2, 'units', BLEND)).toBeCloseTo(12, 9)
    expect(entryToMg(200, 'mcg', null)).toBe(0.2)
    expect(mgToEntry(0.2, 'mcg', null)).toBeCloseTo(200, 9)
  })

  it('reads half units', () => {
    expect(entryToMg(12.5, 'units', RETA)).toBe(1.25)
    expect(entryToMg(7.5, 'units', BLEND)).toBe(0.125)
  })

  it('gives null for what cannot be converted', () => {
    expect(entryToMg(12, 'units', null)).toBeNull()
    expect(entryToMg(12, 'units', 0)).toBeNull()
    expect(mgToEntry(0.2, 'units', null)).toBeNull()
    expect(entryToMg(0, 'mg', null)).toBeNull()
    expect(entryToMg(Number.NaN, 'mg', null)).toBeNull()
    expect(entryToMg(-1, 'mcg', null)).toBeNull()
  })

  it('parses commas and empty text', () => {
    expect(parseAmount('0,25')).toBe(0.25)
    expect(parseAmount(' 12 ')).toBe(12)
    expect(parseAmount('')).toBeNaN()
  })
})

describe('switching the toggle', () => {
  it('writes the same dose in the new entry', () => {
    expect(convertText('12', 'units', 'mg', BLEND)).toBe('0.2')
    expect(convertText('12', 'units', 'mcg', BLEND)).toBe('200')
    expect(convertText('200', 'mcg', 'units', BLEND)).toBe('12')
    expect(convertText('0,25', 'mg', 'mcg', null)).toBe('250')
  })

  it('never drifts when switching there and back', () => {
    for (const units of ['6', '7', '9', '11', '12.5', '13']) {
      const inMg = convertText(units, 'units', 'mg', BLEND)
      expect(convertText(inMg, 'mg', 'units', BLEND)).toBe(units)
      const inMcg = convertText(units, 'units', 'mcg', BLEND)
      expect(convertText(inMcg, 'mcg', 'units', BLEND)).toBe(units)
    }
  })

  it('leaves what it cannot convert as typed', () => {
    expect(convertText('', 'units', 'mg', BLEND)).toBe('')
    expect(convertText('abc', 'mg', 'mcg', null)).toBe('abc')
    expect(convertText('12', 'mg', 'units', null)).toBe('12')
  })

  it('formats without float noise', () => {
    expect(formatAmount(0.30000000000000004, 'mg')).toBe('0.3')
    expect(formatAmount(12.000000000000002, 'units')).toBe('12')
    expect(formatAmount(166.66666, 'mcg')).toBe('166.67')
  })
})

describe('equivalents under the field', () => {
  it('lists the other entries in reading order', () => {
    expect(equivalents(0.2, 'units', 'mcg', BLEND).map((e) => e.entry)).toEqual(['mg', 'mcg'])
    expect(equivalents(0.2, 'mg', 'mcg', BLEND).map((e) => e.entry)).toEqual(['units', 'mcg'])
    expect(equivalents(0.2, 'mcg', 'mcg', null).map((e) => e.entry)).toEqual(['mg'])
    expect(equivalents(5, 'native', 'iu', null)).toEqual([])
  })

  it('writes them the way the app reads numbers', () => {
    expect(fmtEquivalents(0.2, 'units', 'mcg', BLEND, 'es')).toBe('= 0,2 mg · 200 mcg')
    expect(fmtEquivalents(0.2, 'mcg', 'mcg', BLEND, 'en')).toBe('= 12 U · 0.2 mg')
    expect(fmtEquivalents(null, 'mg', 'mg', null, 'es')).toBe('')
  })
})

describe('what one unit holds', () => {
  it('reads in mcg for a weak vial and in mg for a strong one', () => {
    expect(fmtPerUnit(BLEND, 'es')).toBe('16,7 mcg')
    expect(fmtPerUnit(BLEND, 'en')).toBe('16.7 mcg')
    expect(fmtPerUnit(RETA, 'es')).toBe('0,1 mg')
  })
})
