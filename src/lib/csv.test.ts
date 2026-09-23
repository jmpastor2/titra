import { describe, expect, it } from 'vitest'
import { escapeCsvCell, toCsv } from './csv'

describe('escapeCsvCell', () => {
  it('passes plain values through', () => {
    expect(escapeCsvCell('hola')).toBe('hola')
    expect(escapeCsvCell(2.4)).toBe('2.4')
  })
  it('renders null and undefined as empty', () => {
    expect(escapeCsvCell(null)).toBe('')
    expect(escapeCsvCell(undefined)).toBe('')
  })
  it('quotes delimiters, quotes and newlines', () => {
    expect(escapeCsvCell('a,b')).toBe('"a,b"')
    expect(escapeCsvCell('say "hi"')).toBe('"say ""hi"""')
    expect(escapeCsvCell('line1\nline2')).toBe('"line1\nline2"')
  })
})

describe('toCsv', () => {
  it('returns an empty string for no rows', () => {
    expect(toCsv([])).toBe('')
  })
  it('writes a header row and CRLF line endings with a BOM', () => {
    const csv = toCsv([
      { fecha: '2026-01-01', dosis: 0.25 },
      { fecha: '2026-01-08', dosis: 0.5 },
    ])
    expect(csv.startsWith('﻿')).toBe(true)
    expect(csv.slice(1).split('\r\n')).toEqual(['fecha,dosis', '2026-01-01,0.25', '2026-01-08,0.5'])
  })
  it('keeps column order from the first row and fills missing keys', () => {
    const csv = toCsv([{ a: 1, b: 2 }, { a: 3 } as Record<string, number>])
    expect(csv.slice(1).split('\r\n')).toEqual(['a,b', '1,2', '3,'])
  })
})
