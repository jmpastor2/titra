import { describe, expect, it } from 'vitest'
import type { MeasureItem } from '@/content/outlook'
import type { ProtocolRow } from '@/data/database.types'
import {
  buildModel,
  measureProgress,
  measureStatus,
  mergeMeasure,
  type ProtocolOutlook,
} from './outlookModel'

const now = new Date(2026, 9, 4, 20, 30) // Sunday 4 Oct 2026

function protocol(p: Partial<ProtocolRow> & Pick<ProtocolRow, 'id' | 'compound_id'>): ProtocolRow {
  return {
    patient_id: 'p',
    created_by: null,
    name: p.compound_id,
    route: 'sc',
    unit: 'mg',
    start_date: '2026-09-07',
    time_of_day: '09:00',
    times: ['09:00'],
    steps: [{ doseMg: 1.5, intervalDays: 7, durationWeeks: null }],
    components: [],
    status: 'active',
    template_id: null,
    notes: null,
    created_at: '',
    updated_at: '',
    ...p,
  }
}

const reta = protocol({ id: 'reta', compound_id: 'retatrutide' })
const mots = protocol({ id: 'mots', compound_id: 'mots-c', start_date: '2026-09-10' })

describe('buildModel', () => {
  it('tells the protocol with a trial behind it from the ones without', () => {
    const model = buildModel([mots, reta], now, 6)
    expect(model.items.map((i) => i.row.id)).toEqual(['reta', 'mots'])
    expect(model.trialItems.map((i) => i.row.id)).toEqual(['reta'])
    expect(model.otherItems.map((i) => i.row.id)).toEqual(['mots'])
  })

  it('starts the cycle with the earliest active protocol, and ignores the ones that are over', () => {
    const over = protocol({
      id: 'old',
      compound_id: 'bpc-157',
      start_date: '2026-01-01',
      status: 'completed',
    })
    const model = buildModel([mots, reta, over], now, 6)
    expect(model.cycle).toEqual(new Date(2026, 8, 7))
    expect(model.items.some((i) => i.row.id === 'old')).toBe(false)
  })

  it('reads the band at the horizon from the dose the protocol will be on', () => {
    const trial = buildModel([reta], now, 6).trialItems[0]?.trial
    expect(trial?.ref.doseMg).toBe(1.5)
    expect(trial?.ref.targetDate).toEqual(new Date(2027, 3, 4, 20, 30))
    expect(trial?.series.length).toBeGreaterThan(1)
  })

  it('has nothing without protocols', () => {
    const model = buildModel([], now, 6)
    expect(model.items).toEqual([])
    expect(model.cycle).toBeNull()
  })
})

const item = (id: string, target: MeasureItem['target']): MeasureItem => ({
  id,
  label: { es: id, en: id },
  target,
})
const weight = item('weight', { type: 'measurement', kind: 'weight' })
const energy = item('energy', { type: 'checkin', kind: 'energy' })
const igf1 = item('igf1', { type: 'lab' })
const note = item('note', { type: 'note' })

describe('mergeMeasure', () => {
  it('lists each thing once, in the order the protocols have them', () => {
    const lists = [[weight, igf1], [weight, energy], [note]].map(
      (measure) => ({ measure }) as unknown as ProtocolOutlook,
    )
    expect(mergeMeasure(lists).map((m) => m.id)).toEqual(['weight', 'igf1', 'energy', 'note'])
  })
})

describe('measureStatus', () => {
  const rows = [
    { kind: 'weight' as const, measured_at: new Date(2026, 8, 8).toISOString() },
    { kind: 'weight' as const, measured_at: new Date(2026, 8, 20).toISOString() },
    { kind: 'weight' as const, measured_at: new Date(2026, 7, 1).toISOString() }, // before the cycle
    { kind: 'energy' as const, measured_at: new Date(2026, 8, 29).toISOString() },
  ]
  const since = new Date(2026, 8, 7)

  it('counts the records of each thing since the cycle began', () => {
    const status = measureStatus(
      [weight, energy, item('hr', { type: 'measurement', kind: 'heart_rate' })],
      rows,
      since,
    )
    expect(status.map((s) => [s.item.id, s.count])).toEqual([
      ['weight', 2],
      ['energy', 1],
      ['hr', 0],
    ])
  })

  it('cannot count labs or notes', () => {
    const status = measureStatus([igf1, note], rows, since)
    expect(status.map((s) => [s.kind, s.count])).toEqual([
      [null, null],
      [null, null],
    ])
  })
})

describe('measureProgress', () => {
  it('counts what has a record out of what the app can count', () => {
    const status = measureStatus(
      [weight, energy, igf1, item('hr', { type: 'measurement', kind: 'heart_rate' })],
      [{ kind: 'weight', measured_at: new Date(2026, 8, 20).toISOString() }],
      new Date(2026, 8, 7),
    )
    expect(measureProgress(status)).toEqual({ done: 1, total: 3 })
  })

  it('is empty with nothing to count', () => {
    expect(measureProgress([])).toEqual({ done: 0, total: 0 })
    expect(measureProgress(measureStatus([igf1], [], new Date()))).toEqual({ done: 0, total: 0 })
  })
})
