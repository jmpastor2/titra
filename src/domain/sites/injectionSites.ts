import type { InjectionSite } from '../types'

/** Canonical subcutaneous injection sites. Labels come from i18n `sites.<id>`. */
export const INJECTION_SITES: readonly InjectionSite[] = [
  { id: 'abd_ul', labelKey: 'abd_ul', region: 'abdomen', side: 'left' },
  { id: 'abd_ur', labelKey: 'abd_ur', region: 'abdomen', side: 'right' },
  { id: 'abd_ll', labelKey: 'abd_ll', region: 'abdomen', side: 'left' },
  { id: 'abd_lr', labelKey: 'abd_lr', region: 'abdomen', side: 'right' },
  { id: 'thigh_l', labelKey: 'thigh_l', region: 'thigh', side: 'left' },
  { id: 'thigh_r', labelKey: 'thigh_r', region: 'thigh', side: 'right' },
  { id: 'arm_l', labelKey: 'arm_l', region: 'arm', side: 'left' },
  { id: 'arm_r', labelKey: 'arm_r', region: 'arm', side: 'right' },
  { id: 'glute_l', labelKey: 'glute_l', region: 'glute', side: 'left' },
  { id: 'glute_r', labelKey: 'glute_r', region: 'glute', side: 'right' },
]

export const DEFAULT_ROTATION: readonly string[] = [
  'abd_ul',
  'abd_ur',
  'thigh_l',
  'thigh_r',
  'abd_ll',
  'abd_lr',
]

export interface SiteUse {
  siteId: string
  at: Date
}

export interface SiteSuggestion {
  siteId: string
  /** True when even the best candidate was used within `minGapDays`. */
  tooRecent: boolean
  lastUsedAt: Date | null
}

/**
 * Suggest the next site: the least recently used among the enabled rotation.
 * Ties (never used) are broken by rotation order.
 */
export function suggestNextSite(
  history: readonly SiteUse[],
  rotation: readonly string[] = DEFAULT_ROTATION,
  now: Date = new Date(),
  minGapDays = 7,
): SiteSuggestion | null {
  if (rotation.length === 0) return null
  const lastUse = new Map<string, number>()
  for (const h of history) {
    const prev = lastUse.get(h.siteId) ?? Number.NEGATIVE_INFINITY
    if (h.at.getTime() > prev) lastUse.set(h.siteId, h.at.getTime())
  }
  let best: string | null = null
  let bestTime = Number.POSITIVE_INFINITY
  for (const id of rotation) {
    const t = lastUse.get(id) ?? Number.NEGATIVE_INFINITY
    if (t < bestTime) {
      bestTime = t
      best = id
    }
  }
  if (best === null) return null
  const used = Number.isFinite(bestTime)
  return {
    siteId: best,
    tooRecent: used && now.getTime() - bestTime < minGapDays * 86_400_000,
    lastUsedAt: used ? new Date(bestTime) : null,
  }
}

/** Per-site usage counts, for the heat map. */
export function siteUsage(history: readonly SiteUse[]): Record<string, number> {
  const out: Record<string, number> = {}
  for (const h of history) out[h.siteId] = (out[h.siteId] ?? 0) + 1
  return out
}
