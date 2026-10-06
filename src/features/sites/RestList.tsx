import { useTranslation } from 'react-i18next'
import { Meter } from '@/components/kpi/Meter'
import { Badge } from '@/components/ui/primitives'
import { DEFAULT_MIN_REST_HOURS, type SiteStatus } from '@/domain/sites/rotation'
import { useLocale } from '@/lib/useLocale'
import { CompoundNames } from './SiteDetail'
import { fmtAgo, fmtUntil } from './siteText'

/** Every site in rest order (see `byRest`): last use, what went in, and when it is free. */
export function RestList({
  statuses,
  now,
  suggestedId,
}: {
  statuses: readonly SiteStatus[]
  now: Date
  suggestedId?: string
}) {
  const { t } = useTranslation()
  const { locale } = useLocale()
  return (
    <ul className="divide-y divide-line">
      {statuses.map((s) => {
        const rest = s.hoursSince === null ? 1 : Math.min(1, s.hoursSince / DEFAULT_MIN_REST_HOURS)
        return (
          <li key={s.siteId} className="py-3">
            <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1.5">
              <div className="min-w-[9rem] flex-1">
                <div className="text-[15px] font-medium">
                  {t(`sites.labels.${s.site.labelKey}`)}
                </div>
                <div className="mt-0.5 flex min-w-0 flex-wrap items-center gap-x-2 text-[12.5px] text-muted">
                  <span>
                    {s.lastUsedAt
                      ? t('sites.usedAgo', { when: fmtAgo(s.lastUsedAt, now, locale) })
                      : t('sites.reason.never')}
                  </span>
                  <CompoundNames ids={s.lastCompoundIds} />
                </div>
              </div>
              <div className="ml-auto flex shrink-0 flex-col items-end gap-1">
                {s.siteId === suggestedId && <Badge tone="brand">{t('sites.suggested')}</Badge>}
                {s.resting && s.restUntil ? (
                  <span className="text-right text-[12px] text-warn">
                    {t('sites.freeAt', { when: fmtUntil(s.restUntil, now, locale) })}
                  </span>
                ) : (
                  s.lastUsedAt && <Badge tone="ok">{t('sites.ready')}</Badge>
                )}
                {s.recentUses > 0 && (
                  <span className="readout text-[11px] text-muted">
                    {t('sites.recentUses', { count: s.recentUses })}
                  </span>
                )}
              </div>
            </div>
            {s.lastUsedAt && (
              <Meter
                className="mt-2.5"
                height={4}
                value={Math.round(rest * 100)}
                max={100}
                color={rest >= 1 ? 'var(--signal)' : 'var(--warn)'}
                label={t('sites.restProgress')}
              />
            )}
          </li>
        )
      })}
    </ul>
  )
}
