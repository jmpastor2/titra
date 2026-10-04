import { clsx } from 'clsx'
import { Check, Pause } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/primitives'
import type { CycleInfo, CycleStep } from '@/domain/dosing/cycle'
import { useCycleText } from './cycleText'

export interface StepDoseText {
  /** "12 U" */
  main: string
  /** "200 + 200 mcg" */
  sub?: string
}

type State = 'past' | 'current' | 'future'

function stateOf(info: CycleInfo, index: number): State {
  const current = info.step?.index
  if (current === undefined) return info.phase === 'finished' ? 'past' : 'future'
  return index < current ? 'past' : index === current ? 'current' : 'future'
}

/**
 * The whole plan as a vertical timeline with dates: what is behind, "estás aquí", what is
 * to come. Used by the protocol page and as the live preview in the editor.
 */
export function PlanTimeline({
  info,
  now,
  color,
  doseOf,
}: {
  info: CycleInfo
  now: Date
  color: string
  /** The dose of a step as it is read ("12 U"); null for a pause. */
  doseOf: (step: CycleStep) => StepDoseText | null
}) {
  const { t } = useTranslation()
  const text = useCycleText()

  return (
    <ol className="flex flex-col">
      {info.steps.map((s, i) => {
        const state = stateOf(info, i)
        const dose = s.pause ? null : doseOf(s)
        const last = i === info.steps.length - 1
        const title =
          s.label ?? (s.pause ? t('protocols.timeline.rest') : `${t('protocols.step')} ${i + 1}`)
        return (
          <li
            key={s.index}
            aria-current={state === 'current' ? 'step' : undefined}
            className={clsx(
              'relative flex gap-3 rounded-control py-2.5 pl-1 pr-2',
              state === 'current' && 'border border-signal/30 bg-signal-soft',
            )}
          >
            <div className="flex w-6 shrink-0 flex-col items-center">
              <Marker state={state} pause={s.pause} color={color} />
              {!last && state !== 'current' && (
                <span
                  aria-hidden
                  className={clsx(
                    'mt-1 w-px flex-1',
                    state === 'past'
                      ? 'bg-line-strong'
                      : 'border-l border-dashed border-line-strong',
                  )}
                />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span
                  className={clsx(
                    'text-[14.5px] font-semibold',
                    state === 'past' && 'text-ink-2',
                    state === 'future' && 'text-ink',
                  )}
                >
                  {title}
                </span>
                {state === 'current' && <Badge tone="brand">{t('protocols.timeline.here')}</Badge>}
              </div>
              <div className="readout mt-0.5 text-[12px] text-muted">
                {text.span(s.startsOn, s.endsOn, now)}
                {' · '}
                {s.weeks === null
                  ? t('protocols.timeline.noEnd')
                  : `${s.weeks} ${t('protocols.weeksShort')}`}
              </div>
              {state === 'current' && (
                <div className="mt-1 text-[12px] font-medium text-ink-2">
                  {s.weeks === null
                    ? t('protocols.timeline.weekOpen', { n: info.weekInStep })
                    : t('protocols.timeline.weekOf', { n: info.weekInStep, total: s.weeks })}
                </div>
              )}
            </div>
            {dose && (
              <div className="shrink-0 text-right">
                <div
                  className={clsx(
                    'readout text-[15px] font-semibold',
                    state === 'past' ? 'text-ink-2' : 'text-ink',
                  )}
                >
                  {dose.main}
                </div>
                {dose.sub && <div className="readout text-[11px] text-muted">{dose.sub}</div>}
              </div>
            )}
          </li>
        )
      })}
    </ol>
  )
}

function Marker({ state, pause, color }: { state: State; pause: boolean; color: string }) {
  if (state === 'current') {
    return (
      <span
        aria-hidden
        className="mt-0.5 grid size-5 place-items-center rounded-full"
        style={{
          background: color,
          boxShadow: `0 0 12px color-mix(in oklab, ${color} 60%, transparent)`,
        }}
      >
        {pause ? (
          <Pause className="size-3 text-signal-ink" />
        ) : (
          <span className="size-2 rounded-full bg-signal-ink" />
        )}
      </span>
    )
  }
  if (state === 'past') {
    return (
      <span
        aria-hidden
        className="mt-0.5 grid size-5 place-items-center rounded-full"
        style={{ background: `color-mix(in oklab, ${color} 28%, transparent)` }}
      >
        <Check className="size-3 text-ink-2" strokeWidth={3} />
      </span>
    )
  }
  return (
    <span
      aria-hidden
      className={clsx(
        'mt-0.5 grid size-5 place-items-center rounded-full border-2',
        pause ? 'border-dashed border-line-strong' : 'border-line-strong',
      )}
    >
      {pause && <Pause className="size-2.5 text-muted" />}
    </span>
  )
}
