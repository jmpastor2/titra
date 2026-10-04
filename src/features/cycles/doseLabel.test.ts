import { describe, expect, it } from 'vitest'
import { toProtocolLike } from '@/data/mappers'
import { blockLabels, doseLabel } from './doseLabel'
import { cjc, CJC_VIAL, reta, RETA_VIAL } from './fixtures'
import { buildCycleViews } from './model'
import { buildTimeline } from './timeline'

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

describe('blockLabels', () => {
  const now = new Date('2026-10-05T10:00') // week 3 of the blend cycle
  const views = buildCycleViews(
    [cjc(), cjc({ id: 'old', start_date: '2026-05-04', status: 'completed' })],
    now,
  )
  const timeline = buildTimeline(views, now)!
  const labels = blockLabels(timeline, views, [CJC_VIAL], 'es')

  it('labels every dosing step and no rest', () => {
    expect([...labels.keys()].toSorted()).toEqual(
      ['cjc:0', 'cjc:1', 'cjc:2', 'old:0', 'old:1', 'old:2'].toSorted(),
    )
  })

  it('gives the syringe reading to the steps still to come, not to the ones behind', () => {
    expect(labels.get('cjc:0')!.units).toBeNull() // the 100 mcg week is over
    expect(labels.get('cjc:2')!).toMatchObject({ full: '200 + 200 mcg', units: '12 U' })
  })

  it('never gives it to a cycle that is over', () => {
    expect(labels.get('old:2')!.units).toBeNull()
    expect(labels.get('old:2')!.full).toBe('200 + 200 mcg')
  })
})
