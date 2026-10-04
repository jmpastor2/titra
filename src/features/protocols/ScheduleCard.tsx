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
    <Card eyebrow="02" title={t('protocols.schedule')}>
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
        <div
          className="mt-3 grid grid-cols-7 gap-1.5"
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
                    ? 'readout h-11 rounded-control border border-signal/50 bg-signal-soft text-[14px] font-semibold text-signal'
                    : 'readout h-11 rounded-control border border-line bg-panel-2 text-[14px] text-muted'
                }
              >
                {weekdayShort(d).toUpperCase()}
              </button>
            )
          })}
        </div>
      )}

      <div className="mt-4">
        <div className="spec mb-2">{t('protocols.times')}</div>
        <div className="flex flex-wrap items-center gap-2">
          {draft.times.map((tm, i) => (
            <div
              // The value changes while the user edits it, so the position is the identity.
              // oxlint-disable-next-line react/no-array-index-key
              key={i}
              className="flex items-center gap-1 rounded-full border border-line-strong bg-panel-2 py-1 pl-3 pr-1"
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
                className="readout w-[74px] bg-transparent text-[14px] font-semibold outline-none"
              />
              {draft.times.length > 1 && (
                <button
                  type="button"
                  aria-label={t('common.delete')}
                  onClick={() => onChange({ times: draft.times.filter((_, j) => j !== i) })}
                  className="-my-1 grid size-11 place-items-center rounded-full text-muted hover:text-danger"
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
              className="flex min-h-11 items-center gap-1 rounded-full border border-dashed border-line-strong px-3.5 text-[12.5px] font-semibold text-signal"
            >
              <Plus className="size-3.5" /> {t('protocols.addTime')}
            </button>
          )}
        </div>
        <NightShiftControl draft={draft} onChange={(nightShift) => onChange({ nightShift })} />
      </div>

      {week && (
        <div className="mt-4 rounded-control border border-line bg-panel-2 p-3">
          <div className="spec mb-2">{t('protocols.typicalWeek')}</div>
          <div className="grid grid-cols-7 gap-1.5">
            {week.map(({ day, count, night }) => (
              <div key={day.getTime()} className="flex flex-col items-center gap-1.5">
                <span className="readout text-[10px] text-muted">
                  {weekdayShort(day.getDay()).toUpperCase()}
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
