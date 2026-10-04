import { isSameDay } from 'date-fns'
import { CalendarCheck, Check, MoreHorizontal } from 'lucide-react'
import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/primitives'
import { compoundColor } from '@/content/substanceColor'
import type { InventoryRow } from '@/data/database.types'
import { fmtDate, fmtDateTime, fmtDoseList, fmtNumber, toTimeInputValue } from '@/lib/format'
import { useLocale } from '@/lib/useLocale'
import { drawnUnits, substanceLine, type Administration } from './administrations'
import { fitOf, fmtDeltaMin, wholeDays, type Fit } from './delta'
import { unitOf } from './doseLines'
import type { ExtraDose } from './extras'
import { slotDayText } from './slotText'
import type { WeekCell } from './week'

export interface AdministrationRowProps {
  administration: Administration
  /** How the dose sits against the plan; none for a dose no protocol administers. */
  cell: WeekCell | undefined
  /** Set when it is an extra with a missed administration it could make up. */
  extra: ExtraDose | undefined
  vials: ReadonlyMap<string, InventoryRow>
  readOnly: boolean
  onActions: (key: string) => void
  onAssign: (extra: ExtraDose) => void
}

/** One line of the log: when, what, how much, where, how it went against the plan. */
export const AdministrationRow = memo(function AdministrationRow({
  administration: a,
  cell,
  extra,
  vials,
  readOnly,
  onActions,
  onAssign,
}: AdministrationRowProps) {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const fit = cell ? fitOf(cell) : undefined
  const names = substanceLine(a)
  const first = a.rows[0]
  const site = first?.site_id ? t(`sites.labels.${first.site_id}`) : null
  const units = drawnUnits(a.rows, vials)
  const n = (x: number) => fmtNumber(x, locale, 1)
  const total = units?.reduce((sum, u) => sum + u, 0) ?? 0
  const unitsText =
    units && (units.length > 1 ? `${units.map(n).join(' + ')} = ${n(total)} U` : `${n(total)} U`)
  const covers =
    cell && fit && (fit.kind === 'makeUp' || fit.kind === 'ahead')
      ? slotDayText({ at: cell.plannedAt, day: cell.slotDay }, locale)
      : null
  // A night shot taken after midnight reads as the evening it belongs to.
  const night = cell?.slotDay && !covers && !isSameDay(cell.slotDay, a.at) ? cell.slotDay : null

  const colors = a.rows.map((r) => compoundColor(r.compound_id))
  const stripe =
    colors.length > 1
      ? `linear-gradient(to bottom, ${colors
          .map((c, i) => `${c} ${(i / colors.length) * 100}% ${((i + 1) / colors.length) * 100}%`)
          .join(', ')})`
      : colors[0]

  const body = (
    <>
      <span className="w-12 shrink-0 text-center">
        <span className="readout block text-[14px] font-semibold text-ink-2">
          {toTimeInputValue(a.at)}
        </span>
        {night && (
          <span className="spec mt-0.5 block text-[8px] leading-tight">
            {t('doses.nightOf', { day: fmtDate(night, locale, 'EEE') })}
          </span>
        )}
      </span>
      <span
        aria-hidden
        className="w-1 shrink-0 self-stretch rounded-full"
        style={{ background: stripe }}
      />
      <span className="min-w-0 flex-1">
        <span className="line-clamp-2 text-[14.5px] font-semibold leading-snug">{names}</span>
        <span className="readout mt-0.5 flex min-w-0 flex-wrap items-baseline gap-x-2 text-[12.5px]">
          <span className="text-ink-2">
            {fmtDoseList(
              a.rows.map((r) => ({ valueMg: Number(r.dose_mg), unit: unitOf(r.compound_id) })),
              locale,
            )}
          </span>
          {unitsText && <span className="font-semibold text-signal">{unitsText}</span>}
        </span>
        {(fit || site) && (
          <span className="mt-1.5 flex min-w-0 flex-wrap items-center gap-x-2.5 gap-y-1">
            {fit && <FitMark fit={fit} />}
            {covers && (
              <span className="text-[12px] text-muted">
                {t('doses.fit.covers', { slot: covers })}
              </span>
            )}
            {site && <span className="min-w-0 truncate text-[12px] text-muted">{site}</span>}
          </span>
        )}
        {first?.notes && (
          <span className="mt-1 block truncate text-[12px] italic text-muted">{first.notes}</span>
        )}
      </span>
      {!readOnly && (
        <span
          className="grid size-11 shrink-0 place-items-center rounded-full border border-line text-ink-2"
          aria-hidden
        >
          <MoreHorizontal className="size-5" />
        </span>
      )}
    </>
  )

  return (
    <li>
      {readOnly ? (
        <div className="flex items-center gap-3 py-3">{body}</div>
      ) : (
        <button
          type="button"
          onClick={() => onActions(a.key)}
          aria-label={t('doses.rowActions', { what: names, when: fmtDateTime(a.at, locale) })}
          className="-mx-2 flex w-[calc(100%+1rem)] items-center gap-3 rounded-[14px] px-2 py-3 text-left transition active:bg-panel-2"
        >
          {body}
        </button>
      )}
      {!readOnly && extra?.suggested && (
        <div className="pb-3 pl-[3.75rem]">
          <button
            type="button"
            onClick={() => onAssign(extra)}
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-accent/40 bg-accent-soft px-4 text-[13px] font-semibold text-accent transition active:scale-[0.98]"
          >
            <CalendarCheck className="size-4" aria-hidden />
            {t('doses.assignAsk', { slot: slotDayText(extra.suggested, locale) })}
          </button>
        </div>
      )}
    </li>
  )
})

/** On time is the norm and reads quietly; what is off the plan stands out. */
function FitMark({ fit }: { fit: Fit }) {
  const { t } = useTranslation()
  switch (fit.kind) {
    case 'onTime':
      return (
        <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-signal">
          <Check className="size-3.5" strokeWidth={3} aria-hidden />
          {t('doses.fit.onTime')}
        </span>
      )
    case 'late':
    case 'early':
      return <Badge tone="warn">{fmtDeltaMin(fit.deltaMin)}</Badge>
    case 'makeUp':
      return <Badge tone="warn">{t('doses.fit.lateDays', { days: wholeDays(fit.deltaMin) })}</Badge>
    case 'ahead':
      return (
        <Badge tone="warn">{t('doses.fit.earlyDays', { days: wholeDays(fit.deltaMin) })}</Badge>
      )
    case 'extra':
      return <Badge tone="accent">{t('doses.fit.extra')}</Badge>
  }
}
