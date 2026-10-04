import { describe, expect, it } from 'vitest'
import {
  buildCycleViews,
  closedEarly,
  cycleCompoundIds,
  cycleStopsOn,
  isCurrent,
  isLatestOfSubstance,
  substanceKey,
} from './model'
import { cjc, mots, reta } from './fixtures'

const d = (iso: string) => new Date(iso)
const NOW = d('2026-10-05T10:00')

describe('substanceKey', () => {
  it('is the primary compound plus its blend partners, in a stable order', () => {
    expect(substanceKey(cjc())).toBe('mod-grf-1-29+ipamorelin')
    expect(substanceKey(reta())).toBe('retatrutide')
    const two = cjc({
      components: [
        { compoundId: 'ipamorelin', doseMg: 0.1 },
        { compoundId: 'bpc-157', doseMg: 0.25 },
      ],
    })
    expect(substanceKey(two)).toBe('mod-grf-1-29+bpc-157+ipamorelin')
  })
})

describe('cycleStopsOn', () => {
  const info = { startsOn: d('2026-09-21T00:00'), endsOn: d('2027-01-11T00:00') }
  const open = { startsOn: d('2026-09-14T00:00'), endsOn: null }

  it('is the end of the plan while the protocol is in progress', () => {
    expect(cycleStopsOn(info, 'active', '2026-09-22T10:00:00Z')).toEqual(info.endsOn)
    expect(cycleStopsOn(info, 'paused', '2026-09-22T10:00:00Z')).toEqual(info.endsOn)
    expect(cycleStopsOn(open, 'active', '2026-09-22T10:00:00Z')).toBeNull()
  })

  it('is the end of the plan for a cycle closed after it', () => {
    expect(cycleStopsOn(info, 'completed', d('2027-02-01T10:00').toISOString())).toEqual(
      info.endsOn,
    )
  })

  it('is the day after closing for a cycle closed before its plan ran out', () => {
    const closed = d('2026-10-02T15:00').toISOString()
    expect(cycleStopsOn(info, 'archived', closed)).toEqual(d('2026-10-03T00:00'))
    expect(cycleStopsOn(open, 'completed', closed)).toEqual(d('2026-10-03T00:00'))
  })

  it('never stops before it started, and survives a bad date', () => {
    expect(cycleStopsOn(info, 'completed', d('2026-08-01T10:00').toISOString())).toEqual(
      info.startsOn,
    )
    expect(cycleStopsOn(info, 'completed', 'not a date')).toEqual(info.endsOn)
  })
})

describe('buildCycleViews', () => {
  const rows = [
    cjc({
      id: 'cjc-1',
      start_date: '2026-05-04',
      status: 'completed',
      updated_at: '2026-08-31T10:00:00Z',
    }),
    cjc({ id: 'cjc-2' }),
    reta(),
    mots({ status: 'paused' }),
    cjc({ id: 'empty', steps: [] }),
  ]
  const views = buildCycleViews(rows, NOW)

  it('skips protocols without steps', () => {
    expect(views.map((v) => v.row.id)).not.toContain('empty')
  })

  it('lists cycles in progress first, then history', () => {
    expect(views.map((v) => v.row.id)).toEqual(['reta', 'cjc-2', 'mots', 'cjc-1'])
    expect(views.map((v) => isCurrent(v.row.status))).toEqual([true, true, true, false])
  })

  it('numbers the cycles of one substance by start date', () => {
    const first = views.find((v) => v.row.id === 'cjc-1')!
    const second = views.find((v) => v.row.id === 'cjc-2')!
    expect([first.ordinal, first.siblings, first.previousId]).toEqual([1, 2, null])
    expect([second.ordinal, second.siblings, second.previousId]).toEqual([2, 2, 'cjc-1'])
    expect(views.find((v) => v.row.id === 'reta')!.siblings).toBe(1)
  })

  it('knows the latest cycle of a substance', () => {
    const first = views.find((v) => v.row.id === 'cjc-1')!
    const second = views.find((v) => v.row.id === 'cjc-2')!
    expect(isLatestOfSubstance(first, views)).toBe(false)
    expect(isLatestOfSubstance(second, views)).toBe(true)
  })

  it('stops a closed cycle where its plan ended', () => {
    const first = views.find((v) => v.row.id === 'cjc-1')!
    expect(first.stopsOn).toEqual(d('2026-08-24T00:00')) // 16 weeks from 4 May
    expect(closedEarly(first)).toBe(false)
  })

  it('puts a plan that ran out ahead of the others: it needs a decision', () => {
    const ran = buildCycleViews([reta(), cjc({ id: 'old', start_date: '2026-06-01' })], NOW)
    expect(ran.map((v) => v.row.id)).toEqual(['old', 'reta'])
    expect(ran[0]!.info.phase).toBe('finished')
  })

  it('orders history by when it stopped, most recent first', () => {
    const past = buildCycleViews(
      [
        cjc({
          id: 'a',
          start_date: '2026-01-05',
          status: 'archived',
          updated_at: '2026-06-01T10:00:00Z',
        }),
        cjc({
          id: 'b',
          start_date: '2026-05-04',
          status: 'completed',
          updated_at: '2026-09-01T10:00:00Z',
        }),
      ],
      NOW,
    )
    expect(past.map((v) => v.row.id)).toEqual(['b', 'a'])
  })
})

describe('closedEarly', () => {
  it('flags a cycle closed before the plan ended, and never one in progress', () => {
    const [early] = buildCycleViews(
      [cjc({ status: 'completed', updated_at: d('2026-10-02T15:00').toISOString() })],
      NOW,
    )
    expect(closedEarly(early!)).toBe(true)
    const [running] = buildCycleViews([cjc()], NOW)
    expect(closedEarly(running!)).toBe(false)
  })
})

describe('cycleCompoundIds', () => {
  it('lists the primary compound first, then the blend partners', () => {
    const [view] = buildCycleViews([cjc()], NOW)
    expect(cycleCompoundIds(view!)).toEqual(['mod-grf-1-29', 'ipamorelin'])
  })
})
