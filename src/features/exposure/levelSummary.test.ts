import { describe, expect, it } from 'vitest'
import type { ProtocolLike } from '@/domain/types'
import { doseDays, hasMeaningfulCurve, sparkline } from './levelSummary'

describe('hasMeaningfulCurve', () => {
  it('is true for long-acting compounds only', () => {
    expect(hasMeaningfulCurve({ halfLifeH: 144, tmaxH: 36 })).toBe(true)
    expect(hasMeaningfulCurve({ halfLifeH: 2 })).toBe(false)
    expect(hasMeaningfulCurve(undefined)).toBe(false)
  })
})

describe('sparkline', () => {
  const from = new Date(2026, 8, 1)
  const now = new Date(2026, 8, 11)
  const to = new Date(2026, 8, 15)
  const box = { width: 140, height: 32, pad: 4 }
  it('shares one scale between history and projection and keeps the now point inside', () => {
    const s = sparkline(
      [
        { at: from, mg: 0 },
        { at: now, mg: 2 },
      ],
      [
        { at: now, mg: 2 },
        { at: to, mg: 4 },
      ],
      [{ at: new Date(2026, 8, 4), mg: 2 }],
      from,
      to,
      box,
    )
    expect(s.history.startsWith('M4 28')).toBe(true)
    expect(s.projection).toContain('L136 4')
    expect(s.now).not.toBeNull()
    expect(s.now!.x).toBeGreaterThan(box.pad)
    expect(s.now!.x).toBeLessThan(box.width - box.pad)
    expect(s.now!.y).toBe(16)
    expect(s.doses).toHaveLength(1)
    expect(s.baselineY).toBe(28)
  })
  it('handles an empty curve', () => {
    const s = sparkline([], [], [], from, to, box)
    expect(s.history).toBe('')
    expect(s.now).toBeNull()
  })
})

describe('doseDays', () => {
  const MOTS: ProtocolLike = {
    compoundId: 'mots-c',
    startDate: '2026-08-03',
    times: ['07:00'],
    steps: [{ doseMg: 5, intervalDays: 1, weekdays: [1, 3, 5], durationWeeks: null }],
  }
  // Friday 25 Sep 2026, 06:00: today's 07:00 shot is still ahead.
  const now = new Date(2026, 8, 25, 6)
  it('marks taken, missed, planned-today and rest days', () => {
    const history = [
      { at: new Date(2026, 8, 21, 7), mg: 5 }, // Mon
      { at: new Date(2026, 8, 20, 12), mg: 5 }, // Sun, off-plan but logged
    ]
    const cells = doseDays(history, MOTS, now, 7)
    expect(cells).toHaveLength(7)
    // Sat 19 … Fri 25
    expect(cells.map((c) => c.state)).toEqual([
      'rest',
      'taken',
      'taken',
      'rest',
      'missed',
      'rest',
      'planned',
    ])
    expect(cells.at(-1)!.isToday).toBe(true)
  })
  it('without a protocol only logged days stand out', () => {
    const cells = doseDays([{ at: new Date(2026, 8, 24, 20), mg: 1 }], null, now, 3)
    expect(cells.map((c) => c.state)).toEqual(['rest', 'taken', 'rest'])
  })
})
