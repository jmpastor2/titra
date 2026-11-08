import { describe, expect, it } from 'vitest'
import { INJECTION_SITES } from '@/domain/sites/injectionSites'
import { BOX, C, MIN_WIDTH_PX, SPOTS, type Rect } from './bodyMapGeometry'

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

  it('keeps every spot on the figure, inside the crop and inside its own target', () => {
    for (const s of SPOTS) {
      // The figure spans the centre ± 64; the lower triceps point is the farthest out.
      expect(Math.abs(s.cx - C)).toBeLessThanOrEqual(53)
      expect(contains(BOX, s.hit)).toBe(true)
      expect(inside(s.hit, s.cx, s.cy)).toBe(true)
    }
  })

  it('mirrors every left spot on the right', () => {
    for (const s of SPOTS.filter((x) => x.cx < C)) {
      const twin = SPOTS.find((o) => o.view === s.view && o.cx === 2 * C - s.cx && o.cy === s.cy)
      expect(twin, s.id).toBeDefined()
    }
  })

  it('gives every spot a ≥ 44 px target that no other spot of its view overlaps', () => {
    const pxPerUnit = MIN_WIDTH_PX / BOX.w
    for (const s of SPOTS) {
      expect(s.hit.w * pxPerUnit).toBeGreaterThanOrEqual(44)
      expect(s.hit.h * pxPerUnit).toBeGreaterThanOrEqual(44)
      for (const o of SPOTS)
        if (o !== s && o.view === s.view)
          expect(overlap(s.hit, o.hit), `${s.id} ${o.id}`).toBe(false)
    }
  })
})
