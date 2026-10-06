import { addDays } from 'date-fns'
import { describe, expect, it } from 'vitest'
import { fmtPunctuality, median, punctuality } from './punctuality'
import { blendDose, cjcProtocol } from './testData'
import { doseCells, type WeekCell } from './week'

const now = new Date('2026-10-04T12:00')

/** A planned administration taken `deltaMin` off its time, `daysAgo` days before `now`. */
function cell(daysAgo: number, deltaMin: number | null, status?: WeekCell['status']): WeekCell {
  const plannedAt = addDays(new Date('2026-10-04T01:00'), -daysAgo)
  return {
    protocol: cjcProtocol,
    plannedAt,
    takenAt: deltaMin === null ? null : new Date(plannedAt.getTime() + deltaMin * 60_000),
    deltaMin,
    status: status ?? (deltaMin === null ? 'missed' : 'onTime'),
  }
}

describe('median', () => {
  it('takes the middle value, or the mean of the two middle ones', () => {
    expect(median([5, 1, 3])).toBe(3)
    expect(median([4, 1, 3, 10])).toBe(3.5)
    expect(median([])).toBeNull()
  })
})

describe('punctuality', () => {
  it('is the median distance from the planned time, early and late alike', () => {
    const p = punctuality([cell(1, -12), cell(2, 5), cell(3, 30), cell(4, -2), cell(5, 90)], now)
    expect(p).toEqual({ medianMin: 12, onTime: 0.8, count: 5 })
  })

  it('is not swamped by one make-up dose days late', () => {
    const p = punctuality([cell(1, 3), cell(2, -4), cell(10, 6 * 24 * 60, 'late')], now)
    expect(p?.medianMin).toBe(4)
    expect(p?.onTime).toBeCloseTo(2 / 3, 10)
  })

  it('leaves out missed administrations, extras and what is outside the window', () => {
    const p = punctuality(
      [cell(1, 20), cell(2, null), cell(3, 0, 'extra'), cell(30, 300), cell(-1, 0)],
      now,
    )
    expect(p).toEqual({ medianMin: 20, onTime: 1, count: 1 })
  })

  it('is null when nothing planned was taken', () => {
    expect(punctuality([], now)).toBeNull()
    expect(punctuality([cell(1, null)], now)).toBeNull()
  })

  it('reads the real matching: night shots a few minutes around 01:00', () => {
    const rows = ['2026-09-29T01:04', '2026-09-30T00:52', '2026-10-01T01:30'].flatMap((at) =>
      blendDose(at, { protocol_id: 'cjc' }),
    )
    const p = punctuality(doseCells([cjcProtocol], rows, addDays(now, -28), now).values(), now)
    expect(p).toEqual({ medianMin: 8, onTime: 1, count: 3 })
  })
})

describe('fmtPunctuality', () => {
  it('reads minutes, then hours, then days, with the sign of "either way"', () => {
    expect(fmtPunctuality(12, 'es')).toEqual({ value: '±12', unit: 'min' })
    expect(fmtPunctuality(0, 'es')).toEqual({ value: '±0', unit: 'min' })
    expect(fmtPunctuality(90, 'es')).toEqual({ value: '±1,5', unit: 'h' })
    expect(fmtPunctuality(36 * 60, 'en')).toEqual({ value: '±1.5', unit: 'd' })
  })
})
