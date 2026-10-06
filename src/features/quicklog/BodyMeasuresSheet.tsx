import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { usePatientScope } from '@/app/scope'
import { Button } from '@/components/ui/Button'
import { Sheet } from '@/components/ui/Sheet'
import type { MeasurementKind } from '@/data/database.types'
import { displayUnit, KIND_UNIT } from '@/features/health/kinds'
import { useLocale } from '@/lib/useLocale'
import { useQuickMeasurements } from './data'
import { NumberStepper } from './NumberStepper'
import { latestReading } from './readings'
import { DeltaChip } from './SheetBits'
import { deltaFrom, inRange, stepSpec, toDisplay, toStored } from './stepper'
import { agoLabel } from './text'
import { useQuickSave } from './useQuickSave'

/** The body circumferences, in the order they are usually taken. */
export const GIRTH_KINDS = [
  'waist',
  'hip',
  'chest',
  'arm',
  'thigh',
] as const satisfies readonly MeasurementKind[]
type Girth = (typeof GIRTH_KINDS)[number]

/**
 * All the tape measurements in one go: each row starts from the last reading, only the
 * ones you change are saved, and they go in with a single tap. The rows are drawn at once
 * and fill in when the readings arrive, each with room kept for its line under the name, so
 * nothing moves while the sheet loads or a value changes.
 */
export function BodyMeasuresSheet({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const { patientId, patient } = usePatientScope()
  const imperial = patient?.unit_system === 'imperial'
  const { rows, pending } = useQuickMeasurements(patientId)
  const { save: saveRows } = useQuickSave(patientId)
  const [now] = useState(() => new Date())
  // Only what was touched: the rest keeps its last value on screen but is not saved.
  const [edited, setEdited] = useState<Partial<Record<Girth, number | null>>>({})

  const rowFor = (kind: Girth) => {
    const last = latestReading(rows, kind)
    const spec = stepSpec(kind, imperial)
    const lastShown = last ? toDisplay(kind, last.value, imperial) : null
    const touched = kind in edited
    const value = touched ? (edited[kind] ?? null) : lastShown
    const invalid = touched && (value === null || !inRange(spec, value))
    return { kind, last, spec, lastShown, touched, value, invalid }
  }
  const lines = GIRTH_KINDS.map(rowFor)
  const touched = lines.filter((l) => l.touched)
  const canSave = touched.length > 0 && touched.every((l) => !l.invalid)

  function save() {
    const inputs = touched.flatMap((l) =>
      l.value === null
        ? []
        : [
            {
              kind: l.kind,
              value: toStored(l.kind, l.value, imperial),
              unit: KIND_UNIT[l.kind],
            },
          ],
    )
    saveRows(inputs, t('bodyMeasures.saved', { count: inputs.length }))
    onClose()
  }

  return (
    <Sheet
      open
      onClose={onClose}
      title={t('bodyMeasures.title')}
      description={t('bodyMeasures.intro')}
      tall
      footer={
        <Button block size="lg" disabled={!canSave} onClick={save}>
          {touched.length > 0
            ? t('bodyMeasures.save', { count: touched.length })
            : t('common.save')}
        </Button>
      }
    >
      <ul className="divide-y divide-line" aria-busy={pending || undefined}>
        {lines.map((l) => {
          const unit = displayUnit(l.kind, imperial)
          const delta =
            l.touched && l.value !== null && l.lastShown !== null && !l.invalid
              ? deltaFrom(l.value, l.lastShown, l.spec.digits)
              : null
          return (
            <li key={l.kind} className="flex items-center gap-3 py-3.5">
              <div className="w-[88px] shrink-0">
                <div className="text-[15px] font-semibold leading-tight">
                  {t(`health.kinds.${l.kind}`)}
                </div>
                {/*
                  Two lines kept: when the value in the stepper was taken, the change once it
                  is moved, or nothing while the readings load.
                */}
                <div className="mt-1 min-h-8 text-[12.5px] leading-4 text-muted">
                  {pending ? null : delta !== null ? (
                    <DeltaChip
                      bare
                      delta={delta}
                      digits={l.spec.digits}
                      unit={unit}
                      locale={locale}
                    />
                  ) : l.last && l.lastShown !== null ? (
                    agoLabel(t, l.last.at, now)
                  ) : (
                    t('bodyMeasures.none')
                  )}
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <NumberStepper
                  size="sm"
                  value={l.value}
                  onChange={(v) => setEdited((e) => ({ ...e, [l.kind]: v }))}
                  spec={l.spec}
                  unit={unit}
                  label={t(`health.kinds.${l.kind}`)}
                  locale={locale}
                  invalid={l.invalid}
                />
              </div>
            </li>
          )
        })}
      </ul>
    </Sheet>
  )
}
