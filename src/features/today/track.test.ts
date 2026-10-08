import { describe, expect, it } from 'vitest'
import type { DoseRow, ProtocolRow } from '@/data/database.types'
import { labAccount } from '@/features/exposure/testData'
import { buildToday, focusItem } from './agenda'
import { heroRows, itemTime, slotKey, trackItems, trackState, windowItems } from './track'

const protocol = (over: Partial<ProtocolRow>): ProtocolRow => ({
  id: 'p',
  patient_id: 'u',
  created_by: 'u',
  compound_id: 'mod-grf-1-29',
  name: 'CJC + Ipa',
  route: 'sc',
  unit: 'mcg',
  start_date: '2026-03-02',
  time_of_day: '01:00',
  times: ['25:00'],
  steps: [{ doseMg: 0.1, intervalDays: 1, weekdays: [1, 2, 3, 4, 5], durationWeeks: null }],
  components: [{ compoundId: 'ipamorelin', doseMg: 0.1 }],
  status: 'active',
  template_id: null,
  notes: null,
  created_at: '',
  updated_at: '',
  ...over,
})

const MORNING = protocol({
  id: 'm',
  compound_id: 'bpc-157',
  name: 'BPC-157',
  times: ['09:00'],
  steps: [{ doseMg: 0.25, intervalDays: 1, durationWeeks: null }],
  components: [],
})
const NIGHT = protocol({})

const dose = (compound: string, iso: string, protocolId: string): DoseRow => ({
  id: `${compound}-${iso}`,
  patient_id: 'u',
  protocol_id: protocolId,
  compound_id: compound,
  dose_mg: 0.1,
  administered_at: new Date(iso).toISOString(),
  site_id: null,
  inventory_id: null,
  batch_id: null,
  planned_at: null,
  notes: null,
  created_at: '',
})

const hm = (d: Date) =>
  `${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`

describe('windowItems', () => {
  it('covers four hours back and twenty ahead, across midnight, each dose once', () => {
    // Tuesday 22:00: this morning's 09:00 is out of the window, tonight's 01:00 shot and
    // tomorrow's 09:00 are in it.
    const now = new Date('2026-03-03T22:00')
    const items = windowItems([MORNING, NIGHT], [dose('bpc-157', '2026-03-03T09:05', 'm')], now)
    expect(items.map((i) => [i.protocol.id, hm(itemTime(i))])).toEqual([
      ['p', '4 01:00'],
      ['m', '4 09:00'],
    ])
  })

  it('places a taken dose at the time it was taken', () => {
    const now = new Date('2026-03-04T10:00')
    const items = windowItems([MORNING], [dose('bpc-157', '2026-03-04T09:20', 'm')], now)
    expect(items.map((i) => [i.status, hm(itemTime(i))])).toEqual([['taken', '4 09:20']])
  })
})

describe('trackState and trackItems', () => {
  // Wednesday 05:00: last night's shot was taken at 01:10, the 09:00 dose comes next and
  // tonight's 01:00 shot closes the window.
  const now = new Date('2026-03-04T05:00')
  const taken = [dose('mod-grf-1-29', '2026-03-04T01:10', 'p')]
  const items = windowItems([MORNING, NIGHT], taken, now)

  it('draws taken doses solid, the hero one as next and the rest as later', () => {
    const hero = focusItem(buildToday([MORNING, NIGHT], taken, now))!
    expect(hero.protocol.id).toBe('m')
    expect(items.map((i) => trackState(i, hero.key))).toEqual(['done', 'next', 'later'])
  })

  it('paints each marker in its substance colour', () => {
    const [first] = trackItems(items, null)
    expect(first!.color).toMatch(/^var\(--sub-/)
    expect(first!.at).toEqual(new Date('2026-03-04T01:10'))
  })

  it('marks a missed dose as missed, never as next', () => {
    const missed = { ...items[1]!, status: 'missed' as const }
    expect(trackState(missed, null)).toBe('missed')
  })
})

describe('heroRows', () => {
  it("joins today's agenda and the track, without the hero's dose, in time order", () => {
    const lab = labAccount(new Date(2026, 9, 4, 20, 30))
    const now = new Date(2026, 9, 4, 20, 30)
    const today = buildToday(lab.protocols, lab.doses, now)
    const window = windowItems(lab.protocols, lab.doses, now)
    // Sunday evening: nothing planned today; tomorrow 09:00 brings retatrutide and MOTS-c.
    const reta = lab.protocols.find((p) => p.compound_id === 'retatrutide')!
    const heroKey = slotKey(reta.id, new Date(2026, 9, 5, 9, 0))
    expect(window.map((i) => i.protocol.compound_id)).toEqual(['retatrutide', 'mots-c'])
    const rows = heroRows(today, window, heroKey)
    expect(rows.map((i) => [i.protocol.compound_id, hm(i.at)])).toEqual([['mots-c', '5 09:00']])
  })

  it("leaves out last night's shot taken before the track starts", () => {
    // Wednesday 22:00: the shot of Tuesday night was taken at 00:23 today; tonight's is 01:00.
    const now = new Date('2026-03-04T22:00')
    const taken = [dose('mod-grf-1-29', '2026-03-04T00:23', 'p')]
    const today = buildToday([NIGHT], taken, now)
    const window = windowItems([NIGHT], taken, now)
    const rows = heroRows(today, window, null)
    expect(rows.map((i) => [i.status, hm(i.at)])).toEqual([['upcoming', '5 01:00']])
  })
})
