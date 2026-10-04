/**
 * Development lab only: a realistic week-four user, built relative to today so the whole
 * app (agenda, cycle weeks, stock runway, alerts) behaves as it would on a real account.
 * Mirrors a real regimen: weekly retatrutide titration, MOTS-c Mon/Wed/Fri and a premixed
 * CJC-1295 + ipamorelin vial taken Mon–Fri nights after midnight.
 */
import { addDays, format, startOfWeek } from 'date-fns'
import { toProtocolLike } from '@/data/mappers'
import { componentsAt, scheduledDoses } from '@/domain/dosing/schedule'
import type { Row, Store } from './fakeSupabase'

export const LAB_USER = { id: 'lab-user', email: 'lab@titra.test' }

const day = (d: Date) => format(d, 'yyyy-MM-dd')
const SITES = ['abd_ul', 'abd_ur', 'thigh_l', 'thigh_r', 'abd_ll', 'abd_lr', 'glute_l', 'glute_r']

export interface LabOptions {
  /** Start with nothing logged, as a brand-new account. */
  empty?: boolean
}

export function buildStore(now: Date = new Date(), options: LabOptions = {}): Store {
  const stamp = now.toISOString()
  const monday = startOfWeek(now, { weekStartsOn: 1 })
  const uid = LAB_USER.id

  const profile: Row = {
    id: uid,
    role: 'patient',
    display_name: 'Lab',
    locale: 'es',
    unit_system: 'metric',
    clinic_code: 'LAB123',
    birth_year: 1985,
    sex: 'M',
    height_cm: 178,
    goal_weight_kg: 72,
    protein_g_per_kg: 1.6,
    onboarded: true,
    reminders_enabled: false,
    reminder_lead_minutes: 0,
    created_at: stamp,
    updated_at: stamp,
  }
  const store: Store = {
    profiles: [profile],
    protocols: [],
    inventory: [],
    doses: [],
    measurements: [],
    symptoms: [],
    lab_results: [],
    care_links: [],
    clinical_notes: [],
    compound_notes: [],
    push_subscriptions: [],
    saved_protocols: [],
    reminders: [],
    alert_dismissals: [],
  }
  if (options.empty) return store

  const weekly = (steps: [number, number | null][], weekdays: number[]) =>
    steps.map(([doseMg, durationWeeks]) => ({ doseMg, intervalDays: 1, weekdays, durationWeeks }))

  const protocol = (over: Row): Row => ({
    id: crypto.randomUUID(),
    patient_id: uid,
    created_by: uid,
    status: 'active',
    created_at: stamp,
    updated_at: stamp,
    ...over,
  })

  const reta = protocol({
    compound_id: 'retatrutide',
    name: 'Retatrutida',
    unit: 'mg',
    start_date: day(addDays(monday, -21)),
    time_of_day: '09:00',
    times: ['09:00'],
    steps: weekly(
      [
        [1, 2],
        [1.25, 1],
        [1.5, 1],
        [1.75, 1],
        [2, 1],
        [2.25, 1],
        [2.5, null],
      ],
      [1],
    ),
    components: [],
    notes: 'Lunes por la mañana. Sube 2,5 ud por semana hasta 25 ud (2,5 mg).',
  })
  const mots = protocol({
    compound_id: 'mots-c',
    name: 'MOTS-c',
    unit: 'mg',
    start_date: day(addDays(monday, -21)),
    time_of_day: '09:00',
    times: ['09:00'],
    steps: weekly(
      [
        [1, 4],
        [1.5, null],
      ],
      [1, 3, 5],
    ),
    components: [],
    notes: 'Lunes, miércoles y viernes por la mañana.',
  })
  const cjc = protocol({
    compound_id: 'mod-grf-1-29',
    name: 'CJC-1295 + Ipamorelina',
    unit: 'mcg',
    start_date: day(addDays(monday, -7)),
    time_of_day: '01:00',
    times: ['25:00'],
    steps: [
      ...weekly(
        [
          [0.1, 1],
          [0.15, 1],
          [0.2, 10],
        ],
        [1, 2, 3, 4, 5],
      ),
      { doseMg: 0, intervalDays: 1, pause: true, durationWeeks: 4, label: 'Descanso' },
    ],
    components: [{ compoundId: 'ipamorelin', doseMg: 0.1 }],
    notes: 'En ayunas: 2 h después de comer y 30 min antes de volver a comer.',
  })
  store.protocols.push(reta, mots, cjc)

  const vial = (over: Row): Row => ({
    id: crypto.randomUUID(),
    patient_id: uid,
    form: 'vial',
    components: [],
    archived: false,
    created_at: stamp,
    updated_at: stamp,
    ...over,
  })
  const vReta = vial({
    compound_id: 'retatrutide',
    label: 'Retatrutida 15 mg',
    total_mg: 15,
    remaining_mg: 15,
    diluent_ml: 1.5,
    concentration_mg_per_ml: 10,
    opened_at: reta.start_date,
  })
  const vMots = vial({
    compound_id: 'mots-c',
    label: 'MOTS-c 10 mg',
    total_mg: 10,
    remaining_mg: 10,
    diluent_ml: 1,
    concentration_mg_per_ml: 10,
    opened_at: mots.start_date,
  })
  const vMotsSpare = vial({
    compound_id: 'mots-c',
    label: 'MOTS-c 10 mg · reserva',
    total_mg: 10,
    remaining_mg: 10,
  })
  const vCjc = vial({
    compound_id: 'mod-grf-1-29',
    label: 'CJC-1295 + Ipamorelina 10 mg',
    total_mg: 5,
    remaining_mg: 5,
    diluent_ml: 3,
    concentration_mg_per_ml: 5 / 3,
    components: [{ compoundId: 'ipamorelin', mg: 5 }],
    opened_at: cjc.start_date,
  })
  store.inventory.push(vReta, vMots, vMotsSpare, vCjc)

  // Doses: every planned administration taken a few minutes late, except Monday's CJC
  // (missed) and one extra shot on the rest day.
  let n = 0
  const jitter = [4, 12, 7, 18, 3, 9, 15, 6]
  const give = (p: Row, vialRow: Row, at: Date, extra = false) => {
    const pl = toProtocolLike(p as never)
    const mg = Number(
      scheduledDoses(pl, addDays(at, -1), addDays(at, 2))[0]?.doseMg ?? pl.steps[0]?.doseMg ?? 0,
    )
    const site = SITES[n++ % SITES.length]
    const batch = (pl.components?.length ?? 0) > 0 ? crypto.randomUUID() : null
    const base = {
      id: crypto.randomUUID(),
      patient_id: uid,
      protocol_id: p.id,
      administered_at: at.toISOString(),
      site_id: site,
      batch_id: batch,
      planned_at: null,
      notes: extra ? 'Toma extra' : null,
      created_at: at.toISOString(),
    }
    store.doses.push({ ...base, compound_id: p.compound_id, dose_mg: mg, inventory_id: vialRow.id })
    vialRow.remaining_mg = Math.max(0, Number(vialRow.remaining_mg) - mg)
    for (const c of componentsAt(pl, mg))
      store.doses.push({
        ...base,
        id: crypto.randomUUID(),
        compound_id: c.compoundId,
        dose_mg: c.doseMg,
        inventory_id: null,
      })
  }

  let missedCjc = false
  for (const [p, v] of [
    [reta, vReta],
    [mots, vMots],
    [cjc, vCjc],
  ] as const) {
    const pl = toProtocolLike(p as never)
    const slots = scheduledDoses(pl, new Date(`${p.start_date}T00:00`), now).filter(
      (o) => o.at < now,
    )
    slots.forEach((o, i) => {
      if (p === cjc && !missedCjc && i === 1) {
        missedCjc = true
        return
      }
      give(p, v, new Date(o.at.getTime() + jitter[i % jitter.length]! * 60_000))
    })
  }
  const restDay = addDays(monday, 5) // Saturday: nothing planned
  if (restDay < now) give(cjc, vCjc, new Date(`${day(restDay)}T08:00`), true)

  // Body measurements and one wellbeing check-in.
  const measure = (kind: string, value: number, unit: string, at: Date): Row => ({
    id: crypto.randomUUID(),
    patient_id: uid,
    kind,
    value,
    unit,
    measured_at: at.toISOString(),
    source: 'manual',
    created_at: at.toISOString(),
  })
  for (const [back, kg] of [
    [10, 77.5],
    [8, 78.0],
    [5, 77.4],
    [2, 77.0],
  ] as const)
    store.measurements.push(measure('weight', kg, 'kg', addDays(now, -back)))
  store.measurements.push(measure('waist', 91, 'cm', addDays(now, -10)))
  const checkIn = addDays(now, -5)
  for (const [kind, v] of [
    ['energy', 8],
    ['sleep_quality', 6],
    ['mood', 8],
    ['recovery', 8],
    ['focus', 9],
    ['appetite', 6],
    ['libido', 6],
  ] as const)
    store.measurements.push(measure(kind, v, 'score', checkIn))

  store.saved_protocols.push({
    id: crypto.randomUUID(),
    owner_id: uid,
    name: 'CJC-1295 + Ipamorelina',
    compound_id: 'mod-grf-1-29',
    unit: 'mcg',
    components: cjc.components,
    steps: cjc.steps,
    times: cjc.times,
    notes: null,
    created_at: stamp,
    updated_at: stamp,
  })
  return store
}
