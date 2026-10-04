import { describe, expect, it } from 'vitest'
import type { LabResultRow } from '@/data/database.types'
import { defaultsFor, labFlag, loggedAnalytes } from './labs'

let n = 0
const lab = (
  analyte: string,
  value: number,
  drawn: string,
  over: Partial<LabResultRow> = {},
): LabResultRow => ({
  id: `l${++n}`,
  patient_id: 'u',
  drawn_at: drawn,
  analyte,
  value,
  unit: 'mg/dL',
  ref_low: null,
  ref_high: null,
  notes: null,
  created_at: '2026-10-01T10:00:00Z',
  ...over,
})

describe('loggedAnalytes', () => {
  it('lists each analyte once, the most recently drawn first, with its latest result', () => {
    const rows = [
      lab('LDL', 120, '2026-03-01', { ref_high: 130 }),
      lab('HbA1c', 5.4, '2026-06-10', { unit: '%', ref_low: 4, ref_high: 5.6 }),
      lab('ldl ', 110, '2026-09-20', { ref_high: 130 }),
    ]
    const out = loggedAnalytes(rows)
    expect(out.map((o) => o.analyte)).toEqual(['ldl ', 'HbA1c'])
    expect(out[0]?.last.value).toBe(110)
    expect(out[1]).toMatchObject({ unit: '%', low: 4, high: 5.6 })
  })
  it('treats the placeholder unit as none', () => {
    expect(loggedAnalytes([lab('X', 1, '2026-01-01', { unit: '—' })])[0]?.unit).toBe('')
  })
  it('is empty with no results', () => {
    expect(loggedAnalytes([])).toEqual([])
  })
})

describe('labFlag', () => {
  it('compares against the reference range', () => {
    expect(labFlag(5.4, 4, 5.6)).toBe('ok')
    expect(labFlag(6.1, 4, 5.6)).toBe('high')
    expect(labFlag(3.5, 4, 5.6)).toBe('low')
    expect(labFlag(150, null, 130)).toBe('high')
    expect(labFlag(35, 40, null)).toBe('low')
  })
  it('has no opinion without a range or a value', () => {
    expect(labFlag(5, null, null)).toBeNull()
    expect(labFlag(null, 4, 5.6)).toBeNull()
    expect(labFlag(Number.NaN, 4, 5.6)).toBeNull()
  })
})

describe('defaultsFor', () => {
  const logged = loggedAnalytes([lab('LDL', 110, '2026-09-20', { unit: 'mmol/L', ref_high: 3.4 })])
  it('prefers what the person logged last', () => {
    expect(defaultsFor('ldl', logged)).toEqual({ unit: 'mmol/L', low: null, high: 3.4 })
  })
  it('falls back to the usual unit and range', () => {
    expect(defaultsFor('HbA1c', logged)).toEqual({ unit: '%', low: 4, high: 5.6 })
  })
  it('knows nothing about an analyte of their own', () => {
    expect(defaultsFor('Ferritina', logged)).toBeNull()
  })
})
