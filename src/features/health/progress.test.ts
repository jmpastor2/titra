import { describe, expect, it } from 'vitest'
import type { ProtocolRow } from '@/data/database.types'
import {
  changeSince,
  changeTone,
  cycleStart,
  dominantSegment,
  fractionOf,
  monthlyMeans,
  fmtSigned,
  laneMarks,
  monthDelta,
  progressScope,
  protocolLanes,
  rangeWindow,
} from './progress'

const now = new Date(2026, 8, 25, 12)

function row(
  p: Partial<ProtocolRow> & Pick<ProtocolRow, 'id' | 'start_date' | 'steps'>,
): ProtocolRow {
  return {
    patient_id: 'p',
    created_by: null,
    compound_id: 'retatrutide',
    name: 'Retatrutida',
    route: 'sc',
    unit: 'mg',
    time_of_day: '09:00',
    times: ['09:00'],
    components: [],
    status: 'active',
    template_id: null,
    notes: null,
    created_at: '',
    updated_at: '',
    ...p,
  }
}

const RETA = row({
  id: 'r',
  start_date: '2026-07-06',
  steps: [
    { doseMg: 2, intervalDays: 7, durationWeeks: 4 },
    { doseMg: 4, intervalDays: 7, durationWeeks: 4 },
    { doseMg: 6, intervalDays: 7, durationWeeks: null },
  ],
})
const CJC = row({
  id: 'c',
  compound_id: 'mod-grf-1-29',
  name: 'CJC + Ipa',
  unit: 'mcg',
  start_date: '2026-08-03',
  steps: [
    { doseMg: 0.1, intervalDays: 1, weekdays: [1, 2, 3, 4, 5], durationWeeks: 4 },
    { pause: true, doseMg: 0, intervalDays: 1, durationWeeks: 2 },
    { doseMg: 0.1, intervalDays: 1, weekdays: [1, 2, 3, 4, 5], durationWeeks: null },
  ],
})
const OLD = row({ id: 'o', start_date: '2025-01-01', status: 'completed', steps: RETA.steps })

describe('cycleStart / rangeWindow', () => {
  it('uses the earliest active protocol', () => {
    expect(cycleStart([CJC, RETA, OLD])).toEqual(new Date(2026, 6, 6))
    expect(cycleStart([OLD])).toBeNull()
  })
  it('maps ranges to windows ending now', () => {
    expect(rangeWindow('1m', now, null).from).toEqual(new Date(2026, 7, 25, 12))
    expect(rangeWindow('6m', now, null).from).toEqual(new Date(2026, 2, 25, 12))
    expect(rangeWindow('cycle', now, new Date(2026, 6, 6)).from).toEqual(new Date(2026, 6, 6))
    expect(rangeWindow('cycle', now, null).from).toEqual(new Date(2026, 5, 25, 12))
  })
  it('ends tonight so entries logged after opening the screen still show', () => {
    expect(rangeWindow('3m', now, null).to).toEqual(new Date(2026, 8, 25, 23, 59, 59, 999))
  })
  it('never makes a fresh cycle shorter than two weeks', () => {
    const w = rangeWindow('cycle', now, new Date(2026, 8, 22))
    expect(w.from).toEqual(new Date(2026, 8, 11, 12))
  })
})

describe('changeSince', () => {
  const p = (d: number, v: number) => ({ at: new Date(2026, 6, d, 9), value: v })
  it('compares the first and last week means', () => {
    const pts = [p(6, 4), p(8, 6), p(20, 6), p(28, 7), p(30, 9)]
    const c = changeSince(pts, new Date(2026, 6, 6))!
    expect(c.baseline).toBe(5)
    expect(c.current).toBe(8)
    expect(c.delta).toBe(3)
  })
  it('falls back to first vs last when all readings are close together', () => {
    const c = changeSince([p(6, 5), p(8, 7), p(10, 6)], new Date(2026, 6, 1))!
    expect(c.delta).toBe(1)
  })
  it('ignores readings before the start and needs two of them', () => {
    expect(changeSince([p(1, 1), p(10, 5)], new Date(2026, 6, 5))).toBeNull()
    expect(changeSince([], new Date(2026, 6, 5))).toBeNull()
  })
})

describe('monthlyMeans', () => {
  it('averages each calendar month in the window, empty months as null', () => {
    const pts = [
      { at: new Date(2026, 6, 10), value: 90 },
      { at: new Date(2026, 6, 20), value: 88 },
      { at: new Date(2026, 8, 5), value: 85 },
      { at: new Date(2026, 5, 30), value: 99 }, // before the window
    ]
    const m = monthlyMeans(pts, { from: new Date(2026, 6, 6), to: now })
    expect(m.map((x) => x.month.getMonth())).toEqual([6, 7, 8])
    expect(m.map((x) => x.mean)).toEqual([89, null, 85])
    expect(m.map((x) => x.n)).toEqual([2, 0, 1])
  })
})

describe('protocolLanes', () => {
  const w = { from: new Date(2026, 6, 20), to: now }
  it('clips active protocols to the window, earliest first', () => {
    const lanes = protocolLanes([CJC, RETA, OLD], w)
    expect(lanes.map((l) => l.id)).toEqual(['r', 'c'])
    const reta = lanes[0]!
    expect(reta.segments.map((s) => s.doseMg)).toEqual([2, 4, 6])
    expect(reta.segments[0]!.start).toEqual(w.from)
    expect(reta.segments.at(-1)!.end).toEqual(now)
    expect(reta.maxDoseMg).toBe(6)
    expect(reta.changes.map((c) => c.kind)).toEqual(['up', 'up'])
    const cjc = lanes[1]!
    expect(cjc.segments.map((s) => s.pause)).toEqual([false, true, false])
    expect(cjc.changes.map((c) => c.kind)).toEqual(['start', 'pause', 'resume'])
  })
  it('picks the step covering most of a month', () => {
    const reta = protocolLanes([RETA], w)[0]!
    const aug = dominantSegment(reta, new Date(2026, 7, 1), new Date(2026, 8, 1))
    expect(aug?.doseMg).toBe(4)
    expect(dominantSegment(reta, new Date(2026, 0, 1), new Date(2026, 1, 1))).toBeNull()
  })
})

describe('fractionOf / changeTone', () => {
  it('positions instants inside the window', () => {
    const w = { from: new Date(2026, 0, 1), to: new Date(2026, 0, 11) }
    expect(fractionOf(new Date(2026, 0, 6), w)).toBeCloseTo(0.5)
    expect(fractionOf(new Date(2025, 0, 1), w)).toBe(0)
  })
  it('reads weight loss and energy gains as good, appetite as neutral', () => {
    expect(changeTone('weight', -3.4, 0.3)).toBe('good')
    expect(changeTone('energy', 2.1, 0.5)).toBe('good')
    expect(changeTone('energy', -1, 0.5)).toBe('bad')
    expect(changeTone('energy', 0.2, 0.5)).toBe('neutral')
    expect(changeTone('appetite', -3, 0.5)).toBe('neutral')
  })
})

describe('progressScope / laneMarks', () => {
  it('measures change from the cycle start and exposes the timeline', () => {
    const s = progressScope('cycle', now, [RETA, CJC])
    expect(s.cycle).toEqual(new Date(2026, 6, 6))
    expect(s.since).toEqual(new Date(2026, 6, 6))
    expect(s.lanes).toHaveLength(2)
    const m = laneMarks(s.lanes, (id) => `c:${id}`)
    // Reta 2→4 and 4→6, CJC start + pause + resume. The Reta start sits on the window edge.
    expect(m.guides).toHaveLength(5)
    expect(m.shades).toEqual([
      {
        from: new Date(2026, 7, 31).getTime(),
        to: new Date(2026, 8, 14).getTime(),
        color: 'c:mod-grf-1-29',
      },
    ])
  })
  it('measures from the window start for fixed ranges', () => {
    const s = progressScope('1m', now, [RETA])
    expect(s.since).toEqual(s.window.from)
  })
})

describe('monthDelta / fmtSigned', () => {
  const m = (month: number, mean: number | null) => ({
    month: new Date(2026, month, 1),
    mean,
    n: 1,
  })
  it('compares the first and last months with data', () => {
    expect(monthDelta([m(6, 4), m(7, null), m(8, 6.5)])).toBe(2.5)
    expect(monthDelta([m(6, 4), m(7, null)])).toBeNull()
  })
  it('signs changes with a real minus and leaves zero bare', () => {
    expect(fmtSigned(2.14, 'es', 1)).toBe('+2,1')
    expect(fmtSigned(-3.4, 'es', 1)).toBe('−3,4')
    expect(fmtSigned(-0.01, 'en', 1)).toBe('0')
  })
})
