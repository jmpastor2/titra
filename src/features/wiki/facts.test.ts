import { describe, expect, it } from 'vitest'
import { EVIDENCE_ORDER } from '@/content/compounds'
import { templatesForCompound } from '@/content/protocols/templates'
import { evidenceLevel, EVIDENCE_RUNGS, fmtDoseRange, templateDoseRange } from './facts'

const step = (doseMg: number, pause = false) => ({
  doseMg,
  intervalDays: 7,
  durationWeeks: 4,
  ...(pause ? { pause } : {}),
})

describe('evidenceLevel', () => {
  it('climbs from anecdotal to approved, one rung per tier', () => {
    const levels = EVIDENCE_ORDER.map(evidenceLevel)
    expect(levels[0]).toBe(EVIDENCE_RUNGS)
    expect(levels.at(-1)).toBe(1)
    expect(levels).toEqual(levels.toSorted((a, b) => b - a))
    expect(new Set(levels).size).toBe(EVIDENCE_RUNGS)
  })

  it('puts a trial phase between approved and anecdotal', () => {
    expect(evidenceLevel('fda_approved')).toBeGreaterThan(evidenceLevel('phase3'))
    expect(evidenceLevel('phase3')).toBeGreaterThan(evidenceLevel('phase1'))
    expect(evidenceLevel('phase1')).toBeGreaterThan(evidenceLevel('anecdotal'))
  })
})

describe('templateDoseRange', () => {
  it('spans every step of every template', () => {
    expect(
      templateDoseRange([{ steps: [step(1), step(2.5)] }, { steps: [step(0.25), step(1)] }]),
    ).toEqual({
      min: 0.25,
      max: 2.5,
    })
  })

  it('ignores pauses and has nothing to say without templates', () => {
    expect(templateDoseRange([{ steps: [step(2), step(0, true)] }])).toEqual({ min: 2, max: 2 })
    expect(templateDoseRange([])).toBeNull()
    expect(templateDoseRange([{ steps: [step(0, true)] }])).toBeNull()
  })

  it('reads the real retatrutide templates', () => {
    const range = templateDoseRange(templatesForCompound('retatrutide'))
    expect(range?.min).toBeGreaterThan(0)
    expect(range?.max).toBeGreaterThan(range?.min ?? 0)
  })
})

describe('fmtDoseRange', () => {
  it('prints one unit for the pair', () => {
    expect(fmtDoseRange({ min: 0.25, max: 2.4 }, 'mg', 'es')).toBe('0,25–2,4 mg')
    expect(fmtDoseRange({ min: 0.25, max: 2.4 }, 'mg', 'en')).toBe('0.25–2.4 mg')
    expect(fmtDoseRange({ min: 0.1, max: 0.3 }, 'mcg', 'es')).toBe('100–300 mcg')
  })

  it('collapses a single dose', () => {
    expect(fmtDoseRange({ min: 5, max: 5 }, 'mg', 'es')).toBe('5 mg')
  })
})
