import { describe, expect, it } from 'vitest'
import { fmtDose, fmtDoseList } from './format'

describe('dose formatting', () => {
  it('keeps the unit per compound', () => {
    expect(fmtDose(0.1, 'mcg', 'es')).toBe('100 mcg')
    expect(fmtDose(2, 'mg', 'en')).toBe('2 mg')
  })

  it('joins a same-unit stack under one unit and mixes otherwise', () => {
    const stack = [
      { valueMg: 0.1, unit: 'mcg' as const },
      { valueMg: 0.1, unit: 'mcg' as const },
    ]
    expect(fmtDoseList(stack, 'es')).toBe('100 + 100 mcg')
    expect(
      fmtDoseList(
        [
          { valueMg: 2, unit: 'mg' },
          { valueMg: 0.1, unit: 'mcg' },
        ],
        'en',
      ),
    ).toBe('2 mg · 100 mcg')
  })
})
