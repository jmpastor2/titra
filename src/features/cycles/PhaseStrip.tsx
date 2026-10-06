import { useTranslation } from 'react-i18next'
import { Steps } from '@/components/kpi/Steps'
import { ladderSteps } from './ladder'
import type { PhaseWeek } from './phase'

/**
 * A cycle week by week as the kit's staircase: one bar per week, as tall as its dose, solid
 * behind, marked today, faint ahead and hatched in a rest; its first and last day under it.
 * The whole strip is one button that opens the steps.
 */
export function PhaseStrip({
  weeks,
  color,
  name,
  start,
  end,
  onOpen,
}: {
  weeks: readonly PhaseWeek[]
  color: string
  name: string
  /** The cycle's first day and its last (or "sin fin"), as they read under the strip. */
  start: string
  end: string
  onOpen: () => void
}) {
  const { t } = useTranslation()
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={t('cycles.strip.open', { name })}
      className="block w-full rounded-control py-1 text-left outline-none focus-visible:ring-2 focus-visible:ring-signal/60"
    >
      <Steps steps={ladderSteps(weeks)} color={color} height={26} />
      <span
        aria-hidden
        className="readout mt-1 flex justify-between gap-3 text-[11.5px] text-muted"
      >
        <span>{start}</span>
        <span>{end}</span>
      </span>
    </button>
  )
}
