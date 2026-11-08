import { useSyncExternalStore } from 'react'
import { DEFAULT_ZONES, ZONES, type SiteZone } from '@/domain/sites/catalog'

/**
 * The zones this device's user injects into; the rotation only suggests their points. v2: the
 * choice saved before every zone was on by default is dropped, so the new zones reach it.
 */
const KEY = 'titra.siteZones.v2'
const listeners = new Set<() => void>()
const KNOWN = new Set<string>(ZONES.map((z) => z.zone))

function read(): readonly SiteZone[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(KEY) ?? 'null')
    if (!Array.isArray(parsed)) return DEFAULT_ZONES
    const zones = parsed.filter((z): z is SiteZone => typeof z === 'string' && KNOWN.has(z))
    return zones.length > 0 ? zones : DEFAULT_ZONES
  } catch {
    return DEFAULT_ZONES
  }
}

let current: readonly SiteZone[] = typeof window === 'undefined' ? DEFAULT_ZONES : read()

/** At least one zone stays on: a rotation with no points could not suggest anything. */
export function setSiteZones(next: readonly SiteZone[]) {
  if (next.length === 0) return
  // Kept in the catalogue's order, so the same choice always reads the same.
  current = ZONES.map((z) => z.zone).filter((z) => next.includes(z))
  try {
    localStorage.setItem(KEY, JSON.stringify(current))
  } catch {
    // Private mode: the choice lasts for this session.
  }
  listeners.forEach((l) => l())
}

export function useSiteZones(): readonly SiteZone[] {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => current,
  )
}
