import { t } from 'i18next'
import { beforeAll, describe, expect, it } from 'vitest'
import i18n from '@/i18n'
import { cycleInfo } from '@/domain/dosing/cycle'
import type { ProtocolLike, ScheduleStep } from '@/domain/types'
import { cycleDecision } from './decision'
import type { StepDose } from './dose'
import {
  decisionSentence,
  decisionShort,
  headlineText,
  inDaysText,
  nextText,
  whenText,
} from './text'
import { headline, nextLine } from './view'

const d = (iso: string) => new Date(iso)
const W15 = [1, 2, 3, 4, 5]
const dosing = (doseMg: number, durationWeeks: number | null): ScheduleStep => ({
  doseMg,
  intervalDays: 1,
  weekdays: W15,
  durationWeeks,
})
const REST: ScheduleStep = { doseMg: 0, intervalDays: 1, pause: true, durationWeeks: 4 }
const CJC: ProtocolLike = {
  compoundId: 'mod-grf-1-29',
  startDate: '2026-09-21',
  times: ['25:00'],
  steps: [dosing(0.1, 1), dosing(0.15, 1), dosing(0.2, 10), REST],
}
const RETA: ProtocolLike = {
  compoundId: 'retatrutide',
  startDate: '2026-09-07',
  times: ['09:00'],
  steps: [dosing(1, 2), dosing(1.25, 1), dosing(1.5, 1), dosing(1.75, 1), dosing(2.5, null)],
}
const info = (p: ProtocolLike, iso: string) => cycleInfo(p, d(iso))!
const U = (mg: number, units: number | null): StepDose => ({ mg, units })

beforeAll(async () => {
  await i18n.changeLanguage('es')
})

describe('headlineText', () => {
  it('says the week the way the person counts it', () => {
    const say = (p: ProtocolLike, iso: string) => headlineText(headline(info(p, iso)), t, 'es')
    expect(say(CJC, '2026-10-04T10:00')).toBe('Semana 2 de 12')
    expect(say(RETA, '2026-10-04T10:00')).toBe('Semana 4 · escalón 3 de 5')
    expect(say(CJC, '2026-12-22T10:00')).toBe('Descanso · semana 2 de 4')
    expect(say(RETA, '2026-11-30T10:00')).toBe('Mantenimiento · semana 13')
    expect(say(CJC, '2026-09-14T10:00')).toBe('Empieza el lun 21 sep')
    expect(say(CJC, '2027-02-01T10:00')).toBe('Ciclo terminado')
  })
})

describe('nextText', () => {
  const dose = (s: { doseMg: number }) => `${s.doseMg * 100} U`
  const say = (p: ProtocolLike, iso: string) => {
    const n = nextLine(info(p, iso))
    // The day keeps its two words together (a no-break space): compared here as a plain one.
    const text = nextText(n, dose, t, 'es').replaceAll('\u00A0', ' ')
    return text + ('days' in n ? ` · ${inDaysText(n.days, t)}` : '')
  }

  it('announces the change with its day and how far away it is', () => {
    expect(say(CJC, '2026-10-04T10:00')).toBe('Sube el lun 5 a 20 U · en 1 día')
    expect(say(CJC, '2026-12-07T10:00')).toBe('Descanso desde el lun 14 · en 7 días')
    expect(say(CJC, '2026-12-22T10:00')).toBe('Termina el lun 11 · en 20 días')
    expect(say(CJC, '2026-09-14T10:00')).toBe('Empieza con 10 U · en 7 días')
  })

  it('never breaks the day of the change across two lines', () => {
    expect(nextText(nextLine(info(CJC, '2026-10-04T10:00')), dose, t, 'es')).toContain('lun\u00A05')
  })

  it('knows when nothing is planned or the plan is over', () => {
    expect(say(RETA, '2026-11-30T10:00')).toBe('Sin cambios previstos')
    expect(say(CJC, '2027-02-01T10:00')).toBe('Terminó el lun 11 ene')
  })
})

describe('whenText', () => {
  it('says today, tomorrow or the days left', () => {
    expect(whenText(0, t)).toBe('hoy')
    expect(whenText(1, t)).toBe('mañana')
    expect(whenText(3, t)).toBe('en 3 días')
  })
})

describe('decisionSentence', () => {
  const sunday = '2026-10-04T10:00'
  const decide = (p: ProtocolLike, iso: string) => cycleDecision(info(p, iso), d(iso))!

  it('words the step-up in units with the dose beside it', () => {
    const dec = decide(CJC, sunday)
    expect(decisionSentence(dec, { from: U(0.15, 9), to: U(0.2, 12) }, 'mcg', t, 'es')).toBe(
      'El lunes 5 sube de 9 U a 12 U (150 → 200 mcg).',
    )
  })

  it('words it in the dose itself when no vial says how to draw', () => {
    const dec = decide(CJC, sunday)
    expect(decisionSentence(dec, { from: U(0.15, null), to: U(0.2, null) }, 'mcg', t, 'es')).toBe(
      'El lunes 5 sube de 150 mcg a 200 mcg.',
    )
  })

  it('speaks in the present on the day it happens', () => {
    const dec = decide(CJC, '2026-10-05T08:00')
    expect(decisionSentence(dec, { from: U(0.15, 9), to: U(0.2, 12) }, 'mcg', t, 'es')).toBe(
      'Hoy sube de 9 U a 12 U (150 → 200 mcg).',
    )
  })

  it('words the rest, the end of the cycle and that it is over', () => {
    const none = { from: null, to: null }
    expect(decisionSentence(decide(CJC, '2026-12-12T10:00'), none, 'mcg', t, 'es')).toBe(
      'Fin de las semanas de dosis: empieza el descanso el lunes 14.',
    )
    expect(decisionSentence(decide(CJC, '2027-01-09T10:00'), none, 'mcg', t, 'es')).toBe(
      'El descanso termina el lunes 11. ¿Empiezas un nuevo ciclo?',
    )
    expect(decisionSentence(decide(CJC, '2027-01-20T10:00'), none, 'mcg', t, 'es')).toBe(
      'Descanso terminado: ¿empiezas un nuevo ciclo?',
    )
  })
})

describe('decisionShort', () => {
  const decide = (p: ProtocolLike, iso: string) => cycleDecision(info(p, iso), d(iso))!

  it('says what changes in a few words, in the units drawn', () => {
    const up = decide(CJC, '2026-10-04T10:00')
    expect(decisionShort(up, { from: U(0.15, 9), to: U(0.2, 12) }, 'mcg', t, 'es')).toBe(
      'Sube a 12 U',
    )
    expect(decisionShort(up, { from: U(0.15, null), to: U(0.2, null) }, 'mcg', t, 'es')).toBe(
      'Sube a 200 mcg',
    )
  })

  it('names the rest, the end and a plan that is over', () => {
    const none = { from: null, to: null }
    expect(decisionShort(decide(CJC, '2026-12-12T10:00'), none, 'mcg', t, 'es')).toBe(
      'Empieza el descanso',
    )
    expect(decisionShort(decide(CJC, '2027-01-09T10:00'), none, 'mcg', t, 'es')).toBe(
      'Termina el ciclo',
    )
    expect(decisionShort(decide(CJC, '2027-01-20T10:00'), none, 'mcg', t, 'es')).toBe(
      'Ciclo terminado',
    )
  })
})
