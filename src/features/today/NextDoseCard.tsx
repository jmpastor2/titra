import { clsx } from 'clsx'
import { Check, Syringe } from 'lucide-react'
import type { TFunction } from 'i18next'
import { useId, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { DayTrack, type TrackItem } from '@/components/kpi/DayTrack'
import { Button } from '@/components/ui/Button'
import { SubstanceDot } from '@/components/ui/primitives'
import { compoundById, compoundName } from '@/content/compounds'
import { compoundColor } from '@/content/substanceColor'
import type { ProtocolRow } from '@/data/database.types'
import type { AgendaStatus } from '@/domain/dosing/schedule'
import type { StackComponent } from '@/domain/types'
import { DOSE_SOON_H } from '@/features/quicklog/tiles'
import {
  fmtDate,
  fmtDose,
  fmtDoseList,
  fmtDoseValue,
  fmtHours,
  fmtNumber,
  toTimeInputValue as hhmm,
  type Locale,
} from '@/lib/format'
import { useLocale } from '@/lib/useLocale'
import { fmtWait, slotWhen, type TodayItem } from './agenda'

/** The ink button takes over from this long before the dose: earlier it is a quiet link. */
const SOON_MS = DOSE_SOON_H * 3_600_000

/** The administration the hero is about: today's that needs the person first, or the next one. */
export interface HeroDose {
  protocol: ProtocolRow
  at: Date
  doses: readonly StackComponent[]
  status: AgendaStatus
}

const nameOf = (protocol: ProtocolRow, doses: readonly StackComponent[]) =>
  protocol.name || doses.map((d) => compoundName(d.compoundId)).join(' + ')

const doseList = (doses: readonly StackComponent[], locale: Locale) =>
  fmtDoseList(
    doses.map((d) => ({
      valueMg: d.doseMg,
      unit: compoundById(d.compoundId)?.defaultUnit ?? 'mg',
    })),
    locale,
  )

/**
 * The one thing Hoy is for: the next dose, as what to load into the syringe (units, with the
 * mass under it), when, and the day around it on a 24-hour track with a row per dose of the
 * day. One ink button logs it once it is close; before that, a quiet link logs anything else.
 * The panel takes a faint tint of the substance that comes next.
 */
export function NextDoseCard({
  dose,
  units,
  track,
  rows,
  unitsOf,
  now,
  readOnly,
  aside,
  onLog,
  onLogItem,
  onLogOther,
}: {
  dose: HeroDose | null
  /** Syringe units for the dose, when every vial involved is known. */
  units: number | null
  /** Markers of the day track: every administration from 4 h ago to 20 h ahead. */
  track: readonly TrackItem[]
  /** The other doses of the day, in time order. */
  rows: readonly TodayItem[]
  unitsOf: (item: TodayItem) => number | null
  now: Date
  readOnly: boolean
  /** A line about the dose (the fast it asks for), under the time. */
  aside?: ReactNode
  onLog: () => void
  onLogItem: (item: TodayItem) => void
  onLogOther: () => void
}) {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const titleId = useId()
  const alert = dose?.status === 'due' || dose?.status === 'overdue'
  const waitMs = dose ? dose.at.getTime() - now.getTime() : Infinity
  const soon = alert || waitMs <= SOON_MS
  const color = dose ? compoundColor(dose.protocol.compound_id) : null

  return (
    <section
      aria-labelledby={titleId}
      className="card fade-up p-4"
      style={
        color
          ? {
              backgroundImage: `linear-gradient(180deg, color-mix(in oklab, ${color} 8%, var(--panel)), var(--panel) 62%)`,
            }
          : undefined
      }
    >
      <h2 id={titleId} className="spec">
        {t('today.hero.title')}
      </h2>

      {dose ? (
        <>
          <div className="mt-1 flex items-start gap-2">
            <span className="mt-[8px] flex shrink-0 items-center gap-1" aria-hidden>
              {dose.doses.map((d) => (
                <SubstanceDot key={d.compoundId} color={compoundColor(d.compoundId)} />
              ))}
            </span>
            <span className="min-w-0 break-words text-[17px] font-semibold leading-snug">
              {nameOf(dose.protocol, dose.doses)}
            </span>
          </div>
          <Load doses={dose.doses} units={units} />
          <p
            className={clsx(
              'readout mt-2.5 text-[14px] leading-snug',
              alert ? 'font-semibold text-warn' : 'text-ink-2',
            )}
          >
            {whenLine(dose, now, locale, t)}
          </p>
        </>
      ) : (
        <p className="mt-1.5 text-[15px] leading-snug text-ink-2">{t('today.hero.none')}</p>
      )}

      {aside}

      {track.length > 0 && (
        <div className="mt-5">
          <div className="spec">{t('today.hero.track')}</div>
          <DayTrack
            className="mt-2"
            now={now}
            items={track}
            label={t('today.hero.trackAria', { count: track.length })}
          />
        </div>
      )}

      {rows.length > 0 && (
        <ul className="mt-1 divide-y divide-line border-t border-line">
          {rows.map((item) => (
            <HeroRow
              key={item.key}
              item={item}
              units={unitsOf(item)}
              now={now}
              readOnly={readOnly}
              onLog={() => onLogItem(item)}
            />
          ))}
        </ul>
      )}

      {!readOnly &&
        (dose && soon ? (
          <Button block className="mt-4" leading={<Syringe className="size-4" />} onClick={onLog}>
            {t('today.hero.log')}
          </Button>
        ) : (
          <div className="mt-3 flex justify-center">
            <button
              type="button"
              onClick={onLogOther}
              className="tap-link rounded-full px-3 text-[13.5px] font-semibold text-signal outline-none focus-visible:ring-2 focus-visible:ring-signal/60"
            >
              {t('today.logOther')}
            </button>
          </div>
        ))}
    </section>
  )
}

/** What to load: units big with the mass under them, or the mass itself when no vial says how. */
function Load({ doses, units }: { doses: readonly StackComponent[]; units: number | null }) {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const list = doseList(doses, locale)
  const one = doses.length === 1 ? doses[0] : undefined
  const big = 'readout text-[44px] font-semibold leading-none'
  const small = 'ml-1 font-sans text-[17px] font-medium tracking-normal text-muted'

  if (units !== null) {
    return (
      <div
        role="group"
        className="mt-4"
        aria-label={t('today.hero.loadAria', { units: fmtNumber(units, locale, 1), dose: list })}
      >
        <div aria-hidden className={big}>
          {fmtNumber(units, locale, 1)}
          <span className={small}>U</span>
        </div>
        <div aria-hidden className="readout mt-1.5 text-[13px] text-muted">
          {list}
        </div>
      </div>
    )
  }
  if (one) {
    const unit = compoundById(one.compoundId)?.defaultUnit ?? 'mg'
    const value = fmtDoseValue(one.doseMg, unit, locale)
    return (
      <div className={clsx('mt-4', big)}>
        {value}
        <span className={small}>{fmtDose(one.doseMg, unit, locale).slice(value.length + 1)}</span>
      </div>
    )
  }
  return <div className="readout mt-4 text-[28px] font-semibold leading-tight">{list}</div>
}

/** "lun 5 · 09:00 · en 12 h", or "Toca ahora · 09:00" / "Retrasada 2 h · 09:00" when it is due. */
function whenLine(dose: HeroDose, now: Date, locale: Locale, t: TFunction): string {
  const at = slotWhen(dose.at, now, locale)
  if (dose.status === 'due') return `${t('today.dueNow')} · ${at}`
  if (dose.status === 'overdue') {
    const late = fmtHours((now.getTime() - dose.at.getTime()) / 3_600_000, locale)
    return `${t('today.overdueBy', { time: late })} · ${at}`
  }
  return `${at} · ${t('today.hero.in', { time: fmtWait(dose.at.getTime() - now.getTime(), locale) })}`
}

/** One more dose of the day: its time, what it is and how it stands, with a log button when due. */
function HeroRow({
  item,
  units,
  now,
  readOnly,
  onLog,
}: {
  item: TodayItem
  units: number | null
  now: Date
  readOnly: boolean
  onLog: () => void
}) {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const name = nameOf(item.protocol, item.doses)
  const taken = item.status === 'taken'
  const alert = item.status === 'due' || item.status === 'overdue'
  const missed = item.status === 'missed'
  const at = item.takenAt && item.extra ? item.takenAt : item.at
  const otherDay = at.toDateString() !== now.toDateString()

  const status = taken
    ? t(item.extra ? 'today.extraAt' : 'today.takenAt', { time: hhmm(item.takenAt ?? item.at) })
    : alert
      ? item.status === 'due'
        ? t('today.dueNow')
        : t('today.overdueBy', {
            time: fmtHours((now.getTime() - item.at.getTime()) / 3_600_000, locale),
          })
      : missed
        ? t('today.missed')
        : t('today.hero.in', { time: fmtWait(item.at.getTime() - now.getTime(), locale) })

  return (
    <li className="flex min-h-[52px] items-center gap-3 py-2">
      <span className="readout w-11 shrink-0 text-[13px] leading-tight text-ink-2">
        {hhmm(at)}
        {otherDay && (
          <span className="block font-sans text-[11px] text-muted">
            {fmtDate(at, locale, 'EEE')}
          </span>
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-start gap-1.5">
          <span className="mt-[6px] flex shrink-0 items-center gap-1" aria-hidden>
            {item.doses.map((d) => (
              <SubstanceDot key={d.compoundId} color={compoundColor(d.compoundId)} size={7} />
            ))}
          </span>
          <span className="min-w-0 break-words text-[14px] font-medium leading-snug">{name}</span>
        </span>
        <span
          className={clsx(
            'mt-0.5 block text-[12.5px] leading-snug',
            alert ? 'font-semibold text-warn' : missed ? 'text-danger' : 'text-muted',
          )}
        >
          {status}
        </span>
      </span>
      {taken ? (
        <span
          role="img"
          aria-label={t('today.taken')}
          className="grid size-6 shrink-0 place-items-center"
        >
          <Check aria-hidden className="size-4 text-signal" strokeWidth={2.6} />
        </span>
      ) : (alert || missed) && !readOnly ? (
        <button
          type="button"
          onClick={onLog}
          aria-label={`${t('doses.log')}: ${name}`}
          className={clsx(
            'grid size-11 shrink-0 place-items-center rounded-full outline-none transition active:scale-95 focus-visible:ring-2 focus-visible:ring-signal/60',
            // The card's one ink button is the hero's: a row's is quiet, in the tone of its state.
            alert ? 'bg-warn-soft text-warn' : 'bg-danger-soft text-danger',
          )}
        >
          <Syringe className="size-[18px]" />
        </button>
      ) : (
        <span className="readout shrink-0 text-right text-[13px] text-ink-2">
          {units !== null ? `${fmtNumber(units, locale, 1)} U` : doseList(item.doses, locale)}
        </span>
      )}
    </li>
  )
}
