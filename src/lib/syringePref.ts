import { useSyncExternalStore } from 'react'
import type { SyringeCapacity } from '@/domain/dosing/draw'

/** The insulin syringe this device's user injects with; 'auto' picks the smallest that fits. */
export type SyringePref = 'auto' | SyringeCapacity

const KEY = 'titra.syringe'
const listeners = new Set<() => void>()

function read(): SyringePref {
  try {
    const v = localStorage.getItem(KEY)
    return v === '30' || v === '50' || v === '100' ? (Number(v) as SyringeCapacity) : 'auto'
  } catch {
    return 'auto'
  }
}

let current: SyringePref = typeof window === 'undefined' ? 'auto' : read()

export function setSyringePref(next: SyringePref) {
  current = next
  try {
    localStorage.setItem(KEY, String(next))
  } catch {
    // Private mode: the choice lasts for this session.
  }
  listeners.forEach((l) => l())
}

export function useSyringePref(): SyringePref {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => current,
  )
}

/**
 * Barrel to draw: the user's own syringe when the dose fits in it, else the smallest
 * that does. `overflows` tells the UI the dose does not fit the user's syringe.
 */
export function barrelFor(
  pref: SyringePref,
  totalUnits: number,
  fallback: SyringeCapacity,
): { capacity: SyringeCapacity; overflows: boolean } {
  if (pref === 'auto') return { capacity: fallback, overflows: false }
  return totalUnits <= pref
    ? { capacity: pref, overflows: false }
    : { capacity: fallback, overflows: true }
}
