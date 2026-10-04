import { clsx } from 'clsx'
import { Check, CheckCheck, ChevronDown, CircleCheck, RotateCcw } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { usePatientScope } from '@/app/scope'
import { useToast } from '@/components/ui/Toast'
import { useDismissAlert, useRestoreAlert } from '@/data/hooks'
import { useSession } from '@/features/auth/SessionProvider'
import { alertKey, type StockAlert } from './alerts'
import { AlertBody, StockAlerts } from './StockAlerts'

const QUIET =
  'inline-flex min-h-11 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-semibold text-ink-2 outline-none transition hover:bg-panel-2 active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-signal/60 disabled:opacity-50'

/**
 * The alerts of the inventory: what is pending (each one can be marked as read, or all at
 * once) and, collapsed, what was already read, which can be brought back.
 */
export function AlertsPanel({
  alerts,
  read,
}: {
  alerts: readonly StockAlert[]
  read: readonly StockAlert[]
}) {
  const { t } = useTranslation()
  const { readOnly } = usePatientScope()
  const { user } = useSession()
  const { toast } = useToast()
  const dismiss = useDismissAlert(user?.id ?? '')
  const restore = useRestoreAlert(user?.id ?? '')
  const [showRead, setShowRead] = useState(false)
  const canAct = !readOnly && Boolean(user)

  const markAllRead = () =>
    dismiss.mutate(alerts.map(alertKey), {
      onError: () => toast(t('stock.dismissFailed'), 'error'),
    })

  async function restoreAlerts(list: readonly StockAlert[]) {
    try {
      await restore.mutateAsync(list.map(alertKey))
    } catch {
      toast(t('common.error'), 'error')
    }
  }

  return (
    <section aria-label={t('inventory.alertsTitle')} className="mb-3">
      {alerts.length > 0 ? (
        <>
          <div className="mb-1 flex items-center justify-between gap-2 px-1">
            <h2 className="spec">{t('inventory.alertsCount', { count: alerts.length })}</h2>
            {canAct && alerts.length > 1 && (
              <button type="button" onClick={markAllRead} className={clsx(QUIET, '-mr-2')}>
                <CheckCheck className="size-4" aria-hidden />
                {t('inventory.markAllRead')}
              </button>
            )}
          </div>
          <StockAlerts alerts={alerts} />
        </>
      ) : (
        <div className="flex items-center gap-2.5 rounded-control border border-line bg-panel px-3.5 py-3 text-[13px] text-ink-2">
          <CircleCheck className="size-4 shrink-0 text-signal" aria-hidden />
          {t('inventory.noAlerts')}
        </div>
      )}

      {read.length > 0 && (
        <div className="mt-1">
          <button
            type="button"
            aria-expanded={showRead}
            onClick={() => setShowRead((o) => !o)}
            className="flex min-h-11 w-full items-center justify-between gap-2 px-1 text-left outline-none focus-visible:ring-2 focus-visible:ring-signal/60"
          >
            <span className="spec flex items-center gap-1.5">
              <Check className="size-3.5" aria-hidden />
              {t('inventory.readAlerts', { count: read.length })}
            </span>
            <ChevronDown
              className={clsx('size-4 text-muted transition', showRead && 'rotate-180')}
              aria-hidden
            />
          </button>
          {showRead && (
            <div className="flex flex-col gap-2">
              <ul className="flex flex-col gap-2">
                {read.map((a) => (
                  <li
                    key={alertKey(a)}
                    className="rounded-control border border-line bg-panel px-3.5 pb-1.5 pt-3 text-muted"
                  >
                    <AlertBody alert={a} />
                    {canAct && (
                      <div className="flex justify-end">
                        <button
                          type="button"
                          disabled={restore.isPending}
                          onClick={() => void restoreAlerts([a])}
                          className={clsx(QUIET, '-mr-1.5')}
                        >
                          <RotateCcw className="size-4" aria-hidden />
                          {t('inventory.restoreAlert')}
                        </button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
              {canAct && read.length > 1 && (
                <button
                  type="button"
                  disabled={restore.isPending}
                  onClick={() => void restoreAlerts(read)}
                  className={clsx(QUIET, 'self-end')}
                >
                  <RotateCcw className="size-4" aria-hidden />
                  {t('inventory.restoreAll')}
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  )
}
