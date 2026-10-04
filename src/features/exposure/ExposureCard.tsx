/**
 * The level instrument of one substance: how much is on board and where it is heading for
 * the ones with a curve worth drawing, one mark per administration for the rest, with the
 * range, the titration, adherence and the next dose beside it.
 */
import { Clock, Syringe } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge, ProgressRing, Skeleton, Stat } from '@/components/ui/primitives'
import { compoundColor } from '@/content/substanceColor'
import type { InventoryRow, SymptomRow } from '@/data/database.types'
import { cycleInfo, type CycleInfo } from '@/domain/dosing/cycle'
import { useScheduleLabel } from '@/features/protocols/scheduleLabel'
import { fmtDate, fmtDateTime, fmtDose, fmtHours, fmtNumber, fmtPercent } from '@/lib/format'
import { useLocale } from '@/lib/useLocale'
import { LegendItem, LegendList, NextDoseChip, RangeTabs } from './CardParts'
import { Head, type DoseMark } from './chartParts'
import { DoseTimelineChart } from './DoseTimelineChart'
import { amountIn } from './chartScale'
import { ADMIN_STATES, buildTimeline, type AdminState, type TimelineModel } from './doseTimeline'
import { buildCurveBundle } from './exposureCurves'
import { levelKind } from './levelSummary'
import { PkChart, type StepMarker } from './PkChart'
import { cropToActivity, firstActivity, timelineWindow, type RangeKey } from './ranges'
import { stepLabel } from './stepLabels'
import { fmtAgo } from './relative'
import { administrationOf, describeDoses, noBreak, unitsFor } from './units'
import type { CompoundExposure } from './useExposure'

const NO_SYMPTOMS: SymptomRow[] = []
const NO_VIALS: InventoryRow[] = []

export function ExposureCard({
  x,
  symptoms = NO_SYMPTOMS,
  onLogDose,
  readOnly = false,
  vials = NO_VIALS,
  showTitle = true,
}: {
  x: CompoundExposure
  symptoms?: SymptomRow[]
  /** The clock is `x.asOf`; the prop stays so existing callers keep compiling. */
  now?: Date
  onLogDose?: () => void
  readOnly?: boolean
  /** Every vial, to give doses in syringe units when the concentration is known. */
  vials?: readonly InventoryRow[]
  /** The heading is redundant on a page that already carries the substance name. */
  showTitle?: boolean
}) {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const scheduleLabel = useScheduleLabel()
  const now = x.asOf
  const unit = x.compound?.defaultUnit ?? 'mg'
  const color = compoundColor(x.compoundId)
  const kind = levelKind(x)
  const protocol = x.protocolLike
  const [range, setRange] = useState<RangeKey>('4w')
  const active: RangeKey = range === 'cycle' && !protocol ? '4w' : range

  // Only the range on screen is computed; the figures are rebuilt when the data or the minute moves.
  const curve = useMemo(
    () =>
      kind === 'curve' && x.pk
        ? buildCurveBundle({
            compoundId: x.compoundId,
            pk: x.pk,
            history: x.history,
            protocol,
            daysToNextStep: x.titration?.daysToNextStep ?? null,
            range: active,
            now,
          })
        : null,
    [kind, x, protocol, active, now],
  )
  const timeline = useMemo<TimelineModel | null>(() => {
    if (kind !== 'timeline') return null
    const win = cropToActivity(
      timelineWindow(active, now, protocol),
      firstActivity(protocol, x.history),
    )
    return buildTimeline({
      protocol,
      history: x.history,
      partners: x.partners.map((p) => ({ compoundId: p.compoundId, history: p.history })),
      ...win,
      now,
    })
  }, [kind, x, protocol, active, now])

  // What happened to each administration on the curve's range, judged like the timeline's.
  const marks = useMemo<DoseMark[] | undefined>(() => {
    if (!curve) return undefined
    return buildTimeline({
      protocol,
      history: x.history,
      from: curve.from,
      to: curve.to,
      now,
    }).items.map((i) => ({ at: i.at, state: i.state }))
  }, [curve, protocol, x.history, now])

  const stepMarkers = useMemo<StepMarker[]>(
    () =>
      (curve?.steps ?? []).map((c) => ({
        at: c.at,
        label: stepLabel(c, unit, locale, t('charts.pause')),
      })),
    [curve, unit, locale, t],
  )
  const symptomMarkers = useMemo(
    () =>
      symptoms.map((s) => ({
        at: new Date(s.occurred_at),
        severity: s.severity,
        label: t(`symptoms.kinds.${s.kind}`),
      })),
    [symptoms, t],
  )

  const ref = x.reference
  const current =
    ref && ref.doseMg > 0 ? administrationOf(protocol, x.compoundId, ref.doseMg) : null
  const nextDoses = x.next ? administrationOf(protocol, x.compoundId, x.next.doseMg) : null
  const amount = x.nowMg !== null ? amountIn(x.nowMg, unit) : null
  const info = useMemo(() => (protocol ? cycleInfo(protocol, now) : null), [protocol, now])

  return (
    <Card padded={false} className="overflow-hidden">
      <div className="flex items-start justify-between gap-3 px-4 pt-4">
        <div className="min-w-0">
          {showTitle && <h2 className="text-[17px] font-bold tracking-tight">{x.title}</h2>}
          <div className={showTitle ? 'mt-1 flex flex-wrap gap-1.5' : 'flex flex-wrap gap-1.5'}>
            {current && protocol && (
              <>
                <Badge tone="brand">{describeDoses(current, locale)}</Badge>
                <Badge>{scheduleLabel(protocol.steps, protocol.times)}</Badge>
              </>
            )}
            {info && info.phase === 'rest' && <Badge>{t('charts.cycle.resting')}</Badge>}
            {info && info.phase === 'dosing' && info.stepCount > 1 && (
              <Badge tone="accent">
                {t('charts.cycle.step', { n: info.stepNumber, total: info.stepCount })}
              </Badge>
            )}
            {info?.phase === 'maintenance' && <Badge>{t('charts.cycle.maintenance')}</Badge>}
          </div>
        </div>
        {x.next && nextDoses && (
          <NextDoseChip
            next={x.next}
            now={now}
            dose={describeDoses(nextDoses, locale)}
            units={unitsFor(nextDoses, vials)}
          />
        )}
      </div>

      {kind === 'curve' && amount ? (
        <div className="flex items-center gap-4 px-4 pt-4">
          <ProgressRing
            fraction={x.progress ? Math.min(1, x.progress.fraction) : 0}
            size={92}
            stroke={9}
          >
            <div className="text-center leading-none">
              <div className="readout text-[20px] font-bold">
                {x.progress ? fmtPercent(Math.min(x.progress.fraction, 1.5), locale) : '—'}
              </div>
              <div className="spec mx-auto mt-1 max-w-[60px] text-[8.5px] leading-tight tracking-[0.08em]">
                {t('charts.steady.short')}
              </div>
            </div>
          </ProgressRing>
          <div className="min-w-0 flex-1">
            <Stat
              label={t('levels.onBoard')}
              value={fmtNumber(amount.value, locale, amount.digits)}
              unit={amount.label}
              hint={
                x.progress && ref
                  ? x.progress.fraction >= 0.9
                    ? t('charts.steady.reached', { dose: fmtDose(ref.doseMg, unit, locale) })
                    : t('charts.steady.toReach', { time: fmtHours(x.progress.hoursTo90, locale) })
                  : t('charts.steady.hint')
              }
            />
          </div>
        </div>
      ) : timeline ? (
        <div className="flex items-center gap-4 px-4 pt-4">
          <ProgressRing
            fraction={timeline.summary.expected > 0 ? timeline.summary.ratio : 0}
            size={92}
            stroke={9}
          >
            <div className="text-center leading-none">
              <div className="readout text-[20px] font-bold">
                {timeline.summary.expected > 0 ? fmtPercent(timeline.summary.ratio, locale) : '—'}
              </div>
              <div className="spec mx-auto mt-1 max-w-[60px] text-[8.5px] leading-tight tracking-[0.08em]">
                {t('charts.timeline.adherenceShort')}
              </div>
            </div>
          </ProgressRing>
          <div className="min-w-0 flex-1">
            <Stat
              label={t('levels.lastDose')}
              value={x.lastDose ? fmtAgo(x.lastDose.at, now, locale, t('levels.justNow')) : '—'}
              hint={
                x.lastDose
                  ? `${fmtDateTime(x.lastDose.at, locale)} · ${describeDoses(
                      [
                        { compoundId: x.compoundId, doseMg: x.lastDose.mg },
                        ...x.partners.flatMap((p) => {
                          const same = p.history.find(
                            (h) => h.at.getTime() === x.lastDose?.at.getTime(),
                          )
                          return same ? [{ compoundId: p.compoundId, doseMg: same.mg }] : []
                        }),
                      ],
                      locale,
                    )}`
                  : t('charts.timeline.noDoses')
              }
            />
          </div>
        </div>
      ) : null}

      <div className="px-3 pt-3">
        <div className="px-1 pb-2">
          <RangeTabs value={active} onChange={setRange} withCycle={Boolean(protocol)} />
        </div>
        {curve && (
          <>
            <PkChart
              history={curve.history}
              projection={curve.projection}
              marks={marks}
              steps={stepMarkers}
              symptoms={symptomMarkers}
              bands={curve.bands}
              now={now}
              color={color}
              unit={unit}
              height={210}
              label={t('charts.exposureAria')}
            />
            <LegendList>
              <LegendItem
                swatch={<span className="h-[2px] w-4 rounded" style={{ background: color }} />}
              >
                {t('charts.legend.history')}
              </LegendItem>
              <LegendItem
                swatch={
                  <span className="w-4 border-t-2 border-dashed" style={{ borderColor: color }} />
                }
              >
                {t('charts.legend.projection')}
              </LegendItem>
              <MarkLegendItems states={markStates(marks)} color={color} />
              {stepMarkers.length > 0 && (
                <LegendItem
                  swatch={
                    <span className="h-3 border-l border-dashed" style={{ borderColor: color }} />
                  }
                >
                  {t('charts.legend.step')}
                </LegendItem>
              )}
              {curve.bands.length > 0 && (
                <LegendItem
                  swatch={
                    <span
                      className="h-2.5 w-4 rounded-[3px]"
                      style={{ background: `color-mix(in oklab, ${color} 22%, transparent)` }}
                    />
                  }
                >
                  {t('charts.legend.stable')}
                </LegendItem>
              )}
              {symptomMarkers.length > 0 && (
                <LegendItem swatch={<span className="size-2 rounded-full bg-[var(--chart-3)]" />}>
                  {t('charts.legend.symptoms')}
                </LegendItem>
              )}
            </LegendList>
          </>
        )}
        {timeline && (
          <>
            <DoseTimelineChart model={timeline} now={now} color={color} unit={unit} />
            <TimelineLegend model={timeline} color={color} />
            <p className="px-1 pb-1 pt-1 text-[11.5px] leading-snug text-muted">
              {x.pk ? t('charts.timeline.whyShort') : t('charts.timeline.whyNoData')}
            </p>
          </>
        )}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-px border-t border-line bg-line">
        <div className="bg-panel px-4 py-3">
          <div className="spec">{t('charts.cycle.title')}</div>
          <Titration info={info} x={x} vials={vials} className="mt-1 text-[13.5px]" />
        </div>
        <div className="bg-panel px-4 py-3">
          {timeline ? (
            <TimelineCounts model={timeline} range={active} />
          ) : (
            <>
              <div className="spec">{t('charts.adherence.title')}</div>
              {x.adherence ? (
                <div className="mt-1 text-[13.5px]">
                  <span className="tabular font-semibold">
                    {fmtPercent(x.adherence.ratio, locale)}
                  </span>
                  <span className="ml-1.5 text-muted">
                    {t('charts.adherence.hint', {
                      taken: x.adherence.taken,
                      expected: x.adherence.expected,
                    })}
                  </span>
                </div>
              ) : (
                <div className="mt-1 text-[13.5px] text-muted">—</div>
              )}
            </>
          )}
        </div>
      </div>

      {!readOnly && onLogDose && (
        <div className="border-t border-line p-3">
          <Button block size="lg" leading={<Syringe className="size-5" />} onClick={onLogDose}>
            {t('charts.logDose')}
          </Button>
        </div>
      )}
      {kind === 'curve' && x.lastDose && (
        <div className="flex items-center gap-1.5 border-t border-line px-4 py-3 text-[12px] text-muted">
          <Clock className="size-3.5" /> {t('charts.lastDose')}:{' '}
          {fmtDateTime(x.lastDose.at, locale)} · {fmtDose(x.lastDose.mg, unit, locale)}
        </div>
      )}
    </Card>
  )
}

/** The loading shape of the card, so the page does not jump when the data arrives. */
export function ExposureCardSkeleton() {
  return (
    <Card padded={false} className="overflow-hidden" aria-hidden>
      <div className="flex items-start justify-between gap-3 px-4 pt-4">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-6 w-32" />
        </div>
        <Skeleton className="h-14 w-24" />
      </div>
      <div className="flex items-center gap-4 px-4 pt-4">
        <Skeleton className="size-[92px] rounded-full" />
        <div className="flex flex-1 flex-col gap-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-7 w-28" />
          <Skeleton className="h-3 w-36" />
        </div>
      </div>
      <div className="px-4 pt-4">
        <Skeleton className="h-10 w-full rounded-full" />
        <Skeleton className="mt-3 h-[230px] w-full" />
      </div>
      <div className="mt-4 h-[72px] border-t border-line" />
    </Card>
  )
}

/** The states present among the marks, in legend order. */
function markStates(marks: readonly DoseMark[] | undefined): AdminState[] {
  return ADMIN_STATES.filter((s) => marks?.some((m) => m.state === s))
}

/** The states that appear on the chart, as the marks they are drawn with. */
function MarkLegendItems({ states, color }: { states: readonly AdminState[]; color: string }) {
  const { t } = useTranslation()
  return (
    <>
      {states.map((s) => (
        <LegendItem
          key={s}
          swatch={
            <svg width="16" height="16" viewBox="0 0 16 16">
              <Head state={s} cx={8} cy={8} r={3.6} color={color} />
            </svg>
          }
        >
          {t(`charts.legend.${s}`)}
        </LegendItem>
      ))}
    </>
  )
}

/** The legend of the dose timeline: the marks present and the dose changes. */
function TimelineLegend({ model, color }: { model: TimelineModel; color: string }) {
  const { t } = useTranslation()
  return (
    <LegendList>
      <MarkLegendItems states={model.states} color={color} />
      {model.steps.length > 0 && (
        <LegendItem
          swatch={<span className="h-3 border-l border-dashed" style={{ borderColor: color }} />}
        >
          {t('charts.legend.step')}
        </LegendItem>
      )}
    </LegendList>
  )
}

/** Taken, missed, off the hour and extra over the range on screen. */
function TimelineCounts({ model, range }: { model: TimelineModel; range: RangeKey }) {
  const { t } = useTranslation()
  const s = model.summary
  return (
    <>
      <div className="spec">{t(`charts.timeline.countsTitle.${range}`)}</div>
      <div className="mt-1 text-[13.5px]">
        {model.hasPlan ? (
          <>
            <span className="tabular font-semibold">
              {t('charts.timeline.taken', { taken: s.taken, expected: s.expected })}
            </span>
            <div className="mt-0.5 flex flex-wrap gap-x-2 text-[12px] text-muted">
              {s.missed > 0 && (
                <span className="text-danger">
                  {t('charts.timeline.missed', { count: s.missed })}
                </span>
              )}
              {s.offTime > 0 && <span>{t('charts.timeline.offTime', { count: s.offTime })}</span>}
              {s.extras > 0 && <span>{t('charts.timeline.extras', { count: s.extras })}</span>}
              {s.missed + s.offTime + s.extras === 0 && s.expected > 0 && (
                <span>{t('charts.timeline.allOnTime')}</span>
              )}
            </div>
          </>
        ) : (
          <span className="tabular font-semibold">
            {t('charts.timeline.free', { count: model.items.length })}
          </span>
        )}
      </div>
    </>
  )
}

/** Week of the cycle, the next change of dose (also in syringe units) and when it is. */
function Titration({
  info,
  x,
  vials,
  className,
}: {
  info: CycleInfo | null
  x: CompoundExposure
  vials: readonly InventoryRow[]
  className?: string
}) {
  const { t } = useTranslation()
  const { locale } = useLocale()
  if (!info) return <div className={className}>—</div>

  const week =
    info.phase === 'before'
      ? t('charts.cycle.before', { date: fmtDate(info.startsOn, locale, 'EEE d MMM') })
      : info.phase === 'finished'
        ? t('charts.cycle.finished')
        : info.phase === 'maintenance'
          ? t('charts.cycle.maintenanceWeek', { n: info.week })
          : info.phase === 'rest'
            ? t('charts.cycle.resting')
            : info.doseWeeks !== null && info.doseWeek !== null
              ? t('charts.cycle.week', { n: info.doseWeek, total: info.doseWeeks })
              : t('charts.cycle.weekOpen', { n: info.week })

  const next = info.next
  let change: string | null = null
  if (next) {
    const doses =
      next.doseMg !== null && next.doseMg > 0
        ? administrationOf(x.protocolLike, x.compoundId, next.doseMg)
        : null
    const units = doses ? unitsFor(doses, vials) : null
    const dose = doses
      ? `${noBreak(describeDoses(doses, locale))}${
          units !== null ? ` ${noBreak(`(${fmtNumber(units, locale, 1)} U)`)}` : ''
        }`
      : ''
    change = t(`charts.cycle.next.${next.kind}`, { dose })
  }
  return (
    <div className={className}>
      <div className="font-semibold">{week}</div>
      {next && change && (
        <>
          <div className="mt-0.5">{change}</div>
          <div className="text-[12px] text-muted">
            {fmtDate(next.on, locale, 'EEE d MMM')} ·{' '}
            {next.daysAway <= 0
              ? t('charts.cycle.today')
              : next.daysAway === 1
                ? t('charts.cycle.tomorrow')
                : t('charts.cycle.inDays', { count: next.daysAway })}
          </div>
        </>
      )}
      {info.decisionDue && (
        <div className="mt-1.5">
          <Badge tone="accent">{t('charts.cycle.decide')}</Badge>
          <p className="mt-1 text-[11.5px] leading-snug text-muted">
            {t('charts.cycle.decideHint')}
          </p>
        </div>
      )}
    </div>
  )
}
