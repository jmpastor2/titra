import { describe, expect, it } from 'vitest'
import type { MeasurementKind, MeasurementRow } from '@/data/database.types'
import {
  checkInSummary,
  dayTotal,
  daysAgo,
  entriesOn,
  latestReading,
  recentValues,
  strengthWeek,
} from './readings'

let n = 0
const row = (kind: MeasurementKind, value: number, at: string, unit = 'x'): MeasurementRow => ({
  id: `m${++n}`,
  patient_id: 'u',
  measured_at: new Date(at).toISOString(),
  kind,
  value,
  unit,
  notes: null,
  source: 'manual',
  created_at: '',
})

const NOW = new Date('2026-10-05T14:30')

describe('latest reading', () => {
  const rows = [
    row('weight', 77.4, '2026-10-01T08:00'),
    row('weight', 77.0, '2026-10-03T08:00'),
    row('weight', 78.1, '2026-09-28T08:00'),
    row('waist', 91, '2026-09-25T08:00'),
  ]
  it('picks the newest of its kind and the one before it', () => {
    const w = latestReading(rows, 'weight')
    expect(w?.value).toBe(77)
    expect(w?.previous?.value).toBe(77.4)
    expect(latestReading(rows, 'waist')?.previous).toBeNull()
  })
  it('is null with nothing logged', () => {
    expect(latestReading(rows, 'hip')).toBeNull()
    expect(latestReading([], 'weight')).toBeNull()
  })
  it('lists the last values oldest first for a sparkline', () => {
    expect(recentValues(rows, 'weight', 2)).toEqual([77.4, 77])
    expect(recentValues(rows, 'weight', 10)).toEqual([78.1, 77.4, 77])
  })
  it('counts calendar days, not 24 h blocks', () => {
    expect(daysAgo(new Date('2026-10-05T00:05'), NOW)).toBe(0)
    expect(daysAgo(new Date('2026-10-04T23:55'), NOW)).toBe(1)
    expect(daysAgo(new Date('2026-10-02T20:00'), NOW)).toBe(3)
    expect(daysAgo(new Date('2026-10-06T09:00'), NOW)).toBe(0)
  })
})

describe('day totals', () => {
  const water = [
    row('hydration_ml', 250, '2026-10-05T08:10', 'ml'),
    row('hydration_ml', 500, '2026-10-05T11:40', 'ml'),
    row('hydration_ml', 250, '2026-10-04T23:50', 'ml'),
    row('hydration_ml', 250, '2026-10-06T00:05', 'ml'),
    row('protein_g', 30, '2026-10-05T09:00', 'g'),
  ]
  it('sums only the local calendar day of that kind', () => {
    expect(dayTotal(water, 'hydration_ml', NOW)).toBe(750)
    expect(dayTotal(water, 'hydration_ml', new Date('2026-10-04T12:00'))).toBe(250)
    expect(dayTotal(water, 'protein_g', NOW)).toBe(30)
    expect(dayTotal([], 'hydration_ml', NOW)).toBe(0)
  })
  it('lists the entries newest first, ready for "Deshacer"', () => {
    const today = entriesOn(water, 'hydration_ml', NOW)
    expect(today.map((r) => r.value)).toEqual([500, 250])
  })
  it('splits the day at local midnight', () => {
    const late = [row('hydration_ml', 250, '2026-10-05T23:59', 'ml')]
    expect(dayTotal(late, 'hydration_ml', new Date('2026-10-05T12:00'))).toBe(250)
    expect(dayTotal(late, 'hydration_ml', new Date('2026-10-06T00:01'))).toBe(0)
  })
})

describe('strength week', () => {
  const rows = [
    row('resistance_session', 45, '2026-10-04T19:00', 'min'),
    row('resistance_session', 1, '2026-10-01T19:00', 'session'),
    row('resistance_session', 60, '2026-09-27T19:00', 'min'),
  ]
  it('counts the last 7 days and remembers the latest session', () => {
    const w = strengthWeek(rows, NOW)
    expect(w.count).toBe(2)
    expect(w.last?.minutes).toBe(45)
  })
  it('reads a session without a duration as no minutes', () => {
    expect(strengthWeek([rows[1]!], NOW).last?.minutes).toBeNull()
  })
  it('is empty on a new account', () => {
    expect(strengthWeek([], NOW)).toEqual({ count: 0, last: null })
  })
})

describe('check-in summary', () => {
  const at = (day: string) => `2026-10-${day}T09:00`
  const checkIn = (day: string, energy: number, mood: number) => [
    row('energy', energy, at(day), 'score'),
    row('mood', mood, at(day), 'score'),
  ]
  it('is done today and counts the streak', () => {
    const c = checkInSummary(
      [...checkIn('05', 7, 8), ...checkIn('04', 6, 6), ...checkIn('03', 5, 5)],
      NOW,
    )
    expect(c.doneToday).toBe(true)
    expect(c.streak).toBe(3)
    expect(c.ageDays).toBe(0)
    expect(c.last).toEqual({ energy: 7, mood: 8 })
  })
  it('keeps the streak alive until today is over', () => {
    const c = checkInSummary([...checkIn('04', 6, 6), ...checkIn('03', 5, 5)], NOW)
    expect(c.doneToday).toBe(false)
    expect(c.streak).toBe(2)
    expect(c.ageDays).toBe(1)
  })
  it('takes the latest value of each dimension from different days', () => {
    const c = checkInSummary(
      [row('energy', 4, at('02'), 'score'), row('mood', 9, at('03'), 'score')],
      NOW,
    )
    expect(c.last).toEqual({ energy: 4, mood: 9 })
    expect(c.streak).toBe(0)
    expect(c.ageDays).toBe(2)
  })
  it('ignores rows that are not wellbeing scores', () => {
    const c = checkInSummary([row('weight', 77, at('05'), 'kg')], NOW)
    expect(c.doneToday).toBe(false)
    expect(c.ageDays).toBeNull()
    expect(c.lastAt).toBeNull()
  })
})
