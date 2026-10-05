import { Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import { usePatientScope } from '@/app/scope'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { SectionTitle, Segmented } from '@/components/ui/primitives'
import { useProtocols } from '@/data/hooks'
import { OutlookCard } from '@/features/outlook/OutlookPage'
import { LogSymptomSheet } from '@/features/symptoms/LogSymptomSheet'
import { AddLabSheet } from './AddLabSheet'
import { LabsTab } from './LabsTab'
import { LeanTab } from './LeanTab'
import { LogMeasurementSheet } from './LogMeasurementSheet'
import { MeasurementsTab } from './MeasurementsTab'
import { progressScope, type ProgressRange } from './progress'
import { RangePicker } from './ProgressCharts'
import { ProgressSummary } from './ProgressSummary'
import { SymptomsTab } from './SymptomsTab'
import { tabOf, type ProgressTab as Tab } from './tabs'
import { WellbeingTab } from './WellbeingTab'

type Sheet = 'measure' | 'symptom' | 'lab'

/** What the "Añadir" of the header adds on each tab. */
const ADDS: Record<Tab, Sheet> = {
  wellbeing: 'measure',
  body: 'measure',
  symptoms: 'symptom',
  labs: 'lab',
}

/** `embedded` renders the page inside a shared, read-only view without its header. */
export function HealthPage({ embedded = false }: { embedded?: boolean }) {
  const { t } = useTranslation()
  const [params, setParams] = useSearchParams()
  const [tab, setTab] = useState<Tab>(() => tabOf(params.get('tab')))
  const [sheet, setSheet] = useState<Sheet | null>(null)
  const { patientId, readOnly } = usePatientScope()
  const protocols = useProtocols(patientId)
  const [now] = useState(() => new Date())
  const [pickedRange, setRange] = useState<ProgressRange | null>(null)
  const scope = useMemo(() => {
    const rows = protocols.data ?? []
    const hasCycle = rows.some((p) => p.status === 'active')
    const range = pickedRange ?? (hasCycle ? 'cycle' : '3m')
    return progressScope(range === 'cycle' && !hasCycle ? '3m' : range, now, rows)
  }, [protocols.data, pickedRange, now])

  function changeTab(next: Tab) {
    setTab(next)
    setParams(next === 'wellbeing' ? {} : { tab: next }, { replace: true })
  }

  return (
    <div>
      {!embedded && (
        <PageHeader
          eyebrow={t('progress.eyebrow')}
          title={t('progress.title')}
          large
          action={
            !readOnly && (
              <Button
                size="sm"
                leading={<Plus className="size-4" />}
                onClick={() => setSheet(ADDS[tab])}
              >
                {t('common.add')}
              </Button>
            )
          }
        />
      )}

      {!embedded && !readOnly && (
        <div className="mb-3">
          <OutlookCard />
        </div>
      )}

      <ProgressSummary />

      <SectionTitle index="02">{t('progress.evolution')}</SectionTitle>
      <Segmented<Tab>
        value={tab}
        onChange={changeTab}
        size="sm"
        className="mb-3"
        options={[
          { value: 'wellbeing', label: t('progress.wellbeing') },
          { value: 'body', label: t('progress.body') },
          { value: 'symptoms', label: t('symptoms.title') },
          { value: 'labs', label: t('health.labs') },
        ]}
      />

      {(tab === 'wellbeing' || tab === 'body') && (
        <div className="mb-3">
          <RangePicker value={scope.range} onChange={setRange} hasCycle={scope.cycle !== null} />
        </div>
      )}

      <div role="tabpanel">
        {tab === 'wellbeing' && <WellbeingTab scope={scope} />}
        {tab === 'body' && (
          <div className="flex flex-col gap-6">
            <MeasurementsTab scope={scope} />
            <LeanTab index="03" />
          </div>
        )}
        {tab === 'symptoms' && <SymptomsTab onAdd={() => setSheet('symptom')} />}
        {tab === 'labs' && <LabsTab onAdd={() => setSheet('lab')} />}
      </div>

      <LogMeasurementSheet open={sheet === 'measure'} onClose={() => setSheet(null)} />
      <LogSymptomSheet open={sheet === 'symptom'} onClose={() => setSheet(null)} />
      <AddLabSheet open={sheet === 'lab'} onClose={() => setSheet(null)} />
    </div>
  )
}
