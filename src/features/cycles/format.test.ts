import { describe, expect, it } from 'vitest'
import { fmtSigned, fmtWeightDelta, sentence } from './format'

describe('fmtSigned', () => {
  it('writes a real minus, a plus, and no sign for what rounds to zero', () => {
    expect(fmtSigned(-1.3, 'es', 1)).toBe('−1,3')
    expect(fmtSigned(2.1, 'en', 1)).toBe('+2.1')
    expect(fmtSigned(0, 'es', 1)).toBe('0')
    expect(fmtSigned(-0.04, 'es', 1)).toBe('0')
  })
})

describe('fmtWeightDelta', () => {
  it('says kilograms, or pounds for someone who uses them', () => {
    expect(fmtWeightDelta(-1.25, false, 'es')).toBe('−1,3 kg')
    expect(fmtWeightDelta(-1, true, 'en')).toBe('−2.2 lb')
    expect(fmtWeightDelta(0.5, false, 'en')).toBe('+0.5 kg')
  })
})

describe('sentence', () => {
  it('capitalises the first letter, in the language of the phrase', () => {
    expect(sentence('semana 3 de 12', 'es')).toBe('Semana 3 de 12')
    expect(sentence('descanso: quedan 3 semanas', 'es')).toBe('Descanso: quedan 3 semanas')
    expect(sentence('', 'es')).toBe('')
  })
})
