import { clsx } from 'clsx'
import { AlertTriangle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { SubstanceDot } from '@/components/ui/primitives'
import { compoundName } from '@/content/compounds'
import { compoundColor } from '@/content/substanceColor'
import { DEFAULT_MIN_REST_HOURS, type SiteStatus } from '@/domain/sites/rotation'
import { useLocale } from '@/lib/useLocale'
import { fmtAgo, fmtUntil } from './siteText'

/** Substances of one injection: coloured dot + name, never colour alone. */
export function CompoundNames({ ids, className }: { ids: readonly string[]; className?: string }) {
  if (ids.length === 0) return null
  return (
    <span
      className={clsx('inline-flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5', className)}
    >
      {ids.map((id) => (
        <span key={id} className="inline-flex min-w-0 items-center gap-1">
          <SubstanceDot color={compoundColor(id)} size={6} />
          <span>{compoundName(id)}</span>
        </span>
      ))}
    </span>
  )
}

/**
 * Last use of one site: when, what went in, and until when it should rest. With `warn`
 * (the log sheet) a site still inside its rest window gets a warning instead of a note.
 */
export function SiteDetail({
  status,
  now,
  warn = false,
}: {
  status: SiteStatus
  now: Date
  warn?: boolean
}) {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const { lastUsedAt, restUntil, resting } = status

  return (
    <div className="min-w-0 space-y-1.5">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
        <span className="text-[14px] font-semibold text-ink">
          {t(`sites.labels.${status.site.labelKey}`)}
        </span>
        <span className="readout text-[12px] text-muted">
          {lastUsedAt
            ? t('sites.usedAgo', { when: fmtAgo(lastUsedAt, now, locale) })
            : t('sites.reason.never')}
        </span>
      </div>
      {status.lastCompoundIds.length > 0 && (
        <CompoundNames ids={status.lastCompoundIds} className="text-[12.5px] text-ink-2" />
      )}
      {restUntil && resting && warn && (
        <p
          role="status"
          className="flex items-start gap-2 rounded-control border border-warn/25 bg-warn-soft px-2.5 py-2 text-[12.5px] leading-snug text-warn"
        >
          <AlertTriangle aria-hidden className="mt-0.5 size-3.5 shrink-0" />
          <span>
            {status.usedToday
              ? t('sites.usedTodayWarning')
              : t('sites.restWarning', { hours: DEFAULT_MIN_REST_HOURS })}{' '}
            {t('sites.restUntil', { when: fmtUntil(restUntil, now, locale) })}
          </span>
        </p>
      )}
      {restUntil && resting && !warn && (
        <p className="text-[12.5px] text-warn">
          {t('sites.restUntil', { when: fmtUntil(restUntil, now, locale) })}
        </p>
      )}
      {lastUsedAt && !resting && <p className="text-[12.5px] text-signal">{t('sites.ready')}</p>}
    </div>
  )
}
