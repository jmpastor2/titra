import { differenceInCalendarDays } from 'date-fns'
import { Archive, Package, Plus } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { usePatientScope } from '@/app/scope'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge, EmptyState, Skeleton, Vial } from '@/components/ui/primitives'
import { compoundById } from '@/content/compounds'
import { compoundColor } from '@/content/substanceColor'
import type { InventoryRow } from '@/data/database.types'
import { useArchiveInventory, useInventory } from '@/data/hooks'
import { mgToUnits } from '@/domain/dosing/reconstitution'
import { fmtDate, fmtNumber } from '@/lib/format'
import { useLocale } from '@/lib/useLocale'
import { InventorySheet } from './InventorySheet'
import { concentrationOf } from './vials'

export function InventoryPage() {
  const { t } = useTranslation()
  const { patientId, readOnly } = usePatientScope()
  const inventory = useInventory(patientId)
  const [editing, setEditing] = useState<InventoryRow | null>(null)
  const [open, setOpen] = useState(false)
  const list = inventory.data ?? []

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
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {list.map((item) => (
            <VialCard
              key={item.id}
              item={item}
              readOnly={readOnly}
              onEdit={() => {
                setEditing(item)
                setOpen(true)
              }}
            />
          ))}
        </div>
      )}

      <InventorySheet open={open} onClose={() => setOpen(false)} editing={editing} />
    </div>
  )
}

function VialCard({
  item,
  readOnly,
  onEdit,
}: {
  item: InventoryRow
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
  const sampleMg = compound?.defaultUnit === 'mcg' ? 0.1 : 0.25

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
        <Vial color={color} fill={fill} size={64} />
        <div className="min-w-0 flex-1">
          <div className="spec truncate">{compound?.names.generic ?? item.compound_id}</div>
          <div className="mt-0.5 truncate text-[15px] font-semibold">{item.label}</div>
          <div className="readout mt-2 text-[22px] font-semibold leading-none" style={{ color }}>
            {fmtNumber(remaining, locale, 2)}
            <span className="ml-1 text-[12px] text-muted">/ {fmtNumber(total, locale, 2)} mg</span>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {fill <= 0.2 && <Badge tone="warn">{t('inventory.low')}</Badge>}
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
            compound?.defaultUnit === 'mcg' ? '100 mcg' : `${fmtNumber(sampleMg, locale, 2)} mg`
          }
          value={conc ? `${fmtNumber(mgToUnits(sampleMg, conc), locale, 1)} U` : '—'}
        />
        <Spec
          label={openDays !== null ? t('inventory.openedShort') : t('inventory.expiresShort')}
          value={
            openDays !== null
              ? t('common.days', { count: openDays })
              : item.expires_at
                ? fmtDate(new Date(item.expires_at), locale, 'd MMM')
                : '—'
          }
        />
      </div>
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

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-panel px-2 py-2.5">
      <div className="spec truncate text-[9.5px]">{label}</div>
      <div className="readout mt-0.5 truncate text-[12.5px] font-semibold">{value}</div>
    </div>
  )
}
