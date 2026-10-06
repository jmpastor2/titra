import { describe, expect, it } from 'vitest'
import { BLEND_PRESETS } from '@/features/inventory/blendPresets'
import {
  BLENDS,
  COMPOUNDS,
  WIKI_ENTRIES,
  blendsContaining,
  compoundById,
  searchCompounds,
  searchWiki,
  weakestEvidence,
} from './compounds'
import { BLEND_DETAILS, DETAILS_BY_ID, SUBSTANCE_DETAILS } from './compounds/entries'
import { OUTLOOK } from './outlook'
import { PROTOCOL_TEMPLATES } from './protocols/templates'

describe('compound registry', () => {
  it('has unique ids', () => {
    const ids = WIKI_ENTRIES.map((c) => c.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('lists the same entries, in the same order, as the full catalog', () => {
    expect(COMPOUNDS.map((c) => c.id)).toEqual(SUBSTANCE_DETAILS.map((c) => c.id))
    expect(BLENDS.map((c) => c.id)).toEqual(BLEND_DETAILS.map((c) => c.id))
  })

  it('every entry has both languages and the required fields', () => {
    for (const c of [...SUBSTANCE_DETAILS, ...BLEND_DETAILS]) {
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

  it('matches every word of a query, in any order', () => {
    expect(searchWiki('cjc ipamorelina').map((c) => c.id)).toContain('blend-cjc-ipamorelin')
    expect(searchWiki('ipamorelina cjc').map((c) => c.id)).toContain('blend-cjc-ipamorelin')
    expect(searchWiki('  retatrutida   ').map((c) => c.id)).toEqual(['retatrutide'])
    expect(searchWiki('retatrutida klow')).toEqual([])
  })

  it('finds the user-facing names of the GH blend components', () => {
    expect(searchCompounds('cjc-1295 sin dac').map((c) => c.id)).toContain('mod-grf-1-29')
    expect(searchCompounds('mod grf').map((c) => c.id)).toContain('mod-grf-1-29')
    expect(searchCompounds('ipamorelin').map((c) => c.id)).toContain('ipamorelin')
    expect(compoundById('mod-grf-1-29')?.names.generic).toBe('CJC-1295 (sin DAC)')
  })
})

describe('lean catalogue', () => {
  it('keeps what the owner runs and stays small enough to scan', () => {
    for (const id of [
      'retatrutide',
      'mots-c',
      'mod-grf-1-29',
      'ipamorelin',
      'blend-cjc-ipamorelin',
    ]) {
      expect(compoundById(id), id).toBeDefined()
    }
    // Every compound reachable in the wiki is one somebody actually runs: no label-only drugs.
    expect(WIKI_ENTRIES.length).toBeLessThan(60)
    expect(WIKI_ENTRIES.filter((c) => c.category === 'insulin')).toEqual([])
  })

  it('every template points at a compound that is still in the catalogue', () => {
    for (const p of PROTOCOL_TEMPLATES) expect(compoundById(p.compoundId), p.id).toBeDefined()
    for (const c of COMPOUNDS) {
      for (const id of c.dosing.templateIds ?? []) {
        expect(
          PROTOCOL_TEMPLATES.some((p) => p.id === id && p.compoundId === c.id),
          `${c.id} → ${id}`,
        ).toBe(true)
      }
    }
  })
})

describe('blend entries', () => {
  it('weakestEvidence picks the lowest tier', () => {
    expect(weakestEvidence(['fda_approved', 'phase2'])).toBe('phase2')
    expect(weakestEvidence(['phase2', 'anecdotal', 'preclinical'])).toBe('anecdotal')
    expect(weakestEvidence(['preclinical', 'phase1'])).toBe('preclinical')
  })

  it('declare at least two known, non-blend components with positive mg', () => {
    expect(BLEND_DETAILS.length).toBeGreaterThanOrEqual(3)
    for (const b of BLEND_DETAILS) {
      expect(b.blend, b.id).toBeDefined()
      const parts = b.blend!.components
      expect(parts.length, b.id).toBeGreaterThanOrEqual(2)
      expect(new Set(parts.map((p) => p.compoundId)).size, b.id).toBe(parts.length)
      for (const p of parts) {
        const c = compoundById(p.compoundId)
        expect(c, `${b.id} → ${p.compoundId}`).toBeDefined()
        expect(c!.blend, `${b.id} → ${p.compoundId} is itself a blend`).toBeUndefined()
        expect(p.mg).toBeGreaterThan(0)
      }
      expect(b.blend!.rationale.es.length, b.id).toBeGreaterThan(20)
      expect(b.blend!.rationale.en.length, b.id).toBeGreaterThan(20)
      if (b.blend!.exampleDiluentMl !== undefined) {
        expect(b.blend!.exampleDiluentMl).toBeGreaterThan(0)
      }
    }
  })

  it('rate evidence as the weakest component and cite no combination trials', () => {
    for (const b of BLEND_DETAILS) {
      const tiers = b.blend!.components.map((p) => compoundById(p.compoundId)!.evidence)
      expect(b.evidence, b.id).toBe(weakestEvidence(tiers))
      expect(b.keyTrials, b.id).toEqual([])
      expect(b.regulatory.notes?.es, b.id).toMatch(/Ningún ensayo en humanos/)
      expect(b.regulatory.notes?.en, b.id).toMatch(/No human trial/)
    }
  })

  it('match the inventory presets they point to', () => {
    for (const b of BLENDS) {
      const presetId = b.blend!.presetId
      if (!presetId) continue
      const preset = BLEND_PRESETS.find((p) => p.id === presetId)
      expect(preset, `${b.id} → ${presetId}`).toBeDefined()
      expect(preset!.parts).toEqual(b.blend!.components)
    }
  })

  it('stay out of the substance list but are searchable in the wiki', () => {
    const substanceIds = new Set(COMPOUNDS.map((c) => c.id))
    for (const b of BLENDS) {
      expect(substanceIds.has(b.id), b.id).toBe(false)
      expect(compoundById(b.id)).toBe(b)
    }
    expect(COMPOUNDS.every((c) => c.blend === undefined)).toBe(true)
    expect(searchCompounds('klow')).toEqual([])
    expect(searchWiki('klow').map((c) => c.id)).toContain('blend-klow')
    expect(
      searchWiki('', 'blends')
        .map((c) => c.id)
        .toSorted(),
    ).toEqual(BLENDS.map((b) => b.id).toSorted())
    expect(searchWiki('', 'gh_axis').map((c) => c.id)).toContain('blend-cjc-ipamorelin')
  })

  it('are listed on their components', () => {
    expect(blendsContaining('bpc-157').map((b) => b.id)).toEqual(['blend-klow', 'blend-glow'])
    expect(blendsContaining('kpv').map((b) => b.id)).toEqual(['blend-klow'])
    expect(blendsContaining('retatrutide')).toEqual([])
  })
})

describe('retatrutide consistency', () => {
  const reta = DETAILS_BY_ID.get('retatrutide')!
  const outlook = OUTLOOK.retatrutide
  const pct = (v: number, locale: 'es' | 'en') =>
    `−${Math.abs(v)
      .toFixed(1)
      .replace('.', locale === 'es' ? ',' : '.')}`

  it('quotes every phase 2 arm the outlook uses, in both languages', () => {
    expect(outlook?.kind).toBe('trial')
    if (outlook?.kind !== 'trial') return
    for (const tp of outlook.reference.timepoints) {
      for (const v of [tp.placeboPct, ...tp.arms.map((a) => a.meanPct)]) {
        expect(reta.dosing.investigational!.es).toContain(pct(v, 'es'))
        expect(reta.dosing.investigational!.en).toContain(pct(v, 'en'))
      }
    }
  })

  it('says the 1 mg arm did not escalate', () => {
    expect(reta.dosing.investigational!.es).toMatch(/1 mg se mantuvo en 1 mg/)
    expect(reta.dosing.investigational!.en).toMatch(/1 mg arm stayed at 1 mg/)
  })
})
