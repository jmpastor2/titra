/**
 * Which tiles the Registro rápido shows and in what order. Every tile reports a tier, how
 * much it needs the person now; the grid shows the best seven (plus "Más"), the most
 * pressing first, and what does not fit waits in the "Más" sheet. Pure; see tiles.test.ts.
 */
import { CHECKIN_STALE_DAYS } from '@/features/health/consistency'
import { proteinTarget } from '@/domain/lean/leanMass'

export type TileId =
  'dose' | 'water' | 'weight' | 'checkin' | 'symptom' | 'fasting' | 'protein' | 'strength' | 'waist'

/**
 * 3 act now (a dose is due), 2 needs attention (a reading went stale, a fast is open),
 * 1 routine, 0 done for now. Tiers move only on real changes, so the grid is calm.
 */
export type Tier = 0 | 1 | 2 | 3

/** How a tile looks: calm, asking, urgent (the one pulse), or done. */
export type TileTone = 'idle' | 'attention' | 'urgent' | 'done'

export interface TileRank {
  id: TileId
  tier: Tier
}

/** Reading order when tiers tie. */
export const TILE_ORDER: readonly TileId[] = [
  'dose',
  'water',
  'weight',
  'checkin',
  'symptom',
  'fasting',
  'protein',
  'strength',
  'waist',
]

/** Always in the grid: what is reached for several times a day, or in a hurry. */
export const PINNED: ReadonlySet<TileId> = new Set([
  'dose',
  'water',
  'weight',
  'symptom',
  'protein',
])

/** Tiles in the grid, "Más" aside: 2 columns by 4 rows at phone width. */
export const MAX_TILES = 7

/** Days after which a body reading asks to be repeated. */
export const WEIGH_IN_STALE_DAYS = 3
export const GIRTH_STALE_DAYS = 7

/** Strength sessions a week, as in Progress. */
export const STRENGTH_WEEKLY_TARGET = 2

/** Hours before a GH-secretagogue dose in which the fast starts to matter. */
export const FAST_WINDOW_H = 8

/** Hours before a dose in which it already asks for attention. */
export const DOSE_SOON_H = 3

export type DoseStatus = 'overdue' | 'due' | 'upcoming' | 'missed' | 'done' | 'none'

export function tierDose(status: DoseStatus, hoursAhead: number | null): Tier {
  switch (status) {
    case 'overdue':
    case 'due':
      return 3
    case 'upcoming':
      return hoursAhead !== null && hoursAhead <= DOSE_SOON_H ? 2 : 1
    case 'missed':
      return 2
    case 'done':
      return 0
    case 'none':
      return 1
  }
}

/** A weigh-in: never done or stale asks, today's is done. */
export function tierWeight(ageDays: number | null): Tier {
  if (ageDays === null || ageDays > WEIGH_IN_STALE_DAYS) return 2
  return ageDays === 0 ? 0 : 1
}

export function tierGirth(ageDays: number | null): Tier {
  if (ageDays === 0) return 0
  return ageDays !== null && ageDays > GIRTH_STALE_DAYS ? 2 : 1
}

export function tierCheckIn(doneToday: boolean, ageDays: number | null): Tier {
  if (doneToday) return 0
  return ageDays === null || ageDays > CHECKIN_STALE_DAYS ? 2 : 1
}

/**
 * Null when no protocol asks for fasting: the tile is not offered. Within the window of a
 * fasting-sensitive dose it asks to be seen, whether the fast is still running or done.
 */
export function tierFasting(f: {
  available: boolean
  /** A fasting-sensitive dose is coming up within the fast window. */
  near: boolean
}): Tier | null {
  if (!f.available) return null
  return f.near ? 2 : 0
}

export function tierCount(total: number, goal: number | null): Tier {
  return goal !== null && total >= goal ? 0 : 1
}

/** Strength sessions of the last 7 days: behind the weekly target asks, on target is done. */
export function tierStrength(sessions: number): Tier {
  return sessions >= STRENGTH_WEEKLY_TARGET ? 0 : 2
}

/** Protein goal: grams per kg of the latest weight, or of the goal weight before the first. */
export function proteinTargetG(
  lastWeightKg: number | null,
  goalWeightKg: number | null,
  gPerKg: number,
): number | null {
  const target = proteinTarget(lastWeightKg ?? goalWeightKg ?? 0, gPerKg)
  return target > 0 ? target : null
}

const byAttention = (a: TileRank, b: TileRank) =>
  b.tier - a.tier || TILE_ORDER.indexOf(a.id) - TILE_ORDER.indexOf(b.id)

/**
 * The tiles to show and the rest. Pinned tiles always make the grid; the free places go to
 * the most pressing of the others. Both lists come out most pressing first.
 */
export function rankTiles(
  ranks: readonly TileRank[],
  max: number = MAX_TILES,
): { shown: TileId[]; hidden: TileId[] } {
  const sorted = ranks.toSorted(byAttention)
  const pinned = sorted.filter((r) => PINNED.has(r.id))
  const free = Math.max(0, max - pinned.length)
  const chosen = new Set(
    [...pinned, ...sorted.filter((r) => !PINNED.has(r.id)).slice(0, free)].map((r) => r.id),
  )
  return {
    shown: sorted.filter((r) => chosen.has(r.id)).map((r) => r.id),
    hidden: sorted.filter((r) => !chosen.has(r.id)).map((r) => r.id),
  }
}

/** A short protocol name that fits a tile: "CJC-1295 + Ipamorelina" becomes "CJC + Ipa". */
export function shortName(name: string): string {
  const parts = name.split(/\s*\+\s*/).filter(Boolean)
  if (parts.length < 2) return name.trim()
  return parts
    .map((p) => {
      const base = p.replace(/-\d+$/, '')
      return base.length > 6 ? base.slice(0, 3) : base
    })
    .join(' + ')
}
