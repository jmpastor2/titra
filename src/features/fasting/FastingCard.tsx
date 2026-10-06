import { clsx } from 'clsx'
import { Utensils } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Meter } from '@/components/kpi/Meter'
import { useNow } from '@/lib/useNow'
import {
  clock,
  EAT_AFTER_MIN,
  fastingState,
  fastProgress,
  minutesAgo,
  mostRecent,
  setLastMeal,
  useLastMeal,
} from './fasting'

function Pill({
  onClick,
  primary,
  children,
}: {
  onClick: () => void
  primary?: boolean
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        'h-11 touch-manipulation rounded-full border px-4 text-[13px] font-semibold transition active:scale-[0.97]',
        primary
          ? 'border-signal/40 bg-signal-soft text-signal'
          : 'border-line-strong bg-panel text-ink',
      )}
    >
      {children}
    </button>
  )
}

/**
 * The quick ways to say when you last ate: just now, a while ago, at a time. `onSet` runs
 * after each one (a sheet closes itself with it).
 */
export function FastingControls({
  lastMeal,
  onSet,
}: {
  lastMeal: Date | null
  onSet?: (at: Date | null) => void
}) {
  const { t } = useTranslation()
  const [editing, setEditing] = useState(false)
  const [time, setTime] = useState(() => clock(new Date()))

  function set(at: Date | null) {
    setLastMeal(at)
    setEditing(false)
    onSet?.(at)
  }

  if (editing) {
    return (
      <div className="flex items-center gap-2">
        <input
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          aria-label={t('fasting.mealTime')}
          className="readout h-11 rounded-full border border-line-strong bg-panel px-4 text-[15px]"
        />
        <Pill primary onClick={() => set(mostRecent(time, new Date()))}>
          {t('common.save')}
        </Pill>
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="h-11 px-2 text-[13px] text-muted"
        >
          {t('common.cancel')}
        </button>
      </div>
    )
  }
  return (
    <div className="flex flex-wrap gap-2">
      <Pill primary onClick={() => set(new Date())}>
        {t('fasting.justAte')}
      </Pill>
      <Pill onClick={() => set(minutesAgo(30, new Date()))}>{t('fasting.ago30')}</Pill>
      <Pill onClick={() => set(minutesAgo(60, new Date()))}>{t('fasting.ago60')}</Pill>
      <Pill onClick={() => setEditing(true)}>{t('fasting.ateAt')}</Pill>
      {lastMeal && (
        <button
          type="button"
          onClick={() => set(null)}
          className="h-11 px-2 text-[13px] text-muted"
        >
          {t('fasting.clear')}
        </button>
      )}
    </div>
  )
}

/** Fasting window before a GH secretagogue: note the last meal, see when you can inject. */
export function FastingCard({ name, className }: { name: string; className?: string }) {
  const { t } = useTranslation()
  const now = useNow(30_000)
  const lastMeal = useLastMeal(now)
  const s = fastingState(lastMeal, now)
  const waiting = lastMeal !== null && !s.ready
  // A meal noted and the two hours up: the card says so in the colour of what is done.
  const fasted = lastMeal !== null && s.ready

  return (
    <div
      className={clsx(
        'rounded-control border px-3.5 py-3',
        waiting
          ? 'border-warn/40 bg-warn-soft'
          : fasted
            ? 'border-signal/30 bg-signal-soft'
            : 'border-line bg-panel-2',
        className,
      )}
    >
      <div className="flex items-start gap-2.5">
        <Utensils
          className={clsx('mt-0.5 size-4 shrink-0', waiting ? 'text-warn' : 'text-signal')}
        />
        <div className="min-w-0 flex-1">
          <div className="text-[13.5px] font-semibold">
            {!lastMeal
              ? t('fasting.ask', { name })
              : s.ready
                ? t('fasting.ready', { since: clock(s.readyAt ?? now) })
                : t('fasting.wait', { at: clock(s.readyAt ?? now), min: s.waitMin })}
          </div>
          <div className="mt-0.5 text-[12px] text-muted">
            {lastMeal
              ? t('fasting.lastMeal', { at: clock(lastMeal), after: EAT_AFTER_MIN })
              : t('fasting.rule', { after: EAT_AFTER_MIN })}
          </div>
          {waiting && (
            <Meter
              className="mt-2"
              value={fastProgress(lastMeal, now)}
              color="var(--warn)"
              height={5}
            />
          )}
          <div className="mt-2.5">
            <FastingControls lastMeal={lastMeal} />
          </div>
        </div>
      </div>
    </div>
  )
}
