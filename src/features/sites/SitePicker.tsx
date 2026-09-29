import { clsx } from 'clsx'
import { useMemo, type JSX } from 'react'
import { useTranslation } from 'react-i18next'
import type { SiteUse } from '@/domain/sites/injectionSites'
import { rankSites, siteStatuses } from '@/domain/sites/rotation'
import { BodyMap } from './BodyMap'
import { SiteDetail } from './SiteDetail'
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
 * Compact site chooser for the log-dose sheet: a ~200 px body map coloured by recency,
 * the three best sites as chips, and the selected site's last use with a warning when it
 * is still inside its 72 h rest.
 */
export function SitePicker({
  value,
  onChange,
  history,
  now,
  compoundId,
}: SitePickerProps): JSX.Element {
  const { t } = useTranslation()
  const statuses = useMemo(() => siteStatuses(history, now), [history, now])
  const top = useMemo(
    () => rankSites(history, now, { compoundId }).slice(0, 3),
    [history, now, compoundId],
  )
  const selected = value ? statuses.find((s) => s.siteId === value) : undefined
  const toggle = (id: string) => onChange(id === value ? '' : id)

  return (
    <div className="space-y-2.5">
      <BodyMap
        compact
        statuses={statuses}
        now={now}
        suggestedId={top[0]?.siteId}
        selectedId={value}
        onSelect={toggle}
      />

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
                <span className="line-clamp-2 text-[12.5px] font-semibold leading-tight">
                  {t(`sites.labels.${s.site.labelKey}`)}
                </span>
              </span>
              <span
                className={clsx('truncate text-[11px]', s.resting ? 'text-warn' : 'text-muted')}
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
    </div>
  )
}
