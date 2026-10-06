import { clsx } from 'clsx'
import type { TFunction } from 'i18next'
import { useTranslation } from 'react-i18next'
import { Kpi } from '@/components/kpi/Kpi'
import { Meter } from '@/components/kpi/Meter'
import { Card } from '@/components/ui/Card'
import { compoundById } from '@/content/compounds'
import { fmtDate } from '@/lib/format'
import { useLocale } from '@/lib/useLocale'
import { REORDER_DAYS } from './alerts'
import {
  coverGauge,
  expiryTone,
  reorderTone,
  supplyTone,
  TONE_COLOR,
  type StockKpis,
  type SupplyTone,
} from './stockKpis'

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

const VALUE_TONE: Record<SupplyTone, string> = {
  ok: 'text-ink',
  warn: 'text-warn',
  danger: 'text-danger',
}

interface Fact {
  key: string
  label: string
  value: string
  sub: string
  tone?: SupplyTone
}

/**
 * Where the stock stands, at a glance: how many days the whole stock lasts against the order
 * point, then a plain row of facts (open, waiting, what expires first, when to order). A fact
 * with nothing to say is left out rather than shown as a dash.
 */
export function StockStrip({ kpis }: { kpis: StockKpis }) {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const { cover, nextExpiry, reorder } = kpis
  const days = cover?.days ?? null
  const tone = supplyTone(days)
  const shortDate = (d: Date) => fmtDate(d, locale, 'd MMM')

  const facts: Fact[] = [
    {
      key: 'inUse',
      label: t('inventory.kpi.inUse'),
      value: String(kpis.inUse),
      sub: t('inventory.kpi.inUseSub'),
    },
    {
      key: 'reserve',
      label: t('inventory.kpi.reserve'),
      value: String(kpis.reserve),
      sub: t('inventory.kpi.reserveSub'),
    },
  ]
  if (nextExpiry)
    facts.push({
      key: 'expiry',
      label: t('inventory.kpi.expiry'),
      value: `${nextExpiry.estimated ? '≈ ' : ''}${shortDate(nextExpiry.date)}`,
      sub: when(nextExpiry.days, t),
      tone: expiryTone(nextExpiry.days),
    })
  if (reorder)
    facts.push({
      key: 'reorder',
      label: t('inventory.kpi.reorder'),
      value: reorder.days <= 0 ? t('inventory.kpi.reorderNow') : shortDate(reorder.date),
      // Late: what to order (the first name of it, so it fits the column). Ahead: how soon.
      sub: reorder.days <= 0 ? nameOf(reorder.compoundIds[0] ?? '') : when(reorder.days, t),
      tone: reorderTone(reorder.days),
    })

  const orderAt = coverGauge(REORDER_DAYS)

  return (
    <Card className="mb-3">
      {!cover ? (
        <div>
          <span className="spec">{t('inventory.kpi.cover')}</span>
          <p className="mt-1 text-[15px] font-semibold leading-snug">
            {t('inventory.kpi.coverNone')}
          </p>
          <p className="mt-1 text-[12.5px] leading-snug text-muted">
            {t('inventory.kpi.coverNoneHint')}
          </p>
        </div>
      ) : (
        <Kpi
          label={t('inventory.kpi.cover')}
          size="lg"
          tone={tone === 'ok' ? 'default' : tone}
          value={days === null ? t('inventory.kpi.plentyValue') : days}
          unit={
            days === null
              ? t('inventory.kpi.plentyUnit')
              : t('inventory.kpi.dayUnit', { count: days })
          }
          caption={
            days === null
              ? t('inventory.kpi.plentyHint')
              : days === 0
                ? t('inventory.kpi.coverNow', { names: namesOf(cover.compoundIds) })
                : cover.date
                  ? t('inventory.kpi.coverFirstOn', {
                      names: namesOf(cover.compoundIds),
                      date: fmtDate(cover.date, locale, 'EEE d MMM'),
                    })
                  : undefined
          }
        >
          <Meter
            value={coverGauge(days)}
            max={1}
            target={orderAt}
            color={TONE_COLOR[tone]}
            label={
              days === null
                ? t('inventory.kpi.coverAriaPlenty')
                : t('inventory.kpi.coverAria', { count: days })
            }
          />
          {/* What the tick is: the point at which to order, three weeks before running out. */}
          <div aria-hidden className="relative mt-1.5 h-4">
            <span
              className="absolute top-0 -translate-x-1/2 text-[11.5px] leading-none text-muted"
              style={{ left: `${orderAt * 100}%` }}
            >
              {t('inventory.kpi.orderMark')}
            </span>
          </div>
        </Kpi>
      )}

      <dl
        className={clsx(
          'mt-3 grid gap-x-3 gap-y-4 border-t border-line pt-4',
          facts.length > 2 ? 'grid-cols-2 min-[360px]:grid-cols-4' : 'grid-cols-2',
        )}
      >
        {facts.map((f) => (
          <div key={f.key} className="min-w-0">
            <dt className="spec leading-snug">{f.label}</dt>
            <dd className="mt-1">
              <span
                className={clsx(
                  'readout block text-[18px] font-semibold leading-tight',
                  VALUE_TONE[f.tone ?? 'ok'],
                )}
              >
                {f.value}
              </span>
              <span className="mt-0.5 block text-[12px] leading-snug text-muted">{f.sub}</span>
            </dd>
          </div>
        ))}
      </dl>
    </Card>
  )
}
