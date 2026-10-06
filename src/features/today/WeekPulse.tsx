import { isSameDay } from 'date-fns'
import { clsx } from 'clsx'
import { useTranslation } from 'react-i18next'
import { compoundColor } from '@/content/substanceColor'
import type { ProtocolRow } from '@/data/database.types'
import type { weekPlanVsActual, WeekCell } from '@/features/doses/week'
import { useLocale } from '@/lib/useLocale'
import { weekdayInitial } from './agenda'

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

/**
 * The legend entries, in reading order: which statuses of the grid each one explains. A dose
 * on its hour is the plain filled dot and needs no entry.
 */
const LEGEND = [
  { key: 'late', statuses: ['late', 'early'] },
  { key: 'missed', statuses: ['missed'] },
  { key: 'upcoming', statuses: ['upcoming', 'due'] },
  { key: 'extra', statuses: ['extra'] },
] as const satisfies readonly { key: string; statuses: readonly WeekCell['status'][] }[]

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

  // Only what needs explaining: the marks that are actually on the grid.
  const present = new Set(days.flatMap((d) => d.cells.map((c) => c.status)))
  const legend = LEGEND.filter((l) => l.statuses.some((s) => present.has(s)))

  return (
    <div role="group" aria-label={t('today.week')}>
      <div
        className="grid items-center gap-y-1.5"
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
            {weekdayInitial(day, locale)}
          </span>
        ))}
        {rows.map((p) => (
          <Row key={p.id} protocol={p} days={days} now={now} />
        ))}
      </div>
      {legend.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-x-3.5 gap-y-1.5 text-[11px] text-muted">
          {legend.map(({ key, statuses }) => (
            <span key={key} className="inline-flex items-center gap-1.5">
              <span className="grid size-4 place-items-center">
                <Mark
                  cell={{
                    protocol: rows[0]!,
                    plannedAt: now,
                    takenAt: null,
                    deltaMin: null,
                    status: statuses[0],
                  }}
                />
              </span>
              {t(`today.legend.${key}`)}
            </span>
          ))}
        </div>
      )}
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
      <span className="flex min-h-7 min-w-0 items-center gap-1.5 pr-2">
        <span
          className="size-1.5 shrink-0 rounded-full"
          style={{ background: compoundColor(protocol.compound_id) }}
        />
        <span className="line-clamp-2 hyphens-auto break-words text-[12px] font-semibold leading-tight text-ink-2">
          {protocol.name}
        </span>
      </span>
      {days.map(({ day, cells }) => {
        const mine = cells.filter((c) => c.protocol.id === protocol.id)
        return (
          <span
            key={day.getTime()}
            className={clsx(
              'flex h-7 items-center justify-center gap-0.5 rounded-md',
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
