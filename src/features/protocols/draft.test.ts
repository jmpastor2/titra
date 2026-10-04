import { describe, expect, it } from 'vitest'
import type { ScheduleStep, StackComponent } from '@/domain/types'
import {
  buildModel,
  componentsOf,
  convertField,
  doseField,
  draftFromParts,
  emptyDraft,
  fromThisWeekOffer,
  originOf,
  pastEdits,
  signature,
  stepRows,
  storedTimes,
  type ConcOf,
  type Draft,
  type StepDraft,
  blendPartnerMg,
  matchesBlend,
} from './draft'

const d = (iso: string) => new Date(iso)
const W15 = [1, 2, 3, 4, 5]

// The CJC/ipamorelin blend vial: 1.667 mg/mL of each, so 1 U = 16.7 mcg.
const BLEND = 5 / 3
const concOf: ConcOf = (id) => (id === 'mod-grf-1-29' || id === 'ipamorelin' ? BLEND : null)
const noVial: ConcOf = () => null

const CJC_STEPS: ScheduleStep[] = [
  { doseMg: 0.1, intervalDays: 1, weekdays: W15, durationWeeks: 1 },
  { doseMg: 0.15, intervalDays: 1, weekdays: W15, durationWeeks: 1 },
  { doseMg: 0.2, intervalDays: 1, weekdays: W15, durationWeeks: 10 },
  { doseMg: 0, intervalDays: 1, pause: true, durationWeeks: 4 },
]
const CJC_STACK: StackComponent[] = [{ compoundId: 'ipamorelin', doseMg: 0.1 }]

function cjcDraft(conc: ConcOf = concOf): Draft {
  return {
    ...emptyDraft(),
    ...draftFromParts('mod-grf-1-29', CJC_STEPS, CJC_STACK, ['25:00'], conc),
    name: 'CJC-1295 + Ipamorelina',
    startDate: '2026-09-21',
  }
}

const patchStep = (draft: Draft, index: number, patch: Partial<StepDraft>): Draft => ({
  ...draft,
  steps: draft.steps.map((s, i) => (i === index ? { ...s, ...patch } : s)),
})

describe('opening a protocol in the editor', () => {
  it('shows the doses in syringe units when the vial is known', () => {
    const draft = cjcDraft()
    expect(draft.doseEntry).toBe('units')
    expect(draft.steps.map((s) => s.dose)).toEqual(['6', '9', '12', ''])
    expect(draft.components).toMatchObject([
      { compoundId: 'ipamorelin', entry: 'units', dose: '6' },
    ])
    expect(draft.mode).toBe('weekdays')
    expect(draft.weekdays).toEqual(W15)
  })

  it('falls back to the compound unit without a vial', () => {
    const draft = cjcDraft(noVial)
    expect(draft.doseEntry).toBe('mcg')
    expect(draft.steps.map((s) => s.dose)).toEqual(['100', '150', '200', ''])
  })

  it('shows the night shot as clock time plus the night option', () => {
    const draft = cjcDraft()
    expect(draft.times).toEqual(['01:00'])
    expect(draft.nightShift).toBe(true)
    expect(storedTimes(draft)).toEqual(['25:00'])
    expect(storedTimes({ times: ['01:00', '09:00'], nightShift: false })).toEqual([
      '01:00',
      '09:00',
    ])
    expect(storedTimes({ times: ['03:30'], nightShift: true })).toEqual(['27:30'])
  })

  it('saves the same doses it opened with', () => {
    const draft = cjcDraft()
    expect(stepRows(draft, concOf).map((r) => r.step?.doseMg)).toEqual([0.1, 0.15, 0.2, 0])
    expect(componentsOf(draft, concOf)).toEqual(CJC_STACK)
  })

  it('does not change an untouched dose that units cannot write exactly', () => {
    // 0.1234567 mg is 7.41 U to the hundredth: saving without typing must keep the mg.
    const field = doseField(0.1234567, 'units', BLEND)
    expect(field.dose).toBe('7.41')
    const draft = patchStep(cjcDraft(), 0, field)
    expect(stepRows(draft, concOf)[0]?.step?.doseMg).toBe(0.1234567)
    // Typing something else uses what is typed.
    const typed = patchStep(draft, 0, { dose: '7.5' })
    expect(stepRows(typed, concOf)[0]?.step?.doseMg).toBe(0.125)
  })

  it('leaves out a row without a valid dose', () => {
    const draft = patchStep(cjcDraft(), 1, { dose: '' })
    expect(stepRows(draft, concOf).map((r) => r.step === null)).toEqual([false, true, false, false])
  })
})

describe('switching units in the form', () => {
  it('writes the same dose and keeps the exact mg through there and back', () => {
    const base = doseField(0.1234567, 'units', BLEND)
    const inMg = convertField({ ...base }, 'units', 'mg', BLEND)
    expect(inMg.dose).toBe('0.1235')
    const back = convertField(inMg, 'mg', 'units', BLEND)
    expect(back.dose).toBe('7.41')
    expect(back.exact?.mg).toBe(0.1234567)
  })

  it('leaves an empty or unconvertible field alone', () => {
    const empty = { dose: '', exact: undefined }
    expect(convertField(empty, 'units', 'mg', BLEND)).toBe(empty)
    const typed = { dose: '12', exact: undefined }
    expect(convertField(typed, 'mg', 'units', null)).toBe(typed)
  })

  it('is not an unsaved change', () => {
    const draft = cjcDraft()
    const model = buildModel(draft, {
      concOf,
      vials: [],
      now: d('2026-10-19T10:00'),
      origin: null,
      fromThisWeek: true,
    })
    const toMg: Draft = {
      ...draft,
      doseEntry: 'mg',
      steps: draft.steps.map((s) => (s.pause ? s : convertField(s, 'units', 'mg', BLEND))),
    }
    const other = buildModel(toMg, {
      concOf,
      vials: [],
      now: d('2026-10-19T10:00'),
      origin: null,
      fromThisWeek: true,
    })
    expect(signature(toMg, other)).toBe(signature(draft, model))
    const changed = patchStep(toMg, 2, { dose: '0.25' })
    const edited = buildModel(changed, {
      concOf,
      vials: [],
      now: d('2026-10-19T10:00'),
      origin: null,
      fromThisWeek: true,
    })
    expect(signature(changed, edited)).not.toBe(signature(draft, model))
  })
})

describe('the weeks already lived', () => {
  // Oct 19: week 3 of the ten-week step, which began on Oct 5.
  const now = d('2026-10-19T10:00')
  const open = () => {
    const draft = cjcDraft()
    const origin = originOf(
      { compoundId: 'mod-grf-1-29', startDate: '2026-09-21', times: ['25:00'], steps: CJC_STEPS },
      draft.steps.map((s) => s.key),
      now,
    )
    return { draft, origin }
  }

  it('tells past, current and future steps apart', () => {
    const { draft, origin } = open()
    const [a, b, c, e] = draft.steps.map((s) => s.key)
    expect([...origin.pastKeys]).toEqual([a, b])
    expect(origin.currentKey).toBe(c)
    expect(origin.weeksBehind).toBe(2)
    expect(origin.doseNowMg).toBe(0.2)
    const model = buildModel(draft, { concOf, vials: [], now, origin, fromThisWeek: true })
    expect(model.timeline.get(a!)?.state).toBe('past')
    expect(model.timeline.get(c!)).toMatchObject({ state: 'current', weekInStep: 3 })
    expect(model.timeline.get(e!)?.state).toBe('future')
    expect(model.timeline.get(c!)?.startsOn).toEqual(d('2026-10-05T00:00'))
  })

  it('flags edits to steps already over', () => {
    const { draft, origin } = open()
    const [a, b] = draft.steps.map((s) => s.key)
    expect(pastEdits(origin, stepRows(draft, concOf))).toEqual({ edited: new Map(), removed: 0 })

    const longer = patchStep(draft, 0, { weeks: '2' })
    expect(pastEdits(origin, stepRows(longer, concOf)).edited.get(a!)).toBe('weeks')

    const dose = patchStep(draft, 1, { dose: '10' })
    expect(pastEdits(origin, stepRows(dose, concOf)).edited.get(b!)).toBe('dose')

    const removed: Draft = { ...draft, steps: draft.steps.slice(1) }
    expect(pastEdits(origin, stepRows(removed, concOf)).removed).toBe(1)

    // Editing the step in force or a later one is not editing the past.
    const now3 = patchStep(draft, 2, { dose: '15', weeks: '8' })
    expect(pastEdits(origin, stepRows(now3, concOf)).edited.size).toBe(0)
  })

  it('offers to start a dose change this week, never rewriting the weeks behind', () => {
    const { draft, origin } = open()
    const changed = patchStep(draft, 2, { dose: '15' })
    const offer = fromThisWeekOffer(origin, stepRows(changed, concOf))
    expect(offer).toMatchObject({ weeksBehind: 2, fromMg: 0.2, toMg: 0.25 })

    const withIt = buildModel(changed, { concOf, vials: [], now, origin, fromThisWeek: true })
    expect(withIt.steps.map((s) => [s.doseMg, s.durationWeeks])).toEqual([
      [0.1, 1],
      [0.15, 1],
      [0.2, 2],
      [0.25, 8],
      [0, 4],
    ])
    // Same end, same next change; only the dose in force moves.
    expect(withIt.summary?.info.next?.on).toEqual(d('2026-12-14T00:00'))
    expect(withIt.summary?.info.step?.doseMg).toBe(0.25)

    const whole = buildModel(changed, { concOf, vials: [], now, origin, fromThisWeek: false })
    expect(whole.steps.map((s) => [s.doseMg, s.durationWeeks])).toEqual([
      [0.1, 1],
      [0.15, 1],
      [0.25, 10],
      [0, 4],
    ])
  })

  it('offers nothing for a change in the first week, a future step or a new protocol', () => {
    const { draft } = open()
    const early = originOf(
      { compoundId: 'mod-grf-1-29', startDate: '2026-09-21', times: ['25:00'], steps: CJC_STEPS },
      draft.steps.map((s) => s.key),
      d('2026-10-05T10:00'),
    )
    const changed = patchStep(draft, 2, { dose: '15' })
    expect(fromThisWeekOffer(early, stepRows(changed, concOf))).toBeNull()
    expect(fromThisWeekOffer(null, stepRows(changed, concOf))).toBeNull()

    const { origin } = open()
    // Changing the length of the step is not a dose change either.
    const longer = patchStep(draft, 2, { weeks: '12' })
    expect(fromThisWeekOffer(origin, stepRows(longer, concOf))).toBeNull()
  })

  it('moves the dates when the weeks of the step in force change', () => {
    const { draft, origin } = open()
    const model = buildModel(patchStep(draft, 2, { weeks: '12' }), {
      concOf,
      vials: [],
      now,
      origin,
      fromThisWeek: true,
    })
    expect(model.summary?.info.next).toMatchObject({ kind: 'rest', on: d('2026-12-28T00:00') })
  })
})

describe('the model of a plan being typed', () => {
  const now = d('2026-10-05T10:00')

  it('refuses an open-ended step in the middle and draws no timeline', () => {
    const draft = patchStep(cjcDraft(), 0, { weeks: '' })
    const model = buildModel(draft, { concOf, vials: [], now, origin: null, fromThisWeek: true })
    expect(model.openEndedInMiddle).toBe(true)
    expect(model.summary).toBeNull()
    expect(model.timeline.size).toBe(0)
  })

  it('has no plan while the start date is not a date', () => {
    const model = buildModel(
      { ...cjcDraft(), startDate: '' },
      {
        concOf,
        vials: [],
        now,
        origin: null,
        fromThisWeek: true,
      },
    )
    expect(model.plan).toBeNull()
    expect(model.summary).toBeNull()
  })

  it('dates every row of a new protocol from its start', () => {
    const draft = cjcDraft()
    const model = buildModel(draft, { concOf, vials: [], now, origin: null, fromThisWeek: true })
    expect(model.summary?.info).toMatchObject({ week: 3, phase: 'dosing' })
    const keys = draft.steps.map((s) => s.key)
    expect(model.timeline.get(keys[0]!)).toMatchObject({
      state: 'past',
      startsOn: d('2026-09-21T00:00'),
      endsOn: d('2026-09-28T00:00'),
    })
    expect(model.timeline.get(keys[2]!)?.state).toBe('current')
    expect(model.plan?.components).toEqual(CJC_STACK)
  })
})

describe('premixed blends', () => {
  it('gives a stack compound the same volume as the primary', () => {
    // Same concentration in the vial: the same mg.
    expect(blendPartnerMg(0.2, BLEND, BLEND)).toBe(0.2)
    // A partner twice as concentrated comes out at twice the mg for the same volume.
    expect(blendPartnerMg(0.1, BLEND, BLEND * 2)).toBe(0.2)
    expect(blendPartnerMg(0.1, null, BLEND)).toBeNull()
    expect(blendPartnerMg(0, BLEND, BLEND)).toBeNull()
  })

  it('tells when a stack dose does not fill the same volume', () => {
    expect(matchesBlend(0.1, BLEND, 0.1, BLEND)).toBe(true)
    expect(matchesBlend(0.1, BLEND, 0.105, BLEND)).toBe(true) // 6.3 U vs 6 U: within half a unit
    expect(matchesBlend(0.2, BLEND, 0.1, BLEND)).toBe(false) // 12 U vs 6 U
  })
})
