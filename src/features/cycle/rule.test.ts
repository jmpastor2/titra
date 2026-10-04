import { describe, expect, it } from 'vitest'
import type { SymptomKind, SymptomRow } from '@/data/database.types'
import { ruleHits } from './rule'

const symptom = (kind: SymptomKind, iso: string): SymptomRow => ({
  id: `${kind}-${iso}`,
  patient_id: 'u',
  occurred_at: new Date(iso).toISOString(),
  kind,
  severity: 4,
  notes: null,
  created_at: '',
})
const NOW = new Date('2026-10-04T20:30')

describe('ruleHits', () => {
  it('counts the nausea and vomiting logged in the last seven days', () => {
    const rows = [
      symptom('nausea', '2026-09-29T09:00'),
      symptom('nausea', '2026-10-02T21:00'),
      symptom('vomiting', '2026-10-03T08:00'),
      symptom('headache', '2026-10-03T08:00'),
    ]
    expect(ruleHits(rows, NOW)).toEqual([
      { kind: 'nausea', count: 2 },
      { kind: 'vomiting', count: 1 },
    ])
  })

  it('leaves out what is older than a week and what is not the rule', () => {
    const rows = [symptom('nausea', '2026-09-26T09:00'), symptom('fatigue', '2026-10-03T09:00')]
    expect(ruleHits(rows, NOW)).toEqual([])
    expect(ruleHits([], NOW)).toEqual([])
  })
})
