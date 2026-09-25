import { addDays, differenceInCalendarDays } from 'date-fns'
import { clsx } from 'clsx'
import { useTranslation } from 'react-i18next'
import { currentStep, stepWindows } from '@/domain/dosing/schedule'
import type { DoseUnit, ProtocolLike } from '@/domain/types'
import { fmtDate, fmtNumber } from '@/lib/format'
import { useLocale } from '@/lib/useLocale'

/** Weeks an open-ended step is drawn as, so maintenance reads as "the rest". */
const OPEN_WEEKS = 6

const shortDose = (mg: number, unit: DoseUnit, locale: 'es' | 'en') =>
  fmtNumber(unit === 'mcg' ? mg * 1000 : mg, locale, 2)

/**
 * The protocol's dose steps as a staircase: width is duration, height is dose. The
 * current step glows and carries a marker for how far into it today is; below, when
 * the dose changes next.
 */
export function TitrationLadder({
  protocol,
  unit,
  color,
  now: nowProp,
  compact = false,
}: {
  protocol: ProtocolLike
  unit: DoseUnit
  color: string
  now?: Date
  compact?: boolean
}) {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const now = nowProp ?? new Date()
  const windows = stepWindows(protocol)
  if (windows.length < 2) return null

  const current = currentStep(protocol, now)
  const maxDose = Math.max(...windows.map((w) => (w.step.pause ? 0 : w.step.doseMg)), 1e-9)
  const weeksOf = (w: (typeof windows)[number]) => w.step.durationWeeks ?? OPEN_WEEKS
  const totalWeeks = windows.reduce((s, w) => s + weeksOf(w), 0)
  const height = compact ? 34 : 52

  let summary: string | null = null
  if (current) {
    const next = windows[current.index + 1]
    if (current.step.pause) {
      summary = current.end
        ? t('protocols.ladder.pauseUntil', {
            count: differenceInCalendarDays(current.end, now),
            date: fmtDate(current.end, locale, 'EEE d MMM'),
          })
        : t('protocols.ladder.paused')
    } else if (current.end && next) {
      const days = differenceInCalendarDays(current.end, now)
      summary = next.step.pause
        ? t('protocols.ladder.nextPause', {
            count: days,
            date: fmtDate(current.end, locale, 'EEE d MMM'),
          })
        : t('protocols.ladder.nextStep', {
            dose: `${shortDose(next.step.doseMg, unit, locale)} ${t(`units.${unit}`)}`,
            count: days,
            date: fmtDate(current.end, locale, 'EEE d MMM'),
          })
    } else if (!current.end) {
      summary = t('protocols.ladder.maintenance')
    }
  } else if (now < windows[0]!.start) {
    summary = t('protocols.ladder.startsOn', {
      date: fmtDate(windows[0]!.start, locale, 'EEE d MMM'),
    })
  }

  return (
    <div>
      <div className="flex items-end gap-[3px]" style={{ height }} aria-hidden>
        {windows.map((w) => {
          const isCurrent = current?.index === w.index
          const past = current ? w.index < current.index : now >= (w.end ?? addDays(now, 1))
          const h = w.step.pause ? 0.14 : 0.22 + 0.78 * (w.step.doseMg / maxDose)
          const progress =
            isCurrent && w.end
              ? Math.min(
                  1,
                  (now.getTime() - w.start.getTime()) / (w.end.getTime() - w.start.getTime()),
                )
              : null
          return (
            <div
              key={w.index}
              className="relative"
              style={{ flexGrow: weeksOf(w) / totalWeeks, flexBasis: 0, height: `${h * 100}%` }}
            >
              <div
                className={clsx(
                  'absolute inset-0 rounded-[5px] border',
                  w.step.pause && 'border-dashed',
                )}
                style={{
                  background: w.step.pause
                    ? 'transparent'
                    : isCurrent
                      ? color
                      : past
                        ? `color-mix(in oklab, ${color} 42%, transparent)`
                        : `color-mix(in oklab, ${color} 12%, transparent)`,
                  borderColor: w.step.pause
                    ? 'var(--line-strong)'
                    : `color-mix(in oklab, ${color} ${isCurrent ? 100 : 45}%, transparent)`,
                  boxShadow: isCurrent
                    ? `0 0 14px color-mix(in oklab, ${color} 55%, transparent)`
                    : undefined,
                }}
              />
              {progress !== null && (
                <span
                  className="absolute -bottom-[5px] h-[9px] w-[2px] rounded-full bg-ink"
                  style={{ left: `calc(${progress * 100}% - 1px)` }}
                />
              )}
            </div>
          )
        })}
      </div>
      {!compact && (
        <div className="mt-1.5 flex gap-[3px]">
          {windows.map((w) => (
            <span
              key={w.index}
              className={clsx(
                'readout truncate text-center text-[10.5px]',
                current?.index === w.index ? 'font-semibold text-ink' : 'text-muted',
              )}
              style={{ flexGrow: weeksOf(w) / totalWeeks, flexBasis: 0 }}
            >
              {w.step.pause ? '—' : shortDose(w.step.doseMg, unit, locale)}
            </span>
          ))}
        </div>
      )}
      {summary && <p className="mt-1.5 text-[12px] font-medium text-ink-2">{summary}</p>}
    </div>
  )
}
