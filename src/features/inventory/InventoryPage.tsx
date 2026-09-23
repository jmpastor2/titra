import { differenceInCalendarDays } from 'date-fns'
import { Archive, Package, Plus } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { usePatientScope } from '@/app/scope'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge, EmptyState, Skeleton } from '@/components/ui/primitives'
import { compoundName } from '@/content/compounds'
import type { InventoryRow } from '@/data/database.types'
import { useArchiveInventory, useInventory } from '@/data/hooks'
import { fmtDate, fmtNumber } from '@/lib/format'
import { useLocale } from '@/lib/useLocale'
import { InventorySheet } from './InventorySheet'

export function InventoryPage() {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const { patientId, readOnly } = usePatientScope()
  const inventory = useInventory(patientId)
  const archive = useArchiveInventory(patientId)
  const [editing, setEditing] = useState<InventoryRow | null>(null)
  const [open, setOpen] = useState(false)

  const list = inventory.data ?? []

  return (
    <div className="pb-6">
      <PageHeader
        title={t('inventory.title')}
        back="/more"
        action={
          !readOnly && (
            <Button
              size="sm"
              leading={<Plus className="size-4" />}
              onClick={() => {
                setEditing(null)
                setOpen(true)
              }}
            >
              {t('common.add')}
            </Button>
          )
        }
      />

      {inventory.isPending ? (
        <Card>
          <Skeleton className="h-20 w-full" />
        </Card>
      ) : list.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Package className="size-7" />}
            title={t('inventory.empty')}
            description={t('inventory.emptyHint')}
            action={
              !readOnly && (
                <Button
                  onClick={() => {
                    setEditing(null)
                    setOpen(true)
                  }}
                >
                  {t('inventory.add')}
                </Button>
              )
            }
          />
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {list.map((item) => {
            const pct = item.total_mg > 0 ? Number(item.remaining_mg) / Number(item.total_mg) : 0
            const expiryDays = item.expires_at
              ? differenceInCalendarDays(new Date(item.expires_at), new Date())
              : null
            const openDays = item.opened_at
              ? differenceInCalendarDays(new Date(), new Date(item.opened_at))
              : null
            return (
              <Card
                key={item.id}
                title={item.label}
                subtitle={`${compoundName(item.compound_id)} · ${t(`inventory.forms.${item.form}`)}`}
                action={
                  !readOnly && (
                    <button
                      type="button"
                      aria-label={t('inventory.archive')}
                      onClick={() => archive.mutate({ id: item.id, archived: true })}
                      className="grid size-8 place-items-center rounded-full text-muted hover:bg-surface-2"
                    >
                      <Archive className="size-4" />
                    </button>
                  )
                }
              >
                <button
                  type="button"
                  disabled={readOnly}
                  onClick={() => {
                    setEditing(item)
                    setOpen(true)
                  }}
                  className="w-full text-left"
                >
                  <div className="flex items-baseline justify-between">
                    <span className="tabular text-[20px] font-bold">
                      {fmtNumber(Number(item.remaining_mg), locale, 2)}
                      <span className="ml-1 text-[13px] font-semibold text-muted">
                        / {fmtNumber(Number(item.total_mg), locale, 2)} mg
                      </span>
                    </span>
                    <span className="flex flex-wrap justify-end gap-1.5">
                      {pct <= 0.2 && <Badge tone="warn">{t('inventory.low')}</Badge>}
                      {expiryDays !== null && expiryDays < 0 && (
                        <Badge tone="danger">{t('inventory.expired')}</Badge>
                      )}
                      {expiryDays !== null && expiryDays >= 0 && expiryDays <= 30 && (
                        <Badge tone="warn">
                          {t('inventory.expiresSoon', { days: expiryDays })}
                        </Badge>
                      )}
                    </span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-3">
                    <div
                      className="h-full rounded-full bg-brand transition-[width] duration-500"
                      style={{ width: `${Math.max(0, Math.min(1, pct)) * 100}%` }}
                    />
                  </div>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[12.5px] text-muted">
                    {item.concentration_mg_per_ml && (
                      <span>
                        {fmtNumber(Number(item.concentration_mg_per_ml), locale, 2)} mg/mL
                      </span>
                    )}
                    {openDays !== null && <span>{t('inventory.inUse', { days: openDays })}</span>}
                    {item.expires_at && (
                      <span>
                        {t('inventory.expiresAt')}: {fmtDate(new Date(item.expires_at), locale)}
                      </span>
                    )}
                    {item.lot && (
                      <span>
                        {t('inventory.lot')}: {item.lot}
                      </span>
                    )}
                  </div>
                </button>
              </Card>
            )
          })}
        </div>
      )}

      <InventorySheet open={open} onClose={() => setOpen(false)} editing={editing} />
    </div>
  )
}
