/**
 * The protocol editor's form model and the logic behind it: what is typed becomes steps
 * (the dose in syringe units, mg or mcg), steps that already happened are told apart from
 * those to come, editing the past is flagged, and a dose change on the step in force can
 * start this week without touching the weeks behind. Pure; see draft.test.ts.
 */
import { isValid, parseISO, startOfDay } from 'date-fns'
import { compoundById } from '@/content/compounds'
import type { InventoryRow } from '@/data/database.types'
import { cycleInfo } from '@/domain/dosing/cycle'
import { mgToUnits } from '@/domain/dosing/reconstitution'
import { normaliseTimes, splitNightTime } from '@/domain/dosing/schedule'
import type { DoseUnit, ProtocolLike, ScheduleStep, StackComponent } from '@/domain/types'
import { toDateInputValue } from '@/lib/format'
import {
  defaultEntry,
  entryToMg,
  formatAmount,
  mgToEntry,
  parseAmount,
  type DoseEntry,
} from './doseUnits'
import { cycleSummary, type CycleSummary } from './cycleView'
import { canSplitAt, splitStep } from './stepChange'

export type ScheduleMode = 'interval' | 'weekdays'

/** Monday-first week, as both locales expect (0 = Sunday). */
export const WEEK: readonly number[] = [1, 2, 3, 4, 5, 6, 0]

/** The exact mg behind a typed dose, kept while the text is untouched so nothing drifts. */
export interface Exact {
  text: string
  entry: DoseEntry
  mg: number
}

export interface StepDraft {
  key: number
  pause: boolean
  dose: string
  weeks: string
  label: string
  exact?: Exact
}

export interface ComponentDraft {
  key: number
  compoundId: string
  /** The dose for the first dosing step; later steps follow it in proportion. */
  dose: string
  entry: DoseEntry
  exact?: Exact
}

export interface Draft {
  templateRef: string
  compoundId: string
  /** How the dose of every step of the primary compound is typed. */
  doseEntry: DoseEntry
  components: ComponentDraft[]
  name: string
  startDate: string
  mode: ScheduleMode
  intervalDays: string
  weekdays: number[]
  times: string[]
  steps: StepDraft[]
  notes: string
  saveAsTemplate: boolean
  /** Small-hours times (before 06:00) belong to the evening before, e.g. a 01:00 night shot. */
  nightShift: boolean
}

/** mg/mL of a compound in the vial it is drawn from, or null when it has no reconstituted vial. */
export type ConcOf = (compoundId: string) => number | null

let seq = 0
export const nextKey = () => ++seq

const round6 = (n: number) => Math.round(n * 1e6) / 1e6

export const unitOf = (compoundId: string): DoseUnit =>
  compoundById(compoundId)?.defaultUnit ?? 'mg'

/* ------------------------------------------------------------------ typed doses */

function typedMg(
  text: string,
  entry: DoseEntry,
  exact: Exact | undefined,
  conc: number | null,
): number | null {
  if (exact && exact.text === text && exact.entry === entry) return exact.mg
  return entryToMg(parseAmount(text), entry, conc)
}

/** The mg behind a typed dose field (a step or a stack compound); null while it is empty or invalid. */
export function fieldMg(
  field: { dose: string; exact?: Exact },
  entry: DoseEntry,
  conc: number | null,
): number | null {
  return typedMg(field.dose, entry, field.exact, conc)
}

/** A stored dose as the text of an input, remembering the exact mg behind it. */
export function doseField(
  mg: number,
  entry: DoseEntry,
  conc: number | null,
): { dose: string; exact: Exact } {
  const text = formatAmount(mgToEntry(mg, entry, conc) ?? mg, entry)
  return { dose: text, exact: { text, entry, mg } }
}

/** The same dose after switching entries; as typed when it cannot be converted. */
export function convertField<T extends { dose: string; exact?: Exact }>(
  field: T,
  from: DoseEntry,
  to: DoseEntry,
  conc: number | null,
): T {
  const mg = typedMg(field.dose, from, field.exact, conc)
  const amount = mg === null ? null : mgToEntry(mg, to, conc)
  if (mg === null || amount === null) return field
  const text = formatAmount(amount, to)
  return { ...field, dose: text, exact: { text, entry: to, mg } }
}

/* ------------------------------------------------------------------ building a draft */

export function draftFromParts(
  compoundId: string,
  steps: readonly ScheduleStep[],
  components: readonly StackComponent[],
  times: readonly string[],
  concOf: ConcOf,
): Pick<
  Draft,
  | 'compoundId'
  | 'doseEntry'
  | 'steps'
  | 'components'
  | 'times'
  | 'mode'
  | 'intervalDays'
  | 'weekdays'
  | 'nightShift'
> {
  const conc = concOf(compoundId)
  const entry = defaultEntry(unitOf(compoundId), conc)
  const firstDose = steps.find((s) => !s.pause)
  const mode: ScheduleMode = firstDose?.weekdays?.length ? 'weekdays' : 'interval'
  const stored = normaliseTimes(times)
  return {
    compoundId,
    doseEntry: entry,
    mode,
    intervalDays: String(firstDose?.intervalDays ?? 7),
    weekdays: firstDose?.weekdays ?? [1, 2, 3, 4, 5],
    // The editor shows clock times; "25:00" comes back as 01:00 with the night option on.
    times: stored.map((x) => splitNightTime(x).clock),
    nightShift: stored.some((x) => splitNightTime(x).nextDay),
    steps: steps.map((s) => ({
      key: nextKey(),
      pause: Boolean(s.pause),
      weeks: s.durationWeeks === null ? '' : String(s.durationWeeks),
      label: s.label ?? '',
      ...(s.pause ? { dose: '' } : doseField(s.doseMg, entry, conc)),
    })),
    components: components.map((c) => {
      const cConc = concOf(c.compoundId)
      const cEntry = defaultEntry(unitOf(c.compoundId), cConc)
      return {
        key: nextKey(),
        compoundId: c.compoundId,
        entry: cEntry,
        ...doseField(c.doseMg, cEntry, cConc),
      }
    }),
  }
}

export function emptyDraft(): Draft {
  return {
    templateRef: '',
    compoundId: '',
    doseEntry: 'mg',
    components: [],
    name: '',
    startDate: toDateInputValue(new Date()),
    mode: 'interval',
    intervalDays: '7',
    weekdays: [1, 2, 3, 4, 5],
    times: ['09:00'],
    steps: [{ key: nextKey(), pause: false, dose: '', weeks: '', label: '' }],
    notes: '',
    saveAsTemplate: false,
    nightShift: false,
  }
}

/* ------------------------------------------------------------------ typed → steps */

export interface StepRow {
  key: number
  /** Null while the row has no valid dose: it is left out of the plan. */
  step: ScheduleStep | null
}

/** One row per typed step, in the units it was typed in. */
export function stepRows(draft: Draft, concOf: ConcOf): StepRow[] {
  const interval = parseAmount(draft.intervalDays)
  const conc = concOf(draft.compoundId)
  return draft.steps.map((s): StepRow => {
    const weeks = s.weeks.trim() === '' ? null : parseAmount(s.weeks)
    const durationWeeks = weeks !== null && weeks > 0 ? weeks : null
    const label = s.label.trim() ? { label: s.label.trim() } : {}
    if (s.pause) {
      return {
        key: s.key,
        step: { doseMg: 0, intervalDays: 1, pause: true, durationWeeks, ...label },
      }
    }
    const mg = typedMg(s.dose, draft.doseEntry, s.exact, conc)
    if (mg === null) return { key: s.key, step: null }
    return {
      key: s.key,
      step: {
        doseMg: mg,
        intervalDays: draft.mode === 'interval' && interval > 0 ? interval : 1,
        ...(draft.mode === 'weekdays' ? { weekdays: draft.weekdays.toSorted() } : {}),
        durationWeeks,
        ...label,
      },
    }
  })
}

/** The stack, each dose in mg as typed for the first dosing step. */
export function componentsOf(draft: Draft, concOf: ConcOf): StackComponent[] {
  return draft.components.flatMap((c) => {
    const mg = typedMg(c.dose, c.entry, c.exact, concOf(c.compoundId))
    return mg === null ? [] : [{ compoundId: c.compoundId, doseMg: mg }]
  })
}

/** Stored times: with the night option, 00:00–05:59 become 24:00–29:59 of the day before. */
export function storedTimes(draft: Pick<Draft, 'times' | 'nightShift'>): string[] {
  return normaliseTimes(
    draft.times.map((x) => {
      const [h = 0, m = 0] = x.split(':').map(Number)
      return draft.nightShift && h < 6 ? `${h + 24}:${String(m).padStart(2, '0')}` : x
    }),
  )
}

/* ------------------------------------------------------------------ what already happened */

export type RowState = 'past' | 'current' | 'future'

export interface RowTime {
  startsOn: Date
  /** Exclusive; null for an open-ended step. */
  endsOn: Date | null
  state: RowState
  /** 1-based week of the step in force; null for the others. */
  weekInStep: number | null
}

/** Where each valid row sits in time, by its key. */
function rowTimes(rows: readonly StepRow[], startDate: string, now: Date): Map<number, RowTime> {
  const out = new Map<number, RowTime>()
  const valid = rows.flatMap((r) => (r.step ? [{ key: r.key, step: r.step }] : []))
  if (!isValid(parseISO(startDate)) || valid.length === 0) return out
  const info = cycleInfo(
    { compoundId: '', startDate, steps: valid.map((v) => v.step), times: ['09:00'] },
    now,
  )
  if (!info) return out
  const today = startOfDay(now)
  valid.forEach((v, i) => {
    const w = info.steps[i]
    if (!w) return
    const state: RowState =
      info.step?.index === i
        ? 'current'
        : w.endsOn !== null && w.endsOn <= today
          ? 'past'
          : 'future'
    out.set(v.key, {
      startsOn: w.startsOn,
      endsOn: w.endsOn,
      state,
      weekInStep: state === 'current' ? info.weekInStep : null,
    })
  })
  return out
}

/** The plan of a protocol being edited, as it was when the editor opened. */
export interface Origin {
  startDate: string
  rows: { key: number; step: ScheduleStep }[]
  /** The row whose step is in force today. */
  currentKey: number | null
  /** Rows whose step is over. */
  pastKeys: ReadonlySet<number>
  /** Whole weeks of the step in force already lived. */
  weeksBehind: number
  /** The primary dose in force today in mg. */
  doseNowMg: number | null
}

export function originOf(protocol: ProtocolLike, keys: readonly number[], now: Date): Origin {
  const rows = protocol.steps.flatMap((step, i) => {
    const key = keys[i]
    return key === undefined ? [] : [{ key, step }]
  })
  const times = rowTimes(rows, protocol.startDate, now)
  const current = rows.find((r) => times.get(r.key)?.state === 'current')
  return {
    startDate: protocol.startDate,
    rows,
    currentKey: current?.key ?? null,
    pastKeys: new Set(rows.filter((r) => times.get(r.key)?.state === 'past').map((r) => r.key)),
    weeksBehind: current ? (times.get(current.key)?.weekInStep ?? 1) - 1 : 0,
    doseNowMg: current && !current.step.pause ? current.step.doseMg : null,
  }
}

export type PastEdit = 'weeks' | 'dose'

export interface PastEdits {
  /** Steps already over whose weeks or dose were changed, by row key. */
  edited: Map<number, PastEdit>
  /** Steps already over that were taken out. */
  removed: number
}

const sameMg = (a: number, b: number) => Math.abs(a - b) < 1e-9

/** What was changed in the weeks already lived: it moves later dates or rewrites the plan. */
export function pastEdits(origin: Origin, rows: readonly StepRow[]): PastEdits {
  const edited = new Map<number, PastEdit>()
  let removed = 0
  for (const o of origin.rows) {
    if (!origin.pastKeys.has(o.key)) continue
    const step = rows.find((r) => r.key === o.key)?.step
    if (!step) removed++
    else if (
      (step.durationWeeks ?? null) !== (o.step.durationWeeks ?? null) ||
      Boolean(step.pause) !== Boolean(o.step.pause)
    ) {
      edited.set(o.key, 'weeks')
    } else if (!sameMg(step.doseMg, o.step.doseMg)) edited.set(o.key, 'dose')
  }
  return { edited, removed }
}

/* ------------------------------------------------------------------ from this week */

/** A dose change on the step in force that can start this week. */
export interface FromThisWeek {
  key: number
  weeksBehind: number
  fromMg: number
  toMg: number
}

export function fromThisWeekOffer(
  origin: Origin | null,
  rows: readonly StepRow[],
): FromThisWeek | null {
  if (!origin || origin.currentKey === null) return null
  const was = origin.rows.find((r) => r.key === origin.currentKey)?.step
  const edited = rows.find((r) => r.key === origin.currentKey)?.step
  if (!was || !edited || was.pause || edited.pause || sameMg(was.doseMg, edited.doseMg)) return null
  if (!canSplitAt(edited, origin.weeksBehind)) return null
  return {
    key: origin.currentKey,
    weeksBehind: origin.weeksBehind,
    fromMg: was.doseMg,
    toMg: edited.doseMg,
  }
}

/** The steps to save: the typed ones, with the step in force cut in two when asked to. */
export function savedSteps(
  rows: readonly StepRow[],
  offer: FromThisWeek | null,
  apply: boolean,
): ScheduleStep[] {
  return rows.flatMap((r) => {
    if (!r.step) return []
    if (offer && apply && r.key === offer.key)
      return splitStep(r.step, offer.weeksBehind, offer.fromMg)
    return [r.step]
  })
}

/* ------------------------------------------------------------------ the whole model */

export interface ModelInput {
  concOf: ConcOf
  /** The vials, to read the plan in syringe units. */
  vials: readonly InventoryRow[]
  now: Date
  /** The plan as it was when the editor opened; null for a new protocol. */
  origin: Origin | null
  /** Start a dose change of the step in force this week (the default). */
  fromThisWeek: boolean
}

export interface PlanModel {
  rows: StepRow[]
  /** Steps as saved: the typed ones, the step in force split if the dose starts this week. */
  steps: ScheduleStep[]
  components: StackComponent[]
  times: string[]
  /** The protocol as saved; null while the start date is not a date or no step is valid. */
  plan: ProtocolLike | null
  /** Where that plan stands today: week, dose, next change. Null when there is no plan to read. */
  summary: CycleSummary | null
  /** Each row's dates and state, by key (the split is not a row). */
  timeline: Map<number, RowTime>
  offer: FromThisWeek | null
  past: PastEdits
  /** The dose of the step in force was typed over directly (not moved by editing the past). */
  currentDoseEdited: boolean
  /** Only the last step can be open-ended. */
  openEndedInMiddle: boolean
}

export function buildModel(draft: Draft, input: ModelInput): PlanModel {
  const rows = stepRows(draft, input.concOf)
  const typed = rows.flatMap((r) => (r.step ? [r.step] : []))
  const offer = fromThisWeekOffer(input.origin, rows)
  const steps = savedSteps(rows, offer, input.fromThisWeek)
  const components = componentsOf(draft, input.concOf)
  const times = storedTimes(draft)
  const openEndedInMiddle = typed.slice(0, -1).some((s) => s.durationWeeks === null)
  const plan: ProtocolLike | null =
    steps.length > 0 && isValid(parseISO(draft.startDate))
      ? { compoundId: draft.compoundId, startDate: draft.startDate, steps, times, components }
      : null
  return {
    rows,
    steps,
    components,
    times,
    plan,
    summary: plan && !openEndedInMiddle ? cycleSummary(plan, input.vials, input.now) : null,
    timeline: openEndedInMiddle ? new Map() : rowTimes(rows, draft.startDate, input.now),
    offer,
    past: input.origin ? pastEdits(input.origin, rows) : { edited: new Map(), removed: 0 },
    currentDoseEdited: currentDoseEdited(input.origin, rows),
    openEndedInMiddle,
  }
}

function currentDoseEdited(origin: Origin | null, rows: readonly StepRow[]): boolean {
  if (!origin || origin.currentKey === null) return false
  const was = origin.rows.find((r) => r.key === origin.currentKey)?.step
  const now = rows.find((r) => r.key === origin.currentKey)?.step
  return Boolean(was && now && !was.pause && !now.pause && !sameMg(was.doseMg, now.doseMg))
}

/**
 * What the form means, ignoring how it is typed: switching U to mg changes nothing, so it
 * does not count as an unsaved change.
 */
export function signature(draft: Draft, model: Pick<PlanModel, 'rows' | 'components' | 'times'>) {
  return JSON.stringify([
    draft.compoundId,
    draft.name.trim(),
    draft.startDate,
    draft.notes.trim(),
    draft.saveAsTemplate,
    model.rows.map((r) => r.step),
    model.components,
    model.times,
  ])
}

/* ------------------------------------------------------------------ blends */

/**
 * The dose of a stack compound that fills the same syringe volume as the primary: what a
 * premixed vial gives by nature. Null when either concentration is unknown.
 */
export function blendPartnerMg(
  primaryMg: number,
  primaryConc: number | null,
  partnerConc: number | null,
): number | null {
  if (!primaryConc || !partnerConc || !(primaryMg > 0)) return null
  return round6(primaryMg * (partnerConc / primaryConc))
}

/** Whether a stack dose pulls the same volume as the primary's (within half a unit). */
export function matchesBlend(
  primaryMg: number,
  primaryConc: number,
  partnerMg: number,
  partnerConc: number,
): boolean {
  return Math.abs(mgToUnits(partnerMg, partnerConc) - mgToUnits(primaryMg, primaryConc)) <= 0.5
}
