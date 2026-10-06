import { describe, expect, it } from 'vitest'
import { toProtocolLike } from '@/data/mappers'
import { doseLabel } from './doseLabel'
import { cjc, CJC_VIAL, reta, RETA_VIAL } from './fixtures'

const blend = toProtocolLike(cjc())
const single = toProtocolLike(reta())

describe('doseLabel', () => {
  it('writes a blend as one dose and one draw', () => {
    const l = doseLabel({
      like: blend,
      doseMg: 0.1,
      vials: [CJC_VIAL],
      locale: 'es',
      withUnits: true,
    })
    expect(l).toEqual({ value: '100', short: '100 mcg', full: '100 + 100 mcg', units: '6 U' })
  })

  it('scales the partner with the titration, as the premixed vial does', () => {
    const l = doseLabel({
      like: blend,
      doseMg: 0.2,
      vials: [CJC_VIAL],
      locale: 'es',
      withUnits: true,
    })
    expect(l).toMatchObject({ value: '200', full: '200 + 200 mcg', units: '12 U' })
  })

  it('shows mg for a substance dosed in mg, with the locale decimal separator', () => {
    const es = doseLabel({
      like: single,
      doseMg: 1.25,
      vials: [RETA_VIAL],
      locale: 'es',
      withUnits: true,
    })
    expect(es).toEqual({ value: '1,25', short: '1,25 mg', full: '1,25 mg', units: '12,5 U' })
    const en = doseLabel({
      like: single,
      doseMg: 1.25,
      vials: [RETA_VIAL],
      locale: 'en',
      withUnits: false,
    })
    expect(en).toMatchObject({ value: '1.25', short: '1.25 mg', units: null })
  })

  it('has no syringe reading without a vial for the substance', () => {
    expect(
      doseLabel({ like: blend, doseMg: 0.1, vials: [], locale: 'es', withUnits: true }).units,
    ).toBeNull()
    expect(
      doseLabel({ like: blend, doseMg: 0.1, vials: [RETA_VIAL], locale: 'es', withUnits: true })
        .units,
    ).toBeNull()
  })

  it('has no syringe reading for a vial that is still powder', () => {
    const powder = { ...RETA_VIAL, concentration_mg_per_ml: null, diluent_ml: null }
    expect(
      doseLabel({ like: single, doseMg: 1, vials: [powder], locale: 'es', withUnits: true }).units,
    ).toBeNull()
  })
})
