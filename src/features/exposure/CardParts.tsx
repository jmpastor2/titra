import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Badge, Segmented } from '@/components/ui/primitives'
import type { NextDose } from '@/domain/dosing/schedule'
import { fmtHours, fmtNumber } from '@/lib/format'
import { useLocale } from '@/lib/useLocale'
import { RANGES, type RangeKey } from './ranges'

/** 7 d / 4 w / 12 w / cycle. The cycle only makes sense when there is a plan to follow. */
export function RangeTabs({
  value,
  onChange,
  withCycle,
}: {
  value: RangeKey
  onChange: (next: RangeKey) => void
  withCycle: boolean
}) {
  const { t } = useTranslation()
  return (
    <Segmented<RangeKey>
      value={value}
      onChange={onChange}
      options={RANGES.filter((r) => r !== 'cycle' || withCycle).map((r) => ({
        value: r,
        label: t(`charts.ranges.${r}`),
      }))}
    />
  )
}

export function LegendList({ children }: { children: ReactNode }) {
  return (
    <ul className="flex flex-wrap items-center gap-x-3 gap-y-1 px-1 pb-1 pt-2 text-[11px] text-muted">
      {children}
    </ul>
  )
}

export function LegendItem({ swatch, children }: { swatch: ReactNode; children: ReactNode }) {
  return (
    <li className="inline-flex items-center gap-1.5">
      <span className="inline-flex h-3.5 min-w-4 items-center justify-center" aria-hidden>
        {swatch}
      </span>
      {children}
    </li>
  )
}

/** When the next administration is, and what it asks for. */
export function NextDoseChip({
  next,
  now,
  dose,
  units,
}: {
  next: NextDose
  now: Date
  dose: string
  units: number | null
}) {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const hours = (next.at.getTime() - now.getTime()) / 3_600_000
  const tone = next.status === 'overdue' ? 'danger' : next.status === 'due' ? 'warn' : 'neutral'
  const label =
    next.status === 'overdue'
      ? t('charts.next.overdue', { time: fmtHours(next.overdueH, locale) })
      : next.status === 'due'
        ? t('charts.next.due')
        : t('charts.next.in', { time: fmtHours(hours, locale) })
  return (
    <div className="shrink-0 text-right">
      <div className="spec">{t('charts.next.title')}</div>
      <Badge tone={tone} className="mt-1 text-[12px]">
        {label}
      </Badge>
      <div className="readout mt-1 text-[12px] text-muted">
        {dose}
        {units !== null && <span className="text-signal"> · {fmtNumber(units, locale, 1)} U</span>}
      </div>
    </div>
  )
}
