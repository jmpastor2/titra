import { useEffect, useRef, useState } from 'react'
import { easeOutCubic, prefersReducedMotion } from '@/components/dosing/syringeFill'

/**
 * A figure that runs up (or down) to `value` instead of jumping, in `ms`. Starts from 0 on
 * mount; with prefers-reduced-motion it is `value` straight away. The caller rounds it.
 */
export function useCountUp(value: number, ms = 800): number {
  const still = prefersReducedMotion()
  const [shown, setShown] = useState(still ? value : 0)
  const from = useRef(shown)

  useEffect(() => {
    const start = from.current
    if (still || start === value) return
    let raf = 0
    let t0 = -1
    const tick = (now: number) => {
      if (t0 < 0) t0 = now
      const p = Math.min(1, (now - t0) / ms)
      const next = p === 1 ? value : start + (value - start) * easeOutCubic(p)
      from.current = next
      setShown(next)
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value, ms, still])

  return still ? value : shown
}
