import { describe, expect, it } from 'vitest'
import { compoundById } from '@/content/compounds'
import { BLEND_PRESETS } from './blendPresets'

describe('vial presets', () => {
  it('have unique ids and only known substances with a positive content', () => {
    expect(new Set(BLEND_PRESETS.map((p) => p.id)).size).toBe(BLEND_PRESETS.length)
    for (const p of BLEND_PRESETS) {
      expect(p.parts.length, p.id).toBeGreaterThan(0)
      expect(new Set(p.parts.map((x) => x.compoundId)).size, p.id).toBe(p.parts.length)
      for (const part of p.parts) {
        expect(compoundById(part.compoundId), `${p.id} → ${part.compoundId}`).toBeDefined()
        expect(part.mg, p.id).toBeGreaterThan(0)
      }
    }
  })

  it('has the vials that are arriving: KLOW and NAD+ at 500 mg, with the usual sizes', () => {
    expect(BLEND_PRESETS.find((p) => p.id === 'klow-80')?.parts).toHaveLength(4)
    const nad = BLEND_PRESETS.find((p) => p.id === 'nad-plus-500')!
    expect(nad.parts).toEqual([{ compoundId: 'nad-plus', mg: 500 }])
    expect(nad.sizes).toEqual([100, 500, 1000])
  })

  it('offers sizes only for single substances, and includes the preset own content', () => {
    for (const p of BLEND_PRESETS) {
      if (!p.sizes) continue
      expect(p.parts, p.id).toHaveLength(1)
      expect(p.sizes, p.id).toContain(p.parts[0]!.mg)
    }
  })
})
