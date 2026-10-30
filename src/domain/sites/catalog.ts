import type { InjectionSite } from '../types'

/**
 * Canonical subcutaneous injection sites. Labels come from i18n `sites.labels.<id>`.
 * The ids are persisted on every dose row as `site_id`: never rename them.
 */
export const INJECTION_SITES: readonly InjectionSite[] = [
  { id: 'abd_ul', labelKey: 'abd_ul', region: 'abdomen', side: 'left' },
  { id: 'abd_ur', labelKey: 'abd_ur', region: 'abdomen', side: 'right' },
  { id: 'abd_ll', labelKey: 'abd_ll', region: 'abdomen', side: 'left' },
  { id: 'abd_lr', labelKey: 'abd_lr', region: 'abdomen', side: 'right' },
  // Beside the navel, a hand's width out: the side of the belly, before the flank.
  { id: 'abd_sl', labelKey: 'abd_sl', region: 'abdomen', side: 'left' },
  { id: 'abd_sr', labelKey: 'abd_sr', region: 'abdomen', side: 'right' },
  // Front of the thigh, upper half; then its outer side, lower down.
  { id: 'thigh_l', labelKey: 'thigh_l', region: 'thigh', side: 'left' },
  { id: 'thigh_r', labelKey: 'thigh_r', region: 'thigh', side: 'right' },
  { id: 'thigh_ol', labelKey: 'thigh_ol', region: 'thigh', side: 'left' },
  { id: 'thigh_or', labelKey: 'thigh_or', region: 'thigh', side: 'right' },
  { id: 'arm_l', labelKey: 'arm_l', region: 'arm', side: 'left' },
  { id: 'arm_r', labelKey: 'arm_r', region: 'arm', side: 'right' },
  // The love handles, at the back of the waist above the glutes.
  { id: 'flank_l', labelKey: 'flank_l', region: 'flank', side: 'left' },
  { id: 'flank_r', labelKey: 'flank_r', region: 'flank', side: 'right' },
  { id: 'glute_l', labelKey: 'glute_l', region: 'glute', side: 'left' },
  { id: 'glute_r', labelKey: 'glute_r', region: 'glute', side: 'right' },
]

export type SiteZone = Exclude<InjectionSite['region'], 'other'>

/** The zones a person can switch on, easiest to reach alone first, and the side of the body they are on. */
export const ZONES: readonly { zone: SiteZone; view: 'front' | 'back' }[] = [
  { zone: 'abdomen', view: 'front' },
  { zone: 'thigh', view: 'front' },
  { zone: 'flank', view: 'back' },
  { zone: 'glute', view: 'back' },
  { zone: 'arm', view: 'back' },
]

/** Abdomen and thighs: what anyone reaches alone, and where the labels of most peptides point. */
export const DEFAULT_ZONES: readonly SiteZone[] = ['abdomen', 'thigh']

/**
 * Tie-break order of the whole catalogue: it alternates sides and zones, so with no history
 * the rotation already spreads (abdomen, thigh, abdomen…).
 */
const ROTATION_ORDER: readonly string[] = [
  'abd_ul',
  'abd_ur',
  'thigh_l',
  'thigh_r',
  'abd_ll',
  'abd_lr',
  'flank_l',
  'flank_r',
  'abd_sl',
  'abd_sr',
  'thigh_ol',
  'thigh_or',
  'glute_l',
  'glute_r',
  'arm_l',
  'arm_r',
]

const byId = new Map(INJECTION_SITES.map((s) => [s.id, s]))

/** The points of the zones switched on, in rotation order. */
export function rotationFor(zones: readonly SiteZone[]): string[] {
  return ROTATION_ORDER.filter((id) => zones.includes(byId.get(id)!.region as SiteZone))
}

/** The points of one zone, in catalogue order. */
export function zoneSites(zone: SiteZone): InjectionSite[] {
  return INJECTION_SITES.filter((s) => s.region === zone)
}

/** Sites a person can comfortably reach alone: the default zones' points. */
export const DEFAULT_ROTATION: readonly string[] = rotationFor(DEFAULT_ZONES)

/** Catalogue entry for an id; unknown ids (legacy or custom) get a neutral stand-in. */
export function siteById(id: string): InjectionSite {
  return byId.get(id) ?? { id, labelKey: id, region: 'other', side: 'center' }
}

export function isKnownSite(id: string): boolean {
  return byId.has(id)
}

/** One logged use of a site. A blend in one syringe arrives as several uses at one time. */
export interface SiteUse {
  siteId: string
  at: Date
  compoundId?: string
}
