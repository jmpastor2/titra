import { clsx } from 'clsx'
import { useState, type KeyboardEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { ageShort, type SiteHeat, type SiteStatus } from '@/domain/sites/rotation'
import { BACK, COMPACT_CAPTION_X, FRONT, SPOTS, VIEWBOX } from './bodyMapGeometry'
import { SiteDetail } from './SiteDetail'

/** Fresh sites burn warm; rested ones cool down to the action colour. */
const HEAT: Record<SiteHeat, { fill: string; ink: string }> = {
  hot: { fill: 'var(--danger)', ink: 'var(--panel)' },
  warm: { fill: 'var(--warn)', ink: 'var(--panel)' },
  cool: { fill: 'color-mix(in oklab, var(--signal) 45%, var(--panel))', ink: 'var(--ink)' },
  rested: { fill: 'var(--signal)', ink: 'var(--panel)' },
  never: { fill: 'var(--panel)', ink: 'var(--muted)' },
}
const LEGEND: readonly SiteHeat[] = ['hot', 'warm', 'cool', 'rested', 'never']

function Figure({ cx, back }: { cx: number; back?: boolean }) {
  return (
    <g fill="var(--panel-2)" stroke="var(--line-strong)" strokeWidth={1.2}>
      <circle cx={cx} cy={27} r={15} />
      <rect x={cx - 6} y={40} width={12} height={12} rx={3} />
      {/* arms, behind the torso */}
      <rect x={cx - 48} y={58} width={13} height={94} rx={6.5} />
      <rect x={cx + 35} y={58} width={13} height={94} rx={6.5} />
      {/* legs */}
      <rect x={cx - 27} y={150} width={24} height={136} rx={11} />
      <rect x={cx + 3} y={150} width={24} height={136} rx={11} />
      {/* torso: shoulders, waist, hips */}
      <path
        d={`M${cx - 28} 52 Q${cx - 35} 52 ${cx - 35} 61 L${cx - 24} 128 Q${cx - 30} 146 ${cx - 28} 166 L${cx + 28} 166 Q${cx + 30} 146 ${cx + 24} 128 L${cx + 35} 61 Q${cx + 35} 52 ${cx + 28} 52 Z`}
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
  /** Controlled selection (the picker). */
  selectedId?: string
  /** Makes the map a radio group: tapping a spot selects it. */
  onSelect?: (siteId: string) => void
  /** ~200 px tall crop for bottom sheets; hides the legend and the detail line. */
  compact?: boolean
  className?: string
}

/**
 * Body map of the injection sites, coloured by how recently each was used. Every spot is
 * tappable: with `onSelect` it selects, and the full map shows the tapped site's last
 * use underneath.
 */
export function BodyMap({
  statuses,
  now,
  suggestedId,
  selectedId,
  onSelect,
  compact = false,
  className,
}: BodyMapProps) {
  const { t } = useTranslation()
  const [inspected, setInspected] = useState<string | undefined>(undefined)
  const byId = new Map(statuses.map((s) => [s.siteId, s]))
  const focusId = selectedId || inspected
  const detail = focusId ? byId.get(focusId) : undefined
  const selectable = Boolean(onSelect)

  function pick(id: string) {
    setInspected(id)
    onSelect?.(id)
  }
  function onKey(e: KeyboardEvent, id: string) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      pick(id)
    }
  }

  return (
    <figure className={clsx('m-0', className)}>
      <div className="relative mx-auto" style={{ maxWidth: compact ? 288 : 360 }}>
        <svg
          viewBox={compact ? VIEWBOX.compact : VIEWBOX.full}
          className="block w-full select-none"
          role={selectable ? 'radiogroup' : 'group'}
          aria-label={t('sites.title')}
        >
          <Figure cx={FRONT} />
          <Figure cx={BACK} back />

          {!compact &&
            [FRONT, BACK].map((cx) => (
              <g
                key={cx}
                className="spec"
                fontSize={8.5}
                fill="var(--muted)"
                letterSpacing="0.12em"
              >
                <text x={cx - 44} y={300} textAnchor="middle">
                  {t('sites.leftShort')}
                </text>
                <text x={cx} y={300} textAnchor="middle" fill="var(--ink-2)" fontWeight={700}>
                  {cx === FRONT ? t('sites.front') : t('sites.back')}
                </text>
                <text x={cx + 44} y={300} textAnchor="middle">
                  {t('sites.rightShort')}
                </text>
              </g>
            ))}

          {SPOTS.map((s) => {
            const status = byId.get(s.id)
            const heat = status?.heat ?? 'never'
            const colors = HEAT[heat]
            const suggested = s.id === suggestedId
            const focused = s.id === focusId
            const label = t(`sites.labels.${s.id}`)
            return (
              <g
                key={s.id}
                role={selectable ? 'radio' : 'button'}
                aria-checked={selectable ? s.id === selectedId : undefined}
                aria-pressed={selectable ? undefined : focused}
                aria-label={label}
                tabIndex={0}
                onClick={() => pick(s.id)}
                onKeyDown={(e) => onKey(e, s.id)}
                className="group cursor-pointer outline-none"
              >
                <rect x={s.hit.x} y={s.hit.y} width={s.hit.w} height={s.hit.h} fill="transparent" />
                <circle
                  cx={s.cx}
                  cy={s.cy}
                  r={15.5}
                  fill="none"
                  stroke="var(--signal)"
                  strokeWidth={2}
                  className="opacity-0 group-focus-visible:opacity-100"
                />
                {suggested && (
                  <circle
                    cx={s.cx}
                    cy={s.cy}
                    r={12.5}
                    fill="none"
                    stroke="var(--signal)"
                    strokeWidth={1.8}
                    strokeDasharray="3 2.5"
                    className={clsx(compact && !focused && 'motion-safe:animate-pulse')}
                  />
                )}
                {focused && (
                  <circle
                    cx={s.cx}
                    cy={s.cy}
                    r={suggested ? 10 : 11}
                    fill="none"
                    stroke="var(--ink)"
                    strokeWidth={2}
                  />
                )}
                <circle
                  cx={s.cx}
                  cy={s.cy}
                  r={8}
                  style={{ fill: colors.fill }}
                  stroke={heat === 'never' ? 'var(--line-strong)' : 'none'}
                  strokeWidth={1.2}
                  className="transition-[fill] duration-300 group-active:opacity-75"
                />
                <text
                  x={s.cx}
                  y={s.cy + 2.5}
                  textAnchor="middle"
                  fontSize={7}
                  fontWeight={700}
                  fill={colors.ink}
                  fontFamily="var(--font-mono)"
                  aria-hidden
                  className="pointer-events-none"
                >
                  {ageShort(status?.hoursSince ?? null)}
                </text>
              </g>
            )
          })}
        </svg>

        {compact && (
          <div aria-hidden className="relative h-3.5">
            {COMPACT_CAPTION_X.map((x, i) => (
              <div
                key={x}
                className="spec absolute top-0 flex -translate-x-1/2 gap-2 text-[9px] leading-none"
                style={{ left: `${x * 100}%` }}
              >
                <span>{t('sites.leftShort')}</span>
                <span className="text-ink-2">{i === 0 ? t('sites.front') : t('sites.back')}</span>
                <span>{t('sites.rightShort')}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {!compact && (
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
          <div aria-live="polite" className="min-h-[52px] rounded-control bg-panel-2 px-3 py-2.5">
            {detail ? (
              <SiteDetail status={detail} now={now} />
            ) : (
              <p className="text-[12.5px] text-muted">{t('sites.tapHint')}</p>
            )}
          </div>
        </figcaption>
      )}
    </figure>
  )
}
