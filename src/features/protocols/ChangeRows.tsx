import { addDays } from 'date-fns'
import { ArrowRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { fmtDate } from '@/lib/format'
import { useLocale } from '@/lib/useLocale'
import type { ChangeRow } from './stepChange'

/**
 * "Before → after" for a change about to be made: only what it moves (the next change, the
 * end of the cycle, the weeks of the plan, the dose today), the new value in front.
 */
export function ChangeRows({
  rows,
  doseText,
}: {
  rows: readonly ChangeRow[]
  /** A primary dose in mg as the person reads it: "12 U (200 + 200 mcg)". */
  doseText: (mg: number | null) => string
}) {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const day = (d: Date) => fmtDate(d, locale, 'EEE d MMM')
  if (rows.length === 0) return null

  return (
    <dl className="overflow-hidden rounded-control border border-line bg-panel-2">
      {rows.map((r) => {
        const [before, after] =
          r.kind === 'next'
            ? [day(r.before), day(r.after)]
            : r.kind === 'end'
              ? // The plan ends on its last day: the date it carries is the day after.
                [day(addDays(r.before, -1)), day(addDays(r.after, -1))]
              : r.kind === 'weeks'
                ? [t('common.weeks', { count: r.before }), t('common.weeks', { count: r.after })]
                : [doseText(r.before), doseText(r.after)]
        return (
          <div key={r.kind} className="border-b border-line px-3.5 py-3 last:border-b-0">
            <dt className="spec">{t(`protocolMenu.row.${r.kind}`)}</dt>
            <dd className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5">
              <span className="readout text-[13.5px] text-muted line-through decoration-muted/60">
                {before}
              </span>
              <ArrowRight aria-hidden className="size-4 shrink-0 text-signal" />
              <span className="readout text-[15px] font-semibold text-ink">{after}</span>
            </dd>
          </div>
        )
      })}
    </dl>
  )
}

/** The sentence that says it in words, when the next change moves. */
export function ChangeHeadline({ rows }: { rows: readonly ChangeRow[] }) {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const next = rows.find((r) => r.kind === 'next')
  if (!next || next.kind !== 'next') return null
  return (
    <p className="text-[15px] font-semibold leading-snug text-ink">
      {t('protocolMenu.nextMoves', {
        from: fmtDate(next.before, locale, 'EEE d MMM'),
        to: fmtDate(next.after, locale, 'EEE d MMM'),
      })}
    </p>
  )
}
