import { addDays } from 'date-fns'
import { describe, expect, it } from 'vitest'
import { OUTLOOK, type TrialOutlook } from '@/content/outlook'
import type { ProtocolLike } from '@/domain/types'
import {
  asCompoundProtocol,
  bandAt,
  bandInKg,
  bandSeries,
  chartWeeks,
  dateAtTreatmentWeeks,
  doseAt,
  isProjection,
  nextTimepoint,
  personalTrend,
  pickTimepoint,
  projectTrend,
  referenceForHorizon,
  treatmentWeeks,
  trendOnTreatmentAxis,
  weightPoints,
} from './outlook'

const RETA = (OUTLOOK.retatrutide as TrialOutlook).reference
const [TP24, TP48] = RETA.timepoints as [
  (typeof RETA.timepoints)[number],
  (typeof RETA.timepoints)[number],
]

/** The user's retatrutide plan: 1 mg × 2 weeks, then +0.25 mg a week up to 2.5 mg. */
const reta: ProtocolLike = {
  compoundId: 'retatrutide',
  startDate: '2026-09-07',
  times: ['09:00'],
  steps: [
    { doseMg: 1, intervalDays: 7, durationWeeks: 2 },
    { doseMg: 1.25, intervalDays: 7, durationWeeks: 1 },
    { doseMg: 1.5, intervalDays: 7, durationWeeks: 1 },
    { doseMg: 1.75, intervalDays: 7, durationWeeks: 1 },
    { doseMg: 2, intervalDays: 7, durationWeeks: 1 },
    { doseMg: 2.25, intervalDays: 7, durationWeeks: 1 },
    { doseMg: 2.5, intervalDays: 7, durationWeeks: null },
  ],
}

/** CJC + ipamorelin: 12 weeks on, 4 off. */
const cycle: ProtocolLike = {
  compoundId: 'mod-grf-1-29',
  startDate: '2026-09-07',
  times: ['22:00'],
  steps: [
    { doseMg: 0.1, intervalDays: 1, weekdays: [1, 2, 3, 4, 5], durationWeeks: 12 },
    { doseMg: 0, intervalDays: 1, pause: true, durationWeeks: 4 },
  ],
}

const start = new Date(2026, 8, 7)

describe('evidence data', () => {
  it('holds the published retatrutide phase 2 means', () => {
    expect(TP24.week).toBe(24)
    expect(TP24.placeboPct).toBe(-1.6)
    expect(TP24.arms.map((a) => [a.doseMg, a.meanPct])).toEqual([
      [1, -7.2],
      [4, -12.9],
      [8, -17.3],
      [12, -17.5],
    ])
    expect(TP48.placeboPct).toBe(-2.1)
    expect(TP48.arms.map((a) => [a.doseMg, a.meanPct])).toEqual([
      [1, -8.7],
      [4, -17.1],
      [8, -22.8],
      [12, -24.2],
    ])
  })

  it('has no human outcome figures for the other compounds', () => {
    for (const id of ['mots-c', 'mod-grf-1-29', 'ipamorelin', 'nad-plus', 'ghk-cu', 'bpc-157']) {
      expect(OUTLOOK[id]?.kind).toBe('no_human_data')
      expect(OUTLOOK[id]?.measure.length).toBeGreaterThan(0)
    }
  })
})

describe('treatment time', () => {
  it('counts calendar weeks from the start on a continuous protocol', () => {
    expect(treatmentWeeks(reta, start)).toBe(0)
    expect(treatmentWeeks(reta, addDays(start, -10))).toBe(0)
    expect(treatmentWeeks(reta, addDays(start, 7 * 24))).toBeCloseTo(24, 5)
  })

  it('skips pause weeks and stops after a finite protocol ends', () => {
    expect(treatmentWeeks(cycle, addDays(start, 7 * 14))).toBeCloseTo(12, 5)
    expect(treatmentWeeks(cycle, addDays(start, 7 * 40))).toBeCloseTo(12, 5)
    expect(dateAtTreatmentWeeks(cycle, 13)).toBeNull()
    expect(dateAtTreatmentWeeks(reta, 24)?.getTime()).toBe(addDays(start, 168).getTime())
  })

  it('reads the dose in effect, the last one during a pause and the first before the start', () => {
    expect(doseAt(reta, addDays(start, 3))).toBe(1)
    expect(doseAt(reta, addDays(start, 15))).toBe(1.25)
    expect(doseAt(reta, addDays(start, 7 * 30))).toBe(2.5)
    expect(doseAt(reta, addDays(start, -5))).toBe(1)
    expect(doseAt(cycle, addDays(start, 7 * 13))).toBe(0.1)
  })
})

describe('stack components', () => {
  it('scales a component dose with the titration', () => {
    const blend: ProtocolLike = {
      ...cycle,
      steps: [
        { doseMg: 0.1, intervalDays: 1, durationWeeks: 1 },
        { doseMg: 0.15, intervalDays: 1, durationWeeks: 11 },
      ],
      components: [{ compoundId: 'ipamorelin', doseMg: 0.1 }],
    }
    const ipa = asCompoundProtocol(blend, 'ipamorelin')!
    expect(ipa.compoundId).toBe('ipamorelin')
    expect(ipa.steps.map((s) => s.doseMg)).toEqual([0.1, 0.15])
    expect(asCompoundProtocol(blend, 'mod-grf-1-29')).toBe(blend)
    expect(asCompoundProtocol(blend, 'bpc-157')).toBeNull()
  })
})

describe('reference band', () => {
  it('picks the latest published time point reached', () => {
    expect(pickTimepoint(RETA.timepoints, 13)).toBeNull()
    expect(pickTimepoint(RETA.timepoints, 24)?.week).toBe(24)
    expect(pickTimepoint(RETA.timepoints, 47.9)?.week).toBe(24)
    expect(pickTimepoint(RETA.timepoints, 60)?.week).toBe(48)
    expect(nextTimepoint(RETA.timepoints, 13)?.week).toBe(24)
    expect(nextTimepoint(RETA.timepoints, 48)).toBeNull()
  })

  it('brackets 2.5 mg between the 1 mg and 4 mg arms', () => {
    const b = bandAt(TP48, 2.5)
    expect(b).toMatchObject({
      position: 'between',
      lowerDoseMg: 1,
      upperDoseMg: 4,
      lowerPct: -8.7,
      upperPct: -17.1,
    })
  })

  it('collapses on an exact arm, uses placebo below and caps above the studied range', () => {
    expect(bandAt(TP24, 4)).toMatchObject({ position: 'exact', lowerPct: -12.9, upperPct: -12.9 })
    expect(bandAt(TP24, 0.5)).toMatchObject({
      position: 'below',
      lowerDoseMg: 0,
      lowerPct: -1.6,
      upperPct: -7.2,
    })
    expect(bandAt(TP48, 15)).toMatchObject({ position: 'above', upperDoseMg: 12, upperPct: -24.2 })
    expect(bandAt(TP48, 0)).toBeNull()
  })

  it('resolves each horizon from the protocol start', () => {
    const now = addDays(start, 21) // week 3, on 1.5 mg
    const h3 = referenceForHorizon(reta, RETA, now, 3)
    expect(h3.band).toBeNull()
    expect(h3.next?.timepoint.week).toBe(24)
    expect(h3.next?.date?.getTime()).toBe(addDays(start, 168).getTime())

    const h6 = referenceForHorizon(reta, RETA, now, 6)
    expect(h6.weeksAtTarget).toBeGreaterThan(24)
    expect(h6.doseMg).toBe(2.5)
    expect(h6.band).toMatchObject({ week: 24, lowerPct: -7.2, upperPct: -12.9 })

    const h12 = referenceForHorizon(reta, RETA, now, 12)
    expect(h12.band).toMatchObject({ week: 48, lowerPct: -8.7, upperPct: -17.1 })
    expect(h12.next).toBeNull()
  })

  it('builds the band over time from the origin and the published points only', () => {
    const s = bandSeries(RETA, 2.5)
    expect(s.map((p) => p.week)).toEqual([0, 24, 48])
    expect(s[0]).toMatchObject({ lowerPct: 0, upperPct: 0, observed: false })
    expect(s[2]).toMatchObject({ lowerPct: -8.7, upperPct: -17.1, observed: true })
  })

  it('applies a band to a body weight', () => {
    const kg = bandInKg(100, { lowerPct: -8.7, upperPct: -17.1 })
    expect(kg.lowerKg).toBeCloseTo(-8.7, 6)
    expect(kg.upperKg).toBeCloseTo(-17.1, 6)
  })
})

describe('personal trend', () => {
  const rows = [
    { kind: 'weight', measured_at: addDays(start, -3).toISOString(), value: 100 },
    { kind: 'waist', measured_at: addDays(start, 1).toISOString(), value: 95 },
    { kind: 'weight', measured_at: addDays(start, 7).toISOString(), value: 99 },
    { kind: 'weight', measured_at: addDays(start, 14).toISOString(), value: 98 },
    { kind: 'weight', measured_at: addDays(start, 21).toISOString(), value: 97 },
    { kind: 'weight', measured_at: addDays(start, 30).toISOString(), value: Number.NaN },
  ]
  const points = weightPoints(rows)
  const now = addDays(start, 22)

  it('keeps valid weight readings only, oldest first', () => {
    expect(points.map((p) => p.kg)).toEqual([100, 99, 98, 97])
  })

  it('uses a weigh-in just before the start as the baseline and fits a line', () => {
    const tr = personalTrend(points, start, now)!
    expect(tr.baseline.kg).toBe(100)
    expect(tr.latest.kg).toBe(97)
    expect(tr.changePct).toBeCloseTo(-3, 6)
    expect(tr.fit?.kgPerWeek).toBeCloseTo(-0.875, 1)
  })

  it('ignores a weigh-in more than two weeks before the start', () => {
    const old = [{ at: addDays(start, -20), kg: 110 }, ...points.slice(1)]
    expect(personalTrend(old, start, now)?.baseline.kg).toBe(99)
  })

  it('needs three readings over two weeks before drawing a line', () => {
    const tr = personalTrend(points.slice(0, 2), start, now)!
    expect(tr.fit).toBeNull()
    expect(projectTrend(tr, addDays(now, 30))).toEqual({ none: 'need_more' })
    expect(projectTrend(null, now)).toEqual({ none: 'no_data' })
    expect(personalTrend([], start, now)).toBeNull()
  })

  it('flags long extrapolations and withholds very long ones', () => {
    const tr = personalTrend(points, start, now)!
    // 24 days of data: up to 48 days ahead is ok, up to 96 is weak, beyond is withheld.
    const near = projectTrend(tr, addDays(tr.latest.at, 30))
    expect(isProjection(near) && near.reliability).toBe('ok')
    expect(isProjection(near) && near.deltaKg).toBeLessThan(-3)
    const far = projectTrend(tr, addDays(tr.latest.at, 80))
    expect(isProjection(far) && far.reliability).toBe('weak')
    expect(projectTrend(tr, addDays(tr.latest.at, 120))).toEqual({ none: 'too_far' })
  })

  it('places readings on the treatment-week axis as % change', () => {
    const tr = personalTrend(points, start, now)!
    const axis = trendOnTreatmentAxis(tr, reta)
    expect(axis[0]).toEqual({ week: 0, pct: 0 })
    expect(axis[3]?.week).toBeCloseTo(3, 5)
    expect(axis[3]?.pct).toBeCloseTo(-3, 6)
  })

  it('rounds the chart axis up to 12-week blocks', () => {
    expect(chartWeeks(48, 3)).toBe(48)
    expect(chartWeeks(48, 52.1)).toBe(60)
    expect(chartWeeks()).toBe(12)
  })
})
