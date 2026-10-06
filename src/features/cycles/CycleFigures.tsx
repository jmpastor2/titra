import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Skeleton } from '@/components/ui/primitives'
import { Fact, FactRow } from '@/features/doses/Fact'
import { fmtNumber, fmtPercent } from '@/lib/format'
import { useLocale } from '@/lib/useLocale'
import { fmtWeightDelta, weightDeltaParts } from './format'
import type { Comparison, WindowStats } from './stats'

/**
 * What the cycle has come to so far, as a row of figures across the card: adherence, doses
 * taken and how weight moved since it began (only with readings). A figure with nothing
 * behind it is left out, not shown empty.
 */
export function CycleFigures({
  stats,
  state,
  imperial,
}: {
  stats: WindowStats | null
  state: 'pending' | 'ready' | 'error'
  imperial: boolean
}) {
  const { t } = useTranslation()
  const { locale } = useLocale()

  if (state === 'pending') {
    return (
      <div className="grid grid-cols-3 gap-4 border-t border-line px-4 py-3.5" aria-hidden>
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-[52px]" />
        ))}
      </div>
    )
  }
  if (state === 'error') {
    return (
      <p className="border-t border-line px-4 py-3 text-[12.5px] text-muted">
        {t('cycles.statsError')}
      </p>
    )
  }
  if (!stats) return null

  const { adherence, taken, weight } = stats
  const extras = adherence && taken !== null ? Math.max(0, taken - adherence.taken) : 0
  const facts: ReactNode[] = []
  if (adherence && adherence.expected > 0) {
    facts.push(
      <Fact
        key="adherence"
        label={t('cycles.stat.adherence')}
        value={fmtNumber(Math.round(adherence.ratio * 100), locale, 0)}
        unit="%"
        tone={adherence.ratio >= 0.9 ? 'signal' : 'warn'}
        caption={t('cycles.stat.ofDoses', { taken: adherence.taken, expected: adherence.expected })}
      />,
    )
  }
  if (taken !== null) {
    facts.push(
      <Fact
        key="doses"
        label={t('cycles.stat.doses')}
        value={taken}
        caption={extras > 0 ? t('cycles.stat.extras', { count: extras }) : t('cycles.stat.logged')}
      />,
    )
  }
  if (weight) {
    const delta = weightDeltaParts(weight.deltaKg, imperial, locale)
    facts.push(
      <Fact
        key="weight"
        label={t('cycles.stat.weight')}
        value={delta.value}
        unit={delta.unit}
        caption={t('cycles.stat.sinceStart')}
      />,
    )
  }
  return (
    <FactRow count={facts.length} even>
      {facts}
    </FactRow>
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
