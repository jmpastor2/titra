import { describe, expect, it } from 'vitest'
import { bodyUnits, fmtReading } from './units'

describe('bodyUnits', () => {
  it('leaves metric readings and labels alone', () => {
    const u = bodyUnits(false)
    expect(u.imperial).toBe(false)
    expect(u.unit('weight')).toBe('kg')
    expect(u.unit('waist')).toBe('cm')
    expect(u.show('weight', 77.2)).toBe(77.2)
  })

  it('shows weight in pounds and lengths in inches', () => {
    const u = bodyUnits(true)
    expect(u.unit('weight')).toBe('lb')
    expect(u.unit('lean_mass')).toBe('lb')
    expect(u.unit('waist')).toBe('in')
    expect(u.unit('thigh')).toBe('in')
    expect(u.show('weight', 77)).toBeCloseTo(169.76, 2)
    expect(u.show('waist', 91)).toBeCloseTo(35.83, 2)
  })

  it('does not touch what has no imperial unit', () => {
    const u = bodyUnits(true)
    expect(u.unit('body_fat_pct')).toBe('%')
    expect(u.show('body_fat_pct', 21.5)).toBe(21.5)
    expect(u.show('hba1c', 5.4)).toBe(5.4)
  })
})

describe('fmtReading', () => {
  it('keeps the digits of the kind, with the decimal comma in Spanish', () => {
    expect(fmtReading('weight', 77, 'es')).toBe('77,0')
    expect(fmtReading('weight', 77.04, 'es')).toBe('77,0')
    expect(fmtReading('weight', 76.56, 'en')).toBe('76.6')
    expect(fmtReading('heart_rate', 61.4, 'es')).toBe('61')
  })
})
