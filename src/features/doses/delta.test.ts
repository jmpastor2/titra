import { describe, expect, it } from 'vitest'
import { fitOf, fmtDeltaMin, wholeDays } from './delta'

describe('fmtDeltaMin', () => {
  it('reads small gaps as minutes and hours', () => {
    expect(fmtDeltaMin(4)).toBe('+4 min')
    expect(fmtDeltaMin(-40)).toBe('−40 min')
    expect(fmtDeltaMin(122)).toBe('+2 h 02')
    expect(fmtDeltaMin(-125)).toBe('−2 h 05')
    expect(fmtDeltaMin(180)).toBe('+3 h')
  })

  it('reads a gap of a day or more as days, never as a pile of hours', () => {
    expect(fmtDeltaMin(127 * 60)).toBe('+5 d 7 h')
    expect(fmtDeltaMin(48 * 60)).toBe('+2 d')
    expect(fmtDeltaMin(-(26 * 60))).toBe('−1 d 2 h')
  })

  it('never shows 24 h next to the days', () => {
    expect(fmtDeltaMin(23 * 60 + 59)).toBe('+23 h 59')
    expect(fmtDeltaMin(24 * 60 + 20)).toBe('+1 d')
    expect(fmtDeltaMin(47 * 60 + 40)).toBe('+2 d')
  })
})

describe('wholeDays', () => {
  it('rounds to days and never says zero', () => {
    expect(wholeDays(5 * 24 * 60 + 120)).toBe(5)
    expect(wholeDays(-(24 * 60))).toBe(1)
    expect(wholeDays(25 * 60)).toBe(1)
  })
})

describe('fitOf', () => {
  it('sorts a taken dose against its planned time', () => {
    expect(fitOf({ status: 'onTime', deltaMin: 4 })).toEqual({ kind: 'onTime', deltaMin: 4 })
    expect(fitOf({ status: 'late', deltaMin: 122 }).kind).toBe('late')
    expect(fitOf({ status: 'early', deltaMin: -90 }).kind).toBe('early')
  })

  it('calls a dose a day or more late a make-up', () => {
    expect(fitOf({ status: 'late', deltaMin: 5 * 24 * 60 }).kind).toBe('makeUp')
    expect(fitOf({ status: 'early', deltaMin: -2 * 24 * 60 }).kind).toBe('ahead')
  })

  it('treats a dose that covers nothing as an extra', () => {
    expect(fitOf({ status: 'extra', deltaMin: null })).toEqual({ kind: 'extra', deltaMin: null })
    expect(fitOf({ status: 'missed', deltaMin: null }).kind).toBe('extra')
  })
})
