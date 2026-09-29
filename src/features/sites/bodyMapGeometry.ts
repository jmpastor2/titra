/** Body-map geometry, in the 300 × 312 viewBox shared by both map sizes. */

export interface Rect {
  x: number
  y: number
  w: number
  h: number
}
export interface Spot {
  id: string
  cx: number
  cy: number
  /** Invisible tap target, ≥ 44 × 44 viewBox units (≥ 44 px at both map sizes). */
  hit: Rect
}

/** Centre lines of the two figures in the 300 × 312 viewBox. */
export const FRONT = 78
export const BACK = 222

/*
 * Drawn as you see yourself: your left on the left in both views. Front shows the
 * abdomen and thighs; back shows the back of the upper arms and the glutes. Tap targets
 * tile each figure without overlapping, so a tap between two spots is never ambiguous.
 */
export const SPOTS: readonly Spot[] = [
  { id: 'abd_ul', cx: FRONT - 13, cy: 104, hit: { x: FRONT - 44, y: 74, w: 44, h: 44.5 } },
  { id: 'abd_ur', cx: FRONT + 13, cy: 104, hit: { x: FRONT, y: 74, w: 44, h: 44.5 } },
  { id: 'abd_ll', cx: FRONT - 13, cy: 133, hit: { x: FRONT - 44, y: 118.5, w: 44, h: 44.5 } },
  { id: 'abd_lr', cx: FRONT + 13, cy: 133, hit: { x: FRONT, y: 118.5, w: 44, h: 44.5 } },
  { id: 'thigh_l', cx: FRONT - 15, cy: 200, hit: { x: FRONT - 44, y: 163, w: 44, h: 69 } },
  { id: 'thigh_r', cx: FRONT + 15, cy: 200, hit: { x: FRONT, y: 163, w: 44, h: 69 } },
  { id: 'arm_l', cx: BACK - 41.5, cy: 88, hit: { x: BACK - 66, y: 58, w: 44, h: 64 } },
  { id: 'arm_r', cx: BACK + 41.5, cy: 88, hit: { x: BACK + 22, y: 58, w: 44, h: 64 } },
  { id: 'glute_l', cx: BACK - 13, cy: 156, hit: { x: BACK - 44, y: 122, w: 44, h: 64 } },
  { id: 'glute_r', cx: BACK + 13, cy: 156, hit: { x: BACK, y: 122, w: 44, h: 64 } },
]

/** The compact crop: shoulders to knees, both figures, for ~200 px tall pickers. */
export const COMPACT_BOX: Rect = { x: 12, y: 48, w: 276, h: 184 }
export const FULL_BOX: Rect = { x: 0, y: 0, w: 300, h: 312 }

const toViewBox = (r: Rect) => `${r.x} ${r.y} ${r.w} ${r.h}`
export const VIEWBOX = { full: toViewBox(FULL_BOX), compact: toViewBox(COMPACT_BOX) } as const

/** Figure centres as a fraction of the compact width, for the HTML captions. */
export const COMPACT_CAPTION_X = [
  (FRONT - COMPACT_BOX.x) / COMPACT_BOX.w,
  (BACK - COMPACT_BOX.x) / COMPACT_BOX.w,
] as const
