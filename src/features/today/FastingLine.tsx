import { clsx } from 'clsx'
import { Check, ChevronRight, Utensils } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Meter } from '@/components/kpi/Meter'
import { clock, fastingState, fastProgress, useLastMeal } from '@/features/fasting/fasting'
import { useNow } from '@/lib/useNow'

/**
 * The fast the next dose asks for, as one line of the hero: when you last ate, how long until
 * the fast is long enough (with its gauge), or that it already is. A tap opens the fast sheet.
 */
export function FastingLine({ onOpen }: { onOpen: () => void }) {
  const { t } = useTranslation()
  const now = useNow(30_000)
  const lastMeal = useLastMeal(now)
  const s = fastingState(lastMeal, now)
  const waiting = lastMeal !== null && !s.ready
  const Icon = lastMeal && s.ready ? Check : Utensils

  return (
    <button
      type="button"
      onClick={onOpen}
      className="mt-3 flex min-h-11 w-full items-center gap-2.5 rounded-control text-left outline-none focus-visible:ring-2 focus-visible:ring-signal/60"
    >
      <Icon
        aria-hidden
        className={clsx('size-4 shrink-0', waiting ? 'text-warn' : 'text-signal')}
      />
      <span className="min-w-0 flex-1">
        <span
          className={clsx(
            'block text-[13.5px] leading-snug',
            waiting ? 'font-semibold text-warn' : 'text-ink-2',
          )}
        >
          {!lastMeal
            ? t('today.fast.ask')
            : s.ready
              ? t('fasting.ready', { since: clock(s.readyAt ?? now) })
              : t('fasting.wait', { at: clock(s.readyAt ?? now), min: s.waitMin })}
        </span>
        {waiting && (
          <Meter
            className="mt-1.5"
            value={fastProgress(lastMeal, now)}
            color="var(--warn)"
            height={4}
          />
        )}
      </span>
      <ChevronRight aria-hidden className="size-4 shrink-0 text-muted" />
    </button>
  )
}
