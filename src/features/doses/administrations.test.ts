import { describe, expect, it } from 'vitest'
import type { Fit } from './delta'
import {
  administrationKey,
  comboKey,
  drawnUnits,
  groupAdministrations,
  groupByDay,
  protocolOf,
  siteHistory,
  substanceLine,
  summariseDay,
  vialRefunds,
} from './administrations'
import { blendDose, blendVial, cjcProtocol, doseRow, retaProtocol, retaVial } from './testData'

describe('groupAdministrations', () => {
  it('turns the rows of a blend into one administration, the vial owner first', () => {
    const [owner, partner] = blendDose('2026-10-03T01:03')
    const single = doseRow('2026-10-02T01:00', { compound_id: 'retatrutide' })
    // Partner row listed first, as a query may return it.
    const admins = groupAdministrations([partner!, single, owner!])

    expect(admins.map((a) => a.rows.length)).toEqual([2, 1])
    expect(admins[0]!.key).toBe(owner!.batch_id)
    expect(admins[0]!.rows.map((r) => r.compound_id)).toEqual(['mod-grf-1-29', 'ipamorelin'])
    expect(admins[1]!.key).toBe(single.id)
  })

  it('orders them most recent first', () => {
    const a = doseRow('2026-10-01T01:00')
    const b = doseRow('2026-10-03T01:00')
    expect(groupAdministrations([a, b]).map((x) => x.key)).toEqual([b.id, a.id])
  })

  it('names the combination, for the filter chips', () => {
    const [admin] = groupAdministrations(blendDose('2026-10-03T01:03'))
    expect(comboKey(admin!)).toBe('mod-grf-1-29+ipamorelin')
    expect(administrationKey(doseRow('2026-10-03T01:03'))).toMatch(/^dose-/)
  })
})

describe('substanceLine', () => {
  it('names a blend in one line, without the qualifier in brackets', () => {
    const [admin] = groupAdministrations(blendDose('2026-10-03T01:03'))
    expect(substanceLine(admin!)).toBe('CJC-1295 + Ipamorelina')
    expect(
      substanceLine({ rows: [doseRow('2026-10-03T09:00', { compound_id: 'retatrutide' })] }),
    ).toBe('Retatrutida')
  })
})

describe('groupByDay', () => {
  it('groups by calendar day and keeps the order', () => {
    const admins = groupAdministrations([
      doseRow('2026-10-03T22:00'),
      doseRow('2026-10-03T09:00'),
      doseRow('2026-10-02T09:00'),
    ])
    const days = groupByDay(admins)
    expect(days.map((g) => g.items.length)).toEqual([2, 1])
    expect(days[0]!.day).toEqual(new Date('2026-10-03T00:00'))
  })
})

describe('summariseDay', () => {
  it('counts the administrations, the late ones and the extras', () => {
    const rows = [
      doseRow('2026-10-03T09:00'),
      doseRow('2026-10-03T10:00'),
      doseRow('2026-10-03T11:00'),
      doseRow('2026-10-03T12:00'),
    ]
    const admins = groupAdministrations(rows)
    const fits = new Map<string, Fit>([
      [rows[0]!.id, { kind: 'onTime', deltaMin: 4 }],
      [rows[1]!.id, { kind: 'late', deltaMin: 120 }],
      [rows[2]!.id, { kind: 'makeUp', deltaMin: 7620 }],
      [rows[3]!.id, { kind: 'extra', deltaMin: null }],
    ])
    expect(summariseDay(admins, fits)).toEqual({ count: 4, late: 2, extras: 1 })
  })
})

describe('drawnUnits', () => {
  const vials = new Map([blendVial, retaVial].map((v) => [v.id, v]))

  it('counts a blend as one draw', () => {
    // 100 mcg of a 5 + 5 mg / 3 mL blend: 6 U for both compounds.
    expect(drawnUnits(blendDose('2026-10-03T01:03'), vials)).toEqual([6])
  })

  it('lists the draws of a stack, one per vial', () => {
    const stack = [
      doseRow('2026-10-03T09:00', {
        compound_id: 'retatrutide',
        dose_mg: 2,
        inventory_id: retaVial.id,
      }),
      doseRow('2026-10-03T09:00', {
        compound_id: 'mod-grf-1-29',
        dose_mg: 0.1,
        inventory_id: blendVial.id,
      }),
    ]
    expect(drawnUnits(stack, vials)).toEqual([20, 6])
  })

  it('is unknown without a reconstituted vial', () => {
    expect(drawnUnits([doseRow('2026-10-03T09:00')], vials)).toBeNull()
    expect(drawnUnits([doseRow('2026-10-03T09:00', { inventory_id: 'gone' })], vials)).toBeNull()
  })
})

describe('protocolOf', () => {
  const protocols = [retaProtocol, cjcProtocol]

  it('takes the protocol a dose is linked to', () => {
    expect(protocolOf([doseRow('2026-10-03T01:00', { protocol_id: 'reta' })], protocols)?.id).toBe(
      'reta',
    )
  })

  it('gives a free dose to the protocol whose primary compound it carries', () => {
    expect(protocolOf(blendDose('2026-10-03T01:00', { protocol_id: null }), protocols)?.id).toBe(
      'cjc',
    )
  })

  it('has no protocol for a compound nobody administers, or an archived plan', () => {
    const lone = doseRow('2026-10-03T01:00', { protocol_id: null, compound_id: 'bpc-157' })
    expect(protocolOf([lone], protocols)).toBeUndefined()
    const free = doseRow('2026-10-03T01:00', { protocol_id: null })
    expect(protocolOf([free], [{ ...cjcProtocol, status: 'archived' }])).toBeUndefined()
  })
})

describe('siteHistory', () => {
  it('lists every use of a site, leaving out the rows being edited', () => {
    const a = doseRow('2026-10-03T01:00', { site_id: 'abd_ul' })
    const b = doseRow('2026-10-02T01:00', { site_id: 'thigh_l' })
    const none = doseRow('2026-10-01T01:00')
    expect(siteHistory([a, b, none]).map((u) => u.siteId)).toEqual(['abd_ul', 'thigh_l'])
    expect(siteHistory([a, b, none], [a.id]).map((u) => u.siteId)).toEqual(['thigh_l'])
  })
})

describe('vialRefunds', () => {
  const vials = new Map([blendVial, retaVial].map((v) => [v.id, v]))

  it('gives a blend vial back what the carrier row drew, once', () => {
    const refunds = vialRefunds(blendDose('2026-10-03T01:03'), vials)
    expect(refunds).toHaveLength(1)
    expect(refunds[0]?.vial.id).toBe(blendVial.id)
    expect(refunds[0]?.mg).toBeCloseTo(0.1, 9)
  })

  it('gives each vial of a stack its own share and ignores rows with no vial', () => {
    const rows = [
      doseRow('2026-10-03T09:00', {
        compound_id: 'retatrutide',
        dose_mg: 2,
        inventory_id: retaVial.id,
      }),
      doseRow('2026-10-03T09:00', {
        compound_id: 'retatrutide',
        dose_mg: 1,
        inventory_id: retaVial.id,
      }),
      doseRow('2026-10-03T09:00', { inventory_id: 'gone' }),
      doseRow('2026-10-03T09:00'),
    ]
    expect(vialRefunds(rows, vials).map((r) => [r.vial.id, r.mg])).toEqual([[retaVial.id, 3]])
  })
})
