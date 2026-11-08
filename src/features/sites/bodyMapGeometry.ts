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

/** Head to knees, with room for the side captions beside the legs. */
export const BOX: Rect = { x: 0, y: 4, w: 160, h: 262 }
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
  ...pair('abd_sl', 'abd_sr', 'front', 26, 118.5, { x: C - 54, y: 92, w: 28, h: 53 }),
  // Thighs: the front of the upper half, then the outer side lower down.
  ...pair('thigh_l', 'thigh_r', 'front', 20, 182, { x: C - 36, y: 157, w: 36, h: 46 }),
  ...pair('thigh_ol', 'thigh_or', 'front', 25, 226, { x: C - 40, y: 203, w: 36, h: 46 }),
  // Back of the upper arm, upper and lower half, following the arm out from the body.
  ...pair('arm_l', 'arm_r', 'back', 47, 84, { x: C - 66, y: 62, w: 26, h: 38 }),
  ...pair('arm_ll', 'arm_lr', 'back', 53, 114, { x: C - 66, y: 100, w: 26, h: 28 }),
  // The love handles at the waist, the upper hip below them and the lower back by the spine.
  ...pair('flank_l', 'flank_r', 'back', 27, 114, { x: C - 40, y: 100, w: 26, h: 28 }),
  ...pair('hip_l', 'hip_r', 'back', 33, 143, { x: C - 52, y: 128, w: 26, h: 28 }),
  ...pair('back_l', 'back_r', 'back', 12, 142, { x: C - 26, y: 128, w: 26, h: 28 }),
  // The upper outer quarter of the glute.
  ...pair('glute_l', 'glute_r', 'back', 20, 170, { x: C - 40, y: 156, w: 40, h: 44 }),
]

export const viewOf = (siteId: string): BodyView | undefined =>
  SPOTS.find((s) => s.id === siteId)?.view
