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
        'h-11 touch-manipulation whitespace-nowrap rounded-full px-4 text-[13.5px] font-semibold outline-none transition active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-signal/60',
        // Translucent: they read the same on the sheet and on the tinted row of the dose sheet.
        primary ? 'bg-signal-soft text-signal' : 'bg-ink/[0.07] text-ink',
      )}
    >
      {children}
    </button>
  )
}

/**
 * The quick ways to say when you last ate: just now, a while ago, at a time. `onSet` runs
 * after each one (a sheet closes itself with it). The answers and the time field share one
 * cell, so opening the field never changes the height of what holds it.
 */
export function FastingControls({
  lastMeal,
  onSet,
  justAte = true,
  clear = true,
}: {
  lastMeal: Date | null
  onSet?: (at: Date | null) => void
  /** "Acabo de comer" among the answers; a sheet with it as its main button leaves it out. */
  justAte?: boolean
  /** "Borrar" once a meal is noted; a sheet may offer it elsewhere. */
  clear?: boolean
}) {
  const { t } = useTranslation()
  const [editing, setEditing] = useState(false)
  const [time, setTime] = useState(() => clock(new Date()))

  function set(at: Date | null) {
    setLastMeal(at)
    setEditing(false)
    onSet?.(at)
  }

  return (
    <div className="grid">
      <div
        className={clsx('flex flex-wrap gap-2 [grid-area:1/1]', editing && 'invisible')}
        aria-hidden={editing || undefined}
        inert={editing || undefined}
      >
        {justAte && (
          <Pill primary onClick={() => set(new Date())}>
            {t('fasting.justAte')}
          </Pill>
        )}
        <Pill onClick={() => set(minutesAgo(30, new Date()))}>{t('fasting.ago30')}</Pill>
        <Pill onClick={() => set(minutesAgo(60, new Date()))}>{t('fasting.ago60')}</Pill>
        <Pill
          onClick={() => {
            setTime(clock(new Date()))
            setEditing(true)
          }}
        >
          {t('fasting.ateAt')}
        </Pill>
        {clear && (
          // Its room is kept with no meal noted, so noting one never adds a row of buttons.
          <button
            type="button"
            onClick={() => set(null)}
            aria-hidden={!lastMeal || undefined}
            tabIndex={lastMeal ? undefined : -1}
            className={clsx(
              'h-11 px-2 text-[13px] text-muted outline-none focus-visible:ring-2 focus-visible:ring-signal/60',
              !lastMeal && 'invisible',
            )}
          >
            {t('fasting.clear')}
          </button>
        )}
      </div>
      <div
        className={clsx(
          'flex flex-wrap items-center gap-2 self-start [grid-area:1/1]',
          !editing && 'invisible',
        )}
        aria-hidden={!editing || undefined}
        inert={!editing || undefined}
      >
        <input
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          aria-label={t('fasting.mealTime')}
          className="readout h-11 rounded-full bg-ink/[0.07] px-4 text-[16px] text-ink outline-none focus:ring-2 focus:ring-signal/50"
        />
        <Pill primary onClick={() => set(mostRecent(time, new Date()))}>
          {t('common.save')}
        </Pill>
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="h-11 px-2 text-[13px] text-muted outline-none focus-visible:ring-2 focus-visible:ring-signal/60"
        >
          {t('common.cancel')}
        </button>
      </div>
    </div>
  )
}

/**
 * Fasting window before a GH secretagogue: note the last meal, see when you can inject. A soft
 * row with no border, so it sits calmly inside the dose sheet.
 */
export function FastingCard({ name, className }: { name: string; className?: string }) {
  const { t } = useTranslation()
  const now = useNow(30_000)
  const lastMeal = useLastMeal(now)
  const s = fastingState(lastMeal, now)
  const waiting = lastMeal !== null && !s.ready

  return (
    <div
      className={clsx(
        'rounded-control px-3.5 py-3',
        waiting ? 'bg-warn-soft' : 'bg-panel-2',
        className,
      )}
    >
      <div className="flex items-start gap-2.5">
        <Utensils
          className={clsx('mt-0.5 size-4 shrink-0', waiting ? 'text-warn' : 'text-signal')}
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          <div className="text-[14px] font-semibold leading-snug">
            {!lastMeal
              ? t('fasting.ask', { name })
              : s.ready
                ? t('fasting.ready', { since: clock(s.readyAt ?? now) })
                : t('fasting.wait', { at: clock(s.readyAt ?? now), min: s.waitMin })}
          </div>
          <div className="mt-0.5 text-[12.5px] leading-snug text-muted">
            {lastMeal
              ? t('fasting.lastMeal', { at: clock(lastMeal), after: EAT_AFTER_MIN })
              : t('fasting.rule', { after: EAT_AFTER_MIN })}
          </div>
          {/* Always drawn, empty with no meal noted: noting one does not move the buttons. */}
          <Meter
            className="mt-2.5"
            value={lastMeal ? fastProgress(lastMeal, now) : 0}
            color={waiting ? 'var(--warn)' : 'var(--signal)'}
            height={4}
          />
          <div className="mt-3">
            <FastingControls lastMeal={lastMeal} />
          </div>
        </div>
      </div>
    </div>
  )
}
