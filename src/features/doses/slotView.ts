/**
 * What "Cuenta para" offers: where a dose lands by itself, the planned administrations
 * nobody covers (a late dose or an "extra" can make one up) and what each choice does to
 * the plan. View-model of `slotChoices` (src/domain/dosing/assign.ts), no wording: the
 * component turns it into text. Pure; see slotView.test.ts.
 */
import { isSameDay } from 'date-fns'
import type { SlotChoices } from '@/domain/dosing/assign'
import { ownerDay, type PlannedDose } from '@/domain/dosing/schedule'
import { toTimeInputValue } from '@/lib/format'

/**
 * - auto: the dose lands on a planned administration by its time.
 * - extra: it matches none and counts as an extra.
 * - missed: it is assigned to a planned administration nobody covers.
 * - current: it is already assigned to this one (editing).
 */
export type SlotOptionKind = 'auto' | 'extra' | 'missed' | 'current'

export type SlotOption =
  | { key: string; kind: 'extra'; slot: null; plannedAt: null; recommended: false }
  | { key: string; kind: 'auto'; slot: PlannedDose; plannedAt: null; recommended: false }
  | {
      key: string
      kind: 'missed' | 'current'
      slot: PlannedDose
      /** Saved as `planned_at`. */
      plannedAt: Date
      recommended: boolean
    }

export interface SlotView {
  /** The first one is where the dose lands without help: the automatic slot, or an extra. */
  options: [SlotOption, ...SlotOption[]]
  /** What is selected until the person chooses. */
  defaultKey: string
}

const ms = (d: { at: Date }) => d.at.getTime()

/** The most recent missed administration before the dose: what a late make-up stands for. */
export function makeUpSlot(missed: readonly PlannedDose[], doseAt: Date): PlannedDose | null {
  return (
    missed.filter((m) => ms(m) <= doseAt.getTime()).toSorted((a, b) => ms(b) - ms(a))[0] ?? null
  )
}

/**
 * The administration a stray dose most plausibly stands for: the make-up's, else, for a
 * dose taken ahead of time, the closest missed one after it.
 */
export function suggestSlot(missed: readonly PlannedDose[], doseAt: Date): PlannedDose | null {
  return makeUpSlot(missed, doseAt) ?? missed.toSorted((a, b) => ms(a) - ms(b))[0] ?? null
}

export interface SlotViewInput {
  choices: SlotChoices
  doseAt: Date
  /** Editing: the administration the dose is assigned to now (null = none). Omit when logging. */
  current?: Date | null
  /** Logging: the planned time the person came to log. */
  preferred?: Date | null
  /** Finds the planned administration at a time the choices do not list (an old assignment). */
  lookup?: (when: Date) => PlannedDose | null
}

export function buildSlotView({
  choices,
  doseAt,
  current,
  preferred,
  lookup,
}: SlotViewInput): SlotView {
  const { auto } = choices
  const preferredMs = preferred?.getTime()
  // Logging a dose that already lands on a planned administration by its time: the older
  // missed ones are not on offer (a second dose, landing on nothing, is the make-up), unless
  // the person came to log one of them.
  const missed =
    auto && current === undefined && !choices.missed.some((m) => ms(m) === preferredMs)
      ? []
      : choices.missed
  // A dose that matches nothing and comes after a missed administration is a make-up.
  const makeUp = auto ? null : makeUpSlot(missed, doseAt)
  const head: SlotOption = auto
    ? { key: 'auto', kind: 'auto', slot: auto, plannedAt: null, recommended: false }
    : { key: 'extra', kind: 'extra', slot: null, plannedAt: null, recommended: false }

  const currentMs = current?.getTime()
  const slots: Extract<SlotOption, { plannedAt: Date }>[] = missed.map((slot) => ({
    key: slot.at.toISOString(),
    kind: ms(slot) === currentMs ? 'current' : 'missed',
    slot,
    plannedAt: slot.at,
    recommended: slot === makeUp,
  }))
  // The one this dose covers may be missing from the choices (still inside its grace window,
  // older than the lookback, no longer in the schedule): keep it selectable.
  if (current && currentMs !== auto?.at.getTime() && !slots.some((o) => o.kind === 'current')) {
    const slot = lookup?.(current) ?? { at: current, doseMg: 0, stepIndex: 0 }
    slots.push({
      key: slot.at.toISOString(),
      kind: 'current',
      slot,
      plannedAt: slot.at,
      recommended: false,
    })
    slots.sort((a, b) => ms(b.slot) - ms(a.slot))
  }

  return {
    options: [head, ...slots],
    defaultKey: defaultKeyOf(head, slots, auto, current, preferred),
  }
}

function defaultKeyOf(
  head: SlotOption,
  slots: readonly Extract<SlotOption, { plannedAt: Date }>[],
  auto: PlannedDose | null,
  current: Date | null | undefined,
  preferred: Date | null | undefined,
): string {
  if (current !== undefined) {
    // Editing keeps what the dose already is; a recommendation is only a hint.
    return slots.find((o) => o.kind === 'current')?.key ?? head.key
  }
  if (preferred) {
    if (auto && ms(auto) === preferred.getTime()) return head.key
    const wanted = slots.find((o) => ms(o.slot) === preferred.getTime())
    if (wanted) return wanted.key
  }
  return slots.find((o) => o.recommended)?.key ?? head.key
}

/** What is selected: the person's choice while it is still on offer, else the default. */
export function selectedOption(view: SlotView, choice: string | null): SlotOption {
  const byKey = (key: string | null) => view.options.find((o) => o.key === key)
  return byKey(choice) ?? byKey(view.defaultKey) ?? view.options[0]
}

export type Consequence =
  /** Covers nothing: an extra. Adherence does not change. */
  | { kind: 'extra' }
  /** Lands on a planned administration by its time. */
  | { kind: 'auto'; slot: PlannedDose; deltaMin: number }
  /** Makes up a missed administration: it goes from missed to taken. */
  | { kind: 'makeUp'; slot: PlannedDose; deltaMin: number }
  /** Already counts as that administration; nothing changes. */
  | { kind: 'same'; slot: PlannedDose; deltaMin: number }

/** What choosing this option does to the plan, for the one-line consequence. */
export function consequenceOf(option: SlotOption, doseAt: Date): Consequence {
  if (option.kind === 'extra') return { kind: 'extra' }
  const deltaMin = Math.round((doseAt.getTime() - ms(option.slot)) / 60_000)
  const kind = option.kind === 'missed' ? 'makeUp' : option.kind === 'current' ? 'same' : 'auto'
  return { kind, slot: option.slot, deltaMin }
}

export interface SlotParts {
  /** The day the administration belongs to: the evening before for a night slot. */
  day: Date
  /** "01:00". */
  clock: string
  /** Taken after midnight: it reads as the evening it belongs to. */
  night: boolean
}

export function slotParts(slot: Pick<PlannedDose, 'at' | 'day'>): SlotParts {
  const day = ownerDay(slot)
  return { day, clock: toTimeInputValue(slot.at), night: !isSameDay(day, slot.at) }
}
