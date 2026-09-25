/**
 * "Futuro": what each substance in the active protocols could mean over the next
 * 3 / 6 / 12 months, told honestly. Trial-backed compounds show the band a published
 * trial observed for the arms that bracket the user's dose; everything else says there
 * are no human outcome data and lists what to measure. The user's own weight trend is
 * drawn forward next to the trial band, always flagged as an extrapolation.
 */
import { parseISO, startOfDay } from 'date-fns'
import { ChevronRight, FlaskConical, Scale, Telescope } from 'lucide-react'
import { useMemo, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  XAxis,
  YAxis,
} from 'recharts'
import { usePatientScope } from '@/app/scope'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import {
  Badge,
  EmptyState,
  SectionTitle,
  Segmented,
  Skeleton,
  SubstanceDot,
} from '@/components/ui/primitives'
import { compoundById, compoundName } from '@/content/compounds'
import {
  outlookFor,
  type CompoundOutlook,
  type MeasureItem,
  type TrialOutlook,
  type WeightTrialReference,
} from '@/content/outlook'
import { t as l10n, type L10n } from '@/content/schema'
import { compoundColor } from '@/content/substanceColor'
import type { MeasurementKind, MeasurementRow, ProtocolRow } from '@/data/database.types'
import { useMeasurements, useProtocols } from '@/data/hooks'
import { protocolCompoundIds, toProtocolLike } from '@/data/mappers'
import type { DoseUnit, ProtocolLike } from '@/domain/types'
import { CheckInSheet } from '@/features/checkin/CheckInSheet'
import { AddLabSheet } from '@/features/health/AddLabSheet'
import { LogMeasurementSheet } from '@/features/health/LogMeasurementSheet'
import { cycleStart, fmtSigned } from '@/features/health/progress'
import { fmtDate, fmtDose, fmtNumber } from '@/lib/format'
import { useLocale } from '@/lib/useLocale'
import { useNow } from '@/lib/useNow'
import {
  asCompoundProtocol,
  bandInKg,
  bandSeries,
  chartWeeks,
  HORIZONS,
  horizonDate,
  isProjection,
  MAX_EXTRAPOLATION_RATIO,
  MIN_TREND_POINTS,
  MIN_TREND_SPAN_DAYS,
  personalTrend,
  projectTrend,
  referenceForHorizon,
  treatmentWeeks,
  trendOnTreatmentAxis,
  weightPoints,
  type BandPoint,
  type Horizon,
  type HorizonReference,
  type NoProjection,
  type PersonalTrend,
  type Projection,
  type WeightPoint,
} from './outlook'

/* ------------------------------------------------------------------ model */

interface TrialPart {
  compoundId: string
  outlook: TrialOutlook
  like: ProtocolLike
  ref: HorizonReference
  series: BandPoint[]
  todayWeeks: number
}

interface ProtocolOutlook {
  row: ProtocolRow
  like: ProtocolLike
  title: string
  compoundIds: string[]
  since: Date
  /** First trial-backed compound of the protocol, if any. */
  trial: TrialPart | null
  /** Every other compound, with its outlook entry when the app has one. */
  others: { compoundId: string; outlook: CompoundOutlook | undefined }[]
  measure: MeasureItem[]
}

function buildModel(protocols: readonly ProtocolRow[], now: Date, horizon: Horizon) {
  const active = protocols
    .filter((p) => p.status === 'active')
    .toSorted((a, b) => a.start_date.localeCompare(b.start_date))

  const items = active.flatMap((row): ProtocolOutlook[] => {
    const like = toProtocolLike(row)
    if (like.steps.length === 0) return []
    const compoundIds = protocolCompoundIds(row)
    const since = startOfDay(parseISO(row.start_date))
    let trial: TrialPart | null = null
    const others: ProtocolOutlook['others'] = []
    for (const id of compoundIds) {
      const outlook = outlookFor(id)
      const view: ProtocolLike | null =
        outlook?.kind === 'trial' && !trial ? asCompoundProtocol(like, id) : null
      if (outlook?.kind === 'trial' && view) {
        const ref = referenceForHorizon(view, outlook.reference, now, horizon)
        trial = {
          compoundId: id,
          outlook,
          like: view,
          ref,
          series: ref.doseMg === null ? [] : bandSeries(outlook.reference, ref.doseMg),
          todayWeeks: treatmentWeeks(view, now),
        }
      } else {
        others.push({ compoundId: id, outlook })
      }
    }
    const measure = dedupe([
      ...(trial?.outlook.measure ?? []),
      ...others.flatMap((o) => o.outlook?.measure ?? wikiMonitoring(o.compoundId)),
    ])
    const names = compoundIds.map(compoundName).join(' + ')
    const title = compoundIds.length > 1 ? row.name.trim() || names : names
    return [{ row, like, title, compoundIds, since, trial, others, measure }]
  })

  return {
    items,
    trialItems: items.filter((i) => i.trial),
    otherItems: items.filter((i) => !i.trial),
    cycle: cycleStart(active),
  }
}

function dedupe(items: readonly MeasureItem[]): MeasureItem[] {
  const seen = new Set<string>()
  return items.filter((m) => (seen.has(m.id) ? false : (seen.add(m.id), true)))
}

/** Compounds this section does not cover yet fall back to the wiki's monitoring list. */
function wikiMonitoring(compoundId: string): MeasureItem[] {
  return (compoundById(compoundId)?.monitoring ?? []).map((label, i) => ({
    id: `${compoundId}-monitoring-${i}`,
    label,
    target: { type: 'note' },
  }))
}

/* ------------------------------------------------------------------ formatting */

const LB_PER_KG = 1 / 0.45359237
const DOSE_UNITS: readonly DoseUnit[] = ['mg', 'mcg', 'iu', 'units', 'ml']

function asDoseUnit(unit: string): DoseUnit {
  return (DOSE_UNITS as readonly string[]).includes(unit) ? (unit as DoseUnit) : 'mg'
}

function useFormat() {
  const { t } = useTranslation()
  const { locale, pick } = useLocale()
  const { patient } = usePatientScope()
  const imperial = patient?.unit_system === 'imperial'
  const pctSign = locale === 'es' ? ' %' : '%'
  const weightUnit = imperial ? 'lb' : 'kg'
  const toUnit = (kg: number) => (imperial ? kg * LB_PER_KG : kg)
  return {
    t,
    locale,
    pick,
    pct: (v: number, digits = 1) => `${fmtSigned(v, locale, digits)}${pctSign}`,
    weight: (kg: number) => `${fmtNumber(toUnit(kg), locale, 1)} ${weightUnit}`,
    weightDelta: (kg: number) => `${fmtSigned(toUnit(kg), locale, 1)} ${weightUnit}`,
    range: (a: string, b: string) => (a === b ? a : t('outlook.range', { a, b })),
    date: (d: Date) => fmtDate(d, locale, 'd MMM yyyy'),
  }
}

type Fmt = ReturnType<typeof useFormat>

/** "−7 % a −13 %", rounded for headlines, exact in details. */
function bandText(f: Fmt, lower: number, upper: number, digits: number) {
  return f.range(f.pct(lower, digits), f.pct(upper, digits))
}

/* ------------------------------------------------------------------ page */

type SheetState =
  { kind: 'measure'; measure: MeasurementKind } | { kind: 'checkin' } | { kind: 'lab' } | null

export function OutlookPage() {
  const f = useFormat()
  const { t } = f
  const { patientId, readOnly } = usePatientScope()
  const protocols = useProtocols(patientId)
  const measurements = useMeasurements(patientId, 730)
  const now = useNow()
  const [horizon, setHorizon] = useState<Horizon>(6)
  const [sheet, setSheet] = useState<SheetState>(null)

  const model = useMemo(
    () => buildModel(protocols.data ?? [], now, horizon),
    [protocols.data, now, horizon],
  )
  const rows = useMemo(() => measurements.data ?? [], [measurements.data])
  const weights = useMemo(() => weightPoints(rows), [rows])

  const pick = (m: MeasureItem) => {
    if (readOnly) return
    if (m.target.type === 'measurement') setSheet({ kind: 'measure', measure: m.target.kind })
    else if (m.target.type === 'checkin') setSheet({ kind: 'checkin' })
    else if (m.target.type === 'lab') setSheet({ kind: 'lab' })
  }
  const logWeight = () => setSheet({ kind: 'measure', measure: 'weight' })

  // The personal KPI is measured from the cycle start when no trial card carries it.
  const cycleTrend = model.cycle ? personalTrend(weights, model.cycle, now) : null
  const headlineTrend = model.trialItems[0]
    ? personalTrend(weights, model.trialItems[0].since, now)
    : cycleTrend

  let section = 0
  const nextIndex = () => String(++section).padStart(2, '0')
  const loading = protocols.isPending || measurements.isPending

  return (
    <div className="flex flex-col gap-5 pb-2">
      <PageHeader eyebrow={t('outlook.eyebrow')} title={t('outlook.title')} back="/more" />

      {loading ? (
        <Card>
          <Skeleton className="h-40 w-full" />
        </Card>
      ) : model.items.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Telescope className="size-6" />}
            title={t('outlook.empty.title')}
            description={t('outlook.empty.body')}
            action={
              !readOnly && (
                <Link to="/protocols/new">
                  <Button size="sm">{t('outlook.empty.action')}</Button>
                </Link>
              )
            }
          />
        </Card>
      ) : (
        <>
          <Headline
            f={f}
            horizon={horizon}
            onHorizon={setHorizon}
            now={now}
            trials={model.trialItems}
            trend={headlineTrend}
          />

          {model.trialItems.length > 0 && (
            <section className="flex flex-col gap-3">
              <SectionTitle index={nextIndex()}>{t('outlook.section.trial')}</SectionTitle>
              {model.trialItems.map((item) => (
                <TrialCard
                  key={item.row.id}
                  f={f}
                  item={item}
                  horizon={horizon}
                  now={now}
                  weights={weights}
                  rows={rows}
                  readOnly={readOnly}
                  onLogWeight={logWeight}
                  onPick={pick}
                />
              ))}
            </section>
          )}

          {model.trialItems.length === 0 && (
            <section>
              <SectionTitle index={nextIndex()}>{t('outlook.section.you')}</SectionTitle>
              <Card>
                <PersonalBlock
                  f={f}
                  trend={cycleTrend}
                  horizon={horizon}
                  now={now}
                  readOnly={readOnly}
                  onLogWeight={logWeight}
                />
              </Card>
            </section>
          )}

          {model.otherItems.length > 0 && (
            <section className="flex flex-col gap-3">
              <SectionTitle index={nextIndex()}>{t('outlook.section.noData')}</SectionTitle>
              {model.otherItems.map((item) => (
                <NoDataCard
                  key={item.row.id}
                  f={f}
                  item={item}
                  now={now}
                  rows={rows}
                  readOnly={readOnly}
                  onPick={pick}
                />
              ))}
            </section>
          )}
        </>
      )}

      <Card tone="warn" className="text-[12.5px] leading-relaxed text-ink-2">
        <div className="spec mb-1 text-warn">{t('outlook.disclaimer.title')}</div>
        <p>{t('outlook.disclaimer.body')}</p>
      </Card>

      <LogMeasurementSheet
        key={sheet?.kind === 'measure' ? sheet.measure : 'closed'}
        open={sheet?.kind === 'measure'}
        onClose={() => setSheet(null)}
        defaultKind={sheet?.kind === 'measure' ? sheet.measure : 'weight'}
      />
      <CheckInSheet open={sheet?.kind === 'checkin'} onClose={() => setSheet(null)} />
      <AddLabSheet open={sheet?.kind === 'lab'} onClose={() => setSheet(null)} />
    </div>
  )
}

/* ------------------------------------------------------------------ headline */

function HorizonPicker({
  f,
  value,
  onChange,
}: {
  f: Fmt
  value: Horizon
  onChange: (h: Horizon) => void
}) {
  return (
    <Segmented<string>
      size="sm"
      value={String(value)}
      onChange={(v) => onChange(Number(v) as Horizon)}
      options={HORIZONS.map((h) => ({
        value: String(h),
        label: f.t('outlook.horizon.months', { n: h }),
      }))}
    />
  )
}

function Headline({
  f,
  horizon,
  onHorizon,
  now,
  trials,
  trend,
}: {
  f: Fmt
  horizon: Horizon
  onHorizon: (h: Horizon) => void
  now: Date
  trials: readonly ProtocolOutlook[]
  trend: PersonalTrend | null
}) {
  const { t } = f
  const first = trials[0]?.trial
  const target = first?.ref.targetDate ?? horizonDate(now, horizon)
  const projection = projectTrend(trend, target)
  return (
    <Card instrument className="p-5">
      <HorizonPicker f={f} value={horizon} onChange={onHorizon} />
      <div className="spec mt-4">
        {t('outlook.headline.in', { n: horizon })} · {f.date(target)}
      </div>
      <div className="mt-2 flex flex-col gap-3">
        {trials.map((item) => (
          <HeadlineTrial key={item.row.id} f={f} item={item} />
        ))}
        <div className="flex items-baseline justify-between gap-3 border-t border-line pt-3">
          <span className="text-[13px] font-semibold text-ink-2">{t('outlook.headline.you')}</span>
          {isProjection(projection) ? (
            <span className="text-right">
              <span className="readout text-[20px] font-semibold text-ink">
                {f.weightDelta(projection.deltaKg)}
              </span>
              <span className="readout ml-1.5 text-[12px] text-muted">
                {f.pct(projection.deltaPct)}
              </span>
            </span>
          ) : (
            <span className="text-right text-[12.5px] text-muted">
              {t(`outlook.personal.short.${projection.none}`)}
            </span>
          )}
        </div>
        {isProjection(projection) && (
          <p className="-mt-2 text-[11.5px] text-muted">
            {t('outlook.personal.extrapolationNote')}
            {projection.reliability === 'weak' && ` ${t('outlook.personal.weak')}`}
          </p>
        )}
      </div>
    </Card>
  )
}

function HeadlineTrial({ f, item }: { f: Fmt; item: ProtocolOutlook }) {
  const { t } = f
  const trial = item.trial!
  const { band, next, timepoint } = trial.ref
  const color = compoundColor(trial.compoundId)
  const name = compoundName(trial.compoundId)
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <span className="flex min-w-0 items-center gap-1.5">
          <SubstanceDot color={color} />
          <span className="truncate text-[15px] font-semibold">{name}</span>
        </span>
        {band ? (
          <span className="readout shrink-0 text-[22px] font-semibold text-glow">
            {bandText(f, band.lowerPct, band.upperPct, 0)}
          </span>
        ) : (
          <span className="shrink-0 text-[12.5px] text-muted">{t('outlook.band.noneShort')}</span>
        )}
      </div>
      <p className="mt-0.5 text-[12px] text-muted">
        {band && timepoint
          ? t('outlook.headline.bandNote', { week: timepoint.week })
          : next
            ? t('outlook.band.firstAt', {
                week: next.timepoint.week,
                date: next.date ? f.date(next.date) : '—',
              })
            : t('outlook.band.none')}
      </p>
    </div>
  )
}

/* ------------------------------------------------------------------ trial card */

function TrialCard({
  f,
  item,
  horizon,
  now,
  weights,
  rows,
  readOnly,
  onLogWeight,
  onPick,
}: {
  f: Fmt
  item: ProtocolOutlook
  horizon: Horizon
  now: Date
  weights: readonly WeightPoint[]
  rows: readonly MeasurementRow[]
  readOnly: boolean
  onLogWeight: () => void
  onPick: (m: MeasureItem) => void
}) {
  const { t, pick } = f
  const trial = item.trial!
  const { ref, outlook } = trial
  const reference = outlook.reference
  const color = compoundColor(trial.compoundId)
  const unit = asDoseUnit(item.row.unit)
  const trend = personalTrend(weights, item.since, now)
  const projection = projectTrend(trend, ref.targetDate)
  const band = ref.band
  const weightForBand = trend?.baseline.kg ?? null

  return (
    <Card className="p-4" style={{ borderColor: `color-mix(in oklab, ${color} 30%, var(--line))` }}>
      <ProtocolTitle
        f={f}
        title={item.title}
        compoundIds={item.compoundIds}
        eyebrow={`${reference.trial} · ${reference.year}`}
      />
      <p className="mt-2 text-[13px] leading-relaxed text-ink-2">{pick(outlook.summary)}</p>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="rounded-[14px] border border-line bg-panel-2 p-3">
          <div className="spec">{t('outlook.band.label')}</div>
          {band ? (
            <>
              <div className="readout mt-1.5 text-[17px] font-semibold leading-tight">
                {bandText(f, band.lowerPct, band.upperPct, 1)}
              </div>
              <div className="mt-1 text-[11.5px] text-muted">
                {t('outlook.band.at', { week: band.week })}
              </div>
              {weightForBand !== null && (
                <div className="readout mt-1.5 text-[11.5px] text-ink-2">
                  {(() => {
                    const kg = bandInKg(weightForBand, band)
                    return f.range(f.weightDelta(kg.lowerKg), f.weightDelta(kg.upperKg))
                  })()}
                </div>
              )}
            </>
          ) : (
            <>
              <div className="mt-1.5 text-[13px] font-semibold">{t('outlook.band.noneShort')}</div>
              <div className="mt-1 text-[11.5px] text-muted">
                {ref.next
                  ? t('outlook.band.firstAt', {
                      week: ref.next.timepoint.week,
                      date: ref.next.date ? f.date(ref.next.date) : '—',
                    })
                  : t('outlook.band.none')}
              </div>
            </>
          )}
        </div>
        <div className="rounded-[14px] border border-line bg-panel-2 p-3">
          <div className="spec">{t('outlook.personal.label')}</div>
          <PersonalReadout f={f} trend={trend} projection={projection} />
        </div>
      </div>

      {band && ref.doseMg !== null && (
        <p className="mt-3 text-[12.5px] leading-relaxed text-ink-2">
          {t(`outlook.position.${band.position}`, {
            dose: fmtDose(ref.doseMg, unit, f.locale),
            lower: fmtDose(band.lowerDoseMg, 'mg', f.locale),
            upper: fmtDose(band.upperDoseMg, 'mg', f.locale),
          })}
          {weightForBand !== null && (
            <> {t('outlook.band.withWeight', { weight: f.weight(weightForBand) })}</>
          )}
        </p>
      )}

      {!trend && !readOnly && (
        <div className="mt-3 flex items-center gap-3 rounded-[14px] border border-dashed border-line-strong p-3">
          <Scale className="size-5 shrink-0 text-signal" />
          <p className="min-w-0 flex-1 text-[12.5px] text-ink-2">
            {t('outlook.personal.askWeight')}
          </p>
          <Button size="sm" variant="soft" onClick={onLogWeight}>
            {t('outlook.personal.logWeight')}
          </Button>
        </div>
      )}

      {trial.series.length > 1 && (
        <div className="mt-4">
          <OutlookChart
            f={f}
            color={color}
            series={trial.series}
            todayWeeks={trial.todayWeeks}
            targetWeeks={ref.weeksAtTarget}
            horizon={horizon}
            me={trend ? trendOnTreatmentAxis(trend, trial.like) : []}
            projection={
              trend && isProjection(projection)
                ? [
                    {
                      week: treatmentWeeks(trial.like, trend.latest.at),
                      pct: trend.changePct,
                    },
                    { week: ref.weeksAtTarget, pct: projection.deltaPct },
                  ]
                : []
            }
          />
        </div>
      )}

      <TrialDetails
        f={f}
        reference={reference}
        lowerMg={band?.lowerDoseMg}
        upperMg={band?.upperDoseMg}
        color={color}
      />

      <ul className="mt-3 flex flex-col gap-1.5">
        {outlook.caveats.map((c) => (
          <li key={c.en} className="flex gap-2 text-[12px] leading-relaxed text-muted">
            <span aria-hidden className="mt-[7px] size-1 shrink-0 rounded-full bg-muted" />
            {pick(c)}
          </li>
        ))}
      </ul>

      <MeasureList
        f={f}
        items={item.measure}
        rows={rows}
        since={item.since}
        readOnly={readOnly}
        onPick={onPick}
      />
    </Card>
  )
}

function ProtocolTitle({
  f,
  title,
  compoundIds,
  eyebrow,
}: {
  f: Fmt
  title: string
  compoundIds: readonly string[]
  eyebrow: ReactNode
}) {
  return (
    <header>
      <div className="spec">{eyebrow}</div>
      <div className="mt-1 flex items-center gap-2">
        <span className="flex items-center gap-1">
          {compoundIds.map((id) => (
            <SubstanceDot key={id} color={compoundColor(id)} />
          ))}
        </span>
        <h2 className="min-w-0 truncate font-display text-[18px] font-semibold">{title}</h2>
      </div>
      <span className="sr-only">
        {f.t('outlook.compounds', { names: compoundIds.map(compoundName).join(', ') })}
      </span>
    </header>
  )
}

/* ------------------------------------------------------------------ personal KPI */

function PersonalReadout({
  f,
  trend,
  projection,
}: {
  f: Fmt
  trend: PersonalTrend | null
  projection: Projection | { none: NoProjection }
}) {
  const { t } = f
  if (isProjection(projection)) {
    return (
      <>
        <div className="readout mt-1.5 text-[17px] font-semibold leading-tight">
          {f.weightDelta(projection.deltaKg)}
        </div>
        <div className="readout mt-1 text-[11.5px] text-muted">
          {f.pct(projection.deltaPct)} · ≈ {f.weight(projection.kg)}
        </div>
        <div className="mt-1.5 flex flex-wrap gap-1">
          <Badge tone={projection.reliability === 'weak' ? 'warn' : 'neutral'}>
            {projection.reliability === 'weak'
              ? t('outlook.personal.badgeWeak')
              : t('outlook.personal.badge')}
          </Badge>
        </div>
      </>
    )
  }
  return (
    <>
      <div className="mt-1.5 text-[13px] font-semibold">
        {t(`outlook.personal.short.${projection.none}`)}
      </div>
      {trend && (
        <div className="readout mt-1 text-[11.5px] text-muted">
          {t('outlook.personal.soFar', {
            kg: f.weightDelta(trend.latest.kg - trend.baseline.kg),
            pct: f.pct(trend.changePct),
          })}
        </div>
      )}
      {projection.none === 'need_more' && (
        <div className="mt-1 text-[11.5px] text-muted">
          {t('outlook.personal.needMoreHint', { n: MIN_TREND_POINTS, days: MIN_TREND_SPAN_DAYS })}
        </div>
      )}
      {projection.none === 'too_far' && trend && (
        <div className="mt-1 text-[11.5px] text-muted">
          {t('outlook.personal.until', {
            date: f.date(
              new Date(
                trend.latest.at.getTime() +
                  (trend.latest.at.getTime() - trend.baseline.at.getTime()) *
                    MAX_EXTRAPOLATION_RATIO,
              ),
            ),
          })}
        </div>
      )}
    </>
  )
}

/** Standalone personal KPI when no protocol has a trial reference. */
function PersonalBlock({
  f,
  trend,
  horizon,
  now,
  readOnly,
  onLogWeight,
}: {
  f: Fmt
  trend: PersonalTrend | null
  horizon: Horizon
  now: Date
  readOnly: boolean
  onLogWeight: () => void
}) {
  const { t } = f
  const target = horizonDate(now, horizon)
  const projection = projectTrend(trend, target)
  if (!trend) {
    return (
      <EmptyState
        className="py-6"
        icon={<Scale className="size-6" />}
        title={t('outlook.personal.emptyTitle')}
        description={t('outlook.personal.askWeight')}
        action={
          !readOnly && (
            <Button size="sm" onClick={onLogWeight}>
              {t('outlook.personal.logWeight')}
            </Button>
          )
        }
      />
    )
  }
  return (
    <div>
      <div className="spec">{t('outlook.personal.label')}</div>
      <PersonalReadout f={f} trend={trend} projection={projection} />
      <p className="mt-2 text-[11.5px] text-muted">{t('outlook.personal.extrapolationNote')}</p>
    </div>
  )
}

/* ------------------------------------------------------------------ chart */

interface AxisPoint {
  week: number
  pct: number
}

const CHART_MARGIN = { top: 12, right: 12, bottom: 0, left: 0 }

function OutlookChart({
  f,
  color,
  series,
  todayWeeks,
  targetWeeks,
  horizon,
  me,
  projection,
}: {
  f: Fmt
  color: string
  series: readonly BandPoint[]
  todayWeeks: number
  targetWeeks: number
  horizon: Horizon
  me: readonly AxisPoint[]
  projection: readonly AxisPoint[]
}) {
  const { t, locale } = f
  const data = series.map((p) => ({
    week: p.week,
    range: [p.lowerPct, p.upperPct] as [number, number],
    lower: p.lowerPct,
    upper: p.upperPct,
    placebo: p.placeboPct,
  }))
  const observed = series.flatMap((p) =>
    p.observed
      ? [
          { week: p.week, pct: p.lowerPct },
          { week: p.week, pct: p.upperPct },
        ]
      : [],
  )
  const maxWeek = chartWeeks(
    series.at(-1)?.week ?? 48,
    targetWeeks,
    todayWeeks,
    ...me.map((p) => p.week),
  )
  const ticks = Array.from({ length: maxWeek / 12 + 1 }, (_, i) => i * 12)
  const values = [
    ...series.flatMap((p) => [p.lowerPct, p.upperPct]),
    ...me.map((p) => p.pct),
    ...projection.map((p) => p.pct),
    0,
  ]
  // Whole 5-point ticks, with headroom above zero for the "today" and horizon labels.
  const lo = Math.floor((Math.min(...values) - 1) / 5) * 5
  const top = Math.max(...values)
  const hi = top > 0 ? Math.ceil((top + 1) / 5) * 5 : 3
  const step = hi - lo > 30 ? 10 : 5
  const yTicks = Array.from(
    { length: Math.floor((Math.min(hi, 100) - lo) / step) + 1 },
    (_, i) => lo + i * step,
  )
  const summary = t('outlook.chart.summary', {
    today: fmtNumber(todayWeeks, locale, 0),
    week: series.at(-1)?.week ?? 0,
    band: bandText(f, series.at(-1)?.lowerPct ?? 0, series.at(-1)?.upperPct ?? 0, 1),
  })

  return (
    <figure>
      <div className="h-[200px]" role="img" aria-label={summary}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={CHART_MARGIN}>
            <CartesianGrid vertical={false} stroke="var(--line)" strokeDasharray="2 4" />
            <XAxis
              dataKey="week"
              type="number"
              domain={[0, maxWeek]}
              ticks={ticks}
              interval={0}
              tickFormatter={(v: number) => t('outlook.chart.weekTick', { n: v })}
              tick={{ fill: 'var(--muted)', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              domain={[lo, hi]}
              ticks={yTicks}
              tick={{ fill: 'var(--muted)', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: number) => `${fmtSigned(v, locale, 0)}`}
              width={34}
            />
            <ReferenceLine y={0} stroke="var(--line-strong)" />
            <Area
              dataKey="range"
              type="linear"
              stroke="none"
              fill={color}
              fillOpacity={0.18}
              isAnimationActive={false}
            />
            <Line
              dataKey="lower"
              type="linear"
              stroke={color}
              strokeWidth={1.5}
              strokeDasharray="4 3"
              dot={false}
              isAnimationActive={false}
            />
            <Line
              dataKey="upper"
              type="linear"
              stroke={color}
              strokeWidth={1.5}
              strokeDasharray="4 3"
              dot={false}
              isAnimationActive={false}
            />
            <Line
              dataKey="placebo"
              type="linear"
              stroke="var(--muted)"
              strokeWidth={1}
              strokeDasharray="2 3"
              dot={false}
              isAnimationActive={false}
            />
            <Scatter
              data={observed}
              dataKey="pct"
              fill={color}
              stroke="var(--panel)"
              strokeWidth={2}
              isAnimationActive={false}
            />
            {projection.length === 2 && (
              <Line
                data={[...projection]}
                dataKey="pct"
                type="linear"
                stroke="var(--ink-2)"
                strokeWidth={1.5}
                strokeDasharray="1 3"
                strokeLinecap="round"
                dot={false}
                isAnimationActive={false}
              />
            )}
            {me.length > 0 && (
              <Scatter
                data={[...me]}
                dataKey="pct"
                fill="var(--ink)"
                stroke="var(--panel)"
                strokeWidth={1.5}
                isAnimationActive={false}
              />
            )}
            <ReferenceLine
              x={Math.min(todayWeeks, maxWeek)}
              stroke="var(--signal)"
              strokeWidth={1.5}
              label={{
                value: t('outlook.chart.today'),
                position: 'insideTopRight',
                fill: 'var(--signal)',
                fontSize: 10,
              }}
            />
            {targetWeeks > todayWeeks && (
              <ReferenceLine
                x={Math.min(targetWeeks, maxWeek)}
                stroke="var(--ink-2)"
                strokeDasharray="3 3"
                label={{
                  value: t('outlook.horizon.months', { n: horizon }),
                  position: 'insideTopLeft',
                  fill: 'var(--ink-2)',
                  fontSize: 10,
                }}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <figcaption className="mt-2 flex flex-col gap-1 text-[11px] text-muted">
        <span className="flex flex-wrap gap-x-3 gap-y-1">
          <Legend
            swatch={
              <span
                className="h-2.5 w-4 rounded-sm"
                style={{ background: `color-mix(in oklab, ${color} 35%, transparent)` }}
              />
            }
          >
            {t('outlook.chart.band')}
          </Legend>
          <Legend swatch={<span className="w-4 border-t border-dashed border-muted" />}>
            {t('outlook.chart.placebo')}
          </Legend>
          {me.length > 0 && (
            <Legend swatch={<span className="size-2 rounded-full bg-ink" />}>
              {t('outlook.chart.you')}
            </Legend>
          )}
          {projection.length === 2 && (
            <Legend swatch={<span className="w-4 border-t-2 border-dotted border-ink-2" />}>
              {t('outlook.chart.projection')}
            </Legend>
          )}
        </span>
        <span>{t('outlook.chart.observedOnly')}</span>
      </figcaption>
    </figure>
  )
}

function Legend({ swatch, children }: { swatch: ReactNode; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span aria-hidden className="inline-flex w-4 items-center justify-center">
        {swatch}
      </span>
      {children}
    </span>
  )
}

/* ------------------------------------------------------------------ trial details */

function TrialDetails({
  f,
  reference,
  lowerMg,
  upperMg,
  color,
}: {
  f: Fmt
  reference: WeightTrialReference
  lowerMg: number | undefined
  upperMg: number | undefined
  color: string
}) {
  const { t, pick, locale } = f
  const tps = reference.timepoints.toSorted((a, b) => a.week - b.week)
  const doses = [...new Set(tps.flatMap((tp) => tp.arms.map((a) => a.doseMg)))].toSorted(
    (a, b) => a - b,
  )
  const rowsOut: { key: string; label: string; dose: number; values: (number | undefined)[] }[] = [
    {
      key: 'placebo',
      label: t('outlook.trial.placebo'),
      dose: 0,
      values: tps.map((tp) => tp.placeboPct),
    },
    ...doses.map((d) => ({
      key: String(d),
      label: fmtDose(d, 'mg', locale),
      dose: d,
      values: tps.map((tp) => tp.arms.find((a) => a.doseMg === d)?.meanPct),
    })),
  ]
  const noteIndex = (dose: number) => reference.armNotes.findIndex((n) => n.doseMg === dose) + 1
  const facts: [string, L10n | string][] = [
    [t('outlook.trial.population'), reference.population],
    [t('outlook.trial.regimen'), reference.regimen],
    [t('outlook.trial.outcome'), reference.outcome],
    [t('outlook.trial.source'), reference.source],
  ]
  return (
    <details className="group mt-4 rounded-[14px] border border-line bg-panel-2">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-3 py-2.5 text-[13px] font-semibold text-ink-2">
        <span className="flex items-center gap-2">
          <FlaskConical className="size-4 text-muted" />
          {t('outlook.trial.open')}
        </span>
        <ChevronRight className="size-4 text-muted transition group-open:rotate-90" />
      </summary>
      <div className="border-t border-line px-3 pb-3 pt-2.5">
        <div className="text-[13px] font-semibold">
          {reference.trial} · {reference.year}
        </div>
        <dl className="mt-2 flex flex-col gap-1.5 text-[12px]">
          {facts.map(([k, v]) => (
            <div key={k}>
              <dt className="spec">{k}</dt>
              <dd className="text-ink-2">{typeof v === 'string' ? v : pick(v)}</dd>
            </div>
          ))}
        </dl>
        <table className="mt-3 w-full border-separate border-spacing-0 text-[12px]">
          <thead>
            <tr>
              <th className="spec pb-1 text-left font-semibold" scope="col">
                {t('outlook.trial.arm')}
              </th>
              {tps.map((tp) => (
                <th key={tp.week} className="spec pb-1 text-right font-semibold" scope="col">
                  {t('outlook.trial.weekCol', { n: tp.week })}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rowsOut.map((r) => {
              const bracket =
                lowerMg !== undefined &&
                upperMg !== undefined &&
                (r.dose === lowerMg || r.dose === upperMg)
              return (
                <tr
                  key={r.key}
                  style={
                    bracket
                      ? { background: `color-mix(in oklab, ${color} 14%, transparent)` }
                      : undefined
                  }
                >
                  <th
                    scope="row"
                    className="rounded-l-md py-1 pl-1 text-left font-medium text-ink-2"
                  >
                    {r.label}
                    {noteIndex(r.dose) > 0 && (
                      <span className="text-muted">{'*'.repeat(noteIndex(r.dose))}</span>
                    )}
                  </th>
                  {r.values.map((v, i) => (
                    <td
                      key={tps[i]?.week ?? i}
                      className="readout py-1 pr-1 text-right last:rounded-r-md"
                    >
                      {v === undefined ? '—' : f.pct(v)}
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
        <ul className="mt-2 flex flex-col gap-0.5 text-[11px] text-muted">
          {reference.armNotes.map((n, i) => (
            <li key={n.doseMg}>
              {'*'.repeat(i + 1)} {pick(n.note)}
            </li>
          ))}
          <li>{t('outlook.trial.means')}</li>
        </ul>
      </div>
    </details>
  )
}

/* ------------------------------------------------------------------ no-data card */

const NO_OUTLOOK_NOTE = l10n(
  'Esta sección aún no incluye referencias de resultados para esta sustancia.',
  'This section does not include outcome references for this substance yet.',
)

function NoDataCard({
  f,
  item,
  now,
  rows,
  readOnly,
  onPick,
}: {
  f: Fmt
  item: ProtocolOutlook
  now: Date
  rows: readonly MeasurementRow[]
  readOnly: boolean
  onPick: (m: MeasureItem) => void
}) {
  const { t, pick } = f
  const eyebrow =
    now < item.since
      ? t('outlook.startsOn', { date: f.date(item.since) })
      : t('outlook.sinceWeek', {
          date: f.date(item.since),
          n: Math.floor(treatmentWeeks(item.like, now)) + 1,
        })
  const allNoData = item.others.every((o) => o.outlook?.kind === 'no_human_data')
  const color = compoundColor(item.compoundIds[0] ?? '')
  return (
    <Card className="p-4" style={{ borderColor: `color-mix(in oklab, ${color} 26%, var(--line))` }}>
      <ProtocolTitle f={f} title={item.title} compoundIds={item.compoundIds} eyebrow={eyebrow} />
      <div className="mt-3 rounded-[14px] border border-line bg-panel-2 p-3">
        <div className="spec">{t('outlook.noData.kpiLabel')}</div>
        <div className="mt-1 text-[15px] font-semibold">
          {allNoData ? t('outlook.noData.title') : t('outlook.noData.titleMixed')}
        </div>
        <p className="mt-0.5 text-[12px] text-muted">{t('outlook.noData.body')}</p>
      </div>

      <ul className="mt-3 flex flex-col gap-3">
        {item.others.map(({ compoundId, outlook }) => {
          const entry = compoundById(compoundId)
          return (
            <li key={compoundId}>
              <div className="flex items-center justify-between gap-2">
                <span className="flex min-w-0 items-center gap-1.5">
                  <SubstanceDot color={compoundColor(compoundId)} />
                  <span className="truncate text-[14px] font-semibold">
                    {compoundName(compoundId)}
                  </span>
                </span>
                {entry && (
                  <Badge tone="neutral">
                    {t('wiki.evidence')} · {t(`wiki.evidenceTiers.${entry.evidence}`)}
                  </Badge>
                )}
              </div>
              <p className="mt-1 text-[12.5px] leading-relaxed text-ink-2">
                {outlook
                  ? pick(outlook.summary)
                  : `${entry ? pick(entry.pharmClass) : ''}. ${pick(NO_OUTLOOK_NOTE)}`}
              </p>
              {outlook?.kind === 'no_human_data' && (
                <p className="mt-0.5 font-mono text-[10px] text-muted">{outlook.source}</p>
              )}
            </li>
          )
        })}
      </ul>

      <MeasureList
        f={f}
        items={item.measure}
        rows={rows}
        since={item.since}
        readOnly={readOnly}
        onPick={onPick}
      />
    </Card>
  )
}

/* ------------------------------------------------------------------ what to measure */

function MeasureList({
  f,
  items,
  rows,
  since,
  readOnly,
  onPick,
}: {
  f: Fmt
  items: readonly MeasureItem[]
  rows: readonly MeasurementRow[]
  since: Date
  readOnly: boolean
  onPick: (m: MeasureItem) => void
}) {
  const { t, pick } = f
  if (items.length === 0) return null
  const countOf = (kind: MeasurementKind) =>
    rows.filter((r) => r.kind === kind && new Date(r.measured_at) >= since).length
  return (
    <div className="mt-4">
      <div className="spec mb-1.5">{t('outlook.measure.title')}</div>
      <ul className="divide-y divide-line overflow-hidden rounded-[14px] border border-line">
        {items.map((m) => {
          const kind =
            m.target.type === 'measurement' || m.target.type === 'checkin' ? m.target.kind : null
          const n = kind ? countOf(kind) : null
          const actionable = !readOnly && m.target.type !== 'note'
          const body = (
            <>
              <span className="min-w-0 flex-1">
                <span className="block text-[13px] font-medium text-ink">{pick(m.label)}</span>
                {m.hint && <span className="block text-[11.5px] text-muted">{pick(m.hint)}</span>}
              </span>
              <span className="shrink-0 text-right">
                {n !== null ? (
                  <span
                    className={n > 0 ? 'readout text-[11.5px] text-ok' : 'text-[11.5px] text-muted'}
                  >
                    {n > 0 ? t('outlook.measure.count', { count: n }) : t('outlook.measure.none')}
                  </span>
                ) : (
                  <span className="text-[11.5px] text-muted">
                    {m.target.type === 'lab' ? t('outlook.measure.lab') : t('outlook.measure.note')}
                  </span>
                )}
              </span>
              {actionable && <ChevronRight className="size-4 shrink-0 text-muted" />}
            </>
          )
          return (
            <li key={m.id}>
              {actionable ? (
                <button
                  type="button"
                  onClick={() => onPick(m)}
                  className="flex w-full items-center gap-3 bg-panel px-3 py-2.5 text-left transition active:bg-panel-2"
                >
                  {body}
                </button>
              ) : (
                <div className="flex items-center gap-3 bg-panel px-3 py-2.5">{body}</div>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

/* ------------------------------------------------------------------ compact card */

/** Compact summary for embedding (e.g. on Today): the headline for 6 months and a link. */
export function OutlookCard({ horizon = 6 }: { horizon?: Horizon }) {
  const f = useFormat()
  const { t } = f
  const { patientId } = usePatientScope()
  const protocols = useProtocols(patientId)
  const now = useNow()
  const model = useMemo(
    () => buildModel(protocols.data ?? [], now, horizon),
    [protocols.data, now, horizon],
  )
  if (protocols.isPending || model.items.length === 0) return null
  return (
    <Link to="/outlook" className="card fade-up block p-4 transition active:scale-[0.99]">
      <div className="flex items-center justify-between gap-2">
        <span className="spec">
          {t('outlook.title')} · {t('outlook.headline.in', { n: horizon })}
        </span>
        <ChevronRight className="size-4 text-muted" />
      </div>
      <div className="mt-2 flex flex-col gap-2">
        {model.trialItems.map((item) => (
          <HeadlineTrial key={item.row.id} f={f} item={item} />
        ))}
        {model.otherItems.length > 0 && (
          <p className="text-[12.5px] text-ink-2">
            {t('outlook.card.noData', {
              names: model.otherItems.map((i) => i.title).join(', '),
            })}
          </p>
        )}
      </div>
    </Link>
  )
}
