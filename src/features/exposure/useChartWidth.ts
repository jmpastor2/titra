import { useLayoutEffect, useRef, useState, type RefObject } from 'react'

/**
 * The width of the element the ref is attached to, in CSS px, followed through resizes.
 * It is measured before the first paint, so a chart never shows at a placeholder width.
 * Without layout (tests) it keeps `fallback`.
 */
export function useChartWidth(fallback = 320): [RefObject<HTMLDivElement | null>, number] {
  const ref = useRef<HTMLDivElement | null>(null)
  const [width, setWidth] = useState(fallback)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    // The layout width: a transform on a parent (a card pressed down) must not rescale the chart.
    const measure = () => {
      if (el.clientWidth > 0) setWidth(el.clientWidth)
    }
    measure()
    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  return [ref, width]
}
