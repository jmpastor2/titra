import { clsx } from 'clsx'
import { Pause, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Field, Input } from '@/components/ui/Field'
import { Badge } from '@/components/ui/primitives'
import type { DoseUnit } from '@/domain/types'
import { Caution } from './Caution'
import { useCycleText } from './cycleText'
import { blurOnEnter } from './blurOnEnter'
import { DoseEquivalents, DoseInput } from './DoseField'
import type { DoseEntry } from './doseUnits'
import type { PastEdit, RowTime, StepDraft } from './draft'
import { SwitchRow } from './SwitchRow'

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
    // A row of the steps list, split from the next by a hairline: no panel per step.
    <li aria-current={current ? 'step' : undefined} className="py-4 first:pt-1 last:pb-1">
      <div className="flex min-h-6 items-center gap-2">
        <span
          className={clsx(
            'flex items-center gap-1.5 text-[14.5px] font-semibold',
            step.pause && 'text-ink-2',
          )}
        >
          {step.pause && <Pause aria-hidden className="size-3.5" />}
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
            className="-my-2.5 -mr-2.5 grid size-11 place-items-center rounded-full text-muted hover:text-danger"
          >
            <Trash2 className="size-4" />
          </button>
        )}
      </div>
      {time && (
        <div className="readout mt-0.5 text-[12.5px] text-muted">
          {text.span(time.startsOn, time.endsOn, now)}
          {current &&
            ` · ${
              weeks === null
                ? t('protocols.timeline.weekOpen', { n: time.weekInStep })
                : t('protocols.timeline.weekOf', { n: time.weekInStep, total: weeks })
            }`}
        </div>
      )}

      <div className="mt-3 grid grid-cols-2 items-start gap-2">
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
              className="readout"
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
          className="readout mt-2 text-[13px] font-semibold leading-snug text-signal"
        />
      )}
      {syringe && (
        <div className="readout mt-1 text-[13px] text-ink-2">
          {t('protocols.syringeLine', { line: syringe })}
        </div>
      )}

      {past && (
        <Caution role="status" className="mt-2.5">
          {t(past === 'weeks' ? 'protocols.past.weeks' : 'protocols.past.dose')}
        </Caution>
      )}

      {fromWeek && (
        <SwitchRow
          className="mt-3"
          checked={fromWeek.apply}
          onChange={fromWeek.onApply}
          label={t('protocols.fromWeek.title')}
          hint={
            fromWeek.apply
              ? t('protocols.fromWeek.on', {
                  count: fromWeek.weeksBehind,
                  dose: fromWeek.fromText,
                })
              : t('protocols.fromWeek.off')
          }
        />
      )}
    </li>
  )
}
