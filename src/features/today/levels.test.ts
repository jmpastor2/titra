import { describe, expect, it } from 'vitest'
import { labAccount } from '@/features/exposure/testData'
import { dayTick, levelRow, sinceShort } from './levels'

// Sunday evening of the lab account.
const SUNDAY = new Date(2026, 9, 4, 20, 30)

describe('levelRow', () => {
  const lab = labAccount(SUNDAY)

  it('reads a long-acting compound against its steady level', () => {
    const row = levelRow(lab.byId('retatrutide'))
    expect(row.kind).toBe('steady')
    if (row.kind !== 'steady') return
    expect(row.fraction).toBeGreaterThan(0)
    expect(row.fraction).toBeLessThanOrEqual(1.5)
    expect(row.nowMg).toBeGreaterThan(0)
    expect(row.hoursTo90).toBeGreaterThanOrEqual(0)
  })

  it('reads a short-acting one by its last dose and two weeks of days', () => {
    const row = levelRow(lab.byId('mots-c'))
    expect(row.kind).toBe('recent')
    if (row.kind !== 'recent') return
    expect(row.ticks).toHaveLength(14)
    expect(row.lastAt).not.toBeNull()
    expect(row.taken).toBe(row.ticks.filter((s) => s === 'full').length)
    expect(row.expected).toBeGreaterThanOrEqual(row.taken)
  })

  it('counts the missed night of the blend against what was planned', () => {
    const row = levelRow(lab.byId('mod-grf-1-29'))
    if (row.kind !== 'recent') throw new Error('the blend is short-acting')
    expect(row.ticks).toContain('missed')
    expect(row.expected - row.taken).toBe(row.ticks.filter((s) => s === 'missed').length)
  })
})

describe('dayTick', () => {
  it('draws a taken day full, an off-plan one half, a miss rose, the rest as stubs', () => {
    expect(dayTick('taken')).toBe('full')
    expect(dayTick('late')).toBe('full')
    expect(dayTick('extra')).toBe('partial')
    expect(dayTick('missed')).toBe('missed')
    expect(dayTick('planned')).toBe('none')
    expect(dayTick('rest')).toBe('none')
  })
})

describe('sinceShort', () => {
  const at = (h: number) => new Date(SUNDAY.getTime() - h * 3_600_000)
  it('speaks minutes, then hours up to two days, then days', () => {
    expect(sinceShort(at(0), SUNDAY)).toBe('1 min')
    expect(sinceShort(at(0.5), SUNDAY)).toBe('30 min')
    expect(sinceShort(at(36.5), SUNDAY)).toBe('36 h')
    expect(sinceShort(at(47.9), SUNDAY)).toBe('47 h')
    expect(sinceShort(at(59.2), SUNDAY)).toBe('2 d')
  })
})
