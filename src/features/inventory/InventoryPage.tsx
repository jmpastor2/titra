import { Package, Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { usePatientScope } from '@/app/scope'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState, SectionTitle, Skeleton, SubstanceDot } from '@/components/ui/primitives'
import { useToast } from '@/components/ui/Toast'
import { compoundColor } from '@/content/substanceColor'
import type { InventoryRow } from '@/data/database.types'
import { useArchiveInventory, useInventory, useSaveInventory } from '@/data/hooks'
import { useNow } from '@/lib/useNow'
import { AlertsPanel } from './AlertsPanel'
import { BLEND_PRESETS, type BlendPreset } from './blendPresets'
import { FinishedVials } from './FinishedVials'
import { InventorySheet } from './InventorySheet'
import { RestockCard } from './RestockCard'
import { StockStrip } from './StockStrip'
import { useReconstituteSheet } from './useReconstituteSheet'
import { useStock } from './useStock'
import { VialCard } from './VialCard'
import { latestVialOf, unopenedCopy, vialState, type RestockLine } from './vials'

/** What to open the add sheet with: a common vial, or just a substance. */
interface AddRequest {
  preset?: BlendPreset
  compoundId?: string
}

export function InventoryPage() {
  const { t } = useTranslation()
  const { patientId, readOnly } = usePatientScope()
  const { toast } = useToast()
  const now = useNow()
  const stock = useStock(patientId, now)
  const { list, runways, restock } = stock
  // Archived vials too: they are the history, and the best template for restocking.
  const everything = useInventory(patientId, true)
  const save = useSaveInventory(patientId)
  const archive = useArchiveInventory(patientId)
  const [editing, setEditing] = useState<InventoryRow | null>(null)
  const [adding, setAdding] = useState<AddRequest | null>(null)
  const reconstitution = useReconstituteSheet(now)

  const groups = useMemo(() => {
    const byOpened = (a: InventoryRow, b: InventoryRow) =>
      (a.opened_at ?? '').localeCompare(b.opened_at ?? '')
    const archived = (everything.data ?? []).filter((v) => v.archived)
    return {
      // The oldest reconstituted vial first: it is the one drawn from.
      inUse: list.filter((v) => vialState(v) === 'inUse').toSorted(byOpened),
      reserve: list.filter((v) => vialState(v) === 'reserve'),
      finished: [...list.filter((v) => vialState(v) === 'finished'), ...archived],
    }
  }, [list, everything.data])

  // The next dose of each compound, for the units shown on vials that are not the one in use.
  const nextDose = useMemo(
    () => new Map(restock.map((l) => [l.compoundId, l.runway.nextDoseMg])),
    [restock],
  )

  async function addSame(vial: InventoryRow) {
    if (save.isPending) return
    try {
      await save.mutateAsync(unopenedCopy(vial))
      toast(t('inventory.addedSame', { label: vial.label }), 'success')
    } catch {
      toast(t('common.error'), 'error')
    }
  }

  function setArchived(vial: InventoryRow, archived: boolean) {
    archive.mutate(
      { id: vial.id, archived },
      {
        onSuccess: () =>
          toast(
            t(archived ? 'inventory.archivedToast' : 'inventory.restoredToast', {
              label: vial.label,
            }),
            'info',
          ),
        onError: () => toast(t('common.error'), 'error'),
      },
    )
  }

  // A substance running short: another vial like the last one, or pick one if there was none.
  function restockLine(line: RestockLine) {
    const template = latestVialOf(everything.data ?? list, line.compoundId)
    if (template) void addSame(template)
    else setAdding({ compoundId: line.compoundId })
  }

  const nothing = list.length === 0 && groups.finished.length === 0

  return (
    <div className="pb-6">
      <PageHeader
        eyebrow={t('inventory.eyebrow')}
        title={t('inventory.title')}
        large
        back="/more"
        action={
          !readOnly && (
            <Button leading={<Plus className="size-4" />} onClick={() => setAdding({})}>
              {t('common.add')}
            </Button>
          )
        }
      />

      {stock.pending ? (
        <div className="flex flex-col gap-3" aria-busy>
          <Skeleton className="h-[76px] w-full rounded-card" />
          <Skeleton className="h-[200px] w-full rounded-card" />
          <Skeleton className="h-[200px] w-full rounded-card" />
        </div>
      ) : nothing ? (
        <Card>
          <EmptyState
            icon={<Package className="size-7" />}
            title={t('inventory.empty')}
            description={t('inventory.emptyHint')}
            action={
              !readOnly && <Button onClick={() => setAdding({})}>{t('inventory.add')}</Button>
            }
          />
          {!readOnly && (
            <div className="border-t border-line px-1 pt-4">
              <div className="spec mb-2 px-1">{t('inventory.startWith')}</div>
              <div className="flex flex-wrap gap-2">
                {BLEND_PRESETS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setAdding({ preset: p })}
                    className="flex min-h-11 items-center gap-1.5 rounded-full border border-line-strong bg-panel-2 px-3.5 text-[12.5px] font-semibold outline-none transition hover:border-signal/40 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-signal/60"
                  >
                    {p.parts.map((x) => (
                      <SubstanceDot key={x.compoundId} color={compoundColor(x.compoundId)} />
                    ))}
                    {p.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </Card>
      ) : (
        <>
          <StockStrip
            inUse={groups.inUse.length}
            reserve={groups.reserve.length}
            finished={groups.finished.length}
          />
          <AlertsPanel alerts={stock.alerts} read={stock.dismissedAlerts} />
          {restock.length > 0 && (
            <RestockCard lines={restock} now={now} readOnly={readOnly} onAdd={restockLine} />
          )}

          {[
            { key: 'inUse', title: t('inventory.sectionInUse'), vials: groups.inUse },
            { key: 'reserve', title: t('inventory.sectionReserve'), vials: groups.reserve },
          ].map(
            (g) =>
              g.vials.length > 0 && (
                <section key={g.key} className="mb-3">
                  <SectionTitle>
                    {g.title} · {g.vials.length}
                  </SectionTitle>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {g.vials.map((item) => (
                      <VialCard
                        key={item.id}
                        item={item}
                        runway={runways.get(item.id)}
                        nextDoseMg={nextDose.get(item.compound_id)}
                        now={now}
                        readOnly={readOnly}
                        onEdit={() => setEditing(item)}
                        onReconstitute={() => reconstitution.reconstitute(item)}
                        onAddSame={() => void addSame(item)}
                        onArchive={() => setArchived(item, true)}
                      />
                    ))}
                  </div>
                </section>
              ),
          )}

          <FinishedVials
            vials={groups.finished}
            readOnly={readOnly}
            onArchive={(v) => setArchived(v, true)}
            onRestore={(v) => setArchived(v, false)}
          />
        </>
      )}

      <InventorySheet
        open={adding !== null || editing !== null}
        onClose={() => {
          setAdding(null)
          setEditing(null)
        }}
        editing={editing}
        {...(adding?.compoundId ? { defaultCompoundId: adding.compoundId } : {})}
        {...(adding?.preset ? { preset: adding.preset } : {})}
      />
      {reconstitution.sheet}
    </div>
  )
}
