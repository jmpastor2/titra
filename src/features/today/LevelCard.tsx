import { subDays } from 'date-fns'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Vial } from '@/components/ui/primitives'
import { compoundColor } from '@/content/substanceColor'
import type { InventoryRow } from '@/data/database.types'
import { exposureCurve } from '@/domain/pk/engine'
import type { CompoundExposure } from '@/features/exposure/useExposure'
import { fmtDistance, fmtNumber, fmtPercent } from '@/lib/format'
import { useLocale } from '@/lib/useLocale'

/** Compact per-substance instrument: vial level, amount on board and a 14-day trace. */
export function LevelCard({
  x,
  vial,
  now,
}: {
  x: CompoundExposure
  vial: InventoryRow | undefined
  now: Date
}) {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const color = compoundColor(x.compoundId)
  const fill =
    vial && Number(vial.total_mg) > 0
      ? Number(vial.remaining_mg) / Number(vial.total_mg)
      : undefined

  const trace = useMemo(() => {
    if (!x.pk) return null
    const pts = exposureCurve(x.history, x.pk, { from: subDays(now, 14), to: now, stepH: 6 })
    const max = Math.max(...pts.map((p) => p.mg), 1e-9)
    return pts.map((p, i) => `${(i / (pts.length - 1)) * 100},${28 - (p.mg / max) * 26}`).join(' ')
  }, [x.pk, x.history, now])

  return (
    <Link
      to={`/substance/${x.compoundId}`}
      className="card flex w-[168px] shrink-0 flex-col gap-2 p-3.5 transition active:scale-[0.98]"
      style={{ borderColor: `color-mix(in oklab, ${color} 30%, var(--line))` }}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="line-clamp-2 text-[13.5px] font-semibold leading-tight">
          {x.compound?.names.generic ?? x.compoundId}
        </span>
        <Vial
          color={color}
          fill={fill ?? 0.001}
          size={30}
          className={fill === undefined ? 'opacity-40' : ''}
        />
      </div>
      {x.nowMg !== null ? (
        <div>
          <div className="readout text-[22px] font-semibold leading-none" style={{ color }}>
            {fmtNumber(x.nowMg, locale, x.nowMg < 1 ? 2 : 1)}
            <span className="ml-1 text-[11px] text-muted">mg</span>
          </div>
          <div className="spec mt-1">
            {x.progress
              ? `${t('today.onBoard')} · SS ${fmtPercent(Math.min(1, x.progress.fraction), locale)}`
              : t('today.onBoard')}
          </div>
        </div>
      ) : (
        <div>
          <div className="readout text-[15px] font-semibold leading-tight">
            {x.lastDose ? fmtDistance(x.lastDose.at, locale) : '—'}
          </div>
          <div className="spec mt-1">{t('today.lastDose')}</div>
        </div>
      )}
      {trace ? (
        <svg viewBox="0 0 100 30" preserveAspectRatio="none" className="h-7 w-full" aria-hidden>
          <polyline
            points={trace}
            fill="none"
            stroke={color}
            strokeWidth={1.6}
            vectorEffect="non-scaling-stroke"
            style={{ filter: `drop-shadow(0 0 3px ${color})` }}
          />
        </svg>
      ) : (
        <div className="h-7 rounded-md border border-dashed border-line" aria-hidden />
      )}
    </Link>
  )
}
