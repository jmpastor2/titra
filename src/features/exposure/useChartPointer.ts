import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
} from 'react'
import type { PlotBox } from './chartLayout'

/**
 * Which position of a chart is selected. A mouse hovers; a finger taps or drags and the
 * selection stays until the next tap elsewhere; arrow keys move it.
 */
export function useChartPointer({
  count,
  box,
  indexAt,
  start = 0,
}: {
  count: number
  box: PlotBox
  /** Position (px from the chart's left edge) to the index it selects, -1 for none. */
  indexAt: (px: number) => number
  /** Where the arrow keys begin when nothing is selected yet: "now", or the next dose. */
  start?: number
}) {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const pinned = useRef(false)
  const [state, setState] = useState<{ index: number | null; count: number }>({
    index: null,
    count,
  })
  // A selection belongs to the data it was made on: another range starts clean.
  const selected = state.count === count ? state.index : null
  const select = useCallback(
    (next: number | null | ((current: number | null) => number | null)) =>
      setState((prev) => {
        const current = prev.count === count ? prev.index : null
        return { index: typeof next === 'function' ? next(current) : next, count }
      }),
    [count],
  )

  const pick = useCallback(
    (clientX: number) => {
      const svg = svgRef.current
      if (!svg) return
      const rect = svg.getBoundingClientRect()
      // Back to the chart's own pixels, whatever transform is applied above it.
      const px = (clientX - rect.left) * (rect.width > 0 ? svg.clientWidth / rect.width : 1)
      if (px < box.x0 - 14 || px > box.x1 + 14) return
      const i = indexAt(px)
      select(i >= 0 && i < count ? i : null)
    },
    [box.x0, box.x1, count, indexAt, select],
  )

  // A selection made by touch is released by tapping anywhere outside the chart.
  useEffect(() => {
    if (selected === null) return
    const away = (e: Event) => {
      if (pinned.current && !svgRef.current?.contains(e.target as Node)) select(null)
    }
    document.addEventListener('pointerdown', away)
    return () => document.removeEventListener('pointerdown', away)
  }, [selected, select])

  const handlers = {
    onPointerDown: (e: PointerEvent<SVGSVGElement>) => {
      pinned.current = e.pointerType !== 'mouse'
      pick(e.clientX)
    },
    onPointerMove: (e: PointerEvent<SVGSVGElement>) => {
      if (e.pointerType === 'mouse' || e.buttons) pick(e.clientX)
    },
    onPointerLeave: (e: PointerEvent<SVGSVGElement>) => {
      if (e.pointerType === 'mouse') select(null)
    },
    onKeyDown: (e: KeyboardEvent<SVGSVGElement>) => {
      if (count === 0) return
      const clamp = (i: number) => Math.min(count - 1, Math.max(0, i))
      const step = (by: number) => select((s) => (s === null ? clamp(start) : clamp(s + by)))
      if (e.key === 'ArrowRight') step(1)
      else if (e.key === 'ArrowLeft') step(-1)
      else if (e.key === 'Home') select(0)
      else if (e.key === 'End') select(count - 1)
      else if (e.key === 'Escape') select(null)
      else return
      e.preventDefault()
    },
    onBlur: () => {
      if (!pinned.current) select(null)
    },
  }
  return { svgRef, selected, handlers }
}
