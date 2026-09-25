import { clsx } from 'clsx'
import { Utensils } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNow } from '@/lib/useNow'
import { EAT_AFTER_MIN, FAST_BEFORE_MIN, fastingState, setLastMeal, useLastMeal } from './fasting'

const hhmm = (d: Date) =>
  `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`

/** A time typed as HH:MM means the most recent one: today, or yesterday if still ahead. */
function mostRecent(time: string, now: Date): Date {
  const [h, m] = time.split(':').map(Number)
  const d = new Date(now)
  d.setHours(h ?? 0, m ?? 0, 0, 0)
  if (d > now) d.setDate(d.getDate() - 1)
  return d
}

/** Fasting window before a GH secretagogue: note the last meal, see when you can inject. */
export function FastingCard({ name, className }: { name: string; className?: string }) {
  const { t } = useTranslation()
  const now = useNow(30_000)
  const lastMeal = useLastMeal(now)
  const [editing, setEditing] = useState(false)
  const [time, setTime] = useState(() => hhmm(new Date()))
  const s = fastingState(lastMeal, now)
  const progress = lastMeal
    ? Math.min(1, (now.getTime() - lastMeal.getTime()) / (FAST_BEFORE_MIN * 60_000))
    : 0

  return (
    <div
      className={clsx(
        'rounded-control border px-3.5 py-3',
        lastMeal && !s.ready ? 'border-warn/40 bg-warn-soft' : 'border-line bg-panel-2',
        className,
      )}
    >
      <div className="flex items-start gap-2.5">
        <Utensils
          className={clsx(
            'mt-0.5 size-4 shrink-0',
            lastMeal && !s.ready ? 'text-warn' : 'text-signal',
          )}
        />
        <div className="min-w-0 flex-1">
          <div className="text-[13.5px] font-semibold">
            {!lastMeal
              ? t('fasting.ask', { name })
              : s.ready
                ? t('fasting.ready', { since: hhmm(s.readyAt!) })
                : t('fasting.wait', { at: hhmm(s.readyAt!), min: s.waitMin })}
          </div>
          <div className="mt-0.5 text-[12px] text-muted">
            {lastMeal
              ? t('fasting.lastMeal', { at: hhmm(lastMeal), after: EAT_AFTER_MIN })
              : t('fasting.rule', { after: EAT_AFTER_MIN })}
          </div>
          {lastMeal && !s.ready && (
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-panel">
              <div
                className="h-full rounded-full bg-warn"
                style={{ width: `${progress * 100}%` }}
              />
            </div>
          )}
          {editing ? (
            <div className="mt-2 flex items-center gap-2">
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                aria-label={t('fasting.mealTime')}
                className="readout h-9 rounded-full border border-line-strong bg-panel px-3 text-[14px]"
              />
              <button
                type="button"
                onClick={() => {
                  setLastMeal(mostRecent(time, new Date()))
                  setEditing(false)
                }}
                className="h-9 rounded-full bg-signal px-4 text-[13px] font-semibold text-signal-ink"
              >
                {t('common.save')}
              </button>
            </div>
          ) : (
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setLastMeal(new Date())}
                className="h-8 rounded-full border border-line-strong bg-panel px-3 text-[12.5px] font-semibold"
              >
                {t('fasting.justAte')}
              </button>
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="h-8 rounded-full border border-line-strong bg-panel px-3 text-[12.5px] font-semibold"
              >
                {t('fasting.ateAt')}
              </button>
              {lastMeal && (
                <button
                  type="button"
                  onClick={() => setLastMeal(null)}
                  className="h-8 px-2 text-[12.5px] text-muted"
                >
                  {t('fasting.clear')}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
