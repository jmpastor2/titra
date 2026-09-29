import { describe, expect, it } from 'vitest'
import type { MeasurementKind } from '@/data/database.types'
import { meanScore, wellbeingBaseline } from './baseline'
import type { TimePoint } from './progress'

const at = (d: number, h = 20) => new Date(2026, 8, d, h)

describe('wellbeingBaseline', () => {
  it('turns a single check-in into a baseline without changes', () => {
    const series = new Map<MeasurementKind, TimePoint[]>([
      ['energy', [{ at: at(26), value: 8 }]],
      ['sleep_quality', [{ at: at(26), value: 6 }]],
    ])
    const rows = wellbeingBaseline(series, ['energy', 'mood', 'sleep_quality'])
    expect(rows.map((r) => r.kind)).toEqual(['energy', 'sleep_quality'])
    expect(rows[0]).toMatchObject({ baseline: 8, latest: 8, delta: null })
  })

  it('compares the latest check-in day with the first', () => {
    const series = new Map<MeasurementKind, TimePoint[]>([
      [
        'sleep_quality',
        [
          { at: at(30), value: 8 },
          { at: at(26, 8), value: 5 },
          { at: at(26, 21), value: 7 },
          { at: at(28), value: 7 },
        ],
      ],
    ])
    const [row] = wellbeingBaseline(series, ['sleep_quality'])
    expect(row).toMatchObject({ baseline: 6, latest: 8, delta: 2 })
  })
})

describe('meanScore', () => {
  it('averages or returns null', () => {
    expect(meanScore([8, 6, 7])).toBe(7)
    expect(meanScore([])).toBeNull()
  })
})
