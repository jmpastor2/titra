import { Plus, Syringe, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { usePatientScope } from '@/app/scope'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge, EmptyState, Row, Skeleton } from '@/components/ui/primitives'
import { useToast } from '@/components/ui/Toast'
import { compoundById, compoundName } from '@/content/compounds'
import { useDeleteDose, useDoses } from '@/data/hooks'
import { fmtDateTime, fmtDose, fmtRelativeDay } from '@/lib/format'
import { useLocale } from '@/lib/useLocale'
import { LogDoseSheet } from './LogDoseSheet'

export function DosesPage() {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const { patientId, readOnly } = usePatientScope()
  const doses = useDoses(patientId, 365)
  const del = useDeleteDose(patientId)
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [filter, setFilter] = useState<string>('all')

  const compounds = useMemo(
    () => Array.from(new Set((doses.data ?? []).map((d) => d.compound_id))),
    [doses.data],
  )
  const list = (doses.data ?? []).filter((d) => filter === 'all' || d.compound_id === filter)

  // Group by day for scannability.
  const groups = useMemo(() => {
    const m = new Map<string, typeof list>()
    for (const d of list) {
      const key = d.administered_at.slice(0, 10)
      m.set(key, [...(m.get(key) ?? []), d])
    }
    return [...m.entries()]
  }, [list])

  async function remove(id: string) {
    if (!window.confirm(t('common.deleteConfirm'))) return
    try {
      await del.mutateAsync(id)
      toast(t('common.deleted'), 'success')
    } catch {
      toast(t('common.error'), 'error')
    }
  }

  return (
    <div>
      <PageHeader
        title={t('doses.title')}
        large
        action={
          !readOnly && (
            <Button size="sm" leading={<Plus className="size-4" />} onClick={() => setOpen(true)}>
              {t('doses.log')}
            </Button>
          )
        }
      />

      {compounds.length > 1 && (
        <div className="hide-scrollbar -mx-4 mb-3 flex gap-2 overflow-x-auto px-4">
          {['all', ...compounds].map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setFilter(c)}
              className={
                filter === c
                  ? 'shrink-0 rounded-full bg-ink px-3 py-1.5 text-[13px] font-semibold text-canvas'
                  : 'shrink-0 rounded-full border border-line bg-surface px-3 py-1.5 text-[13px] text-ink-2'
              }
            >
              {c === 'all' ? t('doses.filterAll') : compoundName(c)}
            </button>
          ))}
        </div>
      )}

      {doses.isPending ? (
        <Card>
          <Skeleton className="h-5 w-32" />
          <Skeleton className="mt-3 h-12 w-full" />
          <Skeleton className="mt-2 h-12 w-full" />
        </Card>
      ) : list.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Syringe className="size-7" />}
            title={t('doses.empty')}
            description={t('doses.emptyHint')}
            action={!readOnly && <Button onClick={() => setOpen(true)}>{t('doses.log')}</Button>}
          />
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {groups.map(([day, items]) => (
            <Card key={day} padded={false} className="px-4 py-1">
              <div className="pt-2 text-[12px] font-semibold uppercase tracking-wider text-muted">
                {fmtRelativeDay(new Date(items[0]!.administered_at), locale)}
              </div>
              <ul className="divide-y divide-line">
                {items.map((d) => {
                  const unit = compoundById(d.compound_id)?.defaultUnit ?? 'mg'
                  return (
                    <li key={d.id}>
                      <Row
                        leading={
                          <span className="grid size-9 place-items-center rounded-full bg-brand-soft text-brand-strong">
                            <Syringe className="size-4" />
                          </span>
                        }
                        title={
                          <span className="flex items-center gap-2">
                            <span className="tabular">
                              {fmtDose(Number(d.dose_mg), unit, locale)}
                            </span>
                            <span className="text-muted">{compoundName(d.compound_id)}</span>
                          </span>
                        }
                        subtitle={
                          <span className="flex flex-wrap items-center gap-1.5">
                            {fmtDateTime(new Date(d.administered_at), locale)}
                            {d.site_id && <Badge>{t(`sites.labels.${d.site_id}`)}</Badge>}
                            {d.notes && <span className="truncate">· {d.notes}</span>}
                          </span>
                        }
                        trailing={
                          !readOnly && (
                            <button
                              type="button"
                              aria-label={t('doses.deleteDose')}
                              onClick={() => remove(d.id)}
                              className="grid size-9 place-items-center rounded-full text-muted hover:bg-danger-soft hover:text-danger"
                            >
                              <Trash2 className="size-4" />
                            </button>
                          )
                        }
                      />
                    </li>
                  )
                })}
              </ul>
            </Card>
          ))}
        </div>
      )}

      <LogDoseSheet open={open} onClose={() => setOpen(false)} />
    </div>
  )
}
