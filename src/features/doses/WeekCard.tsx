import { addDays, isSameDay, startOfWeek } from 'date-fns'
import { clsx } from 'clsx'
import { CalendarCheck, Check, ChevronLeft, ChevronRight, Moon } from 'lucide-react'
import { useMemo, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Card } from '@/components/ui/Card'
import { Badge, SubstanceDot } from '@/components/ui/primitives'
import { compoundColor } from '@/content/substanceColor'
import type { DoseRow, ProtocolRow } from '@/data/database.types'
import { protocolCompoundIds } from '@/data/mappers'
import { isNightSlot } from '@/features/today/agenda'
import { fmtDate, toTimeInputValue } from '@/lib/format'
import { useLocale } from '@/lib/useLocale'
import { useNow } from '@/lib/useNow'
import { fitOf, fmtDeltaMin } from './delta'
import type { ExtraDose } from './extras'
import { slotDayText } from './slotText'
import { summariseWeek, weekPlanVsActual, type WeekCell } from './week'

type BadgeTone = 'neutral' | 'ok' | 'warn' | 'danger' | 'accent'

/**
 * The week as planned against what was injected, one row per day. Tapping a taken dose
 * opens it to edit, a missed or due one to log it; an extra offers the missed
 * administration it could be.
 */
export function WeekCard({
  protocols,
  doses,
  extras,
  onLog,
  onEdit,
  onAssign,
}: {
  protocols: readonly ProtocolRow[]
  doses: readonly DoseRow[]
  /** Extras by administration key, with what each could make up. */
  extras?: ReadonlyMap<string, ExtraDose>
  /** Log a missed or due administration at its planned time. */
  onLog?: (protocolId: string, plannedAt: Date) => void
  /** Open a taken dose (by the key of its administration) to edit or delete it. */
  onEdit?: (doseKey: string) => void
  /** Make an extra cover the missed administration it was suggested. */
  onAssign?: (extra: ExtraDose) => void
}) {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const [offset, setOffset] = useState(0)
  // Refreshed every few minutes: a screen left open overnight still lights the right day.
  const now = useNow(5 * 60_000)
  const weekStart = useMemo(
    () => addDays(startOfWeek(now, { weekStartsOn: 1 }), offset * 7),
    [now, offset],
  )
  const days = useMemo(
    () => weekPlanVsActual(protocols, doses, weekStart, now),
    [protocols, doses, weekStart, now],
  )
  const summary = summariseWeek(days)
  const extraCount = days.flatMap((d) => d.cells).filter((c) => c.status === 'extra').length

  return (
    <Card instrument className="mb-4" padded={false}>
      <div className="flex items-center justify-between px-4 pt-4">
        <div>
          <div className="spec">{t('week.eyebrow')}</div>
          <h2 className="font-display text-[17px] font-semibold">
            {offset === 0
              ? t('week.thisWeek')
              : `${fmtDate(weekStart, locale, 'd MMM')} – ${fmtDate(addDays(weekStart, 6), locale, 'd MMM')}`}
          </h2>
        </div>
        <div className="flex gap-1">
          <button
            type="button"
            aria-label={t('week.previous')}
            onClick={() => setOffset((o) => o - 1)}
            className="grid size-11 place-items-center rounded-full border border-line text-ink-2"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            type="button"
            aria-label={t('week.next')}
            disabled={offset >= 0}
            onClick={() => setOffset((o) => o + 1)}
            className="grid size-11 place-items-center rounded-full border border-line text-ink-2 disabled:opacity-30"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>

      {summary.planned > 0 && (
        <div className="readout mt-1 px-4 text-[12.5px] text-muted">
          <span className="font-semibold text-ink">
            {summary.taken}/{summary.planned}
          </span>{' '}
          {t('week.taken')} · <span className="text-signal">{summary.onTime}</span>{' '}
          {t('week.onTime')}
          {summary.offTime > 0 && (
            <>
              {' '}
              · <span className="text-warn">{summary.offTime}</span> {t('week.offTime')}
            </>
          )}
          {summary.missed > 0 && (
            <>
              {' '}
              · <span className="text-danger">{summary.missed}</span> {t('week.missed')}
            </>
          )}
          {extraCount > 0 && (
            <>
              {' '}
              · <span className="text-accent">{extraCount}</span>{' '}
              {t('week.extras', { count: extraCount })}
            </>
          )}
        </div>
      )}

      <ul className="mt-3 divide-y divide-line border-t border-line">
        {days.map(({ day, cells }) => (
          <li
            key={day.getTime()}
            className={clsx('flex gap-3 px-4 py-2', isSameDay(day, now) && 'bg-signal-soft')}
          >
            <span className="w-9 shrink-0 pt-3">
              <span className="spec block text-[9.5px]">{fmtDate(day, locale, 'EEE')}</span>
              <span className="readout block text-[15px] font-semibold">{day.getDate()}</span>
            </span>
            {cells.length === 0 ? (
              <span className="self-center py-2 text-[12.5px] text-muted">{t('week.rest')}</span>
            ) : (
              <ul className="min-w-0 flex-1">
                {cells.map((c) => (
                  <Cell
                    key={`${c.protocol.id}:${c.plannedAt.getTime()}`}
                    cell={c}
                    extra={c.doseKey ? extras?.get(c.doseKey) : undefined}
                    onLog={onLog}
                    onEdit={onEdit}
                    onAssign={onAssign}
                  />
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>

      <Legend />
    </Card>
  )
}

function Cell({
  cell: c,
  extra,
  onLog,
  onEdit,
  onAssign,
}: {
  cell: WeekCell
  extra: ExtraDose | undefined
  onLog: ((protocolId: string, plannedAt: Date) => void) | undefined
  onEdit: ((doseKey: string) => void) | undefined
  onAssign: ((extra: ExtraDose) => void) | undefined
}) {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const fit = c.takenAt ? fitOf(c) : undefined

  const [tone, badge]: [BadgeTone, string] = (() => {
    if (fit)
      switch (fit.kind) {
        case 'onTime':
          return ['ok', t('week.status.onTime')]
        case 'late':
        case 'early':
        case 'makeUp':
        case 'ahead':
          // Days, not a pile of hours: "+5 d 7 h".
          return ['warn', fmtDeltaMin(fit.deltaMin)]
        case 'extra':
          return ['accent', t('week.status.extra')]
      }
    if (c.status === 'missed') return ['danger', t('week.status.missed')]
    if (c.status === 'due') return ['warn', t('week.status.due')]
    return ['neutral', t('week.status.upcoming')]
  })()

  // What a tap does: open the dose that was taken, or log the one that was not.
  const doseKey = c.doseKey
  const action =
    doseKey && onEdit
      ? () => onEdit(doseKey)
      : onLog && (c.status === 'missed' || c.status === 'due')
        ? () => onLog(c.protocol.id, c.plannedAt)
        : undefined

  const content: ReactNode = (
    <>
      <span className="flex min-w-0 items-center gap-2">
        <span className="flex shrink-0 gap-0.5" aria-hidden>
          {protocolCompoundIds(c.protocol).map((id) => (
            <SubstanceDot key={id} color={compoundColor(id)} />
          ))}
        </span>
        <span className="min-w-0 flex-1 truncate text-[13px] font-semibold">{c.protocol.name}</span>
        {fit?.kind === 'onTime' ? (
          // On time is the norm: a quiet check, so what is off the plan stands out.
          <Check
            role="img"
            aria-label={badge}
            className="mr-1 size-4 shrink-0 text-signal"
            strokeWidth={3}
          />
        ) : (
          <Badge tone={tone}>{badge}</Badge>
        )}
      </span>
      <span className="readout mt-0.5 block pl-[1.4rem] text-[11.5px] text-muted">
        {c.status === 'extra' ? (
          <span className="text-accent">{toTimeInputValue(c.takenAt ?? c.plannedAt)}</span>
        ) : (
          <>
            {toTimeInputValue(c.plannedAt)}
            {isNightSlot(c.plannedAt) && (
              <Moon
                role="img"
                aria-label={t('today.night')}
                className="ml-1 inline size-3 align-[-1px] text-muted"
              />
            )}
            {c.takenAt && (
              <>
                {' → '}
                <span className={tone === 'ok' ? 'text-signal' : 'text-warn'}>
                  {toTimeInputValue(c.takenAt)}
                  {!isSameDay(c.takenAt, c.plannedAt) &&
                    ` · ${fmtDate(c.takenAt, locale, 'EEE d')}`}
                </span>
              </>
            )}
            {!c.takenAt && action && (
              <span className={c.status === 'missed' ? 'text-danger' : 'text-warn'}>
                {' · '}
                {t('week.tapToLog')}
              </span>
            )}
          </>
        )}
      </span>
    </>
  )

  return (
    <li className="py-0.5">
      {action ? (
        <button
          type="button"
          onClick={action}
          className="-mx-2 block min-h-11 w-[calc(100%+1rem)] rounded-[12px] px-2 py-1.5 text-left transition active:bg-panel-2"
        >
          {content}
        </button>
      ) : (
        <div className="min-h-11 py-1.5">{content}</div>
      )}
      {extra?.suggested && onAssign && (
        <button
          type="button"
          onClick={() => onAssign(extra)}
          className="mb-1 ml-[1.4rem] inline-flex min-h-11 items-center gap-2 rounded-full border border-accent/40 bg-accent-soft px-3.5 text-[12.5px] font-semibold text-accent transition active:scale-[0.98]"
        >
          <CalendarCheck className="size-4" aria-hidden />
          {t('doses.assignAsk', { slot: slotDayText(extra.suggested, locale) })}
        </button>
      )}
    </li>
  )
}

/** What each mark of the week means. */
function Legend() {
  const { t } = useTranslation()
  const marks: { key: string; tone: BadgeTone; label: string }[] = [
    { key: 'onTime', tone: 'ok', label: t('week.legend.onTime') },
    { key: 'late', tone: 'warn', label: t('week.legend.late') },
    { key: 'missed', tone: 'danger', label: t('week.legend.missed') },
    { key: 'extra', tone: 'accent', label: t('week.legend.extra') },
    { key: 'upcoming', tone: 'neutral', label: t('week.legend.upcoming') },
  ]
  const color: Record<BadgeTone, string> = {
    ok: 'bg-ok',
    warn: 'bg-warn',
    danger: 'bg-danger',
    accent: 'bg-accent',
    neutral: 'bg-line-strong',
  }
  return (
    <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1.5 border-t border-line px-4 py-3 text-[11.5px] text-muted">
      {marks.map((m) => (
        <span key={m.key} className="inline-flex items-center gap-1.5">
          <span aria-hidden className={clsx('size-2 rounded-full', color[m.tone])} />
          {m.label}
        </span>
      ))}
      <span className="basis-full text-[11.5px]">{t('week.tapHint')}</span>
    </div>
  )
}
