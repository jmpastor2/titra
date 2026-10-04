import { describe, expect, it } from 'vitest'
import { cycleInfo } from '@/domain/dosing/cycle'
import type { ProtocolLike, ScheduleStep } from '@/domain/types'
import {
  applyStepAction,
  changeRows,
  currentStepIndex,
  describeChange,
  previewAction,
  scaleStack,
  setDoseFromThisWeek,
  withEdit,
} from './stepChange'

const d = (iso: string) => new Date(iso)
const W15 = [1, 2, 3, 4, 5]

// 6 → 9 → 12 U of the CJC/ipamorelin blend for ten weeks, then four weeks of rest.
const CJC_STEPS: ScheduleStep[] = [
  { doseMg: 0.1, intervalDays: 1, weekdays: W15, durationWeeks: 1 },
  { doseMg: 0.15, intervalDays: 1, weekdays: W15, durationWeeks: 1 },
  { doseMg: 0.2, intervalDays: 1, weekdays: W15, durationWeeks: 10 },
  { doseMg: 0, intervalDays: 1, pause: true, durationWeeks: 4 },
]
const CJC: ProtocolLike = {
  compoundId: 'mod-grf-1-29',
  startDate: '2026-09-21',
  times: ['25:00'],
  steps: CJC_STEPS,
  components: [{ compoundId: 'ipamorelin', doseMg: 0.1 }],
}
const RETA: ProtocolLike = {
  compoundId: 'retatrutide',
  startDate: '2026-09-07',
  times: ['09:00'],
  steps: [
    { doseMg: 1, intervalDays: 1, weekdays: [1], durationWeeks: 2 },
    { doseMg: 1.25, intervalDays: 1, weekdays: [1], durationWeeks: 1 },
    { doseMg: 2.5, intervalDays: 1, weekdays: [1], durationWeeks: null },
  ],
}

describe('currentStepIndex', () => {
  const at = (iso: string, protocol: ProtocolLike = CJC) =>
    currentStepIndex(cycleInfo(protocol, d(iso)))

  it('finds the step in force', () => {
    expect(at('2026-10-04T10:00')).toBe(1)
    expect(at('2026-10-05T10:00')).toBe(2)
    expect(at('2026-12-20T10:00')).toBe(3)
  })

  it('is null before the start, after the end and without steps', () => {
    expect(at('2026-09-14T10:00')).toBeNull()
    expect(at('2027-02-01T10:00')).toBeNull()
    expect(at('2026-10-04T10:00', { ...CJC, steps: [] })).toBeNull()
  })
})

describe('hold and move up', () => {
  it('holds the step in force one more week', () => {
    const edit = applyStepAction(CJC, d('2026-10-04T20:30'), { kind: 'hold' })!
    expect(edit.steps.map((s) => s.durationWeeks)).toEqual([1, 2, 10, 4])
    expect(edit.components).toEqual(CJC.components)
    // The input is untouched: undo needs it.
    expect(CJC.steps[1]!.durationWeeks).toBe(1)
  })

  it('can also hold a rest', () => {
    const edit = applyStepAction(CJC, d('2026-12-16T10:00'), { kind: 'hold' })!
    expect(edit.steps.map((s) => s.durationWeeks)).toEqual([1, 1, 10, 5])
  })

  it('moves up a week sooner, never below one', () => {
    const edit = applyStepAction(CJC, d('2026-10-05T10:00'), { kind: 'moveUp' })!
    expect(edit.steps.map((s) => s.durationWeeks)).toEqual([1, 1, 9, 4])
    expect(applyStepAction(CJC, d('2026-10-04T10:00'), { kind: 'moveUp' })).toBeNull()
  })

  it('does not apply without a step in force or an end to move', () => {
    expect(applyStepAction(CJC, d('2026-09-14T10:00'), { kind: 'hold' })).toBeNull()
    expect(applyStepAction(CJC, d('2027-02-01T10:00'), { kind: 'hold' })).toBeNull()
    expect(applyStepAction(RETA, d('2026-11-30T10:00'), { kind: 'hold' })).toBeNull()
    expect(applyStepAction(RETA, d('2026-11-30T10:00'), { kind: 'moveUp' })).toBeNull()
  })
})

describe('changing the dose of the step in force', () => {
  it('leaves the weeks already lived at the old dose', () => {
    // Week 3 of the ten-week step (Oct 19): two weeks behind.
    const edit = applyStepAction(CJC, d('2026-10-19T10:00'), { kind: 'setDose', doseMg: 0.25 })!
    expect(edit.steps.map((s) => [s.doseMg, s.durationWeeks])).toEqual([
      [0.1, 1],
      [0.15, 1],
      [0.2, 2],
      [0.25, 8],
      [0, 4],
    ])
    expect(edit.steps[3]!.weekdays).toEqual(W15)
    // The stack scales from the first dosing step, which did not change.
    expect(edit.components).toEqual(CJC.components)
  })

  it('splits an open-ended step too', () => {
    const edit = applyStepAction(RETA, d('2026-10-12T10:00'), { kind: 'setDose', doseMg: 2 })!
    // Oct 12 is the third week of the open step, which began on Sep 28.
    expect(edit.steps.map((s) => [s.doseMg, s.durationWeeks])).toEqual([
      [1, 2],
      [1.25, 1],
      [2.5, 2],
      [2, null],
    ])
  })

  it('is a plain change in the first week of the step', () => {
    const edit = applyStepAction(CJC, d('2026-10-05T10:00'), { kind: 'setDose', doseMg: 0.25 })!
    expect(edit.steps.map((s) => [s.doseMg, s.durationWeeks])).toEqual([
      [0.1, 1],
      [0.15, 1],
      [0.25, 10],
      [0, 4],
    ])
    expect(edit.components).toEqual(CJC.components)
  })

  it('keeps the blend proportion when the first dosing step changes', () => {
    const edit = applyStepAction(CJC, d('2026-09-23T10:00'), { kind: 'setDose', doseMg: 0.12 })!
    expect(edit.steps[0]!.doseMg).toBe(0.12)
    expect(edit.components).toEqual([{ compoundId: 'ipamorelin', doseMg: 0.12 }])
  })

  it('is not a change when the dose is the same, empty or in a rest', () => {
    expect(applyStepAction(CJC, d('2026-10-05T10:00'), { kind: 'setDose', doseMg: 0.2 })).toBeNull()
    expect(applyStepAction(CJC, d('2026-10-05T10:00'), { kind: 'setDose', doseMg: 0 })).toBeNull()
    expect(applyStepAction(CJC, d('2026-12-20T10:00'), { kind: 'setDose', doseMg: 0.2 })).toBeNull()
  })

  it('splits only when there is something behind', () => {
    expect(setDoseFromThisWeek(CJC_STEPS, 2, 0, 0.25)[2]!.doseMg).toBe(0.25)
    expect(setDoseFromThisWeek(CJC_STEPS, 2, 0, 0.25)).toHaveLength(4)
    expect(setDoseFromThisWeek(CJC_STEPS, 2, 3, 0.25)).toHaveLength(5)
    // A pause has no dose to change.
    expect(setDoseFromThisWeek(CJC_STEPS, 3, 1, 0.25)).toEqual(CJC_STEPS)
  })

  it('scales a stack without float noise', () => {
    expect(scaleStack([{ compoundId: 'ipamorelin', doseMg: 0.1 }], 1.2)).toEqual([
      { compoundId: 'ipamorelin', doseMg: 0.12 },
    ])
  })
})

describe('describing a change', () => {
  it('holding the Sunday before a step-up moves the next change a week', () => {
    const now = d('2026-10-04T20:30')
    const edit = applyStepAction(CJC, now, { kind: 'hold' })!
    const s = describeChange(CJC, withEdit(CJC, edit), now)!
    expect(s.next.before).toMatchObject({ kind: 'increase', on: d('2026-10-05T00:00') })
    expect(s.next.after).toMatchObject({ kind: 'increase', on: d('2026-10-12T00:00') })
    expect(s.end).toEqual({ before: d('2027-01-11T00:00'), after: d('2027-01-18T00:00') })
    expect(s.totalWeeks).toEqual({ before: 16, after: 17 })
    expect(s.doseNow).toEqual({ before: 0.15, after: 0.15 })
    expect(s.shifted.map((x) => [x.index, x.pause])).toEqual([
      [2, false],
      [3, true],
    ])
    expect(s.shifted[0]).toMatchObject({ from: d('2026-10-05T00:00'), to: d('2026-10-12T00:00') })
  })

  it('moving up shifts everything a week earlier', () => {
    const now = d('2026-10-05T10:00')
    const edit = applyStepAction(CJC, now, { kind: 'moveUp' })!
    const s = describeChange(CJC, withEdit(CJC, edit), now)!
    expect(s.next.before?.on).toEqual(d('2026-12-14T00:00'))
    expect(s.next.after?.on).toEqual(d('2026-12-07T00:00'))
    expect(s.totalWeeks).toEqual({ before: 16, after: 15 })
  })

  it('moving up in the last week of a step starts the next one today', () => {
    // Week 2 of the first two-week step: one week shorter means it is already over.
    const now = d('2026-09-16T10:00')
    const edit = applyStepAction(RETA, now, { kind: 'moveUp' })!
    const s = describeChange(RETA, withEdit(RETA, edit), now)!
    expect(s.doseNow).toEqual({ before: 1, after: 1.25 })
  })

  it('changing the dose from this week moves no dates', () => {
    const now = d('2026-10-19T10:00')
    const edit = applyStepAction(CJC, now, { kind: 'setDose', doseMg: 0.25 })!
    const s = describeChange(CJC, withEdit(CJC, edit), now)!
    expect(s.doseNow).toEqual({ before: 0.2, after: 0.25 })
    expect(s.shifted).toEqual([])
    expect(s.end.before).toEqual(s.end.after)
    expect(s.next.before?.on).toEqual(s.next.after?.on)
  })

  it('is null for a plan without steps', () => {
    expect(describeChange({ ...CJC, steps: [] }, CJC, d('2026-10-04T10:00'))).toBeNull()
  })
})

describe('what a sheet shows', () => {
  it('lists only what a hold moves', () => {
    const now = d('2026-10-04T20:30')
    const p = previewAction(CJC, now, { kind: 'hold' })!
    expect(changeRows(p.summary)).toEqual([
      { kind: 'next', before: d('2026-10-05T00:00'), after: d('2026-10-12T00:00') },
      { kind: 'end', before: d('2027-01-11T00:00'), after: d('2027-01-18T00:00') },
      { kind: 'weeks', before: 16, after: 17 },
    ])
  })

  it('shows the dose that changes today and nothing else for a dose change', () => {
    const now = d('2026-10-19T10:00')
    const p = previewAction(CJC, now, { kind: 'setDose', doseMg: 0.25 })!
    expect(changeRows(p.summary)).toEqual([{ kind: 'dose', before: 0.2, after: 0.25 }])
  })

  it('shows the dose when moving up starts the next step now', () => {
    const now = d('2026-09-16T10:00')
    const p = previewAction(RETA, now, { kind: 'moveUp' })!
    // The step after it also ends on Sep 21, so only the dose in force today moves.
    expect(changeRows(p.summary)).toEqual([{ kind: 'dose', before: 1, after: 1.25 }])
  })

  it('has no preview for what does not apply', () => {
    expect(previewAction(CJC, d('2026-09-14T10:00'), { kind: 'hold' })).toBeNull()
  })
})
