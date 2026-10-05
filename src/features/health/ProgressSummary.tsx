/**
 * "Resumen": the top of Progress. Where the body is heading (weight, waist), how
 * consistent the logging is (dose adherence, check-ins, weigh-ins), and a plain-language
 * list of what changed this week. Everything is computed from the user's own records.
 */
import { clsx } from 'clsx'
import { addDays, isToday, isTomorrow, isYesterday, startOfDay, subDays } from 'date-fns'
import { Gauge, Plus } from 'lucide-react'
import { useMemo, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { usePatientScope } from '@/app/scope'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { SectionTitle, Skeleton, SubstanceDot } from '@/components/ui/primitives'
import { compoundColor } from '@/content/substanceColor'
import type { MeasurementKind } from '@/data/database.types'
import { useDoses, useMeasurements, useProtocols, useSymptoms } from '@/data/hooks'
import { CheckInSheet } from '@/features/checkin/CheckInSheet'
import { WELLBEING } from '@/features/checkin/wellbeing'
import { summariseWeek, weekPlanVsActual } from '@/features/doses/week'
import { fmtDate, fmtDose, fmtPercent, type Locale } from '@/lib/format'
import { useLocale } from '@/lib/useLocale'
import { useNow } from '@/lib/useNow'
import {
  activeByCompound,
  adherenceDays,
  CHECKIN_STALE_DAYS,
  adherenceTotal,
  daySet,
  dayStrip,
  daysSinceLast,
  daysWithRecord,
  presenceMarks,
  streak,
  type AdherenceTotal,
  type DayCell,
} from './consistency'
import { LogMeasurementSheet } from './LogMeasurementSheet'
import { asDoseUnit, cycleStart, fmtSignedFixed, sortPoints, type TimePoint } from './progress'
import { ChangeValue } from './ProgressCharts'
import { DayStrip, Sparkline } from './Spark'
import { baselineChange, ema, weeklyRate } from './trend'
import { KIND_DIGITS } from './kinds'
import { fmtReading, useBodyUnits, type BodyUnits } from './units'
import { weekChanges, type WeekItem } from './weekly'

const STRIP_DAYS = 14
const SPARK_DAYS = 60
/** The least a body sparkline zooms in to, in kg or cm: two of them are a clear change. */
const SPARK_MIN_SPAN = 2
/** A weekly rate comes from a fit over a few weigh-ins: a tenth is as fine as it gets. */
const RATE_DIGITS = 1

function adherenceTone(a: AdherenceTotal): 'ok' | 'warn' | 'danger' | null {
  if (a.ratio === null) return null
  return a.ratio >= 0.9 ? 'ok' : a.ratio >= 0.7 ? 'warn' : 'danger'
}

const TONE_TEXT = { ok: 'text-ok', warn: 'text-warn', danger: 'text-danger' } as const

export function ProgressSummary() {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const { patientId, readOnly } = usePatientScope()
  const measurements = useMeasurements(patientId, 365)
  const doses = useDoses(patientId, 60)
  const protocols = useProtocols(patientId)
  const symptoms = useSymptoms(patientId, 180)
  const now = useNow(5 * 60_000)
  const units = useBodyUnits()
  const [sheet, setSheet] = useState<'checkin' | MeasurementKind | null>(null)

  // Body readings are kept in the unit the person uses from here on, so every number, trend
  // and change on the screen agrees.
  const records = useMemo(() => {
    const weight: TimePoint[] = []
    const waist: TimePoint[] = []
    const scores = new Map<MeasurementKind, TimePoint[]>()
    const checkIns: Date[] = []
    for (const row of measurements.data ?? []) {
      const at = new Date(row.measured_at)
      const stored = Number(row.value)
      if (row.kind === 'weight') weight.push({ at, value: units.show('weight', stored) })
      else if (row.kind === 'waist') waist.push({ at, value: units.show('waist', stored) })
      else if (WELLBEING.includes(row.kind)) {
        scores.set(row.kind, [...(scores.get(row.kind) ?? []), { at, value: stored }])
        checkIns.push(at)
      }
    }
    return {
      weight: sortPoints(weight),
      waist: sortPoints(waist),
      scores,
      checkInDays: daySet(checkIns),
      weighInDays: daySet(weight.map((p) => p.at)),
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
    return { weight: trend(records.weight), waist: trend(records.waist) }
  }, [records, protocols.data, now])

  const dosing = useMemo(() => {
    const rows = protocols.data ?? []
    const list = doses.data ?? []
    const active = activeByCompound(rows)
    const days = adherenceDays(rows, list, now, 28)
    const week = summariseWeek(weekPlanVsActual(active, list, startOfDay(addDays(now, -6)), now))
    return {
      active: active.length,
      a7: adherenceTotal(rows, list, now, 7),
      a28: adherenceTotal(rows, list, now, 28),
      days,
      timing: week.taken > 0 ? { onTime: week.onTime, offTime: week.offTime } : null,
    }
  }, [protocols.data, doses.data, now])

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
  const days7 = dosing.days.slice(-7)

  return (
    <section aria-labelledby="progress-summary" className="mb-4">
      <SectionTitle index="01">
        <span id="progress-summary">{t('progress.summary.title')}</span>
      </SectionTitle>

      {pending ? (
        // The shape of the tiles, so nothing jumps when the numbers arrive.
        <div className="grid grid-cols-2 gap-2.5" aria-busy>
          <Skeleton className="col-span-2 h-[148px]" />
          <Skeleton className="h-[112px]" />
          <Skeleton className="h-[112px]" />
          <Skeleton className="h-[112px]" />
          <Skeleton className="h-[112px]" />
          <Skeleton className="col-span-2 h-[132px]" />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2.5">
          <BodyTile
            wide
            kind="weight"
            units={units}
            label={t('progress.summary.weight')}
            empty={t('progress.summary.noWeight')}
            data={body.weight}
            locale={locale}
            onLog={readOnly ? undefined : () => setSheet('weight')}
            rateHint={t('progress.trend.rateNeed')}
          />
          <BodyTile
            kind="waist"
            units={units}
            label={t('progress.summary.waist')}
            empty={t('progress.summary.noWaist')}
            data={body.waist}
            locale={locale}
            onLog={readOnly ? undefined : () => setSheet('waist')}
          />
          <Tile label={t('progress.summary.weighIns')}>
            <Readout value={String(logging.weighIns)} unit={`/${STRIP_DAYS}`} tight />
            <p className="mt-1 truncate text-[11.5px] text-muted">{lastAgo(logging.weighInAgo)}</p>
            <DayStrip
              className="mt-auto pt-2.5"
              cells={presenceMarks(logging.weighInStrip, now)}
              label={t('progress.summary.stripDays', {
                n: logging.weighIns,
                total: STRIP_DAYS,
              })}
            />
          </Tile>

          <AdherenceTile
            label={t('progress.summary.adh7')}
            total={dosing.a7}
            days={days7}
            hasProtocols={dosing.active > 0}
            locale={locale}
          />
          <AdherenceTile
            label={t('progress.summary.adh28')}
            total={dosing.a28}
            days={dosing.days}
            hasProtocols={dosing.active > 0}
            locale={locale}
          />

          <Tile label={t('progress.summary.checkin')} wide>
            <div className="flex items-end justify-between gap-3">
              <div className="min-w-0">
                <Readout
                  value={String(logging.checkInStreak)}
                  unit={t('progress.summary.streak', { count: logging.checkInStreak })}
                />
                <p className="mt-1 truncate text-[11.5px] text-muted">
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
      )}

      {!pending && <WeekCard items={items} />}

      <CheckInSheet open={sheet === 'checkin'} onClose={() => setSheet(null)} />
      <LogMeasurementSheet
        open={sheet === 'weight' || sheet === 'waist'}
        onClose={() => setSheet(null)}
        defaultKind={sheet === 'waist' ? 'waist' : 'weight'}
      />
    </section>
  )
}

/* ------------------------------------------------------------ tiles */

function Tile({
  label,
  wide = false,
  color,
  action,
  children,
}: {
  label: ReactNode
  wide?: boolean
  color?: string
  action?: ReactNode
  children: ReactNode
}) {
  return (
    <div
      className={clsx('card fade-up flex min-w-0 flex-col p-3', wide && 'col-span-2')}
      style={color ? { borderColor: `color-mix(in oklab, ${color} 28%, var(--line))` } : undefined}
    >
      <div className="flex min-h-5 items-start justify-between gap-2">
        <span className="spec truncate">{label}</span>
        {action}
      </div>
      {children}
    </div>
  )
}

function Readout({
  value,
  unit,
  tight = false,
  className,
}: {
  value: string
  unit?: string
  /** The unit continues the number ("4/14") instead of naming it ("77,0 kg"). */
  tight?: boolean
  className?: string
}) {
  return (
    <div className={clsx('readout mt-1.5 text-[22px] font-semibold leading-none', className)}>
      {value}
      {unit && (
        <span className={clsx('text-[11.5px] font-medium text-muted', !tight && 'ml-1')}>
          {unit}
        </span>
      )}
    </div>
  )
}

interface BodyData {
  change: ReturnType<typeof baselineChange>
  rate: ReturnType<typeof weeklyRate>
  spark: number[]
}

function BodyTile({
  kind,
  units,
  label,
  empty,
  data,
  locale,
  onLog,
  wide = false,
  rateHint,
}: {
  kind: 'weight' | 'waist'
  units: BodyUnits
  label: string
  empty: string
  data: BodyData
  locale: Locale
  onLog?: () => void
  wide?: boolean
  rateHint?: string
}) {
  const { t } = useTranslation()
  const { change, rate } = data
  const unit = units.unit(kind)
  const color = 'var(--sub-mint)'
  const action = onLog && (
    // 44 px to hit, drawn as before: the tile's padding is taken back with the margin.
    <button
      type="button"
      onClick={onLog}
      aria-label={t('progress.summary.log', { what: label.toLowerCase() })}
      className="-m-3 grid size-11 place-items-center rounded-full text-muted outline-none hover:text-ink focus-visible:ring-2 focus-visible:ring-signal/60"
    >
      <Plus className="size-4" />
    </button>
  )

  if (!change) {
    return (
      <Tile label={label} wide={wide} action={action}>
        <Readout value="—" />
        <p className="mt-1.5 text-[11.5px] text-muted">{empty}</p>
      </Tile>
    )
  }

  const delta = change.delta
  const detail =
    delta !== null && change.baseline ? (
      <>
        <div className="mt-1.5 flex flex-wrap items-baseline gap-x-1.5">
          <ChangeValue
            kind={kind}
            delta={delta}
            digits={KIND_DIGITS[kind]}
            unit={unit}
            threshold={0.2}
            className="text-[13px]"
          />
          {change.pct !== null && (
            <span className="readout text-[11.5px] text-muted">
              {fmtSignedFixed(change.pct * 100, locale, 1)}&nbsp;%
            </span>
          )}
        </div>
        <p className="mt-0.5 truncate text-[11.5px] text-muted">
          {t('progress.summary.since', { date: fmtDate(change.baseline.at, locale, 'd MMM') })}
        </p>
      </>
    ) : (
      <p className="mt-1.5 text-[11.5px] leading-snug text-muted">
        {t('progress.summary.firstReading')}
      </p>
    )

  const rateLine = wide && (
    <p className="mt-1 text-[11.5px] text-muted">
      {rate ? (
        <>
          {t('progress.trend.rateLabel')}{' '}
          <span className="readout whitespace-nowrap font-semibold text-ink-2">
            {fmtSignedFixed(rate.perWeek, locale, RATE_DIGITS)}&nbsp;{unit}/
            {t('progress.trend.weekShort')}
          </span>
        </>
      ) : (
        rateHint
      )}
    </p>
  )

  const minSpan = units.show(kind, SPARK_MIN_SPAN)
  const value = fmtReading(kind, change.latest.value, locale)

  return (
    <Tile label={label} wide={wide} color={color} action={action}>
      {wide ? (
        <div className="flex items-end gap-3">
          <div className="min-w-0 flex-1">
            <Readout value={value} unit={unit} className="text-[28px]" />
            {detail}
            {rateLine}
          </div>
          <Sparkline
            values={data.spark}
            color={color}
            height={52}
            minSpan={minSpan}
            className="w-[42%] shrink-0"
          />
        </div>
      ) : (
        <>
          <Readout value={value} unit={unit} />
          {detail}
          {data.spark.length > 1 && (
            <Sparkline
              values={data.spark}
              color={color}
              height={22}
              minSpan={minSpan}
              className="mt-auto pt-2"
            />
          )}
        </>
      )}
    </Tile>
  )
}

function AdherenceTile({
  label,
  total,
  days,
  hasProtocols,
  locale,
}: {
  label: string
  total: AdherenceTotal
  days: readonly DayCell[]
  hasProtocols: boolean
  locale: Locale
}) {
  const { t } = useTranslation()
  const tone = adherenceTone(total)
  const dosed = days.filter((d) => d.mark !== 'none')
  return (
    <Tile label={label}>
      <Readout
        value={total.ratio === null ? '—' : fmtPercent(total.ratio, locale)}
        className={tone ? TONE_TEXT[tone] : undefined}
      />
      <p className="mt-1 truncate text-[11.5px] text-muted">
        {!hasProtocols
          ? t('progress.summary.noProtocols')
          : total.expected === 0
            ? t('progress.summary.noDoses')
            : t('progress.summary.doses', { taken: total.taken, expected: total.expected })}
      </p>
      {hasProtocols && (
        <DayStrip
          className="mt-auto pt-2.5"
          cells={days}
          label={t('progress.summary.stripDoses', {
            n: dosed.filter((d) => d.mark === 'full').length,
            total: dosed.length,
          })}
        />
      )}
    </Tile>
  )
}

/* ------------------------------------------------------------ this week */

type Tone = 'good' | 'bad' | 'warn' | 'info'

const DOT_TONE: Record<Tone, string> = {
  good: 'var(--ok)',
  bad: 'var(--danger)',
  warn: 'var(--warn)',
  info: 'var(--muted)',
}

function WeekCard({ items }: { items: readonly WeekItem[] }) {
  const { t } = useTranslation()
  const units = useBodyUnits()
  return (
    <Card className="mt-2.5" eyebrow={t('progress.week.eyebrow')} title={t('progress.week.title')}>
      {items.length === 0 ? (
        <p className="text-[13px] text-muted">{t('progress.week.empty')}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((item) => (
            <WeekLine key={weekItemKey(item)} item={item} units={units} />
          ))}
        </ul>
      )}
    </Card>
  )
}

function weekItemKey(item: WeekItem): string {
  if (item.kind === 'step') return `step-${item.protocolId}-${item.change.at.getTime()}`
  if (item.kind === 'body') return `body-${item.metric}`
  return item.kind
}

/** i18n key of a day relative to today: "hoy", "mañana", "ayer" or "el lunes". */
function dayKey(at: Date): 'today' | 'tomorrow' | 'yesterday' | 'weekday' {
  if (isToday(at)) return 'today'
  if (isTomorrow(at)) return 'tomorrow'
  if (isYesterday(at)) return 'yesterday'
  return 'weekday'
}

function WeekLine({ item, units }: { item: WeekItem; units: BodyUnits }) {
  const { t } = useTranslation()
  const { locale } = useLocale()
  let tone: Tone = 'info'
  let dot: string | null = null
  let content: ReactNode

  switch (item.kind) {
    case 'body': {
      tone = Math.abs(item.delta) < 0.2 ? 'info' : item.delta < 0 ? 'good' : 'bad'
      content = (
        <>
          {t(`progress.summary.${item.metric}`)}{' '}
          <ChangeValue
            kind={item.metric}
            delta={item.delta}
            digits={KIND_DIGITS[item.metric]}
            unit={units.unit(item.metric)}
            threshold={0.2}
          />{' '}
          {t('progress.week.vsLast')}
        </>
      )
      break
    }
    case 'weighIns':
      content = t('progress.week.weighIns', { count: item.count })
      break
    case 'adherence': {
      const ratio = item.expected > 0 ? item.taken / item.expected : 1
      tone = ratio >= 0.9 ? 'good' : 'warn'
      content = t('progress.week.adherence', {
        pct: fmtPercent(Math.min(1, ratio), locale),
        taken: item.taken,
        expected: item.expected,
      })
      break
    }
    case 'offTime':
      tone = 'warn'
      content = t('progress.week.offTime', { count: item.count })
      break
    case 'allOnTime':
      tone = 'good'
      content = t('progress.week.allOnTime', { count: item.count })
      break
    case 'score':
      tone = 'info'
      content = (
        <>
          {t(`health.kinds.${item.metric}`)}{' '}
          <ChangeValue kind={item.metric} delta={item.delta} digits={1} threshold={0.5} trim />{' '}
          {t('progress.week.vsLast')}
        </>
      )
      break
    case 'checkIns':
      tone = 'good'
      content = t('progress.week.checkIns', { count: item.count })
      break
    case 'symptoms':
      tone = 'warn'
      content = (
        <>
          {t('progress.week.symptoms', { count: item.count })}
          {item.top &&
            t('progress.week.symptomsTop', {
              kind: t(`symptoms.kinds.${item.top}`).toLowerCase(),
            })}
        </>
      )
      break
    case 'step': {
      const c = item.change
      dot = compoundColor(item.compoundId)
      const verb = `${c.kind}${item.upcoming ? '' : 'Past'}`
      content = t(`progress.week.step.${verb}`, {
        name: item.name,
        dose: fmtDose(c.doseMg, asDoseUnit(item.unit), locale),
        day: t(`progress.week.day.${dayKey(c.at)}`, {
          weekday: fmtDate(c.at, locale, locale === 'es' ? 'EEEE d MMM' : 'EEEE, MMM d'),
        }),
      })
      break
    }
  }

  return (
    <li className="flex items-baseline gap-2.5 text-[13.5px] leading-snug text-ink-2">
      <span className="relative top-[-1px] shrink-0">
        {dot ? (
          <SubstanceDot color={dot} size={7} />
        ) : (
          <span
            className="block size-[7px] rounded-full"
            style={{ background: DOT_TONE[tone] }}
            aria-hidden
          />
        )}
      </span>
      <span className="min-w-0">{content}</span>
    </li>
  )
}
