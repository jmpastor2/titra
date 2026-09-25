import { addDays, isSameDay, startOfWeek } from 'date-fns'
import { clsx } from 'clsx'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Card } from '@/components/ui/Card'
import { SubstanceDot } from '@/components/ui/primitives'
import { compoundColor } from '@/content/substanceColor'
import type { DoseRow, ProtocolRow } from '@/data/database.types'
import { protocolCompoundIds } from '@/data/mappers'
import { fmtDate } from '@/lib/format'
import { useLocale } from '@/lib/useLocale'
import { summariseWeek, weekPlanVsActual, type WeekCell } from './week'

const hhmm = (d: Date) =>
  `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`

/** "+2 h 02" / "−40 min" */
function fmtDelta(min: number): string {
  const sign = min > 0 ? '+' : '−'
  const m = Math.abs(min)
  return m < 60
    ? `${sign}${m} min`
    : `${sign}${Math.floor(m / 60)} h ${String(m % 60).padStart(2, '0')}`
}

const TONE: Record<WeekCell['status'], string> = {
  onTime: 'text-signal',
  late: 'text-warn',
  early: 'text-warn',
  missed: 'text-danger',
  due: 'text-warn',
  upcoming: 'text-muted',
}

/** The week as planned against what was injected, one row per day. */
export function WeekCard({
  protocols,
  doses,
}: {
  protocols: readonly ProtocolRow[]
  doses: readonly DoseRow[]
}) {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const [offset, setOffset] = useState(0)
  const now = useMemo(() => new Date(), [])
  const weekStart = useMemo(
    () => addDays(startOfWeek(now, { weekStartsOn: 1 }), offset * 7),
    [now, offset],
  )
  const days = useMemo(
    () => weekPlanVsActual(protocols, doses, weekStart, now),
    [protocols, doses, weekStart, now],
  )
  const summary = summariseWeek(days)

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
            className="grid size-9 place-items-center rounded-full border border-line text-ink-2"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            type="button"
            aria-label={t('week.next')}
            disabled={offset >= 0}
            onClick={() => setOffset((o) => o + 1)}
            className="grid size-9 place-items-center rounded-full border border-line text-ink-2 disabled:opacity-30"
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
        </div>
      )}

      <ul className="mt-3 divide-y divide-line border-t border-line">
        {days.map(({ day, cells }) => (
          <li
            key={day.getTime()}
            className={clsx('flex gap-3 px-4 py-2.5', isSameDay(day, now) && 'bg-signal-soft')}
          >
            <span className="w-9 shrink-0 pt-0.5">
              <span className="spec block text-[9.5px]">{fmtDate(day, locale, 'EEE')}</span>
              <span className="readout block text-[15px] font-semibold">{day.getDate()}</span>
            </span>
            {cells.length === 0 ? (
              <span className="self-center text-[12.5px] text-muted">{t('week.rest')}</span>
            ) : (
              <ul className="min-w-0 flex-1 space-y-1">
                {cells.map((c) => (
                  <li
                    key={`${c.protocol.id}:${c.plannedAt.getTime()}`}
                    className="flex items-center gap-2 text-[12.5px]"
                  >
                    <span className="flex shrink-0 gap-0.5">
                      {protocolCompoundIds(c.protocol).map((id) => (
                        <SubstanceDot key={id} color={compoundColor(id)} />
                      ))}
                    </span>
                    <span className="min-w-0 flex-1 truncate font-semibold">{c.protocol.name}</span>
                    <span className="readout shrink-0 text-muted">{hhmm(c.plannedAt)}</span>
                    <span className="readout w-[92px] shrink-0 text-right">
                      {c.takenAt ? (
                        <span className={TONE[c.status]}>
                          {hhmm(c.takenAt)}
                          {!isSameDay(c.takenAt, c.plannedAt) &&
                            ` · ${fmtDate(c.takenAt, locale, 'EEE')}`}
                          {c.status !== 'onTime' && c.deltaMin !== null && (
                            <span className="block text-[10.5px]">{fmtDelta(c.deltaMin)}</span>
                          )}
                        </span>
                      ) : (
                        <span className={TONE[c.status]}>{t(`week.status.${c.status}`)}</span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </Card>
  )
}
