import { describe, expect, it } from 'vitest'
import { DEFAULT_ROTATION, siteUsage, suggestNextSite } from './injectionSites'

const day = (n: number) => new Date(2026, 0, 1 + n, 9)

describe('suggestNextSite', () => {
  it('starts with the first rotation site when nothing was used', () => {
    const s = suggestNextSite([], DEFAULT_ROTATION, day(0))!
    expect(s.siteId).toBe('abd_ul')
    expect(s.tooRecent).toBe(false)
    expect(s.lastUsedAt).toBeNull()
  })

  it('prefers never-used sites, then the least recently used', () => {
    const history = [
      { siteId: 'abd_ul', at: day(0) },
      { siteId: 'abd_ur', at: day(7) },
    ]
    expect(suggestNextSite(history, DEFAULT_ROTATION, day(14))!.siteId).toBe('thigh_l')
    const full = DEFAULT_ROTATION.map((id, i) => ({ siteId: id, at: day(i * 7) }))
    const s = suggestNextSite(full, DEFAULT_ROTATION, day(6 * 7))!
    expect(s.siteId).toBe('abd_ul')
    expect(s.tooRecent).toBe(false)
  })

  it('flags when every site was used too recently', () => {
    const history = DEFAULT_ROTATION.map((id) => ({ siteId: id, at: day(0) }))
    const s = suggestNextSite(history, DEFAULT_ROTATION, day(2))!
    expect(s.tooRecent).toBe(true)
  })

  it('returns null for an empty rotation', () => {
    expect(suggestNextSite([], [], day(0))).toBeNull()
  })
})

describe('siteUsage', () => {
  it('counts per site', () => {
    expect(
      siteUsage([
        { siteId: 'a', at: day(0) },
        { siteId: 'a', at: day(1) },
        { siteId: 'b', at: day(2) },
      ]),
    ).toEqual({ a: 2, b: 1 })
  })
})
