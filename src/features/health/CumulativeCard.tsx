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

const BARS_H = 34

export function CumulativeCard({ totals }: { totals: readonly CompoundTotal[] }) {
  const { t } = useTranslation()
  if (totals.length === 0) return null
  return (
    <section className="card fade-up p-3.5" aria-label={t('progress.total.eyebrow')}>
      <h3 className="spec">{t('progress.total.eyebrow')}</h3>
      <p className="mt-1 text-[11.5px] text-muted">{t('progress.total.hint', { n: HEAT_WEEKS })}</p>
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
    <li className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 py-3">
      <div className="min-w-0">
        <div className="flex items-start gap-1.5 text-[13px] font-semibold leading-snug text-ink-2">
          <span className="mt-[5px] flex">
            <SubstanceDot color={color} size={7} />
          </span>
          <span className="min-w-0">{name}</span>
        </div>
        <div className="readout mt-1.5 text-[22px] font-semibold leading-none">
          {amount}
          <span className="ml-1 text-[12px] font-medium text-muted">{unit.join(' ')}</span>
        </div>
        <div className="mt-1.5 text-[11.5px] leading-snug text-muted">
          {t('progress.total.caption', {
            count: total.count,
            date: fmtDate(total.since, locale, 'd MMM'),
          })}
        </div>
      </div>
      <div
        role="img"
        aria-label={t('progress.total.barsAria', { name, values })}
        className="flex w-[104px] items-end gap-[2px]"
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
              opacity: h > 0 ? (i === heights.length - 1 ? 0.6 : 0.95) : 1,
            }}
          />
        ))}
      </div>
    </li>
  )
}
