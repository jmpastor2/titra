import { Gauge } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { usePatientScope } from '@/app/scope'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState, Skeleton } from '@/components/ui/primitives'
import { compoundColor } from '@/content/substanceColor'
import type { MeasurementKind } from '@/data/database.types'
import { useMeasurements } from '@/data/hooks'
import { CheckInSheet } from '@/features/checkin/CheckInSheet'
import { WELLBEING } from '@/features/checkin/wellbeing'
import { TREND_INSET } from '@/features/exposure/chartScale'
import { TrendChart } from '@/features/exposure/TrendChart'
import { fmtNumber, fmtRelativeDay } from '@/lib/format'
import { useLocale } from '@/lib/useLocale'
import { wellbeingBaseline } from './baseline'
import { BaselineCard } from './BaselineCard'
import {
  changeSince,
  inWindow,
  laneMarks,
  monthlyMeans,
  sortPoints,
  type ProgressScope,
  type TimePoint,
} from './progress'
import { ChangeValue, MonthTable, ProtocolStrip, type MonthRow } from './ProgressCharts'

/** Score changes smaller than this read as "no change". */
const SCORE_THRESHOLD = 0.5

/**
 * Wellbeing over the chosen range: the protocol timeline on top, where the person started, one
 * small multiple per dimension on a shared 0–10 axis and time window (each with its change over
 * the range), then the month-by-month means.
 */
export function WellbeingTab({ scope }: { scope: ProgressScope }) {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const { patientId, readOnly } = usePatientScope()
  const measurements = useMeasurements(patientId, 365)
  const [open, setOpen] = useState(false)
  const { window: win, lanes, since } = scope

  const all = useMemo(() => {
    const m = new Map<MeasurementKind, TimePoint[]>()
    for (const row of measurements.data ?? []) {
      if (!WELLBEING.includes(row.kind)) continue
      const list = m.get(row.kind) ?? []
      list.push({ at: new Date(row.measured_at), value: Number(row.value) })
      m.set(row.kind, list)
    }
    return m
  }, [measurements.data])

  // The first check-in ever is the baseline, whatever range is in view.
  const baseline = useMemo(() => wellbeingBaseline(all, WELLBEING), [all])

  const series = useMemo(
    () =>
      WELLBEING.flatMap((kind) => {
        const pts = sortPoints(inWindow(all.get(kind) ?? [], win))
        const last = pts[pts.length - 1]
        if (!last) return []
        return [
          {
            kind,
            pts,
            last,
            change: changeSince(pts, since),
            months: monthlyMeans(pts, win),
          },
        ]
      }),
    [all, win, since],
  )

  const marks = useMemo(() => laneMarks(lanes, compoundColor), [lanes])
  const xDomain = useMemo<[number, number]>(() => [win.from.getTime(), win.to.getTime()], [win])
  const monthRows = useMemo<MonthRow[]>(
    () =>
      series.map((s) => ({
        kind: s.kind,
        label: t(`health.kinds.${s.kind}`),
        months: s.months,
        digits: 1,
        scaleMax: 10,
        threshold: SCORE_THRESHOLD,
      })),
    [series, t],
  )

  const hasHistory = baseline.some((b) => b.delta !== null)
  const checkInButton = !readOnly && (
    <Button variant="soft" leading={<Gauge className="size-4" />} onClick={() => setOpen(true)}>
      {t('checkin.title')}
    </Button>
  )

  return (
    <div className="flex flex-col gap-3">
      <Card padded={false} className="p-3.5">
        <div className="spec mb-2">{t('charts.progress.timeline')}</div>
        <ProtocolStrip lanes={lanes} span={win} inset={TREND_INSET} showDates />
      </Card>

      {baseline.length > 0 && <BaselineCard rows={baseline} />}

      {measurements.isPending ? (
        <Card>
          <Skeleton className="h-32 w-full" />
        </Card>
      ) : series.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Gauge className="size-7" />}
            title={
              WELLBEING.some((k) => all.has(k))
                ? t('charts.progress.noneInRange')
                : t('checkin.emptyTitle')
            }
            description={t('checkin.emptyHint')}
            action={
              !readOnly && <Button onClick={() => setOpen(true)}>{t('checkin.title')}</Button>
            }
          />
        </Card>
      ) : !hasHistory ? (
        // One check-in day so far: the baseline card says it all; charts of single dots do not.
        checkInButton
      ) : (
        <>
          {checkInButton}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {series.map((s) => (
              <Card key={s.kind} padded={false} className="p-3.5">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="spec">{t(`health.kinds.${s.kind}`)}</div>
                    <div className="readout mt-1 text-[24px] font-semibold leading-none">
                      {fmtNumber(s.last.value, locale, 0)}
                      <span className="text-[12px] text-muted">/10</span>
                    </div>
                  </div>
                  <div className="text-right">
                    {s.change && (
                      <ChangeValue
                        kind={s.kind}
                        delta={s.change.delta}
                        digits={1}
                        threshold={SCORE_THRESHOLD}
                        trim
                        className="text-[13px]"
                      />
                    )}
                    <div className="text-[11px] text-muted">
                      {fmtRelativeDay(s.last.at, locale)}
                    </div>
                  </div>
                </div>
                <TrendChart
                  points={s.pts}
                  unit="/10"
                  height={96}
                  digits={0}
                  range={[0, 10]}
                  xDomain={xDomain}
                  guides={marks.guides}
                  shades={marks.shades}
                />
              </Card>
            ))}
          </div>

          {monthRows.some((r) => r.months.some((m) => m.mean !== null)) && (
            <Card
              padded={false}
              className="p-3.5"
              title={t('charts.progress.monthly')}
              subtitle={t('charts.progress.monthlyHint')}
            >
              <MonthTable rows={monthRows} lanes={lanes} />
            </Card>
          )}
          <p className="px-1 text-[11.5px] text-muted">{t('charts.progress.deltaHint')}</p>
        </>
      )}
      <CheckInSheet open={open} onClose={() => setOpen(false)} />
    </div>
  )
}
