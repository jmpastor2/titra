import { useTranslation } from 'react-i18next'
import { Kpi } from '@/components/kpi/Kpi'
import { Meter } from '@/components/kpi/Meter'
import { Card } from '@/components/ui/Card'
import { Chip } from '@/components/ui/primitives'
import { ZONES, zoneSites, type SiteZone } from '@/domain/sites/catalog'
import { TARGET_REST_DAYS, type RestOutlook } from '@/domain/sites/rotation'
import { fmtNumber } from '@/lib/format'
import { setSiteZones } from '@/lib/siteZones'
import { useLocale } from '@/lib/useLocale'

/**
 * "Tu rotación": how many days each point rests at the pace of the last two weeks, against
 * the week skin needs, and the zones the suggestions come from (switched on and off here).
 */
export function RotationCard({
  outlook,
  zones,
}: {
  outlook: RestOutlook
  zones: readonly SiteZone[]
}) {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const { restDays, perDay, points, addZones, restWithAdded } = outlook
  const days = (d: number) => fmtNumber(d, locale, d < 10 ? 1 : 0)
  const short = restDays !== null && restDays < TARGET_REST_DAYS
  const zoneNames = (list: readonly SiteZone[]) =>
    new Intl.ListFormat(locale, { type: 'conjunction' }).format(
      list.map((z) => t(`sites.zones.${z}`).toLocaleLowerCase(locale)),
    )

  function toggle(zone: SiteZone) {
    setSiteZones(zones.includes(zone) ? zones.filter((z) => z !== zone) : [...zones, zone])
  }

  return (
    <Card className="mb-3">
      {restDays === null ? (
        <>
          <span className="spec">{t('sites.rotation.rest')}</span>
          <p className="mt-1 text-[14px] leading-snug text-ink-2">{t('sites.rotation.noRecent')}</p>
        </>
      ) : (
        <Kpi
          label={t('sites.rotation.rest')}
          size="lg"
          tone={short ? 'warn' : 'default'}
          value={days(restDays)}
          unit={t('sites.rotation.days', { count: Math.round(restDays) })}
          caption={t('sites.rotation.caption', {
            count: points,
            perDay: fmtNumber(perDay, locale, 1),
          })}
        >
          <Meter
            value={Math.min(restDays, TARGET_REST_DAYS * 2)}
            max={TARGET_REST_DAYS * 2}
            target={TARGET_REST_DAYS}
            color={short ? 'var(--warn)' : 'var(--signal)'}
          />
          <p className="mt-2 text-[12.5px] leading-snug text-muted">
            {!short
              ? t('sites.rotation.ok', { days: TARGET_REST_DAYS })
              : addZones.length > 0 && restWithAdded !== null
                ? t('sites.rotation.add', {
                    zones: zoneNames(addZones),
                    days: days(restWithAdded),
                  })
                : t('sites.rotation.short', { days: TARGET_REST_DAYS })}
          </p>
        </Kpi>
      )}

      <div className="mt-4 border-t border-line pt-3">
        <span className="spec">{t('sites.rotation.zones')}</span>
        <div
          className="-mx-1 mt-1 flex flex-wrap"
          role="group"
          aria-label={t('sites.rotation.zones')}
        >
          {ZONES.map(({ zone }) => (
            <Chip
              key={zone}
              active={zones.includes(zone)}
              onClick={() => toggle(zone)}
              className="px-1"
            >
              {t(`sites.zones.${zone}`)}
              <span className="readout text-[11.5px] font-medium opacity-70">
                {zoneSites(zone).length}
              </span>
            </Chip>
          ))}
        </div>
        <p className="mt-1 text-[12.5px] leading-snug text-muted">
          {t('sites.rotation.zonesHint')}
        </p>
      </div>
    </Card>
  )
}
