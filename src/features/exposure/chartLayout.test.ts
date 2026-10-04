import { describe, expect, it } from 'vitest'
import {
  areaPath,
  dodge,
  estimateTextWidth,
  fx,
  linePath,
  nearestIndex,
  placeLabels,
  plotBox,
  scaleLinear,
} from './chartLayout'

describe('plotBox / scaleLinear', () => {
  it('leaves the insets around the plot', () => {
    const box = plotBox(320, 200, { left: 30, right: 12, top: 20, bottom: 22 })
    expect(box).toEqual({ x0: 30, x1: 308, y0: 20, y1: 178, width: 278, height: 158 })
  })
  it('never collapses on a tiny box', () => {
    const box = plotBox(10, 10, { left: 30, right: 12, top: 20, bottom: 22 })
    expect(box.width).toBeGreaterThan(0)
    expect(box.height).toBeGreaterThan(0)
  })
  it('maps linearly and survives a flat domain', () => {
    const x = scaleLinear(0, 10, 100, 200)
    expect(x(0)).toBe(100)
    expect(x(5)).toBe(150)
    expect(x(15)).toBe(250)
    expect(scaleLinear(3, 3, 7, 9)(3)).toBe(7)
    // A y scale grows upwards: zero at the baseline.
    const y = scaleLinear(0, 4, 178, 20)
    expect(y(0)).toBe(178)
    expect(y(4)).toBe(20)
  })
})

describe('paths', () => {
  it('rounds to a tenth of a pixel', () => {
    expect(fx(1.2345)).toBe(1.2)
    expect(
      linePath([
        [0, 10.04],
        [5.55, 20],
      ]),
    ).toBe('M0 10 L5.6 20')
  })
  it('closes an area down to the baseline', () => {
    expect(
      areaPath(
        [
          [0, 10],
          [10, 5],
        ],
        30,
      ),
    ).toBe('M0 10 L10 5 L10 30 L0 30 Z')
    expect(areaPath([], 30)).toBe('')
  })
})

describe('placeLabels', () => {
  const bounds = [0, 300] as const
  it('keeps every label that fits side by side in one lane', () => {
    const placed = placeLabels(
      [
        { key: 'a', x: 50, width: 60, priority: 1 },
        { key: 'b', x: 200, width: 60, priority: 1 },
      ],
      bounds,
    )
    expect(placed).toEqual([
      { key: 'a', left: 20, lane: 0 },
      { key: 'b', left: 170, lane: 0 },
    ])
  })
  it('stacks colliding labels in the next lane and drops what fits nowhere', () => {
    const placed = placeLabels(
      [
        { key: 'a', x: 100, width: 60, priority: 3 },
        { key: 'b', x: 120, width: 60, priority: 2 },
        { key: 'c', x: 110, width: 60, priority: 1 },
      ],
      bounds,
      2,
    )
    expect(placed.map((p) => [p.key, p.lane])).toEqual([
      ['a', 0],
      ['b', 1],
    ])
  })
  it('lets the higher priority win a collision, not the leftmost', () => {
    const placed = placeLabels(
      [
        { key: 'left', x: 100, width: 60, priority: 1 },
        { key: 'now', x: 110, width: 40, priority: 9 },
      ],
      bounds,
      1,
    )
    expect(placed.map((p) => p.key)).toEqual(['now'])
  })
  it('keeps labels inside the chart at both edges', () => {
    const placed = placeLabels(
      [
        { key: 'edgeL', x: 2, width: 60, priority: 1 },
        { key: 'edgeR', x: 299, width: 60, priority: 1 },
      ],
      bounds,
    )
    expect(placed.find((p) => p.key === 'edgeL')!.left).toBe(0)
    expect(placed.find((p) => p.key === 'edgeR')!.left).toBe(240)
  })
  it('estimates text width from its length', () => {
    expect(estimateTextWidth('↑ 1,75 mg')).toBeGreaterThan(estimateTextWidth('↑ 2 mg'))
  })
})

describe('nearestIndex', () => {
  const xs = [0, 10, 20, 40]
  it('finds the closest value', () => {
    expect(nearestIndex(xs, -5)).toBe(0)
    expect(nearestIndex(xs, 4)).toBe(0)
    expect(nearestIndex(xs, 6)).toBe(1)
    expect(nearestIndex(xs, 31)).toBe(3)
    expect(nearestIndex(xs, 999)).toBe(3)
  })
  it('is -1 for nothing and works with a single value', () => {
    expect(nearestIndex([], 5)).toBe(-1)
    expect(nearestIndex([7], 5)).toBe(0)
  })
})

describe('dodge', () => {
  it('leaves marks that do not touch where they are', () => {
    expect(dodge([10, 30, 60], 8)).toEqual([10, 30, 60])
    expect(dodge([], 8)).toEqual([])
  })
  it('pulls two marks on the same spot apart so both can be seen and tapped', () => {
    const out = dodge([100, 100], 8)
    expect(out[1]! - out[0]!).toBeGreaterThanOrEqual(8 - 1e-9)
    expect(out[0]!).toBeLessThan(100)
    expect(out[1]!).toBeGreaterThan(100)
  })
  it('never moves a mark further than the cap, and keeps the order', () => {
    const xs = [100, 100, 100, 100, 100]
    const out = dodge(xs, 8, 5)
    for (const [i, v] of out.entries()) expect(Math.abs(v - xs[i]!)).toBeLessThanOrEqual(5 + 1e-9)
    expect(out.toSorted((a, b) => a - b)).toEqual(out)
  })
  it('spreads a crowded row by at most the cap instead of drawing a wave', () => {
    const xs = Array.from({ length: 30 }, (_, i) => i * 3)
    const out = dodge(xs, 6, 3)
    for (const [i, v] of out.entries()) expect(Math.abs(v - xs[i]!)).toBeLessThanOrEqual(3 + 1e-9)
  })
})
