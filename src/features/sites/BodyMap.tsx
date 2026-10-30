import { clsx } from 'clsx'
import { useState, type KeyboardEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { ageShort, type SiteStatus } from '@/domain/sites/rotation'
import { Segmented } from '@/components/ui/primitives'
import { C, MIN_WIDTH_PX, SPOTS, VIEWBOX, viewOf, type BodyView } from './bodyMapGeometry'
import { SiteDetail } from './SiteDetail'
import { HEAT, LEGEND } from './siteHeat'

/** A plain figure, drawn wide enough for three points a side across the belly. */
function Figure({ cx, back }: { cx: number; back?: boolean }) {
  return (
    <g fill="var(--panel-2)" stroke="var(--line-strong)" strokeWidth={1.2}>
      <circle cx={cx} cy={27} r={15} />
      <rect x={cx - 7} y={40} width={14} height={12} rx={3} />
      {/* arms, beside the torso */}
      <rect x={cx - 58} y={56} width={13} height={96} rx={6.5} />
      <rect x={cx + 45} y={56} width={13} height={96} rx={6.5} />
      {/* legs */}
      <rect x={cx - 33} y={150} width={28} height={136} rx={12} />
      <rect x={cx + 5} y={150} width={28} height={136} rx={12} />
      {/* torso: shoulders, waist, hips */}
      <path
        d={`M${cx - 36} 52 Q${cx - 44} 52 ${cx - 44} 61 L${cx - 33} 128 Q${cx - 39} 146 ${cx - 36} 166 L${cx + 36} 166 Q${cx + 39} 146 ${cx + 33} 128 L${cx + 44} 61 Q${cx + 44} 52 ${cx + 36} 52 Z`}
      />
      {back ? (
        // spine and the line between the glutes
        <g fill="none" stroke="var(--line)" strokeWidth={1}>
          <path d={`M${cx} 56 V148`} />
          <path d={`M${cx} 152 V178`} />
        </g>
      ) : (
        <circle cx={cx} cy={118.5} r={1.8} fill="var(--line-strong)" stroke="none" />
      )}
    </g>
  )
}

export interface BodyMapProps {
  /** Recency of each site (from `siteStatuses`); spots without a status read as never used. */
  statuses: readonly SiteStatus[]
  now: Date
  suggestedId?: string
  /** Points outside the person's rotation: drawn faint, still tappable. */
  inRotation?: ReadonlySet<string>
  className?: string
}

/**
 * Body map of the injection sites, one side of the body at a time, coloured by how recently
 * each was used. It opens on the side of the suggested point; a tap shows that point's last
 * use underneath.
 */
export function BodyMap({ statuses, now, suggestedId, inRotation, className }: BodyMapProps) {
  const { t } = useTranslation()
  const [view, setView] = useState<BodyView>(() => (suggestedId && viewOf(suggestedId)) || 'front')
  const [inspected, setInspected] = useState<string | undefined>(undefined)
  const byId = new Map(statuses.map((s) => [s.siteId, s]))
  const detail = inspected ? byId.get(inspected) : undefined
  const spots = SPOTS.filter((s) => s.view === view)

  function onKey(e: KeyboardEvent, id: string) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      setInspected(id)
    }
  }

  return (
    <figure className={clsx('m-0', className)}>
      <Segmented<BodyView>
        value={view}
        onChange={(v) => {
          setView(v)
          setInspected(undefined)
        }}
        size="sm"
        options={[
          { value: 'front', label: t('sites.front') },
          { value: 'back', label: t('sites.back') },
        ]}
      />
      {/*
        The tap targets are 26 units of a 160-wide map: below 280 px they would shrink under
        44 px, so on a 320 px phone the map keeps its 280 and spills into the card's margin.
      */}
      <div className="mt-2 flex justify-center">
        <div className="w-full shrink-0" style={{ maxWidth: 320, minWidth: MIN_WIDTH_PX }}>
          <svg
            viewBox={VIEWBOX}
            className="block w-full select-none"
            role="group"
            aria-label={view === 'front' ? t('sites.front') : t('sites.back')}
          >
            <Figure cx={C} back={view === 'back'} />
            <g
              fontSize={8}
              fontWeight={500}
              fill="var(--muted)"
              style={{ fontFamily: 'var(--font-sans)' }}
            >
              <text x={C - 52} y={260} textAnchor="middle">
                {t('sites.leftShort')}
              </text>
              <text x={C + 52} y={260} textAnchor="middle">
                {t('sites.rightShort')}
              </text>
            </g>

            {spots.map((s) => {
              const status = byId.get(s.id)
              const heat = status?.heat ?? 'never'
              const colors = HEAT[heat]
              const suggested = s.id === suggestedId
              const focused = s.id === inspected
              const off = inRotation !== undefined && !inRotation.has(s.id)
              return (
                <g
                  key={s.id}
                  role="button"
                  aria-pressed={focused}
                  aria-label={t(`sites.labels.${s.id}`)}
                  tabIndex={0}
                  onClick={() => setInspected(s.id)}
                  onKeyDown={(e) => onKey(e, s.id)}
                  className="group cursor-pointer outline-none"
                  opacity={off && !focused ? 0.4 : 1}
                >
                  <rect
                    x={s.hit.x}
                    y={s.hit.y}
                    width={s.hit.w}
                    height={s.hit.h}
                    fill="transparent"
                  />
                  <circle
                    cx={s.cx}
                    cy={s.cy}
                    r={12.5}
                    fill="none"
                    stroke="var(--signal)"
                    strokeWidth={1.5}
                    className="opacity-0 group-focus-visible:opacity-100"
                  />
                  {suggested && (
                    <circle
                      cx={s.cx}
                      cy={s.cy}
                      r={10.5}
                      fill="none"
                      stroke="var(--signal)"
                      strokeWidth={1.4}
                      strokeDasharray="2.5 2"
                    />
                  )}
                  {focused && (
                    <circle
                      cx={s.cx}
                      cy={s.cy}
                      r={suggested ? 8.5 : 9}
                      fill="none"
                      stroke="var(--ink)"
                      strokeWidth={1.6}
                    />
                  )}
                  <circle
                    cx={s.cx}
                    cy={s.cy}
                    r={6.5}
                    style={{ fill: colors.fill }}
                    stroke={heat === 'never' ? 'var(--line-strong)' : 'none'}
                    strokeWidth={1}
                    className="transition-[fill] duration-300 group-active:opacity-75"
                  />
                  <text
                    x={s.cx}
                    y={s.cy + 2}
                    textAnchor="middle"
                    fontSize={5.6}
                    fontWeight={700}
                    fill={colors.ink}
                    style={{ fontFamily: 'var(--font-num)' }}
                    aria-hidden
                    className="pointer-events-none"
                  >
                    {ageShort(status?.hoursSince ?? null)}
                  </text>
                </g>
              )
            })}
          </svg>
        </div>
      </div>

      <figcaption className="mt-3 space-y-3">
        <ul className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 text-[11.5px] text-muted">
          {LEGEND.map((h) => (
            <li key={h} className="inline-flex items-center gap-1.5">
              <span
                aria-hidden
                className={clsx(
                  'inline-block size-2.5 rounded-full',
                  h === 'never' && 'border border-line-strong',
                )}
                style={{ background: HEAT[h].fill }}
              />
              {t(`sites.heat.${h}`)}
            </li>
          ))}
        </ul>
        <div aria-live="polite" className="min-h-[52px] border-t border-line pt-3">
          {detail ? (
            <SiteDetail status={detail} now={now} />
          ) : (
            <p className="text-[12.5px] text-muted">{t('sites.tapHint')}</p>
          )}
        </div>
      </figcaption>
    </figure>
  )
}
