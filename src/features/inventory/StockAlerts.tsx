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
  expired: <TimerOff className="size-[18px]" />,
  expiresSoon: <CalendarClock className="size-[18px]" />,
  expiresBeforeEmpty: <CalendarClock className="size-[18px]" />,
  runsOut: <AlertTriangle className="size-[18px]" />,
  reconstitute: <FlaskConical className="size-[18px]" />,
  reorder: <PackagePlus className="size-[18px]" />,
  leftover: <Droplet className="size-[18px]" />,
}

/** The severity is in the icon's colour (and in the words): no coloured boxes. */
const ICON_TONE: Record<StockAlert['severity'], string> = {
  danger: 'text-danger',
  warn: 'text-warn',
  info: 'text-signal',
}

/** A small text action under an alert: quiet, but a full 44 px target. */
const ALERT_ACTION =
  'inline-flex min-h-11 items-center gap-1.5 rounded-full px-3 text-[13px] font-semibold outline-none transition active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-signal/60 disabled:opacity-50'

/** The icon, the title and the sentence of an alert, whether pending or already read. */
export function AlertBody({ alert: a, muted = false }: { alert: StockAlert; muted?: boolean }) {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const names = a.compoundIds.map((id) => compoundById(id)?.names.generic ?? id).join(' + ')
  const date = a.date ? fmtDate(a.date, locale, 'EEE d MMM') : ''
  // Past the in-use guide is said as a guide, not as "do not use it".
  const key = a.kind === 'expired' && a.estimated ? 'expiredEstimated' : a.kind
  const body = t(`stock.${key}`, {
    names,
    date,
    days: Math.abs(a.days ?? 0),
    count: a.doses ?? a.days ?? 0,
    mg: fmtNumber(a.mg ?? 0, locale, 2),
  })
  return (
    <div className="flex items-start gap-3">
      <span className={clsx('mt-px shrink-0', muted ? 'text-muted' : ICON_TONE[a.severity])}>
        {ICON[a.kind]}
      </span>
      <span className="min-w-0 flex-1">
        <span
          className={clsx(
            'flex items-start gap-1.5 text-[14px] font-semibold leading-snug',
            muted ? 'text-ink-2' : 'text-ink',
          )}
        >
          <span className="mt-[6px] flex shrink-0 gap-1">
            {a.compoundIds.map((id) => (
              <SubstanceDot key={id} color={compoundColor(id)} size={7} />
            ))}
          </span>
          <span className="min-w-0">{t(`stock.title.${key}`)}</span>
        </span>
        <span
          className={clsx(
            'mt-0.5 block text-[13px] leading-snug',
            muted ? 'text-muted' : 'text-ink-2',
          )}
        >
          {body}
        </span>
        {a.estimated && key !== 'expiredEstimated' && (
          <span className="mt-0.5 block text-[12px] leading-snug text-muted">
            {t('stock.estimated', { days: IN_USE_DAYS })}
          </span>
        )}
      </span>
    </div>
  )
}

/**
 * Stock alerts as rows of one list; `linkTo` makes each row open the inventory. Every alert
 * can be marked as read ("Entendido") and then never comes back for the same situation; the
 * ones about a vial offer what to do with it (reconstitute the reserve, archive). On its own
 * the list sits in a card; `bare` leaves the card to the caller (the inventory's alert card).
 */
export function StockAlerts({
  alerts,
  limit,
  linkTo,
  bare = false,
  className,
}: {
  alerts: readonly StockAlert[]
  limit?: number
  linkTo?: string
  bare?: boolean
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
        <ul
          className={clsx(
            'flex flex-col divide-y divide-line',
            !bare && 'card fade-up px-4 py-1',
            className,
          )}
        >
          {shown.map((a) => {
            const vial = vialOf(a.vialId)
            const reserve = a.kind === 'reconstitute' ? vialOf(a.reserveVialId) : undefined
            const body = <AlertBody alert={a} />
            return (
              <li key={alertKey(a)} className={clsx('py-3', bare && 'first:pt-0 last:pb-0')}>
                {linkTo ? (
                  <Link
                    to={linkTo}
                    className="block rounded-control outline-none focus-visible:ring-2 focus-visible:ring-signal/60"
                  >
                    {body}
                  </Link>
                ) : (
                  body
                )}
                {canAct && (
                  <div className="-mb-2 -mr-2 flex flex-wrap items-center justify-end">
                    {reserve && (
                      <button
                        type="button"
                        onClick={() => reconstitution.reconstitute(reserve)}
                        className={clsx(ALERT_ACTION, 'text-signal hover:bg-signal-soft')}
                      >
                        <FlaskConical className="size-4" aria-hidden />
                        {t('reconstitute.button')}
                      </button>
                    )}
                    {vial && (a.kind === 'expired' || a.kind === 'leftover') && (
                      <button
                        type="button"
                        onClick={() => archiveVial(vial)}
                        className={clsx(ALERT_ACTION, 'text-ink-2 hover:bg-panel-2')}
                      >
                        <Archive className="size-4" aria-hidden />
                        {t('inventory.archive')}
                      </button>
                    )}
                    <button
                      type="button"
                      aria-label={`${t('stock.dismiss')}: ${t(`stock.title.${a.kind}`)}`}
                      onClick={() => markRead(a)}
                      className={clsx(ALERT_ACTION, 'text-ink-2 hover:bg-panel-2')}
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
            <li className="py-1">
              <Link
                to={linkTo}
                className="flex min-h-11 items-center text-[13px] font-semibold text-signal"
              >
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
