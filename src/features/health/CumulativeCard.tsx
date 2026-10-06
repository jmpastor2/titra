/**
 * "Total administrado": how much of each compound has gone in, with one bar per week for the
 * last twelve, so a titration reads as a staircase. Each compound's bars are scaled to its own
 * largest week: the doses of a GLP-1 (mg) and a GH secretagogue (mcg) are not comparable.
 */
import { useTranslation } from 'react-i18next'
import { SubstanceDot } from '@/components/ui/primitives'
import { compoundName } from '@/content/compounds'
import { compoundColor } from '@/content/substanceColor'
import { fmtDate, fmtDose } from '@/lib/format'
import { useLocale } from '@/lib/useLocale'
import { barHeights, type CompoundTotal } from './cumulative'
import { HEAT_WEEKS } from './heatmap'

const BARS_H = 26

export function CumulativeCard({ totals }: { totals: readonly CompoundTotal[] }) {
  const { t } = useTranslation()
  if (totals.length === 0) return null
  return (
    <section className="card fade-up p-4" aria-label={t('progress.total.eyebrow')}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-3">
        <h3 className="spec">{t('progress.total.eyebrow')}</h3>
        <span className="text-[11.5px] text-muted">
          {t('progress.total.hint', { n: HEAT_WEEKS })}
        </span>
      </div>
      <ul className="mt-1 divide-y divide-line">
        {totals.map((total) => (
          <TotalRow key={total.compoundId} total={total} />
        ))}
      </ul>
    </section>
  )
}

function TotalRow({ total }: { total: CompoundTotal }) {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const name = compoundName(total.compoundId)
  const color = compoundColor(total.compoundId)
  const heights = barHeights(total.weekly)
  const values = total.weekly.map((mg) => fmtDose(mg, total.unit, locale)).join(', ')
  const [amount, ...unit] = fmtDose(total.totalMg, total.unit, locale).split(' ')

  return (
    <li className="grid grid-cols-[minmax(0,1fr)_auto_64px] items-center gap-x-3 py-2.5">
      <div className="flex min-w-0 items-start gap-1.5 text-[13.5px] font-semibold leading-snug text-ink">
        <span className="mt-[6px] flex">
          <SubstanceDot color={color} size={7} />
        </span>
        <span className="min-w-0">{name}</span>
      </div>
      <div className="readout whitespace-nowrap text-right text-[17px] font-semibold leading-none">
        {amount}
        <span className="ml-1 font-sans text-[12px] font-medium text-muted">{unit.join(' ')}</span>
      </div>
      <div
        role="img"
        aria-label={t('progress.total.barsAria', { name, values })}
        className="flex items-end gap-[2px]"
        style={{ height: BARS_H }}
      >
        {heights.map((h, i) => (
          <span
            // The weeks are fixed positions, oldest to newest.
            // oxlint-disable-next-line react/no-array-index-key
            key={i}
            className="min-w-0 flex-1 rounded-[2px]"
            style={{
              height: Math.max(2, Math.round(h * BARS_H)),
              background: h > 0 ? color : 'var(--panel-3)',
              opacity: h > 0 ? (i === heights.length - 1 ? 0.55 : 0.95) : 1,
            }}
          />
        ))}
      </div>
      <div className="col-span-3 mt-0.5 pl-[13px] text-[12px] leading-snug text-muted">
        {t('progress.total.caption', {
          count: total.count,
          date: fmtDate(total.since, locale, 'd MMM'),
        })}
      </div>
    </li>
  )
}
