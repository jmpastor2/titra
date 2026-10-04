import type { TFunction } from 'i18next'
import { Plus } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { usePatientScope } from '@/app/scope'
import { Button } from '@/components/ui/Button'
import { Field, Input, Textarea } from '@/components/ui/Field'
import { Sheet } from '@/components/ui/Sheet'
import { Skeleton } from '@/components/ui/primitives'
import type { MeasurementKind } from '@/data/database.types'
import { useLastReading } from '@/features/quicklog/data'
import { NumberStepper } from '@/features/quicklog/NumberStepper'
import { AmountChip, Choice, DeltaChip } from '@/features/quicklog/SheetBits'
import { deltaFrom, inRange, stepSpec, toDisplay, toStored } from '@/features/quicklog/stepper'
import { useQuickSave } from '@/features/quicklog/useQuickSave'
import { agoLabel, fmtFixed } from '@/features/quicklog/text'
import { fromDateTimeInputs, toDateInputValue, toTimeInputValue } from '@/lib/format'
import { useLocale } from '@/lib/useLocale'
import { displayUnit, KIND_UNIT, LOGGABLE_KINDS } from './kinds'
import { fmtSigned } from './progress'

/** One-tap values for the kinds that repeat: a shake, a session. */
const PRESETS: Partial<Record<MeasurementKind, readonly number[]>> = {
  protein_g: [20, 30, 40],
  resistance_session: [30, 45, 60],
}

interface Props {
  open: boolean
  onClose: () => void
  defaultKind?: MeasurementKind
}

/** Mounted only while open, so every opening starts from a fresh form. */
export function LogMeasurementSheet({ open, onClose, defaultKind = 'weight' }: Props) {
  return open ? <LogMeasurementForm onClose={onClose} defaultKind={defaultKind} /> : null
}

const kindLabel = (t: TFunction, kind: MeasurementKind) =>
  kind === 'bp_systolic' ? t('health.bp') : t(`health.kinds.${kind}`)

function LogMeasurementForm({
  onClose,
  defaultKind,
}: {
  onClose: () => void
  defaultKind: MeasurementKind
}) {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const { patientId, patient } = usePatientScope()
  const { save: saveRows } = useQuickSave(patientId)
  const imperial = patient?.unit_system === 'imperial'
  const [now] = useState(() => new Date())

  const [kind, setKind] = useState<MeasurementKind>(defaultKind)
  // What was typed or stepped, by kind; a kind not in here starts from its last reading.
  const [edited, setEdited] = useState<Partial<Record<MeasurementKind, number | null>>>({})
  const [noLength, setNoLength] = useState(false)
  const [whenMode, setWhenMode] = useState<'now' | 'custom'>('now')
  const [date, setDate] = useState(() => toDateInputValue(new Date()))
  const [time, setTime] = useState(() => toTimeInputValue(new Date()))
  const [showNote, setShowNote] = useState(false)
  const [notes, setNotes] = useState('')

  const isBp = kind === 'bp_systolic'
  const isSession = kind === 'resistance_session'
  const main = useLastReading(patientId, kind)
  const diastolic = useLastReading(patientId, 'bp_diastolic', isBp)
  const spec = stepSpec(kind, imperial)
  const diaSpec = stepSpec('bp_diastolic', imperial)
  const unit = displayUnit(kind, imperial)

  // Where a stepper starts: the last reading, unless it is no value to start from (a session
  // logged without a length is stored as 1).
  const shownOf = (k: MeasurementKind, reading: { value: number } | null) => {
    const v = reading ? toDisplay(k, reading.value, imperial) : null
    return v !== null && inRange(stepSpec(k, imperial), v) ? v : null
  }
  const last = main.latest
  const lastShown = shownOf(kind, last)
  const diaLastShown = shownOf('bp_diastolic', diastolic.latest)
  const valueOf = (k: MeasurementKind, fallback: number | null) =>
    k in edited ? (edited[k] ?? null) : fallback
  const value = valueOf(kind, lastShown)
  const diaValue = valueOf('bp_diastolic', diaLastShown)
  const edit = (k: MeasurementKind) => (v: number | null) => setEdited((e) => ({ ...e, [k]: v }))

  const loading = main.pending || (isBp && diastolic.pending)
  const needsValue = !(isSession && noLength)
  const outOfRange =
    needsValue &&
    ((value !== null && !inRange(spec, value)) ||
      (isBp && diaValue !== null && !inRange(diaSpec, diaValue)))
  const complete = !needsValue || (value !== null && (!isBp || diaValue !== null))
  const canSave = !loading && complete && !outOfRange

  // The kind the sheet opens with is brought into view in the row of kinds.
  const picked = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    picked.current?.scrollIntoView?.({ inline: 'center', block: 'nearest' })
  }, [])

  const lastText =
    last && lastShown !== null
      ? isBp
        ? `${fmtFixed(lastShown, locale, 0)}/${diaLastShown === null ? '–' : fmtFixed(diaLastShown, locale, 0)}`
        : `${fmtFixed(lastShown, locale, spec.digits)} ${unit}`
      : null

  const delta =
    !isBp && needsValue && value !== null && lastShown !== null && !outOfRange
      ? deltaFrom(value, lastShown, spec.digits)
      : null

  function save() {
    if (!canSave) return
    const measuredAt = whenMode === 'now' ? undefined : fromDateTimeInputs(date, time).toISOString()
    const notesText = notes.trim() || null
    const base = { measuredAt, notes: notesText }
    const inputs =
      isBp && value !== null && diaValue !== null
        ? [
            { ...base, kind: 'bp_systolic' as const, value, unit: 'mmHg' },
            { ...base, kind: 'bp_diastolic' as const, value: diaValue, unit: 'mmHg' },
          ]
        : isSession && (noLength || value === null)
          ? [{ ...base, kind, value: 1, unit: 'session' }]
          : value === null
            ? []
            : [
                {
                  ...base,
                  kind,
                  value: toStored(kind, value, imperial),
                  unit: isSession ? 'min' : KIND_UNIT[kind],
                },
              ]
    const what = kindLabel(t, kind)
    saveRows(
      inputs,
      delta
        ? t('measure.savedDelta', {
            what,
            delta: `${fmtSigned(delta, locale, spec.digits)} ${unit}`,
          })
        : t('measure.saved', { what }),
    )
    onClose()
  }

  const saveLabel =
    !canSave || !needsValue || value === null
      ? t('common.save')
      : t('measure.saveValue', {
          value: isBp
            ? `${fmtFixed(value, locale, 0)}/${fmtFixed(diaValue ?? 0, locale, 0)}`
            : `${fmtFixed(value, locale, spec.digits)} ${unit}`,
        })

  return (
    <Sheet
      open
      onClose={onClose}
      title={kindLabel(t, kind)}
      description={t('health.log')}
      footer={
        <Button block size="lg" disabled={!canSave} onClick={save}>
          {saveLabel}
        </Button>
      }
    >
      <div className="flex flex-col gap-5 py-1">
        <div
          role="radiogroup"
          aria-label={t('health.kind')}
          className="hide-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 pb-1"
        >
          {LOGGABLE_KINDS.map((k) => (
            <button
              key={k}
              ref={k === kind ? picked : undefined}
              type="button"
              role="radio"
              aria-checked={k === kind}
              onClick={(e) => {
                setKind(k)
                e.currentTarget.scrollIntoView?.({ inline: 'center', block: 'nearest' })
              }}
              className={
                k === kind
                  ? 'h-11 shrink-0 rounded-full border border-signal bg-signal-soft px-4 text-[13.5px] font-semibold text-signal'
                  : 'h-11 shrink-0 rounded-full border border-line bg-panel px-4 text-[13.5px] text-ink-2'
              }
            >
              {kindLabel(t, k)}
            </button>
          ))}
        </div>

        {loading ? (
          <Skeleton className="h-[112px] w-full" />
        ) : isBp ? (
          <div className="flex flex-col gap-3">
            {(
              [
                ['bp_systolic', value, spec],
                ['bp_diastolic', diaValue, diaSpec],
              ] as const
            ).map(([k, v, s]) => (
              <div key={k} className="flex items-center gap-3">
                <span className="w-[88px] shrink-0 text-[13.5px] font-semibold">
                  {t(`health.kinds.${k}`)}
                </span>
                <div className="min-w-0 flex-1">
                  <NumberStepper
                    size="sm"
                    value={v}
                    onChange={edit(k)}
                    spec={s}
                    unit="mmHg"
                    label={t(`health.kinds.${k}`)}
                    locale={locale}
                    autoFocus={k === 'bp_systolic' && v === null}
                    invalid={v !== null && !inRange(s, v)}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className={isSession && noLength ? 'pointer-events-none opacity-40' : undefined}>
              <NumberStepper
                value={value}
                onChange={edit(kind)}
                spec={spec}
                unit={unit}
                label={kindLabel(t, kind)}
                locale={locale}
                autoFocus={value === null && !(isSession && noLength)}
                invalid={needsValue && value !== null && !inRange(spec, value)}
              />
            </div>
            {PRESETS[kind] && (
              <div className="flex gap-2.5">
                {PRESETS[kind]?.map((n) => (
                  <AmountChip
                    key={n}
                    amount={String(n)}
                    unit={unit}
                    label={t('measure.setValue', { value: `${n} ${unit}` })}
                    onPress={() => {
                      setNoLength(false)
                      edit(kind)(n)
                    }}
                  />
                ))}
              </div>
            )}
            {isSession && (
              <button
                type="button"
                aria-pressed={noLength}
                onClick={() => setNoLength((v) => !v)}
                className="h-11 self-start px-1 text-[13px] font-semibold text-signal"
              >
                {noLength ? t('measure.withLength') : t('measure.noLength')}
              </button>
            )}
          </div>
        )}

        {!loading && (
          <div className="flex min-h-7 flex-wrap items-center gap-x-2.5 gap-y-1.5 text-[12.5px] text-muted">
            {outOfRange ? (
              <span role="alert" className="font-medium text-danger">
                {t('measure.outOfRange')}
              </span>
            ) : last && lastText ? (
              <>
                <span>
                  {t('measure.last', { value: lastText, when: agoLabel(t, last.at, now) })}
                </span>
                {delta !== null && (
                  <DeltaChip delta={delta} digits={spec.digits} unit={unit} locale={locale} />
                )}
              </>
            ) : (
              <span>{t('measure.noLast')}</span>
            )}
          </div>
        )}

        <Field label={t('measure.when')}>
          {() => (
            <div className="flex flex-col gap-2">
              <Choice<'now' | 'custom'>
                value={whenMode}
                onChange={setWhenMode}
                label={t('measure.when')}
                options={[
                  { value: 'now', label: t('doses.now') },
                  { value: 'custom', label: t('common.date') },
                ]}
              />
              {whenMode === 'custom' && (
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="date"
                    aria-label={t('common.date')}
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                  <Input
                    type="time"
                    aria-label={t('common.time')}
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                  />
                </div>
              )}
            </div>
          )}
        </Field>

        {showNote ? (
          <Field label={`${t('common.notes')} (${t('common.optional')})`}>
            {(id) => (
              <Textarea id={id} rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
            )}
          </Field>
        ) : (
          <button
            type="button"
            onClick={() => setShowNote(true)}
            className="-mt-2 flex h-11 items-center gap-1.5 self-start text-[13px] font-semibold text-signal"
          >
            <Plus className="size-3.5" aria-hidden />
            {t('measure.addNote')}
          </button>
        )}
      </div>
    </Sheet>
  )
}
