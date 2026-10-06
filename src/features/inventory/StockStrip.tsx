import { clsx } from 'clsx'
import type { TFunction } from 'i18next'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Card } from '@/components/ui/Card'
import { Ring } from '@/components/kpi/Ring'
import { compoundById } from '@/content/compounds'
import { fmtDate } from '@/lib/format'
import { useLocale } from '@/lib/useLocale'
import { coverGauge, supplyTone, TONE_COLOR, type StockKpis, type SupplyTone } from './stockKpis'

const nameOf = (id: string) => compoundById(id)?.names.generic ?? id
const namesOf = (ids: readonly string[]) => ids.map(nameOf).join(' + ')

/** "hoy", "mañana", "en 5 días", "hace 3 días". */
function when(days: number, t: TFunction): string {
  if (days === 0) return t('inventory.rel.today')
  if (days === 1) return t('inventory.rel.tomorrow')
  return days > 0
    ? t('inventory.rel.in', { count: days })
    : t('inventory.rel.ago', { count: -days })
}

const TEXT_TONE: Record<SupplyTone, string> = { ok: '', warn: 'text-warn', danger: 'text-danger' }

/**
 * Where the stock stands, at a glance: how many days the whole stock lasts (the ring), the
 * vials open and waiting, what expires first and when to order.
 */
export function StockStrip({ kpis }: { kpis: StockKpis }) {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const { cover, nextExpiry, reorder } = kpis
  const days = cover?.days ?? null
  const tone = supplyTone(days)
  const names = cover ? namesOf(cover.compoundIds) : ''

  const expiryTone: SupplyTone =
    nextExpiry && nextExpiry.days < 0
      ? 'danger'
      : nextExpiry && nextExpiry.days <= 7
        ? 'warn'
        : 'ok'
  const reorderTone: SupplyTone = reorder && reorder.days <= 0 ? 'danger' : 'ok'

  return (
    <Card instrument padded={false} className="mb-3 overflow-hidden">
      <div className="flex items-center gap-4 p-4 pt-5">
        <Ring
          value={cover ? coverGauge(days) : 0}
          size={88}
          stroke={7}
          color={TONE_COLOR[tone]}
          label={
            cover
              ? days === null
                ? t('inventory.kpi.coverAriaPlenty')
                : t('inventory.kpi.coverAria', { count: days })
              : t('inventory.kpi.coverNone')
          }
        >
          <div className="flex flex-col items-center leading-none">
            <span className="readout text-[26px] font-semibold">
              {!cover ? '—' : days === null ? t('inventory.kpi.plentyValue') : days}
            </span>
            {cover && (
              <span className="mt-1 text-[10.5px] text-muted">
                {days === null
                  ? t('inventory.kpi.plentyUnit')
                  : t('inventory.kpi.dayUnit', { count: days })}
              </span>
            )}
          </div>
        </Ring>
        <div className="min-w-0 flex-1">
          <div className="spec">{t('inventory.kpi.coverTitle')}</div>
          {!cover ? (
            <>
              <p className="mt-1.5 text-[15px] font-semibold leading-snug">
                {t('inventory.kpi.coverNone')}
              </p>
              <p className="mt-1 text-[12.5px] leading-snug text-muted">
                {t('inventory.kpi.coverNoneHint')}
              </p>
            </>
          ) : days === null ? (
            <>
              <p className="mt-1.5 text-[15px] font-semibold leading-snug">
                {t('inventory.plenty')}
              </p>
              <p className="mt-1 text-[12.5px] leading-snug text-muted">
                {t('inventory.kpi.plentyHint')}
              </p>
            </>
          ) : days === 0 ? (
            <>
              <p className="mt-1.5 text-[15px] font-semibold leading-snug text-danger">
                {t('inventory.kpi.coverNow', { names })}
              </p>
              <p className="mt-1 text-[12.5px] leading-snug text-muted">
                {t('inventory.kpi.coverNowHint')}
              </p>
            </>
          ) : (
            <>
              <p className={clsx('mt-1.5 text-[15px] font-semibold leading-snug', TEXT_TONE[tone])}>
                {cover.date &&
                  t('inventory.kpi.coverUntil', { date: fmtDate(cover.date, locale, 'd MMM') })}
              </p>
              <p className="mt-1 text-[12.5px] leading-snug text-muted">
                {t('inventory.kpi.coverFirst', { names })}
              </p>
            </>
          )}
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-px border-t border-line bg-line">
        <Kpi
          label={t('inventory.kpi.inUse')}
          value={String(kpis.inUse)}
          sub={t('inventory.kpi.inUseSub')}
        />
        <Kpi
          label={t('inventory.kpi.reserve')}
          value={String(kpis.reserve)}
          sub={t('inventory.kpi.reserveSub')}
        />
        <Kpi
          label={t('inventory.kpi.expiry')}
          value={
            nextExpiry
              ? `${nextExpiry.estimated ? '≈ ' : ''}${fmtDate(nextExpiry.date, locale, 'd MMM')}`
              : '—'
          }
          sub={
            nextExpiry
              ? `${nextExpiry.label} · ${when(nextExpiry.days, t)}`
              : t('inventory.kpi.expiryNone')
          }
          tone={expiryTone}
        />
        <Kpi
          label={t('inventory.kpi.reorder')}
          value={
            reorder
              ? reorder.days <= 0
                ? t('inventory.kpi.reorderNow')
                : fmtDate(reorder.date, locale, 'd MMM')
              : '—'
          }
          sub={
            reorder
              ? t('inventory.kpi.reorderSub', {
                  names: namesOf(reorder.compoundIds),
                  date: fmtDate(reorder.runsOutAt, locale, 'd MMM'),
                })
              : t('inventory.kpi.reorderNone')
          }
          tone={reorderTone}
        />
      </dl>
    </Card>
  )
}

function Kpi({
  label,
  value,
  sub,
  tone = 'ok',
}: {
  label: string
  value: ReactNode
  sub: string
  tone?: SupplyTone
}) {
  return (
    <div className="bg-panel px-4 py-3">
      <dt className="spec">{label}</dt>
      <dd className="mt-1.5">
        <span
          className={clsx('readout block text-[22px] font-semibold leading-none', TEXT_TONE[tone])}
        >
          {value}
        </span>
        <span className="mt-1.5 block text-[12px] leading-snug text-muted">{sub}</span>
      </dd>
    </div>
  )
}
