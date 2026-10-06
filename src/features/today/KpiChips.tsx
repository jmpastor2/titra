import { clsx } from 'clsx'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Ring } from '@/components/kpi/Ring'
import { compoundName } from '@/content/compounds'
import { fmtNumber, fmtPercent } from '@/lib/format'
import { useLocale } from '@/lib/useLocale'
import {
  adherenceTone,
  coverFraction,
  coverTone,
  coverLabel,
  type CoverKpi,
  type CycleKpi,
  type DayVerdict,
} from './kpis'

type Tone = 'ok' | 'warn' | 'danger'

const TEXT: Record<Tone, string> = { ok: 'text-ink', warn: 'text-warn', danger: 'text-danger' }
const STROKE: Record<Tone, string> = {
  ok: 'var(--signal)',
  warn: 'var(--warn)',
  danger: 'var(--danger)',
}

/**
 * The four figures that say at a glance whether the protocol is on track: the streak of
 * complete days, the adherence of the week, the week of the cycle and the days the vials last.
 * A chip with nothing to say (no plan yet, no stock) is left out.
 */
export function KpiChips({
  streak,
  trail,
  adherence,
  week,
  cycle,
  cover,
  linked = true,
  className,
}: {
  streak: number
  /** How each of the last seven days went, oldest first. */
  trail: readonly DayVerdict[]
  /** Taken over planned in the last seven days, 0..1; null with nothing planned. */
  adherence: number | null
  week: { taken: number; planned: number }
  cycle: CycleKpi | null
  /** Null where the supply is not the viewer's to see. */
  cover: CoverKpi | null
  /** Each chip leads to where it is worked on; not in a shared view of somebody else's data. */
  linked?: boolean
  className?: string
}) {
  const { t } = useTranslation()
  const { locale } = useLocale()

  const adhTone = adherence === null ? 'ok' : adherenceTone(adherence)
  const coverUnits = cover ? coverLabel(cover.days) : null
  const cTone = cover ? coverTone(cover.days) : 'ok'
  const to = (path: string) => (linked ? path : undefined)

  return (
    <section aria-label={t('today.kpis')} className={clsx('grid grid-cols-2 gap-2', className)}>
      <Chip
        to={to('/log')}
        label={t('today.streak')}
        value={String(streak)}
        unit={t('today.streakUnit', { count: streak })}
        caption={streak > 0 ? t('today.streakHint') : t('today.streakNone')}
        visual={<Trail trail={trail} />}
      />
      {adherence !== null && (
        <Chip
          to={to('/log')}
          label={t('today.adherence')}
          value={fmtPercent(adherence, locale)}
          tone={adhTone}
          caption={t('today.adherenceHint', { taken: week.taken, planned: week.planned })}
          visual={<Ring value={adherence} size={38} stroke={5} color={STROKE[adhTone]} />}
        />
      )}
      {cycle && (
        <Chip
          to={to('/cycles')}
          label={cycle.rest ? t('today.cycleRest') : t('today.cycle')}
          value={cycle.total ? `${cycle.week}/${cycle.total}` : String(cycle.week)}
          caption={cycle.name}
          visual={
            cycle.total ? <Ring value={cycle.week / cycle.total} size={38} stroke={5} /> : undefined
          }
        />
      )}
      {cover && coverUnits && (
        <Chip
          to={to('/inventory')}
          label={t('today.cover')}
          value={`${coverUnits.plus ? '+' : ''}${fmtNumber(coverUnits.value, locale, 0)}`}
          unit={t(`today.coverUnit.${coverUnits.unit}`, { count: coverUnits.value })}
          tone={cTone}
          caption={
            cover.compoundIds.length > 0
              ? cover.compoundIds.map((id) => compoundName(id)).join(' + ')
              : t('today.coverPlenty')
          }
          visual={
            <Ring value={coverFraction(cover.days)} size={38} stroke={5} color={STROKE[cTone]} />
          }
        />
      )}
    </section>
  )
}

function Chip({
  to,
  label,
  value,
  unit,
  caption,
  tone = 'ok',
  visual,
}: {
  /** Where the chip leads; without it the chip is only a reading. */
  to: string | undefined
  label: string
  value: string
  unit?: string
  caption: string
  tone?: Tone
  visual?: ReactNode
}) {
  const className =
    'card flex min-w-0 flex-col gap-1.5 p-3.5 [&:last-child:nth-child(odd)]:col-span-2'
  const body = (
    <>
      <span className="text-[12.5px] font-medium leading-tight text-ink-2">{label}</span>
      <span className="flex items-center justify-between gap-2">
        <span className={clsx('readout text-[26px] font-semibold leading-none', TEXT[tone])}>
          {value}
          {unit && <span className="ml-1 text-[12px] font-medium text-muted">{unit}</span>}
        </span>
        {visual}
      </span>
      <span className="break-words text-[11.5px] leading-snug text-muted">{caption}</span>
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

/** The last seven days as bars: complete lit, a day off short, a day in progress hollow, a miss rose. */
function Trail({ trail }: { trail: readonly DayVerdict[] }) {
  const { t } = useTranslation()
  // Keyed by how many days back each bar is: 0 is today.
  const bars = trail.map((verdict, i) => ({ verdict, daysBack: trail.length - 1 - i }))
  return (
    <span
      role="img"
      aria-label={t('today.trailAria', { done: trail.filter((v) => v === 'done').length })}
      className="flex h-[26px] shrink-0 items-end gap-[3px]"
    >
      {bars.map(({ verdict, daysBack }) => (
        <span
          key={daysBack}
          className={clsx(
            'block w-[5px] rounded-full',
            verdict === 'done' && 'h-[22px] bg-signal',
            verdict === 'rest' && 'h-[6px] bg-line-strong',
            verdict === 'open' && 'h-[22px] border border-signal/60',
            verdict === 'broken' && 'h-[22px] bg-danger',
          )}
        />
      ))}
    </span>
  )
}
