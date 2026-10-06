import { Download } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { usePatientScope } from '@/app/scope'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { useToast } from '@/components/ui/Toast'
import { compoundName } from '@/content/compounds'
import { useDoses, useLabs, useMeasurements, useSymptoms } from '@/data/hooks'
import { toCsv, download } from '@/lib/csv'

export function ExportPage() {
  const { t } = useTranslation()
  const { patientId, patient } = usePatientScope()
  const { toast } = useToast()
  const doses = useDoses(patientId, 3650)
  const symptoms = useSymptoms(patientId, 3650)
  // The export wants every row, water and protein included.
  const measurements = useMeasurements(patientId, 3650, true)
  const labs = useLabs(patientId)

  const stamp = new Date().toISOString().slice(0, 10)
  const slug = (patient?.display_name ?? 'titra').toLowerCase().replace(/\s+/g, '-')

  function exportDoses() {
    const rows = (doses.data ?? []).map((d) => ({
      fecha: d.administered_at,
      compuesto: compoundName(d.compound_id),
      dosis_mg: d.dose_mg,
      punto: d.site_id ?? '',
      notas: d.notes ?? '',
    }))
    download(`titra-${slug}-dosis-${stamp}.csv`, toCsv(rows), 'text/csv')
  }

  function exportSymptoms() {
    const rows = (symptoms.data ?? []).map((s) => ({
      fecha: s.occurred_at,
      sintoma: t(`symptoms.kinds.${s.kind}`),
      intensidad: s.severity,
      notas: s.notes ?? '',
    }))
    download(`titra-${slug}-sintomas-${stamp}.csv`, toCsv(rows), 'text/csv')
  }

  function exportMeasurements() {
    const rows = (measurements.data ?? []).map((m) => ({
      fecha: m.measured_at,
      medida: t(`health.kinds.${m.kind}`),
      valor: m.value,
      unidad: m.unit,
      notas: m.notes ?? '',
    }))
    download(`titra-${slug}-medidas-${stamp}.csv`, toCsv(rows), 'text/csv')
  }

  function exportLabs() {
    const rows = (labs.data ?? []).map((l) => ({
      fecha: l.drawn_at,
      parametro: l.analyte,
      valor: l.value,
      unidad: l.unit,
      ref_min: l.ref_low ?? '',
      ref_max: l.ref_high ?? '',
      notas: l.notes ?? '',
    }))
    download(`titra-${slug}-analiticas-${stamp}.csv`, toCsv(rows), 'text/csv')
  }

  function exportJson() {
    const payload = {
      exportedAt: new Date().toISOString(),
      profile: patient,
      doses: doses.data ?? [],
      symptoms: symptoms.data ?? [],
      measurements: measurements.data ?? [],
      labs: labs.data ?? [],
    }
    download(`titra-${slug}-${stamp}.json`, JSON.stringify(payload, null, 2), 'application/json')
    toast(t('common.saved'), 'success')
  }

  const items = [
    { label: t('export.csvDoses'), onClick: exportDoses, count: doses.data?.length ?? 0 },
    { label: t('export.csvSymptoms'), onClick: exportSymptoms, count: symptoms.data?.length ?? 0 },
    {
      label: t('export.csvMeasurements'),
      onClick: exportMeasurements,
      count: measurements.data?.length ?? 0,
    },
    { label: t('export.csvLabs'), onClick: exportLabs, count: labs.data?.length ?? 0 },
  ]

  return (
    <div className="pb-8">
      <PageHeader title={t('export.title')} back="/more" />
      <p className="-mt-1 mb-4 px-1 text-[13.5px] leading-snug text-muted">
        {t('settings.exportHint')}
      </p>

      <div className="flex flex-col gap-4">
        <Card padded={false} className="px-4">
          <ul className="divide-y divide-line">
            {items.map((item) => (
              <ExportRow
                key={item.label}
                title={item.label}
                hint={t('export.rows', { count: item.count })}
                action="CSV"
                disabled={item.count === 0}
                onClick={item.onClick}
              />
            ))}
          </ul>
        </Card>

        <Card padded={false} className="px-4">
          <ul>
            <ExportRow
              title={t('export.backup')}
              hint={t('export.backupHint')}
              action="JSON"
              onClick={exportJson}
            />
          </ul>
        </Card>
      </div>
    </div>
  )
}

function ExportRow({
  title,
  hint,
  action,
  disabled,
  onClick,
}: {
  title: string
  hint: string
  action: string
  disabled?: boolean
  onClick: () => void
}) {
  return (
    <li className="flex min-h-[68px] items-center justify-between gap-3 py-3">
      <div className="min-w-0">
        <div className="text-[15px] font-semibold leading-snug">{title}</div>
        <div className="mt-0.5 text-[12.5px] leading-snug text-muted">{hint}</div>
      </div>
      <Button
        size="sm"
        variant="secondary"
        disabled={disabled}
        leading={<Download className="size-4" />}
        onClick={onClick}
      >
        {action}
      </Button>
    </li>
  )
}
