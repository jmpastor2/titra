import { describe, expect, it } from 'vitest'
import type { InventoryRow } from '@/data/database.types'
import { nextDose } from '@/domain/dosing/schedule'
import type { ProtocolLike } from '@/domain/types'
import {
  doseDays,
  hasMeaningfulCurve,
  levelKind,
  nextLine,
  sparkline,
  upcomingDoses,
  vialIsLow,
} from './levelSummary'

describe('hasMeaningfulCurve', () => {
  it('is true for long-acting compounds only', () => {
    expect(hasMeaningfulCurve({ halfLifeH: 144, tmaxH: 36 })).toBe(true)
    expect(hasMeaningfulCurve({ halfLifeH: 2 })).toBe(false)
    expect(hasMeaningfulCurve(undefined)).toBe(false)
  })
})

describe('levelKind', () => {
  it('draws a curve for long-acting injectables and a timeline for everything else', () => {
    expect(levelKind({ pk: { halfLifeH: 144, tmaxH: 36 }, nowMg: 0.9 })).toBe('curve')
    // Ipamorelin: modelled, but a 2 h pulse is not a level.
    expect(levelKind({ pk: { halfLifeH: 2 }, nowMg: 0 })).toBe('timeline')
    // MOTS-c and CJC-1295 (no DAC): no human pharmacokinetics at all.
    expect(levelKind({ pk: undefined, nowMg: null })).toBe('timeline')
    // Long half-life but a route the model does not cover (no amount on board).
    expect(levelKind({ pk: { halfLifeH: 220 }, nowMg: null })).toBe('timeline')
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
  it('draws a flat baseline trace when nothing is on board yet', () => {
    const s = sparkline(
      [
        { at: from, mg: 0 },
        { at: now, mg: 0 },
      ],
      [],
      [],
      from,
      to,
      box,
    )
    expect(s.now!.y).toBe(s.baselineY)
    expect(s.projection).toBe('')
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
  it('marks taken, extra, missed, planned-today and rest days', () => {
    const history = [
      { at: new Date(2026, 8, 21, 7), mg: 5 }, // Mon, on time
      { at: new Date(2026, 8, 20, 12), mg: 5 }, // Sun: logged, but nothing was planned
    ]
    const cells = doseDays(history, MOTS, now, 7)
    expect(cells).toHaveLength(7)
    // Sat 19 … Fri 25
    expect(cells.map((c) => c.state)).toEqual([
      'rest',
      'extra',
      'taken',
      'rest',
      'missed',
      'rest',
      'planned',
    ])
    expect(cells.at(-1)!.isToday).toBe(true)
  })
  it('flags a shot taken off the hour as late and a covered make-up as the day it was for', () => {
    const history = [
      { at: new Date(2026, 8, 21, 10), mg: 5 }, // Mon, three hours after 07:00: late
      { at: new Date(2026, 8, 24, 9), mg: 5, plannedAt: new Date(2026, 8, 23, 7) }, // covers Wed
    ]
    const cells = doseDays(history, MOTS, now, 7)
    expect(cells.map((c) => c.state)).toEqual([
      'rest',
      'rest',
      'late',
      'rest',
      'late', // Wed was covered a day late, so it is not missed
      'rest', // and Thu holds no administration of its own
      'planned',
    ])
  })
  it('without a protocol only logged days stand out', () => {
    const cells = doseDays([{ at: new Date(2026, 8, 24, 20), mg: 1 }], null, now, 3)
    expect(cells.map((c) => c.state)).toEqual(['rest', 'taken', 'rest'])
  })
  it('puts the after-midnight night shot on its own evening', () => {
    const NIGHT: ProtocolLike = {
      compoundId: 'mod-grf-1-29',
      startDate: '2026-09-14',
      times: ['25:00'],
      steps: [{ doseMg: 0.1, intervalDays: 1, weekdays: [1, 2, 3, 4, 5], durationWeeks: null }],
    }
    // Friday 25 Sep 00:10: Thursday's shot (planned 01:00 Friday) is still ahead.
    const small = new Date(2026, 8, 25, 0, 10)
    const history = [{ at: new Date(2026, 8, 24, 1, 2), mg: 0.1 }] // Wednesday night's shot
    const cells = doseDays(history, NIGHT, small, 3)
    // Wed 23 (taken at 01:02 on Thu), Thu 24 (planned 01:00 on Fri), Fri 25 (planned Sat 01:00)
    expect(cells.map((c) => c.state)).toEqual(['taken', 'planned', 'planned'])
  })
})

describe('nextLine', () => {
  const now = new Date(2026, 8, 25, 12)
  const base = { stepIndex: 0, doseMg: 1 }
  it('says when the next administration is, due or overdue', () => {
    expect(nextLine(null, now)).toBeNull()
    expect(
      nextLine({ ...base, at: new Date(2026, 8, 25, 21), overdueH: -9, status: 'upcoming' }, now),
    ).toEqual({ kind: 'in', hours: 9 })
    expect(
      nextLine({ ...base, at: new Date(2026, 8, 25, 12), overdueH: 0, status: 'due' }, now),
    ).toEqual({ kind: 'due' })
    expect(
      nextLine({ ...base, at: new Date(2026, 8, 24, 9), overdueH: 27, status: 'overdue' }, now),
    ).toEqual({ kind: 'overdue', hours: 27 })
  })
})

const vial = (over: Partial<InventoryRow> = {}): InventoryRow => ({
  id: 'v1',
  patient_id: 'p',
  compound_id: 'retatrutide',
  form: 'vial',
  label: 'Retatrutida 15 mg',
  total_mg: 15,
  remaining_mg: 15,
  concentration_mg_per_ml: 10,
  diluent_ml: 1.5,
  components: [],
  opened_at: null,
  expires_at: null,
  lot: null,
  storage_notes: null,
  archived: false,
  created_at: '',
  updated_at: '',
  ...over,
})

describe('upcomingDoses', () => {
  const WEEKLY: ProtocolLike = {
    compoundId: 'retatrutide',
    startDate: '2026-09-14',
    times: ['09:00'],
    steps: [
      { doseMg: 1, intervalDays: 1, weekdays: [1], durationWeeks: 2 },
      { doseMg: 1.5, intervalDays: 1, weekdays: [1], durationWeeks: null },
    ],
  }
  it('starts with the one coming up, even when it is due now, and follows the titration', () => {
    const now = new Date(2026, 9, 5, 9, 30) // Monday, half an hour after the shot was due
    const next = nextDose(WEEKLY, [], now)
    const up = upcomingDoses({ protocolLike: WEEKLY, history: [], next }, now, 3)
    expect(up.map((u) => [u.at.getDate(), u.doseMg])).toEqual([
      [5, 1.5],
      [12, 1.5],
      [19, 1.5],
    ])
  })
  it('is empty without a protocol', () => {
    expect(upcomingDoses({ protocolLike: null, history: [], next: null }, new Date(), 3)).toEqual(
      [],
    )
  })
})

describe('vialIsLow', () => {
  const now = new Date(2026, 9, 5, 12)
  const upcoming = [
    { at: new Date(2026, 9, 12), doseMg: 2 },
    { at: new Date(2026, 9, 19), doseMg: 2 },
    { at: new Date(2026, 9, 26), doseMg: 2 },
  ]
  it('is not low while the vial covers more than two administrations', () => {
    expect(vialIsLow(vial({ remaining_mg: 15 }), 'retatrutide', upcoming, now)).toBe(false)
    expect(vialIsLow(vial({ remaining_mg: 6 }), 'retatrutide', upcoming, now)).toBe(false)
  })
  it('is low when it covers two or fewer of the next administrations', () => {
    expect(vialIsLow(vial({ remaining_mg: 4 }), 'retatrutide', upcoming, now)).toBe(true)
    expect(vialIsLow(vial({ remaining_mg: 1 }), 'retatrutide', upcoming, now)).toBe(true)
  })
  it('is low when it expires within a week before it is used up', () => {
    const soon = vial({ remaining_mg: 15, expires_at: '2026-10-09' })
    expect(vialIsLow(soon, 'retatrutide', upcoming, now)).toBe(true)
    const later = vial({ remaining_mg: 15, expires_at: '2026-11-20' })
    expect(vialIsLow(later, 'retatrutide', upcoming, now)).toBe(false)
  })
  it('falls back to how full it is when there is no plan to walk', () => {
    expect(vialIsLow(vial({ remaining_mg: 2 }), 'retatrutide', [], now)).toBe(true)
    expect(vialIsLow(vial({ remaining_mg: 9 }), 'retatrutide', [], now)).toBe(false)
  })
  it('reads a blend partner by its share of the vial', () => {
    // 5 mg of each in the vial: the partner goes down at the same rate as the primary.
    const blend = vial({
      compound_id: 'mod-grf-1-29',
      total_mg: 5,
      remaining_mg: 0.15,
      components: [{ compoundId: 'ipamorelin', mg: 5 }],
    })
    const doses = [
      { at: new Date(2026, 9, 6), doseMg: 0.1 },
      { at: new Date(2026, 9, 7), doseMg: 0.1 },
      { at: new Date(2026, 9, 8), doseMg: 0.1 },
      { at: new Date(2026, 9, 9), doseMg: 0.1 },
    ]
    expect(vialIsLow(blend, 'ipamorelin', doses, now)).toBe(true)
    expect(vialIsLow({ ...blend, remaining_mg: 4 }, 'ipamorelin', doses, now)).toBe(false)
  })
})
