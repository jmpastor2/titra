import { addDays } from 'date-fns'
import { describe, expect, it } from 'vitest'
import type { ProtocolLike } from '@/domain/types'
import { cropToActivity, curveWindow, firstActivity, RANGES, timelineWindow } from './ranges'

const at = (m: number, d: number, h = 0) => new Date(2026, m - 1, d, h)

const MOTS: ProtocolLike = {
  compoundId: 'mots-c',
  startDate: '2026-09-07',
  times: ['07:00'],
  steps: [
    { doseMg: 1, intervalDays: 1, weekdays: [1, 3, 5], durationWeeks: 4 },
    { doseMg: 1.5, intervalDays: 1, weekdays: [1, 3, 5], durationWeeks: null },
  ],
}

// 1 + 1 + 10 weeks of dosing and 4 of rest, from Monday 28 Sep 2026: ends Monday 18 Jan 2027.
const BLEND: ProtocolLike = {
  compoundId: 'mod-grf-1-29',
  startDate: '2026-09-28',
  times: ['25:00'],
  steps: [
    { doseMg: 0.1, intervalDays: 1, weekdays: [1, 2, 3, 4, 5], durationWeeks: 1 },
    { doseMg: 0.15, intervalDays: 1, weekdays: [1, 2, 3, 4, 5], durationWeeks: 1 },
    { doseMg: 0.2, intervalDays: 1, weekdays: [1, 2, 3, 4, 5], durationWeeks: 10 },
    { doseMg: 0, intervalDays: 1, pause: true, durationWeeks: 4 },
  ],
}

describe('ranges', () => {
  it('offers the four ranges of the brief', () => {
    expect(RANGES).toEqual(['7d', '4w', '12w', 'cycle'])
  })
})

describe('timelineWindow', () => {
  const now = at(10, 5, 14) // Monday 5 Oct 2026

  it('spans whole local days with a few days ahead', () => {
    const w7 = timelineWindow('7d', now, null)
    expect(w7.from).toEqual(at(9, 29))
    expect(w7.to).toEqual(at(10, 7))
    const w4 = timelineWindow('4w', now, null)
    expect(w4.from).toEqual(at(9, 8))
    expect(w4.to).toEqual(at(10, 10))
    const w12 = timelineWindow('12w', now, null)
    expect(w12.from).toEqual(addDays(at(10, 5), -83))
    expect(w12.to).toEqual(at(10, 13))
  })

  it('runs a cycle from the start of the protocol to its end', () => {
    const w = timelineWindow('cycle', now, BLEND)
    expect(w.from).toEqual(at(9, 28))
    expect(w.to).toEqual(new Date(2027, 0, 18))
  })

  it('gives an open-ended plan two weeks ahead and never reaches back past six months', () => {
    const open = timelineWindow('cycle', now, MOTS)
    expect(open.from).toEqual(at(9, 7))
    expect(open.to).toEqual(at(10, 19))
    const old = timelineWindow('cycle', at(10, 5), { ...MOTS, startDate: '2024-01-01' })
    expect(old.from).toEqual(addDays(at(10, 5), -182))
  })

  it('has no cycle without a protocol: the last four weeks, two ahead', () => {
    const none = timelineWindow('cycle', now, null)
    expect(none.from).toEqual(addDays(at(10, 5), -27))
    expect(none.to).toEqual(at(10, 19))
  })

  it('shows at least a week of a protocol that has only just started', () => {
    const fresh = timelineWindow('cycle', at(9, 28), {
      ...BLEND,
      steps: [{ doseMg: 0.1, intervalDays: 1, weekdays: [1], durationWeeks: 1 }],
    })
    expect(fresh.to.getTime() - fresh.from.getTime()).toBeGreaterThanOrEqual(7 * 86_400_000)
  })
})

describe('curveWindow', () => {
  const now = at(10, 5, 14)
  const day = 86_400_000

  it('looks a week either way in the short view and further out in the long one', () => {
    const w7 = curveWindow('7d', now, null, null)
    expect(w7.from.getTime()).toBe(now.getTime() - 7 * day)
    expect(w7.to.getTime()).toBe(now.getTime() + 7 * day)
    const w12 = curveWindow('12w', now, null, null)
    expect(w12.from.getTime()).toBe(now.getTime() - 84 * day)
    expect(w12.to.getTime()).toBe(now.getTime() + 28 * day)
  })

  it('projects two weeks by default and stretches to reach a titration step that is close', () => {
    expect(curveWindow('4w', now, null, null).to.getTime()).toBe(now.getTime() + 14 * day)
    expect(curveWindow('4w', now, null, 5).to.getTime()).toBe(now.getTime() + 14 * day)
    // Next step in 12 days: show it with a week to spare.
    expect(curveWindow('4w', now, null, 12).to.getTime()).toBe(now.getTime() + 19 * day)
    // Never more than 35 days.
    expect(curveWindow('4w', now, null, 60).to.getTime()).toBe(now.getTime() + 35 * day)
  })

  it('runs a cycle through its end, with at least two weeks of look-ahead', () => {
    const w = curveWindow('cycle', now, BLEND, null)
    expect(w.from).toEqual(at(9, 28))
    expect(w.to).toEqual(new Date(2027, 0, 18))
    const done = curveWindow(
      'cycle',
      at(2, 1),
      {
        ...MOTS,
        startDate: '2026-01-05',
        steps: [{ doseMg: 1, intervalDays: 1, weekdays: [1], durationWeeks: 2 }],
      },
      null,
    )
    expect(done.to.getTime()).toBeGreaterThanOrEqual(at(2, 1).getTime() + 14 * day)
  })
})

describe('firstActivity / cropToActivity', () => {
  const now = at(10, 5, 14)

  it('finds when the protocol or the first dose started, whichever is earlier', () => {
    expect(firstActivity(null, [])).toBeNull()
    expect(firstActivity(BLEND, [])).toEqual(at(9, 28))
    expect(firstActivity(BLEND, [{ at: at(9, 20, 8) }])).toEqual(at(9, 20, 8))
    expect(firstActivity(null, [{ at: at(9, 20, 8) }])).toEqual(at(9, 20, 8))
  })

  it('cuts the empty start off a young regimen, a day before it begins', () => {
    const win = timelineWindow('4w', now, BLEND) // 8 Sep → 10 Oct
    const cropped = cropToActivity(win, firstActivity(BLEND, []))
    expect(cropped.from).toEqual(at(9, 27))
    expect(cropped.to).toEqual(win.to)
  })

  it('leaves a window alone when the activity began before it', () => {
    const win = timelineWindow('7d', now, MOTS)
    expect(cropToActivity(win, firstActivity(MOTS, []))).toEqual(win)
    expect(cropToActivity(win, null)).toEqual(win)
  })

  it('always keeps a week on screen', () => {
    // A protocol that starts today: the window still reaches back to give the marks room.
    const win = timelineWindow('7d', now, BLEND)
    const cropped = cropToActivity(win, now)
    expect(cropped.to.getTime() - cropped.from.getTime()).toBeGreaterThanOrEqual(7 * 86_400_000)
  })
})
