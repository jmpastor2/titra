/**
 * Water for the Registro rápido: one measurement row (`hydration_ml`) per tap, summed per
 * day, against a daily goal that lives on this device. Pure apart from the goal store; see
 * water.test.ts.
 */
import { useSyncExternalStore } from 'react'
import { fmtNumber, type Locale } from '@/lib/format'

export const DEFAULT_GOAL_ML = 2500
export const GOAL_MIN_ML = 500
export const GOAL_MAX_ML = 6000
export const GOAL_STEP_ML = 250
/** What the one-tap amounts add. The tile's tap is the first. */
export const WATER_ADDS: readonly number[] = [250, 500]

const KEY = 'titra.waterGoalMl'
const listeners = new Set<() => void>()
/** Where the goal lives when storage is unavailable (private mode). */
let session: number | null = null

export function clampGoal(ml: number): number {
  if (!Number.isFinite(ml)) return DEFAULT_GOAL_ML
  const stepped = Math.round(ml / 50) * 50
  return Math.min(GOAL_MAX_ML, Math.max(GOAL_MIN_ML, stepped))
}

function readGoal(): number {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw !== null) return clampGoal(Number(raw))
  } catch {
    // Unreadable storage: fall through to the session value.
  }
  return session ?? DEFAULT_GOAL_ML
}

export function setWaterGoal(ml: number) {
  const goal = clampGoal(ml)
  try {
    localStorage.setItem(KEY, String(goal))
    session = null
  } catch {
    session = goal
  }
  listeners.forEach((l) => l())
}

/** The daily water goal in ml, shared by every screen on this device. */
export function useWaterGoal(): number {
  return useSyncExternalStore((l) => {
    listeners.add(l)
    return () => listeners.delete(l)
  }, readGoal)
}

/** 1,25 L from 1250 ml; 750 ml below a litre. */
export function fmtVolume(ml: number, locale: Locale): string {
  return ml >= 1000 ? `${fmtNumber(ml / 1000, locale, 2)} L` : `${fmtNumber(ml, locale, 0)} ml`
}

/** The number alone and its unit, for tiles that style them apart. */
export function splitVolume(ml: number, locale: Locale): { value: string; unit: string } {
  return ml >= 1000
    ? { value: fmtNumber(ml / 1000, locale, 2), unit: 'L' }
    : { value: fmtNumber(ml, locale, 0), unit: 'ml' }
}
