import { addDays, startOfDay } from 'date-fns'
import { Clock, Moon, Plus, X } from 'lucide-react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Field'
import { Segmented } from '@/components/ui/primitives'
import { compoundColor } from '@/content/substanceColor'
import { ownerDay, scheduledDoses } from '@/domain/dosing/schedule'
import type { ProtocolLike, ScheduleStep } from '@/domain/types'
import { toDateInputValue } from '@/lib/format'
import { useLocale } from '@/lib/useLocale'
import { blurOnEnter } from './blurOnEnter'
import { WEEK, type Draft, type ScheduleMode } from './draft'
import { NightShiftControl } from './NightShiftControl'

type ScheduleDraft = Pick<
  Draft,
  'mode' | 'intervalDays' | 'weekdays' | 'times' | 'nightShift' | 'startDate' | 'compoundId'
>

/**
 * Which days and at what times: every N days or on weekdays, one or several times a day,
 * the small-hours option for a night dose, and a typical week to see it at a glance.
 */
export function ScheduleCard({
  draft,
  steps,
  times,
  now,
  onChange,
}: {
  draft: ScheduleDraft
  /** The steps as they will be saved, for the typical week. */
  steps: readonly ScheduleStep[]
  /** The times as they will be saved ("25:00" for a night dose). */
  times: readonly string[]
  now: Date
  onChange: (patch: Partial<Draft>) => void
}) {
  const { t } = useTranslation()
  const { locale } = useLocale()

  const weekdayShort = (d: number) =>
    new Intl.DateTimeFormat(locale === 'es' ? 'es-ES' : 'en-US', { weekday: 'narrow' }).format(
      new Date(2026, 2, 1 + d), // 2026-03-01 is a Sunday
    )

  const week = useMemo(() => {
    const doseStep = steps.find((s) => !s.pause)
    if (!doseStep) return null
    const start = startOfDay(now)
    const pl: ProtocolLike = {
      compoundId: draft.compoundId,
      startDate: toDateInputValue(start),
      steps: [{ ...doseStep, durationWeeks: null }],
      times: [...times],
    }
    // A day further, so the last evening's after-midnight shot is in.
    const occ = scheduledDoses(pl, start, addDays(start, 8))
    return Array.from({ length: 7 }, (_, i) => {
      const day = addDays(start, i)
      const mine = occ.filter((o) => ownerDay(o).getTime() === day.getTime())
      return {
        day,
        count: mine.length,
        night: mine.some((o) => startOfDay(o.at).getTime() !== day.getTime()),
      }
    })
  }, [steps, times, draft.compoundId, now])

  return (
    <Card title={t('protocols.schedule')}>
      <Segmented<ScheduleMode>
        value={draft.mode}
        onChange={(mode) => onChange({ mode })}
        options={[
          { value: 'interval', label: t('protocols.everyN') },
          { value: 'weekdays', label: t('protocols.onWeekdays') },
        ]}
      />
      {draft.mode === 'interval' ? (
        <div className="mt-3 flex items-center gap-3">
          <span className="text-[14px] text-ink-2">{t('protocols.every')}</span>
          <div className="w-24">
            <Input
              inputMode="decimal"
              enterKeyHint="done"
              autoComplete="off"
              aria-label={t('protocols.intervalDays')}
              value={draft.intervalDays}
              onChange={(e) => onChange({ intervalDays: e.target.value })}
              onFocus={(e) => e.currentTarget.select()}
              onKeyDown={blurOnEnter}
              className="readout text-center"
            />
          </div>
          <span className="text-[14px] text-ink-2">{t('protocols.days')}</span>
        </div>
      ) : (
        // Seven 44 px targets across a phone: the row takes the card's padding for itself.
        // Below 370 px seven do not fit at 44 px: the week wraps into two rows instead.
        <div
          className="-mx-2.5 mt-3 grid grid-cols-4 gap-1.5 min-[370px]:grid-cols-7 min-[370px]:gap-[3px]"
          role="group"
          aria-label={t('protocols.onWeekdays')}
        >
          {WEEK.map((d) => {
            const on = draft.weekdays.includes(d)
            return (
              <button
                key={d}
                type="button"
                aria-pressed={on}
                onClick={() =>
                  onChange({
                    weekdays: on ? draft.weekdays.filter((x) => x !== d) : [...draft.weekdays, d],
                  })
                }
                className={
                  on
                    ? 'h-11 rounded-full bg-signal-soft text-[14px] font-semibold text-signal shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--signal)_40%,transparent)] transition-colors'
                    : 'h-11 rounded-full bg-panel-2 text-[14px] font-medium text-muted transition-colors'
                }
              >
                {weekdayShort(d)}
              </button>
            )
          })}
        </div>
      )}

      <div className="mt-5">
        <div className="mb-2 text-[13px] font-medium text-ink-2">{t('protocols.times')}</div>
        <div className="flex flex-wrap items-center gap-2">
          {draft.times.map((tm, i) => (
            <div
              // The value changes while the user edits it, so the position is the identity.
              // oxlint-disable-next-line react/no-array-index-key
              key={i}
              className="flex min-h-11 items-center gap-1 rounded-full border border-line-strong bg-panel-2 pl-3 pr-1"
            >
              {draft.nightShift && Number(tm.split(':')[0]) < 6 ? (
                <Moon aria-hidden className="size-3.5 text-accent" />
              ) : (
                <Clock aria-hidden className="size-3.5 text-muted" />
              )}
              <input
                type="time"
                aria-label={t('protocols.timeOfDay')}
                value={tm}
                onChange={(e) =>
                  onChange({ times: draft.times.map((x, j) => (j === i ? e.target.value : x)) })
                }
                className="readout h-11 w-[74px] bg-transparent text-[14px] font-semibold outline-none"
              />
              {draft.times.length > 1 && (
                <button
                  type="button"
                  aria-label={t('common.delete')}
                  onClick={() => onChange({ times: draft.times.filter((_, j) => j !== i) })}
                  className="grid size-11 shrink-0 place-items-center rounded-full text-muted hover:text-danger"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>
          ))}
          {draft.times.length < 6 && (
            <button
              type="button"
              onClick={() => onChange({ times: [...draft.times, '21:00'] })}
              className="flex min-h-11 items-center gap-1 px-2 text-[13.5px] font-semibold text-signal"
            >
              <Plus aria-hidden className="size-4" /> {t('protocols.addTime')}
            </button>
          )}
        </div>
        <NightShiftControl draft={draft} onChange={(nightShift) => onChange({ nightShift })} />
      </div>

      {week && (
        <div className="mt-5 border-t border-line pt-4">
          <div className="mb-2.5 text-[13px] font-medium text-ink-2">
            {t('protocols.typicalWeek')}
          </div>
          <div className="grid grid-cols-7 gap-1.5">
            {week.map(({ day, count, night }) => (
              <div key={day.getTime()} className="flex flex-col items-center gap-1.5">
                <span className="text-[11.5px] font-medium text-muted">
                  {weekdayShort(day.getDay())}
                </span>
                <div className="flex h-5 flex-col items-center justify-end gap-0.5">
                  {Array.from({ length: Math.min(count, 3) }, (_, i) => (
                    <span
                      key={i}
                      className="block size-[7px] rounded-full"
                      style={{
                        background: compoundColor(draft.compoundId),
                        boxShadow: `0 0 6px ${compoundColor(draft.compoundId)}`,
                      }}
                    />
                  ))}
                  {count === 0 && (
                    <span className="block size-[7px] rounded-full border border-line-strong" />
                  )}
                </div>
                {night && (
                  <Moon aria-label={t('protocols.night.mark')} className="size-3 text-accent" />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  )
}
