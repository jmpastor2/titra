import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { usePatientScope } from '@/app/scope'
import { Button } from '@/components/ui/Button'
import { Field, Input, Textarea } from '@/components/ui/Field'
import { Sheet } from '@/components/ui/Sheet'
import { useToast } from '@/components/ui/Toast'
import { useAddLab } from '@/data/hooks'
import { toDateInputValue } from '@/lib/format'

/** Common analytes for GLP-1 / peptide follow-up, with usual adult reference ranges. */
const PRESETS: { analyte: string; unit: string; low?: number; high?: number }[] = [
  { analyte: 'HbA1c', unit: '%', low: 4, high: 5.6 },
  { analyte: 'Glucosa en ayunas', unit: 'mg/dL', low: 70, high: 99 },
  { analyte: 'Insulina basal', unit: 'µU/mL', low: 2, high: 25 },
  { analyte: 'Colesterol total', unit: 'mg/dL', high: 200 },
  { analyte: 'LDL', unit: 'mg/dL', high: 130 },
  { analyte: 'HDL', unit: 'mg/dL', low: 40 },
  { analyte: 'Triglicéridos', unit: 'mg/dL', high: 150 },
  { analyte: 'ALT', unit: 'U/L', low: 7, high: 56 },
  { analyte: 'AST', unit: 'U/L', low: 10, high: 40 },
  { analyte: 'Lipasa', unit: 'U/L', low: 13, high: 60 },
  { analyte: 'Amilasa', unit: 'U/L', low: 30, high: 110 },
  { analyte: 'Creatinina', unit: 'mg/dL', low: 0.6, high: 1.3 },
  { analyte: 'eGFR', unit: 'mL/min/1.73m²', low: 90 },
  { analyte: 'TSH', unit: 'µU/mL', low: 0.4, high: 4 },
  { analyte: 'IGF-1', unit: 'ng/mL', low: 100, high: 300 },
  { analyte: 'Testosterona total', unit: 'ng/dL', low: 300, high: 1000 },
  { analyte: 'Estradiol', unit: 'pg/mL', low: 10, high: 40 },
  { analyte: 'Vitamina B12', unit: 'pg/mL', low: 200, high: 900 },
  { analyte: 'Calcitonina', unit: 'pg/mL', high: 10 },
]

/** Mounted only while open, so every opening starts from a fresh form. */
export function AddLabSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  return open ? <AddLabForm onClose={onClose} /> : null
}

function AddLabForm({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation()
  const { patientId } = usePatientScope()
  const { toast } = useToast()
  const add = useAddLab(patientId)

  const [analyte, setAnalyte] = useState('')
  const [value, setValue] = useState('')
  const [unit, setUnit] = useState('')
  const [low, setLow] = useState('')
  const [high, setHigh] = useState('')
  const [drawnAt, setDrawnAt] = useState(() => toDateInputValue(new Date()))
  const [notes, setNotes] = useState('')

  function applyPreset(p: (typeof PRESETS)[number]) {
    setAnalyte(p.analyte)
    setUnit(p.unit)
    setLow(p.low !== undefined ? String(p.low) : '')
    setHigh(p.high !== undefined ? String(p.high) : '')
  }

  async function submit() {
    const v = Number(value.replace(',', '.'))
    if (!analyte.trim() || !Number.isFinite(v)) {
      toast(t('errors.required'), 'warn')
      return
    }
    try {
      await add.mutateAsync({
        patient_id: patientId,
        analyte: analyte.trim(),
        value: v,
        unit: unit.trim() || '—',
        drawn_at: drawnAt,
        ref_low: low ? Number(low.replace(',', '.')) : null,
        ref_high: high ? Number(high.replace(',', '.')) : null,
        notes: notes.trim() || null,
      })
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
      title={t('health.addLab')}
      tall
      footer={
        <Button block size="lg" loading={add.isPending} onClick={submit}>
          {t('common.save')}
        </Button>
      }
    >
      <div className="flex flex-col gap-4 py-1">
        <div className="hide-scrollbar -mx-1 flex flex-wrap gap-1.5">
          {PRESETS.map((p) => (
            <button
              key={p.analyte}
              type="button"
              onClick={() => applyPreset(p)}
              className={
                analyte === p.analyte
                  ? 'rounded-full border border-brand bg-brand-soft px-2.5 py-1 text-[12.5px] font-semibold text-brand-strong'
                  : 'rounded-full border border-line bg-surface px-2.5 py-1 text-[12.5px] text-ink-2'
              }
            >
              {p.analyte}
            </button>
          ))}
        </div>

        <Field label={t('health.analyte')}>
          {(id) => <Input id={id} value={analyte} onChange={(e) => setAnalyte(e.target.value)} />}
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label={t('health.value')}>
            {(id) => (
              <Input
                id={id}
                inputMode="decimal"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="tabular font-semibold"
              />
            )}
          </Field>
          <Field label={t('health.unit')}>
            {(id) => <Input id={id} value={unit} onChange={(e) => setUnit(e.target.value)} />}
          </Field>
        </div>

        <Field label={t('health.refRange')} hint={t('common.optional')}>
          {() => (
            <div className="grid grid-cols-2 gap-3">
              <Input
                inputMode="decimal"
                value={low}
                onChange={(e) => setLow(e.target.value)}
                placeholder="min"
              />
              <Input
                inputMode="decimal"
                value={high}
                onChange={(e) => setHigh(e.target.value)}
                placeholder="max"
              />
            </div>
          )}
        </Field>

        <Field label={t('health.drawnAt')}>
          {(id) => (
            <Input
              id={id}
              type="date"
              value={drawnAt}
              onChange={(e) => setDrawnAt(e.target.value)}
            />
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
