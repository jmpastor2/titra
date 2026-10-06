/**
 * Progress → Cuerpo: one body reading at a time (weight, waist, hip…) as an instrument. The
 * readings, the pace and the distance to the goal on top, the trend over the doses taken,
 * the month-by-month table and the readings themselves, every one in the person's unit.
 */
import { Scale } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { usePatientScope } from '@/app/scope'
import { Kpi } from '@/components/kpi/Kpi'
import { Card } from '@/components/ui/Card'
import { Chip, EmptyState, Row, Skeleton } from '@/components/ui/primitives'
import { useToast } from '@/components/ui/Toast'
import { compoundColor } from '@/content/substanceColor'
import type { MeasurementKind, MeasurementRow } from '@/data/database.types'
import { useMeasurements } from '@/data/hooks'
import { compoundById } from '@/content/compounds'
import { TREND_INSET } from '@/features/exposure/chartScale'
import { TrendChart } from '@/features/exposure/TrendChart'
import { useQuickWrites } from '@/features/quicklog/data'
import { fmtDate, fmtDateTime, fmtDose, fmtRelativeDay } from '@/lib/format'
import { useLocale } from '@/lib/useLocale'
import { KIND_DIGITS } from './kinds'
import {
  asDoseUnit,
  fmtSignedFixed,
  inWindow,
  laneMarks,
  monthlyMeans,
  sortPoints,
  type ProgressScope,
  type TimePoint,
} from './progress'
import { ChangeValue, MonthTable, ProtocolStrip } from './ProgressCharts'
import { RowDelete } from './RowDelete'
import { baselineChange, ema, weeklyRate } from './trend'
import { fmtReading, useBodyUnits } from './units'

const CHARTABLE: MeasurementKind[] = [
  'weight',
  'waist',
  'hip',
  'chest',
  'arm',
  'thigh',
  'body_fat_pct',
  'lean_mass',
  'glucose_fasting',
  'hba1c',
  'bp_systolic',
  'heart_rate',
]

/** Body kinds drawn as a smoothed trend over the raw readings, with a weekly rate. */
const TRENDED: ReadonlySet<MeasurementKind> = new Set(['weight', 'waist'])

/** Readings listed under the chart. */
const LISTED = 30

/** A weekly rate is a fit over a few weigh-ins: a tenth is as fine as it gets. */
const RATE_DIGITS = 1

/** Incretins drive weight: their dose steps get a label on the body charts. */
function isIncretin(compoundId: string): boolean {
  return compoundById(compoundId)?.category === 'incretin'
}

/** Kind-specific threshold under which a change reads as flat. */
function changeThreshold(kind: MeasurementKind): number {
  return KIND_DIGITS[kind] === 0 ? 1 : 0.2
}

export function MeasurementsTab({ scope }: { scope: ProgressScope }) {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const { patientId, patient, readOnly } = usePatientScope()
  const units = useBodyUnits()
  const { toast } = useToast()
  const measurements = useMeasurements(patientId, 365)
  const writes = useQuickWrites(patientId)
  const [kind, setKind] = useState<MeasurementKind>('weight')
  const { window: win, lanes, since } = scope

  // Every reading in the person's unit, oldest first: the numbers, the trend line and the
  // chart below all come from these.
  const byKind = useMemo(() => {
    const m = new Map<MeasurementKind, TimePoint[]>()
    for (const row of measurements.data ?? []) {
      const list = m.get(row.kind) ?? []
      list.push({ at: new Date(row.measured_at), value: units.show(row.kind, Number(row.value)) })
      m.set(row.kind, list)
    }
    return new Map([...m].map(([k, list]) => [k, sortPoints(list)]))
  }, [measurements.data, units])

  const available = useMemo(
    () => CHARTABLE.filter((k) => (byKind.get(k)?.length ?? 0) > 0),
    [byKind],
  )
  const active: MeasurementKind | undefined = available.includes(kind) ? kind : available[0]

  const view = useMemo(() => {
    if (!active) return null
    const all = byKind.get(active) ?? []
    const pts = inWindow(all, win)
    const trended = TRENDED.has(active)
    return {
      pts,
      // The headline is the latest reading there is, whichever range is in view.
      latest: all.at(-1) ?? null,
      // The same change the summary tile shows: the latest reading against the one the range
      // (or the cycle) starts from.
      change: baselineChange(all, since),
      months: monthlyMeans(pts, win),
      trended,
      smooth: trended && pts.length > 1 ? ema(pts) : undefined,
      // The pace is today's, from the last weeks of readings, not the range on screen.
      rate: trended ? weeklyRate(all) : null,
    }
  }, [active, byKind, win, since])

  const marks = useMemo(
    () =>
      laneMarks(lanes, compoundColor, (lane, c) => {
        if (!isIncretin(lane.compoundId)) return undefined
        if (c.pause) return t('charts.pause')
        return fmtDose(c.doseMg, asDoseUnit(lane.unit), locale)
      }),
    [lanes, t, locale],
  )
  const xDomain = useMemo<[number, number]>(() => [win.from.getTime(), win.to.getTime()], [win])

  if (measurements.isPending) {
    return (
      <Card>
        <Skeleton className="h-40 w-full" />
      </Card>
    )
  }

  if (!active || !view) {
    return (
      <div className="flex flex-col gap-3">
        {lanes.length > 0 && (
          <Card padded={false} className="p-3.5">
            <div className="spec mb-2">{t('charts.progress.timeline')}</div>
            <ProtocolStrip lanes={lanes} span={win} inset={TREND_INSET} showDates />
          </Card>
        )}
        <Card>
          <EmptyState
            icon={<Scale className="size-7" />}
            title={t('health.empty')}
            description={t('health.emptyHint')}
          />
        </Card>
      </div>
    )
  }

  const unit = units.unit(active)
  const digits = KIND_DIGITS[active]
  const label = t(`health.kinds.${active}`)
  const hasMonths = view.months.some((m) => m.mean !== null)
  const threshold = changeThreshold(active)

  const goal =
    active === 'weight' && patient?.goal_weight_kg
      ? units.show('weight', patient.goal_weight_kg)
      : null
  const toGoal = goal !== null && view.latest ? view.latest.value - goal : null

  const rows = (measurements.data ?? []).filter((m) => m.kind === active)

  function removeReading(row: MeasurementRow) {
    // Gone from the list at once; the toast is the way back.
    void writes.remove(row).catch(() => toast(t('common.error'), 'error'))
    toast(t('health.removed', { what: label }), 'info', {
      action: {
        label: t('quick.counter.undo'),
        onAction: () =>
          writes
            .addMany([
              {
                kind: row.kind,
                value: Number(row.value),
                unit: row.unit,
                measuredAt: row.measured_at,
                notes: row.notes,
              },
            ])
            .then(({ saved }) => saved)
            .then(
              () => undefined,
              () => toast(t('common.error'), 'error'),
            ),
      },
    })
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="hide-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
        {available.map((k) => (
          <Chip key={k} active={active === k} onClick={() => setKind(k)}>
            {t(`health.kinds.${k}`)}
          </Chip>
        ))}
      </div>

      <Card padded={false} className="p-3.5">
        <div className="mb-3 grid grid-cols-2 gap-x-4 gap-y-3.5">
          <Kpi
            size="sm"
            label={label}
            value={view.latest ? fmtReading(active, view.latest.value, locale) : '—'}
            unit={unit}
            caption={
              view.latest
                ? fmtRelativeDay(view.latest.at, locale)
                : t('charts.progress.noneInRangeShort')
            }
          />
          {view.change?.delta != null && view.change.baseline && (
            <Kpi
              size="sm"
              label={t('progress.bodyView.change')}
              value={
                <ChangeValue
                  kind={active}
                  delta={view.change.delta}
                  digits={digits}
                  unit={unit}
                  threshold={threshold}
                />
              }
              caption={t('progress.summary.since', {
                date: fmtDate(view.change.baseline.at, locale, 'd MMM'),
              })}
            />
          )}
          {view.trended && (
            <Kpi
              size="sm"
              label={t('progress.trend.rateLabel')}
              value={view.rate ? fmtSignedFixed(view.rate.perWeek, locale, RATE_DIGITS) : '—'}
              unit={view.rate ? `${unit}/${t('progress.trend.weekShort')}` : undefined}
              caption={view.rate ? t('progress.bodyView.paceWindow') : t('progress.trend.rateNeed')}
            />
          )}
          {goal !== null && (
            <Kpi
              size="sm"
              label={t('progress.bodyView.goal')}
              value={fmtReading(active, goal, locale)}
              unit={unit}
              caption={
                toGoal === null
                  ? undefined
                  : Math.abs(toGoal) < 0.05
                    ? t('progress.bodyView.goalReached')
                    : t('progress.bodyView.goalGap', {
                        n: `${fmtReading(active, Math.abs(toGoal), locale)} ${unit}`,
                      })
              }
            />
          )}
        </div>

        {lanes.length > 0 && (
          <div className="mb-1">
            <ProtocolStrip lanes={lanes} span={win} inset={TREND_INSET} />
          </div>
        )}
        {view.pts.length > 0 ? (
          <TrendChart
            points={view.pts}
            unit={unit}
            digits={digits}
            xDomain={xDomain}
            guides={marks.guides}
            shades={marks.shades}
            target={goal ?? undefined}
            smooth={view.smooth}
            smoothLabel={t('progress.trend.label')}
            label={label}
          />
        ) : (
          <p className="py-6 text-center text-[13px] text-muted">
            {t('charts.progress.noneInRangeShort')}
          </p>
        )}
        {view.smooth && (
          <p className="mt-2 text-[11.5px] text-muted">{t('progress.trend.legend')}</p>
        )}
      </Card>

      {hasMonths && (
        <Card
          padded={false}
          className="p-3.5"
          title={t('charts.progress.monthly')}
          subtitle={t('charts.progress.monthlyHintBody')}
        >
          <MonthTable
            lanes={lanes}
            rows={[
              {
                kind: active,
                label: `${label} (${unit})`,
                months: view.months,
                digits,
                threshold,
              },
            ]}
          />
        </Card>
      )}

      <Card
        padded={false}
        className="px-4 pb-1 pt-3.5"
        title={t('progress.bodyView.records')}
        subtitle={
          rows.length > LISTED ? t('progress.bodyView.showingLast', { count: LISTED }) : undefined
        }
      >
        <ul className="divide-y divide-line">
          {rows.slice(0, LISTED).map((m) => (
            <li key={m.id}>
              <Row
                title={
                  <span className="tabular">
                    {fmtReading(m.kind, units.show(m.kind, Number(m.value)), locale)}{' '}
                    {units.unit(m.kind)}
                  </span>
                }
                subtitle={fmtDateTime(new Date(m.measured_at), locale)}
                trailing={
                  !readOnly && (
                    <RowDelete
                      label={t('health.deleteAria', {
                        what: label,
                        when: fmtDateTime(new Date(m.measured_at), locale),
                      })}
                      onClick={() => removeReading(m)}
                    />
                  )
                }
              />
            </li>
          ))}
        </ul>
      </Card>
    </div>
  )
}
