import { differenceInCalendarDays } from 'date-fns'
import { Archive, Package, Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { usePatientScope } from '@/app/scope'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge, EmptyState, Skeleton, SubstanceDot, Vial } from '@/components/ui/primitives'
import { compoundById } from '@/content/compounds'
import { compoundColor } from '@/content/substanceColor'
import type { InventoryRow } from '@/data/database.types'
import { useArchiveInventory, useDoses, useInventory, useProtocols } from '@/data/hooks'
import { roundUnits } from '@/domain/dosing/draw'
import { mgToUnits } from '@/domain/dosing/reconstitution'
import { upcomingAdministrations } from '@/features/reminders/plan'
import { fmtDate, fmtDose, fmtNumber } from '@/lib/format'
import { useLocale } from '@/lib/useLocale'
import { InventorySheet } from './InventorySheet'
import {
  activeVial,
  concentrationOf,
  restockPlan,
  vialContents,
  vialLook,
  vialRunway,
  type RestockLine,
  type VialRunway,
} from './vials'

export function InventoryPage() {
  const { t } = useTranslation()
  const { patientId, readOnly } = usePatientScope()
  const inventory = useInventory(patientId)
  const protocols = useProtocols(patientId)
  const doses = useDoses(patientId, 120)
  const [editing, setEditing] = useState<InventoryRow | null>(null)
  const [open, setOpen] = useState(false)
  const list = useMemo(() => inventory.data ?? [], [inventory.data])

  // Upcoming doses per compound over the next months, soonest first.
  const upcomingByCompound = useMemo(() => {
    const upcoming = upcomingAdministrations(
      protocols.data ?? [],
      doses.data ?? [],
      list,
      new Date(),
      {
        horizonDays: 240,
      },
    )
    const out = new Map<string, { at: Date; doseMg: number }[]>()
    for (const u of upcoming)
      for (const d of u.doses)
        out.set(d.compoundId, [...(out.get(d.compoundId) ?? []), { at: u.at, doseMg: d.doseMg }])
    return out
  }, [protocols.data, doses.data, list])

  // For the vial each compound is drawn from: how many upcoming doses it still covers.
  const runways = useMemo(() => {
    const out = new Map<string, VialRunway>()
    for (const compoundId of new Set(list.map((v) => v.compound_id))) {
      const vial = activeVial(list, compoundId)
      const mine = upcomingByCompound.get(compoundId)
      if (vial && vial.compound_id === compoundId && mine?.length)
        out.set(vial.id, vialRunway(Number(vial.remaining_mg), mine))
    }
    return out
  }, [upcomingByCompound, list])

  const restock = useMemo(() => restockPlan(list, upcomingByCompound), [list, upcomingByCompound])

  const add = () => {
    setEditing(null)
    setOpen(true)
  }

  return (
    <div className="pb-6">
      <PageHeader
        eyebrow={t('inventory.eyebrow')}
        title={t('inventory.title')}
        large
        back="/more"
        action={
          !readOnly && (
            <Button size="sm" leading={<Plus className="size-4" />} onClick={add}>
              {t('common.add')}
            </Button>
          )
        }
      />

      {inventory.isPending ? (
        <Card>
          <Skeleton className="h-24 w-full" />
        </Card>
      ) : list.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Package className="size-7" />}
            title={t('inventory.empty')}
            description={t('inventory.emptyHint')}
            action={!readOnly && <Button onClick={add}>{t('inventory.add')}</Button>}
          />
        </Card>
      ) : (
        <>
          {restock.length > 0 && <RestockCard lines={restock} />}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {list.map((item) => (
              <VialCard
                key={item.id}
                item={item}
                runway={runways.get(item.id)}
                readOnly={readOnly}
                onEdit={() => {
                  setEditing(item)
                  setOpen(true)
                }}
              />
            ))}
          </div>
        </>
      )}

      <InventorySheet open={open} onClose={() => setOpen(false)} editing={editing} />
    </div>
  )
}

function VialCard({
  item,
  runway,
  readOnly,
  onEdit,
}: {
  item: InventoryRow
  /** Present for the vial currently drawn from, when a protocol uses it. */
  runway?: VialRunway
  readOnly: boolean
  onEdit: () => void
}) {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const { patientId } = usePatientScope()
  const archive = useArchiveInventory(patientId)
  const compound = compoundById(item.compound_id)
  const color = compoundColor(item.compound_id)
  const total = Number(item.total_mg)
  const remaining = Number(item.remaining_mg)
  const fill = total > 0 ? remaining / total : 0
  const conc = concentrationOf(item)
  const expiryDays = item.expires_at
    ? differenceInCalendarDays(new Date(item.expires_at), new Date())
    : null
  const openDays = item.opened_at
    ? differenceInCalendarDays(new Date(), new Date(item.opened_at))
    : null
  const unit = compound?.defaultUnit ?? 'mg'
  // Your next dose when a protocol uses this vial; otherwise a typical 100 mcg / 0.25 mg.
  const doseMg = runway?.nextDoseMg ?? (unit === 'mcg' ? 0.1 : 0.25)
  // It expires before it runs out: the expiry date is what forces the next vial.
  const expiresFirst =
    runway && item.expires_at
      ? !runway.runsOutAt || new Date(item.expires_at) < runway.runsOutAt
      : false
  const needBy = expiresFirst ? new Date(item.expires_at!) : (runway?.runsOutAt ?? null)
  const short =
    (runway ? runway.runsOutAt !== null && runway.doses <= 2 : false) ||
    (expiresFirst && expiryDays !== null && expiryDays <= 7)

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
        <Vial {...vialLook(item)} size={64} low={short} />
        <div className="min-w-0 flex-1">
          <div className="spec truncate">
            {vialContents(item)
              .map((c) => compoundById(c.compoundId)?.names.generic ?? c.compoundId)
              .join(' + ')}
          </div>
          <div className="mt-0.5 truncate text-[15px] font-semibold">{item.label}</div>
          <div className="readout mt-2 text-[22px] font-semibold leading-none" style={{ color }}>
            {fmtNumber(remaining, locale, 2)}
            <span className="ml-1 text-[12px] text-muted">/ {fmtNumber(total, locale, 2)} mg</span>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {(short || (!runway && fill <= 0.2)) && <Badge tone="warn">{t('inventory.low')}</Badge>}
            {expiryDays !== null && expiryDays < 0 && (
              <Badge tone="danger">{t('inventory.expired')}</Badge>
            )}
            {expiryDays !== null && expiryDays >= 0 && expiryDays <= 30 && (
              <Badge tone="warn">{t('inventory.expiresSoon', { days: expiryDays })}</Badge>
            )}
          </div>
        </div>
      </button>
      <div className="grid grid-cols-3 gap-px border-t border-line bg-line text-center">
        <Spec
          label={t('calculator.concentration')}
          value={conc ? `${fmtNumber(conc, locale, 2)} mg/mL` : '—'}
        />
        <Spec
          label={
            runway
              ? t('inventory.yourDose', { dose: fmtDose(doseMg, unit, locale) })
              : fmtDose(doseMg, unit, locale)
          }
          value={conc ? `${fmtNumber(roundUnits(mgToUnits(doseMg, conc)), locale, 1)} U` : '—'}
          accent={Boolean(runway && conc)}
        />
        {runway ? (
          <Spec
            label={t('inventory.covers')}
            value={t('inventory.dosesLeft', { count: runway.doses })}
            warn={short}
          />
        ) : (
          <Spec
            label={openDays !== null ? t('inventory.openedShort') : t('inventory.expiresShort')}
            value={
              openDays !== null
                ? t('common.days', { count: openDays })
                : item.expires_at
                  ? fmtDate(new Date(item.expires_at), locale, 'd MMM')
                  : conc
                    ? '—'
                    : t('inventory.lyophilised')
            }
          />
        )}
      </div>
      {runway && needBy && (
        <div
          className={
            short
              ? 'border-t border-line bg-warn-soft px-4 py-2 text-[12px] font-semibold text-warn'
              : 'border-t border-line px-4 py-2 text-[12px] text-muted'
          }
        >
          {t(expiresFirst ? 'inventory.expiresBeforeEmpty' : 'inventory.nextVialBy', {
            date: fmtDate(needBy, locale, 'EEE d MMM'),
          })}
          {openDays !== null && ` · ${t('inventory.openedFor', { count: openDays })}`}
        </div>
      )}
      {!readOnly && (
        <button
          type="button"
          aria-label={t('inventory.archive')}
          onClick={() => archive.mutate({ id: item.id, archived: true })}
          className="absolute right-3 top-3 grid size-8 place-items-center rounded-full text-muted hover:bg-panel-2 hover:text-ink"
        >
          <Archive className="size-4" />
        </button>
      )}
    </Card>
  )
}

function Spec({
  label,
  value,
  accent,
  warn,
}: {
  label: string
  value: string
  accent?: boolean
  warn?: boolean
}) {
  return (
    <div className="bg-panel px-2 py-2.5">
      <div className="spec truncate text-[9.5px]">{label}</div>
      <div
        className={`readout mt-0.5 truncate text-[12.5px] font-semibold ${
          warn ? 'text-warn' : accent ? 'text-signal' : ''
        }`}
      >
        {value}
      </div>
    </div>
  )
}

/** Supply per substance in use, across every vial: when to order more. */
function RestockCard({ lines }: { lines: RestockLine[] }) {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const now = new Date()
  return (
    <Card
      instrument
      eyebrow={t('inventory.restockEyebrow')}
      title={t('inventory.restockTitle')}
      className="mb-3"
    >
      <ul className="flex flex-col divide-y divide-line">
        {lines.map((l) => {
          const days = l.runway.runsOutAt ? differenceInCalendarDays(l.runway.runsOutAt, now) : null
          const urgent = days !== null && days <= 14
          const soon = days !== null && days <= 30
          return (
            <li key={l.compoundId} className="flex items-center gap-3 py-2.5">
              <SubstanceDot color={compoundColor(l.compoundId)} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[14px] font-semibold">
                  {compoundById(l.compoundId)?.names.generic ?? l.compoundId}
                </span>
                <span className="readout block text-[11.5px] text-muted">
                  {fmtNumber(l.availableMg, locale, 2)} mg ·{' '}
                  {t('inventory.vialsCount', { count: l.vials })}
                  {l.reserve > 0 && ` · ${t('inventory.reserveCount', { count: l.reserve })}`}
                </span>
              </span>
              <span className="shrink-0 text-right">
                {l.runway.runsOutAt ? (
                  <>
                    <span
                      className={`readout block text-[13px] font-semibold ${urgent ? 'text-danger' : soon ? 'text-warn' : 'text-ink'}`}
                    >
                      {t('inventory.until', { date: fmtDate(l.runway.runsOutAt, locale, 'd MMM') })}
                    </span>
                    <span className={`spec block text-[9.5px] ${urgent ? 'text-danger' : ''}`}>
                      {urgent
                        ? t('inventory.orderNow')
                        : t('inventory.dosesLeft', { count: l.runway.doses })}
                    </span>
                  </>
                ) : (
                  <span className="readout block text-[13px] font-semibold text-signal">
                    {t('inventory.plenty')}
                  </span>
                )}
              </span>
            </li>
          )
        })}
      </ul>
    </Card>
  )
}
