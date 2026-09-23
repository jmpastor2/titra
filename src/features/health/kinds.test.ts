import { describe, expect, it } from 'vitest'
import { displayUnit, toCanonical } from './kinds'

describe('measurement unit conversion', () => {
  it('stores imperial weight as kg', () => {
    expect(toCanonical('weight', 220, true)).toBeCloseTo(99.79, 2)
    expect(toCanonical('weight', 100, false)).toBe(100)
  })
  it('stores imperial waist as cm', () => {
    expect(toCanonical('waist', 40, true)).toBeCloseTo(101.6, 5)
  })
  it('leaves unit-free kinds untouched', () => {
    expect(toCanonical('hba1c', 6.2, true)).toBe(6.2)
    expect(toCanonical('glucose_fasting', 110, true)).toBe(110)
  })
  it('picks the display unit by unit system', () => {
    expect(displayUnit('weight', true)).toBe('lb')
    expect(displayUnit('weight', false)).toBe('kg')
    expect(displayUnit('resistance_session', false)).toBe('min')
    expect(displayUnit('hba1c', true)).toBe('%')
  })
})
