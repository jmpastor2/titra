import type { CompoundDetail } from '../schema'
import { BLENDS } from './blends'
import { COGNITIVE_LONGEVITY } from './cognitive-longevity'
import { GH_AXIS_EXTRA } from './gh-axis-extra'
import { GH_REPAIR_IMMUNE } from './gh-repair-immune'
import { GH_REPAIR_IMMUNE_2 } from './gh-repair-immune-2'
import { HORMONAL } from './hormonal'
import { INCRETINS } from './incretins'
import { INCRETINS_INVESTIGATIONAL } from './incretins-investigational'
import { INSULINS } from './insulins'
import { METABOLIC_SEXUAL_COGNITIVE_LONGEVITY } from './metabolic-sexual-cognitive-longevity'
import { METABOLIC_SEXUAL_OTHER } from './metabolic-sexual-other'
import { semaglutide } from './semaglutide'
import { tirzepatide } from './tirzepatide'

/**
 * The full catalog: every entry with its long texts, trials and references. This is the heavy
 * half (most of the content's bytes) and nothing on the startup path may import it: screens use
 * the light registry in ./index.ts, and the wiki page loads this module on demand through
 * ./detail.ts, so it ships as a lazy chunk (still precached by the service worker, so the wiki
 * works offline). The light registry (./meta.generated.ts) is generated from these entries.
 *
 * Category files are authored separately and merged here, in the order the app lists them.
 */
export const SUBSTANCE_DETAILS: readonly CompoundDetail[] = [
  semaglutide,
  tirzepatide,
  ...INCRETINS,
  ...INCRETINS_INVESTIGATIONAL,
  ...INSULINS,
  ...HORMONAL,
  ...GH_REPAIR_IMMUNE,
  ...GH_REPAIR_IMMUNE_2,
  ...GH_AXIS_EXTRA,
  ...METABOLIC_SEXUAL_COGNITIVE_LONGEVITY,
  ...COGNITIVE_LONGEVITY,
  ...METABOLIC_SEXUAL_OTHER,
]

/** Premixed blend vials: wiki pages in their own right, but not substances. */
export const BLEND_DETAILS: readonly CompoundDetail[] = BLENDS

export const DETAILS_BY_ID: ReadonlyMap<string, CompoundDetail> = new Map(
  [...SUBSTANCE_DETAILS, ...BLEND_DETAILS].map((entry) => [entry.id, entry]),
)
