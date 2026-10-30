/** Body-map geometry: one figure at a time, front or back, in a 160-wide viewBox. */

export interface Rect {
  x: number
  y: number
  w: number
  h: number
}
export type BodyView = 'front' | 'back'
export interface Spot {
  id: string
  view: BodyView
  cx: number
  cy: number
  /** Invisible tap target, ≥ 26 × 26 viewBox units (≥ 44 px with the map at its 280 px minimum). */
  hit: Rect
}

/** Centre line of the figure. */
export const C = 80

/** Shoulders to knees, with room for the side captions underneath. */
export const BOX: Rect = { x: 0, y: 44, w: 160, h: 222 }
export const VIEWBOX = `${BOX.x} ${BOX.y} ${BOX.w} ${BOX.h}`
/** The map is never drawn narrower than this, so 26 units stay ≥ 44 px. */
export const MIN_WIDTH_PX = 280

/** The left-hand spot of a pair and its mirror image on the right. */
function pair(
  left: string,
  right: string,
  view: BodyView,
  dx: number,
  cy: number,
  hit: Rect,
): Spot[] {
  return [
    { id: left, view, cx: C - dx, cy, hit },
    { id: right, view, cx: C + dx, cy, hit: { ...hit, x: 2 * C - hit.x - hit.w } },
  ]
}

/*
 * Drawn as you see yourself: your left on the left in both views (looking down at your belly,
 * and at your back in a mirror). Tap targets tile each figure without overlapping, so a tap
 * between two spots is never ambiguous.
 */
export const SPOTS: readonly Spot[] = [
  // Abdomen around the navel (y 118.5): two quadrants a side, and the side of the belly.
  ...pair('abd_ul', 'abd_ur', 'front', 13, 99, { x: C - 26, y: 80, w: 26, h: 38.5 }),
  ...pair('abd_ll', 'abd_lr', 'front', 13, 138, { x: C - 26, y: 118.5, w: 26, h: 38.5 }),
  ...pair('abd_sl', 'abd_sr', 'front', 28, 118.5, { x: C - 54, y: 92, w: 28, h: 53 }),
  // Thighs: the front of the upper half, then the outer side lower down.
  ...pair('thigh_l', 'thigh_r', 'front', 17, 182, { x: C - 30, y: 157, w: 30, h: 46 }),
  ...pair('thigh_ol', 'thigh_or', 'front', 25, 226, { x: C - 40, y: 203, w: 36, h: 46 }),
  // Back: the back of the upper arm, the love handles, the upper outer glute.
  ...pair('arm_l', 'arm_r', 'back', 51.5, 92, { x: C - 66, y: 64, w: 28, h: 56 }),
  ...pair('flank_l', 'flank_r', 'back', 24, 124, { x: C - 38, y: 104, w: 38, h: 42 }),
  ...pair('glute_l', 'glute_r', 'back', 15, 164, { x: C - 36, y: 146, w: 36, h: 50 }),
]

export const viewOf = (siteId: string): BodyView | undefined =>
  SPOTS.find((s) => s.id === siteId)?.view
