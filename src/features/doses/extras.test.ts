import { describe, expect, it } from 'vitest'
import type { DoseRow } from '@/data/database.types'
import { administrationKey } from './administrations'
import { findExtras } from './extras'
import { blendDose, cjcProtocol, doseRow, retaProtocol } from './testData'
import { doseCells } from './week'

const d = (iso: string) => new Date(iso)

/** Every night of the first week and Tue–Fri of the second, taken a few minutes off. */
const NIGHTS = [
  '2026-09-22T01:03',
  '2026-09-23T01:00',
  '2026-09-24T00:58',
  '2026-09-25T01:07',
  '2026-09-26T01:02',
  // Monday night (Tue 29 01:00) forgotten.
  '2026-09-30T01:02',
  '2026-10-01T00:58',
  '2026-10-02T01:05',
  '2026-10-03T01:00',
]

const nights = (skip: string[] = []): DoseRow[] =>
  NIGHTS.filter((at) => !skip.includes(at)).flatMap((at) => blendDose(at))

const now = d('2026-10-04T12:00')
const since = d('2026-09-14T00:00')

describe('findExtras', () => {
  it('finds the Sunday shot as an extra and offers the Monday night it could make up', () => {
    const sunday = blendDose('2026-10-04T08:00')
    const doses = [...nights(), ...sunday]
    const cells = doseCells([cjcProtocol], doses, since, now)
    const extras = findExtras(cells, doses, now)

    expect([...extras.values()].map((e) => e.at)).toEqual([d('2026-10-04T08:00')])
    const extra = extras.get(administrationKey(sunday[0]!))
    expect(extra?.protocol.id).toBe('cjc')
    expect(extra?.missed.map((m) => m.at)).toEqual([d('2026-09-29T01:00')])
    expect(extra?.suggested?.at).toEqual(d('2026-09-29T01:00'))
  })

  it('stops calling it an extra once it is assigned, and counts it late', () => {
    const sunday = blendDose('2026-10-04T08:00', {
      planned_at: d('2026-09-29T01:00').toISOString(),
    })
    const doses = [...nights(), ...sunday]
    const cells = doseCells([cjcProtocol], doses, since, now)

    expect(findExtras(cells, doses, now).size).toBe(0)
    const cell = cells.get(administrationKey(sunday[0]!))
    expect(cell?.status).toBe('late')
    // Monday's 01:00 to Sunday's 08:00 is five days and seven hours.
    expect(cell?.deltaMin).toBe(5 * 24 * 60 + 7 * 60)
    expect(cell?.plannedAt).toEqual(d('2026-09-29T01:00'))
  })

  it('suggests the most recent missed administration first', () => {
    // Friday's night (Sat 03 01:00) was missed too.
    const doses = [...nights(['2026-10-03T01:00']), ...blendDose('2026-10-04T08:00')]
    const extras = [...findExtras(doseCells([cjcProtocol], doses, since, now), doses, now).values()]

    expect(extras).toHaveLength(1)
    expect(extras[0]?.missed.map((m) => m.at)).toEqual([
      d('2026-10-03T01:00'),
      d('2026-09-29T01:00'),
    ])
    expect(extras[0]?.suggested?.at).toEqual(d('2026-10-03T01:00'))
  })

  it('also finds a free dose, logged with no protocol', () => {
    const free = doseRow('2026-10-04T08:00', { protocol_id: null })
    const doses = [...nights(), free]
    const extras = findExtras(doseCells([cjcProtocol], doses, since, now), doses, now)
    expect(extras.get(free.id)?.suggested?.at).toEqual(d('2026-09-29T01:00'))
  })

  it('suggests the closest missed administration after a dose taken ahead of time', () => {
    // Taken Monday midday, thirteen hours before Monday night's slot, which nobody covered.
    const early = blendDose('2026-09-28T12:00')
    const doses = [...nights(), ...early]
    const extras = findExtras(doseCells([cjcProtocol], doses, since, now), doses, now)
    expect(extras.get(administrationKey(early[0]!))?.suggested?.at).toEqual(d('2026-09-29T01:00'))
  })

  it('has nothing to say when every dose covers its administration', () => {
    const doses = nights()
    expect(findExtras(doseCells([cjcProtocol], doses, since, now), doses, now).size).toBe(0)
  })

  it('judges each protocol on its own compound', () => {
    // A retatrutide shot a day and an hour before its slot is the retatrutide protocol's extra.
    const reta = doseRow('2026-10-04T08:00', { protocol_id: 'reta', compound_id: 'retatrutide' })
    const doses = [...nights(), reta]
    const cells = doseCells([cjcProtocol, retaProtocol], doses, since, now)
    expect([...findExtras(cells, doses, now).values()].map((e) => e.protocol.id)).toEqual(['reta'])
  })
})
