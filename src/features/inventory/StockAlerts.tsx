import { clsx } from 'clsx'
import { AlertTriangle, CalendarClock, FlaskConical, PackagePlus, TimerOff } from 'lucide-react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { SubstanceDot } from '@/components/ui/primitives'
import { compoundById } from '@/content/compounds'
import { compoundColor } from '@/content/substanceColor'
import { fmtDate } from '@/lib/format'
import { useLocale } from '@/lib/useLocale'
import type { StockAlert, StockAlertKind } from './alerts'

const ICON: Record<StockAlertKind, ReactNode> = {
  expired: <TimerOff className="size-4" />,
  expiresSoon: <CalendarClock className="size-4" />,
  expiresBeforeEmpty: <CalendarClock className="size-4" />,
  runsOut: <AlertTriangle className="size-4" />,
  reconstitute: <FlaskConical className="size-4" />,
  reorder: <PackagePlus className="size-4" />,
}

const TONE: Record<StockAlert['severity'], string> = {
  danger: 'border-danger/40 bg-danger-soft text-danger',
  warn: 'border-warn/40 bg-warn-soft text-warn',
  info: 'border-line bg-panel-2 text-signal',
}

/** Stock alerts as a compact list; `linkTo` makes each row open the inventory. */
export function StockAlerts({
  alerts,
  limit,
  linkTo,
  className,
}: {
  alerts: readonly StockAlert[]
  limit?: number
  linkTo?: string
  className?: string
}) {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const shown = limit ? alerts.slice(0, limit) : alerts
  if (!shown.length) return null

  return (
    <ul className={clsx('flex flex-col gap-2', className)}>
      {shown.map((a, i) => {
        const names = a.compoundIds.map((id) => compoundById(id)?.names.generic ?? id).join(' + ')
        const date = a.date ? fmtDate(a.date, locale, 'EEE d MMM') : ''
        const body = t(`stock.${a.kind}`, {
          names,
          date,
          days: Math.abs(a.days ?? 0),
          count: a.doses ?? a.days ?? 0,
        })
        const row = (
          <div
            className={clsx(
              'flex items-start gap-3 rounded-control border px-3.5 py-3',
              TONE[a.severity],
            )}
          >
            <span className="mt-0.5 shrink-0">{ICON[a.kind]}</span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-1.5 text-[13.5px] font-semibold text-ink">
                {a.compoundIds.map((id) => (
                  <SubstanceDot key={id} color={compoundColor(id)} />
                ))}
                <span className="truncate">{t(`stock.title.${a.kind}`)}</span>
              </span>
              <span className="mt-0.5 block text-[12.5px] leading-snug text-ink-2">{body}</span>
              {a.estimated && (
                <span className="mt-0.5 block text-[11px] text-muted">{t('stock.estimated')}</span>
              )}
            </span>
          </div>
        )
        return (
          <li key={`${a.kind}:${a.vialId ?? a.compoundIds.join('+')}:${i}`}>
            {linkTo ? <Link to={linkTo}>{row}</Link> : row}
          </li>
        )
      })}
      {limit && alerts.length > limit && linkTo && (
        <li>
          <Link to={linkTo} className="spec block px-1 text-signal">
            {t('stock.more', { count: alerts.length - limit })}
          </Link>
        </li>
      )}
    </ul>
  )
}
