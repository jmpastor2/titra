import { describe, expect, it } from 'vitest'
import { goalText, parseGoal, parseProtein } from './profileForm'

describe('goalText', () => {
  it('writes the goal in the unit the person uses', () => {
    expect(goalText(72, false, 'es')).toBe('72')
    expect(goalText(72.5, false, 'es')).toBe('72,5')
    expect(goalText(72, true, 'es')).toBe('158,7')
    expect(goalText(72, true, 'en')).toBe('158.7')
  })

  it('is empty without a goal', () => {
    expect(goalText(null, false, 'es')).toBe('')
  })
})

describe('parseGoal', () => {
  it('reads kilos with a comma or a point', () => {
    expect(parseGoal('72,5', false)).toEqual({ ok: true, kg: 72.5 })
    expect(parseGoal('72.5', false)).toEqual({ ok: true, kg: 72.5 })
  })

  it('stores pounds as kilos', () => {
    const r = parseGoal('158,7', true)
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.kg).toBeCloseTo(71.99, 1)
  })

  it('clears the goal when the field is emptied', () => {
    expect(parseGoal('  ', false)).toEqual({ ok: true, kg: null })
  })

  it('refuses what is not a weight', () => {
    expect(parseGoal('abc', false)).toEqual({ ok: false })
    expect(parseGoal('7', false)).toEqual({ ok: false })
    expect(parseGoal('700', false)).toEqual({ ok: false })
    // The range follows the unit: 30 is no weight in pounds, 160 is.
    expect(parseGoal('30', true)).toEqual({ ok: false })
    expect(parseGoal('160', true).ok).toBe(true)
  })
})

describe('parseProtein', () => {
  it('reads g/kg with a comma', () => {
    expect(parseProtein('1,6')).toBe(1.6)
    expect(parseProtein('2')).toBe(2)
  })

  it('refuses nonsense', () => {
    expect(parseProtein('')).toBeNull()
    expect(parseProtein('x')).toBeNull()
    expect(parseProtein('0')).toBeNull()
    expect(parseProtein('40')).toBeNull()
  })
})
