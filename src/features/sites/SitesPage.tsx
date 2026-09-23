import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { usePatientScope } from '@/app/scope'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/primitives'
import { useDoses } from '@/data/hooks'
import {
  DEFAULT_ROTATION,
  INJECTION_SITES,
  siteUsage,
  suggestNextSite,
} from '@/domain/sites/injectionSites'
import { fmtDistance } from '@/lib/format'
import { useLocale } from '@/lib/useLocale'
import { BodyMap } from './BodyMap'

export function SitesPage() {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const { patientId } = usePatientScope()
  const doses = useDoses(patientId, 180)

  const uses = useMemo(
    () =>
      (doses.data ?? [])
        .filter((d) => d.site_id)
        .map((d) => ({ siteId: d.site_id!, at: new Date(d.administered_at) })),
    [doses.data],
  )
  const usage = useMemo(() => siteUsage(uses), [uses])
  const suggestion = useMemo(() => suggestNextSite(uses, DEFAULT_ROTATION), [uses])
  const lastBySite = useMemo(() => {
    const m = new Map<string, Date>()
    for (const u of uses) {
      const prev = m.get(u.siteId)
      if (!prev || u.at > prev) m.set(u.siteId, u.at)
    }
    return m
  }, [uses])

  const maxUse = Math.max(1, ...Object.values(usage))

  return (
    <div className="pb-6">
      <PageHeader title={t('sites.title')} back="/more" />

      <Card tone="brand" className="mb-3">
        <p className="text-[13.5px] leading-relaxed text-ink-2">{t('sites.intro')}</p>
        {suggestion && (
          <div className="mt-3 flex items-center justify-between rounded-control bg-surface px-3 py-2.5">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                {t('sites.suggested')}
              </div>
              <div className="text-[16px] font-bold text-brand-strong">
                {t(`sites.labels.${suggestion.siteId}`)}
              </div>
            </div>
            {suggestion.tooRecent && <Badge tone="warn">{t('doses.siteTooRecent')}</Badge>}
          </div>
        )}
      </Card>

      <Card className="mb-3">
        <BodyMap usage={usage} maxUse={maxUse} suggestedId={suggestion?.siteId} />
      </Card>

      <Card padded={false} className="px-4">
        <ul className="divide-y divide-line">
          {INJECTION_SITES.map((s) => {
            const count = usage[s.id] ?? 0
            const last = lastBySite.get(s.id)
            return (
              <li key={s.id} className="flex items-center justify-between py-3">
                <div>
                  <div className="text-[14.5px] font-medium">{t(`sites.labels.${s.labelKey}`)}</div>
                  <div className="text-[12.5px] text-muted">
                    {last
                      ? t('sites.lastUsed', { when: fmtDistance(last, locale) })
                      : t('sites.neverUsed')}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {suggestion?.siteId === s.id && (
                    <Badge tone="brand">{t('sites.suggested')}</Badge>
                  )}
                  <span className="tabular text-[13px] text-muted">
                    {t('sites.uses', { count })}
                  </span>
                </div>
              </li>
            )
          })}
        </ul>
      </Card>
    </div>
  )
}
