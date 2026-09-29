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
  { id: 'thigh_l', labelKey: 'thigh_l', region: 'thigh', side: 'left' },
  { id: 'thigh_r', labelKey: 'thigh_r', region: 'thigh', side: 'right' },
  { id: 'arm_l', labelKey: 'arm_l', region: 'arm', side: 'left' },
  { id: 'arm_r', labelKey: 'arm_r', region: 'arm', side: 'right' },
  { id: 'glute_l', labelKey: 'glute_l', region: 'glute', side: 'left' },
  { id: 'glute_r', labelKey: 'glute_r', region: 'glute', side: 'right' },
]

/** Sites a person can comfortably reach alone: abdomen quadrants and thighs. */
export const DEFAULT_ROTATION: readonly string[] = [
  'abd_ul',
  'abd_ur',
  'thigh_l',
  'thigh_r',
  'abd_ll',
  'abd_lr',
]

const byId = new Map(INJECTION_SITES.map((s) => [s.id, s]))

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
