import { useCallback, useEffect, useRef, useState } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'

/**
 * Looking for a new version of the app by hand. The service worker already checks for itself
 * (and `UpdatePrompt` applies what it finds); this is the "check now" of the settings screen:
 * ask the worker for an update, say whether there is one and apply it the same way.
 */
export type UpdatePhase =
  /** Nothing asked yet. */
  | 'idle'
  | 'checking'
  | 'upToDate'
  | 'available'
  /** No service worker here (dev server, private mode, old browser): nothing to update. */
  | 'unsupported'
  | 'error'

/** What a registration says once an update check has finished. */
export type CheckOutcome = 'available' | 'installing' | 'upToDate'

export function outcomeOf(
  reg: Pick<ServiceWorkerRegistration, 'installing' | 'waiting'>,
): CheckOutcome {
  if (reg.waiting) return 'available'
  if (reg.installing) return 'installing'
  return 'upToDate'
}

/** How long a new worker may take to download the new files before the check gives up. */
const INSTALL_TIMEOUT_MS = 25_000
/** If the page has not been replaced this long after applying, reload it by hand. */
const RELOAD_FALLBACK_MS = 4_000

/** Resolves when a worker that was found installing has its files (a new version is ready). */
export function installed(
  worker: Pick<ServiceWorker, 'state' | 'addEventListener' | 'removeEventListener'>,
  timeoutMs = INSTALL_TIMEOUT_MS,
): Promise<'available' | 'error'> {
  return new Promise((resolve) => {
    const finish = (value: 'available' | 'error') => {
      clearTimeout(timer)
      worker.removeEventListener('statechange', onChange)
      resolve(value)
    }
    const onChange = () => {
      if (worker.state === 'redundant') finish('error')
      else if (worker.state !== 'installing' && worker.state !== 'parsed') finish('available')
    }
    const timer = setTimeout(() => finish('error'), timeoutMs)
    worker.addEventListener('statechange', onChange)
    onChange()
  })
}

const hasWorker = () => typeof navigator !== 'undefined' && 'serviceWorker' in navigator

export function useAppUpdate({
  reload = () => window.location.reload(),
}: {
  /** What replaces the page once the new version is applied; the tests swap it. */
  reload?: () => void
} = {}) {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW()
  const [phase, setPhase] = useState<UpdatePhase>(() => (hasWorker() ? 'idle' : 'unsupported'))
  const [checkedAt, setCheckedAt] = useState<Date | null>(null)
  const [applying, setApplying] = useState(false)
  const alive = useRef(true)
  useEffect(() => {
    alive.current = true
    return () => {
      alive.current = false
    }
  }, [])

  // Without a registered worker there is nothing to ask: say so before the person has to try.
  useEffect(() => {
    if (!hasWorker()) return
    void navigator.serviceWorker
      .getRegistration()
      .then((reg) => {
        if (alive.current && !reg) setPhase('unsupported')
      })
      .catch(() => undefined)
  }, [])

  const check = useCallback(async () => {
    if (!hasWorker()) {
      setPhase('unsupported')
      return
    }
    setPhase('checking')
    try {
      const reg = await navigator.serviceWorker.getRegistration()
      if (!reg) {
        if (alive.current) setPhase('unsupported')
        return
      }
      await reg.update()
      let outcome: CheckOutcome | 'error' = outcomeOf(reg)
      if (outcome === 'installing' && reg.installing) outcome = await installed(reg.installing)
      if (!alive.current) return
      setCheckedAt(new Date())
      setPhase(outcome === 'error' ? 'error' : outcome === 'upToDate' ? 'upToDate' : 'available')
    } catch {
      // Offline, or the server did not answer: the check did not happen, which is not "up to date".
      if (alive.current) setPhase('error')
    }
  }, [])

  const apply = useCallback(async () => {
    setApplying(true)
    try {
      const reg = await navigator.serviceWorker.getRegistration()
      if (needRefresh || reg?.waiting) {
        // Same as the banner: the waiting worker takes over and the page reloads under it.
        await updateServiceWorker(true)
        setTimeout(reload, RELOAD_FALLBACK_MS)
      } else {
        reload()
      }
    } catch {
      if (alive.current) {
        setApplying(false)
        setPhase('error')
      }
    }
  }, [needRefresh, updateServiceWorker, reload])

  return {
    phase: needRefresh ? ('available' as const) : phase,
    checkedAt,
    applying,
    check,
    apply,
  }
}
