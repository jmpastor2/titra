import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { usePatientScope } from '@/app/scope'
import { Button } from '@/components/ui/Button'
import { Field, Input, Select, Textarea } from '@/components/ui/Field'
import { Sheet } from '@/components/ui/Sheet'
import { useToast } from '@/components/ui/Toast'
import type { MeasurementKind } from '@/data/database.types'
import { useAddMeasurement } from '@/data/hooks'
import { fromDateTimeInputs, toDateInputValue, toTimeInputValue } from '@/lib/format'
import { displayUnit, KIND_UNIT, LOGGABLE_KINDS, toCanonical } from './kinds'

/** Accept both decimal comma and point. */
const parse = (s: string) => Number(s.replace(',', '.'))

interface Props {
  open: boolean
  onClose: () => void
  defaultKind?: MeasurementKind
}

/** Mounted only while open, so every opening starts from a fresh form. */
export function LogMeasurementSheet({ open, onClose, defaultKind = 'weight' }: Props) {
  return open ? <LogMeasurementForm onClose={onClose} defaultKind={defaultKind} /> : null
}

function LogMeasurementForm({
  onClose,
  defaultKind,
}: {
  onClose: () => void
  defaultKind: MeasurementKind
}) {
  const { t } = useTranslation()
  const { patientId, patient } = usePatientScope()
  const { toast } = useToast()
  const add = useAddMeasurement(patientId)
  const imperial = patient?.unit_system === 'imperial'

  const [kind, setKind] = useState<MeasurementKind>(defaultKind)
  const [value, setValue] = useState('')
  const [diastolic, setDiastolic] = useState('')
  const [date, setDate] = useState(() => toDateInputValue(new Date()))
  const [time, setTime] = useState(() => toTimeInputValue(new Date()))
  const [notes, setNotes] = useState('')

  async function submit() {
    const at = fromDateTimeInputs(date, time).toISOString()
    const v = parse(value)
    const note = notes.trim() || null
    // A resistance session may be logged without a duration.
    if (kind !== 'resistance_session' && !(v > 0)) {
      toast(t('errors.positive'), 'warn')
      return
    }
    try {
      if (kind === 'bp_systolic') {
        const d = parse(diastolic)
        if (!(d > 0)) {
          toast(t('errors.positive'), 'warn')
          return
        }
        await add.mutateAsync([
          {
            patient_id: patientId,
            kind: 'bp_systolic',
            value: v,
            unit: 'mmHg',
            measured_at: at,
            notes: note,
          },
          {
            patient_id: patientId,
            kind: 'bp_diastolic',
            value: d,
            unit: 'mmHg',
            measured_at: at,
            notes: note,
          },
        ])
      } else if (kind === 'resistance_session') {
        await add.mutateAsync({
          patient_id: patientId,
          kind,
          value: v > 0 ? v : 1,
          unit: v > 0 ? 'min' : 'session',
          measured_at: at,
          notes: note,
        })
      } else {
        await add.mutateAsync({
          patient_id: patientId,
          kind,
          value: toCanonical(kind, v, imperial),
          unit: KIND_UNIT[kind],
          measured_at: at,
          notes: note,
        })
      }
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
      title={t('health.log')}
      footer={
        <Button block size="lg" loading={add.isPending} onClick={submit}>
          {t('common.save')}
        </Button>
      }
    >
      <div className="flex flex-col gap-4 py-1">
        <Field label={t('health.kind')}>
          {(id) => (
            <Select
              id={id}
              value={kind}
              onChange={(e) => setKind(e.target.value as MeasurementKind)}
            >
              {LOGGABLE_KINDS.map((k) => (
                <option key={k} value={k}>
                  {k === 'bp_systolic' ? t('health.bp') : t(`health.kinds.${k}`)}
                </option>
              ))}
            </Select>
          )}
        </Field>

        {kind === 'bp_systolic' ? (
          <div className="grid grid-cols-2 gap-3">
            <Field label={t('health.kinds.bp_systolic')}>
              {(id) => (
                <Input
                  id={id}
                  inputMode="numeric"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  suffix="mmHg"
                />
              )}
            </Field>
            <Field label={t('health.kinds.bp_diastolic')}>
              {(id) => (
                <Input
                  id={id}
                  inputMode="numeric"
                  value={diastolic}
                  onChange={(e) => setDiastolic(e.target.value)}
                  suffix="mmHg"
                />
              )}
            </Field>
          </div>
        ) : (
          <Field
            label={t('health.value')}
            hint={kind === 'resistance_session' ? `${t('common.optional')}: min` : undefined}
          >
            {(id) => (
              <Input
                id={id}
                inputMode="decimal"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                suffix={displayUnit(kind, imperial)}
                className="tabular text-[18px] font-semibold"
              />
            )}
          </Field>
        )}

        <div className="grid grid-cols-2 gap-2">
          <Field label={t('common.date')}>
            {(id) => (
              <Input id={id} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            )}
          </Field>
          <Field label={t('common.time')}>
            {(id) => (
              <Input id={id} type="time" value={time} onChange={(e) => setTime(e.target.value)} />
            )}
          </Field>
        </div>

        <Field label={`${t('common.notes')} (${t('common.optional')})`}>
          {(id) => (
            <Textarea id={id} rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          )}
        </Field>
      </div>
    </Sheet>
  )
}
