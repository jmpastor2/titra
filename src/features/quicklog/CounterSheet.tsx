import { Beef, Droplets, Minus, Plus, Trash2, Undo2, type LucideIcon } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'
import { Sheet } from '@/components/ui/Sheet'
import { ProgressRing } from '@/components/ui/primitives'
import type { MeasurementRow } from '@/data/database.types'
import { fmtDate, fmtNumber } from '@/lib/format'
import { useLocale } from '@/lib/useLocale'
import { NumberStepper } from './NumberStepper'
import type { DayCounter } from './quickData'
import { AmountChip, BlockLabel } from './SheetBits'
import { inRange, stepSpec } from './stepper'
import {
  clampGoal,
  fmtVolume,
  GOAL_MAX_ML,
  GOAL_MIN_ML,
  GOAL_STEP_ML,
  setWaterGoal,
  splitVolume,
  WATER_ADDS,
} from './water'

interface CounterProps {
  counter: DayCounter
  /** Adds an entry of this size; saved at once, so the totals move with the tap. */
  onAdd: (amount: number) => void
  onRemove: (row: MeasurementRow) => void
  onClose: () => void
}

interface Layout {
  title: string
  icon: LucideIcon
  goal: number | null
  adds: readonly number[]
  /** Unit of the chips and the entries: ml, g. */
  unit: string
  kind: 'hydration_ml' | 'protein_g'
  customDefault: number
  /** An amount as text with its unit: "250 ml", "1,25 L". */
  format: (amount: number) => string
  /** An amount as a number and its unit, for the middle of the ring. */
  split: (amount: number) => { value: string; unit: string }
  goalControl?: ReactNode
}

/** The shared body of the water and protein sheets: a gauge, one-tap amounts, today's list. */
function CounterSheet({
  title,
  icon: Icon,
  goal,
  adds,
  unit,
  kind,
  customDefault,
  format,
  split,
  goalControl,
  counter,
  onAdd,
  onRemove,
  onClose,
}: CounterProps & Layout) {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const spec = stepSpec(kind, false)
  const [custom, setCustom] = useState<number | null>(customDefault)
  const { total, entries } = counter
  const center = split(total)

  const status =
    goal === null
      ? t('quick.counter.noGoal')
      : total < goal
        ? t('quick.counter.left', { amount: format(goal - total) })
        : total === goal
          ? t('quick.counter.reached')
          : t('quick.counter.over', { amount: format(total - goal) })

  return (
    <Sheet
      open
      onClose={onClose}
      title={title}
      footer={
        <Button block size="lg" onClick={onClose}>
          {t('common.done')}
        </Button>
      }
    >
      <div className="flex flex-col gap-5 py-1">
        <div className="flex flex-col items-center gap-3">
          <ProgressRing
            fraction={goal ? total / goal : 0}
            size={156}
            stroke={11}
            color={goal !== null && total >= goal ? 'var(--ok)' : 'var(--signal)'}
          >
            <div className="text-center leading-none">
              <Icon className="mx-auto mb-1.5 size-4 text-muted" aria-hidden />
              <div className="readout text-[30px] font-semibold">
                {center.value}
                <span className="ml-1 text-[13px] font-medium text-muted">{center.unit}</span>
              </div>
              {goal !== null && (
                <div className="mt-1.5 text-[11.5px] text-muted">
                  {t('quick.counter.of', { goal: format(goal) })}
                </div>
              )}
            </div>
          </ProgressRing>
          <p className="text-[14px] font-medium text-ink-2">{status}</p>
        </div>

        <div className="flex gap-2.5">
          {adds.map((amount) => (
            <AmountChip
              key={amount}
              amount={amount}
              unit={unit}
              label={t('quick.counter.add', { amount: format(amount) })}
              tone="signal"
              onPress={() => onAdd(amount)}
            />
          ))}
        </div>

        <div>
          <BlockLabel>{t('quick.counter.other')}</BlockLabel>
          <div className="flex items-center gap-2">
            <div className="min-w-0 flex-1">
              <NumberStepper
                size="sm"
                value={custom}
                onChange={setCustom}
                spec={spec}
                unit={unit}
                label={t('quick.counter.other')}
                locale={locale}
              />
            </div>
            <Button
              size="md"
              variant="soft"
              disabled={custom === null || !inRange(spec, custom)}
              leading={<Plus className="size-4" />}
              onClick={() => custom !== null && onAdd(custom)}
            >
              {t('quick.counter.addButton')}
            </Button>
          </div>
        </div>

        {goalControl}

        <div>
          <BlockLabel>{t('quick.counter.today')}</BlockLabel>
          {entries.length === 0 ? (
            <p className="text-[13px] text-muted">{t('quick.counter.empty')}</p>
          ) : (
            <ul className="divide-y divide-line">
              {entries.map((row, index) => (
                <li key={row.id} className="flex items-center gap-3 py-0.5">
                  <span className="readout w-14 text-[13px] text-muted">
                    {fmtDate(new Date(row.measured_at), locale, 'HH:mm')}
                  </span>
                  <span className="readout flex-1 text-[15px] font-semibold">
                    +{fmtNumber(Number(row.value), locale, 0)}
                    <span className="ml-1 text-[11.5px] font-medium text-muted">{unit}</span>
                  </span>
                  {index === 0 ? (
                    // The last one added is the one to take back.
                    <button
                      type="button"
                      onClick={() => onRemove(row)}
                      className="flex h-11 items-center gap-1.5 rounded-full px-3 text-[13px] font-semibold text-signal"
                    >
                      <Undo2 className="size-3.5" aria-hidden />
                      {t('quick.counter.undo')}
                    </button>
                  ) : (
                    <button
                      type="button"
                      aria-label={t('quick.counter.remove', { what: format(Number(row.value)) })}
                      onClick={() => onRemove(row)}
                      className="grid size-11 place-items-center rounded-full text-muted hover:bg-danger-soft hover:text-danger"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      {/* The reading of the day for assistive tech; the ring is decoration. */}
      <span className="sr-only" aria-live="polite">
        {title}: {format(total)}. {status}
      </span>
    </Sheet>
  )
}

const moveGoal = (next: number) => setWaterGoal(clampGoal(next))

/** Goal in ml, kept on this device. */
function WaterGoalControl({ goal }: { goal: number }) {
  const { t } = useTranslation()
  const { locale } = useLocale()
  return (
    <div>
      <BlockLabel>{t('quick.water.goal')}</BlockLabel>
      <div className="flex items-center justify-between gap-3 rounded-control border border-line bg-panel-2 px-2 py-1.5">
        <button
          type="button"
          aria-label={t('quick.water.goalLess')}
          disabled={goal <= GOAL_MIN_ML}
          onClick={() => moveGoal(goal - GOAL_STEP_ML)}
          className="grid size-11 place-items-center rounded-full border border-line-strong bg-panel text-ink active:scale-95 disabled:opacity-40"
        >
          <Minus className="size-[18px]" />
        </button>
        <div className="text-center">
          <div className="readout text-[20px] font-semibold">{fmtVolume(goal, locale)}</div>
          <div className="text-[11.5px] text-muted">{t('quick.water.goalHint')}</div>
        </div>
        <button
          type="button"
          aria-label={t('quick.water.goalMore')}
          disabled={goal >= GOAL_MAX_ML}
          onClick={() => moveGoal(goal + GOAL_STEP_ML)}
          className="grid size-11 place-items-center rounded-full border border-line-strong bg-panel text-ink active:scale-95 disabled:opacity-40"
        >
          <Plus className="size-[18px]" />
        </button>
      </div>
    </div>
  )
}

export function WaterSheet(props: CounterProps & { goal: number }) {
  const { t } = useTranslation()
  const { locale } = useLocale()
  return (
    <CounterSheet
      {...props}
      title={t('quick.water.title')}
      icon={Droplets}
      kind="hydration_ml"
      unit="ml"
      adds={WATER_ADDS}
      customDefault={300}
      format={(ml) => fmtVolume(ml, locale)}
      split={(ml) => splitVolume(ml, locale)}
      goalControl={<WaterGoalControl goal={props.goal} />}
    />
  )
}

export function ProteinSheet({
  target,
  perKg,
  weightKg,
  ...props
}: CounterProps & {
  target: number | null
  /** g per kg from the profile, for the note under the gauge. */
  perKg: number
  weightKg: number | null
}) {
  const { t } = useTranslation()
  const { locale } = useLocale()
  return (
    <CounterSheet
      {...props}
      title={t('quick.protein.title')}
      icon={Beef}
      kind="protein_g"
      unit="g"
      goal={target}
      adds={[20, 30]}
      customDefault={25}
      format={(g) => `${fmtNumber(g, locale, 0)} g`}
      split={(g) => ({ value: fmtNumber(g, locale, 0), unit: 'g' })}
      goalControl={
        <p className="rounded-control border border-line bg-panel-2 px-3 py-2.5 text-[12.5px] leading-snug text-ink-2">
          {target !== null && weightKg !== null
            ? t('quick.protein.targetNote', {
                perKg: fmtNumber(perKg, locale, 1),
                kg: fmtNumber(weightKg, locale, 1),
              })
            : target !== null
              ? t('quick.protein.targetFromGoal', { perKg: fmtNumber(perKg, locale, 1) })
              : t('quick.protein.noTarget')}
        </p>
      }
    />
  )
}
