/**
 * Injection-site rotation. Pure functions: callers pass `now`, all calendar maths is
 * local time via date-fns.
 *
 * The model, in "hours of rest" units so every term is comparable:
 *
 *   score = hours since last use            (never used counts as a year)
 *         − 1000 if still resting           (< minRestHours, default 72 h)
 *         − 1000 if already used today      (second shot of the morning)
 *         − side / region balance           (recent shots on the same side or region)
 *         − load                            (earlier uses in the last 14 days)
 *         − same-compound                   (the site this substance went to last time)
 *
 * The two tier penalties dwarf the soft terms, so a rested site always beats a resting
 * one and a site used earlier today is always last; the soft terms only reorder
 * near-ties, e.g. picking the right side after a left-side shot.
 */
import { addDays, isSameDay, startOfDay } from 'date-fns'
import type { InjectionSite } from '../types'
import { DEFAULT_ROTATION, INJECTION_SITES, siteById, type SiteUse } from './catalog'

const HOUR = 3_600_000

/** Recommended minimum gap before reusing a site. */
export const DEFAULT_MIN_REST_HOURS = 72
/** Uses within this many days count as load and appear on the timeline. */
export const RECENT_DAYS = 14
/** Beyond this a site reads as fully rested on the map. */
export const RESTED_HOURS = 7 * 24

/** Rows closer than this at the same site are one injection (a blend, or a split dose). */
const SAME_INJECTION_MS = 15 * 60_000
const NEVER_USED_HOURS = 365 * 24
const TIER_PENALTY = 1000
/** Shots in the last 48 h push the next one to the other side / region. */
const BALANCE_WINDOW_HOURS = 48
const SIDE_WEIGHT = 12
const REGION_WEIGHT = 8
const LOAD_WEIGHT = 6
const SAME_COMPOUND_WEIGHT = 24

/** One injection: uses merged when they share a site and a moment. */
export interface SiteInjection {
  siteId: string
  at: Date
  compoundIds: readonly string[]
}

/** Recency bands for the map, freshest first. */
export type SiteHeat = 'hot' | 'warm' | 'cool' | 'rested' | 'never'

export interface SiteStatus {
  siteId: string
  site: InjectionSite
  lastUsedAt: Date | null
  /** Substances injected at the last use (several for a blend). */
  lastCompoundIds: readonly string[]
  /** Hours since the last use, never negative; null when never used. */
  hoursSince: number | null
  /** Last use + minimum rest; null when never used. */
  restUntil: Date | null
  /** Still inside the minimum rest window. */
  resting: boolean
  /** Used on the same calendar day as `now`. */
  usedToday: boolean
  /** Injections in the last 14 days. */
  recentUses: number
  heat: SiteHeat
}

export type SiteReason =
  | { kind: 'never' }
  | { kind: 'rested'; days: number }
  | { kind: 'recent'; hours: number }
  | { kind: 'today'; hours: number }

export interface RankedSite extends SiteStatus {
  score: number
  reason: SiteReason
  /** How this site spreads the rotation relative to the latest recent shot. */
  balance: 'otherSide' | 'otherRegion' | null
  /** The site the given compound was injected into last time. */
  lastForCompound: boolean
}

export interface RotationOptions {
  /** Sites eligible for a suggestion, in tie-break order. Default: the self-injection rotation. */
  candidates?: readonly string[]
  /** Substance about to be injected: avoids repeating its previous site. */
  compoundId?: string
  minRestHours?: number
}

/** Merge rows into injections (a blend is logged as one row per substance), newest first. */
export function toInjections(history: readonly SiteUse[]): SiteInjection[] {
  const sorted = history
    .filter((h) => h.siteId && !Number.isNaN(h.at.getTime()))
    .toSorted((a, b) => b.at.getTime() - a.at.getTime())
  const out: { siteId: string; at: Date; compoundIds: string[] }[] = []
  for (const h of sorted) {
    const merge = out.find(
      (o) =>
        o.siteId === h.siteId && Math.abs(o.at.getTime() - h.at.getTime()) <= SAME_INJECTION_MS,
    )
    if (merge) {
      if (h.compoundId && !merge.compoundIds.includes(h.compoundId)) {
        merge.compoundIds.push(h.compoundId)
      }
    } else {
      out.push({ siteId: h.siteId, at: h.at, compoundIds: h.compoundId ? [h.compoundId] : [] })
    }
  }
  return out
}

/** Hours between two instants, clamped at 0 (a use logged after `now` counts as just now). */
function ageHours(at: Date, now: Date): number {
  return Math.max(0, (now.getTime() - at.getTime()) / HOUR)
}

export function heatFor(
  hoursSince: number | null,
  minRestHours = DEFAULT_MIN_REST_HOURS,
): SiteHeat {
  if (hoursSince === null) return 'never'
  if (hoursSince < 24) return 'hot'
  if (hoursSince < minRestHours) return 'warm'
  if (hoursSince < RESTED_HOURS) return 'cool'
  return 'rested'
}

function statusFrom(
  siteId: string,
  mine: readonly SiteInjection[],
  now: Date,
  minRestHours: number,
): SiteStatus {
  const last = mine[0]
  const recentFrom = now.getTime() - RECENT_DAYS * 24 * HOUR
  if (!last) {
    return {
      siteId,
      site: siteById(siteId),
      lastUsedAt: null,
      lastCompoundIds: [],
      hoursSince: null,
      restUntil: null,
      resting: false,
      usedToday: false,
      recentUses: 0,
      heat: 'never',
    }
  }
  const hoursSince = ageHours(last.at, now)
  return {
    siteId,
    site: siteById(siteId),
    lastUsedAt: last.at,
    lastCompoundIds: last.compoundIds,
    hoursSince,
    restUntil: new Date(last.at.getTime() + minRestHours * HOUR),
    resting: hoursSince < minRestHours,
    usedToday: isSameDay(last.at, now) || last.at > now,
    recentUses: mine.filter((i) => i.at.getTime() >= recentFrom).length,
    heat: heatFor(hoursSince, minRestHours),
  }
}

function groupBySite(injections: readonly SiteInjection[]): Map<string, SiteInjection[]> {
  const m = new Map<string, SiteInjection[]>()
  for (const i of injections) {
    const list = m.get(i.siteId)
    if (list) list.push(i)
    else m.set(i.siteId, [i])
  }
  return m
}

/**
 * Recency status of every site: the catalogue first, in its order, then any other id
 * found in the history (so legacy ids never vanish from the dashboard).
 */
export function siteStatuses(
  history: readonly SiteUse[],
  now: Date,
  minRestHours = DEFAULT_MIN_REST_HOURS,
): SiteStatus[] {
  const bySite = groupBySite(toInjections(history))
  const ids = INJECTION_SITES.map((s) => s.id)
  for (const id of bySite.keys()) if (!ids.includes(id)) ids.push(id)
  return ids.map((id) => statusFrom(id, bySite.get(id) ?? [], now, minRestHours))
}

function reasonFor(s: SiteStatus): SiteReason {
  if (s.hoursSince === null) return { kind: 'never' }
  if (s.usedToday) return { kind: 'today', hours: s.hoursSince }
  if (s.resting) return { kind: 'recent', hours: s.hoursSince }
  return { kind: 'rested', days: Math.floor(s.hoursSince / 24) }
}

/**
 * Rank the candidate sites, best first. Ties keep candidate order, so with no history
 * the result is the rotation itself.
 */
export function rankSites(
  history: readonly SiteUse[],
  now: Date,
  options: RotationOptions = {},
): RankedSite[] {
  const {
    candidates = DEFAULT_ROTATION,
    compoundId,
    minRestHours = DEFAULT_MIN_REST_HOURS,
  } = options
  const injections = toInjections(history)
  const bySite = groupBySite(injections)

  // Recent shots anywhere, weighted 1 → 0 over the balance window.
  const recent = injections.flatMap((i) => {
    const w = 1 - ageHours(i.at, now) / BALANCE_WINDOW_HOURS
    return w > 0 ? [{ site: siteById(i.siteId), w }] : []
  })
  const latest = recent[0]?.site
  const lastCompoundSite = compoundId
    ? injections.find((i) => i.compoundIds.includes(compoundId))?.siteId
    : undefined

  const ranked = [...new Set(candidates)].map((id, order) => {
    const mine = bySite.get(id) ?? []
    const status = statusFrom(id, mine, now, minRestHours)
    const { site } = status

    let balancePenalty = 0
    for (const r of recent) {
      if (site.side !== 'center' && r.site.side === site.side) balancePenalty += r.w * SIDE_WEIGHT
      if (r.site.region === site.region) balancePenalty += r.w * REGION_WEIGHT
    }
    // Every use in the last two weeks except the latest (already counted as recency).
    let load = 0
    for (const i of mine.slice(1)) {
      const w = 1 - ageHours(i.at, now) / (RECENT_DAYS * 24)
      if (w > 0) load += w * LOAD_WEIGHT
    }
    const lastForCompound = lastCompoundSite === id
    const score =
      (status.hoursSince ?? NEVER_USED_HOURS) -
      (status.resting ? TIER_PENALTY : 0) -
      (status.usedToday ? TIER_PENALTY : 0) -
      balancePenalty -
      load -
      (lastForCompound ? SAME_COMPOUND_WEIGHT : 0)

    let balance: RankedSite['balance'] = null
    if (latest && latest.id !== id) {
      if (site.side !== 'center' && latest.side !== 'center' && latest.side !== site.side) {
        balance = 'otherSide'
      } else if (latest.region !== site.region) {
        balance = 'otherRegion'
      }
    }
    const entry: RankedSite = Object.assign(status, {
      score,
      reason: reasonFor(status),
      balance,
      lastForCompound,
    })
    return { ranked: entry, order }
  })

  return ranked
    .toSorted((a, b) => b.ranked.score - a.ranked.score || a.order - b.order)
    .map((r) => r.ranked)
}

export interface SiteDay {
  /** Local midnight. */
  date: Date
  injections: readonly SiteInjection[]
}

/** The last `days` calendar days ending today (oldest first) with their injections. */
export function siteTimeline(
  history: readonly SiteUse[],
  now: Date,
  days = RECENT_DAYS,
): SiteDay[] {
  const injections = toInjections(history)
  const first = startOfDay(addDays(now, -(days - 1)))
  return Array.from({ length: days }, (_, i) => {
    const date = addDays(first, i)
    return {
      date,
      injections: injections.filter((inj) => isSameDay(inj.at, date)).toReversed(),
    }
  })
}

/** Compact age readout for a map spot: "5h", "3d". Empty when never used. */
export function ageShort(hoursSince: number | null): string {
  if (hoursSince === null) return ''
  if (hoursSince < 24) return `${Math.max(0, Math.floor(hoursSince))}h`
  const d = Math.floor(hoursSince / 24)
  return d > 99 ? '99d' : `${d}d`
}

/**
 * Dashboard order: sites ready to use, longest rested first; then the resting ones,
 * soonest free first; never-used sites last (they are usually the hard-to-reach ones).
 */
export function byRest(statuses: readonly SiteStatus[]): SiteStatus[] {
  return statuses.toSorted(
    (a, b) =>
      restGroup(a) - restGroup(b) ||
      (a.lastUsedAt?.getTime() ?? 0) - (b.lastUsedAt?.getTime() ?? 0),
  )
}

const restGroup = (s: SiteStatus) => (s.lastUsedAt === null ? 2 : s.resting ? 1 : 0)
