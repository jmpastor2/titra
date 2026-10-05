/**
 * Progress → Cuerpo, second part: keeping muscle while the weight comes down. Protein of the
 * day against its target, strength sessions of the week and the pace of the loss.
 */
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { usePatientScope } from '@/app/scope'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge, ProgressRing, SectionTitle, Stat } from '@/components/ui/primitives'
import type { MeasurementKind } from '@/data/database.types'
import { useMeasurements } from '@/data/hooks'
import { compositionTrend, proteinTarget, rateFlag } from '@/domain/lean/leanMass'
import { useCounterMeasurements } from '@/features/quicklog/data'
import { fmtNumber, fmtPercent } from '@/lib/format'
import { useLocale } from '@/lib/useLocale'
import { LogMeasurementSheet } from './LogMeasurementSheet'
import { fmtSignedFixed } from './progress'
import { weeklyRate } from './trend'
import { useBodyUnits } from './units'

/** Strength sessions a week the screen asks for. */
const SESSIONS_TARGET = 2
const DAY_MS = 86_400_000

export function LeanTab({ index }: { index: string }) {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const { patientId, patient, readOnly } = usePatientScope()
  const units = useBodyUnits()
  const measurements = useMeasurements(patientId, 120)
  // Protein and strength sessions are counters: read from their own small query.
  const counters = useCounterMeasurements(patientId)
  const [sheet, setSheet] = useState<MeasurementKind | null>(null)
  const [now] = useState(() => new Date())

  const rows = measurements.data ?? []
  const counterRows = counters.data ?? []
  const weights = rows
    .filter((m) => m.kind === 'weight')
    .map((m) => ({ at: new Date(m.measured_at), kg: Number(m.value) }))
    .toSorted((a, b) => a.at.getTime() - b.at.getTime())
  const leans = rows.filter((m) => m.kind === 'lean_mass')
  const withLean = weights.map((w) => {
    const l = leans.find(
      (m) => Math.abs(new Date(m.measured_at).getTime() - w.at.getTime()) < DAY_MS,
    )
    return l ? { ...w, leanKg: Number(l.value) } : w
  })
  const trend = compositionTrend(withLean, 90)
  const currentKg = weights.at(-1)?.kg ?? patient?.goal_weight_kg ?? 0
  const gPerKg = Number(patient?.protein_g_per_kg ?? 1.6)
  const target = proteinTarget(currentKg, gPerKg)

  const today = now.toDateString()
  const proteinToday = Math.round(
    counterRows
      .filter((m) => m.kind === 'protein_g' && new Date(m.measured_at).toDateString() === today)
      .reduce((s, m) => s + Number(m.value), 0),
  )
  const proteinFraction = target > 0 ? proteinToday / target : 0

  const weekAgo = now.getTime() - 7 * DAY_MS
  const sessions = counterRows.filter(
    (m) => m.kind === 'resistance_session' && new Date(m.measured_at).getTime() > weekAgo,
  ).length

  // Same rule as the weight chart: a weekly rate needs 3 weigh-ins over at least 7 days. The
  // flag judges the pace in kg; the figure is shown in the person's unit.
  const rate = weeklyRate(weights.map((w) => ({ at: w.at, value: w.kg })))
  const flag = rate ? rateFlag(rate.perWeek, currentKg) : null
  const unit = units.unit('weight')

  return (
    <section>
      <SectionTitle index={index}>{t('health.lean')}</SectionTitle>
      <p className="-mt-1 mb-3 px-1 text-[12.5px] leading-relaxed text-muted">{t('lean.intro')}</p>

      <div className="flex flex-col gap-3">
        <Card
          title={t('lean.proteinTarget')}
          subtitle={t('lean.proteinHint', { gPerKg: fmtNumber(gPerKg, locale, 1) })}
        >
          <div className="flex items-center gap-4">
            <ProgressRing fraction={proteinFraction} size={80} stroke={8}>
              <span className="readout text-[16px] font-bold leading-none">
                {fmtPercent(proteinFraction, locale)}
              </span>
            </ProgressRing>
            <div className="min-w-0 flex-1">
              <Stat
                label={t('lean.proteinToday')}
                value={`${fmtNumber(proteinToday, locale, 0)} / ${fmtNumber(target, locale, 0)}`}
                unit="g"
                tone="brand"
                hint={
                  proteinToday >= target
                    ? t('lean.proteinDone')
                    : t('lean.proteinLeft', { n: fmtNumber(target - proteinToday, locale, 0) })
                }
              />
              {!readOnly && (
                <Button
                  size="sm"
                  variant="soft"
                  className="mt-2"
                  onClick={() => setSheet('protein_g')}
                >
                  {t('lean.logProtein')}
                </Button>
              )}
            </div>
          </div>
        </Card>

        <Card
          title={t('lean.sessionsWeek')}
          subtitle={t('lean.sessionsTarget', { n: SESSIONS_TARGET })}
        >
          <div className="flex items-end justify-between gap-3">
            <Stat
              label={t('lean.last7')}
              value={fmtNumber(sessions, locale, 0)}
              unit={`/ ${SESSIONS_TARGET}`}
              tone={sessions >= SESSIONS_TARGET ? 'ok' : 'warn'}
            />
            {!readOnly && (
              <Button size="sm" variant="soft" onClick={() => setSheet('resistance_session')}>
                {t('lean.logSession')}
              </Button>
            )}
          </div>
        </Card>

        <Card title={t('lean.rate')}>
          {rate ? (
            <>
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <span className="readout text-[24px] font-semibold leading-none">
                  {fmtSignedFixed(units.show('weight', rate.perWeek), locale, 1)}
                </span>
                <span className="text-[13px] text-muted">
                  {unit}/{t('progress.trend.weekShort')}
                </span>
                {flag && (
                  <Badge tone={flag === 'ok' ? 'ok' : flag === 'fast' ? 'warn' : 'neutral'}>
                    {flag === 'ok'
                      ? t('lean.rateOk')
                      : flag === 'fast'
                        ? t('lean.rateFast')
                        : t('lean.rateGaining')}
                  </Badge>
                )}
              </div>
              {flag === 'fast' && (
                <p className="mt-2 text-[13px] text-ink-2">{t('lean.rateFastHint')}</p>
              )}
              {trend && trend.leanShare !== null && (
                <p className="mt-2 text-[13.5px] text-ink-2">
                  {t('lean.leanShare', { pct: fmtPercent(trend.leanShare, locale) })}
                </p>
              )}
            </>
          ) : (
            <p className="text-[13px] text-muted">
              {weights.length < 2 ? t('lean.needTwoWeights') : t('progress.trend.rateNeed')}
            </p>
          )}
        </Card>
      </div>

      <LogMeasurementSheet
        open={sheet !== null}
        onClose={() => setSheet(null)}
        defaultKind={sheet ?? 'protein_g'}
      />
    </section>
  )
}
