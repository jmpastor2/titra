import { clsx } from 'clsx'
import { useTranslation } from 'react-i18next'
import type { PhaseWeek } from './phase'

/** Past this many weeks only today's is numbered: the cells are too narrow for more. */
const NUMBERED_UNTIL = 20

const FADE_OUT = 'linear-gradient(to right, #000 25%, transparent)'
const HATCH =
  'repeating-linear-gradient(135deg, color-mix(in oklab, var(--muted) 45%, transparent) 0 1.5px, transparent 1.5px 6px)'

/**
 * A cycle week by week: one bar per week, as tall as its dose, so a titration climbs like a
 * staircase; a rest is a low hatched bar; today's week glows. The weeks behind are filled, the
 * ones ahead drawn in outline. The whole strip is one button that opens the steps.
 */
export function PhaseStrip({
  weeks,
  color,
  name,
  onOpen,
}: {
  weeks: readonly PhaseWeek[]
  color: string
  name: string
  onOpen: () => void
}) {
  const { t } = useTranslation()
  const numbered = weeks.length <= NUMBERED_UNTIL
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={t('cycles.strip.open', { name })}
      className="block w-full rounded-control px-0.5 py-1 text-left outline-none focus-visible:ring-2 focus-visible:ring-signal/60"
    >
      <div aria-hidden className="flex h-11 items-end gap-[3px]">
        {weeks.map((w) => (
          <span
            key={w.key}
            className={clsx(
              'min-w-[3px] flex-1 rounded-[5px] border',
              (w.state === 'future' || w.kind === 'rest') && 'border-dashed',
            )}
            style={{
              height: w.kind === 'rest' ? '30%' : `${34 + 66 * w.intensity}%`,
              background:
                w.kind === 'rest'
                  ? HATCH
                  : w.state === 'current'
                    ? color
                    : w.state === 'past'
                      ? `color-mix(in oklab, ${color} 55%, transparent)`
                      : `color-mix(in oklab, ${color} 14%, transparent)`,
              borderColor:
                w.kind === 'rest'
                  ? 'var(--line-strong)'
                  : `color-mix(in oklab, ${color} ${w.state === 'current' ? 100 : 55}%, transparent)`,
              boxShadow:
                w.state === 'current' && w.kind === 'dose'
                  ? `0 0 12px color-mix(in oklab, ${color} 55%, transparent)`
                  : undefined,
              ...(w.open ? { maskImage: FADE_OUT, WebkitMaskImage: FADE_OUT } : {}),
            }}
          />
        ))}
      </div>
      <div aria-hidden className="mt-1.5 flex gap-[3px]">
        {weeks.map((w) => (
          <span
            key={w.key}
            className={clsx(
              'readout h-3 min-w-[3px] flex-1 text-center text-[10px] leading-3',
              w.state === 'current' ? 'font-bold text-ink' : 'text-muted',
            )}
          >
            {w.n !== null && (numbered || w.state === 'current') ? (w.open ? '∞' : w.n) : ''}
          </span>
        ))}
      </div>
    </button>
  )
}
