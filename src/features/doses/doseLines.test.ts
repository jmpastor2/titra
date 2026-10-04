import { describe, expect, it } from 'vitest'
import type { DoseRow, InventoryRow } from '@/data/database.types'
import {
  buildEditPatches,
  buildInsertRows,
  carrierOf,
  drawPlanOf,
  editLines,
  entryAmount,
  entryMg,
  editedMembers,
  lastMgOf,
  lineForVial,
  lineMg,
  linesForProtocol,
  makeLine,
  partnerMg,
  patchLine,
  type EditLine,
  type EditedLine,
} from './doseLines'
import { blendDose, blendVial, cjcProtocol, doseRow, otherBlendVial, retaVial } from './testData'

const d = (iso: string) => new Date(iso)
const vials = [blendVial, otherBlendVial, retaVial]
const at = d('2026-10-01T12:00')

describe('lines of a blend', () => {
  it('turns a protocol with a blend vial into ONE line carrying its partner', () => {
    const lines = linesForProtocol(cjcProtocol, vials, at)
    expect(lines).toHaveLength(1)
    const [line] = lines
    expect(line).toMatchObject({
      compoundId: 'mod-grf-1-29',
      partners: ['ipamorelin'],
      inventoryId: blendVial.id,
      mode: 'units',
      amount: '6', // 100 mcg of a 5 + 5 mg / 3 mL blend
    })
  })

  it('builds the same line from the vial alone, for a one-off dose', () => {
    const line = lineForVial(blendVial, { mg: 0.1 })
    expect(line).toMatchObject({
      compoundId: 'mod-grf-1-29',
      partners: ['ipamorelin'],
      inventoryId: blendVial.id,
      mode: 'units',
      amount: '6',
    })
    // No amount typed yet when there is nothing to start from.
    expect(lineForVial(blendVial).amount).toBe('')
  })

  it('keeps a vial without a blend as a plain line in dose mode until it is reconstituted', () => {
    const powder: InventoryRow = { ...retaVial, concentration_mg_per_ml: null, diluent_ml: null }
    const line = lineForVial(powder, { mg: 1 })
    expect(line).toMatchObject({ partners: [], mode: 'dose', amount: '1', inventoryId: powder.id })
  })

  it('reads the dose of the line and of its partner from the draw', () => {
    const line = lineForVial(blendVial, { mg: 0.1 })
    expect(lineMg(line, vials)).toBeCloseTo(0.1, 9)
    expect(partnerMg(line, 'ipamorelin', vials)).toBeCloseTo(0.1, 9)
    // Half again: both follow the liquid.
    const more = { ...line, amount: '9' }
    expect(lineMg(more, vials)).toBeCloseTo(0.15, 9)
    expect(partnerMg(more, 'ipamorelin', vials)).toBeCloseTo(0.15, 9)
  })

  it('follows the vial proportion of an uneven blend, not the dose of the host', () => {
    const uneven: InventoryRow = {
      ...blendVial,
      components: [{ compoundId: 'ipamorelin', mg: 10 }],
    }
    const line = {
      ...lineForVial(uneven),
      amount: '100',
      mode: 'dose' as const,
      doseUnit: 'mcg' as const,
    }
    expect(partnerMg(line, 'ipamorelin', [uneven])).toBeCloseTo(0.2, 9)
  })

  it('draws a blend as a single load', () => {
    const plan = drawPlanOf([lineForVial(blendVial, { mg: 0.1 })], vials)
    expect(plan?.loads).toHaveLength(1)
    expect(plan?.totalUnits).toBe(6)
  })

  it('sends a partner the new vial does not hold back to a line of its own', () => {
    const [line] = linesForProtocol(cjcProtocol, vials, at)
    const next = patchLine([line!], line!.key, { inventoryId: retaVial.id }, vials)
    expect(next.map((l) => l.compoundId)).toEqual(['mod-grf-1-29', 'ipamorelin'])
    expect(next.map((l) => l.partners)).toEqual([[], []])
    // The partner keeps its own dose, not the host's.
    expect(next[1]?.plannedMg).toBeCloseTo(0.1, 9)
  })

  it('remembers the last dose logged of a compound', () => {
    const rows = [doseRow('2026-10-02T01:00', { dose_mg: 0.15 }), doseRow('2026-10-01T01:00')]
    expect(lastMgOf(rows, 'mod-grf-1-29')).toBe(0.15)
    expect(lastMgOf(rows, 'retatrutide')).toBeUndefined()
  })
})

describe('rows to insert', () => {
  const base = {
    patientId: 'user-1',
    protocolId: null,
    at: d('2026-10-04T08:00'),
    siteId: 'abd_ul',
    notes: 'Toma extra',
    plannedAt: null,
  }

  it('logs both compounds of a blend, the stock drawn down once', () => {
    const rows = buildInsertRows(base, [lineForVial(blendVial, { mg: 0.1 })], vials)
    expect(rows).toHaveLength(2)
    expect(rows?.map((r) => r.compound_id)).toEqual(['mod-grf-1-29', 'ipamorelin'])
    expect(rows?.map((r) => r.inventory_id)).toEqual([blendVial.id, null])
    expect(rows?.map((r) => Number(r.dose_mg).toFixed(4))).toEqual(['0.1000', '0.1000'])
    for (const r of rows ?? []) {
      expect(r).toMatchObject({
        patient_id: 'user-1',
        protocol_id: null,
        site_id: 'abd_ul',
        notes: 'Toma extra',
        planned_at: null,
        administered_at: d('2026-10-04T08:00').toISOString(),
      })
    }
  })

  it('saves the planned administration it covers on every row', () => {
    const rows = buildInsertRows(
      { ...base, protocolId: 'cjc', plannedAt: d('2026-09-29T01:00') },
      [lineForVial(blendVial, { mg: 0.1 })],
      vials,
    )
    expect(rows?.map((r) => r.planned_at)).toEqual([
      d('2026-09-29T01:00').toISOString(),
      d('2026-09-29T01:00').toISOString(),
    ])
    expect(rows?.every((r) => r.protocol_id === 'cjc')).toBe(true)
  })

  it('logs a stack of separate vials as one row each, each naming its own vial', () => {
    const lines = [
      { ...makeLine('retatrutide', 2, vials) },
      { ...makeLine('mots-c', 5, [{ ...retaVial, id: 'vial-mots', compound_id: 'mots-c' }]) },
    ]
    const rows = buildInsertRows(base, lines, [
      ...vials,
      { ...retaVial, id: 'vial-mots', compound_id: 'mots-c' },
    ])
    expect(rows?.map((r) => r.inventory_id)).toEqual([retaVial.id, 'vial-mots'])
  })

  it('refuses an amount that is not a positive number', () => {
    expect(buildInsertRows(base, [{ ...lineForVial(blendVial), amount: '' }], vials)).toBeNull()
    expect(buildInsertRows(base, [{ ...lineForVial(blendVial), amount: '0' }], vials)).toBeNull()
    expect(buildInsertRows(base, [{ ...lineForVial(blendVial), amount: 'abc' }], vials)).toBeNull()
  })

  it('puts the vial on the vial’s own compound even when another leads the line', () => {
    // A line led by ipamorelin drawing from a vial whose own compound is the CJC.
    const line = {
      ...lineForVial(blendVial, { mg: 0.1 }),
      compoundId: 'ipamorelin',
      partners: ['mod-grf-1-29'],
    }
    expect(carrierOf(line, blendVial)).toBe('mod-grf-1-29')
    const rows = buildInsertRows(base, [line], vials)
    expect(rows?.map((r) => [r.compound_id, r.inventory_id])).toEqual([
      ['ipamorelin', null],
      ['mod-grf-1-29', blendVial.id],
    ])
  })

  it('falls back to the leading compound when the vial’s own is not in the line', () => {
    const line = {
      ...lineForVial(blendVial, { mg: 0.1 }),
      compoundId: 'ipamorelin',
      partners: ['x'],
    }
    expect(carrierOf(line, blendVial)).toBe('ipamorelin')
  })
})

describe('editing a blend administration', () => {
  const [owner, partner] = blendDose('2026-10-03T01:03', {
    site_id: 'abd_ul',
    notes: 'ok',
  })
  const rows = [owner!, partner!]
  const at0 = d('2026-10-03T01:03')
  /** The same rows with some columns changed. */
  const withRows = (over: Partial<DoseRow>) => rows.map((r) => Object.assign({}, r, over))

  const edited = (line: EditLine, over: Partial<EditLine> = {}): EditedLine => {
    const next = { ...line, ...over }
    const members = editedMembers(next, vials)
    if (!members) throw new Error('invalid amount')
    return { members, inventoryId: next.inventoryId }
  }
  const values = (
    over: Partial<Parameters<typeof buildEditPatches>[0]> = {},
    line?: EditedLine,
  ) => {
    const [l] = editLines(rows, vials)
    return {
      at: at0,
      siteId: 'abd_ul',
      notes: 'ok',
      lines: [line ?? edited(l!)],
      ...over,
    }
  }

  it('shows the administration as one line with its partner and its vial', () => {
    const lines = editLines(rows, vials)
    expect(lines).toHaveLength(1)
    expect(lines[0]).toMatchObject({
      compoundId: 'mod-grf-1-29',
      partners: ['ipamorelin'],
      inventoryId: blendVial.id,
      mode: 'units',
      amount: '6',
    })
  })

  it('writes nothing when nothing changed, whatever the rounding of the units', () => {
    expect(buildEditPatches(values(), vials)).toEqual([])
  })

  it('moves the whole administration with one time, site and notes', () => {
    const patches = buildEditPatches(
      values({ at: d('2026-10-03T00:30'), siteId: 'thigh_r', notes: ' otra ' }),
      vials,
    )
    expect(patches.map((p) => p.id)).toEqual([owner!.id, partner!.id])
    for (const { patch } of patches) {
      expect(patch).toEqual({
        administered_at: d('2026-10-03T00:30').toISOString(),
        site_id: 'thigh_r',
        notes: 'otra',
      })
    }
  })

  it('clears the site and the notes when emptied', () => {
    const patches = buildEditPatches(values({ siteId: '', notes: '  ' }), vials)
    expect(patches.map((p) => p.patch)).toEqual([
      { site_id: null, notes: null },
      { site_id: null, notes: null },
    ])
  })

  it('gives each row its own dose: the partner follows the draw', () => {
    const [line] = editLines(rows, vials)
    const patches = buildEditPatches(values({}, edited(line!, { amount: '9' })), vials)
    expect(patches).toHaveLength(2)
    expect(patches[0]?.patch.dose_mg).toBeCloseTo(0.15, 9)
    expect(patches[1]?.patch.dose_mg).toBeCloseTo(0.15, 9)
    // The vial did not change: the carrier is not touched.
    expect(patches.every((p) => !('inventory_id' in p.patch))).toBe(true)
  })

  it('keeps a stored partner dose that is off the vial proportion until the draw changes', () => {
    const odd = [owner!, { ...partner!, dose_mg: 0.12 }]
    const [line] = editLines(odd, vials)
    const same = editedMembers(line!, vials)
    expect(same?.map((m) => m.mg)).toEqual([0.1, 0.12])
    const more = editedMembers({ ...line!, amount: '9' }, vials)
    expect(more?.[1]?.mg).toBeCloseTo(0.15, 9)
  })

  it('refuses an amount that is not a positive number', () => {
    const [line] = editLines(rows, vials)
    expect(editedMembers({ ...line!, amount: '' }, vials)).toBeNull()
    expect(editedMembers({ ...line!, amount: '0' }, vials)).toBeNull()
  })

  it('changes the vial on the carrier’s row only, partners stay clear', () => {
    const [line] = editLines(rows, vials)
    const patches = buildEditPatches(
      values({}, edited(line!, { inventoryId: otherBlendVial.id })),
      vials,
    )
    // Units differ between vials of another strength, but the dose is kept.
    const owned = patches.find((p) => p.id === owner!.id)
    expect(owned?.patch.inventory_id).toBe(otherBlendVial.id)
    expect(patches.find((p) => p.id === partner!.id)?.patch.inventory_id).toBeUndefined()
  })

  it('moves the vial to the right row when the vial’s own compound rides along', () => {
    // The row that carried the vial was ipamorelin, the vial's own compound is the CJC.
    const swapped = [
      { ...owner!, inventory_id: null },
      { ...partner!, inventory_id: otherBlendVial.id },
    ]
    const [line] = editLines(swapped, vials)
    expect(line?.compoundId).toBe('ipamorelin')
    const patches = buildEditPatches(
      values({}, edited(line!, { inventoryId: blendVial.id })),
      vials,
    )
    expect(patches.find((p) => p.id === owner!.id)?.patch.inventory_id).toBe(blendVial.id)
    expect(patches.find((p) => p.id === partner!.id)?.patch.inventory_id).toBeNull()
  })

  it('assigns the planned administration it covers to every row, and links a free dose', () => {
    const free = withRows({ protocol_id: null })
    const [line] = editLines(free, vials)
    const patches = buildEditPatches(
      {
        at: at0,
        siteId: 'abd_ul',
        notes: 'ok',
        plannedAt: d('2026-09-29T01:00'),
        protocolId: 'cjc',
        lines: [edited(line!)],
      },
      vials,
    )
    expect(patches.map((p) => p.patch)).toEqual([
      { planned_at: d('2026-09-29T01:00').toISOString(), protocol_id: 'cjc' },
      { planned_at: d('2026-09-29T01:00').toISOString(), protocol_id: 'cjc' },
    ])
  })

  it('lets the time decide again when the assignment is cleared', () => {
    const assigned = withRows({ planned_at: d('2026-09-29T01:00').toISOString() })
    const [line] = editLines(assigned, vials)
    const patches = buildEditPatches(
      { at: at0, siteId: 'abd_ul', notes: 'ok', plannedAt: null, lines: [edited(line!)] },
      vials,
    )
    expect(patches.map((p) => p.patch)).toEqual([{ planned_at: null }, { planned_at: null }])
    // Leaving it undefined does not touch it.
    expect(
      buildEditPatches({ at: at0, siteId: 'abd_ul', notes: 'ok', lines: [edited(line!)] }, vials),
    ).toEqual([])
  })
})

describe('editing a single dose', () => {
  it('reads the dose in the unit of the compound when there is no vial', () => {
    const row = doseRow('2026-10-03T01:03', { compound_id: 'retatrutide', dose_mg: 1.5 })
    const [line] = editLines([row], vials)
    expect(line).toMatchObject({ mode: 'dose', amount: '1.5', partners: [], inventoryId: '' })
    const members = editedMembers({ ...line!, amount: '2' }, vials)
    expect(members?.map((m) => m.mg)).toEqual([2])
  })

  it('edits a stack of separate vials as separate lines', () => {
    const stack = [
      doseRow('2026-10-03T09:00', {
        compound_id: 'retatrutide',
        dose_mg: 2,
        inventory_id: retaVial.id,
        batch_id: 'b',
      }),
      doseRow('2026-10-03T09:00', { compound_id: 'ipamorelin', dose_mg: 0.1, batch_id: 'b' }),
    ]
    expect(editLines(stack, vials).map((l) => [l.compoundId, l.partners.length])).toEqual([
      ['retatrutide', 0],
      ['ipamorelin', 0],
    ])
  })
})

describe('amounts in units, mg and mcg', () => {
  it('turns what is typed into mg, per unit', () => {
    // 5 mg in 3 mL: 1.667 mg/mL, so 6 U is 0.1 mg.
    expect(entryMg(6, 'units', 5 / 3)).toBeCloseTo(0.1, 9)
    expect(entryMg(100, 'mcg', null)).toBeCloseTo(0.1, 9)
    expect(entryMg(0.1, 'mg', null)).toBe(0.1)
  })

  it('cannot read units without a concentration, nor a zero or negative amount', () => {
    expect(entryMg(6, 'units', null)).toBeNull()
    expect(entryMg(0, 'mg', null)).toBeNull()
    expect(entryMg(-1, 'mcg', null)).toBeNull()
    expect(entryMg(Number.NaN, 'mg', null)).toBeNull()
  })

  it('writes the same mg in each unit, so switching never changes the dose', () => {
    expect(entryAmount(0.1, 'units', 5 / 3)).toBe('6')
    expect(entryAmount(0.1, 'mcg', null)).toBe('100')
    expect(entryAmount(0.1, 'mg', null)).toBe('0.1')
    expect(entryAmount(0.1, 'units', null)).toBe('')
  })
})
