import { describe, expect, it } from 'vitest'
import { DEFAULT_ROTATION } from './catalog'
import {
  ageShort,
  byRest,
  heatFor,
  rankSites,
  siteStatuses,
  siteTimeline,
  toInjections,
} from './rotation'

/** Monday 28 Sep 2026 at `h`:`m`, shifted by `d` days. Local time. */
const at = (d: number, h = 8, m = 0) => new Date(2026, 8, 28 + d, h, m)
const ids = (r: { siteId: string }[]) => r.map((s) => s.siteId)

describe('toInjections', () => {
  it('merges a blend logged as several rows into one injection', () => {
    const inj = toInjections([
      { siteId: 'abd_ul', at: at(0, 22), compoundId: 'mod-grf-1-29' },
      { siteId: 'abd_ul', at: at(0, 22, 1), compoundId: 'ipamorelin' },
      { siteId: 'abd_ur', at: at(0, 22, 1), compoundId: 'other' },
    ])
    expect(inj).toHaveLength(2)
    const ul = inj.find((i) => i.siteId === 'abd_ul')!
    expect(ul.compoundIds).toEqual(['ipamorelin', 'mod-grf-1-29'])
  })

  it('keeps separate shots at the same site on different moments', () => {
    const inj = toInjections([
      { siteId: 'abd_ul', at: at(0, 8) },
      { siteId: 'abd_ul', at: at(0, 22) },
    ])
    expect(inj.map((i) => i.at)).toEqual([at(0, 22), at(0, 8)])
  })
})

describe('rankSites', () => {
  it('follows the rotation when nothing was used', () => {
    const r = rankSites([], at(0))
    expect(ids(r)).toEqual(DEFAULT_ROTATION)
    expect(r[0]!.reason).toEqual({ kind: 'never' })
    expect(r[0]!.restUntil).toBeNull()
  })

  it('never suggests the site used earlier the same morning', () => {
    // Monday: retatrutide at 08:00, MOTS-c five minutes later.
    const history = [
      { siteId: 'abd_ul', at: at(0, 8), compoundId: 'retatrutide' },
      // Everything else was used long ago, abd_ul longest before today.
      ...DEFAULT_ROTATION.filter((id) => id !== 'abd_ul').map((id, i) => ({
        siteId: id,
        at: at(-6, 8 + i),
      })),
    ]
    const r = rankSites(history, at(0, 8, 5), { compoundId: 'mots-c' })
    expect(r[0]!.siteId).not.toBe('abd_ul')
    expect(r.at(-1)!.siteId).toBe('abd_ul')
    expect(r.at(-1)!.reason.kind).toBe('today')
    expect(r.at(-1)!.hoursSince).toBeCloseTo(5 / 60)
    expect(r.at(-1)!.usedToday).toBe(true)
  })

  it('keeps sites inside the 72 h rest below rested ones, whatever the balance', () => {
    const history = [
      { siteId: 'thigh_r', at: at(-3, 10) }, // 70 h before now: resting
      { siteId: 'thigh_l', at: at(-3, 6) }, // 74 h: rested
      { siteId: 'abd_ul', at: at(0, 6) }, // 2 h, left side: pushes left sites down
    ]
    const r = rankSites(history, at(0, 8), { candidates: ['thigh_r', 'thigh_l'] })
    expect(ids(r)).toEqual(['thigh_l', 'thigh_r'])
    expect(r[1]!.resting).toBe(true)
    expect(r[1]!.restUntil).toEqual(at(0, 10))
    expect(r[1]!.reason).toEqual({ kind: 'recent', hours: 70 })
    expect(r[0]!.reason).toEqual({ kind: 'rested', days: 3 })
  })

  it('switches side after a recent shot', () => {
    const r = rankSites([{ siteId: 'abd_ul', at: at(0, 8) }], at(0, 20), {
      candidates: ['thigh_l', 'thigh_r'],
    })
    expect(r[0]!.siteId).toBe('thigh_r')
    expect(r[0]!.balance).toBe('otherSide')
    expect(r[1]!.balance).toBe('otherRegion')
  })

  it('switches region when the side is already balanced', () => {
    const r = rankSites([{ siteId: 'abd_ul', at: at(0, 8) }], at(0, 12), {
      candidates: ['abd_ur', 'thigh_r'],
    })
    expect(r[0]!.siteId).toBe('thigh_r')
  })

  it('forgets the balance after two days: pure least-recently-used', () => {
    const history = [
      { siteId: 'thigh_l', at: at(-6) },
      { siteId: 'thigh_r', at: at(-5) },
      { siteId: 'abd_ul', at: at(-3) }, // latest shot, 3 days ago, left
    ]
    const r = rankSites(history, at(0), { candidates: ['thigh_r', 'thigh_l'] })
    expect(r[0]!.siteId).toBe('thigh_l')
    expect(r[0]!.balance).toBeNull()
  })

  it('penalises a site hammered repeatedly in the last two weeks', () => {
    const history = [
      { siteId: 'abd_ul', at: at(-10) },
      { siteId: 'abd_ul', at: at(-7) },
      { siteId: 'abd_ul', at: at(-5) },
      { siteId: 'abd_ll', at: at(-5, 11) }, // used 3 h after abd_ul, but only once
    ]
    const r = rankSites(history, at(0), { candidates: ['abd_ul', 'abd_ll'] })
    expect(r[0]!.siteId).toBe('abd_ll')
    expect(r[1]!.recentUses).toBe(3)
  })

  it('avoids the site the same substance went to last time', () => {
    const history = [
      { siteId: 'thigh_l', at: at(-7), compoundId: 'retatrutide' },
      { siteId: 'abd_ul', at: at(-7, 20), compoundId: 'mots-c' },
    ]
    const opts = { candidates: ['thigh_l', 'abd_ul'] }
    expect(rankSites(history, at(0), opts)[0]!.siteId).toBe('thigh_l')
    const r = rankSites(history, at(0), { ...opts, compoundId: 'retatrutide' })
    expect(r[0]!.siteId).toBe('abd_ul')
    expect(r[1]!.lastForCompound).toBe(true)
  })

  it('handles unknown ids and duplicate candidates', () => {
    const r = rankSites([{ siteId: 'custom', at: at(-1) }], at(0), {
      candidates: ['custom', 'custom', 'abd_ul'],
    })
    expect(ids(r)).toEqual(['abd_ul', 'custom'])
    expect(r[1]!.site.region).toBe('other')
  })

  it('treats a use logged after now as just used', () => {
    const r = rankSites([{ siteId: 'abd_ul', at: at(0, 10) }], at(0, 8), {
      candidates: ['abd_ul'],
    })
    expect(r[0]!.hoursSince).toBe(0)
    expect(r[0]!.resting).toBe(true)
  })
})

describe('siteStatuses', () => {
  it('covers the whole catalogue plus legacy ids, with the last substances', () => {
    const s = siteStatuses(
      [
        { siteId: 'arm_l', at: at(-2), compoundId: 'bpc-157' },
        { siteId: 'legacy', at: at(-20) },
      ],
      at(0),
    )
    expect(s).toHaveLength(11)
    const arm = s.find((x) => x.siteId === 'arm_l')!
    expect(arm.lastCompoundIds).toEqual(['bpc-157'])
    expect(arm.heat).toBe('warm')
    expect(arm.restUntil).toEqual(at(1))
    expect(s.find((x) => x.siteId === 'legacy')!.recentUses).toBe(0)
    expect(s.find((x) => x.siteId === 'glute_r')!.heat).toBe('never')
  })
})

describe('heatFor', () => {
  it('bands recency', () => {
    expect(heatFor(null)).toBe('never')
    expect(heatFor(3)).toBe('hot')
    expect(heatFor(30)).toBe('warm')
    expect(heatFor(80)).toBe('cool')
    expect(heatFor(24 * 8)).toBe('rested')
    expect(heatFor(30, 24)).toBe('cool')
  })
})

describe('siteTimeline', () => {
  it('returns 14 local days ending today, oldest first, shots in time order', () => {
    const days = siteTimeline(
      [
        { siteId: 'abd_ul', at: at(0, 8), compoundId: 'retatrutide' },
        { siteId: 'abd_ur', at: at(0, 8, 5), compoundId: 'mots-c' },
        { siteId: 'thigh_l', at: at(0, 22) },
        { siteId: 'thigh_r', at: at(-13, 9) },
        { siteId: 'abd_ll', at: at(-14, 23) }, // outside the window
      ],
      at(0, 23),
    )
    expect(days).toHaveLength(14)
    expect(days[0]!.date).toEqual(new Date(2026, 8, 15))
    expect(days[0]!.injections.map((i) => i.siteId)).toEqual(['thigh_r'])
    expect(days[13]!.injections.map((i) => i.siteId)).toEqual(['abd_ul', 'abd_ur', 'thigh_l'])
    expect(days.flatMap((d) => d.injections)).toHaveLength(4)
  })
})

describe('ageShort', () => {
  it('reads hours under a day, then days', () => {
    expect(ageShort(null)).toBe('')
    expect(ageShort(0.2)).toBe('0h')
    expect(ageShort(23.9)).toBe('23h')
    expect(ageShort(49)).toBe('2d')
    expect(ageShort(24 * 400)).toBe('99d')
  })
})

describe('byRest', () => {
  it('lists ready sites (most rested first), then resting (soonest free), then never used', () => {
    const s = siteStatuses(
      [
        { siteId: 'abd_ul', at: at(-1) },
        { siteId: 'abd_ur', at: at(-2) },
        { siteId: 'thigh_l', at: at(-9) },
        { siteId: 'thigh_r', at: at(-4) },
      ],
      at(0),
    )
    expect(
      byRest(s)
        .slice(0, 5)
        .map((x) => x.siteId),
    ).toEqual(['thigh_l', 'thigh_r', 'abd_ur', 'abd_ul', 'abd_ll'])
  })
})
