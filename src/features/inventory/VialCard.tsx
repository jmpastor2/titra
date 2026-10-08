import { clsx } from 'clsx'
import { useTranslation } from 'react-i18next'
import { Kpi } from '@/components/kpi/Kpi'
import { Meter } from '@/components/kpi/Meter'
import { Card } from '@/components/ui/Card'
import { Badge, Vial } from '@/components/ui/primitives'
import { compoundById } from '@/content/compounds'
import { compoundColor } from '@/content/substanceColor'
import type { InventoryRow } from '@/data/database.types'
import { fmtDate, fmtNumber } from '@/lib/format'
import { useLocale } from '@/lib/useLocale'
import { TONE_TEXT } from './stockKpis'
import { fmtMg, namesAboveLabel } from './vialFormat'
import { VialActions } from './VialActions'
import { VialFacts } from './VialFacts'
import { vialView } from './vialView'
import { fillOf, vialContents, vialLook, type VialRunway } from './vials'

interface Props {
  item: InventoryRow
  /** Present for the vial currently drawn from, when a protocol uses it. */
  runway?: VialRunway
  /** The same vial walked with its discard date (supply.ts): what it gives before it expires. */
  usable?: VialRunway
  /** The next dose of this compound, for any reconstituted vial of it. */
  nextDoseMg?: number | null
  now: Date
  readOnly: boolean
  onEdit: () => void
  onReconstitute: () => void
  onAddSame: () => void
  onArchive: () => void
}

/**
 * One vial in a glance: what it is, one big number (the doses it still covers, or the mg
 * left), until when it lasts, how much of it is used and its use-by date in words. Below,
 * the units for your dose and the concentration, then what to do with it.
 */
export function VialCard({
  item,
  runway,
  usable,
  nextDoseMg,
  now,
  readOnly,
  onEdit,
  onReconstitute,
  onAddSame,
  onArchive,
}: Props) {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const color = compoundColor(item.compound_id)
  const fill = fillOf(item)
  const view = vialView(item, runway, now)
  const { expiry } = view
  // It expires with product left: the doses that count are the ones before that day, and the
  // note says what would be thrown away instead of repeating "have the next one ready".
  const wastes = usable?.limitedBy === 'expiry' && !view.powder
  const hero =
    wastes && view.hero.kind === 'doses' ? { ...view.hero, count: usable.doses } : view.hero
  // Past only the in-use guide (no label date), the vial still runs on its mg: no "it would
  // last…" or "have the next one ready" built on a date that is an estimate.
  const soft = Boolean(expiry?.estimated)
  const nextVial = wastes || (soft && view.nextVial?.kind === 'beforeEmpty') ? null : view.nextVial
  const names = vialContents(item)
    .map((c) => compoundById(c.compoundId)?.names.generic ?? c.compoundId)
    .join(' + ')
  const total = fmtMg(view.totalMg, locale)
  const day = (d: Date) => fmtDate(d, locale, 'EEE d MMM')

  const support = (() => {
    if (view.powder) return t('inventory.card.powderHint')
    if (wastes)
      return t('inventory.card.wasteAtExpiry', {
        count: hero.kind === 'doses' ? hero.count : 0,
        mg: fmtNumber(usable.wastedMg ?? 0, locale, 2),
      })
    if (hero.kind === 'doses' && view.coverDate) {
      if (hero.count === 0) return t('inventory.card.cannotCover')
      // The first dose it cannot cover can be later today: it lasts until then.
      if (view.coverDays === 0) return t('inventory.card.lastsToday')
      // It expires before then: the run-out day is only what the content would give.
      return t(view.expiresFirst && !soft ? 'inventory.card.wouldLast' : 'inventory.card.lasts', {
        count: view.coverDays ?? 0,
        date: fmtDate(view.coverDate, locale, 'd MMM'),
      })
    }
    if (runway) return t('inventory.card.coversAll')
    return null
  })()

  const expiryText = expiry
    ? (() => {
        const date = `${expiry.estimated ? '≈ ' : ''}${day(expiry.date)}`
        return expiry.days < 0
          ? t(expiry.estimated ? 'inventory.card.pastGuide' : 'inventory.card.expiredAgo', {
              count: -expiry.days,
              date,
            })
          : t('inventory.card.expiresIn', { count: expiry.days, date })
      })()
    : null

  const nextText =
    nextVial?.kind === 'beforeEmpty'
      ? t('inventory.card.beforeEmpty')
      : nextVial?.kind === 'readyBy'
        ? t('inventory.nextVialBy', { date: day(nextVial.date) })
        : null

  return (
    <Card padded={false} className="overflow-hidden">
      <button
        type="button"
        disabled={readOnly}
        onClick={onEdit}
        className="block w-full p-4 text-left outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-signal/60"
      >
        <div className="flex items-center gap-3">
          <Vial {...vialLook(item)} size={52} low={view.low || view.short} />
          <div className="min-w-0 flex-1 pt-0.5">
            {namesAboveLabel(names, item.label) && (
              <div className="spec mb-0.5 leading-snug">{names}</div>
            )}
            <div className="text-[16px] font-semibold leading-snug">{item.label}</div>
          </div>
        </div>

        <Kpi
          className="mt-4"
          size="lg"
          label={
            hero.kind === 'doses' || !view.powder
              ? t(
                  hero.kind === 'doses' && hero.count === 1
                    ? 'inventory.card.leftOne'
                    : 'inventory.card.left',
                )
              : t('inventory.card.content')
          }
          value={hero.kind === 'doses' ? hero.count : fmtNumber(hero.mg, locale, 2)}
          unit={hero.kind === 'doses' ? t('inventory.card.dosesUnit', { count: hero.count }) : 'mg'}
          tone={view.low ? 'warn' : 'default'}
          aside={view.low ? <Badge tone="warn">{t('inventory.low')}</Badge> : undefined}
          caption={support ?? undefined}
        >
          {!view.powder && (
            <>
              <Meter
                value={view.leftMg}
                max={view.totalMg}
                color={color}
                label={t('inventory.fillAria', { pct: Math.round(fill * 100) })}
              />
              <span className="readout mt-1.5 block text-[12px] text-muted">
                {hero.kind === 'doses'
                  ? t('inventory.card.mgOfTotal', { left: fmtMg(view.leftMg, locale), total })
                  : t('inventory.card.ofTotalPct', {
                      total,
                      pct: fmtNumber(fill * 100, locale, 0),
                    })}
              </span>
            </>
          )}
        </Kpi>

        {(expiryText || nextText) && (
          <div className="mt-3 flex flex-col gap-0.5 text-[13px] font-medium leading-snug">
            {expiryText && (
              <span
                className={clsx(
                  expiry && expiry.tone !== 'ok' ? TONE_TEXT[expiry.tone] : 'text-ink-2',
                )}
              >
                {expiryText}
              </span>
            )}
            {nextText && (
              <span className={view.short ? 'text-warn' : 'text-muted'}>{nextText}</span>
            )}
          </div>
        )}
      </button>

      <VialFacts item={item} runway={runway} nextDoseMg={nextDoseMg} />

      {!readOnly && (
        <VialActions
          label={item.label}
          powder={view.powder}
          onReconstitute={onReconstitute}
          onAddSame={onAddSame}
          onArchive={onArchive}
        />
      )}
    </Card>
  )
}
