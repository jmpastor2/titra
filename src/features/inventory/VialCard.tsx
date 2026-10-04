import { clsx } from 'clsx'
import { useTranslation } from 'react-i18next'
import { Badge, Vial } from '@/components/ui/primitives'
import { Card } from '@/components/ui/Card'
import { compoundById } from '@/content/compounds'
import { compoundColor } from '@/content/substanceColor'
import type { InventoryRow } from '@/data/database.types'
import { fmtDate, fmtNumber } from '@/lib/format'
import { useLocale } from '@/lib/useLocale'
import { inUseProgress, vialOutlook } from './alerts'
import { fmtMg } from './vialFormat'
import { VialActions } from './VialActions'
import { VialFacts } from './VialFacts'
import {
  fillOf,
  needsReconstitution,
  vialContents,
  vialLook,
  vialState,
  type VialRunway,
} from './vials'

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
 * One vial as an instrument: what it is and how much is left, its state at a glance,
 * the units to draw for the current dose, the in-use countdown and what to do next.
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
  const powder = needsReconstitution(item)
  const reserve = vialState(item) === 'reserve'
  const outlook = vialOutlook(item, runway, now)
  const progress = inUseProgress(item, now)
  const names = vialContents(item)
    .map((c) => compoundById(c.compoundId)?.names.generic ?? c.compoundId)
    .join(' + ')
  const { expiry, expiryDays, short, runningLow, expiresFirst, needBy } = outlook
  // Running low: the runway says so, or (no protocol uses it) a fifth of it is left.
  const low = runningLow || (!runway && !powder && fill <= 0.2)
  const expired = expiryDays !== null && expiryDays < 0
  const expiring = expiryDays !== null && expiryDays >= 0 && expiryDays <= 30

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
        className="flex w-full gap-4 p-4 text-left"
      >
        <Vial {...vialLook(item)} size={72} low={low || short} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className="spec truncate">{names}</span>
            <Badge tone={reserve ? 'neutral' : 'brand'} className="shrink-0">
              <span
                aria-hidden
                className={clsx(
                  'size-1.5 rounded-full',
                  reserve ? 'border border-current' : 'bg-current',
                )}
              />
              {reserve ? t('inventory.statusReserve') : t('inventory.statusInUse')}
            </Badge>
          </div>
          <div className="mt-0.5 truncate text-[16px] font-semibold leading-snug">{item.label}</div>
          <div className="readout mt-2 flex items-baseline gap-1 leading-none">
            <span className="text-[26px] font-semibold" style={{ color }}>
              {fmtNumber(Number(item.remaining_mg), locale, 2)}
            </span>
            <span className="text-[12px] text-muted">/ {fmtMg(Number(item.total_mg), locale)}</span>
          </div>
          <div
            role="img"
            aria-label={t('inventory.fillAria', { pct: Math.round(fill * 100) })}
            className="mt-2 h-[3px] overflow-hidden rounded-full bg-panel-3"
          >
            <div
              className="h-full rounded-full"
              style={{ width: `${fill * 100}%`, background: color }}
            />
          </div>
          {(low || expired || expiring) && (
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {low && <Badge tone="warn">{t('inventory.low')}</Badge>}
              {expired && <Badge tone="danger">{t('inventory.expired')}</Badge>}
              {expiring && (
                <Badge tone="warn">
                  {expiry?.estimated ? '≈ ' : ''}
                  {t('inventory.expiresSoon', { days: expiryDays })}
                </Badge>
              )}
            </div>
          )}
        </div>
      </button>

      <VialFacts item={item} runway={runway} nextDoseMg={nextDoseMg} short={short} />

      {progress && (
        <div className="flex items-center gap-3 border-t border-line px-4 py-2.5">
          <span className="spec shrink-0">
            {t('inventory.dayOf', { day: progress.day, of: progress.of })}
          </span>
          <div
            role="img"
            aria-label={t('inventory.dayOf', { day: progress.day, of: progress.of })}
            className="h-[3px] min-w-0 flex-1 overflow-hidden rounded-full bg-panel-3"
          >
            <div
              className="h-full rounded-full"
              style={{
                width: `${progress.fraction * 100}%`,
                background: progress.over
                  ? 'var(--danger)'
                  : progress.fraction >= 0.85
                    ? 'var(--warn)'
                    : 'var(--signal)',
              }}
            />
          </div>
          <span className="readout shrink-0 text-[11.5px] text-muted">
            {progress.estimated ? '≈ ' : ''}
            {fmtDate(progress.endsAt, locale, 'd MMM')}
          </span>
        </div>
      )}

      {runway && needBy && (
        <div
          className={clsx(
            'border-t border-line px-4 py-2 text-[12px]',
            short ? 'bg-warn-soft font-semibold text-warn' : 'text-muted',
          )}
        >
          {t(expiresFirst ? 'inventory.expiresBeforeEmpty' : 'inventory.nextVialBy', {
            date: fmtDate(needBy, locale, 'EEE d MMM'),
          })}
        </div>
      )}

      {!readOnly && (
        <VialActions
          label={item.label}
          powder={powder}
          onReconstitute={onReconstitute}
          onAddSame={onAddSame}
          onArchive={onArchive}
        />
      )}
    </Card>
  )
}
