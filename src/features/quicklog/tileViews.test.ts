import { beforeAll, describe, expect, it } from 'vitest'
import type { MeasurementKind, MeasurementRow, SymptomRow } from '@/data/database.types'
import i18n from '@/i18n'
import type { DoseGlance } from './doseGlance'
import { deriveQuickData } from './quickData'
import { buildRanks } from './ranks'
import { summaryOf, tileView, type TileContext } from './tileViews'
import type { TileId } from './tiles'

const NOW = new Date('2026-10-05T14:30')
const profile = { unit_system: 'metric' as const, protein_g_per_kg: 1.6, goal_weight_kg: 72 }

let n = 0
const row = (kind: MeasurementKind, value: number, at: string, unit = 'x'): MeasurementRow => ({
  id: `m${++n}`,
  patient_id: 'u',
  measured_at: new Date(at).toISOString(),
  kind,
  value,
  unit,
  notes: null,
  source: 'manual',
  created_at: '',
})

const symptom = (kind: SymptomRow['kind'], severity: number, at: string): SymptomRow => ({
  id: `s${++n}`,
  patient_id: 'u',
  occurred_at: new Date(at).toISOString(),
  kind,
  severity,
  notes: null,
  created_at: '',
})

const glanceOf = (over: Partial<DoseGlance> = {}): DoseGlance => ({
  status: 'none',
  dose: null,
  hoursAhead: null,
  fastFor: null,
  fastingAvailable: false,
  ...over,
})

const cjc = (at: string, units: number | null = 9) => ({
  protocolId: 'cjc',
  at: new Date(at),
  compoundIds: ['mod-grf-1-29', 'ipamorelina'],
  name: 'CJC + Ipa',
  units,
})

beforeAll(async () => {
  await i18n.changeLanguage('es')
})

function context(
  over: {
    rows?: MeasurementRow[]
    glance?: DoseGlance
    symptoms?: SymptomRow[]
    lastMeal?: Date | null
    imperial?: boolean
    lang?: 'es' | 'en'
    goalMl?: number
    at?: Date
  } = {},
): TileContext {
  const now = over.at ?? NOW
  const data = deriveQuickData(
    over.rows ?? [],
    { ...profile, unit_system: over.imperial ? 'imperial' : 'metric' },
    now,
  )
  const glance = over.glance ?? glanceOf()
  const goalMl = over.goalMl ?? 2500
  return {
    t: i18n.getFixedT(over.lang ?? 'es'),
    locale: over.lang ?? 'es',
    now,
    data,
    glance,
    symptoms: over.symptoms ?? [],
    goalMl,
    lastMeal: over.lastMeal ?? null,
    tiers: new Map(buildRanks({ data, glance, goalMl, now }).map((r) => [r.id, r.tier])),
  }
}

const view = (id: TileId, over: Parameters<typeof context>[0] = {}) => tileView(id, context(over))

describe('dose tile', () => {
  it('says "Toca ahora" for a dose that is due, with its name and syringe units', () => {
    const v = view('dose', { glance: glanceOf({ status: 'due', dose: cjc('2026-10-05T22:00') }) })
    expect(v).toMatchObject({
      label: 'Toma',
      value: { text: 'Toca ahora', word: true },
      caption: 'CJC + Ipa · 9 U',
      tone: 'urgent',
      visual: { kind: 'substances' },
    })
    expect(v.aria).toBe('Toma. Toca ahora. CJC + Ipa · 9 U')
  })

  it('counts down to the next dose and leaves the units out when a vial is unknown', () => {
    const v = view('dose', {
      glance: glanceOf({
        status: 'upcoming',
        dose: cjc('2026-10-05T22:00', null),
        hoursAhead: 7.5,
      }),
    })
    expect(v.value.text).toBe('En 8 h')
    expect(v.caption).toBe('CJC + Ipa')
    expect(v.tone).toBe('idle')
  })

  it('asks for attention within three hours', () => {
    const v = view('dose', {
      glance: glanceOf({ status: 'upcoming', dose: cjc('2026-10-05T16:00'), hoursAhead: 1.5 }),
    })
    expect(v.tone).toBe('attention')
    expect(v.dot).toBe(true)
  })

  it('says how late a missed dose is and points at the one that was missed', () => {
    const late = view('dose', {
      glance: glanceOf({ status: 'overdue', dose: cjc('2026-10-05T11:30') }),
    })
    expect(late.value.text).toBe('Retrasada 3 h')
    const missed = view('dose', {
      glance: glanceOf({ status: 'missed', dose: cjc('2026-10-05T08:00') }),
    })
    expect(missed.value.text).toBe('Perdida')
  })

  it('is done for the day and says what comes next', () => {
    const v = view('dose', { glance: glanceOf({ status: 'done', dose: cjc('2026-10-06T01:00') }) })
    expect(v).toMatchObject({
      value: { text: 'Hecha hoy' },
      caption: 'Próxima: mar 01:00',
      tone: 'done',
    })
    expect(v.visual).toBeUndefined()
  })

  it('becomes the free dose on a new account and on a quiet day', () => {
    expect(view('dose')).toMatchObject({
      value: { text: 'Toma suelta' },
      caption: 'Registra una toma',
    })
    const quiet = view('dose', {
      glance: glanceOf({ status: 'none', dose: cjc('2026-10-06T01:00') }),
    })
    expect(quiet).toMatchObject({ value: { text: 'Hoy no toca' }, caption: 'Próxima: mar 01:00' })
  })
})

describe('body tiles', () => {
  const rows = [
    row('weight', 77.4, '2026-10-01T08:00', 'kg'),
    row('weight', 77, '2026-10-03T08:00', 'kg'),
    row('waist', 91, '2026-09-25T08:00', 'cm'),
  ]

  it('shows the last weight with its age and the change, and a sparkline', () => {
    const v = view('weight', { rows })
    expect(v).toMatchObject({
      value: { text: '77,0', unit: 'kg' },
      caption: 'hace 2 días · −0,4',
      tone: 'idle',
      visual: { kind: 'spark', values: [77.4, 77] },
    })
    expect(v.aria).toBe('Peso. 77,0 kg. hace 2 días · −0,4')
  })

  it('highlights a stale reading and a first one invites', () => {
    const stale = view('weight', { rows: [row('weight', 77, '2026-09-28T08:00', 'kg')] })
    expect(stale.tone).toBe('attention')
    expect(stale.caption).toBe('hace 7 días')
    expect(view('weight')).toMatchObject({ value: { text: '—' }, caption: 'Pésate para empezar' })
    expect(view('waist')).toMatchObject({ value: { text: '—' }, caption: 'Mide tu cintura' })
  })

  it('is done once weighed today', () => {
    const v = view('weight', { rows: [row('weight', 76.8, '2026-10-05T08:00', 'kg'), ...rows] })
    expect(v.tone).toBe('done')
    expect(v.caption).toBe('hoy · −0,2')
  })

  it('shows the waist as stale only after a week', () => {
    expect(view('waist', { rows }).tone).toBe('attention')
    const fresh = view('waist', { rows: [row('waist', 91, '2026-10-01T08:00', 'cm')] })
    expect(fresh).toMatchObject({ tone: 'idle', caption: 'hace 4 días' })
    expect(fresh.visual).toBeUndefined()
  })

  it('speaks pounds and inches to an imperial user', () => {
    const v = view('weight', { rows, imperial: true })
    expect(v.value).toEqual({ text: '169,8', unit: 'lb' })
    expect(v.caption).toBe('hace 2 días · −0,9')
    expect(view('waist', { rows, imperial: true }).value).toEqual({ text: '35,8', unit: 'in' })
  })
})

describe('counter tiles', () => {
  it('shows water against the goal, with the ring and what is left', () => {
    const rows = [
      row('hydration_ml', 250, '2026-10-05T08:00', 'ml'),
      row('hydration_ml', 500, '2026-10-05T11:00', 'ml'),
    ]
    const v = view('water', { rows })
    expect(v).toMatchObject({
      value: { text: '750', unit: 'ml' },
      // The figure and its unit stay together when the caption wraps.
      caption: 'Faltan 1,75\u00A0L',
      visual: { kind: 'ring', fraction: 0.3, done: false },
    })
    expect(v.aria).toContain('Toca para añadir 250 ml')
  })

  it('shows litres from a litre up and is done at the goal', () => {
    const rows = [
      row('hydration_ml', 1000, '2026-10-05T08:00', 'ml'),
      row('hydration_ml', 1500, '2026-10-05T11:00', 'ml'),
    ]
    const v = view('water', { rows })
    expect(v).toMatchObject({
      value: { text: '2,5', unit: 'L' },
      caption: '¡Objetivo!',
      tone: 'done',
    })
    expect(v.visual).toMatchObject({ done: true })
  })

  it('follows a goal the person changed', () => {
    expect(view('water', { goalMl: 3000 }).caption).toBe('Faltan 3\u00A0L')
  })

  it('shows protein against the target from the weight', () => {
    const rows = [
      row('weight', 77, '2026-10-03T08:00', 'kg'),
      row('protein_g', 30, '2026-10-05T09:00', 'g'),
      row('protein_g', 25, '2026-10-05T13:00', 'g'),
    ]
    expect(view('protein', { rows })).toMatchObject({
      value: { text: '55', unit: 'g' },
      caption: 'Faltan 68\u00A0g',
      visual: { kind: 'ring', fraction: 55 / 123 },
    })
  })

  it('counts strength sessions against two a week', () => {
    const rows = [row('resistance_session', 45, '2026-10-04T19:00', 'min')]
    const v = view('strength', { rows })
    expect(v).toMatchObject({
      value: { text: '1', unit: '/ 2' },
      caption: 'ayer',
      tone: 'attention',
    })
    const done = view('strength', {
      rows: [...rows, row('resistance_session', 60, '2026-10-02T19:00', 'min')],
    })
    expect(done.tone).toBe('done')
    expect(view('strength').caption).toBe('Aún ninguna')
  })
})

describe('check-in, symptom and fasting tiles', () => {
  const day = (d: string) => [
    row('energy', 7, `2026-10-${d}T09:00`, 'score'),
    row('mood', 8, `2026-10-${d}T09:00`, 'score'),
  ]

  it('shows the streak when done today and asks when it is not', () => {
    const done = view('checkin', { rows: [...day('05'), ...day('04'), ...day('03')] })
    expect(done).toMatchObject({ value: { text: 'Hecho' }, caption: 'Racha 3 d', tone: 'done' })
    const pending = view('checkin', { rows: [...day('04'), ...day('03')] })
    expect(pending).toMatchObject({
      value: { text: 'Toca hoy' },
      caption: 'Racha 2 d',
      tone: 'idle',
    })
    const stale = view('checkin', { rows: day('01') })
    expect(stale).toMatchObject({ caption: 'hace 4 días', tone: 'attention' })
    expect(view('checkin')).toMatchObject({
      value: { text: 'Empieza hoy' },
      caption: 'Un minuto basta',
    })
  })

  it('names the latest symptom of today, or the last one when today is clear', () => {
    const today = view('symptom', {
      symptoms: [
        symptom('nausea', 6, '2026-10-05T10:00'),
        symptom('reflux', 2, '2026-10-02T10:00'),
      ],
    })
    expect(today).toMatchObject({ value: { text: 'Náuseas' }, caption: 'Hoy · 6/10' })
    const two = view('symptom', {
      symptoms: [
        symptom('nausea', 6, '2026-10-05T12:00'),
        symptom('nausea', 4, '2026-10-05T08:00'),
      ],
    })
    expect(two.caption).toBe('Hoy · 2 registros')
    const none = view('symptom', { symptoms: [symptom('reflux', 2, '2026-10-02T10:00')] })
    expect(none).toMatchObject({
      value: { text: 'Sin síntomas hoy' },
      caption: 'Reflujo / ardor · hace 3 días',
    })
    expect(view('symptom')).toMatchObject({
      value: { text: 'Sin síntomas' },
      caption: 'Anota cómo te sientes',
    })
  })

  it('counts down the fast and turns green once it is long enough', () => {
    const near = glanceOf({ fastingAvailable: true, fastFor: cjc('2026-10-06T01:00') })
    const ask = view('fasting', { glance: near, at: new Date('2026-10-05T22:30') })
    expect(ask).toMatchObject({
      value: { text: 'Sin anotar' },
      caption: '¿Cuándo comiste?',
      tone: 'attention',
    })

    const wait = view('fasting', {
      glance: near,
      at: new Date('2026-10-05T22:30'),
      lastMeal: new Date('2026-10-05T22:00'),
    })
    expect(wait).toMatchObject({
      value: { text: 'Listo 00:00' },
      caption: 'faltan 90 min',
      visual: { kind: 'bar', fraction: 0.25 },
    })

    const ready = view('fasting', {
      glance: near,
      at: new Date('2026-10-05T22:30'),
      lastMeal: new Date('2026-10-05T20:00'),
    })
    expect(ready).toMatchObject({
      value: { text: 'En ayunas' },
      caption: 'desde las 22:00',
      tone: 'done',
    })
  })
})

describe('in English, and in one line', () => {
  it('reads the same states in English', () => {
    const rows = [
      row('weight', 77.4, '2026-10-01T08:00', 'kg'),
      row('weight', 77, '2026-10-03T08:00', 'kg'),
    ]
    expect(view('weight', { rows, lang: 'en' })).toMatchObject({
      label: 'Weight',
      caption: '2 days ago · −0.4',
      value: { text: '77.0', unit: 'kg' },
    })
    expect(view('water', { lang: 'en' }).caption).toBe('2.5\u00A0L to go')
    expect(
      view('dose', {
        lang: 'en',
        glance: glanceOf({ status: 'due', dose: cjc('2026-10-05T22:00') }),
      }).value.text,
    ).toBe('Due now')
  })

  it('summarises a tile for the "Más" sheet', () => {
    const rows = [
      row('weight', 77.4, '2026-10-01T08:00', 'kg'),
      row('weight', 77, '2026-10-03T08:00', 'kg'),
    ]
    expect(summaryOf(view('weight', { rows }))).toBe('77,0 kg · hace 2 días · −0,4')
    expect(summaryOf(view('symptom'))).toBe('Sin síntomas · Anota cómo te sientes')
  })
})
