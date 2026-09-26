import { describe, expect, it } from 'vitest'
import type { DoseRow, ProtocolRow } from '@/data/database.types'
import { buildToday, focusItem, summarise } from './agenda'

const protocol = (over: Partial<ProtocolRow>): ProtocolRow => ({
  id: 'p',
  patient_id: 'u',
  created_by: 'u',
  compound_id: 'mod-grf-1-29',
  name: 'CJC + Ipa',
  route: 'sc',
  unit: 'mcg',
  start_date: '2026-03-02',
  time_of_day: '09:00',
  times: ['22:00'],
  steps: [{ doseMg: 0.1, intervalDays: 1, weekdays: [1, 2, 3, 4, 5], durationWeeks: null }],
  components: [{ compoundId: 'ipamorelin', doseMg: 0.1 }],
  status: 'active',
  template_id: null,
  notes: null,
  created_at: '',
  updated_at: '',
  ...over,
})

const dose = (compound: string, iso: string, protocolId = 'p'): DoseRow => ({
  id: `${compound}-${iso}`,
  patient_id: 'u',
  protocol_id: protocolId,
  compound_id: compound,
  dose_mg: 0.1,
  administered_at: new Date(iso).toISOString(),
  site_id: null,
  inventory_id: null,
  batch_id: 'b',
  notes: null,
  created_at: '',
})

const CJC = protocol({})
const BPC = protocol({
  id: 'bpc',
  compound_id: 'bpc-157',
  name: 'BPC-157',
  times: ['08:00', '20:00'],
  steps: [{ doseMg: 0.25, intervalDays: 1, durationWeeks: null }],
  components: [],
})

describe('buildToday', () => {
  it('merges protocols in time order and lists every compound of a stack', () => {
    const items = buildToday([CJC, BPC], [], new Date('2026-03-03T12:00'))
    expect(items.map((i) => i.at.getHours())).toEqual([8, 20, 22])
    const stack = items.find((i) => i.protocol.id === 'p')!
    expect(stack.doses.map((d) => d.compoundId)).toEqual(['mod-grf-1-29', 'ipamorelin'])
  })

  it('marks a stack as taken from its primary compound row', () => {
    const items = buildToday(
      [CJC],
      [dose('mod-grf-1-29', '2026-03-03T22:05'), dose('ipamorelin', '2026-03-03T22:05')],
      new Date('2026-03-03T23:00'),
    )
    expect(items[0]!.status).toBe('taken')
  })

  it('ignores paused and archived protocols', () => {
    expect(buildToday([protocol({ status: 'paused' })], [], new Date('2026-03-03T12:00'))).toEqual(
      [],
    )
  })
})

describe('focus and summary', () => {
  it('focuses the due item and counts the day', () => {
    const now = new Date('2026-03-03T21:50')
    const items = buildToday([CJC, BPC], [dose('bpc-157', '2026-03-03T08:10', 'bpc')], now)
    // Both the 20:00 BPC and the 22:00 stack are due; the earlier one comes first.
    expect(focusItem(items)!.protocol.id).toBe('bpc')
    expect(summarise(items)).toEqual({ total: 3, taken: 1, pending: 2, missed: 0 })
  })
})

describe('off-schedule doses', () => {
  it('shows a rest-day shot as an extra, but not a late one from the evening before', () => {
    const saturday = new Date('2026-03-07T03:00')
    const late = dose('mod-grf-1-29', '2026-03-07T00:02') // Friday 22:00, after dinner
    expect(buildToday([CJC], [late], saturday)).toEqual([])
    const extra = dose('mod-grf-1-29', '2026-03-07T02:40')
    const items = buildToday([CJC], [late, extra], saturday)
    expect(items).toHaveLength(1)
    expect(items[0]!.extra).toBe(true)
    expect(items[0]!.status).toBe('taken')
    expect(items[0]!.doses.map((d) => d.compoundId)).toEqual(['mod-grf-1-29', 'ipamorelin'])
  })
})
