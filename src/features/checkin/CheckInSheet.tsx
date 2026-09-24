import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { usePatientScope } from '@/app/scope'
import { Button } from '@/components/ui/Button'
import { Sheet } from '@/components/ui/Sheet'
import { useToast } from '@/components/ui/Toast'
import type { MeasurementKind } from '@/data/database.types'
import { useAddMeasurement } from '@/data/hooks'
import { WELLBEING } from './wellbeing'

export function CheckInSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  return open ? <CheckInForm onClose={onClose} /> : null
}

function CheckInForm({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation()
  const { patientId } = usePatientScope()
  const { toast } = useToast()
  const add = useAddMeasurement(patientId)
  // Only dimensions the user actually touched are saved: no fake "5 out of 10" rows.
  const [values, setValues] = useState<Partial<Record<MeasurementKind, number>>>({})

  async function submit() {
    const at = new Date().toISOString()
    const rows = Object.entries(values).map(([kind, value]) => ({
      patient_id: patientId,
      kind: kind as MeasurementKind,
      value: value!,
      unit: 'score',
      measured_at: at,
    }))
    if (rows.length === 0) {
      toast(t('checkin.nothing'), 'warn')
      return
    }
    try {
      await add.mutateAsync(rows)
      toast(t('common.saved'), 'success')
      onClose()
    } catch {
      toast(t('common.error'), 'error')
    }
  }

  return (
    <Sheet
      open
      onClose={onClose}
      title={t('checkin.title')}
      description={t('checkin.intro')}
      footer={
        <Button block size="lg" loading={add.isPending} onClick={submit}>
          {t('common.save')}
        </Button>
      }
    >
      <ul className="flex flex-col gap-4 py-2">
        {WELLBEING.map((kind) => {
          const v = values[kind]
          return (
            <li key={kind}>
              <div className="mb-1.5 flex items-baseline justify-between">
                <label htmlFor={`ci-${kind}`} className="text-[14.5px] font-semibold">
                  {t(`health.kinds.${kind}`)}
                </label>
                <span
                  className={`readout text-[18px] font-semibold ${v === undefined ? 'text-muted' : 'text-signal text-glow'}`}
                >
                  {v ?? '–'}
                  <span className="text-[11px] text-muted">/10</span>
                </span>
              </div>
              <input
                id={`ci-${kind}`}
                type="range"
                min={0}
                max={10}
                step={1}
                value={v ?? 5}
                onChange={(e) => setValues((s) => ({ ...s, [kind]: Number(e.target.value) }))}
                className={`h-2 w-full accent-[var(--signal)] ${v === undefined ? 'opacity-40' : ''}`}
              />
            </li>
          )
        })}
      </ul>
    </Sheet>
  )
}
