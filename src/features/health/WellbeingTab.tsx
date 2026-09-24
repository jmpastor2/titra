import { Gauge } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { usePatientScope } from '@/app/scope'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/primitives'
import type { MeasurementKind } from '@/data/database.types'
import { useMeasurements } from '@/data/hooks'
import { CheckInSheet } from '@/features/checkin/CheckInSheet'
import { WELLBEING } from '@/features/checkin/wellbeing'
import { TrendChart } from '@/features/exposure/TrendChart'
import { fmtNumber, fmtRelativeDay } from '@/lib/format'
import { useLocale } from '@/lib/useLocale'

/** Small multiples, one per wellbeing dimension, each on its own 0–10 axis. */
export function WellbeingTab() {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const { patientId, readOnly } = usePatientScope()
  const measurements = useMeasurements(patientId, 120)
  const [open, setOpen] = useState(false)

  const series = useMemo(() => {
    const m = new Map<MeasurementKind, { at: Date; value: number }[]>()
    for (const row of measurements.data ?? []) {
      if (!WELLBEING.includes(row.kind)) continue
      m.set(row.kind, [
        ...(m.get(row.kind) ?? []),
        { at: new Date(row.measured_at), value: Number(row.value) },
      ])
    }
    return WELLBEING.flatMap((k) => {
      const pts = m.get(k)
      if (!pts?.length) return []
      const sorted = pts.toSorted((a, b) => a.at.getTime() - b.at.getTime())
      const last = sorted[sorted.length - 1]!
      const firstWeek = sorted.filter(
        (p) => p.at.getTime() <= sorted[0]!.at.getTime() + 7 * 86_400_000,
      )
      const baseline = firstWeek.reduce((s, p) => s + p.value, 0) / firstWeek.length
      return [
        { kind: k, pts: sorted, last, delta: sorted.length > 1 ? last.value - baseline : null },
      ]
    })
  }, [measurements.data])

  if (series.length === 0) {
    return (
      <Card>
        <EmptyState
          icon={<Gauge className="size-7" />}
          title={t('checkin.emptyTitle')}
          description={t('checkin.emptyHint')}
          action={!readOnly && <Button onClick={() => setOpen(true)}>{t('checkin.title')}</Button>}
        />
        <CheckInSheet open={open} onClose={() => setOpen(false)} />
      </Card>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {!readOnly && (
        <Button variant="soft" leading={<Gauge className="size-4" />} onClick={() => setOpen(true)}>
          {t('checkin.title')}
        </Button>
      )}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {series.map((s) => (
          <Card key={s.kind} padded={false} className="p-3.5">
            <div className="flex items-start justify-between">
              <div>
                <div className="spec">{t(`health.kinds.${s.kind}`)}</div>
                <div className="readout mt-1 text-[24px] font-semibold leading-none">
                  {fmtNumber(s.last.value, locale, 0)}
                  <span className="text-[12px] text-muted">/10</span>
                </div>
              </div>
              <div className="text-right">
                {s.delta !== null && Math.abs(s.delta) >= 0.5 && (
                  <div
                    className={`readout text-[13px] font-semibold ${s.delta > 0 ? 'text-ok' : 'text-danger'}`}
                  >
                    {s.delta > 0 ? '▲' : '▼'} {fmtNumber(Math.abs(s.delta), locale, 1)}
                  </div>
                )}
                <div className="text-[11px] text-muted">{fmtRelativeDay(s.last.at, locale)}</div>
              </div>
            </div>
            {s.pts.length > 1 && (
              <TrendChart points={s.pts} unit="/10" height={96} digits={0} range={[0, 10]} />
            )}
          </Card>
        ))}
      </div>
      <p className="px-1 text-[11.5px] text-muted">{t('checkin.deltaHint')}</p>
      <CheckInSheet open={open} onClose={() => setOpen(false)} />
    </div>
  )
}
