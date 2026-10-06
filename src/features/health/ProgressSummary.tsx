/**
 * "Resumen": the top of Progress, one question at a time. Is it working (weight, waist, body fat),
 * am I on track (adherence, streaks, the calendar and what has been taken of each compound) and
 * what changed this week. Everything is computed from the person's own records.
 */
import { subDays } from 'date-fns'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { usePatientScope } from '@/app/scope'
import { Kpi } from '@/components/kpi/Kpi'
import { Ticks } from '@/components/kpi/Ticks'
import { SectionTitle, Skeleton } from '@/components/ui/primitives'
import type { MeasurementKind } from '@/data/database.types'
import { useDoses, useMeasurements, useProtocols, useSymptoms } from '@/data/hooks'
import { WELLBEING } from '@/features/checkin/wellbeing'
import { useLocale } from '@/lib/useLocale'
import { useNow } from '@/lib/useNow'
import { ConsistencyCard } from './ConsistencyCard'
import {
  activeByCompound,
  adherenceDays,
  adherenceTotal,
  daySet,
  dayStrip,
  daysSinceLast,
  daysWithRecord,
  doseStreaks,
  presenceMarks,
} from './consistency'
import { CumulativeCard } from './CumulativeCard'
import { cumulativeDoses } from './cumulative'
import { heatGrid } from './heatmap'
import { LogMeasurementSheet } from './LogMeasurementSheet'
import { cycleStart, sortPoints, type TimePoint } from './progress'
import { BodyTile, Tile, type BodyTileKind } from './SummaryTiles'
import { baselineChange, ema, weeklyRate } from './trend'
import { WeekCard } from './WeekCard'
import { useBodyUnits } from './units'
import { weekChanges } from './weekly'

const STRIP_DAYS = 14
const SPARK_DAYS = 60
/** Days of doses the streaks and the calendar are read from: the best streak is the best of these. */
const DOSE_HISTORY_DAYS = 180

export function ProgressSummary() {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const { patientId, patient, readOnly } = usePatientScope()
  const measurements = useMeasurements(patientId, 365)
  const doses = useDoses(patientId, 365)
  const protocols = useProtocols(patientId)
  const symptoms = useSymptoms(patientId, 180)
  const now = useNow(5 * 60_000)
  const units = useBodyUnits()
  const [sheet, setSheet] = useState<BodyTileKind | null>(null)

  // Body readings are kept in the unit the person uses from here on, so every number, trend
  // and change on the screen agrees.
  const records = useMemo(() => {
    const body: Record<BodyTileKind, TimePoint[]> = { weight: [], waist: [], body_fat_pct: [] }
    const scores = new Map<MeasurementKind, TimePoint[]>()
    const checkIns: Date[] = []
    for (const row of measurements.data ?? []) {
      const at = new Date(row.measured_at)
      const stored = Number(row.value)
      if (row.kind === 'weight' || row.kind === 'waist' || row.kind === 'body_fat_pct') {
        body[row.kind].push({ at, value: units.show(row.kind, stored) })
      } else if (WELLBEING.includes(row.kind)) {
        scores.set(row.kind, [...(scores.get(row.kind) ?? []), { at, value: stored }])
        checkIns.push(at)
      }
    }
    return {
      weight: sortPoints(body.weight),
      waist: sortPoints(body.waist),
      bodyFat: sortPoints(body.body_fat_pct),
      scores,
      checkInDays: daySet(checkIns),
      weighInDays: daySet(body.weight.map((p) => p.at)),
    }
  }, [measurements.data, units])

  const body = useMemo(() => {
    const rows = protocols.data ?? []
    const since = cycleStart(rows) ?? subDays(now, 90)
    const sparkFrom = subDays(now, SPARK_DAYS)
    const trend = (pts: TimePoint[]) => ({
      change: baselineChange(pts, since),
      rate: weeklyRate(pts),
      spark: ema(pts.filter((p) => p.at >= sparkFrom)).map((p) => p.value),
    })
    return {
      weight: trend(records.weight),
      waist: trend(records.waist),
      bodyFat: trend(records.bodyFat),
    }
  }, [records, protocols.data, now])

  const dosing = useMemo(() => {
    const rows = protocols.data ?? []
    const list = doses.data ?? []
    const history = adherenceDays(rows, list, now, DOSE_HISTORY_DAYS)
    return {
      active: activeByCompound(rows).length,
      a28: adherenceTotal(rows, list, now, 28),
      prev28: adherenceTotal(rows, list, subDays(now, 28), 28),
      grid: heatGrid(history, now),
      streaks: doseStreaks(history),
    }
  }, [protocols.data, doses.data, now])

  const totals = useMemo(
    () => cumulativeDoses(doses.data ?? [], protocols.data ?? [], now),
    [doses.data, protocols.data, now],
  )

  const weighIns = useMemo(
    () => ({
      count: daysWithRecord(records.weighInDays, now, STRIP_DAYS),
      ago: daysSinceLast(records.weighInDays, now),
      strip: presenceMarks(dayStrip(records.weighInDays, now, STRIP_DAYS), now),
    }),
    [records, now],
  )

  const items = useMemo(
    () =>
      weekChanges({
        now,
        weight: records.weight,
        waist: records.waist,
        scores: records.scores,
        checkInDays: records.checkInDays,
        symptoms: (symptoms.data ?? []).map((s) => ({ at: new Date(s.occurred_at), kind: s.kind })),
        protocols: protocols.data ?? [],
      }),
    [now, records, symptoms.data, protocols.data],
  )

  const pending = measurements.isPending || protocols.isPending || doses.isPending
  const lastAgo = (days: number | null) =>
    days === null
      ? t('progress.summary.last.never')
      : days === 0
        ? t('progress.summary.last.today')
        : days === 1
          ? t('progress.summary.last.yesterday')
          : t('progress.summary.last.ago', { count: days })
  const goal = patient?.goal_weight_kg ? units.show('weight', patient.goal_weight_kg) : null
  const logger = (kind: BodyTileKind) => (readOnly ? undefined : () => setSheet(kind))
  // Without a single weigh-in there is no record to count: the waist takes the whole row.
  const alone = records.bodyFat.length === 0 && weighIns.ago === null

  return (
    <section aria-labelledby="progress-summary" className="mb-4">
      <SectionTitle>
        <span id="progress-summary">{t('progress.summary.title')}</span>
      </SectionTitle>

      {pending ? (
        // The shape of what comes, so nothing jumps when the numbers arrive.
        <div className="flex flex-col gap-2.5" aria-busy>
          <Skeleton className="h-[196px]" />
          <div className="grid grid-cols-2 gap-2.5">
            <Skeleton className="h-[124px]" />
            <Skeleton className="h-[124px]" />
          </div>
          <Skeleton className="h-[380px]" />
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          <div className="grid grid-cols-2 gap-2.5">
            <BodyTile
              wide
              kind="weight"
              units={units}
              label={t('progress.summary.weight')}
              empty={t('progress.summary.noWeight')}
              data={body.weight}
              locale={locale}
              color="var(--signal)"
              onLog={logger('weight')}
              goal={goal}
            />
            <BodyTile
              kind="waist"
              units={units}
              label={t('progress.summary.waist')}
              empty={t('progress.summary.noWaist')}
              data={body.waist}
              locale={locale}
              color="var(--accent)"
              onLog={logger('waist')}
              className={alone ? 'col-span-2' : undefined}
            />
            {records.bodyFat.length > 0 ? (
              <BodyTile
                kind="body_fat_pct"
                units={units}
                label={t('progress.summary.bodyFat')}
                empty={t('progress.summary.noBodyFat')}
                data={body.bodyFat}
                locale={locale}
                color="var(--chart-2)"
                onLog={logger('body_fat_pct')}
              />
            ) : (
              !alone && (
                <Tile>
                  <Kpi
                    label={t('progress.summary.weighIns')}
                    value={String(weighIns.count)}
                    unit={t('progress.summary.ofDays', { n: STRIP_DAYS })}
                    size="sm"
                    caption={lastAgo(weighIns.ago)}
                  />
                  <Ticks
                    className="mt-auto pt-3"
                    height={16}
                    cells={weighIns.strip.map((c) => c.mark)}
                    label={t('progress.summary.stripDays', {
                      n: weighIns.count,
                      total: STRIP_DAYS,
                    })}
                  />
                </Tile>
              )
            )}
          </div>

          <ConsistencyCard
            grid={dosing.grid}
            streaks={dosing.streaks}
            last28={dosing.a28}
            prev28={dosing.prev28}
            hasProtocols={dosing.active > 0}
          />
          <CumulativeCard totals={totals} />
        </div>
      )}

      {!pending && <WeekCard items={items} />}

      <LogMeasurementSheet
        open={sheet !== null}
        onClose={() => setSheet(null)}
        defaultKind={sheet ?? 'weight'}
      />
    </section>
  )
}
