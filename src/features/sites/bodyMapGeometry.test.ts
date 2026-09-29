import { describe, expect, it } from 'vitest'
import { INJECTION_SITES } from '@/domain/sites/injectionSites'
import { BACK, COMPACT_BOX, FRONT, FULL_BOX, SPOTS, type Rect } from './bodyMapGeometry'

const inside = (r: Rect, x: number, y: number) =>
  x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h
const contains = (outer: Rect, r: Rect) =>
  inside(outer, r.x, r.y) && inside(outer, r.x + r.w, r.y + r.h)
const overlap = (a: Rect, b: Rect) =>
  a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h

describe('body map geometry', () => {
  it('draws exactly the catalogue sites', () => {
    expect(SPOTS.map((s) => s.id).toSorted()).toEqual(INJECTION_SITES.map((s) => s.id).toSorted())
  })

  it('keeps every spot on its figure and inside both crops', () => {
    for (const s of SPOTS) {
      // Figures span centre ± 48 horizontally; the arms' centre line is at ± 41.5.
      const centre = Math.abs(s.cx - FRONT) < Math.abs(s.cx - BACK) ? FRONT : BACK
      expect(Math.abs(s.cx - centre)).toBeLessThanOrEqual(41.5)
      expect(s.cy).toBeGreaterThan(58)
      expect(s.cy).toBeLessThan(286)
      expect(contains(FULL_BOX, s.hit)).toBe(true)
      expect(contains(COMPACT_BOX, s.hit)).toBe(true)
      expect(inside(s.hit, s.cx, s.cy)).toBe(true)
    }
  })

  it('gives every spot a ≥ 44 px target that no other spot overlaps', () => {
    // Narrowest render: compact at 288 px wide showing 276 units → 1.04 px per unit.
    for (const s of SPOTS) {
      expect(s.hit.w).toBeGreaterThanOrEqual(44)
      expect(s.hit.h).toBeGreaterThanOrEqual(44)
      for (const o of SPOTS) if (o !== s) expect(overlap(s.hit, o.hit)).toBe(false)
    }
  })
})
