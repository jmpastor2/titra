import { clsx } from 'clsx'
import { AlertTriangle, Check, Syringe } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { SubstanceDot } from '@/components/ui/primitives'
import { compoundById } from '@/content/compounds'
import { compoundColor } from '@/content/substanceColor'
import { fmtDoseList, fmtHours, fmtNumber, toTimeInputValue as hhmm } from '@/lib/format'
import { useLocale } from '@/lib/useLocale'
import { isNightSlot, type TodayItem } from './agenda'

export function AgendaRow({
  item,
  now,
  onLog,
  units,
  readOnly,
}: {
  item: TodayItem
  now: Date
  onLog: () => void
  /** Syringe units to draw, when every vial in the administration is known. */
  units?: number | null
  readOnly?: boolean
}) {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const taken = item.status === 'taken'
  const alert = item.status === 'due' || item.status === 'overdue'
  const missed = item.status === 'missed'
  const name =
    item.protocol.name ||
    item.doses.map((d) => compoundById(d.compoundId)?.names.generic ?? d.compoundId).join(' + ')
  const doseText = fmtDoseList(
    item.doses.map((d) => ({
      valueMg: d.doseMg,
      unit: compoundById(d.compoundId)?.defaultUnit ?? 'mg',
    })),
    locale,
  )

  const status =
    item.status === 'overdue'
      ? t('today.overdueBy', {
          time: fmtHours((now.getTime() - item.at.getTime()) / 3_600_000, locale),
        })
      : item.status === 'due'
        ? t('today.dueNow')
        : item.status === 'upcoming'
          ? t('today.inTime', {
              time: fmtHours((item.at.getTime() - now.getTime()) / 3_600_000, locale),
            })
          : item.status === 'missed'
            ? t('today.missed')
            : item.extra
              ? t('today.extraAt', { time: hhmm(item.takenAt ?? item.at) })
              : t('today.takenAt', { time: hhmm(item.takenAt ?? item.at) })

  return (
    <li
      className={clsx(
        'flex items-center gap-3 rounded-[18px] border px-3 py-2.5 transition',
        alert ? 'border-warn/40 bg-warn-soft' : 'border-line bg-panel-2',
        taken && 'opacity-80',
      )}
    >
      <div className="w-14 shrink-0 text-center">
        <div
          className={clsx('readout text-[15px] font-semibold', alert ? 'text-warn' : 'text-ink')}
        >
          {hhmm(item.at)}
        </div>
        {isNightSlot(item.at) && (
          <div className="mt-0.5 font-mono text-[9px] leading-none text-muted">
            {t('today.night')}
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-1.5">
          <span className="mt-[6px] flex shrink-0 items-center gap-1" aria-hidden>
            {item.doses.map((d) => (
              <SubstanceDot key={d.compoundId} color={compoundColor(d.compoundId)} />
            ))}
          </span>
          <span className="line-clamp-2 min-w-0 break-words text-[14.5px] font-semibold leading-snug">
            {name}
          </span>
        </div>
        <div className="mt-0.5 flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-[12.5px] text-muted">
          <span className="readout">{doseText}</span>
          {units != null && !taken && (
            <span className="readout font-semibold text-signal">
              {fmtNumber(units, locale, 1)} U
            </span>
          )}
          <span className={clsx(alert && 'font-semibold text-warn', missed && 'text-danger')}>
            {status}
          </span>
        </div>
      </div>
      {taken ? (
        <span className="grid size-11 shrink-0 place-items-center" aria-label={t('today.taken')}>
          <span className="glow grid size-10 place-items-center rounded-full bg-signal text-signal-ink">
            <Check className="size-5" strokeWidth={3} />
          </span>
        </span>
      ) : readOnly ? (
        missed && <AlertTriangle aria-hidden className="size-5 shrink-0 text-danger" />
      ) : (
        <button
          type="button"
          onClick={onLog}
          aria-label={t('doses.log')}
          className={clsx(
            'grid size-11 shrink-0 place-items-center rounded-full border transition active:scale-95',
            alert
              ? 'pulse-ring border-warn bg-warn text-canvas'
              : missed
                ? 'border-danger/40 bg-danger-soft text-danger'
                : 'border-line-strong bg-panel text-signal',
          )}
        >
          <Syringe className="size-[18px]" />
        </button>
      )}
    </li>
  )
}
