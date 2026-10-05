/**
 * Progress → Síntomas: what was logged, day by day, newest first, as worded in the logging
 * sheet (five levels), with a way back after deleting one.
 */
import { Activity, Plus } from 'lucide-react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { usePatientScope } from '@/app/scope'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge, EmptyState, Row, Skeleton } from '@/components/ui/primitives'
import { useToast } from '@/components/ui/Toast'
import type { SymptomRow } from '@/data/database.types'
import { useAddSymptom, useDeleteSymptom, useSymptoms } from '@/data/hooks'
import { levelOf, severityTone } from '@/features/symptoms/kinds'
import { fmtDate, fmtDateTime, fmtRelativeDay } from '@/lib/format'
import { useLocale } from '@/lib/useLocale'
import { RowDelete } from './RowDelete'

export function SymptomsTab({ onAdd }: { onAdd: () => void }) {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const { patientId, readOnly } = usePatientScope()
  const { toast } = useToast()
  const symptoms = useSymptoms(patientId, 180)
  const del = useDeleteSymptom(patientId)
  const add = useAddSymptom(patientId)

  // One block per calendar day, newest first (the query already comes newest first).
  const days = useMemo(() => {
    const byDay = new Map<string, { at: Date; rows: SymptomRow[] }>()
    for (const row of symptoms.data ?? []) {
      const at = new Date(row.occurred_at)
      const key = `${at.getFullYear()}-${at.getMonth()}-${at.getDate()}`
      const day = byDay.get(key) ?? { at, rows: [] }
      day.rows.push(row)
      byDay.set(key, day)
    }
    return [...byDay.values()]
  }, [symptoms.data])

  if (symptoms.isPending) {
    return (
      <Card>
        <Skeleton className="h-40 w-full" />
      </Card>
    )
  }

  if (days.length === 0) {
    return (
      <Card>
        <EmptyState
          icon={<Activity className="size-7" />}
          title={t('symptoms.empty')}
          description={t('symptoms.emptyHint')}
          action={
            !readOnly && (
              <Button leading={<Plus className="size-4" />} onClick={onAdd}>
                {t('symptoms.log')}
              </Button>
            )
          }
        />
      </Card>
    )
  }

  async function remove(row: SymptomRow) {
    try {
      await del.mutateAsync(row.id)
    } catch {
      toast(t('common.error'), 'error')
      return
    }
    toast(t('health.removed', { what: t(`symptoms.kinds.${row.kind}`) }), 'info', {
      action: {
        label: t('quick.counter.undo'),
        onAction: () =>
          add
            .mutateAsync({
              patient_id: row.patient_id,
              kind: row.kind,
              severity: row.severity,
              occurred_at: row.occurred_at,
              notes: row.notes,
            })
            .then(
              () => undefined,
              () => toast(t('common.error'), 'error'),
            ),
      },
    })
  }

  return (
    <div className="flex flex-col gap-3">
      {days.map((day) => (
        <Card key={day.at.toDateString()} padded={false} className="px-4 pb-1 pt-3.5">
          <h3 className="spec">{fmtRelativeDay(day.at, locale)}</h3>
          <ul className="divide-y divide-line">
            {day.rows.map((s) => {
              const kind = t(`symptoms.kinds.${s.kind}`)
              return (
                <li key={s.id}>
                  <Row
                    title={kind}
                    subtitle={
                      <>
                        {fmtDate(
                          new Date(s.occurred_at),
                          locale,
                          locale === 'es' ? 'HH:mm' : 'h:mm a',
                        )}
                        {s.notes ? ` · ${s.notes}` : ''}
                      </>
                    }
                    trailing={
                      <span className="flex items-center gap-2">
                        <Badge tone={severityTone(s.severity)}>
                          {t(`symptoms.level.${levelOf(s.severity)}`)}
                        </Badge>
                        {!readOnly && (
                          <RowDelete
                            label={t('health.deleteAria', {
                              what: kind,
                              when: fmtDateTime(new Date(s.occurred_at), locale),
                            })}
                            onClick={() => void remove(s)}
                          />
                        )}
                      </span>
                    }
                  />
                </li>
              )
            })}
          </ul>
        </Card>
      ))}
    </div>
  )
}
