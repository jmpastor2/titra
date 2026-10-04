import { describe, expect, it } from 'vitest'
import i18n from '@/i18n'
import { agoLabel, agoParts, fmtFixed } from './text'

describe('fmtFixed', () => {
  it('keeps the digits so a reading does not change width', () => {
    expect(fmtFixed(77, 'es', 1)).toBe('77,0')
    expect(fmtFixed(77.25, 'en', 1)).toBe('77.3')
    expect(fmtFixed(8500, 'es', 0)).toBe('8500')
  })
})

describe('agoParts', () => {
  it('says it in the unit a person would', () => {
    expect(agoParts(0)).toEqual({ unit: 'today', count: 0 })
    expect(agoParts(1)).toEqual({ unit: 'yesterday', count: 1 })
    expect(agoParts(5)).toEqual({ unit: 'days', count: 5 })
    expect(agoParts(13)).toEqual({ unit: 'days', count: 13 })
    expect(agoParts(14)).toEqual({ unit: 'weeks', count: 2 })
    expect(agoParts(45)).toEqual({ unit: 'weeks', count: 6 })
    expect(agoParts(60)).toEqual({ unit: 'months', count: 2 })
    expect(agoParts(400)).toEqual({ unit: 'months', count: 13 })
  })
})

describe('agoLabel', () => {
  const now = new Date('2026-10-05T14:30')
  it('reads in Spanish and English', async () => {
    await i18n.changeLanguage('es')
    const es = i18n.getFixedT('es')
    expect(agoLabel(es, new Date('2026-10-05T08:00'), now)).toBe('hoy')
    expect(agoLabel(es, new Date('2026-10-04T08:00'), now)).toBe('ayer')
    expect(agoLabel(es, new Date('2026-10-02T08:00'), now)).toBe('hace 3 días')
    expect(agoLabel(es, new Date('2026-08-01T08:00'), now)).toBe('hace 2 meses')
    const en = i18n.getFixedT('en')
    expect(agoLabel(en, new Date('2026-10-02T08:00'), now)).toBe('3 days ago')
    expect(agoLabel(en, new Date('2026-10-04T08:00'), now)).toBe('yesterday')
  })
})
