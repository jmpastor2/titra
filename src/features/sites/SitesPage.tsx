import { AlertTriangle } from 'lucide-react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { usePatientScope } from '@/app/scope'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { Badge, SectionTitle, Skeleton } from '@/components/ui/primitives'
import { useDoses } from '@/data/hooks'
import type { SiteUse } from '@/domain/sites/injectionSites'
import { byRest, rankSites, siteStatuses } from '@/domain/sites/rotation'
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
  const best = next[0]

  return (
    <div className="pb-6">
      <PageHeader title={t('sites.title')} back="/more" />

      <Card tone="signal" className="mb-3">
        <p className="text-[13.5px] leading-relaxed text-ink-2">{t('sites.intro')}</p>
        <div className="spec mb-1.5 mt-3">{t('sites.next')}</div>
        {doses.isLoading ? (
          <Skeleton className="h-[132px]" />
        ) : (
          <ol className="space-y-1.5">
            {next.map((s, i) => (
              <li
                key={s.siteId}
                className="flex items-center gap-3 rounded-control bg-panel px-3 py-2.5"
              >
                <span
                  className={
                    i === 0
                      ? 'readout text-[13px] font-bold text-signal'
                      : 'readout text-[13px] text-muted'
                  }
                >
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div className="min-w-0 flex-1">
                  <div
                    className={
                      i === 0 ? 'text-[15.5px] font-bold text-signal' : 'text-[14.5px] font-medium'
                    }
                  >
                    {t(`sites.labels.${s.site.labelKey}`)}
                  </div>
                  <div
                    className={s.resting ? 'text-[12.5px] text-warn' : 'text-[12.5px] text-muted'}
                  >
                    {reasonText(t, s.reason)}
                  </div>
                </div>
                {s.balance && <Badge tone="neutral">{t(`sites.balance.${s.balance}`)}</Badge>}
              </li>
            ))}
          </ol>
        )}
        {best?.resting && (
          <p className="mt-2.5 flex items-start gap-2 text-[12.5px] leading-snug text-warn">
            <AlertTriangle aria-hidden className="mt-0.5 size-3.5 shrink-0" />
            {t('sites.allResting')}
          </p>
        )}
      </Card>

      <Card className="mb-3">
        <BodyMap statuses={statuses} now={now} suggestedId={best?.siteId} />
      </Card>

      <SectionTitle index="01">{t('sites.byRest')}</SectionTitle>
      <Card padded={false} className="mb-3 px-4">
        <RestList statuses={ordered} now={now} suggestedId={best?.siteId} />
      </Card>

      <SectionTitle index="02">{t('sites.timeline')}</SectionTitle>
      <Card>
        <SiteTimeline history={history} now={now} />
      </Card>
    </div>
  )
}
