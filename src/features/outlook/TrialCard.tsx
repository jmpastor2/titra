/**
 * One protocol with a published trial behind it: how the person's weight sits against the band
 * the trial observed for his dose, in a chart, and the trial itself (what it was, what it found,
 * what it cannot tell) one tap away.
 */
import { ChevronRight, FlaskConical, Scale } from 'lucide-react'
import { useMemo, type ReactNode } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { SubstanceDot } from '@/components/ui/primitives'
import { compoundName } from '@/content/compounds'
import type { WeightTrialReference } from '@/content/outlook'
import type { L10n } from '@/content/schema'
import { compoundColor } from '@/content/substanceColor'
import { asDoseUnit } from '@/features/health/progress'
import { fmtDose } from '@/lib/format'
import {
  isProjection,
  personalTrend,
  projectTrend,
  treatmentWeeks,
  trendOnTreatmentAxis,
  type Horizon,
  type WeightPoint,
} from './outlook'
import { OutlookChart, type AxisPoint } from './OutlookChart'
import type { ProtocolOutlook } from './outlookModel'
import type { Fmt } from './outlookFormat'

export function TrialCard({
  f,
  item,
  horizon,
  now,
  weights,
  readOnly,
  onLogWeight,
}: {
  f: Fmt
  item: ProtocolOutlook
  horizon: Horizon
  now: Date
  weights: readonly WeightPoint[]
  readOnly: boolean
  onLogWeight: () => void
}) {
  const { t } = f
  const trial = item.trial
  const trend = useMemo(() => personalTrend(weights, item.since, now), [weights, item.since, now])
  const targetDate = trial?.ref.targetDate
  const projection = useMemo(
    () => (targetDate ? projectTrend(trend, targetDate) : { none: 'no_data' as const }),
    [trend, targetDate],
  )
  // The person's weigh-ins and the line drawn on from them, as the chart wants them.
  const chartMe = useMemo<AxisPoint[]>(
    () =>
      trend && trial
        ? trendOnTreatmentAxis(trend, trial.like).map((p, i) => ({
            week: p.week,
            pct: p.pct,
            at: trend.points[i]?.at,
            kg: trend.points[i]?.kg,
          }))
        : [],
    [trend, trial],
  )
  const chartProjection = useMemo<AxisPoint[]>(
    () =>
      trend && trial && isProjection(projection)
        ? [
            { week: treatmentWeeks(trial.like, trend.latest.at), pct: trend.changePct },
            { week: trial.ref.weeksAtTarget, pct: projection.deltaPct, kg: projection.kg },
          ]
        : [],
    [trend, projection, trial],
  )
  if (!trial) return null

  const { ref, outlook } = trial
  const reference = outlook.reference
  const color = compoundColor(trial.compoundId)
  const unit = asDoseUnit(item.row.unit)
  const band = ref.band

  return (
    <Card className="p-4" style={{ borderColor: `color-mix(in oklab, ${color} 30%, var(--line))` }}>
      <ProtocolTitle
        f={f}
        title={item.title}
        compoundIds={item.compoundIds}
        eyebrow={`${reference.trial} · ${reference.year}`}
      />

      {band && ref.doseMg !== null && (
        <p className="mt-2.5 text-[12.5px] leading-relaxed text-ink-2">
          {t(`outlook.position.${band.position}`, {
            dose: fmtDose(ref.doseMg, unit, f.locale),
            lower: fmtDose(band.lowerDoseMg, 'mg', f.locale),
            upper: fmtDose(band.upperDoseMg, 'mg', f.locale),
          })}
        </p>
      )}

      {trial.series.length > 1 && (
        <div className="mt-4">
          <div className="spec mb-1">{t('outlook.chart.title')}</div>
          <OutlookChart
            f={f}
            color={color}
            series={trial.series}
            todayWeeks={trial.todayWeeks}
            targetWeeks={ref.weeksAtTarget}
            horizon={horizon}
            me={chartMe}
            projection={chartProjection}
          />
        </div>
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

      <TrialDetails
        f={f}
        outlook={outlook}
        lowerMg={band?.lowerDoseMg}
        upperMg={band?.upperDoseMg}
        color={color}
      />
    </Card>
  )
}

export function ProtocolTitle({
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
      <div className="mt-1 flex items-start gap-2">
        <span className="mt-[9px] flex items-center gap-1">
          {compoundIds.map((id) => (
            <SubstanceDot key={id} color={compoundColor(id)} />
          ))}
        </span>
        <h2 className="min-w-0 font-display text-[18px] font-semibold leading-snug">{title}</h2>
      </div>
      <span className="sr-only">
        {f.t('outlook.compounds', { names: compoundIds.map(compoundName).join(', ') })}
      </span>
    </header>
  )
}

/* ------------------------------------------------------------------ trial details */

function TrialDetails({
  f,
  outlook,
  lowerMg,
  upperMg,
  color,
}: {
  f: Fmt
  outlook: { reference: WeightTrialReference; summary: L10n; caveats: readonly L10n[] }
  lowerMg: number | undefined
  upperMg: number | undefined
  color: string
}) {
  const { t, pick, locale } = f
  const { reference } = outlook
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
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 px-3 py-2.5 text-[13px] font-semibold text-ink-2">
        <span className="flex items-center gap-2">
          <FlaskConical className="size-4 text-muted" />
          {t('outlook.trial.open')}
        </span>
        <ChevronRight className="size-4 text-muted transition group-open:rotate-90" />
      </summary>
      <div className="border-t border-line px-3 pb-3 pt-2.5">
        <p className="text-[13px] leading-relaxed text-ink-2">{pick(outlook.summary)}</p>
        <div className="mt-3 text-[13px] font-semibold">
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
        <ul className="mt-3 flex flex-col gap-1.5 border-t border-line pt-3">
          {outlook.caveats.map((c) => (
            <li key={c.en} className="flex gap-2 text-[12px] leading-relaxed text-muted">
              <span aria-hidden className="mt-[7px] size-1 shrink-0 rounded-full bg-muted" />
              {pick(c)}
            </li>
          ))}
        </ul>
      </div>
    </details>
  )
}
