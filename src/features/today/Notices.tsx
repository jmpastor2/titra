import { clsx } from 'clsx'
import { BellRing, ChevronRight, FlaskConical, TimerOff, TriangleAlert } from 'lucide-react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { compoundName } from '@/content/compounds'
import type { StockAlert } from '@/features/inventory/alerts'
import { urgentStock } from './urgentStock'

/** A one-line row that leads somewhere: an icon, a sentence, a chevron. */
function SlimRow({
  to,
  icon,
  tone = 'signal',
  trailing,
  children,
}: {
  to: string
  icon: ReactNode
  tone?: 'signal' | 'warn' | 'danger'
  trailing?: ReactNode
  children: ReactNode
}) {
  return (
    <Link
      to={to}
      className="card fade-up flex min-h-12 items-center gap-3 px-4 py-2.5 transition active:scale-[0.99]"
    >
      <span
        aria-hidden
        className={clsx(
          'shrink-0 [&>svg]:size-[18px]',
          tone === 'danger' ? 'text-danger' : tone === 'warn' ? 'text-warn' : 'text-signal',
        )}
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1 break-words text-[14px] font-medium leading-snug">
        {children}
      </span>
      {trailing}
      <ChevronRight aria-hidden className="size-4 shrink-0 text-muted" />
    </Link>
  )
}

/** The stock alert that cannot wait, as one row to the inventory; nothing when none is urgent. */
export function StockNotice({ alerts }: { alerts: readonly StockAlert[] }) {
  const { t } = useTranslation()
  const found = urgentStock(alerts)
  if (!found) return null
  const { alert: a, more } = found
  const names = a.compoundIds.map(compoundName).join(' + ')
  const text =
    a.kind === 'expired'
      ? t('today.notice.expired', { names })
      : a.kind === 'expiresSoon'
        ? t(a.days === 0 ? 'today.notice.expiresToday' : 'today.notice.expiresTomorrow', { names })
        : a.kind === 'reconstitute'
          ? t('today.notice.reconstitute', { names })
          : a.doses
            ? t('today.notice.runsOut', { names, count: a.doses })
            : t('today.notice.empty', { names })
  return (
    <SlimRow
      to="/inventory"
      tone={a.severity === 'danger' ? 'danger' : 'warn'}
      icon={
        a.kind === 'reconstitute' ? (
          <FlaskConical />
        ) : a.kind === 'expired' || a.kind === 'expiresSoon' ? (
          <TimerOff />
        ) : (
          <TriangleAlert />
        )
      }
      trailing={
        more > 0 && (
          <span className="readout shrink-0 text-[12.5px] text-muted">
            {t('today.notice.more', { count: more })}
          </span>
        )
      }
    >
      {text}
    </SlimRow>
  )
}

/** Reminders are off: one row to switch them on. */
export function RemindersNotice() {
  const { t } = useTranslation()
  return (
    <SlimRow to="/reminders" icon={<BellRing />}>
      {t('today.remindersOff')}
    </SlimRow>
  )
}
