import { clsx } from 'clsx'
import { ChevronDown } from 'lucide-react'
import { useMemo, useState, type JSX } from 'react'
import { useTranslation } from 'react-i18next'
import { rotationFor, ZONES, zoneSites } from '@/domain/sites/catalog'
import type { SiteUse } from '@/domain/sites/injectionSites'
import { ageShort, rankSites, siteStatuses, type SiteStatus } from '@/domain/sites/rotation'
import { useSiteZones } from '@/lib/siteZones'
import { SiteDetail } from './SiteDetail'
import { HEAT } from './siteHeat'
import { reasonText } from './siteText'

export interface SitePickerProps {
  /** Selected site id, '' for none. */
  value: string
  /** Called with the tapped site id; tapping the selected site again clears it (''). */
  onChange: (siteId: string) => void
  /** Past uses; rows of one blend (same site and moment) count as one injection. */
  history: SiteUse[]
  /** Moment of the dose being logged: recency is measured from here. */
  now: Date
  /** Substance being injected: its previous site is avoided. */
  compoundId?: string
}

/**
 * Site chooser for the dose sheets: the three best points of the person's rotation, the chosen
 * point's last use with a warning when it is still inside its 72 h rest, and every point by
 * zone a tap away (below, so opening it never moves what is above).
 */
export function SitePicker({
  value,
  onChange,
  history,
  now,
  compoundId,
}: SitePickerProps): JSX.Element {
  const { t } = useTranslation()
  const zones = useSiteZones()
  const statuses = useMemo(() => siteStatuses(history, now), [history, now])
  const top = useMemo(
    () => rankSites(history, now, { candidates: rotationFor(zones), compoundId }).slice(0, 3),
    [history, now, zones, compoundId],
  )
  const byId = useMemo(() => new Map(statuses.map((s) => [s.siteId, s])), [statuses])
  const selected = value ? byId.get(value) : undefined
  // Open when the chosen point is not among the suggestions, so it is always in sight.
  const [all, setAll] = useState(() => Boolean(value) && !top.some((s) => s.siteId === value))
  const toggle = (id: string) => onChange(id === value ? '' : id)
  // The zones in rotation first: the others are there for the odd shot.
  const ordered = [
    ...ZONES.filter((z) => zones.includes(z.zone)),
    ...ZONES.filter((z) => !zones.includes(z.zone)),
  ]

  return (
    <div className="space-y-2.5">
      <div className="grid grid-cols-3 gap-1.5" role="group" aria-label={t('sites.next')}>
        {top.map((s, i) => {
          const on = s.siteId === value
          return (
            <button
              key={s.siteId}
              type="button"
              aria-pressed={on}
              onClick={() => toggle(s.siteId)}
              className={clsx(
                'flex min-h-[56px] min-w-0 flex-col justify-center gap-0.5 rounded-control border px-2 py-1.5 text-left transition-colors',
                on
                  ? 'border-signal/50 bg-signal-soft text-ink'
                  : 'border-line bg-panel-2 text-ink-2 active:border-line-strong',
              )}
            >
              <span className="flex min-w-0 items-start gap-1.5">
                <span
                  className={clsx(
                    'readout text-[10px] font-bold',
                    i === 0 ? 'text-signal' : 'text-muted',
                  )}
                >
                  {i + 1}
                </span>
                <span className="text-[12.5px] font-semibold leading-tight">
                  {t(`sites.labels.${s.site.labelKey}`)}
                </span>
              </span>
              <span
                className={clsx(
                  'text-[11px] leading-tight',
                  s.resting ? 'text-warn' : 'text-muted',
                )}
              >
                {reasonText(t, s.reason)}
              </span>
            </button>
          )
        })}
      </div>

      <div aria-live="polite" className="min-h-[44px] rounded-control bg-panel-2 px-3 py-2">
        {selected ? (
          <SiteDetail status={selected} now={now} warn />
        ) : (
          <p className="py-1 text-[12.5px] text-muted">
            {top[0]?.resting ? t('sites.allResting') : t('sites.pickHint')}
          </p>
        )}
      </div>
      <button
        type="button"
        aria-expanded={all}
        onClick={() => setAll((v) => !v)}
        className="tap-link flex min-h-11 items-center gap-1 text-[13px] font-semibold text-signal"
      >
        {t('sites.allPoints')}
        <ChevronDown
          aria-hidden
          className={clsx('size-4 transition-transform', all && 'rotate-180')}
        />
      </button>
      {all && (
        <div className="space-y-3">
          {ordered.map(({ zone }) => (
            <div key={zone} role="group" aria-label={t(`sites.zones.${zone}`)}>
              <span className="spec">{t(`sites.zones.${zone}`)}</span>
              <div className="mt-1 grid grid-cols-2 gap-1.5">
                {zoneSites(zone).map((site) => (
                  <PointButton
                    key={site.id}
                    status={byId.get(site.id)}
                    id={site.id}
                    on={site.id === value}
                    onClick={() => toggle(site.id)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/** One point of a zone: its name and, on a dot of its rest colour, how long ago it was used. */
function PointButton({
  id,
  status,
  on,
  onClick,
}: {
  id: string
  status: SiteStatus | undefined
  on: boolean
  onClick: () => void
}) {
  const { t } = useTranslation()
  const heat = status?.heat ?? 'never'
  const age = ageShort(status?.hoursSince ?? null)
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={clsx(
        'flex min-h-11 min-w-0 items-center gap-2 rounded-control border px-2.5 text-left text-[12.5px] font-semibold leading-tight transition-colors',
        on ? 'border-signal/50 bg-signal-soft text-ink' : 'border-line text-ink-2',
      )}
    >
      <span
        aria-hidden
        className={clsx(
          'size-2.5 shrink-0 rounded-full',
          heat === 'never' && 'border border-line-strong',
        )}
        style={{ background: HEAT[heat].fill }}
      />
      <span className="min-w-0 flex-1">{t(`sites.labels.${id}`)}</span>
      {age && <span className="readout shrink-0 text-[11px] font-medium text-muted">{age}</span>}
    </button>
  )
}
