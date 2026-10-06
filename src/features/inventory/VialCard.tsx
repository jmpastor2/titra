import { clsx } from 'clsx'
import { useTranslation } from 'react-i18next'
import { Ring } from '@/components/kpi/Ring'
import { Card } from '@/components/ui/Card'
import { Badge, Vial } from '@/components/ui/primitives'
import { compoundById } from '@/content/compounds'
import { compoundColor } from '@/content/substanceColor'
import type { InventoryRow } from '@/data/database.types'
import { fmtDate, fmtNumber } from '@/lib/format'
import { useLocale } from '@/lib/useLocale'
import { TONE_COLOR } from './stockKpis'
import { fmtMg } from './vialFormat'
import { VialActions } from './VialActions'
import { VialFacts } from './VialFacts'
import { vialView, type VialExpiry } from './vialView'
import { fillOf, vialContents, vialLook, type VialRunway } from './vials'

interface Props {
  item: InventoryRow
  /** Present for the vial currently drawn from, when a protocol uses it. */
  runway?: VialRunway
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
 * left), how much of it is used, how long it lasts and, once reconstituted, how long it
 * is good for. Below, the units for your dose and what to do with it.
 */
export function VialCard({
  item,
  runway,
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
  const { hero, expiry, needBy, short } = view
  const names = vialContents(item)
    .map((c) => compoundById(c.compoundId)?.names.generic ?? c.compoundId)
    .join(' + ')
  const total = fmtMg(view.totalMg, locale)

  const support = (() => {
    if (view.powder) return t('inventory.card.powderHint')
    if (hero.kind === 'doses' && view.coverDate) {
      if (hero.count === 0) return t('inventory.card.cannotCover')
      // The first dose it cannot cover can be later today: it lasts until then.
      if (view.coverDays === 0) return t('inventory.card.lastsToday')
      return t('inventory.card.lasts', {
        count: view.coverDays ?? 0,
        date: fmtDate(view.coverDate, locale, 'd MMM'),
      })
    }
    if (runway) return t('inventory.card.coversAll')
    return t('inventory.card.ofTotalPct', { total, pct: fmtNumber(fill * 100, locale, 0) })
  })()

  return (
    <Card
      padded={false}
      className="overflow-hidden"
      style={{ borderColor: `color-mix(in oklab, ${color} 28%, var(--line))` }}
    >
      <button
        type="button"
        disabled={readOnly}
        onClick={onEdit}
        className="block w-full p-4 text-left"
      >
        <div className="flex gap-3.5">
          <Vial {...vialLook(item)} size={64} low={view.low || short} />
          <div className="min-w-0 flex-1">
            <div className="spec leading-snug">{names}</div>
            <div className="mt-1 text-[16px] font-semibold leading-snug">{item.label}</div>
            {(view.low || view.expired || (view.expiring && !expiry)) && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {view.low && <Badge tone="warn">{t('inventory.low')}</Badge>}
                {view.expired && <Badge tone="danger">{t('inventory.expired')}</Badge>}
                {view.expiring && !expiry && (
                  <Badge tone="warn">
                    {view.expiryEstimated ? '≈ ' : ''}
                    {t('inventory.expiresSoon', { days: view.expiryDays ?? 0 })}
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <div className="readout flex items-baseline gap-1.5 leading-none">
              <span className="text-[36px] font-semibold" style={{ color }}>
                {hero.kind === 'doses' ? hero.count : fmtNumber(hero.mg, locale, 2)}
              </span>
              <span className="text-[14px] font-semibold text-ink-2">
                {hero.kind === 'doses'
                  ? t('inventory.card.dosesUnit', { count: hero.count })
                  : 'mg'}
              </span>
            </div>
            <span className="mt-2 block text-[13px] leading-snug text-ink-2">{support}</span>
          </div>
          {expiry && <ExpiryRing expiry={expiry} />}
        </div>

        {!view.powder && (
          <>
            <div
              role="img"
              aria-label={t('inventory.fillAria', { pct: Math.round(fill * 100) })}
              className="mt-4 h-[5px] overflow-hidden rounded-full bg-panel-3"
            >
              <div
                className="h-full rounded-full"
                style={{ width: `${fill * 100}%`, background: color }}
              />
            </div>
            {hero.kind === 'doses' && (
              <div className="readout mt-1.5 text-[11.5px] text-muted">
                {t('inventory.card.mgOfTotal', {
                  left: fmtMg(view.leftMg, locale),
                  total,
                })}
              </div>
            )}
          </>
        )}
      </button>

      <VialFacts item={item} runway={runway} nextDoseMg={nextDoseMg} />

      {runway && needBy && (
        <div
          className={clsx(
            'border-t border-line px-4 py-2.5 text-[12.5px] leading-snug',
            short ? 'bg-warn-soft font-semibold text-warn' : 'text-muted',
          )}
        >
          {t(view.expiresFirst ? 'inventory.expiresBeforeEmpty' : 'inventory.nextVialBy', {
            date: fmtDate(needBy, locale, 'EEE d MMM'),
          })}
        </div>
      )}

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

/** Days left of the vial's use-by period: the ring empties as it gets old. */
function ExpiryRing({ expiry }: { expiry: VialExpiry }) {
  const { t } = useTranslation()
  const expired = expiry.days < 0
  const label = [
    expired
      ? t('inventory.card.expiredAria', { count: -expiry.days })
      : t('inventory.card.expiryAria', { count: expiry.days }),
    expiry.estimated ? t('inventory.card.estimated') : null,
  ]
    .filter(Boolean)
    .join(', ')
  return (
    <div className="flex shrink-0 flex-col items-center gap-1">
      <Ring value={expiry.left} size={56} stroke={5} color={TONE_COLOR[expiry.tone]} label={label}>
        <div className="flex flex-col items-center leading-none">
          <span className="readout text-[16px] font-semibold">{Math.max(0, expiry.days)}</span>
          <span className="mt-0.5 text-[9.5px] text-muted">{t('inventory.card.dayShort')}</span>
        </div>
      </Ring>
      <span className={clsx('spec text-[9px]', expired && 'text-danger')}>
        {expired
          ? t('inventory.card.expiredCaption')
          : t(
              expiry.estimated
                ? 'inventory.card.expiryCaptionEstimated'
                : 'inventory.card.expiryCaption',
            )}
      </span>
    </div>
  )
}
