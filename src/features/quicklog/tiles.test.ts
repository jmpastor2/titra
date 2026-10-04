import { describe, expect, it } from 'vitest'
import {
  MAX_TILES,
  PINNED,
  proteinTargetG,
  rankTiles,
  shortName,
  tierCheckIn,
  tierCount,
  tierDose,
  tierFasting,
  tierGirth,
  tierStrength,
  tierWeight,
  TILE_ORDER,
  type Tier,
  type TileId,
  type TileRank,
} from './tiles'

const all = (tiers: Partial<Record<TileId, Tier>>, fallback: Tier = 1): TileRank[] =>
  TILE_ORDER.map((id) => ({ id, tier: tiers[id] ?? fallback }))

describe('tiers', () => {
  it('asks for a dose that is due, then one coming up soon', () => {
    expect(tierDose('due', null)).toBe(3)
    expect(tierDose('overdue', null)).toBe(3)
    expect(tierDose('upcoming', 2)).toBe(2)
    expect(tierDose('upcoming', 9)).toBe(1)
    expect(tierDose('missed', null)).toBe(2)
    expect(tierDose('done', null)).toBe(0)
    expect(tierDose('none', null)).toBe(1)
  })

  it('weighs in: today is done, three days is stale, never is the first ask', () => {
    expect(tierWeight(0)).toBe(0)
    expect(tierWeight(1)).toBe(1)
    expect(tierWeight(3)).toBe(1)
    expect(tierWeight(4)).toBe(2)
    expect(tierWeight(null)).toBe(2)
  })

  it('measures girths weekly: stale only after a week, never is not an ask', () => {
    expect(tierGirth(0)).toBe(0)
    expect(tierGirth(7)).toBe(1)
    expect(tierGirth(8)).toBe(2)
    expect(tierGirth(null)).toBe(1)
  })

  it('checks in: done today, routine, or stale after three days', () => {
    expect(tierCheckIn(true, 0)).toBe(0)
    expect(tierCheckIn(false, 1)).toBe(1)
    expect(tierCheckIn(false, 4)).toBe(2)
    expect(tierCheckIn(false, null)).toBe(2)
  })

  it('offers the fast only with a GH-secretagogue protocol, and shows it near a dose', () => {
    expect(tierFasting({ available: false, near: true })).toBeNull()
    expect(tierFasting({ available: true, near: false })).toBe(0)
    expect(tierFasting({ available: true, near: true })).toBe(2)
  })

  it('asks for strength sessions until the weekly target is met', () => {
    expect(tierStrength(0)).toBe(2)
    expect(tierStrength(1)).toBe(2)
    expect(tierStrength(2)).toBe(0)
    expect(tierStrength(4)).toBe(0)
  })

  it('counts a goal as done once reached, and a missing goal as never done', () => {
    expect(tierCount(2500, 2500)).toBe(0)
    expect(tierCount(1000, 2500)).toBe(1)
    expect(tierCount(1000, null)).toBe(1)
  })
})

describe('protein target', () => {
  it('is grams per kg of the latest weight', () => {
    expect(proteinTargetG(90, 72, 1.6)).toBe(144)
    expect(proteinTargetG(77.4, null, 1.6)).toBe(124)
  })
  it('falls back to the goal weight before the first weigh-in', () => {
    expect(proteinTargetG(null, 72, 1.6)).toBe(115)
  })
  it('has no target without any weight', () => {
    expect(proteinTargetG(null, null, 1.6)).toBeNull()
  })
})

describe('ranking', () => {
  it('shows seven tiles and keeps the pinned ones whatever happens', () => {
    const { shown, hidden } = rankTiles(
      all({ checkin: 2, fasting: 2, waist: 2, strength: 2, water: 0, protein: 0, weight: 0 }),
    )
    expect(shown).toHaveLength(MAX_TILES)
    for (const id of PINNED) expect(shown).toContain(id)
    expect(hidden).toEqual(['strength', 'waist'])
  })

  it('puts what needs attention first and the rest in reading order', () => {
    const { shown, hidden } = rankTiles(all({ dose: 3, checkin: 2 }))
    expect(shown).toEqual(['dose', 'checkin', 'water', 'weight', 'symptom', 'fasting', 'protein'])
    expect(hidden).toEqual(['strength', 'waist'])
  })

  it('gives the free places to the most pressing of the others', () => {
    const { shown, hidden } = rankTiles(all({ checkin: 0, fasting: 2, waist: 2 }))
    expect(shown).toContain('fasting')
    expect(shown).toContain('waist')
    expect(hidden).toEqual(['strength', 'checkin'])
  })

  it('sends done tiles to the end of the grid, pinned ones included', () => {
    const { shown } = rankTiles(all({ dose: 0, water: 0, weight: 2 }))
    expect(shown[0]).toBe('weight')
    expect(shown.slice(-2)).toEqual(['dose', 'water'])
  })

  it('lists the hidden tiles most pressing first', () => {
    const { shown, hidden } = rankTiles(all({ strength: 0, checkin: 1, fasting: 0, waist: 1 }))
    expect(shown).toContain('checkin')
    expect(shown).toContain('waist')
    expect(hidden).toEqual(['fasting', 'strength'])
  })

  it('works without the fasting tile, as on an account with no GH protocol', () => {
    const ranks = all({}).filter((r) => r.id !== 'fasting')
    const { shown, hidden } = rankTiles(ranks)
    expect(shown).toHaveLength(MAX_TILES)
    expect(shown).not.toContain('fasting')
    expect(hidden).toHaveLength(1)
  })

  it('is deterministic for equal tiers', () => {
    const a = rankTiles(all({}))
    const b = rankTiles(all({}).toReversed())
    expect(b).toEqual(a)
  })
})

describe('short names', () => {
  it('shortens blends to fit a tile', () => {
    expect(shortName('CJC-1295 + Ipamorelina')).toBe('CJC + Ipa')
    expect(shortName('BPC-157 + TB-500')).toBe('BPC + TB')
  })
  it('leaves a single name alone', () => {
    expect(shortName('Retatrutida')).toBe('Retatrutida')
    expect(shortName('MOTS-c')).toBe('MOTS-c')
    expect(shortName('  ')).toBe('')
  })
})
