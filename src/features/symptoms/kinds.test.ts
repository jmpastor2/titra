import { describe, expect, it } from 'vitest'
import type { SymptomKind } from '@/data/database.types'
import { habitualKinds, lastDaySymptoms, levelOf, severityOf, severityTone } from './kinds'

const row = (kind: SymptomKind, severity: number, at: string) => ({
  kind,
  severity,
  occurred_at: new Date(at).toISOString(),
})

describe('severity levels', () => {
  it('maps the five picker levels onto the stored 0 to 10 scale and back', () => {
    expect([1, 2, 3, 4, 5].map(severityOf)).toEqual([2, 4, 6, 8, 10])
    expect([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(levelOf)).toEqual([
      1, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5,
    ])
    for (const level of [1, 2, 3, 4, 5]) expect(levelOf(severityOf(level))).toBe(level)
  })
  it('keeps the existing tone thresholds meaningful for the stored values', () => {
    expect(severityTone(severityOf(1))).toBe('ok')
    expect(severityTone(severityOf(2))).toBe('warn')
    expect(severityTone(severityOf(3))).toBe('warn')
    expect(severityTone(severityOf(4))).toBe('danger')
    expect(severityTone(severityOf(5))).toBe('danger')
  })
})

describe('habitual symptoms', () => {
  it('offers the common ones before there is any history', () => {
    expect(habitualKinds([])).toEqual(['nausea', 'constipation', 'reflux', 'fatigue', 'headache'])
  })
  it('puts the most frequent of the person first and pads with the common ones', () => {
    const rows = [
      row('bloating', 3, '2026-10-01T10:00'),
      row('bloating', 4, '2026-10-02T10:00'),
      row('bloating', 2, '2026-10-03T10:00'),
      row('dizziness', 5, '2026-10-03T10:00'),
      row('dizziness', 5, '2026-10-04T10:00'),
      row('hair_loss', 1, '2026-10-04T10:00'),
    ]
    expect(habitualKinds(rows)).toEqual([
      'bloating',
      'dizziness',
      'hair_loss',
      'nausea',
      'constipation',
    ])
  })
  it('breaks ties by the usual order', () => {
    const rows = [row('fatigue', 3, '2026-10-01T10:00'), row('nausea', 3, '2026-10-02T10:00')]
    expect(habitualKinds(rows, 2)).toEqual(['nausea', 'fatigue'])
  })
})

describe('same as yesterday', () => {
  const now = new Date('2026-10-05T09:00')
  it('takes yesterday at the worst of each symptom, worst first', () => {
    const rows = [
      row('nausea', 4, '2026-10-04T09:00'),
      row('nausea', 6, '2026-10-04T21:00'),
      row('headache', 2, '2026-10-04T12:00'),
      row('fatigue', 8, '2026-10-02T12:00'),
      row('reflux', 3, '2026-10-05T08:00'),
    ]
    expect(lastDaySymptoms(rows, now)).toEqual({
      daysAgo: 1,
      items: [
        { kind: 'nausea', severity: 6 },
        { kind: 'headache', severity: 2 },
      ],
    })
  })
  it('falls back to the last day with symptoms in the last three days', () => {
    expect(lastDaySymptoms([row('fatigue', 8, '2026-10-02T12:00')], now)?.daysAgo).toBe(3)
  })
  it('ignores today and anything older than that', () => {
    expect(lastDaySymptoms([row('reflux', 3, '2026-10-05T08:00')], now)).toBeNull()
    expect(lastDaySymptoms([row('fatigue', 8, '2026-09-30T12:00')], now)).toBeNull()
    expect(lastDaySymptoms([], now)).toBeNull()
  })
})
