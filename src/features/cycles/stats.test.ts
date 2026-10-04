import { describe, expect, it } from 'vitest'
import { toDoseEvent } from '@/data/mappers'
import type { DoseEvent } from '@/domain/types'
import { asJson, cjc, doseRow, FOUR_MONDAYS, protocolRow, weightRow } from './fixtures'
import { buildCycleViews } from './model'
import {
  adherenceBetween,
  compareCycles,
  cycleStats,
  retrospective,
  weightChange,
  weightReadings,
  windowStats,
  type StatsInput,
} from './stats'

const d = (iso: string) => new Date(iso)

/** Four Mondays at 09:00, a different set of starts per test. */
const weekly = (id: string, start: string, status: 'active' | 'completed' | 'paused' = 'active') =>
  protocolRow({
    id,
    compound_id: 'retatrutide',
    name: 'Retatrutida',
    unit: 'mg',
    start_date: start,
    times: ['09:00'],
    time_of_day: '09:00',
    steps: asJson(FOUR_MONDAYS),
    components: [],
    status,
    updated_at: '2027-01-01T10:00:00.000Z',
  })

const ev = (...iso: string[]): DoseEvent[] => iso.map((i) => toDoseEvent(doseRow(i)))
const KNOWN = d('2026-01-01T00:00')

describe('weightReadings', () => {
  it('keeps weights, oldest first, and drops what is not a weight', () => {
    const rows = [
      weightRow('2026-09-20T08:00', 77),
      weightRow('2026-09-10T08:00', 78),
      { ...weightRow('2026-09-12T08:00', 91), kind: 'waist' as const },
      weightRow('2026-09-15T08:00', 0),
    ]
    expect(weightReadings(rows).map((r) => r.kg)).toEqual([78, 77])
  })
})

describe('weightChange', () => {
  const readings = weightReadings([
    weightRow('2026-08-01T08:00', 80),
    weightRow('2026-08-28T08:00', 78),
    weightRow('2026-09-03T08:00', 77.8),
    weightRow('2026-09-14T08:00', 77.2),
    weightRow('2026-10-01T08:00', 76.5),
    weightRow('2026-10-03T08:00', 76.2),
  ])

  it('starts from the latest weigh-in in the two weeks before the start', () => {
    const c = weightChange(readings, d('2026-09-07T00:00'), d('2026-10-05T00:00'))!
    expect(c.baseline.kg).toBe(77.8)
    expect(c.latest.kg).toBe(76.2)
    expect(c.deltaKg).toBeCloseTo(-1.6)
  })

  it('starts from the first reading after the start when none is that close', () => {
    const c = weightChange(readings, d('2026-09-29T00:00'), d('2026-10-05T00:00'))!
    expect(c.baseline.kg).toBe(76.5)
    expect(c.deltaKg).toBeCloseTo(-0.3)
  })

  it('ignores readings after the end of the stretch', () => {
    const c = weightChange(readings, d('2026-09-07T00:00'), d('2026-09-20T00:00'))!
    expect(c.latest.kg).toBe(77.2)
  })

  it('needs two readings: one is not a change', () => {
    // Nothing weighed since the start.
    expect(weightChange(readings, d('2026-10-04T00:00'), d('2026-10-05T00:00'))).toBeNull()
    expect(weightChange(readings, d('2026-09-07T00:00'), d('2026-09-10T00:00'))).toBeNull()
    // A single reading in all.
    expect(
      weightChange(readings.slice(-1), d('2026-09-07T00:00'), d('2026-10-05T00:00')),
    ).toBeNull()
    expect(weightChange([], d('2026-09-07T00:00'), d('2026-10-05T00:00'))).toBeNull()
  })
})

describe('adherenceBetween', () => {
  const like = buildCycleViews([weekly('p', '2026-09-07')], d('2026-10-06T10:00'))[0]!.like
  // Four Mondays at 09:00; the 21st is missed. An extra shot on a Wednesday.
  const history = ev('2026-09-07T09:05', '2026-09-14T08:50', '2026-09-28T09:20', '2026-09-30T12:00')

  it('counts the planned doses of the stretch and the ones taken', () => {
    const a = adherenceBetween(like, history, d('2026-09-07T00:00'), d('2026-10-05T00:00'))
    expect(a).toMatchObject({ expected: 4, taken: 3 })
    expect(a.ratio).toBeCloseTo(0.75)
  })

  it('looks only at the stretch it is given', () => {
    const a = adherenceBetween(like, history, d('2026-09-14T00:00'), d('2026-09-22T00:00'))
    expect(a).toMatchObject({ expected: 2, taken: 1 })
  })
})

describe('windowStats', () => {
  const like = buildCycleViews([weekly('p', '2026-09-07')], d('2026-10-06T10:00'))[0]!.like
  const history = ev('2026-09-07T09:05', '2026-09-14T08:50', '2026-09-28T09:20', '2026-09-30T12:00')
  const readings = weightReadings([
    weightRow('2026-09-05T08:00', 77),
    weightRow('2026-10-02T08:00', 76),
  ])
  const input: StatsInput = { like, history, readings, knownSince: KNOWN }

  it('adds up adherence, every dose logged (extras too) and the weight change', () => {
    const s = windowStats(input, d('2026-09-07T00:00'), d('2026-10-05T00:00'))
    expect(s.adherence).toMatchObject({ expected: 4, taken: 3 })
    expect(s.taken).toBe(4)
    expect(s.weight?.deltaKg).toBeCloseTo(-1)
  })

  it('knows nothing of a stretch that starts before the doses loaded', () => {
    const s = windowStats(
      { ...input, knownSince: d('2026-09-10T00:00') },
      d('2026-09-07T00:00'),
      d('2026-10-05T00:00'),
    )
    expect(s.adherence).toBeNull()
    expect(s.taken).toBeNull()
    expect(s.weight).not.toBeNull()
  })

  it('has no adherence for an empty stretch or when asked not to', () => {
    const at = d('2026-09-07T00:00')
    expect(windowStats(input, at, at).adherence).toBeNull()
    expect(windowStats(input, at, d('2026-10-05T00:00'), { adherence: false }).adherence).toBeNull()
  })
})

describe('cycleStats', () => {
  const input = (rows: ReturnType<typeof weekly>[], doses: DoseEvent[]) => ({
    history: doses,
    readings: [],
    knownSince: KNOWN,
    rows,
  })

  it('runs to now while the cycle is in progress and to its end once it stopped', () => {
    const now = d('2026-09-22T10:00')
    const [running] = buildCycleViews([weekly('p', '2026-09-07')], now)
    const doses = ev('2026-09-07T09:00', '2026-09-14T09:00', '2026-09-21T09:00')
    const s = cycleStats(running!, input([], doses), now)!
    expect(s.adherence).toMatchObject({ expected: 3, taken: 3 })

    const later = d('2026-10-20T10:00')
    const [done] = buildCycleViews([weekly('p', '2026-09-07', 'completed')], later)
    const t = cycleStats(done!, input([], doses), later)!
    expect(t.adherence).toMatchObject({ expected: 4, taken: 3 })
  })

  it('is nothing before the cycle starts', () => {
    const now = d('2026-09-01T10:00')
    const [view] = buildCycleViews([weekly('p', '2026-09-07')], now)
    expect(cycleStats(view!, input([], []), now)).toBeNull()
  })

  it('keeps a paused cycle figures but does not hold its missed doses against it', () => {
    const now = d('2026-09-22T10:00')
    const [paused] = buildCycleViews([weekly('p', '2026-09-07', 'paused')], now)
    const s = cycleStats(paused!, input([], ev('2026-09-07T09:00')), now)!
    expect(s.adherence).toBeNull()
    expect(s.taken).toBe(1)
  })
})

describe('compareCycles', () => {
  const now = d('2026-09-22T10:00')
  const [current, previous] = buildCycleViews(
    [weekly('b', '2026-09-07'), weekly('a', '2026-07-06', 'completed')],
    now,
  )
  const inputs = {
    current: {
      history: ev('2026-09-07T09:00', '2026-09-14T09:00', '2026-09-21T09:00'),
      readings: weightReadings([
        weightRow('2026-09-05T08:00', 77),
        weightRow('2026-09-21T08:00', 76.4),
      ]),
      knownSince: KNOWN,
    },
    previous: {
      history: ev('2026-07-06T09:00', '2026-07-13T09:00', '2026-07-27T09:00'),
      readings: weightReadings([
        weightRow('2026-07-04T08:00', 78),
        weightRow('2026-07-20T08:00', 77.5),
      ]),
      knownSince: KNOWN,
    },
  }

  it('holds this cycle against the one before over the same stretch from their starts', () => {
    expect(current!.row.id).toBe('b')
    expect(previous!.row.id).toBe('a')
    const c = compareCycles(current!, previous!, inputs, now)!
    // Two weeks and a bit in: the 27 July dose is not part of the stretch.
    expect(c.weeks).toBe(2)
    expect(c.current.adherence).toMatchObject({ expected: 3, taken: 3 })
    expect(c.previous.adherence).toMatchObject({ expected: 3, taken: 2 })
    expect(c.current.weight?.deltaKg).toBeCloseTo(-0.6)
    expect(c.previous.weight?.deltaKg).toBeCloseTo(-0.5)
  })

  it('has nothing to compare before a day has gone by', () => {
    const early = d('2026-09-07T10:00')
    const [cur, prev] = buildCycleViews(
      [weekly('b', '2026-09-07'), weekly('a', '2026-07-06', 'completed')],
      early,
    )
    expect(compareCycles(cur!, prev!, inputs, early)).toBeNull()
  })
})

describe('retrospective', () => {
  it('sums the weeks of dosing and of rest of a cycle that ran its course', () => {
    const now = d('2026-10-05T10:00')
    const [view] = buildCycleViews(
      [cjc({ start_date: '2026-05-04', status: 'completed', updated_at: '2026-09-01T10:00:00Z' })],
      now,
    )
    const r = retrospective(view!, now)
    expect(r).toMatchObject({
      weeks: 16,
      doseWeeks: 12,
      restWeeks: 4,
      lastDoseMg: 0.2,
      early: false,
    })
    expect(r.startsOn).toEqual(d('2026-05-04T00:00'))
    expect(r.stopsOn).toEqual(d('2026-08-24T00:00'))
  })

  it('stops a cycle closed early where it was closed', () => {
    const now = d('2026-10-05T10:00')
    const [view] = buildCycleViews(
      [cjc({ status: 'completed', updated_at: d('2026-10-02T15:00').toISOString() })],
      now,
    )
    const r = retrospective(view!, now)
    expect(r).toMatchObject({ weeks: 2, doseWeeks: 2, restWeeks: 0, lastDoseMg: 0.15, early: true })
  })
})
