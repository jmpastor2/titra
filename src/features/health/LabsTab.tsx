/**
 * Progress → Analíticas: one card per analyte with the latest result against its reference
 * range, the one before it, and the trend once there are two.
 */
import { FlaskConical, Plus } from 'lucide-react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { usePatientScope } from '@/app/scope'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge, EmptyState, Skeleton } from '@/components/ui/primitives'
import type { LabResultRow } from '@/data/database.types'
import { useLabs } from '@/data/hooks'
import { TrendChart } from '@/features/exposure/TrendChart'
import { labFlag } from '@/features/quicklog/labs'
import { fmtDate, fmtNumber } from '@/lib/format'
import { useLocale } from '@/lib/useLocale'

/** "HbA1c" and "hba1c " are the same analyte. */
const analyteKey = (name: string) => name.trim().toLocaleLowerCase()

export function LabsTab({ onAdd }: { onAdd: () => void }) {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const { patientId, readOnly } = usePatientScope()
  const labs = useLabs(patientId)

  // Newest result first within each analyte, analytes by their latest result.
  const byAnalyte = useMemo(() => {
    const m = new Map<string, LabResultRow[]>()
    for (const l of labs.data ?? []) {
      const key = analyteKey(l.analyte)
      m.set(key, [...(m.get(key) ?? []), l])
    }
    return [...m.values()].map((rows) =>
      rows.toSorted((a, b) => b.drawn_at.localeCompare(a.drawn_at)),
    )
  }, [labs.data])

  if (labs.isPending) {
    return (
      <Card>
        <Skeleton className="h-40 w-full" />
      </Card>
    )
  }

  if (byAnalyte.length === 0) {
    return (
      <Card>
        <EmptyState
          icon={<FlaskConical className="size-7" />}
          title={t('health.labsEmpty')}
          description={t('health.labsEmptyHint')}
          action={
            !readOnly && (
              <Button leading={<Plus className="size-4" />} onClick={onAdd}>
                {t('health.addLab')}
              </Button>
            )
          }
        />
      </Card>
    )
  }

  const fmt = (n: number) => fmtNumber(n, locale, 2)

  return (
    <div className="flex flex-col gap-3">
      {byAnalyte.map((rows) => {
        const [latest, previous] = rows
        if (!latest) return null
        const low = latest.ref_low === null ? null : Number(latest.ref_low)
        const high = latest.ref_high === null ? null : Number(latest.ref_high)
        const flag = labFlag(Number(latest.value), low, high)
        const range =
          low !== null && high !== null
            ? `${fmt(low)} – ${fmt(high)}`
            : low !== null
              ? `≥ ${fmt(low)}`
              : high !== null
                ? `≤ ${fmt(high)}`
                : null
        return (
          <Card key={analyteKey(latest.analyte)} title={latest.analyte}>
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <span className="readout text-[24px] font-semibold leading-none">
                {fmt(Number(latest.value))}
              </span>
              <span className="text-[13px] text-muted">{latest.unit}</span>
              {flag === 'ok' && <Badge tone="ok">{t('measure.labInRange')}</Badge>}
              {(flag === 'low' || flag === 'high') && (
                <Badge tone="warn">
                  {t(`health.${flag === 'low' ? 'belowRange' : 'aboveRange'}`)}
                </Badge>
              )}
              <span className="ml-auto text-[12px] text-muted">
                {fmtDate(new Date(`${latest.drawn_at}T12:00`), locale)}
              </span>
            </div>
            <p className="mt-1.5 text-[12px] text-muted">
              {[
                range && `${t('health.refRange')}: ${range} ${latest.unit}`,
                previous &&
                  t('health.previous', {
                    value: `${fmt(Number(previous.value))} ${previous.unit}`,
                    date: fmtDate(new Date(`${previous.drawn_at}T12:00`), locale, 'd MMM yyyy'),
                  }),
              ]
                .filter(Boolean)
                .join(' · ')}
            </p>
            {previous && (
              <div className="mt-2">
                <TrendChart
                  points={rows
                    .map((r) => ({ at: new Date(`${r.drawn_at}T12:00`), value: Number(r.value) }))
                    .toReversed()}
                  unit={latest.unit}
                  digits={2}
                  height={140}
                  refRange={{ low, high }}
                  label={latest.analyte}
                />
              </div>
            )}
          </Card>
        )
      })}
    </div>
  )
}
