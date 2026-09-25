import { subDays } from 'date-fns'
import { Clock, Syringe } from 'lucide-react'
import { useMemo, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge, ProgressRing, Stat } from '@/components/ui/primitives'
import { compoundColor } from '@/content/substanceColor'
import type { SymptomRow } from '@/data/database.types'
import { plannedDoses } from '@/domain/dosing/schedule'
import { exposureCurve, steadyState } from '@/domain/pk/engine'
import { projectPlanned } from '@/domain/pk/scenarios'
import { fmtDateTime, fmtDose, fmtHours, fmtNumber, fmtPercent } from '@/lib/format'
import { useLocale } from '@/lib/useLocale'
import { scaledAmount, stepChanges } from './chartScale'
import { PkChart, type StepMarker } from './PkChart'
import type { CompoundExposure } from './useExposure'

const NO_SYMPTOMS: SymptomRow[] = []
const DAY_MS = 86_400_000
/** Stretch the projection to show the next titration step when it is this close. */
const MAX_PROJECTION_DAYS = 35

export function ExposureCard({
  x,
  symptoms = NO_SYMPTOMS,
  now,
  onLogDose,
  readOnly = false,
  historyDays = 28,
  projectionDays = 14,
}: {
  x: CompoundExposure
  symptoms?: SymptomRow[]
  now: Date
  onLogDose?: () => void
  readOnly?: boolean
  historyDays?: number
  projectionDays?: number
}) {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const unit = x.compound?.defaultUnit ?? 'mg'

  const color = compoundColor(x.compoundId)
  const toNextStep = x.titration?.daysToNextStep ?? null
  const horizonDays =
    toNextStep !== null && toNextStep >= projectionDays - 3
      ? Math.min(MAX_PROJECTION_DAYS, Math.max(projectionDays, toNextStep + 7))
      : projectionDays

  const curves = useMemo(() => {
    if (!x.pk) return null
    const first = x.history[0]?.at
    const from =
      first && first > subDays(now, historyDays) ? subDays(first, 1) : subDays(now, historyDays)
    const to = new Date(now.getTime() + horizonDays * DAY_MS)
    const history = exposureCurve(x.history, x.pk, { from, to: now, stepH: 3, refineAtDoses: true })
    const projection = projectPlanned({
      compoundId: x.compoundId,
      pk: x.pk,
      history: x.history,
      protocol: x.protocolLike,
      now,
      horizonDays,
      stepH: 3,
    }).points
    const planned = x.protocolLike
      ? plannedDoses(x.protocolLike, x.history, now, to).map((p) => ({ at: p.at, mg: p.doseMg }))
      : []
    const changes = x.protocolLike ? stepChanges(x.protocolLike, from, to) : []
    const ss =
      x.reference && x.reference.doseMg > 0
        ? steadyState(x.reference.doseMg, x.reference.intervalH, x.pk)
        : null
    return { history, projection, planned, changes, ss }
  }, [x, now, historyDays, horizonDays])

  const stepMarkers = useMemo<StepMarker[]>(
    () =>
      (curves?.changes ?? []).map((c) => ({
        at: c.at,
        label:
          c.kind === 'pause'
            ? t('charts.pause')
            : `${c.kind === 'down' ? '↓' : c.kind === 'up' ? '↑' : '▸'} ${fmtDose(c.doseMg, unit, locale)}`,
      })),
    [curves, t, unit, locale],
  )

  const nowAmount =
    x.nowMg !== null ? scaledAmount(x.nowMg, Math.max(x.nowMg, curves?.ss?.peakMg ?? 0)) : null

  const symptomMarkers = useMemo(
    () =>
      symptoms.map((s) => ({
        at: new Date(s.occurred_at),
        severity: s.severity,
        label: t(`symptoms.kinds.${s.kind}`),
      })),
    [symptoms, t],
  )

  const name = x.compound?.names.generic ?? x.compoundId
  const ref = x.reference
  const intervalLabel = ref
    ? ref.intervalH === 168
      ? t('protocols.weekly')
      : ref.intervalH === 24
        ? t('protocols.daily')
        : t('protocols.everyNDays', { n: fmtNumber(ref.intervalH / 24, locale, 1) })
    : null

  return (
    <Card padded={false} className="overflow-hidden">
      <div className="flex items-start justify-between gap-3 px-4 pt-4">
        <div>
          <h2 className="text-[17px] font-bold tracking-tight">{name}</h2>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            {ref && ref.doseMg > 0 && (
              <Badge tone="brand">
                {fmtDose(ref.doseMg, unit, locale)} · {intervalLabel}
              </Badge>
            )}
            {x.titration && !x.titration.isMaintenance && (
              <Badge tone="accent">
                {t('dashboard.step', {
                  n: x.titration.stepIndex + 1,
                  total: x.titration.totalSteps,
                })}
              </Badge>
            )}
            {x.titration?.isMaintenance && <Badge>{t('dashboard.maintenance')}</Badge>}
          </div>
        </div>
        {x.next && <NextDoseChip next={x.next} unit={unit} now={now} />}
      </div>

      {x.pk && nowAmount ? (
        <>
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
                  {t('dashboard.steadyStateShort')}
                </div>
              </div>
            </ProgressRing>
            <div className="flex-1">
              <Stat
                label={t('dashboard.onBoard')}
                value={fmtNumber(nowAmount.value, locale, nowAmount.digits)}
                unit={nowAmount.unit}
                hint={
                  x.progress && ref
                    ? x.progress.fraction >= 0.9
                      ? `${t('dashboard.reached')} · ${t('dashboard.steadyStateOf', { dose: fmtDose(ref.doseMg, unit, locale) })}`
                      : t('dashboard.toReach', { time: fmtHours(x.progress.hoursTo90, locale) })
                    : t('dashboard.onBoardHint')
                }
              />
            </div>
          </div>

          <div className="px-3 pt-3">
            {curves && (
              <PkChart
                history={curves.history}
                projection={curves.projection}
                doses={x.history}
                planned={curves.planned}
                steps={stepMarkers}
                symptoms={symptomMarkers}
                now={now}
                color={color}
                height={210}
                ssBand={
                  curves.ss ? { troughMg: curves.ss.troughMg, peakMg: curves.ss.peakMg } : undefined
                }
              />
            )}
            <ul className="flex flex-wrap items-center gap-x-3 gap-y-1 px-1 pb-1 pt-2 text-[11px] text-muted">
              <LegendItem
                swatch={<span className="h-[2px] w-4 rounded" style={{ background: color }} />}
              >
                {t('dashboard.history')}
              </LegendItem>
              <LegendItem
                swatch={
                  <span className="w-4 border-t-2 border-dashed" style={{ borderColor: color }} />
                }
              >
                {t('dashboard.projection')}
              </LegendItem>
              <LegendItem
                swatch={
                  <span className="flex items-center gap-0.5">
                    <span className="size-[7px] rounded-full" style={{ background: color }} />
                    <span
                      className="size-[7px] rounded-full border-[1.5px] bg-panel"
                      style={{ borderColor: color }}
                    />
                  </span>
                }
              >
                {t('charts.legend.doses')}
              </LegendItem>
              {stepMarkers.length > 0 && (
                <LegendItem
                  swatch={
                    <span className="h-3 border-l border-dashed" style={{ borderColor: color }} />
                  }
                >
                  {t('charts.legend.step')}
                </LegendItem>
              )}
              {curves?.ss && (
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
                  {t('dashboard.symptomsOverlay')}
                </LegendItem>
              )}
            </ul>
          </div>
        </>
      ) : (
        <p className="px-4 pt-3 text-[13px] text-muted">{t('dashboard.pkNotAvailable')}</p>
      )}

      <div className="mt-3 grid grid-cols-2 gap-px border-t border-line bg-line">
        <div className="bg-panel px-4 py-3">
          <div className="text-[11.5px] font-semibold uppercase tracking-wider text-muted">
            {t('dashboard.titration')}
          </div>
          {x.titration ? (
            <div className="mt-0.5 text-[13.5px]">
              {x.titration.isMaintenance ? (
                <span>{t('dashboard.maintenance')}</span>
              ) : x.titration.nextDoseMg !== null && x.titration.daysToNextStep !== null ? (
                <span>
                  {t('dashboard.nextStep', {
                    dose: fmtDose(x.titration.nextDoseMg, unit, locale),
                    days: t('common.days', { count: Math.max(0, x.titration.daysToNextStep) }),
                  })}
                </span>
              ) : (
                <span>
                  {t('dashboard.step', {
                    n: x.titration.stepIndex + 1,
                    total: x.titration.totalSteps,
                  })}
                </span>
              )}
            </div>
          ) : (
            <div className="mt-0.5 text-[13.5px] text-muted">—</div>
          )}
        </div>
        <div className="bg-panel px-4 py-3">
          <div className="text-[11.5px] font-semibold uppercase tracking-wider text-muted">
            {t('dashboard.adherence')}
          </div>
          {x.adherence ? (
            <div className="mt-0.5 text-[13.5px]">
              <span className="tabular font-semibold">{fmtPercent(x.adherence.ratio, locale)}</span>
              <span className="ml-1.5 text-muted">
                {t('dashboard.adherenceHint', {
                  taken: x.adherence.taken,
                  expected: x.adherence.expected,
                })}
              </span>
            </div>
          ) : (
            <div className="mt-0.5 text-[13.5px] text-muted">—</div>
          )}
        </div>
      </div>

      {!readOnly && onLogDose && (
        <div className="border-t border-line p-3">
          <Button block size="lg" leading={<Syringe className="size-5" />} onClick={onLogDose}>
            {t('dashboard.logNow')}
          </Button>
        </div>
      )}
      {x.lastDose && (
        <div className="flex items-center gap-1.5 px-4 pb-3 text-[12px] text-muted">
          <Clock className="size-3.5" /> {t('clinic.lastDose')}:{' '}
          {fmtDateTime(x.lastDose.at, locale)} · {fmtDose(x.lastDose.mg, unit, locale)}
        </div>
      )}
    </Card>
  )
}

function NextDoseChip({
  next,
  unit,
  now,
}: {
  next: NonNullable<CompoundExposure['next']>
  unit: 'mg' | 'mcg' | 'iu' | 'units' | 'ml'
  now: Date
}) {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const hours = (next.at.getTime() - now.getTime()) / 3_600_000
  const tone = next.status === 'overdue' ? 'danger' : next.status === 'due' ? 'warn' : 'neutral'
  const label =
    next.status === 'overdue'
      ? t('dashboard.overdue', { time: fmtHours(next.overdueH, locale) })
      : next.status === 'due'
        ? t('dashboard.due')
        : t('dashboard.in', { time: fmtHours(hours, locale) })
  return (
    <div className="shrink-0 text-right">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-muted">
        {t('dashboard.nextDose')}
      </div>
      <Badge tone={tone} className="mt-1 text-[12px]">
        {label}
      </Badge>
      <div className="tabular mt-1 text-[12px] text-muted">
        {fmtDose(next.doseMg, unit, locale)}
      </div>
    </div>
  )
}

function LegendItem({ swatch, children }: { swatch: ReactNode; children: ReactNode }) {
  return (
    <li className="inline-flex items-center gap-1.5">
      <span className="inline-flex items-center" aria-hidden>
        {swatch}
      </span>
      {children}
    </li>
  )
}
