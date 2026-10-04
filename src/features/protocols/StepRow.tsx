import { clsx } from 'clsx'
import { Pause, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Field, Input } from '@/components/ui/Field'
import { Badge } from '@/components/ui/primitives'
import type { DoseUnit } from '@/domain/types'
import { useCycleText } from './cycleText'
import { blurOnEnter } from './blurOnEnter'
import { DoseEquivalents, DoseInput } from './DoseField'
import type { DoseEntry } from './doseUnits'
import type { PastEdit, RowTime, StepDraft } from './draft'

export interface FromWeekOffer {
  /** Whole weeks of the step already lived. */
  weeksBehind: number
  /** The old dose as it reads ("12 U"). */
  fromText: string
  apply: boolean
  onApply: (on: boolean) => void
}

/**
 * One step of the plan being edited: its dose (typed in U, mg or mcg, the others beneath),
 * its weeks and its dates. The step in force says "estás aquí"; editing a step that already
 * happened warns that dates move; a dose change on the step in force offers to start this week.
 */
export function StepRow({
  step,
  index,
  now,
  doseEntry,
  native,
  conc,
  mg,
  weeks,
  time,
  past,
  syringe,
  fromWeek,
  removable,
  onChange,
  onRemove,
}: {
  step: StepDraft
  index: number
  now: Date
  doseEntry: DoseEntry
  native: DoseUnit
  conc: number | null
  /** The typed dose in mg; null while it is empty or not a number. */
  mg: number | null
  /** The typed duration in weeks; null when open-ended. */
  weeks: number | null
  time: RowTime | undefined
  past: PastEdit | undefined
  /** The whole syringe when other compounds ride with this dose: "12 U (200 + 200 mcg)". */
  syringe: string | null
  fromWeek: FromWeekOffer | null
  removable: boolean
  onChange: (patch: Partial<StepDraft>) => void
  onRemove: () => void
}) {
  const { t } = useTranslation()
  const text = useCycleText()
  const current = time?.state === 'current'

  return (
    <li
      aria-current={current ? 'step' : undefined}
      className={clsx(
        'rounded-control border p-3',
        step.pause ? 'border-dashed border-line-strong' : 'bg-panel-2',
        current ? 'border-signal/50' : !step.pause && 'border-line',
      )}
    >
      <div className="mb-1.5 flex items-center gap-2">
        <span className="spec flex items-center gap-1.5">
          {step.pause && <Pause className="size-3" />}
          {step.pause ? t('protocols.timeline.rest') : `${t('protocols.step')} ${index + 1}`}
        </span>
        {current && <Badge tone="brand">{t('protocols.timeline.here')}</Badge>}
        {time?.state === 'past' && <Badge>{t('protocols.past.badge')}</Badge>}
        <span className="flex-1" />
        {removable && (
          <button
            type="button"
            aria-label={t('protocols.removeStep')}
            onClick={onRemove}
            className="-my-2 -mr-2 grid size-11 place-items-center rounded-full text-muted hover:text-danger"
          >
            <Trash2 className="size-4" />
          </button>
        )}
      </div>
      {time && (
        <div className="readout mb-2 text-[12px] text-muted">
          {text.span(time.startsOn, time.endsOn, now)}
          {current &&
            ` · ${
              weeks === null
                ? t('protocols.timeline.weekOpen', { n: time.weekInStep })
                : t('protocols.timeline.weekOf', { n: time.weekInStep, total: weeks })
            }`}
        </div>
      )}

      <div className="grid grid-cols-2 items-start gap-2">
        {!step.pause && (
          <Field label={t('protocols.doseMg')}>
            {(id) => (
              <DoseInput
                id={id}
                value={step.dose}
                entry={doseEntry}
                native={native}
                conc={conc}
                mg={mg}
                equivalents={false}
                onChange={(dose) => onChange({ dose })}
              />
            )}
          </Field>
        )}
        <Field
          label={t('protocols.durationWeeks')}
          hint={!step.pause && step.weeks.trim() === '' ? t('protocols.openEnded') : undefined}
          className={step.pause ? 'col-span-2' : undefined}
        >
          {(id) => (
            <Input
              id={id}
              inputMode="numeric"
              enterKeyHint="done"
              autoComplete="off"
              value={step.weeks}
              placeholder="∞"
              onChange={(e) => onChange({ weeks: e.target.value })}
              onFocus={(e) => e.currentTarget.select()}
              onKeyDown={blurOnEnter}
              suffix={t('protocols.weeksShort')}
              className="readout bg-panel"
            />
          )}
        </Field>
      </div>

      {!step.pause && (
        <DoseEquivalents
          mg={mg}
          entry={doseEntry}
          native={native}
          conc={conc}
          className="readout mt-2 text-[12.5px] font-semibold text-signal"
        />
      )}
      {syringe && (
        <div className="readout mt-2 text-[12.5px] text-ink-2">
          {t('protocols.syringeLine', { line: syringe })}
        </div>
      )}

      {past && (
        <p
          role="status"
          className="mt-2.5 rounded-control border border-warn/30 bg-warn-soft px-3 py-2 text-[12.5px] leading-snug text-ink-2"
        >
          {t(past === 'weeks' ? 'protocols.past.weeks' : 'protocols.past.dose')}
        </p>
      )}

      {fromWeek && (
        <label className="mt-2.5 flex items-start gap-3 rounded-control border border-signal/30 bg-signal-soft px-3 py-2.5">
          <input
            type="checkbox"
            checked={fromWeek.apply}
            onChange={(e) => fromWeek.onApply(e.target.checked)}
            className="mt-0.5 size-5 shrink-0 accent-[var(--signal)]"
          />
          <span className="min-w-0">
            <span className="block text-[13.5px] font-semibold">
              {t('protocols.fromWeek.title')}
            </span>
            <span className="block text-[12px] leading-snug text-ink-2">
              {fromWeek.apply
                ? t('protocols.fromWeek.on', {
                    count: fromWeek.weeksBehind,
                    dose: fromWeek.fromText,
                  })
                : t('protocols.fromWeek.off')}
            </span>
          </span>
        </label>
      )}
    </li>
  )
}
