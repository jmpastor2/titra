import { Plus, Syringe, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { usePatientScope } from '@/app/scope'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Chip, EmptyState, Skeleton, SubstanceDot } from '@/components/ui/primitives'
import { useToast } from '@/components/ui/Toast'
import { compoundById, compoundName } from '@/content/compounds'
import { compoundColor } from '@/content/substanceColor'
import type { DoseRow } from '@/data/database.types'
import { useDeleteDose, useDoses, useInventory, useProtocols } from '@/data/hooks'
import { roundUnits } from '@/domain/dosing/draw'
import { mgToUnits } from '@/domain/dosing/reconstitution'
import { concentrationOf, isBlend, vialHas } from '@/features/inventory/vials'
import { fmtDoseList, fmtNumber, fmtRelativeDay } from '@/lib/format'
import { useLocale } from '@/lib/useLocale'
import { LogDoseSheet } from './LogDoseSheet'
import { WeekCard } from './WeekCard'

/** One administration: a single row, or every row of a same-syringe stack. */
interface Administration {
  key: string
  at: Date
  rows: DoseRow[]
}

function groupAdministrations(rows: readonly DoseRow[]): Administration[] {
  const map = new Map<string, Administration>()
  for (const r of rows) {
    const key = r.batch_id ?? r.id
    const a = map.get(key)
    if (a) a.rows.push(r)
    else map.set(key, { key, at: new Date(r.administered_at), rows: [r] })
  }
  // In a stack or blend, the row that drew from the vial (the protocol's own compound) first.
  for (const a of map.values())
    a.rows.sort((x, y) => Number(Boolean(y.inventory_id)) - Number(Boolean(x.inventory_id)))
  return [...map.values()].toSorted((a, b) => b.at.getTime() - a.at.getTime())
}

const hhmm = (d: Date) =>
  `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`

export function DosesPage() {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const { patientId, readOnly } = usePatientScope()
  const doses = useDoses(patientId, 365)
  const protocols = useProtocols(patientId)
  const inventory = useInventory(patientId, true)
  // Units drawn, from the vial each dose came out of.
  const concById = useMemo(
    () => new Map((inventory.data ?? []).map((v) => [v.id, concentrationOf(v)])),
    [inventory.data],
  )
  /** "10 + 5 = 15 U" for a stack, "50 U" for a single dose; null when a vial is unknown. */
  const vialById = useMemo(
    () => new Map((inventory.data ?? []).map((v) => [v.id, v])),
    [inventory.data],
  )
  const drawnUnits = (rows: readonly DoseRow[]) => {
    // A blend vial is one draw for all its compounds: count the row that took from it.
    const blendRow = rows.find((r) => {
      const v = r.inventory_id ? vialById.get(r.inventory_id) : undefined
      return v && isBlend(v) && rows.every((x) => vialHas(v, x.compound_id))
    })
    if (blendRow) rows = [blendRow]
    const units = rows.map((r) => {
      const conc = r.inventory_id ? concById.get(r.inventory_id) : null
      return conc ? roundUnits(mgToUnits(Number(r.dose_mg), conc)) : null
    })
    if (units.some((u) => u === null)) return null
    const n = (x: number) => fmtNumber(x, locale, 1)
    const total = units.reduce<number>((sum, u) => sum + u!, 0)
    return units.length > 1
      ? `${units.map((u) => n(u!)).join(' + ')} = ${n(total)} U`
      : `${n(total)} U`
  }
  const del = useDeleteDose(patientId)
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [filter, setFilter] = useState<string>('all')

  // One filter per thing you inject: a blend or stack is one chip, not one per compound.
  const combos = useMemo(() => {
    const seen = new Map<string, string[]>()
    for (const a of groupAdministrations(doses.data ?? [])) {
      const ids = a.rows.map((r) => r.compound_id)
      seen.set(ids.join('+'), ids)
    }
    return [...seen.entries()]
  }, [doses.data])

  const days = useMemo(() => {
    const admins = groupAdministrations(doses.data ?? []).filter(
      (a) => filter === 'all' || a.rows.map((r) => r.compound_id).join('+') === filter,
    )
    const m = new Map<string, Administration[]>()
    for (const a of admins) {
      const k = a.at.toDateString()
      m.set(k, [...(m.get(k) ?? []), a])
    }
    return [...m.entries()]
  }, [doses.data, filter])

  async function remove(a: Administration) {
    if (!window.confirm(t('common.deleteConfirm'))) return
    try {
      await Promise.all(a.rows.map((r) => del.mutateAsync(r.id)))
      toast(t('common.deleted'), 'success')
    } catch {
      toast(t('common.error'), 'error')
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow={t('doses.eyebrow')}
        title={t('nav.log')}
        large
        action={
          !readOnly && (
            <Button size="sm" leading={<Plus className="size-4" />} onClick={() => setOpen(true)}>
              {t('doses.logShort')}
            </Button>
          )
        }
      />

      {(protocols.data ?? []).length > 0 && doses.data && (
        <WeekCard protocols={protocols.data ?? []} doses={doses.data} />
      )}

      {combos.length > 1 && (
        <div className="hide-scrollbar -mx-4 mb-4 flex gap-2 overflow-x-auto px-4">
          <Chip active={filter === 'all'} onClick={() => setFilter('all')}>
            {t('doses.filterAll')}
          </Chip>
          {combos.map(([key, ids]) => (
            <Chip
              key={key}
              active={filter === key}
              color={compoundColor(ids[0]!)}
              onClick={() => setFilter(key)}
            >
              {ids.map(compoundName).join(' + ')}
            </Chip>
          ))}
        </div>
      )}

      {doses.isPending ? (
        <Card>
          <Skeleton className="h-5 w-32" />
          <Skeleton className="mt-3 h-14 w-full" />
        </Card>
      ) : days.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Syringe className="size-7" />}
            title={t('doses.empty')}
            description={t('doses.emptyHint')}
            action={!readOnly && <Button onClick={() => setOpen(true)}>{t('doses.log')}</Button>}
          />
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {days.map(([day, admins]) => (
            <section key={day}>
              <div className="mb-2 flex items-baseline justify-between px-1">
                <h2 className="spec">{fmtRelativeDay(admins[0]!.at, locale)}</h2>
                <span className="spec">{t('doses.count', { count: admins.length })}</span>
              </div>
              <Card padded={false} className="px-4">
                <ul className="divide-y divide-line">
                  {admins.map((a) => (
                    <li key={a.key} className="flex items-center gap-3 py-3">
                      <span className="readout w-11 shrink-0 text-[14px] font-semibold text-ink-2">
                        {hhmm(a.at)}
                      </span>
                      <div className="min-w-0 flex-1">
                        {/* One line per injection: a stack or blend reads "A + B · 100 + 100 mcg". */}
                        <div className="flex items-center gap-2">
                          {a.rows.map((r) => (
                            <SubstanceDot key={r.id} color={compoundColor(r.compound_id)} />
                          ))}
                          <span className="min-w-0 truncate text-[14.5px] font-semibold">
                            {a.rows.map((r) => compoundName(r.compound_id)).join(' + ')}
                          </span>
                          <span className="readout ml-auto shrink-0 text-[13.5px] text-ink-2">
                            {fmtDoseList(
                              a.rows.map((r) => ({
                                valueMg: Number(r.dose_mg),
                                unit: compoundById(r.compound_id)?.defaultUnit ?? 'mg',
                              })),
                              locale,
                            )}
                          </span>
                        </div>
                        <AdminMeta
                          site={a.rows[0]!.site_id ? t(`sites.labels.${a.rows[0]!.site_id}`) : null}
                          notes={a.rows[0]!.notes}
                          units={drawnUnits(a.rows)}
                        />
                      </div>
                      {!readOnly && (
                        <button
                          type="button"
                          aria-label={t('doses.deleteDose')}
                          onClick={() => void remove(a)}
                          className="grid size-9 shrink-0 place-items-center rounded-full text-muted hover:bg-danger-soft hover:text-danger"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              </Card>
            </section>
          ))}
        </div>
      )}

      <LogDoseSheet open={open} onClose={() => setOpen(false)} />
    </div>
  )
}

function AdminMeta({
  site,
  notes,
  units,
}: {
  site: string | null
  notes: string | null
  units: string | null
}) {
  const parts = [site, notes].filter(Boolean)
  if (!parts.length && !units) return null
  return (
    <div className="mt-0.5 flex items-center gap-2 text-[12px] text-muted">
      {units && <span className="readout shrink-0 font-semibold text-signal">{units}</span>}
      <span className="truncate">{parts.join(' · ')}</span>
    </div>
  )
}
