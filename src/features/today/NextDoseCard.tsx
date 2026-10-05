import { clsx } from 'clsx'
import { Moon, Syringe } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { SubstanceDot } from '@/components/ui/primitives'
import { compoundName } from '@/content/compounds'
import { compoundColor } from '@/content/substanceColor'
import type { ProtocolRow } from '@/data/database.types'
import type { StackComponent } from '@/domain/types'
import type { UpcomingAdministration } from '@/features/reminders/plan'
import { fmtHours, fmtNumber } from '@/lib/format'
import { useLocale } from '@/lib/useLocale'
import { isNightSlot, slotWhen, type TodayItem } from './agenda'
import type { useLastSevenDays } from './useLastSevenDays'
import { WeekRing } from './WeekPulse'

/** What the card is about: the dose to take now or next, from today's agenda or from a later day. */
interface Subject {
  protocol: ProtocolRow
  at: Date
  doses: readonly StackComponent[]
}

/**
 * The one thing Hoy is for: the next dose, when, how many units, and the way to log it; beside
 * it the ring of the last seven days. A dose that is due turns the card amber.
 */
export function NextDoseCard({
  focus,
  nextUp,
  units,
  message,
  week,
  weekExtras,
  now,
  readOnly,
  onLog,
  onLogOther,
}: {
  /** Today's dose that needs the person first: overdue, due or the next one coming. */
  focus: TodayItem | null
  /** With nothing left today, the next administration on a later day. */
  nextUp: UpcomingAdministration | null
  /** Syringe units to draw, when every vial involved is known. */
  units: number | null
  /** What to say when today has nothing left ("Todo hecho por hoy"). */
  message: string
  week: ReturnType<typeof useLastSevenDays>
  weekExtras: number
  now: Date
  readOnly: boolean
  /** Log the dose in focus. */
  onLog: () => void
  /** With nothing in focus, log whatever was taken: opens the choice of what. */
  onLogOther: () => void
}) {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const subject: Subject | null = focus ?? nextUp
  const status = focus?.status ?? 'upcoming'
  const alert = status === 'due' || status === 'overdue'

  const hoursTo = subject ? (subject.at.getTime() - now.getTime()) / 3_600_000 : 0
  const statusText =
    status === 'due'
      ? t('today.dueNow')
      : status === 'overdue'
        ? t('today.overdueBy', { time: fmtHours(-hoursTo, locale) })
        : t('today.inTime', { time: fmtHours(hoursTo, locale) })

  return (
    <Card instrument tone={alert ? 'warn' : 'default'} className="overflow-hidden">
      <div className="flex items-center gap-4">
        <WeekRing summary={week.summary} extras={weekExtras} />
        <div className="min-w-0 flex-1">
          <div className="spec">{t('today.next')}</div>
          {subject ? (
            <>
              <div className="mt-1 flex items-start gap-1.5">
                <span className="mt-[7px] flex shrink-0 items-center gap-1" aria-hidden>
                  {subject.doses.map((d) => (
                    <SubstanceDot key={d.compoundId} color={compoundColor(d.compoundId)} />
                  ))}
                </span>
                <span className="line-clamp-2 min-w-0 break-words text-[16px] font-semibold leading-snug">
                  {subject.protocol.name ||
                    subject.doses.map((d) => compoundName(d.compoundId)).join(' + ')}
                </span>
              </div>
              <div className="readout mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[13px]">
                <span className="inline-flex items-center gap-1.5 text-ink-2">
                  {slotWhen(subject.at, now, locale)}
                  {isNightSlot(subject.at) && (
                    <span className="inline-flex items-center gap-1 text-[12px] text-muted">
                      <Moon aria-hidden className="size-3" />
                      {t('today.night')}
                    </span>
                  )}
                </span>
                <span className={clsx(alert ? 'font-semibold text-warn' : 'text-muted')}>
                  {statusText}
                </span>
              </div>
              {focus && !readOnly && (
                <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5">
                  <Button size="sm" leading={<Syringe className="size-4" />} onClick={onLog}>
                    {t('today.logNow')}
                  </Button>
                  {units !== null && (
                    <span className="readout text-[15px] font-semibold text-signal">
                      {fmtNumber(units, locale, 1)}
                      <span className="ml-0.5 text-[11px]">U</span>
                    </span>
                  )}
                </div>
              )}
              {!focus && <p className="mt-2 text-[12.5px] leading-snug text-ink-2">{message}</p>}
            </>
          ) : (
            <p className="mt-1 text-[14px] leading-snug text-ink-2">{message}</p>
          )}
          {!focus && !readOnly && (
            <Button
              size="sm"
              variant="secondary"
              className="mt-2.5"
              leading={<Syringe className="size-4" />}
              onClick={onLogOther}
            >
              {t('doses.log')}
            </Button>
          )}
        </div>
      </div>
    </Card>
  )
}
