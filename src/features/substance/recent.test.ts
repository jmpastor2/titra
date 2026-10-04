import { describe, expect, it } from 'vitest'
import type { DoseRow, ProtocolRow } from '@/data/database.types'
import { buildStore } from '@/dev/fixtures'
import { deriveExposure } from '@/features/exposure/useExposure'
import { recentAdministrations } from './recent'

describe('recentAdministrations', () => {
  const now = new Date(2026, 9, 5, 0, 5)
  const store = buildStore(now)
  const items = deriveExposure(
    store.protocols as unknown as ProtocolRow[],
    store.doses as unknown as DoseRow[],
    now,
  )
  const byId = (id: string) => items.find((x) => x.compoundId === id)!

  it('lists a blend as one line per administration with both compounds', () => {
    const recent = recentAdministrations(byId('mod-grf-1-29'), 3)
    expect(recent).toHaveLength(3)
    // Newest first.
    expect(recent[0]!.at.getTime()).toBeGreaterThan(recent[1]!.at.getTime())
    for (const r of recent) {
      expect(r.doses.map((d) => d.compoundId)).toEqual(['mod-grf-1-29', 'ipamorelin'])
      expect(r.doses[1]!.doseMg).toBeCloseTo(r.doses[0]!.doseMg, 10)
    }
  })

  it('shows a single compound on its own', () => {
    const recent = recentAdministrations(byId('mots-c'), 5)
    expect(recent).toHaveLength(5)
    expect(recent.every((r) => r.doses.length === 1)).toBe(true)
  })

  it('shows what a partner took on its own page, without repeating the primary', () => {
    const recent = recentAdministrations(byId('ipamorelin'), 2)
    expect(
      recent.every((r) => r.doses.length === 1 && r.doses[0]!.compoundId === 'ipamorelin'),
    ).toBe(true)
  })

  it('stops at the number asked for', () => {
    expect(recentAdministrations(byId('retatrutide'), 2)).toHaveLength(2)
    expect(recentAdministrations(byId('retatrutide'), 99).length).toBe(
      byId('retatrutide').doses.length,
    )
  })
})
