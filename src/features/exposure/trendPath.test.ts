import { describe, expect, it } from 'vitest'
import type { Pt } from './chartLayout'
import { bandPath, monotonePath, monotoneTangents } from './trendPath'

/** The numbers of a path string, in order, as [x, y] pairs. */
function coords(d: string): [number, number][] {
  const nums = (d.match(/-?\d+(\.\d+)?/g) ?? []).map(Number)
  const out: [number, number][] = []
  for (let i = 0; i + 1 < nums.length; i += 2) out.push([nums[i]!, nums[i + 1]!])
  return out
}

describe('monotonePath', () => {
  it('makes no line from nothing and a straight one from two points', () => {
    expect(monotonePath([])).toBe('')
    expect(
      monotonePath([
        [0, 10],
        [20, 30],
      ]),
    ).toBe('M0 10 L20 30')
  })

  it('goes through every reading', () => {
    const pts: Pt[] = [
      [0, 50],
      [40, 20],
      [90, 35],
      [150, 10],
    ]
    const d = monotonePath(pts)
    expect(d.startsWith('M0 50 C')).toBe(true)
    // Each curve ends on the next reading: the last pair of every C segment.
    const ends = d
      .split('C')
      .slice(1)
      .map((seg) => coords(seg).at(-1))
    expect(ends).toEqual(pts.slice(1))
  })

  it('never goes above the higher reading or below the lower one', () => {
    // A spike between flat readings is where an ordinary spline overshoots.
    const pts: Pt[] = [
      [0, 100],
      [30, 100],
      [60, 20],
      [90, 100],
      [120, 100],
      [150, 60],
      [180, 62],
    ]
    const d = monotonePath(pts)
    const ys = coords(d).map(([, y]) => y)
    expect(Math.min(...ys)).toBeGreaterThanOrEqual(20)
    expect(Math.max(...ys)).toBeLessThanOrEqual(100)
    // Each segment keeps its control points between its two readings.
    d.split('C')
      .slice(1)
      .forEach((seg, i) => {
        const [c1, c2] = coords(seg)
        const lo = Math.min(pts[i]![1], pts[i + 1]![1])
        const hi = Math.max(pts[i]![1], pts[i + 1]![1])
        expect(c1![1]).toBeGreaterThanOrEqual(lo - 0.1)
        expect(c1![1]).toBeLessThanOrEqual(hi + 0.1)
        expect(c2![1]).toBeGreaterThanOrEqual(lo - 0.1)
        expect(c2![1]).toBeLessThanOrEqual(hi + 0.1)
      })
  })

  it('has a flat tangent at a turning point and follows a straight run', () => {
    const peak = monotoneTangents([
      [0, 0],
      [10, 10],
      [20, 0],
    ])
    expect(peak[1]).toBe(0)
    const ramp = monotoneTangents([
      [0, 0],
      [10, 5],
      [20, 10],
      [30, 15],
    ])
    for (const t of ramp) expect(t).toBeCloseTo(0.5, 9)
  })

  it('stays finite when two readings land on the same column', () => {
    const d = monotonePath([
      [0, 10],
      [30, 40],
      [30, 25],
      [60, 20],
    ])
    expect(d).not.toMatch(/NaN|Infinity|undefined/)
  })
})

describe('bandPath', () => {
  it('closes the area between two lines', () => {
    expect(
      bandPath(
        [
          [0, 10],
          [10, 20],
        ],
        [
          [0, 40],
          [10, 50],
        ],
      ),
    ).toBe('M0 10 L10 20 L10 50 L0 40 Z')
  })
  it('is empty without both lines', () => {
    expect(bandPath([], [[0, 1]])).toBe('')
    expect(bandPath([[0, 1]], [])).toBe('')
  })
})
