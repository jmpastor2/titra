import { clsx } from 'clsx'
import { subDays } from 'date-fns'
import { Plus, RotateCcw } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { usePatientScope } from '@/app/scope'
import { Button } from '@/components/ui/Button'
import { Field, Input, Textarea } from '@/components/ui/Field'
import { Sheet } from '@/components/ui/Sheet'
import { Skeleton } from '@/components/ui/primitives'
import { useToast } from '@/components/ui/Toast'
import type { SymptomKind } from '@/data/database.types'
import { useAddSymptom, useDeleteSymptom, useSymptoms } from '@/data/hooks'
import { rowId } from '@/features/quicklog/data'
import { BlockLabel, Choice } from '@/features/quicklog/SheetBits'
import { agoLabel } from '@/features/quicklog/text'
import { fromDateTimeInputs, toDateInputValue, toTimeInputValue } from '@/lib/format'
import {
  habitualKinds,
  lastDaySymptoms,
  levelOf,
  severityOf,
  severityTone,
  SYMPTOM_KINDS,
} from './kinds'

interface Props {
  open: boolean
  onClose: () => void
}

/** Mounted only while open, so every opening starts from a fresh form. */
export function LogSymptomSheet({ open, onClose }: Props) {
  return open ? <LogSymptomForm onClose={onClose} /> : null
}

const LEVELS = [1, 2, 3, 4, 5] as const

const TONE_TEXT = { ok: 'text-ok', warn: 'text-warn', danger: 'text-danger' } as const

function KindChip({
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
      role="radio"
      aria-checked={active}
      onClick={onPress}
      className={clsx(
        'h-11 touch-manipulation rounded-full border px-4 text-[13.5px] transition active:scale-[0.97]',
        active
          ? 'border-signal bg-signal-soft font-semibold text-signal'
          : 'border-line bg-panel text-ink-2',
      )}
    >
      {children}
    </button>
  )
}

function LogSymptomForm({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation()
  const { patientId } = usePatientScope()
  const { toast } = useToast()
  const add = useAddSymptom(patientId)
  const del = useDeleteSymptom(patientId)
  const history = useSymptoms(patientId, 90)
  const [now] = useState(() => new Date())

  const rows = useMemo(() => history.data ?? [], [history.data])
  const habitual = useMemo(() => habitualKinds(rows), [rows])
  const again = useMemo(() => lastDaySymptoms(rows, now), [rows, now])

  const [kind, setKind] = useState<SymptomKind | null>(null)
  const [level, setLevel] = useState<number | null>(null)
  const [showAll, setShowAll] = useState(false)
  const [whenMode, setWhenMode] = useState<'now' | 'custom'>('now')
  const [date, setDate] = useState(() => toDateInputValue(new Date()))
  const [time, setTime] = useState(() => toTimeInputValue(new Date()))
  const [showNote, setShowNote] = useState(false)
  const [notes, setNotes] = useState('')

  const others = SYMPTOM_KINDS.filter((k) => !habitual.includes(k))
  const canSave = kind !== null && level !== null

  function save() {
    if (kind === null || level === null) return
    // Closed at once: offline, the save waits for the network without holding the sheet.
    const saved = add.mutateAsync({
      patient_id: patientId,
      kind,
      severity: severityOf(level),
      occurred_at: (whenMode === 'now' ? new Date() : fromDateTimeInputs(date, time)).toISOString(),
      notes: notes.trim() || null,
    })
    const fail = () => toast(t('common.error'), 'error')
    saved.catch(fail)
    toast(t('symptoms.saved', { kind: t(`symptoms.kinds.${kind}`) }), 'success', {
      action: {
        label: t('quick.counter.undo'),
        // The row may not have come back yet: wait for it, then take it out.
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
      title={t('symptoms.log')}
      footer={
        <Button block size="lg" disabled={!canSave} onClick={save}>
          {kind !== null && level !== null
            ? t('symptoms.saveValue', { kind: t(`symptoms.kinds.${kind}`), level })
            : t('common.save')}
        </Button>
      }
    >
      <div className="flex flex-col gap-5 py-1">
        {history.isPending ? (
          // Waiting for the history, so the usual symptoms do not shuffle when it arrives.
          <Skeleton className="h-[188px] w-full" />
        ) : (
          <>
            {again && (
              <div>
                <BlockLabel>
                  {again.daysAgo === 1
                    ? t('symptoms.sameYesterday')
                    : t('symptoms.sameAgo', {
                        when: agoLabel(t, subDays(now, again.daysAgo), now),
                      })}
                </BlockLabel>
                <div className="flex flex-wrap gap-2">
                  {again.items.map((item) => (
                    <button
                      key={item.kind}
                      type="button"
                      onClick={() => {
                        setKind(item.kind)
                        setLevel(levelOf(item.severity))
                      }}
                      className="flex h-11 touch-manipulation items-center gap-1.5 rounded-full border border-line-strong bg-panel-2 px-3.5 text-[13.5px] font-semibold transition active:scale-[0.97]"
                    >
                      <RotateCcw className="size-3.5 text-signal" aria-hidden />
                      {t(`symptoms.kinds.${item.kind}`)}
                      <span className="readout text-[12px] text-muted">
                        {levelOf(item.severity)}/5
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <BlockLabel>{t('symptoms.kind')}</BlockLabel>
              <div
                className="flex flex-wrap gap-2"
                role="radiogroup"
                aria-label={t('symptoms.kind')}
              >
                {habitual.map((k) => (
                  <KindChip key={k} active={kind === k} onPress={() => setKind(k)}>
                    {t(`symptoms.kinds.${k}`)}
                  </KindChip>
                ))}
                {showAll &&
                  others.map((k) => (
                    <KindChip key={k} active={kind === k} onPress={() => setKind(k)}>
                      {t(`symptoms.kinds.${k}`)}
                    </KindChip>
                  ))}
                {!showAll && (
                  <button
                    type="button"
                    onClick={() => setShowAll(true)}
                    className="h-11 rounded-full px-3 text-[13.5px] font-semibold text-signal"
                  >
                    {t('symptoms.more')}
                  </button>
                )}
              </div>
            </div>
          </>
        )}

        <div>
          <BlockLabel>{t('symptoms.severity')}</BlockLabel>
          <div
            className="grid grid-cols-5 gap-2"
            role="radiogroup"
            aria-label={t('symptoms.severity')}
          >
            {LEVELS.map((n) => {
              const active = level === n
              const tone = TONE_TEXT[severityTone(severityOf(n))]
              return (
                <button
                  key={n}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  aria-label={`${n}/5, ${t(`symptoms.level.${n}`)}`}
                  onClick={() => setLevel(n)}
                  className={clsx(
                    'flex h-[62px] touch-manipulation flex-col items-center justify-center rounded-control border transition active:scale-[0.97]',
                    active ? 'border-signal bg-signal-soft' : 'border-line bg-panel-2',
                  )}
                >
                  <span
                    aria-hidden
                    className={clsx(
                      'readout text-[22px] font-semibold leading-none',
                      active ? tone : 'text-ink-2',
                    )}
                  >
                    {n}
                  </span>
                  <span
                    aria-hidden
                    className="mt-1 max-w-full truncate px-0.5 text-[10.5px] leading-none text-muted"
                  >
                    {t(`symptoms.level.${n}`)}
                  </span>
                </button>
              )
            })}
          </div>
          <p className="mt-2 text-[12px] text-muted">
            {level === null
              ? t('symptoms.severityHint')
              : t('symptoms.severityOf10', { value: severityOf(level) })}
          </p>
        </div>

        <Field label={t('symptoms.when')}>
          {() => (
            <div className="flex flex-col gap-2">
              <Choice<'now' | 'custom'>
                value={whenMode}
                onChange={setWhenMode}
                label={t('symptoms.when')}
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
            {t('symptoms.addNote')}
          </button>
        )}
      </div>
    </Sheet>
  )
}
