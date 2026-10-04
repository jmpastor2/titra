import { describe, expect, it } from 'vitest'
import { cjc, mots, reta } from './fixtures'
import { buildCycleViews } from './model'
import { buildTimeline } from './timeline'

const d = (iso: string) => new Date(iso)
const NOW = d('2026-10-05T10:00') // a Monday, week 3 of the CJC cycle

const timeline = (rows = [cjc(), reta(), mots()], now = NOW) =>
  buildTimeline(buildCycleViews(rows, now), now)!
const lane = (t: ReturnType<typeof timeline>, id: string) => t.lanes.find((l) => l.id === id)!

describe('buildTimeline', () => {
  it('has nothing to draw without cycles', () => {
    expect(buildTimeline([], NOW)).toBeNull()
  })

  it('shares one weekly axis that starts on the Monday of the earliest start', () => {
    const t = timeline()
    expect(t.start).toEqual(d('2026-09-14T00:00'))
    expect(t.start.getDay()).toBe(1)
    // To the end of the CJC plan (11 Jan): 17 weeks from 14 Sep.
    expect(t.weeks).toBe(17)
    expect(t.lanes.map((l) => l.id)).toEqual(['mots', 'reta', 'cjc'])
  })

  it('puts each step at its place on the axis, in weeks', () => {
    const blocks = lane(timeline(), 'cjc').blocks
    expect(blocks.map((b) => [b.x, b.w])).toEqual([
      [1, 1],
      [2, 1],
      [3, 10],
      [13, 4],
    ])
    expect(blocks.map((b) => b.state)).toEqual(['past', 'past', 'current', 'future'])
  })

  it('draws an open-ended step to the end of the axis', () => {
    const blocks = lane(timeline(), 'reta').blocks
    expect(blocks.map((b) => [b.x, b.w])).toEqual([
      [0, 2],
      [2, 1],
      [3, 1],
      [4, 1],
      [5, 12],
    ])
    expect(blocks.map((b) => b.open)).toEqual([false, false, false, false, true])
  })

  it('shades the dose against the lane largest and gives a rest none', () => {
    const cjcBlocks = lane(timeline(), 'cjc').blocks
    expect(cjcBlocks[0]!.intensity).toBeCloseTo(0.5)
    expect(cjcBlocks[1]!.intensity).toBeCloseTo(0.75)
    expect(cjcBlocks[2]!.intensity).toBe(1)
    expect(cjcBlocks[3]!.intensity).toBe(0)
    expect(cjcBlocks[3]!.pause).toBe(true)
    const retaBlocks = lane(timeline(), 'reta').blocks
    expect(retaBlocks[0]!.intensity).toBeCloseTo(0.4)
    expect(retaBlocks[4]!.intensity).toBe(1)
  })

  it('numbers the dosing weeks of each step; a rest has none', () => {
    const blocks = lane(timeline(), 'cjc').blocks
    expect(blocks.map((b) => [b.weekFrom, b.weekTo])).toEqual([
      [1, 1],
      [2, 2],
      [3, 12],
      [null, null],
    ])
    expect(lane(timeline(), 'reta').blocks[4]).toMatchObject({ weekFrom: 6, weekTo: null })
  })

  it('keeps a ruler of week numbers under the blocks, skipping rest weeks', () => {
    const ruler = lane(timeline(), 'cjc').ruler
    expect(ruler).toHaveLength(16)
    expect(ruler.slice(0, 3).map((w) => [w.x, w.n])).toEqual([
      [1, 1],
      [2, 2],
      [3, 3],
    ])
    expect(ruler[11]).toMatchObject({ x: 12, n: 12 })
    expect(ruler.slice(12).map((w) => w.n)).toEqual([null, null, null, null])
    expect(ruler.filter((w) => w.current).map((w) => w.n)).toEqual([3])
  })

  it('places today on the axis and marks the current week', () => {
    const t = timeline()
    expect(t.today).toBeCloseTo(3 + 10 / 24 / 7)
    expect(t.ticks.filter((tick) => tick.current).map((tick) => tick.x)).toEqual([3])
    expect(t.ticks).toHaveLength(t.weeks)
  })

  it('labels the month at its first Monday', () => {
    const t = timeline()
    expect(t.months.map((m) => [m.x, m.date.getMonth()])).toEqual([
      [0, 8],
      [3, 9],
      [7, 10],
      [12, 11],
      [16, 0],
    ])
  })

  it('opens the step of today when a lane is tapped, else the next one, else the last', () => {
    const t = timeline()
    expect(lane(t, 'cjc').focusStep).toBe(2)
    const ahead = timeline([cjc({ start_date: '2026-10-12' })])
    expect(lane(ahead, 'cjc').focusStep).toBe(0)
    const over = timeline([cjc({ start_date: '2026-06-01' })])
    expect(lane(over, 'cjc').focusStep).toBe(3)
  })

  it('gives a plan that starts later room on the axis', () => {
    const t = timeline([cjc({ start_date: '2026-12-07' })])
    expect(t.start).toEqual(d('2026-10-05T00:00')) // today's week
    expect(lane(t, 'cjc').blocks[0]).toMatchObject({ x: 9, w: 1, state: 'future' })
    expect(t.today).toBeLessThan(1)
  })

  it('cuts a cycle closed early where it was closed', () => {
    const closed = cjc({ status: 'completed', updated_at: d('2026-10-02T15:00').toISOString() })
    const blocks = lane(timeline([closed]), 'cjc').blocks
    expect(blocks.map((b) => b.stepIndex)).toEqual([0, 1])
    expect(blocks[1]!.w).toBeCloseTo(5 / 7)
    expect(blocks.every((b) => b.state === 'past')).toBe(true)
  })

  it('clips a long-running step at the start of the axis', () => {
    const t = timeline([reta({ start_date: '2025-01-06' })])
    const [first] = lane(t, 'reta').blocks
    expect(first).toMatchObject({ x: 0, clipped: true, open: true })
    expect(t.start.getTime()).toBeGreaterThan(d('2026-03-30T00:00').getTime() - 7 * 86_400_000)
  })

  it('leaves cycles that ended long ago to their cards', () => {
    const old = cjc({
      id: 'old',
      start_date: '2025-09-01',
      status: 'completed',
      updated_at: '2025-12-31T10:00:00Z',
    })
    const t = timeline([old, reta()])
    expect(t.hidden).toBe(1)
    expect(t.lanes.map((l) => l.id)).toEqual(['reta'])
  })

  it('says how long ago a cycle that is over stopped, so its empty stretch makes sense', () => {
    const done = cjc({
      id: 'done',
      start_date: '2026-06-01',
      status: 'completed',
      updated_at: '2026-09-25T10:00:00.000Z',
    })
    const t = timeline([done, reta()])
    expect(lane(t, 'done').endedWeeksAgo).toBe(2) // the plan ended on 21 September
    expect(lane(t, 'reta').endedWeeksAgo).toBeNull()
  })

  it('shows a recent cycle that has just finished', () => {
    const done = cjc({ id: 'done', start_date: '2026-06-01', status: 'completed' })
    const t = timeline([done, reta()])
    expect(t.hidden).toBe(0)
    expect(lane(t, 'done').blocks.every((b) => b.state === 'past')).toBe(true)
  })
})
