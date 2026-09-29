import { describe, expect, it } from 'vitest'
import type { DoseRow, ProtocolRow } from '@/data/database.types'
import {
  activeByCompound,
  adherenceDays,
  adherenceTotal,
  daySet,
  dayStrip,
  daysSinceLast,
  daysWithRecord,
  presenceMarks,
  protocolHistory,
  streak,
} from './consistency'

const now = new Date(2026, 8, 30, 14) // Wednesday 30 Sep 2026

function protocol(p: Partial<ProtocolRow> & Pick<ProtocolRow, 'id'>): ProtocolRow {
  return {
    patient_id: 'p',
    created_by: null,
    compound_id: 'mots-c',
    name: 'MOTS-c',
    route: 'sc',
    unit: 'mg',
    start_date: '2026-09-01',
    time_of_day: '09:00',
    times: ['09:00'],
    steps: [{ doseMg: 5, intervalDays: 1, durationWeeks: null }],
    components: [],
    status: 'active',
    template_id: null,
    notes: null,
    created_at: '',
    updated_at: '',
    ...p,
  }
}

let seq = 0
function dose(compound: string, at: Date, protocolId: string | null = null): DoseRow {
  seq += 1
  return {
    id: `d${seq}`,
    patient_id: 'p',
    protocol_id: protocolId,
    compound_id: compound,
    dose_mg: 5,
    administered_at: at.toISOString(),
    site_id: null,
    inventory_id: null,
    batch_id: null,
    notes: null,
    created_at: '',
  }
}

const day = (d: number, h = 9, m = 0) => new Date(2026, 8, d, h, m)

describe('days with a record', () => {
  const days = daySet([day(26, 8), day(26, 21), day(28), day(29), day(30, 7)])

  it('collapses records to local days', () => {
    expect(days.size).toBe(4)
  })

  it('counts the streak ending today', () => {
    expect(streak(days, now)).toBe(3)
  })

  it('keeps yesterday’s streak alive while today is not over', () => {
    expect(streak(daySet([day(28), day(29)]), now)).toBe(2)
    expect(streak(daySet([day(26)]), now)).toBe(0)
  })

  it('knows how long ago the last record was', () => {
    expect(daysSinceLast(daySet([day(26)]), now)).toBe(4)
    expect(daysSinceLast(days, now)).toBe(0)
    expect(daysSinceLast(new Set(), now)).toBeNull()
  })

  it('draws the last n days oldest first, today last', () => {
    expect(dayStrip(days, now, 5)).toEqual([true, false, true, true, true])
    expect(daysWithRecord(days, now, 14)).toBe(4)
    expect(presenceMarks([true, false], now)).toEqual([
      { day: new Date(2026, 8, 29), mark: 'full' },
      { day: new Date(2026, 8, 30), mark: 'none' },
    ])
  })
})

describe('activeByCompound', () => {
  it('keeps active protocols once per primary compound, earliest first', () => {
    const rows = activeByCompound([
      protocol({ id: 'b', start_date: '2026-09-10' }),
      protocol({ id: 'a', start_date: '2026-09-01' }),
      protocol({ id: 'c', compound_id: 'retatrutide', status: 'paused' }),
      protocol({ id: 'd', compound_id: 'cjc-1295' }),
    ])
    expect(rows.map((r) => r.id)).toEqual(['a', 'd'])
  })
})

describe('protocolHistory', () => {
  it('counts a blend once, by its primary compound', () => {
    const blend = protocol({
      id: 'blend',
      compound_id: 'cjc-1295',
      components: [{ compoundId: 'ipamorelin', doseMg: 0.1 }],
    })
    const doses = [
      dose('cjc-1295', day(29, 22), 'blend'),
      dose('ipamorelin', day(29, 22), 'blend'),
      dose('cjc-1295', day(28, 22), 'other'),
    ]
    expect(protocolHistory(blend, doses)).toHaveLength(1)
  })
})

describe('adherence across protocols', () => {
  const mots = protocol({
    id: 'mots',
    steps: [{ doseMg: 5, intervalDays: 1, weekdays: [1, 3, 5], durationWeeks: null }],
  })
  const cjc = protocol({
    id: 'cjc',
    compound_id: 'cjc-1295',
    name: 'CJC + Ipa',
    times: ['22:00'],
    steps: [{ doseMg: 0.1, intervalDays: 1, weekdays: [1, 2, 3, 4, 5], durationWeeks: null }],
    components: [{ compoundId: 'ipamorelin', doseMg: 0.1 }],
  })
  // Trailing 7 days (Wed 23 14:00 → Wed 30 14:00): MOTS-c Fri 25, Mon 28, Wed 30;
  // CJC Wed 23, Thu 24, Fri 25, Mon 28, Tue 29 at 22:00 (Wed 30 22:00 is still ahead).
  const doses = [
    dose('mots-c', day(25, 9, 20)),
    dose('mots-c', day(28, 9)),
    dose('mots-c', day(30, 9, 5)),
    dose('cjc-1295', day(24, 22)),
    dose('ipamorelin', day(24, 22)),
    dose('cjc-1295', day(25, 22, 30)),
    dose('cjc-1295', day(29, 22)),
  ]

  it('sums taken and expected over the window', () => {
    const a = adherenceTotal([mots, cjc], doses, now, 7)
    expect(a.expected).toBe(8)
    expect(a.taken).toBe(6)
    expect(a.ratio).toBeCloseTo(6 / 8, 6)
  })

  it('has no ratio when nothing was due', () => {
    expect(adherenceTotal([], doses, now, 7)).toEqual({ taken: 0, expected: 0, ratio: null })
  })

  it('marks each day, attributing a night shot to its evening', () => {
    const days = adherenceDays([mots, cjc], doses, now, 7)
    expect(days.map((d) => d.day.getDate())).toEqual([24, 25, 26, 27, 28, 29, 30])
    expect(days.map((d) => d.mark)).toEqual([
      'full', // Thu: CJC
      'full', // Fri: MOTS-c + CJC
      'none', // Sat
      'none', // Sun
      'partial', // Mon: MOTS-c taken, CJC missed
      'full', // Tue: CJC
      'full', // Wed so far: MOTS-c; tonight's CJC not due yet
    ])
    expect(days[4]).toMatchObject({ taken: 1, expected: 2 })
  })
})
