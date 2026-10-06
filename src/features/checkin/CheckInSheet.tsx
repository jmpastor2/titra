import { Flame, RotateCcw } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { usePatientScope } from '@/app/scope'
import { Button } from '@/components/ui/Button'
import { Sheet } from '@/components/ui/Sheet'
import { Skeleton } from '@/components/ui/primitives'
import { useToast } from '@/components/ui/Toast'
import type { MeasurementKind } from '@/data/database.types'
import { useQuickMeasurements } from '@/features/quicklog/data'
import { checkInSummary } from '@/features/quicklog/readings'
import { useQuickSave } from '@/features/quicklog/useQuickSave'
import { fmtDate } from '@/lib/format'
import { useLocale } from '@/lib/useLocale'
import { WELLBEING } from './wellbeing'

export function CheckInSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  return open ? <CheckInForm onClose={onClose} /> : null
}

function CheckInForm({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const { patientId } = usePatientScope()
  const { toast } = useToast()
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
    if (rowsToSave.length === 0) {
      toast(t('checkin.nothing'), 'warn')
      return
    }
    saveRows(rowsToSave, t('checkin.saved'))
    onClose()
  }

  return (
    <Sheet
      open
      onClose={onClose}
      title={t('checkin.title')}
      description={t('checkin.intro')}
      footer={
        <Button block size="lg" onClick={submit}>
          {scored.length > 0 ? t('checkin.saveCount', { count: scored.length }) : t('common.save')}
        </Button>
      }
    >
      {(before.streak > 1 || before.doneToday) && (
        <p className="mt-1 flex items-center gap-1.5 text-[12.5px] text-muted">
          {before.streak > 1 && <Flame className="size-3.5 text-warn" aria-hidden />}
          {before.doneToday
            ? t('checkin.doneToday')
            : t('checkin.streak', { count: before.streak })}
        </p>
      )}

      {before.lastAt && (
        <button
          type="button"
          onClick={() => setValues((s) => ({ ...before.last, ...s }))}
          className="mt-3 flex min-h-12 w-full items-center gap-2.5 rounded-control border border-line-strong bg-panel-2 px-3.5 text-left transition active:scale-[0.99]"
        >
          <RotateCcw className="size-4 shrink-0 text-signal" aria-hidden />
          <span className="min-w-0 flex-1">
            <span className="block text-[14px] font-semibold">{t('checkin.same')}</span>
            <span className="block text-[12px] text-muted">
              {t('checkin.sameFrom', { date: fmtDate(before.lastAt, locale, 'd MMM') })}
            </span>
          </span>
        </button>
      )}

      {pending ? (
        // Waiting for the last scores, so the sliders do not jump when they arrive.
        <div className="flex flex-col gap-3.5 py-3">
          {WELLBEING.map((kind) => (
            <Skeleton key={kind} className="h-[72px] w-full" />
          ))}
        </div>
      ) : (
        <ul className="flex flex-col gap-3.5 py-3">
          {WELLBEING.map((kind) => {
            const v = values[kind]
            const last = before.last[kind]
            return (
              <li key={kind}>
                <div className="flex items-center justify-between gap-3">
                  <label htmlFor={`ci-${kind}`} className="text-[14.5px] font-semibold">
                    {t(`health.kinds.${kind}`)}
                  </label>
                  <span className="flex items-center gap-2">
                    {last !== undefined &&
                      (v === undefined ? (
                        <button
                          type="button"
                          aria-label={t('checkin.keep', {
                            what: t(`health.kinds.${kind}`),
                            value: last,
                          })}
                          onClick={() => set(kind, last)}
                          className="-my-2 flex h-11 items-center gap-1 rounded-full px-2.5 text-[12px] font-semibold text-signal"
                        >
                          <RotateCcw className="size-3" aria-hidden />
                          {t('checkin.before', { value: last })}
                        </button>
                      ) : (
                        <span className="text-[11.5px] text-muted">
                          {t('checkin.before', { value: last })}
                        </span>
                      ))}
                    <span
                      className={`readout min-w-12 text-right text-[18px] font-semibold ${v === undefined ? 'text-muted' : 'text-signal'}`}
                    >
                      {v ?? '–'}
                      <span className="text-[11px] text-muted">/10</span>
                    </span>
                  </span>
                </div>
                <div>
                  <input
                    id={`ci-${kind}`}
                    type="range"
                    min={0}
                    max={10}
                    step={1}
                    value={v ?? last ?? 5}
                    aria-valuetext={v === undefined ? t('checkin.unscored') : `${v}/10`}
                    onChange={(e) => set(kind, Number(e.target.value))}
                    className={`h-11 w-full accent-[var(--signal)] ${v === undefined ? 'opacity-40' : ''}`}
                  />
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </Sheet>
  )
}
