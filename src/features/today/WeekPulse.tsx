import { addDays, isSameDay, startOfDay } from 'date-fns'
import { clsx } from 'clsx'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { ProgressRing } from '@/components/ui/primitives'
import { compoundColor } from '@/content/substanceColor'
import type { DoseRow, ProtocolRow } from '@/data/database.types'
import { summariseWeek, weekPlanVsActual, type WeekCell } from '@/features/doses/week'
import { fmtDate } from '@/lib/format'
import { useLocale } from '@/lib/useLocale'

/** The last seven days at a glance: one row per protocol, one column per day. */
export function useLastSevenDays(
  protocols: readonly ProtocolRow[],
  doses: readonly DoseRow[],
  now: Date,
) {
  return useMemo(() => {
    const from = addDays(startOfDay(now), -6)
    const days = weekPlanVsActual(
      protocols.filter((p) => p.status === 'active'),
      doses,
      from,
      now,
    )
    return { days, summary: summariseWeek(days) }
  }, [protocols, doses, now])
}

export function WeekRing({
  summary,
  extras,
}: {
  summary: ReturnType<typeof summariseWeek>
  extras: number
}) {
  const { t } = useTranslation()
  return (
    <ProgressRing
      fraction={summary.planned ? summary.taken / summary.planned : 1}
      size={96}
      stroke={7}
    >
      <div className="text-center leading-none">
        <div className="readout text-glow text-[24px] font-semibold">
          {summary.taken}
          <span className="text-[14px] text-muted">/{summary.planned}</span>
        </div>
        <div className="spec mt-1 text-[8.5px]">{t('today.last7')}</div>
        {extras > 0 && (
          <div className="readout mt-1 text-[10px] font-semibold text-accent">
            +{extras} {t('today.extraShort')}
          </div>
        )}
      </div>
    </ProgressRing>
  )
}

function Mark({ cell }: { cell: WeekCell }) {
  const color = compoundColor(cell.protocol.compound_id)
  const base = 'block size-[11px] rounded-full'
  switch (cell.status) {
    case 'onTime':
      return <span className={base} style={{ background: color, boxShadow: `0 0 6px ${color}` }} />
    case 'late':
    case 'early':
      return (
        <span
          className={clsx(base, 'ring-2 ring-warn ring-offset-1 ring-offset-[var(--panel)]')}
          style={{ background: color }}
        />
      )
    case 'extra':
      return (
        <span
          className="block size-[9px] rotate-45 rounded-[2px] ring-1 ring-accent"
          style={{ background: color }}
        />
      )
    case 'missed':
      return <span className={clsx(base, 'border-[1.5px] border-danger bg-danger-soft')} />
    case 'due':
      return <span className={clsx(base, 'pulse-ring border-[1.5px] border-warn')} />
    default:
      return <span className={clsx(base, 'border border-line-strong')} />
  }
}

export function WeekGrid({
  days,
  protocols,
  now,
}: {
  days: ReturnType<typeof weekPlanVsActual>
  protocols: readonly ProtocolRow[]
  now: Date
}) {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const rows = protocols.filter((p) => p.status === 'active')
  if (!rows.length) return null

  return (
    <div className="mt-4">
      <div
        className="grid items-center gap-y-2"
        style={{ gridTemplateColumns: `minmax(0, 1fr) repeat(7, 26px)` }}
      >
        <span />
        {days.map(({ day }) => (
          <span
            key={day.getTime()}
            className={clsx(
              'spec text-center text-[9px]',
              isSameDay(day, now) && 'rounded-full bg-signal-soft py-0.5 text-signal',
            )}
          >
            {fmtDate(day, locale, 'EEEEE')}
          </span>
        ))}
        {rows.map((p) => (
          <Row key={p.id} protocol={p} days={days} now={now} />
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[10.5px] text-muted">
        {(['onTime', 'late', 'missed', 'upcoming', 'extra'] as const).map((s) => (
          <span key={s} className="inline-flex items-center gap-1">
            <Mark
              cell={{
                protocol: rows[0]!,
                plannedAt: now,
                takenAt: null,
                deltaMin: null,
                status: s,
              }}
            />
            {t(`today.legend.${s}`)}
          </span>
        ))}
      </div>
    </div>
  )
}

function Row({
  protocol,
  days,
  now,
}: {
  protocol: ProtocolRow
  days: ReturnType<typeof weekPlanVsActual>
  now: Date
}) {
  return (
    <>
      <span className="flex min-w-0 items-center gap-1.5 pr-2">
        <span
          className="size-1.5 shrink-0 rounded-full"
          style={{ background: compoundColor(protocol.compound_id) }}
        />
        <span className="truncate text-[12px] font-semibold text-ink-2">{protocol.name}</span>
      </span>
      {days.map(({ day, cells }) => {
        const mine = cells.filter((c) => c.protocol.id === protocol.id)
        return (
          <span
            key={day.getTime()}
            className={clsx(
              'flex h-6 items-center justify-center gap-0.5 rounded-md',
              isSameDay(day, now) && 'bg-signal-soft',
            )}
          >
            {mine.length === 0 ? (
              <span className="block h-px w-2 bg-line-strong" />
            ) : (
              mine.slice(0, 3).map((c) => <Mark key={c.plannedAt.getTime()} cell={c} />)
            )}
          </span>
        )
      })}
    </>
  )
}
