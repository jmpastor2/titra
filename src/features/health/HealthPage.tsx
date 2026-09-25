import { Activity, Dumbbell, FlaskConical, Plus, Scale, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import { usePatientScope } from '@/app/scope'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import {
  Badge,
  EmptyState,
  ProgressRing,
  Row,
  Segmented,
  Skeleton,
  Stat,
} from '@/components/ui/primitives'
import { compoundColor } from '@/content/substanceColor'
import type { LabResultRow, MeasurementKind } from '@/data/database.types'
import {
  useDeleteMeasurement,
  useDeleteSymptom,
  useLabs,
  useMeasurements,
  useProtocols,
  useSymptoms,
} from '@/data/hooks'
import { compositionTrend, proteinTarget, rateFlag } from '@/domain/lean/leanMass'
import { TREND_INSET } from '@/features/exposure/chartScale'
import { TrendChart } from '@/features/exposure/TrendChart'
import { LogSymptomSheet } from '@/features/symptoms/LogSymptomSheet'
import { OutlookCard } from '@/features/outlook/OutlookPage'
import { fmtDate, fmtDateTime, fmtNumber, fmtRelativeDay } from '@/lib/format'
import { useLocale } from '@/lib/useLocale'
import { AddLabSheet } from './AddLabSheet'
import { KIND_DIGITS, KIND_UNIT } from './kinds'
import { LogMeasurementSheet } from './LogMeasurementSheet'
import {
  changeSince,
  inWindow,
  laneMarks,
  monthlyMeans,
  progressScope,
  sortPoints,
  type ProgressRange,
  type ProgressScope,
} from './progress'
import { ChangeValue, MonthTable, ProtocolStrip, RangePicker } from './ProgressCharts'
import { WellbeingTab } from './WellbeingTab'

type Tab = 'wellbeing' | 'body' | 'symptoms' | 'labs'

const CHARTABLE: MeasurementKind[] = [
  'weight',
  'waist',
  'body_fat_pct',
  'lean_mass',
  'glucose_fasting',
  'hba1c',
  'bp_systolic',
  'heart_rate',
]

/** `embedded` renders the page inside a shared, read-only view without its header. */
export function HealthPage({ embedded = false }: { embedded?: boolean }) {
  const { t } = useTranslation()
  const [params, setParams] = useSearchParams()
  const initial = (params.get('tab') as Tab | null) ?? 'wellbeing'
  const [tab, setTab] = useState<Tab>(initial)
  const [sheet, setSheet] = useState<'measure' | 'symptom' | 'lab' | null>(null)
  const { patientId, readOnly } = usePatientScope()
  const protocols = useProtocols(patientId)
  const [now] = useState(() => new Date())
  const [pickedRange, setRange] = useState<ProgressRange | null>(null)
  const scope = useMemo(() => {
    const rows = protocols.data ?? []
    const hasCycle = rows.some((p) => p.status === 'active')
    const range = pickedRange ?? (hasCycle ? 'cycle' : '3m')
    return progressScope(range === 'cycle' && !hasCycle ? '3m' : range, now, rows)
  }, [protocols.data, pickedRange, now])

  function changeTab(next: Tab) {
    setTab(next)
    setParams(next === 'wellbeing' ? {} : { tab: next }, { replace: true })
  }

  return (
    <div>
      {!embedded && (
        <PageHeader
          eyebrow={t('progress.eyebrow')}
          title={t('progress.title')}
          large
          action={
            !readOnly && (
              <Button
                size="sm"
                leading={<Plus className="size-4" />}
                onClick={() =>
                  setSheet(tab === 'symptoms' ? 'symptom' : tab === 'labs' ? 'lab' : 'measure')
                }
              >
                {t('common.add')}
              </Button>
            )
          }
        />
      )}

      {!embedded && !readOnly && (
        <div className="mb-3">
          <OutlookCard />
        </div>
      )}

      <Segmented<Tab>
        value={tab}
        onChange={changeTab}
        size="sm"
        className="mb-3"
        options={[
          { value: 'wellbeing', label: t('progress.wellbeing') },
          { value: 'body', label: t('progress.body') },
          { value: 'symptoms', label: t('symptoms.title') },
          { value: 'labs', label: t('health.labs') },
        ]}
      />

      {(tab === 'wellbeing' || tab === 'body') && (
        <div className="mb-3">
          <RangePicker value={scope.range} onChange={setRange} hasCycle={scope.cycle !== null} />
        </div>
      )}

      {tab === 'wellbeing' && <WellbeingTab scope={scope} />}
      {tab === 'body' && (
        <div className="flex flex-col gap-6">
          <MeasurementsTab scope={scope} />
          <LeanTab />
        </div>
      )}
      {tab === 'symptoms' && <SymptomsTab />}
      {tab === 'labs' && <LabsTab />}

      <LogMeasurementSheet open={sheet === 'measure'} onClose={() => setSheet(null)} />
      <LogSymptomSheet open={sheet === 'symptom'} onClose={() => setSheet(null)} />
      <AddLabSheet open={sheet === 'lab'} onClose={() => setSheet(null)} />
    </div>
  )
}

/** Kind-specific threshold under which a change reads as flat. */
function changeThreshold(kind: MeasurementKind): number {
  return KIND_DIGITS[kind] === 0 ? 1 : 0.2
}

function MeasurementsTab({ scope }: { scope: ProgressScope }) {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const { patientId, patient, readOnly } = usePatientScope()
  const measurements = useMeasurements(patientId, 365)
  const del = useDeleteMeasurement(patientId)
  const [kind, setKind] = useState<MeasurementKind>('weight')
  const { window: win, lanes, since } = scope

  const byKind = useMemo(() => {
    const m = new Map<MeasurementKind, { at: Date; value: number }[]>()
    for (const row of measurements.data ?? []) {
      const list = m.get(row.kind) ?? []
      list.push({ at: new Date(row.measured_at), value: Number(row.value) })
      m.set(row.kind, list)
    }
    return m
  }, [measurements.data])

  const available = useMemo(
    () => CHARTABLE.filter((k) => (byKind.get(k)?.length ?? 0) > 0),
    [byKind],
  )
  const active: MeasurementKind | undefined = available.includes(kind) ? kind : available[0]

  const view = useMemo(() => {
    if (!active) return null
    const pts = sortPoints(inWindow(byKind.get(active) ?? [], win))
    const days = Math.max(7, (win.to.getTime() - win.from.getTime()) / 86_400_000)
    return {
      pts,
      latest: pts[pts.length - 1] ?? null,
      change: changeSince(pts, since),
      months: monthlyMeans(pts, win),
      trend:
        active === 'weight'
          ? compositionTrend(
              pts.map((p) => ({ at: p.at, kg: p.value })),
              days,
            )
          : null,
    }
  }, [active, byKind, win, since])

  const marks = useMemo(() => laneMarks(lanes, compoundColor), [lanes])
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

  const unit = KIND_UNIT[active]
  const digits = KIND_DIGITS[active]
  const hasMonths = view.months.filter((m) => m.mean !== null).length > 0

  return (
    <div className="flex flex-col gap-3">
      <div className="hide-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
        {available.map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setKind(k)}
            aria-pressed={active === k}
            className={
              active === k
                ? 'shrink-0 rounded-full bg-ink px-3 py-1.5 text-[13px] font-semibold text-canvas'
                : 'shrink-0 rounded-full border border-line bg-panel px-3 py-1.5 text-[13px] text-ink-2'
            }
          >
            {t(`health.kinds.${k}`)}
          </button>
        ))}
      </div>

      <Card padded={false} className="p-3.5">
        <div className="mb-3 flex flex-wrap gap-x-6 gap-y-2">
          <Stat
            label={t(`health.kinds.${active}`)}
            value={view.latest ? fmtNumber(view.latest.value, locale, digits) : '—'}
            unit={unit}
            hint={
              view.latest
                ? fmtRelativeDay(view.latest.at, locale)
                : t('charts.progress.noneInRangeShort')
            }
          />
          {view.change && (
            <div className="flex flex-col">
              <span className="spec">
                {scope.range === 'cycle' && scope.cycle
                  ? t('charts.progress.changeCycle')
                  : t('charts.progress.changeRange')}
              </span>
              <ChangeValue
                kind={active}
                delta={view.change.delta}
                digits={digits}
                unit={unit}
                threshold={changeThreshold(active)}
                className="mt-1 text-[22px] leading-none"
              />
              {view.trend && (
                <span className="mt-1.5 text-[12.5px] text-muted">
                  {fmtNumber(view.trend.kgPerWeek, locale, 2)} kg/{t('common.week').toLowerCase()}
                </span>
              )}
            </div>
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
            target={active === 'weight' ? (patient?.goal_weight_kg ?? undefined) : undefined}
          />
        ) : (
          <p className="py-6 text-center text-[13px] text-muted">
            {t('charts.progress.noneInRangeShort')}
          </p>
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
                label: t(`health.kinds.${active}`),
                months: view.months,
                digits,
                unit,
                threshold: changeThreshold(active),
              },
            ]}
          />
        </Card>
      )}

      <Card padded={false} className="px-4">
        <ul className="divide-y divide-line">
          {(measurements.data ?? [])
            .filter((m) => m.kind === active)
            .slice(0, 30)
            .map((m) => (
              <li key={m.id}>
                <Row
                  title={
                    <span className="tabular">
                      {fmtNumber(Number(m.value), locale, KIND_DIGITS[m.kind])} {m.unit}
                    </span>
                  }
                  subtitle={fmtDateTime(new Date(m.measured_at), locale)}
                  trailing={
                    !readOnly && (
                      <button
                        type="button"
                        aria-label={t('common.delete')}
                        onClick={async () => {
                          if (!window.confirm(t('common.deleteConfirm'))) return
                          await del.mutateAsync(m.id)
                        }}
                        className="grid size-9 place-items-center rounded-full text-muted hover:bg-danger-soft hover:text-danger"
                      >
                        <Trash2 className="size-4" />
                      </button>
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

function LeanTab() {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const { patientId, patient, readOnly } = usePatientScope()
  const measurements = useMeasurements(patientId, 120)
  const [sheet, setSheet] = useState<MeasurementKind | null>(null)
  const [now] = useState(() => new Date())

  const rows = measurements.data ?? []
  const weights = rows
    .filter((m) => m.kind === 'weight')
    .map((m) => ({ at: new Date(m.measured_at), kg: Number(m.value) }))
  const leans = rows.filter((m) => m.kind === 'lean_mass')
  const withLean = weights.map((w) => {
    const l = leans.find(
      (m) => Math.abs(new Date(m.measured_at).getTime() - w.at.getTime()) < 86_400_000,
    )
    return l ? { ...w, leanKg: Number(l.value) } : w
  })
  const trend = compositionTrend(withLean, 90)
  const currentKg = weights[0]?.kg ?? patient?.goal_weight_kg ?? 0
  const target = proteinTarget(currentKg, patient?.protein_g_per_kg ?? 1.6)

  const today = now.toDateString()
  const proteinToday = rows
    .filter((m) => m.kind === 'protein_g' && new Date(m.measured_at).toDateString() === today)
    .reduce((s, m) => s + Number(m.value), 0)

  const weekAgo = now.getTime() - 7 * 86_400_000
  const sessions = rows.filter(
    (m) => m.kind === 'resistance_session' && new Date(m.measured_at).getTime() > weekAgo,
  ).length

  const flag = trend ? rateFlag(trend.kgPerWeek, currentKg) : null

  return (
    <div className="flex flex-col gap-3">
      <Card tone="signal">
        <p className="text-[13.5px] leading-relaxed text-ink-2">{t('lean.intro')}</p>
      </Card>

      <Card
        title={t('lean.proteinTarget')}
        subtitle={t('lean.proteinHint', {
          gPerKg: fmtNumber(Number(patient?.protein_g_per_kg ?? 1.6), locale, 1),
        })}
      >
        <div className="flex items-center gap-4">
          <ProgressRing fraction={target > 0 ? proteinToday / target : 0} size={80} stroke={8}>
            <div className="text-center leading-none">
              <div className="tabular text-[17px] font-bold">{Math.round(proteinToday)}</div>
              <div className="text-[9.5px] font-semibold uppercase tracking-wide text-muted">g</div>
            </div>
          </ProgressRing>
          <div className="flex-1">
            <Stat
              label={t('lean.proteinToday')}
              value={`${Math.round(proteinToday)} / ${target}`}
              unit="g"
              tone="brand"
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

      <Card title={t('lean.sessionsWeek')} subtitle={t('lean.sessionsTarget', { n: 2 })}>
        <div className="flex items-center justify-between">
          <Stat
            label=""
            value={sessions}
            tone={sessions >= 2 ? 'ok' : 'warn'}
            hint={<Dumbbell className="size-4" />}
          />
          {!readOnly && (
            <Button size="sm" variant="soft" onClick={() => setSheet('resistance_session')}>
              {t('lean.logSession')}
            </Button>
          )}
        </div>
      </Card>

      <Card title={t('lean.rate')}>
        {trend ? (
          <>
            <div className="flex items-baseline gap-2">
              <span className="tabular text-[24px] font-bold">
                {fmtNumber(trend.kgPerWeek, locale, 2)}
              </span>
              <span className="text-[13px] text-muted">kg / {t('common.week').toLowerCase()}</span>
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
            {trend.leanShare !== null && (
              <p className="mt-2 text-[13.5px] text-ink-2">
                {t('lean.leanShare', { pct: `${Math.round(trend.leanShare * 100)} %` })}
              </p>
            )}
          </>
        ) : (
          <p className="text-[13px] text-muted">{t('lean.needTwoWeights')}</p>
        )}
      </Card>

      <LogMeasurementSheet
        open={sheet !== null}
        onClose={() => setSheet(null)}
        defaultKind={sheet ?? 'protein_g'}
      />
    </div>
  )
}

function SymptomsTab() {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const { patientId, readOnly } = usePatientScope()
  const symptoms = useSymptoms(patientId, 180)
  const del = useDeleteSymptom(patientId)
  const list = symptoms.data ?? []

  if (list.length === 0) {
    return (
      <Card>
        <EmptyState
          icon={<Activity className="size-7" />}
          title={t('symptoms.empty')}
          description={t('symptoms.emptyHint')}
        />
      </Card>
    )
  }

  return (
    <Card padded={false} className="px-4">
      <ul className="divide-y divide-line">
        {list.map((s) => (
          <li key={s.id}>
            <Row
              title={t(`symptoms.kinds.${s.kind}`)}
              subtitle={
                <>
                  {fmtDateTime(new Date(s.occurred_at), locale)}
                  {s.notes ? ` · ${s.notes}` : ''}
                </>
              }
              trailing={
                <span className="flex items-center gap-2">
                  <Badge tone={s.severity >= 7 ? 'danger' : s.severity >= 4 ? 'warn' : 'ok'}>
                    {s.severity}/10
                  </Badge>
                  {!readOnly && (
                    <button
                      type="button"
                      aria-label={t('common.delete')}
                      onClick={async () => {
                        if (!window.confirm(t('common.deleteConfirm'))) return
                        await del.mutateAsync(s.id)
                      }}
                      className="grid size-8 place-items-center rounded-full text-muted hover:bg-danger-soft hover:text-danger"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  )}
                </span>
              }
            />
          </li>
        ))}
      </ul>
    </Card>
  )
}

function LabsTab() {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const { patientId } = usePatientScope()
  const labs = useLabs(patientId)
  const list = labs.data

  const byAnalyte = useMemo(() => {
    const m = new Map<string, LabResultRow[]>()
    for (const l of list ?? []) m.set(l.analyte, [...(m.get(l.analyte) ?? []), l])
    return [...m.entries()]
  }, [list])

  if (!list || list.length === 0) {
    return (
      <Card>
        <EmptyState
          icon={<FlaskConical className="size-7" />}
          title={t('health.labsEmpty')}
          description={t('health.labsEmptyHint')}
        />
      </Card>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {byAnalyte.map(([analyte, rows]) => {
        const latest = rows[0]!
        const out =
          (latest.ref_low !== null && Number(latest.value) < Number(latest.ref_low)) ||
          (latest.ref_high !== null && Number(latest.value) > Number(latest.ref_high))
        return (
          <Card key={analyte} title={analyte}>
            <div className="mb-2 flex items-baseline gap-2">
              <span className="tabular text-[24px] font-bold">
                {fmtNumber(Number(latest.value), locale, 2)}
              </span>
              <span className="text-[13px] text-muted">{latest.unit}</span>
              {out && <Badge tone="warn">{t('health.outOfRange')}</Badge>}
              <span className="ml-auto text-[12px] text-muted">
                {fmtDate(new Date(latest.drawn_at), locale)}
              </span>
            </div>
            {rows.length > 1 && (
              <TrendChart
                points={rows.map((r) => ({ at: new Date(r.drawn_at), value: Number(r.value) }))}
                unit={latest.unit}
                digits={2}
                height={140}
                refRange={{ low: latest.ref_low, high: latest.ref_high }}
              />
            )}
          </Card>
        )
      })}
    </div>
  )
}
