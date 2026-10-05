import type { CompoundCategory } from '@/domain/types'
import type { CompoundMeta } from '../schema'
import { BLEND_META, SUBSTANCE_META } from './meta.generated'

export { EVIDENCE_ORDER, weakestEvidence } from './evidence'
export { cachedCompoundDetail, loadCompoundDetail, preloadCompoundDetails } from './detail'

/**
 * Registry of all wiki entries, in the light form every screen reads synchronously. It is
 * generated from the full entries (npm run content:meta, see toMeta.ts); the long texts, trials
 * and references load on demand with `loadCompoundDetail`.
 */
export const COMPOUNDS: readonly CompoundMeta[] = SUBSTANCE_META

/** Premixed blend vials: wiki pages in their own right, but not substances. */
export const BLENDS: readonly CompoundMeta[] = BLEND_META

/**
 * Everything with a wiki page: substances plus premixed blends. Blends stay out of
 * COMPOUNDS (and so out of the substance pickers) because protocols and inventory
 * store their components, not the blend.
 */
export const WIKI_ENTRIES: readonly CompoundMeta[] = [...COMPOUNDS, ...BLENDS]

const index = new Map(WIKI_ENTRIES.map((c) => [c.id, c]))

export function compoundById(id: string): CompoundMeta | undefined {
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
export const PK_COMPOUNDS: readonly CompoundMeta[] = COMPOUNDS.filter((c) => c.pk)

/** Blends that contain this compound, in registry order. */
export function blendsContaining(compoundId: string): CompoundMeta[] {
  return BLENDS.filter((b) => b.blend?.components.some((p) => p.compoundId === compoundId))
}

/** Case/diacritic-insensitive search over names, brands, aliases, class and tags. */
export function searchCompounds(query: string, category?: CompoundCategory): CompoundMeta[] {
  return search(COMPOUNDS, query, category)
}

/** Wiki search: substances and blends; `'blends'` narrows to blends only. */
export function searchWiki(query: string, filter?: CompoundCategory | 'blends'): CompoundMeta[] {
  if (filter === 'blends') return search(BLENDS, query)
  return search(WIKI_ENTRIES, query, filter)
}

function search(
  entries: readonly CompoundMeta[],
  query: string,
  category?: CompoundCategory,
): CompoundMeta[] {
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
