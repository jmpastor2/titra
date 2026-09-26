import { clsx } from 'clsx'
import { AlertTriangle, Check, Syringe } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { SubstanceDot } from '@/components/ui/primitives'
import { compoundById } from '@/content/compounds'
import { compoundColor } from '@/content/substanceColor'
import { fmtDoseList, fmtHours, fmtNumber } from '@/lib/format'
import { useLocale } from '@/lib/useLocale'
import type { TodayItem } from './agenda'

const hhmm = (d: Date) =>
  `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`

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
        'flex items-center gap-3 rounded-[18px] border px-3 py-3 transition',
        alert ? 'border-warn/40 bg-warn-soft' : 'border-line bg-panel-2',
        taken && 'opacity-80',
      )}
    >
      <div className="w-[46px] shrink-0 text-center">
        <div
          className={clsx('readout text-[15px] font-semibold', alert ? 'text-warn' : 'text-ink')}
        >
          {hhmm(item.at)}
        </div>
        {!item.extra && item.at.getDate() !== now.getDate() && item.at > now && (
          <div className="spec text-[8.5px]">{t('today.afterMidnight')}</div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          {item.doses.map((d) => (
            <SubstanceDot key={d.compoundId} color={compoundColor(d.compoundId)} />
          ))}
          <span className="truncate text-[14.5px] font-semibold">{name}</span>
        </div>
        <div className="mt-0.5 flex items-center gap-2 text-[12.5px] text-muted">
          <span className="readout truncate">{doseText}</span>
          {units != null && !taken && (
            <span className="readout shrink-0 font-semibold text-signal">
              {fmtNumber(units, locale, 1)} U
            </span>
          )}
          <span aria-hidden>·</span>
          <span
            className={clsx(
              'shrink-0',
              alert && 'font-semibold text-warn',
              missed && 'text-danger',
            )}
          >
            {status}
          </span>
        </div>
      </div>
      {taken ? (
        <span
          className="grid size-10 shrink-0 place-items-center rounded-full bg-signal text-signal-ink glow"
          aria-label={t('today.taken')}
        >
          <Check className="size-5" strokeWidth={3} />
        </span>
      ) : readOnly ? (
        missed && <AlertTriangle className="size-5 shrink-0 text-danger" />
      ) : (
        <button
          type="button"
          onClick={onLog}
          aria-label={t('doses.log')}
          className={clsx(
            'grid size-10 shrink-0 place-items-center rounded-full border transition active:scale-95',
            alert
              ? 'pulse-ring border-warn bg-warn text-[#1a1000]'
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
