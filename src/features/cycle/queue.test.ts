import { describe, expect, it } from 'vitest'
import type { ProtocolRow } from '@/data/database.types'
import { cycleInfo } from '@/domain/dosing/cycle'
import { toProtocolLike } from '@/data/mappers'
import { cycleDecision, decisionKey } from './decision'
import { openDecision, pendingDecisions, type Item } from './queue'

const W15 = [1, 2, 3, 4, 5]
const dosing = (doseMg: number, durationWeeks: number | null) => ({
  doseMg,
  intervalDays: 1,
  weekdays: W15,
  durationWeeks,
})
const protocol = (id: string, steps: unknown[], start = '2026-09-21'): ProtocolRow => ({
  id,
  patient_id: 'u',
  created_by: 'u',
  compound_id: 'mod-grf-1-29',
  name: id,
  route: 'sc',
  unit: 'mcg',
  start_date: start,
  time_of_day: '01:00',
  times: ['25:00'],
  steps: steps as ProtocolRow['steps'],
  components: [],
  status: 'active',
  template_id: null,
  notes: null,
  created_at: '',
  updated_at: '',
})
const NOW = new Date('2026-10-04T10:00')
const item = (p: ProtocolRow): Item => {
  const info = cycleInfo(toProtocolLike(p), NOW)!
  return { protocol: p, info, drift: null, decision: cycleDecision(info, NOW) }
}

// Two step up tomorrow; one has nothing to ask; one is in a rest that ends in three days.
const reta = protocol('reta', [dosing(1, 2), dosing(1.5, 1), dosing(2, null)], '2026-09-21')
const cjc = protocol('cjc', [dosing(0.1, 1), dosing(0.15, 1), dosing(0.2, 10)])
const quiet = protocol('quiet', [dosing(0.1, 20)])
const resuming = protocol(
  'resuming',
  [dosing(0.1, 1), { doseMg: 0, intervalDays: 1, pause: true, durationWeeks: 1 }, dosing(0.1, 5)],
  '2026-09-23',
)

describe('pendingDecisions', () => {
  it('lists what asks for an answer, before what only informs', () => {
    const items = [item(resuming), item(quiet), item(cjc), item(reta)]
    const pending = pendingDecisions(items, null)
    expect(pending.map((p) => [p.item.protocol.id, p.decision.kind])).toEqual([
      ['cjc', 'increase'],
      ['reta', 'increase'],
      ['resuming', 'resume'],
    ])
    expect(pending[0]!.key).toBe(decisionKey('cjc', pending[0]!.decision))
  })

  it('puts the one a notification pointed at first', () => {
    const pending = pendingDecisions([item(cjc), item(reta), item(resuming)], 'resuming')
    expect(pending.map((p) => p.item.protocol.id)).toEqual(['resuming', 'cjc', 'reta'])
  })
})

describe('openDecision', () => {
  const pending = pendingDecisions([item(cjc), item(reta)], null)
  const [first, second] = pending.map((p) => p.key) as [string, string]
  const none = () => false

  it('opens the most urgent by default', () => {
    expect(openDecision(pending, { focusId: null, chosenKey: null, isLater: none })).toBe(first)
  })

  it('opens the one the person chose', () => {
    expect(openDecision(pending, { focusId: null, chosenKey: second, isLater: none })).toBe(second)
  })

  it('skips what was put off, and falls back when the chosen one is gone', () => {
    expect(
      openDecision(pending, { focusId: null, chosenKey: null, isLater: (k) => k === first }),
    ).toBe(second)
    expect(openDecision(pending, { focusId: null, chosenKey: 'gone', isLater: none })).toBe(first)
    expect(openDecision([], { focusId: null, chosenKey: null, isLater: none })).toBeUndefined()
  })

  it('opens the one a notification pointed at even when it was put off', () => {
    expect(openDecision(pending, { focusId: 'reta', chosenKey: null, isLater: () => true })).toBe(
      second,
    )
  })
})
