/**
 * Fasting around GH secretagogues (CJC-1295, ipamorelin, GHRPs): food, above all
 * carbohydrate and fat, blunts the GH pulse. The usual rule, and the user's: inject at
 * least 2 h after eating and wait 30 min before eating again. Pure; see fasting.test.ts.
 */
import { useSyncExternalStore } from 'react'
import { compoundById } from '@/content/compounds'

export const FAST_BEFORE_MIN = 120
export const EAT_AFTER_MIN = 30

export function needsFasting(compoundIds: readonly string[]): boolean {
  return compoundIds.some((id) => compoundById(id)?.category === 'gh_axis')
}

export interface FastingState {
  /** When the 2 h after the last meal are up; null when no meal was noted. */
  readyAt: Date | null
  ready: boolean
  /** Minutes still to wait (0 when ready). */
  waitMin: number
}

export function fastingState(lastMeal: Date | null, now: Date): FastingState {
  if (!lastMeal) return { readyAt: null, ready: true, waitMin: 0 }
  const readyAt = new Date(lastMeal.getTime() + FAST_BEFORE_MIN * 60_000)
  const waitMin = Math.max(0, Math.ceil((readyAt.getTime() - now.getTime()) / 60_000))
  return { readyAt, ready: waitMin === 0, waitMin }
}

/* ---------------------------------------------------------- last meal, per device */

const KEY = 'titra.lastMeal'
const listeners = new Set<() => void>()
let cached: string | null | undefined

function readRaw(): string | null {
  if (cached !== undefined) return cached
  try {
    cached = localStorage.getItem(KEY)
  } catch {
    cached = null
  }
  return cached
}

export function setLastMeal(at: Date | null) {
  cached = at ? at.toISOString() : null
  try {
    if (at) localStorage.setItem(KEY, cached!)
    else localStorage.removeItem(KEY)
  } catch {
    // Private mode: remembered for this session only.
  }
  listeners.forEach((l) => l())
}

/** The last meal noted on this device, ignored once it is over 12 h old. */
export function useLastMeal(now: Date): Date | null {
  const raw = useSyncExternalStore((l) => {
    listeners.add(l)
    return () => listeners.delete(l)
  }, readRaw)
  if (!raw) return null
  const at = new Date(raw)
  return now.getTime() - at.getTime() > 12 * 3_600_000 ? null : at
}
