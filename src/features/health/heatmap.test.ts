import { describe, expect, it } from 'vitest'
import type { AdherenceDay } from './consistency'
import { heatGrid, heatLevel, heatSpanDays, heatStart, monthStarts } from './heatmap'

const now = new Date(2026, 9, 7, 14) // Wednesday 7 Oct 2026

function adherenceDay(day: Date, taken: number, expected: number): AdherenceDay {
  return {
    day,
    taken,
    expected,
    ratio: expected > 0 ? taken / expected : null,
    mark: expected === 0 ? 'none' : taken >= expected ? 'full' : taken === 0 ? 'missed' : 'partial',
  }
}

describe('heatLevel', () => {
  it('has nothing to say about a day with nothing due', () => {
    expect(heatLevel(0, 0)).toBe('none')
    expect(heatLevel(3, 0)).toBe('none')
  })

  it('buckets the share of doses taken', () => {
    expect(heatLevel(0, 2)).toBe('missed')
    expect(heatLevel(1, 4)).toBe('low')
    expect(heatLevel(1, 3)).toBe('low')
    expect(heatLevel(1, 2)).toBe('mid')
    expect(heatLevel(2, 3)).toBe('mid')
    expect(heatLevel(2, 2)).toBe('full')
  })

  it('counts an extra dose as complete, not as more than complete', () => {
    expect(heatLevel(3, 2)).toBe('full')
  })
})

describe('heatStart and heatSpanDays', () => {
  it('starts on the Monday eleven weeks before this week’s', () => {
    // This week's Monday is 5 Oct; 11 weeks earlier is 20 Jul.
    expect(heatStart(now)).toEqual(new Date(2026, 6, 20))
  })

  it('asks for every day up to today, no more', () => {
    // 20 Jul to 7 Oct inclusive: 11 weeks (77 days) + Mon, Tue, Wed.
    expect(heatSpanDays(now)).toBe(80)
    expect(heatSpanDays(new Date(2026, 9, 11, 23))).toBe(84) // on a Sunday the week is whole
    expect(heatSpanDays(new Date(2026, 9, 5, 0, 5))).toBe(78) // on a Monday, just that day
  })

  it('follows the number of weeks', () => {
    expect(heatStart(now, 4)).toEqual(new Date(2026, 8, 14))
    expect(heatSpanDays(now, 4)).toBe(24)
  })
})

describe('heatGrid', () => {
  const days = [
    adherenceDay(new Date(2026, 9, 5), 2, 2), // Mon
    adherenceDay(new Date(2026, 9, 6), 1, 2), // Tue
    adherenceDay(new Date(2026, 9, 7), 0, 1), // Wed (today)
    adherenceDay(new Date(2026, 8, 28), 0, 3), // Mon a week earlier
  ]
  const grid = heatGrid(days, now)

  it('is twelve weeks of seven days, oldest week first and Monday on top', () => {
    expect(grid.weeks).toHaveLength(12)
    expect(grid.weeks.every((w) => w.length === 7)).toBe(true)
    expect(grid.weeks[0]![0]!.day).toEqual(new Date(2026, 6, 20))
    expect(grid.weeks[11]![0]!.day).toEqual(new Date(2026, 9, 5))
    expect(grid.weeks[11]![6]!.day).toEqual(new Date(2026, 9, 11))
    for (const week of grid.weeks)
      expect(week.map((c) => c.day.getDay())).toEqual([1, 2, 3, 4, 5, 6, 0])
  })

  it('tints each day by the share taken', () => {
    const last = grid.weeks[11]!
    expect(last.map((c) => c.level).slice(0, 3)).toEqual(['full', 'mid', 'missed'])
    expect(grid.weeks[10]![0]).toMatchObject({ level: 'missed', taken: 0, expected: 3 })
  })

  it('marks today and leaves the rest of the week as empty slots', () => {
    const last = grid.weeks[11]!
    expect(last.map((c) => c.today)).toEqual([false, false, true, false, false, false, false])
    expect(last.map((c) => c.future)).toEqual([false, false, false, true, true, true, true])
    expect(last.slice(3).every((c) => c.level === 'none')).toBe(true)
  })

  it('treats a day the data does not cover as nothing due', () => {
    expect(grid.weeks[0]![0]).toMatchObject({ level: 'none', taken: 0, expected: 0, future: false })
  })

  it('ignores the time of day of the days it is given', () => {
    const noon = adherenceDay(new Date(2026, 9, 5, 12), 1, 1)
    expect(heatGrid([noon], now).weeks[11]![0]!.level).toBe('full')
  })
})

describe('monthStarts', () => {
  it('labels the first column and every column where the month changes', () => {
    const labels = monthStarts(heatGrid([], now))
    // Mondays: 20 Jul, 27 Jul, 3 Aug … 31 Aug, 7 Sep … 28 Sep, 5 Oct.
    expect(labels.map((d) => (d ? d.getMonth() : null))).toEqual([
      6, // 20 Jul: the first column always has one
      null,
      7, // 3 Aug
      null,
      null,
      null,
      null, // 31 Aug is still August
      8, // 7 Sep
      null,
      null,
      null, // 28 Sep is still September
      9, // 5 Oct
    ])
  })
})
