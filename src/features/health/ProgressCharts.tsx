/**
 * Building blocks of the progress screens: the range picker, the protocol timeline strip
 * that shares the charts' time axis, change chips and the month-by-month table.
 */
import { clsx } from 'clsx'
import { addMonths, format } from 'date-fns'
import { ArrowDownRight, ArrowRight, ArrowUpRight } from 'lucide-react'
import { enUS, es } from 'date-fns/locale'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { SubstanceDot } from '@/components/ui/primitives'
import { compoundColor } from '@/content/substanceColor'
import { fmtDate, fmtDose } from '@/lib/format'
import { fmtFixed } from '@/features/quicklog/text'
import { useLocale } from '@/lib/useLocale'
import {
  asDoseUnit,
  changeTone,
  dominantSegment,
  fmtSigned,
  fmtSignedFixed,
  fractionOf,
  monthDelta,
  type MonthMean,
  type ProgressRange,
  type ProtocolLane,
  type TimeWindow,
} from './progress'

/* ------------------------------------------------------------ range picker */

const RANGES: ProgressRange[] = ['1m', '3m', '6m', 'cycle']

export function RangePicker({
  value,
  onChange,
  hasCycle,
  from,
}: {
  value: ProgressRange
  onChange: (r: ProgressRange) => void
  hasCycle: boolean
  /** Where the range on screen begins, said under the label. */
  from: Date
}) {
  const { t } = useTranslation()
  const { locale } = useLocale()
  return (
    <div
      role="radiogroup"
      aria-label={`${t('charts.range.label')}: ${t('charts.range.span', {
        from: fmtDate(from, locale, 'd MMM'),
      })}`}
      className="flex w-full items-stretch gap-1"
    >
      {RANGES.filter((r) => r !== 'cycle' || hasCycle).map((r) => {
        const active = r === value
        return (
          // The button is a 44 px target; the pill inside is smaller.
          <button
            key={r}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(r)}
            className="group flex min-h-11 min-w-0 flex-1 items-center justify-center outline-none"
          >
            <span
              className={clsx(
                'flex h-8 w-full min-w-0 items-center justify-center whitespace-nowrap rounded-full px-2 text-[13px] font-semibold transition group-focus-visible:ring-2 group-focus-visible:ring-signal/60',
                active ? 'bg-panel-3 text-ink' : 'text-muted group-hover:text-ink-2',
              )}
            >
              {t(`charts.range.${r}`)}
            </span>
          </button>
        )
      })}
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
              <span className="flex min-w-0 items-start gap-1.5">
                <span className="mt-[4px] flex">
                  <SubstanceDot color={color} />
                </span>
                <span className="font-semibold leading-snug text-ink-2">{lane.name}</span>
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
                      className="readout absolute top-0 overflow-hidden whitespace-nowrap text-center text-[10.5px] leading-3 text-muted"
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
        <div className="readout flex justify-between text-[11px] text-muted" style={pad}>
          <span>{fmtDate(span.from, locale, 'd MMM')}</span>
          <span>{t('common.today')}</span>
        </div>
      )}
    </div>
  )
}

/* ------------------------------------------------------------ change readouts */

/** Good news in the accent, a change for the worse in amber: never red and green. */
const TONE_CLASS = { good: 'text-signal', bad: 'text-warn', neutral: 'text-ink-2' } as const

/** "Energía ↗ +2,1": arrow + sign + tone, so the change never relies on colour alone. */
export function ChangeValue({
  kind,
  delta,
  digits,
  unit,
  threshold,
  trim = false,
  className,
}: {
  kind: string
  delta: number
  digits: number
  unit?: string
  threshold: number
  /** Drop the trailing zeros ("+2", "+1,5"): for scores, which move in whole points or halves. */
  trim?: boolean
  className?: string
}) {
  const { locale } = useLocale()
  const flat = Math.abs(delta) < threshold
  const text = trim ? fmtSigned(delta, locale, digits) : fmtSignedFixed(delta, locale, digits)
  const Icon = flat ? ArrowRight : delta > 0 ? ArrowUpRight : ArrowDownRight
  return (
    <span
      className={clsx(
        'readout whitespace-nowrap font-semibold',
        TONE_CLASS[changeTone(kind, delta, threshold)],
        className,
      )}
    >
      <Icon
        className="mr-0.5 inline-block size-[1.05em] align-[-0.15em]"
        strokeWidth={2.4}
        aria-hidden
      />
      {text}
      {unit && <span className="ml-1 text-[0.85em] font-medium text-muted">{unit}</span>}
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
                  <span className="flex w-28 min-w-0 items-center gap-1.5 text-[11px] leading-tight text-muted">
                    <SubstanceDot color={compoundColor(lane.compoundId)} size={6} />
                    <span className="line-clamp-2">{lane.name}</span>
                  </span>
                </th>
                {months.map((m) => {
                  const seg = dominantSegment(lane, m.month, addMonths(m.month, 1))
                  return (
                    <td
                      key={m.month.getTime()}
                      className="readout py-1 text-right text-[11px] text-muted"
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
                  <span className="line-clamp-2 block w-28 leading-tight">{r.label}</span>
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
                        {fmtFixed(m.mean, locale, r.digits)}
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
