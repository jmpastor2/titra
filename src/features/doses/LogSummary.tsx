import { clsx } from 'clsx'
import { isToday, isTomorrow } from 'date-fns'
import { Check, ChevronDown, Moon, X } from 'lucide-react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Card } from '@/components/ui/Card'
import { Ring } from '@/components/kpi/Ring'
import { Badge } from '@/components/ui/primitives'
import { isNightSlot } from '@/features/today/agenda'
import { fmtDate, fmtPercent, toTimeInputValue } from '@/lib/format'
import { useLocale } from '@/lib/useLocale'
import { substanceLine } from './administrations'
import { fmtElapsed, type DayMark, type LogKpis, type StripDay } from './logKpis'

/**
 * The head of Registro: how the week is going (ring and one dot per day), how the last four
 * weeks went, how long since the last dose and what comes next. The plan of the week, with
 * the doses to log or fix, opens from the foot.
 */
export function LogSummary({
  kpis,
  now,
  planOpen,
  onTogglePlan,
}: {
  kpis: LogKpis
  now: Date
  planOpen: boolean
  onTogglePlan: () => void
}) {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const { week, strip, adherence, last, next } = kpis

  const headline =
    week.planned === 0
      ? t('doses.kpi.noPlan')
      : week.remaining > 0
        ? t('doses.kpi.left', { count: week.remaining })
        : week.missed > 0
          ? t('doses.kpi.doneOf', { taken: week.taken, planned: week.planned })
          : t('doses.kpi.complete')

  const ago = last ? fmtElapsed(last.at, now, locale) : ''

  const nextDay = (at: Date) =>
    isToday(at)
      ? t('doses.kpi.today')
      : isTomorrow(at)
        ? t('doses.kpi.tomorrow')
        : fmtDate(at, locale, 'EEE d')

  return (
    <Card instrument padded={false} className="mb-5">
      <div className="p-4 pb-3">
        <div className="flex items-center gap-4">
          <Ring
            value={week.planned > 0 ? week.taken / week.planned : 0}
            size={84}
            stroke={8}
            color={week.missed > 0 ? 'var(--warn)' : 'var(--signal)'}
            label={t('doses.kpi.doneOf', { taken: week.taken, planned: week.planned })}
          >
            <div className="text-center leading-none">
              <div className="readout text-[24px] font-semibold">{week.taken}</div>
              <div className="spec mt-1 text-[10px]">/{week.planned}</div>
            </div>
          </Ring>
          <div className="min-w-0 flex-1">
            <div className="spec">{t('doses.kpi.eyebrow')}</div>
            <div className="mt-1 font-display text-[21px] font-semibold leading-tight">
              {headline}
            </div>
            <div className="mt-1 flex flex-wrap gap-x-2.5 gap-y-0.5 text-[12.5px] text-muted">
              <span>{t('doses.kpi.taken', { count: week.taken })}</span>
              {week.missed > 0 && (
                <span className="font-semibold text-danger">
                  {t('doses.kpi.missed', { count: week.missed })}
                </span>
              )}
              {week.extras > 0 && (
                <span className="font-semibold text-accent">
                  {t('doses.kpi.extras', { count: week.extras })}
                </span>
              )}
            </div>
          </div>
        </div>

        <ol className="mt-4 grid grid-cols-7 gap-1" aria-hidden>
          {strip.map((d) => (
            <DayDot key={d.day.getTime()} day={d} />
          ))}
        </ol>
      </div>

      <dl className="grid grid-cols-1 divide-y divide-line border-t border-line min-[360px]:grid-cols-3 min-[360px]:divide-x min-[360px]:divide-y-0">
        <Tile label={t('doses.kpi.adherence')}>
          <dd
            className={clsx(
              'readout text-[19px] font-semibold leading-none',
              adherence && (adherence.ratio >= 0.9 ? 'text-signal' : 'text-warn'),
            )}
          >
            {adherence ? fmtPercent(adherence.ratio, locale) : '—'}
          </dd>
          <dd className="mt-1.5 text-[11.5px] leading-snug text-muted">
            {adherence
              ? t('doses.kpi.adherenceSub', {
                  taken: adherence.taken,
                  expected: adherence.expected,
                })
              : t('doses.kpi.noData')}
          </dd>
        </Tile>
        <Tile label={t('doses.kpi.last')}>
          <dd
            className={clsx(
              'readout whitespace-nowrap font-semibold leading-none',
              ago.length > 8 ? 'text-[16px]' : 'text-[19px]',
            )}
          >
            {last ? ago : '—'}
          </dd>
          <dd className="mt-1.5 text-[11.5px] leading-snug text-muted">
            {last ? substanceLine(last) : t('doses.kpi.noneYet')}
          </dd>
        </Tile>
        <Tile label={t('doses.kpi.next')}>
          <dd
            className={clsx(
              'readout flex items-center gap-1 text-[19px] font-semibold leading-none',
              next?.due && 'text-warn',
            )}
          >
            {next ? (next.due ? t('doses.kpi.now') : toTimeInputValue(next.at)) : '—'}
            {next && !next.due && isNightSlot(next.at) && (
              <Moon role="img" aria-label={t('today.night')} className="size-3.5 text-muted" />
            )}
          </dd>
          <dd className="mt-1.5 text-[11.5px] leading-snug text-muted">
            {next ? `${nextDay(next.slotDay)} · ${next.protocol.name}` : t('doses.kpi.nothingNext')}
          </dd>
        </Tile>
      </dl>

      <button
        type="button"
        aria-expanded={planOpen}
        onClick={onTogglePlan}
        className="flex min-h-12 w-full items-center justify-between gap-3 rounded-b-card border-t border-line px-4 text-left text-[13.5px] font-semibold text-ink-2 outline-none transition active:bg-panel-2 focus-visible:ring-2 focus-visible:ring-signal/60"
      >
        <span className="flex items-center gap-2">
          {t('doses.kpi.plan')}
          {!planOpen && week.missed > 0 && (
            <Badge tone="danger">{t('doses.kpi.missed', { count: week.missed })}</Badge>
          )}
        </span>
        <ChevronDown
          aria-hidden
          className={clsx('size-4 text-muted transition-transform', planOpen && 'rotate-180')}
        />
      </button>
    </Card>
  )
}

function Tile({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0 px-4 py-3 min-[360px]:px-3 min-[360px]:first:pl-4 min-[360px]:last:pr-4">
      <dt className="spec text-[9.5px] leading-snug tracking-[0.1em]">{label}</dt>
      <div className="mt-1.5">{children}</div>
    </div>
  )
}

const DOT: Record<DayMark, string> = {
  rest: 'border-transparent text-muted',
  upcoming: 'border-line-strong text-muted',
  partial: 'border-signal/60 bg-signal-soft text-signal',
  due: 'border-warn bg-warn-soft text-warn',
  done: 'border-signal bg-signal text-signal-ink',
  late: 'border-warn/60 bg-warn-soft text-warn',
  missed: 'border-danger/60 bg-danger-soft text-danger',
}

/** One day of the week: its letter and a mark for how it went. */
function DayDot({ day: d }: { day: StripDay }) {
  const { locale } = useLocale()
  const today = isToday(d.day)
  return (
    <li className="flex flex-col items-center gap-1">
      <span className={clsx('spec text-[9.5px] tracking-[0.06em]', today && 'text-signal')}>
        {fmtDate(d.day, locale, 'EEE')}
      </span>
      <span
        className={clsx(
          'relative grid size-8 place-items-center rounded-full border',
          DOT[d.mark],
          today && 'ring-2 ring-signal/40 ring-offset-2 ring-offset-panel',
        )}
      >
        {d.mark === 'done' || d.mark === 'late' ? (
          <Check className="size-4" strokeWidth={3} />
        ) : d.mark === 'missed' ? (
          <X className="size-4" strokeWidth={3} />
        ) : (
          <span className="readout text-[12px] font-semibold">{d.day.getDate()}</span>
        )}
        {d.extra && (
          <span className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full border-2 border-panel bg-accent" />
        )}
      </span>
    </li>
  )
}
