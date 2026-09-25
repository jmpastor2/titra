import { describe, expect, it } from 'vitest'
import {
  MS_PER_LOAD,
  bandEnd,
  easeOutCubic,
  fillTimeline,
  parseSpans,
  spansKey,
  unitsAt,
} from './syringeFill'

const twoVials = [
  { from: 0, to: 10 },
  { from: 10, to: 15 },
]

describe('easeOutCubic', () => {
  it('starts at 0, ends at 1 and front-loads the motion', () => {
    expect(easeOutCubic(0)).toBe(0)
    expect(easeOutCubic(1)).toBe(1)
    expect(easeOutCubic(0.5)).toBeGreaterThan(0.5)
    expect(easeOutCubic(-1)).toBe(0)
    expect(easeOutCubic(2)).toBe(1)
  })
})

describe('spansKey / parseSpans', () => {
  it('round-trips the loads geometry', () => {
    expect(parseSpans(spansKey(twoVials))).toEqual(twoVials)
    expect(parseSpans(spansKey([]))).toEqual([])
    expect(spansKey([{ from: 0, to: 7.5 }])).toBe('0:7.5')
  })
})

describe('fillTimeline', () => {
  it('fills two vials one after the other, a full load each', () => {
    const tl = fillTimeline(0, 15, twoVials)
    expect(tl.segments).toEqual([
      { from: 0, to: 10, start: 0, duration: MS_PER_LOAD },
      { from: 10, to: 15, start: MS_PER_LOAD, duration: MS_PER_LOAD },
    ])
    expect(tl.duration).toBe(2 * MS_PER_LOAD)
  })

  it('gives a partial load its share of the time, with a floor', () => {
    const tl = fillTimeline(8, 15, twoVials)
    expect(tl.segments.map((s) => [s.from, s.to])).toEqual([
      [8, 10],
      [10, 15],
    ])
    expect(tl.segments[0]?.duration).toBeCloseTo(MS_PER_LOAD * 0.35)
    expect(tl.segments[1]?.duration).toBe(MS_PER_LOAD)

    const half = fillTimeline(0, 5, [{ from: 0, to: 10 }])
    expect(half.duration).toBe(MS_PER_LOAD * 0.5)
  })

  it('walks boundaries in reverse when the dose shrinks', () => {
    const tl = fillTimeline(15, 4, twoVials)
    expect(tl.segments.map((s) => [s.from, s.to])).toEqual([
      [15, 10],
      [10, 4],
    ])
  })

  it('is empty when nothing moves', () => {
    expect(fillTimeline(5, 5, twoVials).duration).toBe(0)
    expect(fillTimeline(Number.NaN, 5, twoVials)).toMatchObject({ to: 5, duration: 0 })
  })

  it('uses a whole load for travel outside the current loads', () => {
    const tl = fillTimeline(30, 15, twoVials)
    expect(tl.segments).toHaveLength(1)
    expect(tl.duration).toBe(MS_PER_LOAD)
  })
})

describe('unitsAt', () => {
  const tl = fillTimeline(0, 15, twoVials)

  it('clamps before the start and after the end', () => {
    expect(unitsAt(tl, -5)).toBe(0)
    expect(unitsAt(tl, 0)).toBe(0)
    expect(unitsAt(tl, tl.duration)).toBe(15)
    expect(unitsAt(tl, tl.duration + 100)).toBe(15)
  })

  it('rests on the load boundary between vials', () => {
    expect(unitsAt(tl, MS_PER_LOAD)).toBe(10)
    const midFirst = unitsAt(tl, MS_PER_LOAD / 2)
    expect(midFirst).toBeGreaterThan(5)
    expect(midFirst).toBeLessThan(10)
  })

  it('never goes backwards while filling', () => {
    let prev = -1
    for (let t = 0; t <= tl.duration; t += 16) {
      const u = unitsAt(tl, t)
      expect(u).toBeGreaterThanOrEqual(prev)
      prev = u
    }
  })
})

describe('bandEnd', () => {
  it('reveals a band only as far as the plunger has gone', () => {
    expect(bandEnd({ from: 0, to: 10 }, 4, false)).toBe(4)
    expect(bandEnd({ from: 0, to: 10 }, 12, false)).toBe(10)
    expect(bandEnd({ from: 10, to: 15 }, 4, true)).toBe(10)
    expect(bandEnd({ from: 10, to: 15 }, 12, true)).toBe(12)
  })

  it('lets the last band follow the stopper past its end while a dose shrinks', () => {
    expect(bandEnd({ from: 10, to: 15 }, 20, true)).toBe(20)
    expect(bandEnd({ from: 0, to: 10 }, 20, false)).toBe(10)
  })
})
