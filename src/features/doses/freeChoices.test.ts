import { describe, expect, it } from 'vitest'
import type { InventoryRow } from '@/data/database.types'
import { freeChoices, linesForChoice, type FreeChoiceSource } from './freeChoices'
import { blendDose, blendVial, cjcProtocol, doseRow, retaProtocol, retaVial } from './testData'

const now = new Date('2026-10-04T12:00')

const source = (over: Partial<FreeChoiceSource> = {}): FreeChoiceSource => ({
  protocols: [cjcProtocol, retaProtocol],
  vials: [blendVial, retaVial],
  doses: [],
  now,
  ...over,
})

describe('freeChoices', () => {
  it('offers each active protocol with its whole stack and the units to draw', () => {
    const { protocols } = freeChoices(
      source({ protocols: [cjcProtocol, { ...retaProtocol, status: 'paused' }] }),
    )
    expect(protocols).toHaveLength(1)
    expect(protocols[0]).toMatchObject({ units: 6 }) // one draw of the blend
    expect(protocols[0]?.doses.map((d) => d.compoundId)).toEqual(['mod-grf-1-29', 'ipamorelin'])
  })

  it('has no units to give for a protocol whose vial is not reconstituted', () => {
    const powder: InventoryRow = { ...blendVial, concentration_mg_per_ml: null, diluent_ml: null }
    const { protocols } = freeChoices(source({ vials: [powder] }))
    expect(protocols[0]?.units).toBeNull()
  })

  it('offers each vial in stock, a blend as ONE entry, reconstituted ones first', () => {
    const spare: InventoryRow = {
      ...retaVial,
      id: 'spare',
      label: 'Retatrutida reserva',
      concentration_mg_per_ml: null,
      diluent_ml: null,
    }
    const { vials } = freeChoices(
      source({
        vials: [
          spare,
          blendVial,
          retaVial,
          { ...retaVial, id: 'empty', remaining_mg: 0 },
          { ...retaVial, id: 'old', archived: true },
        ],
      }),
    )
    expect(vials.map((v) => v.vial.id)).toEqual([blendVial.id, retaVial.id, 'spare'])
    expect(vials[0]).toMatchObject({
      blend: true,
      liquid: true,
      compoundIds: ['mod-grf-1-29', 'ipamorelin'],
    })
    expect(vials[2]).toMatchObject({ blend: false, liquid: false })
  })

  it('lists what was injected lately, except what a protocol or a vial already offers', () => {
    const doses = [
      doseRow('2026-10-03T09:00', { compound_id: 'bpc-157', protocol_id: null }),
      ...blendDose('2026-10-03T01:00'),
      doseRow('2026-10-02T09:00', { compound_id: 'bpc-157', protocol_id: null }),
      doseRow('2026-10-01T09:00', { compound_id: 'tb-500', protocol_id: null }),
    ]
    const { recent } = freeChoices(source({ doses }))
    expect(recent.map((r) => r.compoundIds)).toEqual([['bpc-157'], ['tb-500']])
  })
})

describe('linesForChoice', () => {
  it('links the protocol and logs its whole stack as one draw', () => {
    const src = source()
    const choice = freeChoices(src).protocols[0]!
    const { protocolId, lines } = linesForChoice(choice, src)
    expect(protocolId).toBe('cjc')
    expect(lines).toHaveLength(1)
    expect(lines[0]).toMatchObject({
      partners: ['ipamorelin'],
      amount: '6',
      inventoryId: blendVial.id,
    })
  })

  it('logs a blend vial as one line with its partners and the vial selected, free of any protocol', () => {
    const src = source()
    const choice = freeChoices(src).vials.find((v) => v.blend)!
    const { protocolId, lines } = linesForChoice(choice, src)
    expect(protocolId).toBe('')
    expect(lines).toHaveLength(1)
    expect(lines[0]).toMatchObject({
      compoundId: 'mod-grf-1-29',
      partners: ['ipamorelin'],
      inventoryId: blendVial.id,
      mode: 'units',
      // Starts from the dose of the protocol that administers it: 100 mcg is 6 U.
      amount: '6',
    })
  })

  it('starts a vial with no protocol from the last dose logged', () => {
    const src = source({
      protocols: [],
      doses: [doseRow('2026-10-03T01:00', { dose_mg: 0.15, protocol_id: null })],
    })
    const choice = freeChoices(src).vials.find((v) => v.blend)!
    expect(linesForChoice(choice, src).lines[0]).toMatchObject({ amount: '9' })
  })

  it('leaves the amount empty when there is nothing to start from', () => {
    const src = source({ protocols: [] })
    const choice = freeChoices(src).vials.find((v) => v.blend)!
    expect(linesForChoice(choice, src).lines[0]?.amount).toBe('')
  })

  it('logs a recent combination from the vial that holds it, as one draw', () => {
    const doses = [...blendDose('2026-10-03T01:00')]
    const src = source({ protocols: [], vials: [blendVial], doses })
    const { lines } = linesForChoice(
      { kind: 'recent', key: 'recent:x', compoundIds: ['mod-grf-1-29', 'ipamorelin'] },
      src,
    )
    expect(lines).toHaveLength(1)
    expect(lines[0]?.partners).toEqual(['ipamorelin'])
  })
})
