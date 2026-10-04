import { useEffect, useRef } from 'react'
import { useBlocker, type Blocker } from 'react-router-dom'

/**
 * Holds the person on the page while there are unsaved changes: in-app navigation (the back
 * button, the iOS swipe, a tab) waits for a decision, and closing the tab asks first.
 * `allow()` lets the next navigation through, for leaving after a successful save.
 */
export function useUnsavedGuard(dirty: boolean): { blocker: Blocker; allow: () => void } {
  const skip = useRef(false)
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      dirty && !skip.current && currentLocation.pathname !== nextLocation.pathname,
  )

  useEffect(() => {
    if (!dirty) return
    const warn = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

  return {
    blocker,
    allow: () => {
      skip.current = true
    },
  }
}
