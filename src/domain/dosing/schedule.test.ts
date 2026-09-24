import { describe, expect, it } from 'vitest'
import type { DoseEvent, ProtocolLike } from '../types'
import {
  adherence,
  atTimeOfDay,
  currentStep,
  nextDose,
  plannedDoses,
  referenceRegimen,
  scheduledDoses,
  stepWindows,
  titrationStatus,
} from './schedule'

/** Wegovy-style escalation. */
const WEGOVY: ProtocolLike = {
  compoundId: 'semaglutide',
  startDate: '2026-01-05',
  times: ['08:00'],
  steps: [
    { doseMg: 0.25, intervalDays: 7, durationWeeks: 4 },
    { doseMg: 0.5, intervalDays: 7, durationWeeks: 4 },
    { doseMg: 1.0, intervalDays: 7, durationWeeks: 4 },
    { doseMg: 1.7, intervalDays: 7, durationWeeks: 4 },
    { doseMg: 2.4, intervalDays: 7, durationWeeks: null },
  ],
}

const d = (iso: string) => new Date(iso)

describe('stepWindows / currentStep', () => {
  it('chains steps and leaves maintenance open-ended', () => {
    const ws = stepWindows(WEGOVY)
    expect(ws).toHaveLength(5)
    expect(ws[0]!.start).toEqual(atTimeOfDay(d('2026-01-05T00:00'), '00:00'))
    expect(ws[1]!.start.getTime()).toBe(ws[0]!.end!.getTime())
    expect(ws[4]!.end).toBeNull()
  })

  it('finds the active step', () => {
    expect(currentStep(WEGOVY, d('2026-01-04T12:00'))).toBeNull()
    expect(currentStep(WEGOVY, d('2026-01-20T12:00'))!.index).toBe(0)
    expect(currentStep(WEGOVY, d('2026-02-02T12:00'))!.index).toBe(1)
    expect(currentStep(WEGOVY, d('2027-06-01T12:00'))!.index).toBe(4)
  })
})

describe('scheduledDoses', () => {
  it('produces 4 weekly doses per 4-week step at the preferred time', () => {
    const doses = scheduledDoses(WEGOVY, d('2026-01-01T00:00'), d('2026-02-02T00:00'))
    expect(doses).toHaveLength(4)
    expect(doses[0]!.at.getHours()).toBe(8)
    expect(doses.every((x) => x.doseMg === 0.25)).toBe(true)
  })

  it('switches dose at step boundaries', () => {
    const doses = scheduledDoses(WEGOVY, d('2026-01-01T00:00'), d('2026-03-02T00:00'))
    expect(doses.map((x) => x.doseMg)).toEqual([0.25, 0.25, 0.25, 0.25, 0.5, 0.5, 0.5, 0.5])
  })
})

describe('plannedDoses (anchored to last actual dose)', () => {
  it('projects from the last shot, using the dose of the step active at that time', () => {
    const history: DoseEvent[] = [{ at: d('2026-01-30T20:00'), mg: 0.25 }] // late Friday shot
    const planned = plannedDoses(WEGOVY, history, d('2026-01-31T00:00'), d('2026-02-28T00:00'))
    expect(planned[0]!.at).toEqual(d('2026-02-06T20:00'))
    // Feb 6 falls in step 1 (starts Feb 2) → 0.5 mg
    expect(planned[0]!.doseMg).toBe(0.5)
  })

  it('falls back to calendar when there is no history', () => {
    const planned = plannedDoses(WEGOVY, [], d('2026-01-01T00:00'), d('2026-01-20T00:00'))
    expect(planned).toHaveLength(3) // Jan 5, 12, 19 at 08:00
  })
})

describe('nextDose', () => {
  it('is upcoming, due or overdue depending on now', () => {
    const history: DoseEvent[] = [{ at: d('2026-01-12T08:00'), mg: 0.25 }]
    expect(nextDose(WEGOVY, history, d('2026-01-15T08:00'))!.status).toBe('upcoming')
    expect(nextDose(WEGOVY, history, d('2026-01-19T09:00'))!.status).toBe('due')
    const late = nextDose(WEGOVY, history, d('2026-01-21T09:00'))!
    expect(late.status).toBe('overdue')
    expect(late.overdueH).toBeCloseTo(49, 5)
    expect(late.at).toEqual(d('2026-01-19T08:00'))
  })

  it('with no history the first dose is the protocol start', () => {
    const n = nextDose(WEGOVY, [], d('2026-01-01T00:00'))!
    expect(n.at).toEqual(d('2026-01-05T08:00'))
    expect(n.doseMg).toBe(0.25)
  })
})

describe('adherence', () => {
  it('counts taken vs expected over the window, clamped at 1', () => {
    const history: DoseEvent[] = [
      { at: d('2026-01-05T08:00'), mg: 0.25 },
      { at: d('2026-01-12T08:00'), mg: 0.25 },
      // missed Jan 19
      { at: d('2026-01-26T08:00'), mg: 0.25 },
    ]
    const a = adherence(WEGOVY, history, d('2026-01-27T00:00'))
    expect(a.expected).toBe(4)
    expect(a.taken).toBe(3)
    expect(a.ratio).toBeCloseTo(0.75)
  })

  it('is 1 when nothing was expected yet', () => {
    expect(adherence(WEGOVY, [], d('2026-01-02T00:00')).ratio).toBe(1)
  })
})

describe('titrationStatus / referenceRegimen', () => {
  it('describes the current step and the next escalation', () => {
    const s = titrationStatus(WEGOVY, d('2026-01-20T10:00'))!
    expect(s.stepIndex).toBe(0)
    expect(s.doseMg).toBe(0.25)
    expect(s.nextDoseMg).toBe(0.5)
    expect(s.daysInStep).toBe(15)
    expect(s.daysToNextStep).toBe(13)
    expect(s.isMaintenance).toBe(false)
  })

  it('maintenance has no next step', () => {
    const s = titrationStatus(WEGOVY, d('2026-12-01T10:00'))!
    expect(s.isMaintenance).toBe(true)
    expect(s.daysToNextStep).toBeNull()
    expect(referenceRegimen(WEGOVY, d('2026-12-01T10:00'))).toEqual({
      doseMg: 2.4,
      intervalH: 168,
    })
  })
})
