import { describe, expect, it } from 'vitest'
import { COMPOUNDS, compoundById, searchCompounds } from './compounds'
import { PROTOCOL_TEMPLATES } from './protocols/templates'

describe('compound registry', () => {
  it('has unique ids', () => {
    const ids = COMPOUNDS.map((c) => c.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('every entry has both languages and the required fields', () => {
    for (const c of COMPOUNDS) {
      expect(c.summary.es.length, c.id).toBeGreaterThan(20)
      expect(c.summary.en.length, c.id).toBeGreaterThan(20)
      expect(c.mechanism.es.length, c.id).toBeGreaterThan(20)
      expect(c.indications.length, c.id).toBeGreaterThan(0)
      expect(c.adverseEffects.common.length, c.id).toBeGreaterThan(0)
      expect(c.contraindications.length, c.id).toBeGreaterThan(0)
      expect(c.references.length, c.id).toBeGreaterThan(0)
      expect(c.lastReviewed).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    }
  })

  it('incretins declare PK parameters usable by the engine', () => {
    for (const c of COMPOUNDS.filter((x) => x.category === 'incretin')) {
      expect(c.pk, c.id).toBeDefined()
      expect(c.pk!.halfLifeH, c.id).toBeGreaterThan(0)
      if (c.pk!.tmaxH !== undefined) expect(c.pk!.tmaxH, c.id).toBeGreaterThan(0)
    }
  })

  it('templates reference known compounds and valid steps', () => {
    for (const p of PROTOCOL_TEMPLATES) {
      expect(compoundById(p.compoundId), `${p.id} → ${p.compoundId}`).toBeDefined()
      expect(p.steps.length).toBeGreaterThan(0)
      for (const s of p.steps) {
        expect(s.doseMg).toBeGreaterThan(0)
        expect(s.intervalDays).toBeGreaterThan(0)
      }
      // Only the last step may be open-ended.
      p.steps.slice(0, -1).forEach((s) => expect(s.durationWeeks).not.toBeNull())
    }
  })

  it('search is accent- and case-insensitive', () => {
    expect(searchCompounds('SEMAGLUTIDA').map((c) => c.id)).toContain('semaglutide')
    expect(searchCompounds('zepbound').map((c) => c.id)).toContain('tirzepatide')
    expect(searchCompounds('xyzzy')).toEqual([])
  })
})
