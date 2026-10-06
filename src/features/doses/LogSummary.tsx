import { clsx } from 'clsx'
import { isToday, isTomorrow } from 'date-fns'
import { ChevronDown, Moon } from 'lucide-react'
import { Fragment, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Kpi } from '@/components/kpi/Kpi'
import { Ticks } from '@/components/kpi/Ticks'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/primitives'
import { isNightSlot } from '@/features/today/agenda'
import { fmtDate, fmtNumber, fmtPercent, toTimeInputValue } from '@/lib/format'
import { useLocale } from '@/lib/useLocale'
import { Fact, FactRow } from './Fact'
import { tickOf, type LogKpis } from './logKpis'
import { fmtPunctuality, type Punctuality } from './punctuality'

/**
 * The head of Registro: the week in one figure with a bar per day, then three facts — how
 * the last four weeks went, how close to their time the doses go in, and what comes next.
 * The plan of the week, with the doses to log or fix, opens from the foot.
 */
export function LogSummary({
  kpis,
  punctuality,
  planOpen,
  onTogglePlan,
}: {
  kpis: LogKpis
  /** Over the last 28 days; null when nothing planned was taken in them. */
  punctuality: Punctuality | null
  planOpen: boolean
  onTogglePlan: () => void
}) {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const { week, strip, adherence, next } = kpis

  // What the figure means, in words: what is left, what was missed, what was extra.
  const status: { key: string; text: string; tone?: string }[] = []
  if (week.planned === 0) status.push({ key: 'plan', text: t('doses.kpi.noPlan') })
  else if (week.remaining > 0)
    status.push({ key: 'left', text: t('doses.kpi.left', { count: week.remaining }) })
  else if (week.missed === 0) status.push({ key: 'done', text: t('doses.kpi.complete') })
  if (week.missed > 0)
    status.push({
      key: 'missed',
      text: t('doses.kpi.missed', { count: week.missed }),
      tone: 'text-danger',
    })
  if (week.extras > 0)
    status.push({ key: 'extras', text: t('doses.kpi.extras', { count: week.extras }) })

  const nextDay = (at: Date) =>
    isToday(at)
      ? t('doses.kpi.today')
      : isTomorrow(at)
        ? t('doses.kpi.tomorrow')
        : fmtDate(at, locale, 'EEE d')

  const facts: ReactNode[] = []
  if (adherence) {
    facts.push(
      <Fact
        key="adherence"
        label={t('doses.kpi.adherence')}
        value={fmtNumber(Math.round(adherence.ratio * 100), locale, 0)}
        unit="%"
        tone={adherence.ratio >= 0.9 ? 'signal' : 'warn'}
        caption={t('doses.kpi.inWindow', { taken: adherence.taken, expected: adherence.expected })}
      />,
    )
  }
  if (punctuality) {
    const p = fmtPunctuality(punctuality.medianMin, locale)
    facts.push(
      <Fact
        key="punctuality"
        label={t('doses.kpi.punctuality')}
        value={p.value}
        unit={p.unit}
        caption={t('doses.kpi.onTimeShare', { percent: fmtPercent(punctuality.onTime, locale) })}
      />,
    )
  }
  if (next) {
    facts.push(
      <Fact
        key="next"
        label={t('doses.kpi.next')}
        value={next.due ? t('doses.kpi.now') : toTimeInputValue(next.at)}
        tone={next.due ? 'warn' : 'default'}
        icon={
          !next.due && isNightSlot(next.at) ? (
            <Moon role="img" aria-label={t('today.night')} className="size-3.5 text-muted" />
          ) : null
        }
        caption={`${nextDay(next.slotDay)} · ${next.protocol.name}`}
        // Below 360 px it takes a row of its own, so the name has room to wrap.
        wide={facts.length === 2}
      />,
    )
  }

  return (
    <Card padded={false} className="mb-5">
      <div className="p-4">
        <Kpi
          label={t('doses.kpi.eyebrow')}
          value={week.taken}
          unit={
            week.planned > 0
              ? t('doses.kpi.ofPlanned', { count: week.planned })
              : t('doses.kpi.doses', { count: week.taken })
          }
          caption={status.map((part, i) => (
            <Fragment key={part.key}>
              {i > 0 && ' · '}
              <span className={part.tone}>{part.text}</span>
            </Fragment>
          ))}
        />
        <div className="mt-3.5">
          <Ticks cells={strip.map(tickOf)} todayLast={false} height={22} />
          <ol className="mt-1.5 flex gap-[3px]" aria-hidden>
            {strip.map((d) => (
              <li
                key={d.day.getTime()}
                className={clsx(
                  'min-w-[3px] flex-1 text-center text-[11px] leading-none first-letter:uppercase',
                  isToday(d.day) ? 'font-semibold text-ink' : 'text-muted',
                )}
              >
                {fmtDate(d.day, locale, 'EEEEE')}
              </li>
            ))}
          </ol>
        </div>
      </div>

      <FactRow count={facts.length}>{facts}</FactRow>

      <button
        type="button"
        aria-expanded={planOpen}
        onClick={onTogglePlan}
        className="flex min-h-12 w-full items-center justify-between gap-3 rounded-b-card border-t border-line px-4 text-left text-[14px] font-medium text-ink-2 outline-none transition active:bg-panel-2 focus-visible:ring-2 focus-visible:ring-signal/60"
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
