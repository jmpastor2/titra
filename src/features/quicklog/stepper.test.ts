import { describe, expect, it } from 'vitest'
import {
  changeBetween,
  clampTo,
  deltaFrom,
  inRange,
  parseNumber,
  repeatStep,
  roundTo,
  stepSpec,
  stepValue,
  toDisplay,
  toStored,
} from './stepper'

describe('roundTo', () => {
  it('rounds half away from zero through the decimal text', () => {
    expect(roundTo(1.005, 2)).toBe(1.01)
    expect(roundTo(0.1 + 0.2, 1)).toBe(0.3)
    expect(roundTo(-0.25, 1)).toBe(-0.3)
    expect(roundTo(77.34999, 1)).toBe(77.3)
  })
  it('turns noise into a clean zero', () => {
    expect(roundTo(7.1e-15, 1)).toBe(0)
    expect(Object.is(roundTo(-1e-12, 1), 0)).toBe(true)
  })
})

describe('step specs', () => {
  it('steps weight by 0.1 kg and waist by 0.5 cm', () => {
    expect(stepSpec('weight', false).step).toBe(0.1)
    expect(stepSpec('waist', false).step).toBe(0.5)
  })
  it('keeps the same feel in imperial units', () => {
    expect(stepSpec('weight', true)).toMatchObject({ step: 0.2, digits: 1 })
    expect(stepSpec('hip', true)).toMatchObject({ step: 0.2, digits: 1 })
    // Units without a conversion keep their own step.
    expect(stepSpec('steps', true).step).toBe(500)
  })
  it('converts the plausible range to what is shown', () => {
    const lb = stepSpec('weight', true)
    expect(lb.min).toBeCloseTo(44.1, 1)
    expect(lb.max).toBeCloseTo(881.8, 1)
    expect(stepSpec('weight', false)).toMatchObject({ min: 20, max: 400 })
  })
})

describe('stepping', () => {
  const kg = stepSpec('weight', false)

  it('adds tenths without float noise', () => {
    let v = 77
    for (let i = 0; i < 3; i++) v = stepValue(kg, v, 1)
    expect(v).toBe(77.3)
    expect(stepValue(kg, 77.3, -1)).toBe(77.2)
  })
  it('moves faster when a long press has picked up speed', () => {
    expect(stepValue(kg, 77, 1, 5)).toBe(77.5)
    expect(stepValue(stepSpec('waist', false), 91, -1, 10)).toBe(86)
  })
  it('stops at the plausible range', () => {
    expect(stepValue(kg, 20, -1)).toBe(20)
    expect(stepValue(kg, 399.95, 1, 5)).toBe(400)
    expect(clampTo(kg, 777)).toBe(400)
    expect(inRange(kg, 777)).toBe(false)
    expect(inRange(kg, 77.3)).toBe(true)
    expect(inRange(kg, Number.NaN)).toBe(false)
  })
})

describe('imperial conversion', () => {
  it('shows kg as lb and cm as in', () => {
    expect(toDisplay('weight', 77, true)).toBe(169.8)
    expect(toDisplay('waist', 91, true)).toBe(35.8)
    expect(toDisplay('weight', 77, false)).toBe(77)
  })
  it('stores what was typed as kg and cm', () => {
    expect(toStored('weight', 170, true)).toBe(77.11)
    expect(toStored('waist', 36, true)).toBe(91.44)
    expect(toStored('weight', 77.3, false)).toBe(77.3)
    expect(toStored('heart_rate', 62, true)).toBe(62)
  })
  it('round-trips the last reading through the stepper', () => {
    const stored = 77.4
    const shown = toDisplay('weight', stored, true)
    expect(toStored('weight', shown, true)).toBeCloseTo(stored, 1)
  })
})

describe('changeBetween', () => {
  it('rounds the change once, in the units the person sees', () => {
    expect(changeBetween('weight', 77.4, 77, false)).toBe(-0.4)
    // 0.4 kg is 0.88 lb: the rounded readings (170.6 and 169.8) would say 0.8.
    expect(changeBetween('weight', 77.4, 77, true)).toBe(-0.9)
    expect(changeBetween('waist', 91, 92.5, true)).toBe(0.6)
  })
  it('is a clean zero for no change', () => {
    expect(Object.is(changeBetween('weight', 77, 77, false), 0)).toBe(true)
    expect(Object.is(changeBetween('weight', 77, 77.0000001, true), 0)).toBe(true)
  })
})

describe('parseNumber', () => {
  it('accepts a decimal comma or point', () => {
    expect(parseNumber('77,5', 1)).toBe(77.5)
    expect(parseNumber('77.5', 1)).toBe(77.5)
    expect(parseNumber(' 90 ', 1)).toBe(90)
  })
  it('reads separators as thousands marks when there are no decimals', () => {
    expect(parseNumber('10.000', 0)).toBe(10000)
    expect(parseNumber('8,500', 0)).toBe(8500)
  })
  it('rejects anything else', () => {
    expect(parseNumber('', 1)).toBeNull()
    expect(parseNumber('abc', 1)).toBeNull()
    expect(parseNumber('-3', 1)).toBeNull()
    expect(parseNumber('7,7,7', 1)).toBeNull()
    expect(parseNumber('1e3', 1)).toBeNull()
  })
})

describe('deltaFrom', () => {
  it('rounds to what is shown and hides noise', () => {
    expect(deltaFrom(77.3, 77.8, 1)).toBe(-0.5)
    expect(deltaFrom(77.3, 77.2, 1)).toBe(0.1)
    expect(deltaFrom(77.3, 77.3000001, 1)).toBe(0)
  })
})

describe('repeatStep', () => {
  it('starts steady, speeds up, then takes bigger steps', () => {
    expect(repeatStep(0)).toEqual({ delayMs: 150, multiplier: 1 })
    expect(repeatStep(8)).toEqual({ delayMs: 100, multiplier: 1 })
    expect(repeatStep(14)).toEqual({ delayMs: 70, multiplier: 5 })
    expect(repeatStep(40)).toEqual({ delayMs: 70, multiplier: 10 })
  })
})
