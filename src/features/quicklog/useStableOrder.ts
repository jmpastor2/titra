import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Keeps a list from shuffling under a finger. The first order once `ready` is shown at
 * once; a later one waits until the person has stopped tapping for `holdMs`, so a tile
 * never jumps away between two taps. Call `touch` on every interaction.
 */
export function useStableOrder<T extends string>(
  target: readonly T[],
  ready: boolean,
  holdMs = 1600,
): { order: readonly T[]; touch: () => void } {
  const [shown, setShown] = useState<readonly T[] | null>(null)
  const lastTouch = useRef(Number.NEGATIVE_INFINITY)
  const latest = useRef(target)
  useEffect(() => {
    latest.current = target
  })
  const key = target.join('|')

  const touch = useCallback(() => {
    lastTouch.current = Date.now()
  }, [])

  useEffect(() => {
    if (!ready) return
    if (shown === null) {
      setShown(latest.current)
      return
    }
    if (shown.join('|') === key) return
    let timer = 0
    const settle = () => {
      const wait = lastTouch.current + holdMs - Date.now()
      if (wait > 0) timer = window.setTimeout(settle, wait)
      else setShown(latest.current)
    }
    settle()
    return () => window.clearTimeout(timer)
  }, [ready, shown, key, holdMs])

  return { order: shown ?? target, touch }
}
