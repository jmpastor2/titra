import { useCallback, useEffect, useReducer, useState } from 'react'
import { cachedCompoundDetail, loadCompoundDetail } from '@/content/compounds'
import type { CompoundDetail } from '@/content/schema'

/**
 * The full catalog entry (long texts, trials, references) of a compound, which is not part of
 * the startup bundle: it loads on demand and is kept in memory afterwards. `detail` is
 * undefined while it loads, and the very first render already has it when an earlier visit
 * (or the wiki list's idle preload) fetched it. A failed load can be retried.
 */
export function useCompoundDetail(id: string | undefined): {
  detail: CompoundDetail | undefined
  failed: boolean
  retry: () => void
} {
  // The loader keeps what it loaded; a settled load only needs to wake the component up.
  const [, wake] = useReducer((n: number) => n + 1, 0)
  const [failedId, setFailedId] = useState<string>()
  const detail = id ? cachedCompoundDetail(id) : undefined

  const load = useCallback((target: string) => {
    loadCompoundDetail(target).then(
      () => wake(),
      () => setFailedId(target),
    )
  }, [])

  useEffect(() => {
    if (id && !detail) load(id)
  }, [id, detail, load])

  return {
    detail,
    failed: failedId !== undefined && failedId === id && !detail,
    retry: () => {
      setFailedId(undefined)
      if (id) load(id)
    },
  }
}
