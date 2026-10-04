import { beforeAll, describe, expect, it } from 'vitest'
import i18n from '@/i18n'
import type { TimelineItem } from './doseTimeline'
import { describeTimelineItem } from './timelineText'

const at = (d: number, h: number, m = 0) => new Date(2026, 9, d, h, m)

const item = (over: Partial<TimelineItem>): TimelineItem => ({
  key: 'k',
  state: 'taken',
  at: at(5, 1, 4),
  day: new Date(2026, 9, 4),
  plannedAt: at(5, 1),
  takenAt: at(5, 1, 4),
  doseMg: 0.1,
  plannedMg: 0.1,
  deltaMin: 4,
  partners: [{ compoundId: 'ipamorelin', mg: 0.1 }],
  stepIndex: 0,
  ...over,
})

beforeAll(async () => {
  await i18n.changeLanguage('es')
})

describe('describeTimelineItem', () => {
  const t = () => i18n.getFixedT('es')

  it('says when, what went in the syringe and that it was on time', () => {
    const d = describeTimelineItem(item({}), 'mcg', 'es', t())
    expect(d.when).toBe('lun 5 oct, 01:04')
    expect(d.dose).toBe('100 + 100 mcg')
    expect(d.status).toBe('A su hora')
    expect(d.plan).toBeNull()
  })

  it('says how far off a late or early dose was', () => {
    const late = describeTimelineItem(
      item({ state: 'late', deltaMin: 210, partners: [], doseMg: 1, plannedMg: 1 }),
      'mg',
      'es',
      t(),
    )
    expect(late.status).toBe('Tarde · +3 h 30')
    expect(late.dose).toBe('1 mg')
    const early = describeTimelineItem(item({ state: 'early', deltaMin: -40 }), 'mcg', 'es', t())
    expect(early.status).toBe('Adelantada · −40 min')
  })

  it('names what the plan asked for when the dose taken was different', () => {
    const d = describeTimelineItem(
      item({ doseMg: 0.08, plannedMg: 0.1, partners: [] }),
      'mcg',
      'es',
      t(),
    )
    expect(d.dose).toBe('80 mcg')
    expect(d.plan).toBe('pauta: 100 mcg')
  })

  it('reads an extra, a missed, a due and a planned administration', () => {
    const states = ['extra', 'missed', 'due', 'planned'] as const
    const texts = states.map(
      (state) =>
        describeTimelineItem(
          item({ state, takenAt: null, plannedAt: null, deltaMin: null, plannedMg: null }),
          'mcg',
          'es',
          t(),
        ).status,
    )
    expect(texts).toEqual(['Fuera de pauta', 'Perdida', 'Toca ahora', 'Prevista'])
  })

  it('reads in English, with each compound in its own unit', () => {
    const d = describeTimelineItem(
      item({ partners: [{ compoundId: 'ipamorelin', mg: 0.1 }] }),
      'mcg',
      'en',
      i18n.getFixedT('en'),
    )
    expect(d.when).toBe('Mon 5 Oct, 01:04')
    expect(d.dose).toBe('100 + 100 mcg')
    expect(d.status).toBe('On time')
  })
})
