import { clsx } from 'clsx'
import { CalendarCheck, Moon, Syringe } from 'lucide-react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Ring } from '@/components/kpi/Ring'
import { SubstanceDot } from '@/components/ui/primitives'
import { compoundById, compoundName } from '@/content/compounds'
import { compoundColor } from '@/content/substanceColor'
import type { ProtocolRow } from '@/data/database.types'
import type { StackComponent } from '@/domain/types'
import { fmtDoseList, fmtNumber } from '@/lib/format'
import { useLocale } from '@/lib/useLocale'
import { DOSE_SOON_H } from '@/features/quicklog/tiles'
import { fmtWait, isNightSlot, slotWhen, type DaySummary, type TodayItem } from './agenda'

/** The log button is the loud one from this long before the dose: earlier it is a quiet option. */
const SOON_MS = DOSE_SOON_H * 3_600_000

/** What the card is about: the dose to take now or next, from today's agenda or from a later day. */
interface Subject {
  protocol: ProtocolRow
  at: Date
  doses: readonly StackComponent[]
}

/**
 * The one thing Hoy is for. A ring counts today's doses (done of planned), beside it the dose
 * that comes next, how long until it and how many units to draw; one button logs it. A dose
 * that is due turns the card amber.
 */
export function NextDoseCard({
  focus,
  nextUp,
  units,
  summary,
  note,
  now,
  readOnly,
  onLog,
  onLogOther,
}: {
  /** Today's dose that needs the person first: overdue, due or the next one coming. */
  focus: TodayItem | null
  /** With nothing left today, the next administration on a later day. */
  nextUp: Subject | null
  /** Syringe units to draw for the dose shown, when every vial involved is known. */
  units: number | null
  /** Today's planned doses (extras left out). */
  summary: DaySummary
  /** An aside under the dose ("Hoy no tocaba…"), or what to say with no dose at all. */
  note: string
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
  const waitMs = subject ? subject.at.getTime() - now.getTime() : 0

  const name = subject
    ? subject.protocol.name || subject.doses.map((d) => compoundName(d.compoundId)).join(' + ')
    : ''
  const doseText = subject
    ? fmtDoseList(
        subject.doses.map((d) => ({
          valueMg: d.doseMg,
          unit: compoundById(d.compoundId)?.defaultUnit ?? 'mg',
        })),
        locale,
      )
    : ''

  return (
    <Card tone={alert ? 'warn' : 'default'} className="overflow-hidden">
      <div className="flex items-center gap-4">
        <DayRing summary={summary} />
        <div className="min-w-0 flex-1">
          {subject ? (
            <>
              <div className="spec">{t('today.next')}</div>
              <div className="mt-1 flex items-start gap-1.5">
                <span className="mt-[7px] flex shrink-0 items-center gap-1" aria-hidden>
                  {subject.doses.map((d) => (
                    <SubstanceDot key={d.compoundId} color={compoundColor(d.compoundId)} />
                  ))}
                </span>
                <span className="min-w-0 break-words text-[17px] font-semibold leading-snug">
                  {name}
                </span>
              </div>
            </>
          ) : (
            <p className="text-[15px] leading-snug text-ink-2">{note}</p>
          )}
          {subject && note && (
            <p className="mt-1.5 text-[12.5px] leading-snug text-muted">{note}</p>
          )}
          {summary.missed > 0 && (
            <p className="mt-1.5 text-[12.5px] font-semibold text-danger">
              {t('today.missedN', { count: summary.missed })}
            </p>
          )}
        </div>
      </div>

      {subject && (
        <dl className="mt-4 grid grid-cols-2 divide-x divide-line rounded-control border border-line bg-panel-2">
          <Stat
            label={
              status === 'due'
                ? t('today.state')
                : status === 'overdue'
                  ? t('today.late')
                  : t('today.left')
            }
            tone={alert ? 'warn' : 'ink'}
            sub={
              <>
                {slotWhen(subject.at, now, locale)}
                {isNightSlot(subject.at) && (
                  <span className="ml-1.5 inline-flex items-center gap-1">
                    <Moon aria-hidden className="size-3" />
                    {t('today.night')}
                  </span>
                )}
              </>
            }
          >
            {status === 'due' ? (
              <span className="font-display text-[22px] font-bold leading-none">
                {t('today.dueNow')}
              </span>
            ) : (
              fmtWait(Math.abs(waitMs), locale)
            )}
          </Stat>
          <Stat
            label={units !== null ? t('today.draw') : t('today.dose')}
            tone="signal"
            sub={units !== null ? doseText : undefined}
          >
            {units !== null ? (
              <>
                {fmtNumber(units, locale, 1)}
                <span className="ml-1 text-[13px] font-medium">U</span>
              </>
            ) : (
              <span className="text-[19px]">{doseText}</span>
            )}
          </Stat>
        </dl>
      )}

      {!readOnly && (
        <div className="mt-3">
          {focus ? (
            <Button
              block
              variant={alert || waitMs <= SOON_MS ? 'primary' : 'soft'}
              leading={<Syringe className="size-4" />}
              onClick={onLog}
            >
              {t('today.logNow')}
            </Button>
          ) : (
            <Button
              block
              variant="ghost"
              size="sm"
              leading={<Syringe className="size-4" />}
              onClick={onLogOther}
            >
              {t('today.logOther')}
            </Button>
          )}
        </div>
      )}
    </Card>
  )
}

/** One figure of the strip under the dose: a quiet label over a big reading. */
function Stat({
  label,
  tone,
  sub,
  children,
}: {
  label: string
  tone: 'ink' | 'signal' | 'warn'
  /** A quiet line under the reading. */
  sub?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="min-w-0 px-3.5 py-2.5">
      <dt className="spec">{label}</dt>
      <dd
        className={clsx(
          'readout mt-1.5 text-[26px] font-semibold leading-none',
          tone === 'signal' ? 'text-signal' : tone === 'warn' ? 'text-warn' : 'text-ink',
        )}
      >
        {children}
      </dd>
      {sub && <dd className="readout mt-1.5 text-[12px] leading-tight text-muted">{sub}</dd>}
    </div>
  )
}

/** Today's doses as a ring: how many are done of those planned, and how the day stands. */
function DayRing({ summary }: { summary: DaySummary }) {
  const { t } = useTranslation()
  const { total, taken, pending, missed } = summary
  const caption =
    total === 0 ? t('today.free') : pending === 0 && missed === 0 ? t('today.done') : t('today.day')
  return (
    <Ring
      value={total > 0 ? taken / total : 0}
      size={92}
      stroke={8}
      label={total > 0 ? t('today.ringAria', { taken, total }) : t('today.free')}
    >
      <div className="text-center leading-none">
        {total > 0 ? (
          <div className="readout text-[26px] font-semibold">
            {taken}
            <span className="text-[15px] font-medium text-muted">/{total}</span>
          </div>
        ) : (
          <CalendarCheck aria-hidden className="mx-auto size-6 text-muted" />
        )}
        <div className="spec mt-1.5 text-[9px]">{caption}</div>
      </div>
    </Ring>
  )
}
