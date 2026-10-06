import { AlertTriangle } from 'lucide-react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { usePatientScope } from '@/app/scope'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { SectionTitle, Skeleton } from '@/components/ui/primitives'
import { useDoses } from '@/data/hooks'
import type { SiteUse } from '@/domain/sites/injectionSites'
import { byRest, rankSites, siteStatuses, type RankedSite } from '@/domain/sites/rotation'
import { useNow } from '@/lib/useNow'
import { BodyMap } from './BodyMap'
import { RestList } from './RestList'
import { SiteTimeline } from './SiteTimeline'
import { reasonText } from './siteText'

/** Rotation dashboard: what to use next, how rested each site is, and the last two weeks. */
export function SitesPage() {
  const { t } = useTranslation()
  const { patientId } = usePatientScope()
  const doses = useDoses(patientId, 180)
  const now = useNow()

  const history = useMemo<SiteUse[]>(
    () =>
      (doses.data ?? []).flatMap((d) =>
        d.site_id
          ? [{ siteId: d.site_id, at: new Date(d.administered_at), compoundId: d.compound_id }]
          : [],
      ),
    [doses.data],
  )
  const statuses = useMemo(() => siteStatuses(history, now), [history, now])
  const next = useMemo(() => rankSites(history, now).slice(0, 3), [history, now])
  const ordered = useMemo(() => byRest(statuses), [statuses])
  const [best, ...then] = next

  /** "Sin usar 9 días · Alterna lado": why this site, in one line. */
  const why = (s: RankedSite) =>
    [reasonText(t, s.reason), s.balance ? t(`sites.balance.${s.balance}`) : null]
      .filter(Boolean)
      .join(' · ')

  return (
    <div className="pb-6">
      <PageHeader title={t('sites.title')} back="/more" />

      <Card className="mb-3">
        <span className="spec">{t('sites.nextOne')}</span>
        {doses.isLoading ? (
          <Skeleton className="mt-2 h-[120px]" />
        ) : (
          best && (
            <>
              <div className="mt-1 text-[26px] font-semibold leading-tight text-signal">
                {t(`sites.labels.${best.site.labelKey}`)}
              </div>
              <p
                className={
                  best.resting
                    ? 'mt-1 text-[13px] leading-snug text-warn'
                    : 'mt-1 text-[13px] leading-snug text-ink-2'
                }
              >
                {why(best)}
              </p>
              {best.resting && (
                <p className="mt-2 flex items-start gap-2 text-[12.5px] leading-snug text-warn">
                  <AlertTriangle aria-hidden className="mt-0.5 size-3.5 shrink-0" />
                  {t('sites.allResting')}
                </p>
              )}
              {then.length > 0 && (
                <div className="mt-4 border-t border-line pt-3">
                  <span className="spec">{t('sites.then')}</span>
                  <ol className="mt-1 divide-y divide-line">
                    {then.map((s) => (
                      <li
                        key={s.siteId}
                        className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 py-2.5 last:pb-0"
                      >
                        <span className="text-[15px] font-medium">
                          {t(`sites.labels.${s.site.labelKey}`)}
                        </span>
                        <span
                          className={
                            s.resting ? 'text-[12.5px] text-warn' : 'text-[12.5px] text-muted'
                          }
                        >
                          {why(s)}
                        </span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </>
          )
        )}
        <p className="mt-4 text-[12.5px] leading-snug text-muted">{t('sites.intro')}</p>
      </Card>

      <Card className="mb-3">
        <BodyMap statuses={statuses} now={now} suggestedId={best?.siteId} />
      </Card>

      <SectionTitle>{t('sites.byRest')}</SectionTitle>
      <Card padded={false} className="mb-3 px-4">
        <RestList statuses={ordered} now={now} suggestedId={best?.siteId} />
      </Card>

      <SectionTitle>{t('sites.timeline')}</SectionTitle>
      <Card>
        <SiteTimeline history={history} now={now} />
      </Card>
    </div>
  )
}
