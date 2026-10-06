import { describe, expect, it } from 'vitest'
import type { DoseRow, ProtocolRow } from '@/data/database.types'
import { barHeights, cumulativeDoses } from './cumulative'

const now = new Date(2026, 9, 7, 14) // Wednesday 7 Oct 2026

function protocol(p: Partial<ProtocolRow> & Pick<ProtocolRow, 'id' | 'compound_id'>): ProtocolRow {
  return {
    patient_id: 'p',
    created_by: null,
    name: p.compound_id,
    route: 'sc',
    unit: 'mg',
    start_date: '2026-09-01',
    time_of_day: '09:00',
    times: ['09:00'],
    steps: [{ doseMg: 1, intervalDays: 7, durationWeeks: null }],
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
function dose(compound: string, at: Date, mg: number): DoseRow {
  seq += 1
  return {
    id: `d${seq}`,
    patient_id: 'p',
    protocol_id: null,
    compound_id: compound,
    dose_mg: mg,
    administered_at: at.toISOString(),
    site_id: null,
    inventory_id: null,
    batch_id: null,
    planned_at: null,
    notes: null,
    created_at: '',
  }
}

const reta = protocol({ id: 'reta', compound_id: 'retatrutide', start_date: '2026-09-07' })
const blend = protocol({
  id: 'blend',
  compound_id: 'cjc-1295',
  unit: 'mcg',
  start_date: '2026-09-21',
  components: [{ compoundId: 'ipamorelin', doseMg: 0.1 }],
})

describe('cumulativeDoses', () => {
  it('adds up what was taken and counts the administrations', () => {
    const out = cumulativeDoses(
      [
        dose('retatrutide', new Date(2026, 8, 7, 9), 1),
        dose('retatrutide', new Date(2026, 8, 14, 9), 1),
        dose('retatrutide', new Date(2026, 8, 21, 9), 1.25),
        dose('retatrutide', new Date(2026, 8, 28, 9), 1.5),
        dose('retatrutide', new Date(2026, 9, 5, 9), 1.5),
      ],
      [reta],
      now,
    )
    expect(out).toHaveLength(1)
    expect(out[0]).toMatchObject({ compoundId: 'retatrutide', unit: 'mg', count: 5 })
    expect(out[0]?.totalMg).toBeCloseTo(6.25, 9)
    expect(out[0]?.since).toEqual(new Date(2026, 8, 7, 9))
  })

  it('puts each dose in its week, the current one last, Monday to Sunday', () => {
    const [r] = cumulativeDoses(
      [
        dose('retatrutide', new Date(2026, 9, 5, 9), 1.5), // Monday of this week
        dose('retatrutide', new Date(2026, 9, 4, 22), 1), // Sunday of last week
        dose('retatrutide', new Date(2026, 9, 7, 8), 0.5), // Wednesday of this week
      ],
      [reta],
      now,
    )
    expect(r?.weekly).toHaveLength(12)
    expect(r?.weekly.slice(0, 10).every((mg) => mg === 0)).toBe(true)
    expect(r?.weekly[10]).toBe(1)
    expect(r?.weekly[11]).toBeCloseTo(2, 9)
  })

  it('totals everything it has, also what is older than the weeks drawn', () => {
    const [r] = cumulativeDoses(
      [
        dose('retatrutide', new Date(2026, 5, 1, 9), 2),
        dose('retatrutide', new Date(2026, 9, 5), 1),
      ],
      [reta],
      now,
    )
    expect(r?.totalMg).toBe(3)
    expect(r?.count).toBe(2)
    expect(r?.since).toEqual(new Date(2026, 5, 1, 9))
    expect(r?.weekly.reduce((s, mg) => s + mg, 0)).toBe(1)
  })

  it('leaves out compounds with nothing in the weeks drawn, and doses that have not happened', () => {
    const out = cumulativeDoses(
      [
        dose('mots-c', new Date(2026, 5, 1, 9), 5),
        dose('retatrutide', new Date(2026, 9, 9, 9), 1), // Friday, still ahead
      ],
      [reta],
      now,
    )
    expect(out).toEqual([])
  })

  it('lists a blend by its compounds, in the unit of the protocol, protocols in the order they began', () => {
    const doses = [
      dose('ipamorelin', new Date(2026, 9, 6, 1), 0.1),
      dose('cjc-1295', new Date(2026, 9, 6, 1), 0.1),
      dose('retatrutide', new Date(2026, 9, 5, 9), 1.5),
    ]
    const out = cumulativeDoses(doses, [blend, reta], now)
    expect(out.map((c) => [c.compoundId, c.unit])).toEqual([
      ['retatrutide', 'mg'],
      ['cjc-1295', 'mcg'],
      ['ipamorelin', 'mcg'],
    ])
  })

  it('puts compounds of protocols that are over after the active ones, latest dose first', () => {
    const out = cumulativeDoses(
      [
        dose('mots-c', new Date(2026, 9, 1, 9), 5),
        dose('bpc-157', new Date(2026, 9, 3, 9), 0.25),
        dose('retatrutide', new Date(2026, 9, 5, 9), 1.5),
      ],
      [reta, protocol({ id: 'old', compound_id: 'mots-c', status: 'completed' })],
      now,
    )
    expect(out.map((c) => c.compoundId)).toEqual(['retatrutide', 'bpc-157', 'mots-c'])
    expect(out.find((c) => c.compoundId === 'bpc-157')?.unit).toBe('mg')
  })

  it('skips rows that are not a real dose', () => {
    const bad = dose('retatrutide', new Date(2026, 9, 5, 9), Number.NaN)
    expect(cumulativeDoses([bad], [reta], now)).toEqual([])
  })
})

describe('barHeights', () => {
  it('scales the weeks to the largest', () => {
    expect(barHeights([0, 1, 2, 4])).toEqual([0, 0.25, 0.5, 1])
  })

  it('is flat with nothing taken', () => {
    expect(barHeights([0, 0])).toEqual([0, 0])
    expect(barHeights([])).toEqual([])
  })
})
