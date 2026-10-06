import { describe, expect, it } from 'vitest'
import { labelAnchor, scalePos, trialScale } from './trialScale'

describe('trialScale', () => {
  it('runs from no change to −20 % for a band inside it', () => {
    const s = trialScale({
      band: { lowerPct: -7.2, upperPct: -12.9 },
      placeboPct: -1.6,
      youPct: -0.6,
    })
    expect(s.from).toBe(0)
    expect(s.to).toBe(-20)
    expect(s.ticks).toEqual([0, -5, -10, -15, -20])
    expect(s.band?.[0]).toBeCloseTo(0.36)
    expect(s.band?.[1]).toBeCloseTo(0.645)
    expect(s.placebo).toBeCloseTo(0.08)
    expect(s.you).toBeCloseTo(0.03)
    expect(s.projection).toBeNull()
  })

  it('reaches past −20 % when the band or the person do', () => {
    const s = trialScale({ band: { lowerPct: -17.1, upperPct: -24.2 }, youPct: -3 })
    expect(s.to).toBe(-25)
    expect(s.ticks.at(-1)).toBe(-25)
    const far = trialScale({ band: null, youPct: -20 })
    expect(far.to).toBe(-25)
  })

  it('makes room on the left for a gain', () => {
    const s = trialScale({ band: { lowerPct: -7, upperPct: -13 }, youPct: 1.2 })
    expect(s.from).toBe(5)
    expect(s.ticks[0]).toBe(5)
    expect(s.you).toBeCloseTo((5 - 1.2) / 25)
  })

  it('steps by 10 on a wide axis', () => {
    const s = trialScale({ band: { lowerPct: -22, upperPct: -36 } })
    expect(s.to).toBe(-40)
    expect(s.ticks).toEqual([0, -10, -20, -30, -40])
  })

  it('collapses an exact arm to one point and leaves out what is not known', () => {
    const s = trialScale({ band: { lowerPct: -12.9, upperPct: -12.9 }, youPct: null })
    expect(s.band?.[0]).toBe(s.band?.[1])
    expect(s.you).toBeNull()
    expect(trialScale({ band: null }).band).toBeNull()
  })

  it('ignores values that are not numbers', () => {
    const s = trialScale({ band: null, youPct: Number.NaN, projectionPct: undefined })
    expect(s.you).toBeNull()
    expect(s.to).toBe(-20)
  })
})

describe('scalePos', () => {
  it('clamps to the ends of the axis', () => {
    expect(scalePos(0, -20, -10)).toBe(0.5)
    expect(scalePos(0, -20, 3)).toBe(0)
    expect(scalePos(0, -20, -30)).toBe(1)
    expect(scalePos(0, 0, -3)).toBe(0)
  })
})

describe('labelAnchor', () => {
  it('keeps the labels near the ends inside the bar', () => {
    expect(labelAnchor(0.03)).toBe('start')
    expect(labelAnchor(0.5)).toBe('middle')
    expect(labelAnchor(0.95)).toBe('end')
  })
})
