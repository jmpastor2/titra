import type { PkParams } from '@/domain/types'
import type { CompoundDetail, CompoundMeta } from '../schema'

/** The object without the keys whose value is undefined, so serialised output stays minimal. */
function compact<T extends object>(value: T): T {
  return Object.fromEntries(Object.entries(value).filter(([, v]) => v !== undefined)) as T
}

/** PK parameters without the free-text source and caveats (only the wiki page shows those). */
function pkNumbers(pk: PkParams): CompoundMeta['pk'] {
  const numbers = { ...pk }
  delete numbers.source
  delete numbers.notes
  return numbers
}

/**
 * The light projection of a full catalog entry: exactly the fields of `CompoundMeta`, nothing
 * else. The generated registry (meta.generated.ts) is built from this, so whatever is kept here
 * ships with the app at startup, and the rest only loads with the wiki page. Every key of
 * `CompoundMeta` has to be named below (the `satisfies` stops compiling when one is missing).
 */
export function toMeta(entry: CompoundDetail): CompoundMeta {
  const { pk, blend } = entry
  return compact({
    id: entry.id,
    names: entry.names,
    category: entry.category,
    pharmClass: entry.pharmClass,
    summary: entry.summary,
    evidence: entry.evidence,
    regulatory: compact({ us: entry.regulatory.us, eu: entry.regulatory.eu }),
    routes: entry.routes,
    defaultUnit: entry.defaultUnit,
    pk: pk && pkNumbers(pk),
    dosing: compact({ templateIds: entry.dosing.templateIds }),
    monitoring: entry.monitoring,
    tags: entry.tags,
    blend:
      blend &&
      compact({
        components: blend.components,
        presetId: blend.presetId,
        exampleDiluentMl: blend.exampleDiluentMl,
      }),
  } satisfies Record<keyof CompoundMeta, unknown>)
}
