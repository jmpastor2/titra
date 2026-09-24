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
import { useDeleteDose, useDoses } from '@/data/hooks'
import { fmtDose, fmtRelativeDay } from '@/lib/format'
import { useLocale } from '@/lib/useLocale'
import { LogDoseSheet } from './LogDoseSheet'

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
  return [...map.values()].toSorted((a, b) => b.at.getTime() - a.at.getTime())
}

const hhmm = (d: Date) =>
  `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`

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
    () => [...new Set((doses.data ?? []).map((d) => d.compound_id))],
    [doses.data],
  )

  const days = useMemo(() => {
    const admins = groupAdministrations(doses.data ?? []).filter(
      (a) => filter === 'all' || a.rows.some((r) => r.compound_id === filter),
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
        <div className="hide-scrollbar -mx-4 mb-4 flex gap-2 overflow-x-auto px-4">
          <Chip active={filter === 'all'} onClick={() => setFilter('all')}>
            {t('doses.filterAll')}
          </Chip>
          {compounds.map((c) => (
            <Chip
              key={c}
              active={filter === c}
              color={compoundColor(c)}
              onClick={() => setFilter(c)}
            >
              {compoundName(c)}
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
                        {a.rows.map((r) => (
                          <div key={r.id} className="flex items-center gap-2">
                            <SubstanceDot color={compoundColor(r.compound_id)} />
                            <span className="truncate text-[14.5px] font-semibold">
                              {compoundName(r.compound_id)}
                            </span>
                            <span className="readout ml-auto shrink-0 text-[13.5px] text-ink-2">
                              {fmtDose(
                                Number(r.dose_mg),
                                compoundById(r.compound_id)?.defaultUnit ?? 'mg',
                                locale,
                              )}
                            </span>
                          </div>
                        ))}
                        {(a.rows[0]!.site_id || a.rows[0]!.notes) && (
                          <div className="mt-0.5 truncate text-[12px] text-muted">
                            {a.rows[0]!.site_id && t(`sites.labels.${a.rows[0]!.site_id}`)}
                            {a.rows[0]!.site_id && a.rows[0]!.notes && ' · '}
                            {a.rows[0]!.notes}
                          </div>
                        )}
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
