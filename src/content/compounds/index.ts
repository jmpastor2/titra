import type { CompoundCategory } from '@/domain/types'
import type { CompoundEntry } from '../schema'
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
 * Registry of all wiki entries. Category files are authored separately and
 * merged here; `byId` is the lookup used across the app.
 */
export const COMPOUNDS: readonly CompoundEntry[] = [
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

export { BLENDS, EVIDENCE_ORDER, weakestEvidence } from './blends'

/**
 * Everything with a wiki page: substances plus premixed blends. Blends stay out of
 * COMPOUNDS (and so out of the substance pickers) because protocols and inventory
 * store their components, not the blend.
 */
export const WIKI_ENTRIES: readonly CompoundEntry[] = [...COMPOUNDS, ...BLENDS]

const index = new Map(WIKI_ENTRIES.map((c) => [c.id, c]))

export function compoundById(id: string): CompoundEntry | undefined {
  return index.get(id)
}

export function compoundName(id: string): string {
  return index.get(id)?.names.generic ?? id
}

export const CATEGORY_ORDER: readonly CompoundCategory[] = [
  'incretin',
  'insulin',
  'hormonal',
  'gh_axis',
  'repair',
  'metabolic',
  'immune',
  'sexual',
  'cognitive',
  'longevity',
  'other',
]

/** Compounds whose PK can drive the exposure engine. */
export const PK_COMPOUNDS: readonly CompoundEntry[] = COMPOUNDS.filter((c) => c.pk)

/** Blends that contain this compound, in registry order. */
export function blendsContaining(compoundId: string): CompoundEntry[] {
  return BLENDS.filter((b) => b.blend?.components.some((p) => p.compoundId === compoundId))
}

/** Case/diacritic-insensitive search over names, brands, aliases, class and tags. */
export function searchCompounds(query: string, category?: CompoundCategory): CompoundEntry[] {
  return search(COMPOUNDS, query, category)
}

/** Wiki search: substances and blends; `'blends'` narrows to blends only. */
export function searchWiki(query: string, filter?: CompoundCategory | 'blends'): CompoundEntry[] {
  if (filter === 'blends') return search(BLENDS, query)
  return search(WIKI_ENTRIES, query, filter)
}

function search(
  entries: readonly CompoundEntry[],
  query: string,
  category?: CompoundCategory,
): CompoundEntry[] {
  const q = normalize(query)
  return entries
    .filter((c) => {
      if (category && c.category !== category) return false
      if (!q) return true
      const hay = normalize(
        [
          c.names.generic,
          ...c.names.brands,
          ...c.names.aliases,
          c.id,
          c.pharmClass.es,
          c.pharmClass.en,
          ...c.tags,
        ].join(' '),
      )
      return hay.includes(q)
    })
    .toSorted((a, b) => a.names.generic.localeCompare(b.names.generic))
}

function normalize(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
}
