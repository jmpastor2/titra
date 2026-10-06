import { clsx } from 'clsx'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Delta, Kpi, type KpiTone } from '@/components/kpi/Kpi'
import { Meter } from '@/components/kpi/Meter'
import { Steps } from '@/components/kpi/Steps'
import { Ticks } from '@/components/kpi/Ticks'
import { compoundById, compoundName } from '@/content/compounds'
import { compoundColor } from '@/content/substanceColor'
import type { InventoryRow } from '@/data/database.types'
import { toProtocolLike } from '@/data/mappers'
import { doseMain, stepDose } from '@/features/cycle/dose'
import { headlineText, nextText, protocolTitle } from '@/features/cycle/text'
import { nextLine } from '@/features/cycle/view'
import { REORDER_DAYS } from '@/features/inventory/alerts'
import { fmtDate, fmtNumber } from '@/lib/format'
import { useLocale } from '@/lib/useLocale'
import {
  ADHERENCE_TARGET,
  adherenceTone,
  COVER_GAUGE_DAYS,
  coverLabel,
  coverTone,
  cycleSteps,
  orderNow,
  type AdherenceKpi,
  type CoverKpi,
  type CycleKpi,
} from './kpis'
import type { HomeKpis } from './useHomeKpis'

type Tone = 'ok' | 'warn' | 'danger'

/** A date or a dose in a caption never breaks in the middle ("12 oct", "12 U"). */
const keep = (s: string) => s.replaceAll(' ', '\u00A0')
const KPI_TONE: Record<Tone, KpiTone> = { ok: 'default', warn: 'warn', danger: 'danger' }
const COLOR: Record<Tone, string> = {
  ok: 'var(--signal)',
  warn: 'var(--warn)',
  danger: 'var(--danger)',
}

/**
 * The four questions of the day as tiles: am I keeping it up (streak), am I on track
 * (adherence over 28 days), where am I in the cycle, and when do I run out. Each leads to the
 * screen where it is worked on; a tile with nothing to say is left out.
 */
export function KpiGrid({
  kpis,
  vials,
  now,
  linked = true,
}: {
  kpis: HomeKpis
  vials: readonly InventoryRow[]
  now: Date
  /** Each tile leads to its screen; not in a shared view of somebody else's data. */
  linked?: boolean
}) {
  const { t } = useTranslation()
  const { streak, adherence, cycle, cover } = kpis
  const done = streak.ticks.filter((s) => s === 'full').length
  const to = (path: string) => (linked ? path : undefined)

  return (
    <section aria-label={t('today.kpis')} className="grid grid-cols-2 gap-2.5">
      <Tile
        to={to('/progress')}
        graphic={
          <Ticks
            cells={streak.ticks}
            label={t('today.kpi.ticksAria', { done, days: streak.ticks.length })}
          />
        }
      >
        <Kpi
          label={t('today.streak')}
          value={String(streak.days)}
          unit={t('today.streakUnit', { count: streak.days })}
          caption={streak.days > 0 ? t('today.streakHint') : t('today.streakNone')}
        />
      </Tile>
      {adherence && <AdherenceTile a={adherence} to={to('/log')} />}
      {cycle && <CycleTile cycle={cycle} vials={vials} to={to('/cycles')} />}
      {cover && <CoverTile cover={cover} now={now} to={to('/inventory')} />}
    </section>
  )
}

/** A tile: the figure on top, its graphic at the foot, so graphics line up across a row. */
function Tile({
  to,
  graphic,
  children,
}: {
  to: string | undefined
  graphic: ReactNode
  children: ReactNode
}) {
  const className = 'card flex min-w-0 flex-col p-4 [&:last-child:nth-child(odd)]:col-span-2'
  const body = (
    <>
      {children}
      <div className="mt-auto pt-3.5">{graphic}</div>
    </>
  )
  return to ? (
    <Link to={to} className={clsx(className, 'transition active:scale-[0.99]')}>
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  )
}

function AdherenceTile({ a, to }: { a: AdherenceKpi; to: string | undefined }) {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const tone = adherenceTone(a.ratio)
  const pct = Math.round(a.ratio * 100)
  const delta = a.deltaPts
  const signed =
    delta === null ? '' : `${delta > 0 ? '+' : '−'}${fmtNumber(Math.abs(delta), locale)}`
  return (
    <Tile
      to={to}
      graphic={<Meter value={pct} max={100} target={ADHERENCE_TARGET * 100} color={COLOR[tone]} />}
    >
      <Kpi
        label={t('today.kpi.adherence')}
        value={fmtNumber(pct, locale, 0)}
        unit="%"
        tone={KPI_TONE[tone]}
        aside={
          delta !== null &&
          delta !== 0 && (
            <>
              <span aria-hidden>
                <Delta
                  text={t('today.kpi.pts', { value: signed })}
                  direction={delta > 0 ? 'up' : 'down'}
                  tone={delta > 0 ? 'good' : 'bad'}
                />
              </span>
              <span className="sr-only">{t('today.kpi.ptsAria', { value: signed })}</span>
            </>
          )
        }
        caption={t('today.kpi.adherenceOf', { taken: a.taken, expected: a.expected })}
      />
    </Tile>
  )
}

function CycleTile({
  cycle,
  vials,
  to,
}: {
  cycle: CycleKpi
  vials: readonly InventoryRow[]
  to: string | undefined
}) {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const { protocol, info, head } = cycle
  const pl = toProtocolLike(protocol)
  const unit = compoundById(protocol.compound_id)?.defaultUnit ?? 'mg'
  const next = nextText(
    nextLine(info),
    (step) => keep(doseMain(stepDose(pl, vials, step.doseMg), unit, locale)),
    t,
    locale,
  )
  const total = head.kind === 'week' || head.kind === 'rest' ? head.total : null
  return (
    <Tile
      to={to}
      graphic={
        <Steps
          steps={cycleSteps(info)}
          color={compoundColor(protocol.compound_id)}
          height={18}
          label={headlineText(head, t, locale)}
        />
      }
    >
      <Kpi
        label={t(head.kind === 'rest' ? 'today.kpi.rest' : 'today.kpi.cycle', {
          name: protocolTitle(protocol),
        })}
        value={String(head.week)}
        unit={total !== null ? t('today.kpi.weekOf', { total }) : t('today.kpi.weeks')}
        caption={next}
      />
    </Tile>
  )
}

function CoverTile({ cover, now, to }: { cover: CoverKpi; now: Date; to: string | undefined }) {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const tone = coverTone(cover.days)
  const label = coverLabel(cover.days)
  const names = cover.compoundIds.map(compoundName).join(' + ')
  const day = (d: Date) => keep(fmtDate(d, locale, 'd MMM'))
  const caption =
    cover.days === null || !cover.runsOutAt || !cover.orderBy
      ? t('today.coverPlenty')
      : orderNow(cover, now)
        ? t('today.kpi.orderNow', { date: day(cover.runsOutAt) })
        : t('today.kpi.orderBy', { date: day(cover.orderBy) })
  return (
    <Tile
      to={to}
      graphic={
        <Meter
          value={cover.days ?? COVER_GAUGE_DAYS}
          max={COVER_GAUGE_DAYS}
          target={REORDER_DAYS}
          color={COLOR[tone]}
        />
      }
    >
      <Kpi
        label={names ? t('today.kpi.stockOf', { names }) : t('today.kpi.stock')}
        value={`${label.plus ? '+' : ''}${fmtNumber(label.value, locale, 0)}`}
        unit={t(`today.coverUnit.${label.unit}`, { count: label.value })}
        tone={KPI_TONE[tone]}
        caption={caption}
      />
    </Tile>
  )
}
