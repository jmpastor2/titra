import { clsx } from 'clsx'
import { Plus } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { usePatientScope } from '@/app/scope'
import { Button } from '@/components/ui/Button'
import { Field, Input, Textarea } from '@/components/ui/Field'
import { Sheet } from '@/components/ui/Sheet'
import { Badge } from '@/components/ui/primitives'
import { useToast } from '@/components/ui/Toast'
import { useAddLab, useDeleteLab, useLabs } from '@/data/hooks'
import { rowId } from '@/features/quicklog/data'
import { defaultsFor, LAB_PRESETS, labFlag, loggedAnalytes } from '@/features/quicklog/labs'
import { BlockLabel, DeltaChip } from '@/features/quicklog/SheetBits'
import { deltaFrom, parseNumber } from '@/features/quicklog/stepper'
import { agoLabel } from '@/features/quicklog/text'
import { fmtDate, fmtNumber, toDateInputValue } from '@/lib/format'
import { useLocale } from '@/lib/useLocale'

/** How many chips show before "Más parámetros". */
const FIRST_CHIPS = 8

/** Analytes match whatever the casing or the stray space. */
const key = (name: string) => name.trim().toLocaleLowerCase()

/** What was typed as a number, or null when it is empty or not one. */
const num = (text: string) => (text.trim() ? parseNumber(text, 2) : null)

/** Mounted only while open, so every opening starts from a fresh form. */
export function AddLabSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  return open ? <AddLabForm onClose={onClose} /> : null
}

function Chip({
  active,
  onPress,
  children,
}: {
  active: boolean
  onPress: () => void
  children: string
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onPress}
      className={clsx(
        'h-11 touch-manipulation rounded-full border px-3.5 text-[13px] transition active:scale-[0.97]',
        active
          ? 'border-signal bg-signal-soft font-semibold text-signal'
          : 'border-line bg-panel text-ink-2',
      )}
    >
      {children}
    </button>
  )
}

function AddLabForm({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const { patientId } = usePatientScope()
  const { toast } = useToast()
  const add = useAddLab(patientId)
  const del = useDeleteLab(patientId)
  const labs = useLabs(patientId)
  const [now] = useState(() => new Date())
  const logged = useMemo(() => loggedAnalytes(labs.data ?? []), [labs.data])

  const [analyte, setAnalyte] = useState('')
  const [value, setValue] = useState('')
  const [unit, setUnit] = useState('')
  const [low, setLow] = useState('')
  const [high, setHigh] = useState('')
  const [drawnAt, setDrawnAt] = useState(() => toDateInputValue(new Date()))
  const [notes, setNotes] = useState('')
  const [showRange, setShowRange] = useState(false)
  const [showNote, setShowNote] = useState(false)
  const [showAll, setShowAll] = useState(false)
  const valueBox = useRef<HTMLDivElement>(null)

  const known = new Set(logged.map((l) => key(l.analyte)))
  const chips = [
    ...logged.slice(0, 6).map((l) => l.analyte),
    ...LAB_PRESETS.map((p) => p.analyte).filter((a) => !known.has(key(a))),
  ]
  const shownChips = showAll ? chips : chips.slice(0, FIRST_CHIPS)
  const own = logged.find((l) => key(l.analyte) === key(analyte))

  const v = num(value)
  const lo = num(low)
  const hi = num(high)
  const flag = labFlag(v, lo, hi)
  const delta = own && v !== null ? deltaFrom(v, Number(own.last.value), 2) : null

  const fmtLimit = (n: number | null) => (n === null ? '' : fmtNumber(n, locale, 2))

  function choose(name: string) {
    setAnalyte(name)
    const d = defaultsFor(name, logged)
    setUnit(d?.unit ?? '')
    setLow(fmtLimit(d?.low ?? null))
    setHigh(fmtLimit(d?.high ?? null))
    // Straight on to the number.
    valueBox.current?.querySelector('input')?.focus({ preventScroll: true })
  }

  function save() {
    if (!analyte.trim() || v === null) {
      toast(t('errors.required'), 'warn')
      return
    }
    const saved = add.mutateAsync({
      patient_id: patientId,
      analyte: analyte.trim(),
      value: v,
      unit: unit.trim() || '—',
      drawn_at: drawnAt,
      ref_low: lo,
      ref_high: hi,
      notes: notes.trim() || null,
    })
    const fail = () => toast(t('common.error'), 'error')
    saved.catch(fail)
    toast(t('common.saved'), 'success', {
      action: {
        label: t('quick.counter.undo'),
        // The result may not have come back yet: wait for it, then take it out.
        onAction: () =>
          saved
            .then((row) => {
              const id = rowId(row)
              return id ? del.mutateAsync(id) : undefined
            })
            .then(() => undefined, fail),
      },
    })
    onClose()
  }

  return (
    <Sheet
      open
      onClose={onClose}
      title={t('health.addLab')}
      footer={
        <Button block size="lg" disabled={!analyte.trim() || v === null} onClick={save}>
          {t('common.save')}
        </Button>
      }
    >
      <div className="flex flex-col gap-5 py-1">
        <div>
          <BlockLabel>
            {logged.length > 0 ? t('measure.labYours') : t('measure.labUsual')}
          </BlockLabel>
          <div className="flex flex-wrap gap-2">
            {shownChips.map((name) => (
              <Chip key={name} active={key(analyte) === key(name)} onPress={() => choose(name)}>
                {name}
              </Chip>
            ))}
            {!showAll && chips.length > FIRST_CHIPS && (
              <button
                type="button"
                onClick={() => setShowAll(true)}
                className="h-11 rounded-full px-3 text-[13px] font-semibold text-signal"
              >
                {t('measure.labMore')}
              </button>
            )}
          </div>
        </div>

        <Field label={t('health.analyte')}>
          {(id) => <Input id={id} value={analyte} onChange={(e) => setAnalyte(e.target.value)} />}
        </Field>

        <div ref={valueBox} className="grid grid-cols-[1fr_8rem] gap-3">
          <Field label={t('health.value')}>
            {(id) => (
              <Input
                id={id}
                inputMode="decimal"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="tabular h-14 text-[22px] font-semibold"
              />
            )}
          </Field>
          <Field label={t('health.unit')}>
            {(id) => (
              <Input
                id={id}
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="h-14"
              />
            )}
          </Field>
        </div>

        {(own || flag) && (
          <div className="-mt-2 flex min-h-7 flex-wrap items-center gap-x-2.5 gap-y-1.5 text-[12.5px] text-muted">
            {own && (
              <span>
                {t('measure.last', {
                  value: `${fmtNumber(Number(own.last.value), locale, 2)} ${own.unit}`.trim(),
                  when: `${fmtDate(new Date(`${own.last.drawn_at}T12:00`), locale, 'd MMM')} · ${agoLabel(t, new Date(`${own.last.drawn_at}T12:00`), now)}`,
                })}
              </span>
            )}
            {delta !== null && delta !== 0 && (
              <DeltaChip delta={delta} digits={2} unit={own?.unit ?? ''} locale={locale} />
            )}
            {flag && (
              <Badge tone={flag === 'ok' ? 'ok' : 'warn'}>
                {flag === 'ok' ? t('measure.labInRange') : t('health.outOfRange')}
              </Badge>
            )}
          </div>
        )}

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

        {showRange ? (
          <Field label={t('health.refRange')} hint={t('common.optional')}>
            {() => (
              <div className="grid grid-cols-2 gap-3">
                <Input
                  inputMode="decimal"
                  aria-label="min"
                  value={low}
                  onChange={(e) => setLow(e.target.value)}
                  placeholder="min"
                />
                <Input
                  inputMode="decimal"
                  aria-label="max"
                  value={high}
                  onChange={(e) => setHigh(e.target.value)}
                  placeholder="max"
                />
              </div>
            )}
          </Field>
        ) : (
          <div className="flex items-center justify-between gap-3 text-[13px]">
            <span className="text-muted">
              {t('health.refRange')}:{' '}
              <span className="readout text-ink-2">
                {lo === null && hi === null
                  ? '—'
                  : `${fmtLimit(lo) || '…'} – ${fmtLimit(hi) || '…'}`}
              </span>
            </span>
            <button
              type="button"
              onClick={() => setShowRange(true)}
              className="h-11 px-1 font-semibold text-signal"
            >
              {t('common.edit')}
            </button>
          </div>
        )}

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
