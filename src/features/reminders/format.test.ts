import { t } from 'i18next'
import { beforeAll, describe, expect, it } from 'vitest'
import type { InventoryRow, ProtocolRow } from '@/data/database.types'
import i18n from '@/i18n'
import { localAdministration, localDecision, toDecisionInput } from './format'
import { upcomingAdministrations, upcomingDecisions } from './plan'

const W15 = [1, 2, 3, 4, 5]
const step = (doseMg: number, durationWeeks: number) => ({
  doseMg,
  intervalDays: 1,
  weekdays: W15,
  durationWeeks,
})
const CJC: ProtocolRow = {
  id: 'cjc',
  patient_id: 'u',
  created_by: 'u',
  compound_id: 'mod-grf-1-29',
  name: 'CJC-1295 + Ipamorelina',
  route: 'sc',
  unit: 'mcg',
  start_date: '2026-09-21',
  time_of_day: '01:00',
  times: ['25:00'],
  steps: [step(0.1, 1), step(0.15, 1), step(0.2, 10)],
  components: [{ compoundId: 'ipamorelin', doseMg: 0.1 }],
  status: 'active',
  template_id: null,
  notes: null,
  created_at: '',
  updated_at: '',
}
const BLEND = {
  id: 'blend',
  patient_id: 'u',
  compound_id: 'mod-grf-1-29',
  form: 'vial',
  label: 'CJC + Ipa',
  total_mg: 5,
  remaining_mg: 5,
  concentration_mg_per_ml: 5 / 3,
  diluent_ml: 3,
  components: [{ compoundId: 'ipamorelin', mg: 5 }],
  opened_at: '2026-09-21',
  expires_at: null,
  lot: null,
  storage_notes: null,
  archived: false,
  created_at: '',
  updated_at: '',
} as InventoryRow

beforeAll(async () => {
  await i18n.changeLanguage('es')
})

const SUNDAY = new Date('2026-10-04T12:00')
const decision = () => upcomingDecisions([CJC], [BLEND], SUNDAY)[0]!

describe('toDecisionInput', () => {
  it('fits what replace_reminders accepts', () => {
    const row = toDecisionInput(decision(), t, 'es')
    // compound_id is one no dose has, so the server never skips it as "already taken".
    expect(row.compound_id).toBe('cycle')
    expect(row.protocol_id).toBe('cjc')
    expect(row.tolerance_minutes).toBe(0)
    expect(row.url).toBe('#/?cycle=cjc')
    const fire = Date.parse(row.fire_at)
    const occurrence = Date.parse(row.occurrence_at)
    // The server keeps a row only when fire_at <= occurrence_at <= fire_at + 1 day.
    expect(fire).toBeLessThan(occurrence)
    expect(occurrence - fire).toBeLessThanOrEqual(24 * 3_600_000)
    // The evening before at 20:00; the occurrence is the first second of the step's day.
    expect(new Date(row.fire_at)).toEqual(new Date('2026-10-04T20:00'))
    expect(new Date(row.occurrence_at)).toEqual(new Date('2026-10-05T00:00:01'))
  })

  it('says which dose goes up and asks what to do', () => {
    const row = toDecisionInput(decision(), t, 'es')
    expect(row.title).toBe('Mañana sube la dosis')
    expect(row.body).toBe(
      'CJC-1295 + Ipamorelina: de 9 U (150 mcg) a 12 U (200 mcg). ¿Subes o mantienes una semana más?',
    )
  })

  it('speaks English when the app does', async () => {
    await i18n.changeLanguage('en')
    const row = toDecisionInput(decision(), t, 'en')
    expect(row.title).toBe('The dose goes up tomorrow')
    expect(row.body).toContain('from 9 U (150 mcg) to 12 U (200 mcg)')
    await i18n.changeLanguage('es')
  })
})

describe('local reminders', () => {
  it('give each occurrence its own id and tag, so a decision never hides a dose reminder', () => {
    const dec = localDecision(decision(), t, 'es')
    expect(dec).toMatchObject({
      tag: 'titra-cycle-cjc',
      url: '#/?cycle=cjc',
      fireAt: new Date('2026-10-04T20:00'),
    })
    const [admin] = upcomingAdministrations([CJC], [], [BLEND], SUNDAY, { horizonDays: 2 })
    const dose = localAdministration(admin!, 0, t, 'es')
    expect(dose.tag).toBe('titra-cjc')
    expect(dose.url).toBe('#/?log=cjc')
    expect(dose.id).not.toBe(dec.id)
  })
})
