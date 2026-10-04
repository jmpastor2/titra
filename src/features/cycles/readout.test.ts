import { describe, expect, it } from 'vitest'
import { cycleInfo } from '@/domain/dosing/cycle'
import { toProtocolLike } from '@/data/mappers'
import { cjc, mots, reta } from './fixtures'
import { buildCycleViews } from './model'
import {
  doseProgress,
  remaining,
  stepWeeks,
  summaryLines,
  titrationWeeks,
  weekReadout,
} from './readout'

const d = (iso: string) => new Date(iso)
const info = (row: Parameters<typeof toProtocolLike>[0], now: string) =>
  cycleInfo(toProtocolLike(row), d(now))!

describe('weekReadout', () => {
  it('reads "week N of M" in dosing weeks', () => {
    expect(weekReadout(info(cjc(), '2026-10-04T10:00'), d('2026-10-04T10:00'))).toEqual({
      kind: 'dosing',
      week: 2,
      of: 12,
    })
  })

  it('counts the titration weeks of a plan that ends in maintenance', () => {
    expect(weekReadout(info(reta(), '2026-10-05T10:00'), d('2026-10-05T10:00'))).toEqual({
      kind: 'dosing',
      week: 4,
      of: 5,
    })
    expect(weekReadout(info(reta(), '2026-11-30T10:00'), d('2026-11-30T10:00'))).toEqual({
      kind: 'maintenance',
      week: 12,
    })
  })

  it('counts the days left of a rest, and of nothing before the start', () => {
    const now = d('2026-12-16T10:00') // Sep 21 + 12 weeks = Dec 14: rest, ends Jan 11
    expect(weekReadout(info(cjc(), '2026-12-16T10:00'), now)).toEqual({
      kind: 'rest',
      daysLeft: 26,
    })
    const before = d('2026-09-14T10:00')
    expect(weekReadout(info(cjc(), '2026-09-14T10:00'), before)).toEqual({
      kind: 'before',
      days: 7,
    })
  })

  it('knows a plan that is over', () => {
    expect(weekReadout(info(cjc(), '2027-02-01T10:00'), d('2027-02-01T10:00'))).toEqual({
      kind: 'finished',
    })
  })

  it('has no end date for a rest without a length', () => {
    const open = cjc({
      steps: [
        { doseMg: 0.1, intervalDays: 1, durationWeeks: 2 },
        { doseMg: 0, intervalDays: 1, pause: true, durationWeeks: null },
      ],
    })
    expect(weekReadout(info(open, '2026-10-12T10:00'), d('2026-10-12T10:00'))).toEqual({
      kind: 'rest',
      daysLeft: null,
    })
  })
})

describe('titrationWeeks', () => {
  it('adds the finite dosing steps and is null without any', () => {
    expect(titrationWeeks(info(reta(), '2026-10-04T10:00'))).toBe(5)
    expect(titrationWeeks({ steps: [] })).toBeNull()
  })
})

describe('stepWeeks', () => {
  it('numbers dosing weeks only: a rest has none and an open step no end', () => {
    expect(stepWeeks(info(cjc(), '2026-10-04T10:00').steps)).toEqual([
      { from: 1, to: 1 },
      { from: 2, to: 2 },
      { from: 3, to: 12 },
      { from: null, to: null },
    ])
    expect(stepWeeks(info(mots(), '2026-10-04T10:00').steps)).toEqual([
      { from: 1, to: 4 },
      { from: 5, to: null },
    ])
  })
})

describe('doseProgress', () => {
  it('is the share of dosing days behind us, rest not counting', () => {
    expect(doseProgress(info(cjc(), '2026-09-21T10:00'), d('2026-09-21T10:00'))).toBe(0)
    // Two weeks in of 12 dosing weeks.
    expect(doseProgress(info(cjc(), '2026-10-05T10:00'), d('2026-10-05T10:00'))).toBeCloseTo(
      14 / 84,
    )
    // All dosing done, resting.
    expect(doseProgress(info(cjc(), '2026-12-16T10:00'), d('2026-12-16T10:00'))).toBe(1)
  })

  it('fills with the titration of a plan that ends in maintenance', () => {
    expect(doseProgress(info(reta(), '2026-10-05T10:00'), d('2026-10-05T10:00'))).toBeCloseTo(
      21 / 35,
    )
    expect(doseProgress(info(reta(), '2026-12-01T10:00'), d('2026-12-01T10:00'))).toBe(1)
  })

  it('is empty before the start', () => {
    expect(doseProgress(info(cjc(), '2026-09-01T10:00'), d('2026-09-01T10:00'))).toBe(0)
  })
})

describe('remaining', () => {
  it('counts weeks above seven days and days below', () => {
    expect(remaining(26)).toEqual({ unit: 'weeks', count: 4 })
    expect(remaining(8)).toEqual({ unit: 'weeks', count: 2 })
    expect(remaining(7)).toEqual({ unit: 'days', count: 7 })
    expect(remaining(1)).toEqual({ unit: 'days', count: 1 })
    expect(remaining(-2)).toEqual({ unit: 'days', count: 0 })
  })
})

describe('summaryLines', () => {
  it('has one line per active protocol, with where it stands and what comes next', () => {
    const now = d('2026-10-05T10:00')
    const views = buildCycleViews([cjc(), reta(), mots({ status: 'paused' })], now)
    const lines = summaryLines(views, now)
    expect(lines.map((l) => l.name)).toEqual(['Retatrutida', 'CJC-1295 + Ipamorelina'])
    expect(lines[0]!.readout).toEqual({ kind: 'dosing', week: 4, of: 5 })
    expect(lines[0]!.next).toMatchObject({ kind: 'increase', doseMg: 1.75, daysAway: 7 })
    expect(lines[1]!.readout).toEqual({ kind: 'dosing', week: 3, of: 12 })
    expect(lines[1]!.compoundIds).toEqual(['mod-grf-1-29', 'ipamorelin'])
  })
})
