import type { CompoundDetail } from '../schema'

/**
 * On-demand access to the full catalog entries (long texts, trials, references).
 *
 * The light registry in ./index.ts covers everything the screens read synchronously. The wiki
 * page needs the rest, which lives in ./entries.ts (a chunk of its own: nothing on the startup
 * path imports it). The chunk is fetched once, on first use, and every entry is served from
 * memory afterwards. It is precached by the service worker, so this also works offline.
 */

let entries: Promise<ReadonlyMap<string, CompoundDetail>> | undefined
let loaded: ReadonlyMap<string, CompoundDetail> | undefined

/** Starts (or joins) the load of the full catalog. A failed load can be retried. */
export function preloadCompoundDetails(): Promise<ReadonlyMap<string, CompoundDetail>> {
  entries ??= import('./entries').then(
    (module) => {
      loaded = module.DETAILS_BY_ID
      return module.DETAILS_BY_ID
    },
    (error: unknown) => {
      entries = undefined
      throw error
    },
  )
  return entries
}

/** The full entry, or undefined when the id is unknown. */
export async function loadCompoundDetail(id: string): Promise<CompoundDetail | undefined> {
  return (await preloadCompoundDetails()).get(id)
}

/** The full entry when the catalog has already been loaded, so a render can use it right away. */
export function cachedCompoundDetail(id: string): CompoundDetail | undefined {
  return loaded?.get(id)
}
