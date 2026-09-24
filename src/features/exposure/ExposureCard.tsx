import { subDays } from 'date-fns'
import { Clock, Syringe } from 'lucide-react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge, ProgressRing, Stat } from '@/components/ui/primitives'
import type { SymptomRow } from '@/data/database.types'
import { exposureCurve, steadyState } from '@/domain/pk/engine'
import { projectPlanned } from '@/domain/pk/scenarios'
import { fmtDateTime, fmtDose, fmtHours, fmtNumber, fmtPercent } from '@/lib/format'
import { useLocale } from '@/lib/useLocale'
import { PkChart } from './PkChart'
import type { CompoundExposure } from './useExposure'

const NO_SYMPTOMS: SymptomRow[] = []

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

  const curves = useMemo(() => {
    if (!x.pk) return null
    const first = x.history[0]?.at
    const from =
      first && first > subDays(now, historyDays) ? subDays(first, 1) : subDays(now, historyDays)
    const history = exposureCurve(x.history, x.pk, { from, to: now, stepH: 3, refineAtDoses: true })
    const projection = projectPlanned({
      compoundId: x.compoundId,
      pk: x.pk,
      history: x.history,
      protocol: x.protocolLike,
      now,
      horizonDays: projectionDays,
      stepH: 3,
    }).points
    const ss =
      x.reference && x.reference.doseMg > 0
        ? steadyState(x.reference.doseMg, x.reference.intervalH, x.pk)
        : null
    return { history, projection, ss }
  }, [x, now, historyDays, projectionDays])

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

      {x.pk && x.nowMg !== null ? (
        <>
          <div className="flex items-center gap-4 px-4 pt-4">
            <ProgressRing
              fraction={x.progress ? Math.min(1, x.progress.fraction) : 0}
              size={92}
              stroke={9}
            >
              <div className="text-center leading-none">
                <div className="tabular text-[20px] font-bold">
                  {x.progress ? fmtPercent(Math.min(x.progress.fraction, 1.5), locale) : '—'}
                </div>
                <div className="mt-0.5 text-[9.5px] font-semibold uppercase tracking-wider text-muted">
                  {t('dashboard.steadyState')}
                </div>
              </div>
            </ProgressRing>
            <div className="flex-1">
              <Stat
                label={t('dashboard.onBoard')}
                value={fmtNumber(x.nowMg, locale, x.nowMg < 1 ? 2 : 1)}
                unit="mg"
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

          <div className="px-2 pt-3">
            {curves && (
              <PkChart
                history={curves.history}
                projection={curves.projection}
                doses={x.history}
                symptoms={symptomMarkers}
                now={now}
                height={210}
                ssBand={
                  curves.ss ? { troughMg: curves.ss.troughMg, peakMg: curves.ss.peakMg } : undefined
                }
              />
            )}
            <div className="flex items-center gap-4 px-3 pb-1 pt-1 text-[11px] text-muted">
              <span className="inline-flex items-center gap-1">
                <span className="inline-block h-[2px] w-4 rounded bg-[var(--chart-1)]" />{' '}
                {t('dashboard.history')}
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="inline-block h-[2px] w-4 rounded border-t-2 border-dashed border-[var(--chart-1)]" />{' '}
                {t('dashboard.projection')}
              </span>
              {symptomMarkers.length > 0 && (
                <span className="inline-flex items-center gap-1">
                  <span className="inline-block size-2 rounded-full bg-[var(--chart-3)]" />{' '}
                  {t('dashboard.symptomsOverlay')}
                </span>
              )}
            </div>
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
