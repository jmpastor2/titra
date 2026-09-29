import { DEFAULT_ROTATION, type SiteUse } from './catalog'
import { rankSites } from './rotation'

export { DEFAULT_ROTATION, INJECTION_SITES, isKnownSite, siteById, type SiteUse } from './catalog'

export interface SiteSuggestion {
  siteId: string
  /** True when even the best candidate was used within `minGapDays`. */
  tooRecent: boolean
  lastUsedAt: Date | null
}

/**
 * Suggest the next site among the enabled rotation: the top of `rankSites`, i.e. the
 * least recently used site, never one used earlier the same day, nudged to the other
 * side or region after a recent shot. Ties (never used) are broken by rotation order.
 */
export function suggestNextSite(
  history: readonly SiteUse[],
  rotation: readonly string[] = DEFAULT_ROTATION,
  now: Date = new Date(),
  // Daily protocols cycle six sites in under a week; three days apart is the useful alarm.
  minGapDays = 3,
): SiteSuggestion | null {
  const best = rankSites(history, now, { candidates: rotation, minRestHours: minGapDays * 24 })[0]
  if (!best) return null
  return { siteId: best.siteId, tooRecent: best.resting, lastUsedAt: best.lastUsedAt }
}

/** Per-site usage counts (raw rows). */
export function siteUsage(history: readonly SiteUse[]): Record<string, number> {
  const out: Record<string, number> = {}
  for (const h of history) out[h.siteId] = (out[h.siteId] ?? 0) + 1
  return out
}
