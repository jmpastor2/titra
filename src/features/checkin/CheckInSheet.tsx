import { clsx } from 'clsx'
import { Flame, RotateCcw } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { usePatientScope } from '@/app/scope'
import { Button } from '@/components/ui/Button'
import { Sheet } from '@/components/ui/Sheet'
import { Skeleton } from '@/components/ui/primitives'
import type { MeasurementKind } from '@/data/database.types'
import { useQuickMeasurements } from '@/features/quicklog/data'
import { checkInSummary } from '@/features/quicklog/readings'
import { agoLabel } from '@/features/quicklog/text'
import { useQuickSave } from '@/features/quicklog/useQuickSave'
import { WELLBEING } from './wellbeing'

export function CheckInSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  return open ? <CheckInForm onClose={onClose} /> : null
}

function CheckInForm({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation()
  const { patientId } = usePatientScope()
  const { save: saveRows } = useQuickSave(patientId)
  const { rows, pending } = useQuickMeasurements(patientId)
  const [now] = useState(() => new Date())
  const before = useMemo(() => checkInSummary(rows, now), [rows, now])
  // Only dimensions the user actually scored (touched, or accepted from last time) are
  // saved: no fake "5 out of 10" rows.
  const [values, setValues] = useState<Partial<Record<MeasurementKind, number>>>({})
  const set = (kind: MeasurementKind, value: number) => setValues((s) => ({ ...s, [kind]: value }))

  const scored = WELLBEING.filter((k) => values[k] !== undefined)

  function submit() {
    const rowsToSave = scored.flatMap((kind) => {
      const value = values[kind]
      return value === undefined ? [] : [{ kind, value, unit: 'score' }]
    })
    if (rowsToSave.length === 0) return
    saveRows(rowsToSave, t('checkin.saved'))
    onClose()
  }

  return (
    <Sheet
      open
      onClose={onClose}
      title={t('checkin.title')}
      description={t('checkin.intro')}
      tall
      footer={
        <Button block size="lg" disabled={scored.length === 0} onClick={submit}>
          {scored.length > 0 ? t('checkin.saveScores', { count: scored.length }) : t('common.save')}
        </Button>
      }
    >
      {/*
        Kept the height of its button while the last check-in loads, so the sliders stay put; a
        first check-in, with nothing to repeat, goes without the row.
      */}
      {(pending || before.lastAt || before.streak > 1) && (
        <div className="flex min-h-11 items-center justify-between gap-3 pt-1">
          {before.lastAt && (
            <Button
              variant="secondary"
              size="sm"
              leading={<RotateCcw className="size-3.5 text-signal" aria-hidden />}
              onClick={() => setValues((s) => ({ ...before.last, ...s }))}
            >
              {t('checkin.sameAs', { when: agoLabel(t, before.lastAt, now) })}
            </Button>
          )}
          {(before.doneToday || before.streak > 1) && (
            <span className="flex items-center gap-1 text-[12.5px] text-muted">
              {before.doneToday ? (
                t('checkin.doneShort')
              ) : (
                <>
                  <Flame className="size-3.5 text-warn" aria-hidden />
                  {t('quick.checkin.streak', { count: before.streak })}
                </>
              )}
            </span>
          )}
        </div>
      )}

      {pending ? (
        // Waiting for the last scores, so the sliders do not jump when they arrive.
        <div className="flex flex-col gap-4 pb-2 pt-3">
          {WELLBEING.map((kind) => (
            <Skeleton key={kind} className="h-[72px] w-full" />
          ))}
        </div>
      ) : (
        <ul className="flex flex-col gap-4 pb-2 pt-3">
          {WELLBEING.map((kind) => {
            const v = values[kind]
            const last = before.last[kind]
            const name = t(`health.kinds.${kind}`)
            return (
              <li key={kind}>
                <div className="flex h-7 items-center justify-between gap-3">
                  <label htmlFor={`ci-${kind}`} className="text-[15px] font-semibold">
                    {name}
                  </label>
                  <span className="flex items-center gap-1.5">
                    {last !== undefined &&
                      (v === undefined ? (
                        <button
                          type="button"
                          aria-label={t('checkin.keep', { what: name, value: last })}
                          onClick={() => set(kind, last)}
                          className="flex h-11 items-center gap-1 rounded-full px-2 text-[12.5px] font-semibold text-signal outline-none focus-visible:ring-2 focus-visible:ring-signal/60"
                        >
                          <RotateCcw className="size-3" aria-hidden />
                          {t('checkin.before', { value: last })}
                        </button>
                      ) : (
                        <span className="px-2 text-[12.5px] text-muted">
                          {t('checkin.before', { value: last })}
                        </span>
                      ))}
                    <span
                      className={clsx(
                        'readout w-11 text-right text-[19px] font-semibold',
                        v === undefined ? 'text-muted' : 'text-ink',
                      )}
                    >
                      {v ?? '–'}
                      <span className="text-[11.5px] font-medium text-muted">/10</span>
                    </span>
                  </span>
                </div>
                <input
                  id={`ci-${kind}`}
                  type="range"
                  min={0}
                  max={10}
                  step={1}
                  value={v ?? last ?? 5}
                  aria-valuetext={v === undefined ? t('checkin.unscored') : `${v}/10`}
                  onChange={(e) => set(kind, Number(e.target.value))}
                  className={clsx(
                    'block h-11 w-full accent-[var(--signal)]',
                    v === undefined && 'opacity-40',
                  )}
                />
              </li>
            )
          })}
        </ul>
      )}
    </Sheet>
  )
}
