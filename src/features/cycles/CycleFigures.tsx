import { clsx } from 'clsx'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Skeleton } from '@/components/ui/primitives'
import { fmtPercent } from '@/lib/format'
import { useLocale } from '@/lib/useLocale'
import { fmtWeightDelta } from './format'
import type { Comparison, WindowStats } from './stats'

function Tile({
  label,
  value,
  sub,
  tone,
  text = false,
}: {
  label: ReactNode
  value: ReactNode
  sub?: ReactNode
  tone?: 'good' | 'warn'
  /** The value is words rather than a figure (a dose like "100 + 100 mcg"): smaller and free to wrap. */
  text?: boolean
}) {
  return (
    <div className="min-w-0 rounded-control border border-line bg-panel-2 px-3 py-2.5">
      <div className="spec text-[9.5px] leading-snug tracking-[0.08em]">{label}</div>
      <div
        className={clsx(
          'readout mt-1 font-semibold leading-tight',
          text ? 'text-[14.5px]' : 'text-[17px]',
          'break-words',
          tone === 'good' && 'text-signal',
          tone === 'warn' && 'text-warn',
        )}
      >
        {value}
      </div>
      {sub && <div className="mt-0.5 text-[11px] leading-snug text-muted">{sub}</div>}
    </div>
  )
}

/**
 * What the cycle has come to so far: adherence, doses taken and how weight moved since it
 * began (only with readings). A tile with nothing behind it is left out, not shown empty.
 */
export function CycleFigures({
  stats,
  state,
  imperial,
  lastDose,
}: {
  stats: WindowStats | null
  state: 'pending' | 'ready' | 'error'
  imperial: boolean
  /** The dose the cycle ended on, for one that is over. */
  lastDose?: string | null
}) {
  const { t } = useTranslation()
  const { locale } = useLocale()

  if (state === 'pending') {
    return (
      <div className="grid grid-cols-3 gap-2" aria-hidden>
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-[68px]" />
        ))}
      </div>
    )
  }
  if (state === 'error') {
    return <p className="text-[12px] text-muted">{t('cycles.statsError')}</p>
  }
  if (!stats) return null

  const { adherence, taken, weight } = stats
  const extras = adherence && taken !== null ? Math.max(0, taken - adherence.taken) : 0
  const tiles: ReactNode[] = []
  if (adherence && adherence.expected > 0) {
    tiles.push(
      <Tile
        key="adherence"
        label={t('cycles.stat.adherence')}
        value={fmtPercent(adherence.ratio, locale)}
        sub={t('cycles.stat.ofDoses', { taken: adherence.taken, expected: adherence.expected })}
        tone={adherence.ratio >= 0.9 ? 'good' : 'warn'}
      />,
    )
  }
  if (taken !== null) {
    tiles.push(
      <Tile
        key="doses"
        label={t('cycles.stat.doses')}
        value={taken}
        sub={extras > 0 ? t('cycles.stat.extras', { count: extras }) : t('cycles.stat.logged')}
      />,
    )
  }
  if (weight) {
    tiles.push(
      <Tile
        key="weight"
        label={t('cycles.stat.weight')}
        value={fmtWeightDelta(weight.deltaKg, imperial, locale)}
        sub={t('cycles.stat.sinceStart')}
      />,
    )
  }
  if (lastDose) {
    tiles.push(<Tile key="last" label={t('cycles.stat.lastDose')} value={lastDose} text />)
  }
  if (tiles.length === 0) return null

  return (
    <div
      className={clsx(
        'grid gap-2',
        tiles.length === 3 ? 'grid-cols-1 min-[360px]:grid-cols-3' : 'grid-cols-2',
      )}
    >
      {tiles}
    </div>
  )
}

/** This cycle against the one before over the same stretch from their starts. */
export function CompareBlock({
  comparison,
  imperial,
}: {
  comparison: Comparison
  imperial: boolean
}) {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const { current, previous } = comparison

  const rows: { key: string; label: string; now: string; before: string }[] = []
  if (current.adherence?.expected && previous.adherence?.expected) {
    rows.push({
      key: 'adherence',
      label: t('cycles.stat.adherence'),
      now: fmtPercent(current.adherence.ratio, locale),
      before: fmtPercent(previous.adherence.ratio, locale),
    })
  }
  if (current.weight && previous.weight) {
    rows.push({
      key: 'weight',
      label: t('cycles.stat.weight'),
      now: fmtWeightDelta(current.weight.deltaKg, imperial, locale),
      before: fmtWeightDelta(previous.weight.deltaKg, imperial, locale),
    })
  }
  if (current.taken !== null && previous.taken !== null) {
    rows.push({
      key: 'doses',
      label: t('cycles.stat.doses'),
      now: String(current.taken),
      before: String(previous.taken),
    })
  }
  if (rows.length === 0) return null

  return (
    <div className="border-t border-line px-4 py-3">
      <div className="spec">{t('cycles.compare.title')}</div>
      <p className="mt-0.5 text-[11.5px] text-muted">
        {t('cycles.compare.span', { count: comparison.weeks })}
      </p>
      <dl className="mt-1.5">
        {rows.map((r) => (
          <div key={r.key} className="flex items-baseline justify-between gap-3 py-1">
            <dt className="text-[13px] text-ink-2">{r.label}</dt>
            <dd className="readout text-[13.5px] font-semibold">
              {r.now}{' '}
              <span className="font-normal text-muted">
                · {t('cycles.compare.before', { value: r.before })}
              </span>
            </dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
