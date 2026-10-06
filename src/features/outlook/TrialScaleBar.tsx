/**
 * "Where am I against the trial", in one bar: % change in body weight from the start on the left
 * to a loss of 20 % or more on the right, the band the trial observed shaded in the colour of the
 * substance, placebo as a faint tick, the person today as an ink dot with its figure above it and,
 * when there is one, the end of his own trend as a hollow dot. The maths is in trialScale.ts.
 */
import { clsx } from 'clsx'
import type { CSSProperties } from 'react'
import { LegendItem, LegendList } from '@/features/exposure/CardParts'
import { fmtSigned } from '@/features/health/progress'
import type { Fmt } from './outlookFormat'
import { labelAnchor, type TrialScale } from './trialScale'

const ANCHOR: Record<ReturnType<typeof labelAnchor>, string> = {
  start: 'translateX(-4px)',
  middle: 'translateX(-50%)',
  end: 'translateX(calc(-100% + 4px))',
}

const at = (pos: number): CSSProperties => ({ left: `${pos * 100}%` })

export function TrialScaleBar({
  f,
  scale,
  color,
  you,
  projection,
  bandLabel,
  legend = true,
  className,
}: {
  f: Fmt
  scale: TrialScale
  color: string
  /** The person's change so far, in %, for the label over his dot. */
  you: number | null
  /** The end of his trend at the horizon, in %, for the legend. */
  projection?: { pct: number; weak: boolean } | null
  /** What the band is, e.g. "Ensayo · semana 24". */
  bandLabel: string
  legend?: boolean
  className?: string
}) {
  const { t, locale } = f
  const summary = [
    scale.band && bandLabel,
    you !== null && t('outlook.scale.youAria', { pct: f.pct(you) }),
    projection && t('outlook.scale.projectionAria', { pct: f.pct(projection.pct) }),
  ]
    .filter(Boolean)
    .join('. ')

  return (
    <figure className={clsx('flex flex-col', className)}>
      <div role="img" aria-label={summary}>
        {/* The figure of the person, over his dot. */}
        <div className="relative h-5" aria-hidden>
          {scale.you !== null && you !== null && (
            <span
              className="readout absolute bottom-0 whitespace-nowrap text-[12.5px] font-semibold leading-none text-ink"
              style={{ ...at(scale.you), transform: ANCHOR[labelAnchor(scale.you)] }}
            >
              {t('outlook.scale.you')} {f.pct(you)}
            </span>
          )}
        </div>

        <div className="relative mt-2 h-2.5" aria-hidden>
          <div className="absolute inset-0 rounded-full bg-panel-3" />
          {scale.band && (
            <div
              data-part="band"
              className="absolute inset-y-0 min-w-[5px] rounded-full"
              style={{
                left: `${scale.band[0] * 100}%`,
                width: `${(scale.band[1] - scale.band[0]) * 100}%`,
                background: `color-mix(in oklab, ${color} 62%, transparent)`,
              }}
            />
          )}
          {scale.placebo !== null && (
            <span
              data-part="placebo"
              className="absolute -top-[3px] h-4 w-[2px] -translate-x-1/2 rounded-full bg-line-strong"
              style={at(scale.placebo)}
            />
          )}
          {scale.projection !== null && (
            <span
              data-part="projection"
              className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-ink-2 bg-panel"
              style={at(scale.projection)}
            />
          )}
          {scale.you !== null && (
            <span
              data-part="you"
              className="absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-ink ring-[3px] ring-panel"
              style={at(scale.you)}
            />
          )}
        </div>

        <div className="relative mt-2 h-3.5" aria-hidden>
          {scale.ticks.map((v, i) => {
            const pos = (scale.from - v) / (scale.from - scale.to)
            const last = i === scale.ticks.length - 1
            return (
              <span
                key={v}
                className="readout absolute top-0 whitespace-nowrap text-[11px] leading-none text-muted"
                style={{ ...at(pos), transform: ANCHOR[labelAnchor(pos, 0.04)] }}
              >
                {fmtSigned(v, locale, 0)}
                {last && (locale === 'es' ? ' %' : '%')}
              </span>
            )
          })}
        </div>
      </div>

      {legend && (
        <figcaption>
          <LegendList>
            {scale.band && (
              <LegendItem
                swatch={
                  <span
                    className="h-2.5 w-4 rounded-full"
                    style={{ background: `color-mix(in oklab, ${color} 62%, transparent)` }}
                  />
                }
              >
                {bandLabel}
              </LegendItem>
            )}
            {scale.placebo !== null && (
              <LegendItem swatch={<span className="h-3 w-[2px] rounded-full bg-line-strong" />}>
                {t('outlook.scale.placebo')}
              </LegendItem>
            )}
            {scale.you !== null && (
              <LegendItem swatch={<span className="size-2.5 rounded-full bg-ink" />}>
                {t('outlook.scale.youToday')}
              </LegendItem>
            )}
            {projection && scale.projection !== null && (
              <LegendItem
                swatch={<span className="size-2.5 rounded-full border-2 border-ink-2 bg-panel" />}
              >
                <span>
                  {t('outlook.scale.projection')}{' '}
                  <span className="readout font-semibold text-ink-2">{f.pct(projection.pct)}</span>
                  {' · '}
                  {projection.weak ? t('outlook.personal.badgeWeak') : t('outlook.personal.badge')}
                </span>
              </LegendItem>
            )}
          </LegendList>
        </figcaption>
      )}
    </figure>
  )
}
