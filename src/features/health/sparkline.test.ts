import { describe, expect, it } from 'vitest'
import { sparkY } from './sparkline'

describe('sparkY', () => {
  it('zooms to the range of the values, with the margin kept clear', () => {
    const ys = sparkY([70, 75, 80])
    expect(ys[0]).toBeCloseTo(97)
    expect(ys[1]).toBeCloseTo(50)
    expect(ys[2]).toBeCloseTo(3)
  })

  it('never zooms past the minimum span: a small wobble stays small', () => {
    const ys = sparkY([76.8, 77.3], 2)
    // 0.5 of a 2-unit span is a quarter of the drawable height (94), not all of it.
    expect(ys[0]! - ys[1]!).toBeCloseTo(23.5)
    expect(ys[0]).toBeGreaterThan(3)
    expect(ys[1]).toBeLessThan(97)
  })

  it('centres a narrow range in the span', () => {
    const ys = sparkY([10, 10.5], 4)
    expect((ys[0]! + ys[1]!) / 2).toBeCloseTo(50)
  })

  it('ignores the minimum when the values already span more', () => {
    expect(sparkY([0, 10], 2)).toEqual(sparkY([0, 10]))
  })

  it('draws a flat line in the middle and nothing for no values', () => {
    expect(sparkY([77, 77, 77])).toEqual([50, 50, 50])
    expect(sparkY([])).toEqual([])
  })
})
