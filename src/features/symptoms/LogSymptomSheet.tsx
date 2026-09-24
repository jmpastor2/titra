import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { usePatientScope } from '@/app/scope'
import { Button } from '@/components/ui/Button'
import { Field, Input, Textarea } from '@/components/ui/Field'
import { Sheet } from '@/components/ui/Sheet'
import { Segmented } from '@/components/ui/primitives'
import { useToast } from '@/components/ui/Toast'
import type { SymptomKind } from '@/data/database.types'
import { useAddSymptom } from '@/data/hooks'
import { fromDateTimeInputs, toDateInputValue, toTimeInputValue } from '@/lib/format'
import { SYMPTOM_KINDS } from './kinds'

interface Props {
  open: boolean
  onClose: () => void
}

/** Mounted only while open, so every opening starts from a fresh form. */
export function LogSymptomSheet({ open, onClose }: Props) {
  return open ? <LogSymptomForm onClose={onClose} /> : null
}

function LogSymptomForm({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation()
  const { patientId } = usePatientScope()
  const { toast } = useToast()
  const add = useAddSymptom(patientId)
  const [kind, setKind] = useState<SymptomKind>('nausea')
  const [severity, setSeverity] = useState(5)
  const [whenMode, setWhenMode] = useState<'now' | 'custom'>('now')
  const [date, setDate] = useState(() => toDateInputValue(new Date()))
  const [time, setTime] = useState(() => toTimeInputValue(new Date()))
  const [notes, setNotes] = useState('')

  async function submit() {
    try {
      await add.mutateAsync({
        patient_id: patientId,
        kind,
        severity,
        occurred_at: (whenMode === 'now'
          ? new Date()
          : fromDateTimeInputs(date, time)
        ).toISOString(),
        notes: notes.trim() || null,
      })
      toast(t('common.saved'), 'success')
      onClose()
    } catch {
      toast(t('common.error'), 'error')
    }
  }

  const sevTone = severity >= 7 ? 'text-danger' : severity >= 4 ? 'text-warn' : 'text-ok'

  return (
    <Sheet
      open
      onClose={onClose}
      title={t('symptoms.log')}
      footer={
        <Button block size="lg" loading={add.isPending} onClick={submit}>
          {t('common.save')}
        </Button>
      }
    >
      <div className="flex flex-col gap-4 py-1">
        <Field label={t('symptoms.kind')}>
          {() => (
            <div className="flex flex-wrap gap-2" role="radiogroup">
              {SYMPTOM_KINDS.map((k) => (
                <button
                  key={k}
                  type="button"
                  role="radio"
                  aria-checked={kind === k}
                  onClick={() => setKind(k)}
                  className={
                    kind === k
                      ? 'rounded-full border border-signal bg-signal-soft px-3 py-1.5 text-[13px] font-semibold text-signal'
                      : 'rounded-full border border-line bg-panel px-3 py-1.5 text-[13px] text-ink-2'
                  }
                >
                  {t(`symptoms.kinds.${k}`)}
                </button>
              ))}
            </div>
          )}
        </Field>

        <Field label={t('symptoms.severity')} hint={t('symptoms.severityScale')}>
          {(id) => (
            <div className="flex items-center gap-3">
              <input
                id={id}
                type="range"
                min={0}
                max={10}
                step={1}
                value={severity}
                onChange={(e) => setSeverity(Number(e.target.value))}
                className="h-2 flex-1 accent-[var(--signal)]"
              />
              <span className={`tabular w-8 text-right text-[22px] font-bold ${sevTone}`}>
                {severity}
              </span>
            </div>
          )}
        </Field>

        <Field label={t('symptoms.when')}>
          {() => (
            <div className="flex flex-col gap-2">
              <Segmented<'now' | 'custom'>
                value={whenMode}
                onChange={setWhenMode}
                size="sm"
                options={[
                  { value: 'now', label: t('doses.now') },
                  { value: 'custom', label: t('common.date') },
                ]}
              />
              {whenMode === 'custom' && (
                <div className="grid grid-cols-2 gap-2">
                  <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                  <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
                </div>
              )}
            </div>
          )}
        </Field>

        <Field label={`${t('common.notes')} (${t('common.optional')})`}>
          {(id) => (
            <Textarea id={id} rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          )}
        </Field>
      </div>
    </Sheet>
  )
}
