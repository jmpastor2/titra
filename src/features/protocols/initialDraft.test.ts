import { describe, expect, it } from 'vitest'
import type { ProtocolRow, SavedProtocolRow } from '@/data/database.types'
import type { ScheduleStep } from '@/domain/types'
import type { ConcOf } from './draft'
import { initialDraft, type DraftContext } from './initialDraft'

const W15 = [1, 2, 3, 4, 5]
const STEPS: ScheduleStep[] = [
  { doseMg: 0.1, intervalDays: 1, weekdays: W15, durationWeeks: 1 },
  { doseMg: 0.15, intervalDays: 1, weekdays: W15, durationWeeks: 1 },
  { doseMg: 0.2, intervalDays: 1, weekdays: W15, durationWeeks: 10 },
  { doseMg: 0, intervalDays: 1, pause: true, durationWeeks: 4 },
]
const concOf: ConcOf = (id) => (id === 'mod-grf-1-29' || id === 'ipamorelin' ? 5 / 3 : null)

const cjc: ProtocolRow = {
  id: 'cjc',
  patient_id: 'u',
  created_by: 'u',
  compound_id: 'mod-grf-1-29',
  name: 'CJC-1295 + Ipamorelina',
  route: 'sc',
  unit: 'mcg',
  start_date: '2026-09-21',
  time_of_day: '01:00',
  times: ['25:00'],
  steps: STEPS as unknown as ProtocolRow['steps'],
  components: [{ compoundId: 'ipamorelin', doseMg: 0.1 }],
  status: 'active',
  template_id: null,
  notes: 'En ayunas.',
  created_at: '',
  updated_at: '',
}

const ctx: DraftContext = {
  concOf,
  pick: (l) => l.es,
  now: new Date('2026-10-19T10:00'),
  copySuffix: 'copia',
}

describe('initialDraft', () => {
  it('opens an existing protocol with where it stands today', () => {
    const { draft, origin } = initialDraft({ kind: 'existing', row: cjc }, ctx)
    expect(draft).toMatchObject({
      name: 'CJC-1295 + Ipamorelina',
      startDate: '2026-09-21',
      notes: 'En ayunas.',
      doseEntry: 'units',
      nightShift: true,
      times: ['01:00'],
    })
    expect(draft.steps.map((s) => s.dose)).toEqual(['6', '9', '12', ''])
    expect(origin?.currentKey).toBe(draft.steps[2]?.key)
    expect(origin?.weeksBehind).toBe(2)
    expect([...(origin?.pastKeys ?? [])]).toEqual([draft.steps[0]?.key, draft.steps[1]?.key])
  })

  it('opens a copy as a new protocol that starts today', () => {
    const { draft, origin } = initialDraft({ kind: 'copy', row: cjc }, ctx)
    expect(draft.name).toBe('CJC-1295 + Ipamorelina (copia)')
    expect(draft.startDate).toBe('2026-10-19')
    expect(draft.steps).toHaveLength(4)
    expect(origin).toBeNull()
  })

  it('opens a saved protocol and remembers where it came from', () => {
    const row: SavedProtocolRow = {
      id: 's1',
      owner_id: 'u',
      name: 'Mi CJC',
      compound_id: 'mod-grf-1-29',
      unit: 'mcg',
      components: [],
      steps: STEPS as unknown as SavedProtocolRow['steps'],
      times: ['22:00'],
      notes: null,
      created_at: '',
      updated_at: '',
    }
    const { draft, origin } = initialDraft({ kind: 'saved', row }, ctx)
    expect(draft).toMatchObject({
      templateRef: 'saved:s1',
      name: 'Mi CJC',
      times: ['22:00'],
      notes: '',
    })
    expect(origin).toBeNull()
  })

  it('opens a label template, or a blank page for an unknown one', () => {
    const { draft } = initialDraft({ kind: 'template', id: 'semaglutide-wegovy' }, ctx)
    expect(draft.templateRef).toBe('label:semaglutide-wegovy')
    expect(draft.compoundId).toBe('semaglutide')
    expect(draft.steps).toHaveLength(5)
    expect(initialDraft({ kind: 'template', id: 'nope' }, ctx).draft.compoundId).toBe('')
  })

  it('starts blank with the substance asked for, in units when its vial is known', () => {
    const known = initialDraft({ kind: 'blank', compoundId: 'mod-grf-1-29' }, ctx).draft
    expect(known).toMatchObject({ compoundId: 'mod-grf-1-29', doseEntry: 'units' })
    const noVial = initialDraft({ kind: 'blank', compoundId: 'retatrutide' }, ctx).draft
    expect(noVial.doseEntry).toBe('mg')
    expect(initialDraft({ kind: 'blank', compoundId: null }, ctx).draft.compoundId).toBe('')
  })
})
