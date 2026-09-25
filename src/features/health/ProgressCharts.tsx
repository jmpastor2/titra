/**
 * Building blocks of the progress screens: the range picker, the protocol timeline strip
 * that shares the charts' time axis, change chips and the month-by-month table.
 */
import { clsx } from 'clsx'
import { addMonths, format } from 'date-fns'
import { enUS, es } from 'date-fns/locale'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { SubstanceDot } from '@/components/ui/primitives'
import { compoundColor } from '@/content/substanceColor'
import type { DoseUnit } from '@/domain/types'
import { fmtDate, fmtDose, fmtNumber } from '@/lib/format'
import { useLocale } from '@/lib/useLocale'
import {
  changeTone,
  dominantSegment,
  fmtSigned,
  fractionOf,
  monthDelta,
  type MonthMean,
  type ProgressRange,
  type ProtocolLane,
  type TimeWindow,
} from './progress'

const DOSE_UNITS: readonly DoseUnit[] = ['mg', 'mcg', 'iu', 'units', 'ml']

function asDoseUnit(unit: string): DoseUnit {
  return (DOSE_UNITS as readonly string[]).includes(unit) ? (unit as DoseUnit) : 'mg'
}

/* ------------------------------------------------------------ range picker */

const RANGES: ProgressRange[] = ['1m', '3m', '6m', 'cycle']

export function RangePicker({
  value,
  onChange,
  hasCycle,
}: {
  value: ProgressRange
  onChange: (r: ProgressRange) => void
  hasCycle: boolean
}) {
  const { t } = useTranslation()
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="spec">{t('charts.range.label')}</span>
      <div
        role="radiogroup"
        aria-label={t('charts.range.label')}
        className="inline-flex rounded-full border border-line bg-panel-2 p-0.5"
      >
        {RANGES.filter((r) => r !== 'cycle' || hasCycle).map((r) => {
          const active = r === value
          return (
            <button
              key={r}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(r)}
              className={clsx(
                'h-8 min-w-11 rounded-full px-3 font-mono text-[12px] font-semibold transition',
                active
                  ? 'bg-panel text-ink shadow-[inset_0_0_0_1px_var(--line-strong)]'
                  : 'text-muted hover:text-ink-2',
              )}
            >
              {t(`charts.range.${r}`)}
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------ timeline strip */

function segmentBackground(color: string, pause: boolean, doseMg: number, maxDoseMg: number) {
  if (pause) {
    return `repeating-linear-gradient(135deg, color-mix(in oklab, ${color} 55%, transparent) 0 2px, transparent 2px 5px)`
  }
  const share = maxDoseMg > 0 ? doseMg / maxDoseMg : 1
  return `color-mix(in oklab, ${color} ${Math.round(35 + 65 * share)}%, transparent)`
}

const NO_INSET = { left: 0, right: 0 }

/**
 * One lane per active protocol: its dose steps and pauses over the window. The bars are
 * inset like the chart's plot area so dose changes line up with the curves below.
 */
export function ProtocolStrip({
  lanes,
  span,
  inset = NO_INSET,
  showDates = false,
}: {
  lanes: readonly ProtocolLane[]
  span: TimeWindow
  inset?: { left: number; right: number }
  showDates?: boolean
}) {
  const { t } = useTranslation()
  const { locale } = useLocale()
  if (lanes.length === 0) {
    return <p className="text-[12.5px] text-muted">{t('charts.progress.noProtocols')}</p>
  }
  const pad = { paddingLeft: inset.left, paddingRight: inset.right }
  return (
    <div className="flex flex-col gap-2">
      {lanes.map((lane) => {
        const color = compoundColor(lane.compoundId)
        const unit = asDoseUnit(lane.unit)
        const current = lane.segments[lane.segments.length - 1]
        const label = (s: { pause: boolean; doseMg: number }) =>
          s.pause ? t('charts.pause') : fmtDose(s.doseMg, unit, locale)
        return (
          <div key={lane.id}>
            <div className="flex items-center justify-between gap-2 text-[11.5px]">
              <span className="flex min-w-0 items-center gap-1.5">
                <SubstanceDot color={color} />
                <span className="truncate font-semibold text-ink-2">{lane.name}</span>
              </span>
              {current && (
                <span className="readout shrink-0 text-[11px] text-muted">{label(current)}</span>
              )}
            </div>
            <div style={pad}>
              <div className="relative mt-1 h-[6px]" aria-hidden>
                {lane.segments.map((s) => {
                  const left = fractionOf(s.start, span) * 100
                  const width = fractionOf(s.end, span) * 100 - left
                  return (
                    <span
                      key={`${s.index}-${s.start.getTime()}`}
                      className="absolute inset-y-0 rounded-full"
                      style={{
                        left: `calc(${left}% + 1px)`,
                        width: `max(2px, calc(${width}% - 2px))`,
                        background: segmentBackground(color, s.pause, s.doseMg, lane.maxDoseMg),
                      }}
                    />
                  )
                })}
              </div>
              <div className="relative mt-0.5 h-3">
                {lane.segments.map((s) => {
                  const left = fractionOf(s.start, span) * 100
                  const width = fractionOf(s.end, span) * 100 - left
                  if (width < 14) return null
                  return (
                    <span
                      key={`l${s.index}-${s.start.getTime()}`}
                      className="absolute top-0 truncate text-center font-mono text-[9.5px] leading-3 text-muted"
                      style={{ left: `${left}%`, width: `${width}%` }}
                    >
                      {label(s)}
                    </span>
                  )
                })}
              </div>
            </div>
            <span className="sr-only">
              {lane.segments
                .map((s) => `${fmtDate(s.start, locale, 'd MMM')}: ${label(s)}`)
                .join(' · ')}
            </span>
          </div>
        )
      })}
      {showDates && (
        <div
          className="flex justify-between font-mono text-[9.5px] uppercase tracking-[0.08em] text-muted"
          style={pad}
        >
          <span>{fmtDate(span.from, locale, 'd MMM')}</span>
          <span>{t('common.today')}</span>
        </div>
      )}
    </div>
  )
}

/* ------------------------------------------------------------ change readouts */

const TONE_CLASS = { good: 'text-ok', bad: 'text-danger', neutral: 'text-ink-2' } as const

/** "Energía ▲ +2,1" — arrow + sign + tone, so the change never relies on colour alone. */
export function ChangeValue({
  kind,
  delta,
  digits,
  unit,
  threshold,
  className,
}: {
  kind: string
  delta: number
  digits: number
  unit?: string
  threshold: number
  className?: string
}) {
  const { locale } = useLocale()
  const tone = changeTone(kind, delta, threshold)
  const flat = Math.abs(delta) < threshold
  return (
    <span className={clsx('readout whitespace-nowrap font-semibold', TONE_CLASS[tone], className)}>
      {flat ? '=' : delta > 0 ? '▲' : '▼'} {fmtSigned(delta, locale, digits)}
      {unit && <span className="ml-0.5 text-[0.85em] font-medium text-muted">{unit}</span>}
    </span>
  )
}

/* ------------------------------------------------------------ monthly table */

export interface MonthRow {
  kind: string
  label: ReactNode
  months: MonthMean[]
  digits: number
  unit?: string
  /** Scores on a fixed 0–max scale get a sequential tint per cell. */
  scaleMax?: number
  threshold: number
}

/**
 * Month-by-month means with the dose each protocol ran that month, so a step up or a
 * pause can be read against the change in each metric. Scrolls sideways past 4 months.
 */
export function MonthTable({
  rows,
  lanes,
  maxMonths = 6,
}: {
  rows: readonly MonthRow[]
  lanes: readonly ProtocolLane[]
  maxMonths?: number
}) {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const dfl = locale === 'es' ? es : enUS
  const months = (rows[0]?.months ?? []).slice(-maxMonths)
  if (months.length === 0) return null
  const cut = (m: MonthMean[]) => m.slice(-maxMonths)

  return (
    <div className="hide-scrollbar -mx-3.5 overflow-x-auto px-3.5">
      <table className="w-full min-w-max border-separate border-spacing-0 text-[12px]">
        <thead>
          <tr>
            <th className="spec sticky left-0 z-10 bg-panel pb-1.5 pr-2 text-left font-semibold">
              {t('charts.progress.month')}
            </th>
            {months.map((m) => (
              <th
                key={m.month.getTime()}
                className="spec min-w-12 pb-1.5 text-right font-semibold"
                scope="col"
              >
                {format(m.month, 'MMM', { locale: dfl })}
              </th>
            ))}
            <th className="spec min-w-14 pb-1.5 pl-2 text-right font-semibold" scope="col">
              Δ
            </th>
          </tr>
        </thead>
        <tbody>
          {lanes.map((lane) => {
            const unit = asDoseUnit(lane.unit)
            return (
              <tr key={lane.id}>
                <th
                  scope="row"
                  className="sticky left-0 z-10 bg-panel py-1 pr-2 text-left font-normal"
                >
                  <span className="flex w-24 min-w-0 items-center gap-1.5 text-[11px] text-muted">
                    <SubstanceDot color={compoundColor(lane.compoundId)} size={6} />
                    <span className="truncate">{lane.name}</span>
                  </span>
                </th>
                {months.map((m) => {
                  const seg = dominantSegment(lane, m.month, addMonths(m.month, 1))
                  return (
                    <td
                      key={m.month.getTime()}
                      className="readout py-1 text-right text-[10.5px] text-muted"
                    >
                      {seg
                        ? seg.pause
                          ? t('charts.pause')
                          : fmtDose(seg.doseMg, unit, locale)
                        : '—'}
                    </td>
                  )
                })}
                <td />
              </tr>
            )
          })}
          {rows.map((r, i) => {
            const ms = cut(r.months)
            const delta = monthDelta(ms)
            return (
              <tr key={r.kind}>
                <th
                  scope="row"
                  className={clsx(
                    'sticky left-0 z-10 bg-panel py-1.5 pr-2 text-left font-medium text-ink-2',
                    i === 0 && lanes.length > 0 && 'border-t border-line',
                  )}
                >
                  <span className="line-clamp-2 block w-24 leading-tight">{r.label}</span>
                </th>
                {ms.map((m) => (
                  <td
                    key={m.month.getTime()}
                    className={clsx(
                      'readout py-1.5 text-right',
                      i === 0 && lanes.length > 0 && 'border-t border-line',
                    )}
                  >
                    {m.mean === null ? (
                      <span className="text-muted">—</span>
                    ) : (
                      <span
                        className="inline-block rounded-md px-1 text-ink"
                        style={
                          r.scaleMax
                            ? {
                                background: `color-mix(in oklab, var(--signal) ${Math.round(
                                  (Math.min(r.scaleMax, Math.max(0, m.mean)) / r.scaleMax) * 26,
                                )}%, transparent)`,
                              }
                            : undefined
                        }
                      >
                        {fmtNumber(m.mean, locale, r.digits)}
                      </span>
                    )}
                  </td>
                ))}
                <td
                  className={clsx(
                    'py-1.5 pl-2 text-right text-[11.5px]',
                    i === 0 && lanes.length > 0 && 'border-t border-line',
                  )}
                >
                  {delta === null ? (
                    <span className="text-muted">—</span>
                  ) : (
                    <ChangeValue
                      kind={r.kind}
                      delta={delta}
                      digits={r.digits}
                      threshold={r.threshold}
                    />
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
