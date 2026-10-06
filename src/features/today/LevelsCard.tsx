import { useMemo, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Meter } from '@/components/kpi/Meter'
import { Ticks } from '@/components/kpi/Ticks'
import { Skeleton, SubstanceDot } from '@/components/ui/primitives'
import { compoundColor } from '@/content/substanceColor'
import { amountIn } from '@/features/exposure/chartScale'
import type { CompoundExposure } from '@/features/exposure/useExposure'
import { fmtDate, fmtHours, fmtNumber } from '@/lib/format'
import { useLocale } from '@/lib/useLocale'
import { LEVEL_DAYS, levelRow, sinceShort, STEADY_FROM, type LevelRow } from './levels'

/** An amount or a time never breaks in the middle ("1,2 mg", "2 d 13 h"). */
const keep = (s: string) => s.replaceAll(' ', '\u00A0')

/**
 * Niveles: one row per substance on a single card. A long-acting compound says how close it is
 * to its steady level (with the steady band on its gauge and when it gets there); a short-acting
 * one says when it was last taken, with a bar per day of the last two weeks. A row opens the
 * substance's page.
 */
export function LevelsCard({ items }: { items: readonly CompoundExposure[] }) {
  const rows = useMemo(() => items.map((x) => levelRow(x)), [items])
  return (
    <div className="card fade-up divide-y divide-line">
      {rows.map((row) => (
        <LevelRowView key={row.x.compoundId} row={row} />
      ))}
    </div>
  )
}

/** The loading shape: two rows about as tall as the real ones. */
export function LevelsCardSkeleton() {
  return (
    <div className="card flex flex-col gap-5 p-4" aria-hidden>
      {[0, 1].map((i) => (
        <div key={i} className="flex flex-col gap-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-48" />
          <Skeleton className="mt-1 h-2 w-full" />
        </div>
      ))}
    </div>
  )
}

function LevelRowView({ row }: { row: LevelRow }) {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const { x } = row
  const color = compoundColor(x.compoundId)
  const dots = [x.compoundId, ...x.partners.map((p) => p.compoundId)]

  let figure: { value: string; unit?: string; note: string }
  let caption: string
  let graphic: ReactNode

  if (row.kind === 'steady') {
    const amount = amountIn(row.nowMg, x.compound?.defaultUnit ?? 'mg')
    const onBoard = t('levels.onBoardValue', {
      amount: keep(`${fmtNumber(amount.value, locale, amount.digits)} ${amount.label}`),
    })
    figure = {
      value: fmtNumber(Math.round(row.fraction * 100), locale, 0),
      unit: '%',
      note: t('levels.ofSteady'),
    }
    caption = `${onBoard} · ${
      row.hoursTo90 > 0
        ? t('levels.steadyIn', { time: keep(fmtHours(row.hoursTo90, locale)) })
        : t('levels.steadyNow')
    }`
    graphic = (
      <Meter
        value={row.fraction * 100}
        max={100}
        band={[STEADY_FROM * 100, 100]}
        color={color}
        label={t('levels.steadyAria', { pct: `${Math.round(row.fraction * 100)} %` })}
      />
    )
  } else {
    figure = row.lastAt
      ? {
          value: t('levels.ago', { time: sinceShort(row.lastAt, x.asOf) }),
          note: fmtDate(row.lastAt, locale, 'EEE d · HH:mm'),
        }
      : { value: t('levels.noDoses'), note: '' }
    caption =
      row.expected > 0
        ? t('levels.daysDone', { taken: row.taken, expected: row.expected })
        : t('levels.noPlanDays', { n: LEVEL_DAYS })
    graphic = (
      <Ticks
        cells={row.ticks}
        color={color}
        height={14}
        label={t('levels.strip.aria', {
          taken: row.taken,
          planned: row.expected,
          days: row.ticks.length,
        })}
      />
    )
  }

  return (
    <Link
      to={`/substance/${x.compoundId}`}
      className="block px-4 py-3.5 transition first:rounded-t-[inherit] last:rounded-b-[inherit] active:bg-panel-2"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-start gap-2">
            <span className="mt-[7px] flex shrink-0 items-center gap-1" aria-hidden>
              {dots.map((id) => (
                <SubstanceDot key={id} color={compoundColor(id)} />
              ))}
            </span>
            <span className="min-w-0 break-words text-[15px] font-semibold leading-snug">
              {x.title}
            </span>
          </div>
          <p className="mt-1 text-[12.5px] leading-snug text-muted">{caption}</p>
        </div>
        <div className="shrink-0 text-right">
          <div className="readout text-[20px] font-semibold leading-none">
            {figure.value}
            {figure.unit && (
              <span className="ml-0.5 font-sans text-[12px] font-medium text-muted">
                {figure.unit}
              </span>
            )}
          </div>
          {figure.note && (
            <div className="readout mt-1 text-[11.5px] leading-tight text-muted">{figure.note}</div>
          )}
        </div>
      </div>
      <div className="mt-3">{graphic}</div>
    </Link>
  )
}
