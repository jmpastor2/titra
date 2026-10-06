/**
 * "Resumen": the top of Progress, one question at a time. Is it working (weight, waist, body fat),
 * am I on track (the adherence calendar, the streak, what has been taken of each compound), how do
 * I feel (the check-in) and what changed this week. Everything is computed from the user's own
 * records.
 */
import { addDays, startOfDay, subDays } from 'date-fns'
import { Gauge } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { usePatientScope } from '@/app/scope'
import { Button } from '@/components/ui/Button'
import { SectionTitle, Skeleton } from '@/components/ui/primitives'
import type { MeasurementKind } from '@/data/database.types'
import { useDoses, useMeasurements, useProtocols, useSymptoms } from '@/data/hooks'
import { CheckInSheet } from '@/features/checkin/CheckInSheet'
import { WELLBEING } from '@/features/checkin/wellbeing'
import { summariseWeek, weekPlanVsActual } from '@/features/doses/week'
import { useLocale } from '@/lib/useLocale'
import { useNow } from '@/lib/useNow'
import { ConsistencyCard } from './ConsistencyCard'
import {
  activeByCompound,
  adherenceDays,
  adherenceTotal,
  CHECKIN_STALE_DAYS,
  daySet,
  dayStrip,
  daysSinceLast,
  daysWithRecord,
  doseStreaks,
  presenceMarks,
  streak,
} from './consistency'
import { CumulativeCard } from './CumulativeCard'
import { cumulativeDoses } from './cumulative'
import { heatGrid } from './heatmap'
import { LogMeasurementSheet } from './LogMeasurementSheet'
import { cycleStart, sortPoints, type TimePoint } from './progress'
import { DayStrip } from './Spark'
import { BodyTile, Readout, Tile, type BodyTileKind } from './SummaryTiles'
import { baselineChange, ema, weeklyRate } from './trend'
import { WeekCard } from './WeekCard'
import { useBodyUnits } from './units'
import { weekChanges } from './weekly'

const STRIP_DAYS = 14
const SPARK_DAYS = 60
/** Days of doses the streaks and the calendar are read from: the best streak is the best of these. */
const DOSE_HISTORY_DAYS = 180

type SheetKind = 'checkin' | 'weight' | 'waist' | 'body_fat_pct'

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
  const [sheet, setSheet] = useState<SheetKind | null>(null)

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
    const active = activeByCompound(rows)
    const history = adherenceDays(rows, list, now, DOSE_HISTORY_DAYS)
    const week = summariseWeek(weekPlanVsActual(active, list, startOfDay(addDays(now, -6)), now))
    return {
      active: active.length,
      a7: adherenceTotal(rows, list, now, 7),
      a28: adherenceTotal(rows, list, now, 28),
      grid: heatGrid(history, now),
      streaks: doseStreaks(history),
      timing: week.taken > 0 ? { onTime: week.onTime, offTime: week.offTime } : null,
    }
  }, [protocols.data, doses.data, now])

  const totals = useMemo(
    () => cumulativeDoses(doses.data ?? [], protocols.data ?? [], now),
    [doses.data, protocols.data, now],
  )

  const logging = useMemo(
    () => ({
      checkInStreak: streak(records.checkInDays, now),
      checkInAgo: daysSinceLast(records.checkInDays, now),
      checkInStrip: dayStrip(records.checkInDays, now, STRIP_DAYS),
      weighIns: daysWithRecord(records.weighInDays, now, STRIP_DAYS),
      weighInAgo: daysSinceLast(records.weighInDays, now),
      weighInStrip: dayStrip(records.weighInDays, now, STRIP_DAYS),
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
        adherence: dosing.a7,
        timing: dosing.timing,
        symptoms: (symptoms.data ?? []).map((s) => ({ at: new Date(s.occurred_at), kind: s.kind })),
        protocols: protocols.data ?? [],
      }),
    [now, records, dosing, symptoms.data, protocols.data],
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
  const checkInStale = logging.checkInAgo === null || logging.checkInAgo >= CHECKIN_STALE_DAYS
  const goal = patient?.goal_weight_kg ? units.show('weight', patient.goal_weight_kg) : null
  const logger = (kind: BodyTileKind) => (readOnly ? undefined : () => setSheet(kind))

  return (
    <section aria-labelledby="progress-summary" className="mb-4">
      <SectionTitle index="01">
        <span id="progress-summary">{t('progress.summary.title')}</span>
      </SectionTitle>

      {pending ? (
        // The shape of what comes, so nothing jumps when the numbers arrive.
        <div className="flex flex-col gap-2.5" aria-busy>
          <Skeleton className="h-[176px]" />
          <div className="grid grid-cols-2 gap-2.5">
            <Skeleton className="h-[112px]" />
            <Skeleton className="h-[112px]" />
          </div>
          <Skeleton className="h-[360px]" />
          <Skeleton className="h-[132px]" />
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
              rateHint={t('progress.trend.rateNeed')}
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
              <Tile label={t('progress.summary.weighIns')}>
                <Readout value={String(logging.weighIns)} unit={`/${STRIP_DAYS}`} tight />
                <p className="mt-1 text-[11.5px] leading-snug text-muted">
                  {lastAgo(logging.weighInAgo)}
                </p>
                <DayStrip
                  className="mt-auto pt-2.5"
                  cells={presenceMarks(logging.weighInStrip, now)}
                  label={t('progress.summary.stripDays', {
                    n: logging.weighIns,
                    total: STRIP_DAYS,
                  })}
                />
              </Tile>
            )}
          </div>

          <ConsistencyCard
            grid={dosing.grid}
            streaks={dosing.streaks}
            last28={dosing.a28}
            hasProtocols={dosing.active > 0}
          />
          <CumulativeCard totals={totals} />

          <div className="grid grid-cols-2 gap-2.5">
            <Tile label={t('progress.summary.checkin')} wide>
              <div className="flex items-end justify-between gap-3">
                <div className="min-w-0">
                  <Readout
                    value={String(logging.checkInStreak)}
                    unit={t('progress.summary.streak', { count: logging.checkInStreak })}
                  />
                  <p className="mt-1 text-[11.5px] leading-snug text-muted">
                    {lastAgo(logging.checkInAgo)}
                  </p>
                </div>
                {checkInStale && !readOnly && (
                  <Button
                    size="sm"
                    variant="soft"
                    leading={<Gauge className="size-4" />}
                    onClick={() => setSheet('checkin')}
                  >
                    {t('progress.summary.checkinNow')}
                  </Button>
                )}
              </div>
              <DayStrip
                className="mt-2.5"
                cells={presenceMarks(logging.checkInStrip, now)}
                label={t('progress.summary.stripDays', {
                  n: logging.checkInStrip.filter(Boolean).length,
                  total: STRIP_DAYS,
                })}
              />
            </Tile>
          </div>
        </div>
      )}

      {!pending && <WeekCard items={items} />}

      <CheckInSheet open={sheet === 'checkin'} onClose={() => setSheet(null)} />
      <LogMeasurementSheet
        open={sheet !== null && sheet !== 'checkin'}
        onClose={() => setSheet(null)}
        defaultKind={sheet === 'waist' || sheet === 'body_fat_pct' ? sheet : 'weight'}
      />
    </section>
  )
}
