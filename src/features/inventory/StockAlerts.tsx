import { clsx } from 'clsx'
import {
  AlertTriangle,
  Archive,
  CalendarClock,
  Check,
  Droplet,
  FlaskConical,
  PackagePlus,
  TimerOff,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { usePatientScope } from '@/app/scope'
import { SubstanceDot } from '@/components/ui/primitives'
import { useToast } from '@/components/ui/Toast'
import { compoundById } from '@/content/compounds'
import { compoundColor } from '@/content/substanceColor'
import type { InventoryRow } from '@/data/database.types'
import { useArchiveInventory, useDismissAlert, useInventory } from '@/data/hooks'
import { useSession } from '@/features/auth/SessionProvider'
import { fmtDate, fmtNumber } from '@/lib/format'
import { useLocale } from '@/lib/useLocale'
import { alertKey, IN_USE_DAYS, type StockAlert, type StockAlertKind } from './alerts'
import { useReconstituteSheet } from './useReconstituteSheet'

const ICON: Record<StockAlertKind, ReactNode> = {
  expired: <TimerOff className="size-4" />,
  expiresSoon: <CalendarClock className="size-4" />,
  expiresBeforeEmpty: <CalendarClock className="size-4" />,
  runsOut: <AlertTriangle className="size-4" />,
  reconstitute: <FlaskConical className="size-4" />,
  reorder: <PackagePlus className="size-4" />,
  leftover: <Droplet className="size-4" />,
}

const TONE: Record<StockAlert['severity'], string> = {
  danger: 'border-danger/40 bg-danger-soft text-danger',
  warn: 'border-warn/40 bg-warn-soft text-warn',
  info: 'border-line bg-panel-2 text-signal',
}

const ACTION =
  'inline-flex min-h-11 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-semibold outline-none transition active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-signal/60 disabled:opacity-50'

/** The icon, the title and the sentence of an alert, whether pending or already read. */
export function AlertBody({ alert: a }: { alert: StockAlert }) {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const names = a.compoundIds.map((id) => compoundById(id)?.names.generic ?? id).join(' + ')
  const date = a.date ? fmtDate(a.date, locale, 'EEE d MMM') : ''
  const body = t(`stock.${a.kind}`, {
    names,
    date,
    days: Math.abs(a.days ?? 0),
    count: a.doses ?? a.days ?? 0,
    mg: fmtNumber(a.mg ?? 0, locale, 2),
  })
  return (
    <div className="flex items-start gap-3">
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
          <span className="mt-0.5 block text-[11px] text-muted">
            {t('stock.estimated', { days: IN_USE_DAYS })}
          </span>
        )}
      </span>
    </div>
  )
}

/**
 * Stock alerts as a compact list; `linkTo` makes each row open the inventory. Every alert
 * can be marked as read ("Entendido") and then never comes back for the same situation;
 * the ones about a vial offer what to do with it (reconstitute the reserve, archive).
 */
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
  const { patientId, readOnly } = usePatientScope()
  const { user } = useSession()
  const { toast } = useToast()
  const dismiss = useDismissAlert(user?.id ?? '')
  const archive = useArchiveInventory(patientId)
  const inventory = useInventory(patientId)
  const reconstitution = useReconstituteSheet()
  const shown = limit ? alerts.slice(0, limit) : alerts
  const canAct = !readOnly && Boolean(user)
  const vialOf = (id: string | undefined) => inventory.data?.find((v) => v.id === id)

  function markRead(a: StockAlert) {
    dismiss.mutate(alertKey(a), { onError: () => toast(t('stock.dismissFailed'), 'error') })
  }

  function archiveVial(vial: InventoryRow) {
    archive.mutate(
      { id: vial.id, archived: true },
      {
        onSuccess: () => toast(t('inventory.archivedToast', { label: vial.label }), 'info'),
        onError: () => toast(t('common.error'), 'error'),
      },
    )
  }

  return (
    <>
      {shown.length > 0 && (
        <ul className={clsx('flex flex-col gap-2', className)}>
          {shown.map((a) => {
            const vial = vialOf(a.vialId)
            const reserve = a.kind === 'reconstitute' ? vialOf(a.reserveVialId) : undefined
            const body = <AlertBody alert={a} />
            return (
              <li
                key={alertKey(a)}
                className={clsx('overflow-hidden rounded-control border', TONE[a.severity])}
              >
                {linkTo ? (
                  <Link to={linkTo} className={clsx('block px-3.5 pt-3', canAct ? 'pb-1' : 'pb-3')}>
                    {body}
                  </Link>
                ) : (
                  <div className={clsx('px-3.5 pt-3', canAct ? 'pb-1' : 'pb-3')}>{body}</div>
                )}
                {canAct && (
                  <div className="flex flex-wrap items-center justify-end gap-1 px-2 pb-1.5">
                    {reserve && (
                      <button
                        type="button"
                        onClick={() => reconstitution.reconstitute(reserve)}
                        className={clsx(
                          ACTION,
                          'border border-signal/25 bg-signal-soft text-signal',
                        )}
                      >
                        <FlaskConical className="size-4" aria-hidden />
                        {t('reconstitute.button')}
                      </button>
                    )}
                    {vial && (a.kind === 'expired' || a.kind === 'leftover') && (
                      <button
                        type="button"
                        onClick={() => archiveVial(vial)}
                        className={clsx(ACTION, 'text-ink-2 hover:bg-panel-2')}
                      >
                        <Archive className="size-4" aria-hidden />
                        {t('inventory.archive')}
                      </button>
                    )}
                    <button
                      type="button"
                      aria-label={`${t('stock.dismiss')}: ${t(`stock.title.${a.kind}`)}`}
                      onClick={() => markRead(a)}
                      className={clsx(ACTION, 'text-ink-2 hover:bg-panel-2')}
                    >
                      <Check className="size-4" aria-hidden />
                      {t('stock.dismiss')}
                    </button>
                  </div>
                )}
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
      )}
      {reconstitution.sheet}
    </>
  )
}
