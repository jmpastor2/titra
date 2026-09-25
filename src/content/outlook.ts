/**
 * Evidence behind the "Futuro" (outlook) screen.
 *
 * Rules for this file:
 * - Only figures observed in a published human trial, with trial, year, population,
 *   arm dose and duration. Each value is what the trial reported, never a promise.
 * - Anything not verified stays out and is listed in CLINICAL_REVIEW.md
 *   ("Proyecciones (sección Futuro)").
 * - Compounds without human outcome data say so and list what to measure instead,
 *   so the user can build his own evidence.
 */
import type { MeasurementKind } from '@/data/database.types'
import { t, type L10n } from './schema'

/* ------------------------------------------------------------------ what to measure */

/** Where an item is recorded in the app: a measurement, a check-in score or a lab result. */
export type MeasureTarget =
  | { type: 'measurement'; kind: MeasurementKind }
  | { type: 'checkin'; kind: MeasurementKind }
  | { type: 'lab' }
  | { type: 'note' }

export interface MeasureItem {
  id: string
  label: L10n
  /** When or why, taken from the wiki's monitoring list. */
  hint?: L10n
  target: MeasureTarget
}

const M = {
  weight: {
    id: 'weight',
    label: t('Peso', 'Weight'),
    hint: t('Misma báscula, en ayunas, 1–2 veces por semana', 'Same scale, fasted, 1–2× a week'),
    target: { type: 'measurement', kind: 'weight' },
  },
  waist: {
    id: 'waist',
    label: t('Cintura', 'Waist'),
    hint: t('A la altura del ombligo, cada 2 semanas', 'At navel height, every 2 weeks'),
    target: { type: 'measurement', kind: 'waist' },
  },
  bodyFat: {
    id: 'body_fat_pct',
    label: t('% de grasa', 'Body fat %'),
    target: { type: 'measurement', kind: 'body_fat_pct' },
  },
  lean: {
    id: 'lean_mass',
    label: t('Masa magra', 'Lean mass'),
    hint: t('Para ver qué parte del peso perdido es grasa', 'To see how much of the loss is fat'),
    target: { type: 'measurement', kind: 'lean_mass' },
  },
  glucose: {
    id: 'glucose_fasting',
    label: t('Glucosa en ayunas', 'Fasting glucose'),
    target: { type: 'measurement', kind: 'glucose_fasting' },
  },
  hba1c: {
    id: 'hba1c',
    label: t('HbA1c', 'HbA1c'),
    hint: t('Cada 3 meses como mucho', 'At most every 3 months'),
    target: { type: 'measurement', kind: 'hba1c' },
  },
  heartRate: {
    id: 'heart_rate',
    label: t('Frecuencia cardíaca en reposo', 'Resting heart rate'),
    hint: t('En cada escalón de dosis', 'At each dose step'),
    target: { type: 'measurement', kind: 'heart_rate' },
  },
  bp: {
    id: 'bp_systolic',
    label: t('Tensión arterial', 'Blood pressure'),
    target: { type: 'measurement', kind: 'bp_systolic' },
  },
  igf1: {
    id: 'igf1',
    label: t('IGF-1 en analítica', 'IGF-1 blood test'),
    hint: t('Basal y a las 4–8 semanas', 'Baseline and at 4–8 weeks'),
    target: { type: 'lab' },
  },
  sleep: {
    id: 'sleep_quality',
    label: t('Calidad del sueño', 'Sleep quality'),
    hint: t('Check-in diario', 'Daily check-in'),
    target: { type: 'checkin', kind: 'sleep_quality' },
  },
  recovery: {
    id: 'recovery',
    label: t('Recuperación', 'Recovery'),
    hint: t('Check-in diario', 'Daily check-in'),
    target: { type: 'checkin', kind: 'recovery' },
  },
  energy: {
    id: 'energy',
    label: t('Energía', 'Energy'),
    hint: t('Check-in diario', 'Daily check-in'),
    target: { type: 'checkin', kind: 'energy' },
  },
  focus: {
    id: 'focus',
    label: t('Concentración', 'Focus'),
    hint: t('Check-in diario', 'Daily check-in'),
    target: { type: 'checkin', kind: 'focus' },
  },
  injury: {
    id: 'injury',
    label: t('Dolor y movilidad de la lesión', 'Injury pain and range of motion'),
    hint: t(
      'Anótalo en notas; no hay biomarcadores validados',
      'Write it in notes; there are no validated biomarkers',
    ),
    target: { type: 'note' },
  },
  copper: {
    id: 'copper',
    label: t('Cobre sérico y ceruloplasmina', 'Serum copper and ceruloplasmin'),
    hint: t('Si el uso sistémico se alarga', 'If systemic use is prolonged'),
    target: { type: 'lab' },
  },
  liver: {
    id: 'liver',
    label: t('Función hepática', 'Liver function tests'),
    target: { type: 'lab' },
  },
  gutActivity: {
    id: 'gut_activity',
    label: t('Calprotectina fecal y PCR', 'Faecal calprotectin and CRP'),
    hint: t('Si lo usas por enfermedad inflamatoria intestinal', 'If used for IBD'),
    target: { type: 'lab' },
  },
} satisfies Record<string, MeasureItem>

/* ------------------------------------------------------------------ trial references */

/** One active arm at one time point: mean % body-weight change from baseline. */
export interface TrialArm {
  doseMg: number
  meanPct: number
}

export interface TrialTimepoint {
  week: number
  placeboPct: number
  /** Active arms, any order. */
  arms: readonly TrialArm[]
}

export interface WeightTrialReference {
  trial: string
  year: number
  /** Citation as printed in the wiki; never an invented identifier. */
  source: string
  population: L10n
  regimen: L10n
  outcome: L10n
  /** Longest follow-up of the trial, in weeks. */
  durationWeeks: number
  timepoints: readonly TrialTimepoint[]
  /** Footnotes on specific arms, e.g. pooled arms. */
  armNotes: readonly { doseMg: number; note: L10n }[]
}

export interface TrialOutlook {
  kind: 'trial'
  compoundId: string
  /** One neutral line, from the wiki summary. */
  summary: L10n
  reference: WeightTrialReference
  caveats: readonly L10n[]
  measure: readonly MeasureItem[]
}

export interface NoDataOutlook {
  kind: 'no_human_data'
  compoundId: string
  /** What the mechanism suggests, in one neutral line from the wiki summary. */
  summary: L10n
  /** Where the line comes from. */
  source: string
  measure: readonly MeasureItem[]
}

export type CompoundOutlook = TrialOutlook | NoDataOutlook

/**
 * Retatrutide phase 2 obesity trial (Jastreboff et al., NEJM 2023). Mean % change in
 * body weight from baseline. The 4 mg value pools the 4 mg arms. Cross-checked with the
 * wiki entry (12 mg −24.2 % vs placebo −2.1 % at 48 weeks).
 */
const RETATRUTIDE_PHASE2: WeightTrialReference = {
  trial: 'Retatrutida fase 2 obesidad (Jastreboff et al.)',
  year: 2023,
  source: 'Jastreboff AM et al. NEJM 2023;389:514',
  population: t('Adultos con obesidad, sin diabetes', 'Adults with obesity, without diabetes'),
  regimen: t(
    'Inyección subcutánea semanal durante 48 semanas; brazos de 1, 4, 8 y 12 mg y placebo',
    'Once-weekly subcutaneous injection for 48 weeks; 1, 4, 8 and 12 mg arms and placebo',
  ),
  outcome: t(
    'Cambio medio del peso corporal respecto al inicio',
    'Mean change in body weight from baseline',
  ),
  durationWeeks: 48,
  timepoints: [
    {
      week: 24,
      placeboPct: -1.6,
      arms: [
        { doseMg: 1, meanPct: -7.2 },
        { doseMg: 4, meanPct: -12.9 },
        { doseMg: 8, meanPct: -17.3 },
        { doseMg: 12, meanPct: -17.5 },
      ],
    },
    {
      week: 48,
      placeboPct: -2.1,
      arms: [
        { doseMg: 1, meanPct: -8.7 },
        { doseMg: 4, meanPct: -17.1 },
        { doseMg: 8, meanPct: -22.8 },
        { doseMg: 12, meanPct: -24.2 },
      ],
    },
  ],
  armNotes: [
    {
      doseMg: 4,
      note: t(
        '4 mg: media de los brazos de 4 mg agrupados (distinta dosis de inicio).',
        '4 mg: mean of the pooled 4 mg arms (different starting doses).',
      ),
    },
  ],
}

export const OUTLOOK: Readonly<Record<string, CompoundOutlook>> = {
  retatrutide: {
    kind: 'trial',
    compoundId: 'retatrutide',
    summary: t(
      'Triple agonista GIP/GLP-1/glucagón semanal; en fase 3 (programa TRIUMPH), sin aprobar.',
      'Once-weekly triple GIP/GLP-1/glucagon agonist; in phase 3 (TRIUMPH programme), not approved.',
    ),
    reference: RETATRUTIDE_PHASE2,
    caveats: [
      t(
        'Media de un grupo: dentro de cada brazo hubo personas que perdieron mucho más y otras mucho menos.',
        'A group mean: within each arm some people lost much more and others much less.',
      ),
      t(
        'Tu escalada no es la del ensayo, y el producto del mercado de investigación no es el material del ensayo.',
        'Your escalation is not the trial’s, and research-market product is not the trial material.',
      ),
      t(
        'En el ensayo la pérdida siguió entre las semanas 24 y 48, más despacio que al principio.',
        'In the trial, loss continued between weeks 24 and 48, more slowly than at first.',
      ),
    ],
    measure: [M.weight, M.waist, M.lean, M.bodyFat, M.heartRate, M.bp, M.glucose, M.hba1c],
  },
  'mots-c': {
    kind: 'no_human_data',
    compoundId: 'mots-c',
    summary: t(
      'Péptido mitocondrial que en roedores mejora la sensibilidad a la insulina; en humanos solo hay un fase 1 de un análogo (CB4211), abandonado.',
      'Mitochondrial peptide that improves insulin sensitivity in rodents; in humans there is only a phase 1 of an analogue (CB4211), discontinued.',
    ),
    source: 'Wiki Titra · MOTS-c (Lee et al. 2015; CB4211 fase 1a/1b 2021)',
    measure: [M.glucose, M.hba1c, M.weight, M.waist, M.bodyFat, M.energy],
  },
  'mod-grf-1-29': {
    kind: 'no_human_data',
    compoundId: 'mod-grf-1-29',
    summary: t(
      'Análogo de GHRH de acción corta que estimula pulsos de GH; no hay datos humanos controlados de farmacocinética ni de resultados.',
      'Short-acting GHRH analogue that stimulates GH pulses; there are no controlled human pharmacokinetic or outcome data.',
    ),
    source: 'Wiki Titra · CJC-1295 sin DAC (Mod GRF 1-29)',
    measure: [M.igf1, M.glucose, M.hba1c, M.weight, M.sleep, M.recovery],
  },
  'cjc-1295': {
    kind: 'no_human_data',
    compoundId: 'cjc-1295',
    summary: t(
      'En un fase 1 con adultos sanos elevó GH e IGF-1 durante días; no hay ensayos de composición corporal ni de metabolismo.',
      'In a phase 1 in healthy adults it raised GH and IGF-1 for days; there are no body-composition or metabolic trials.',
    ),
    source: 'Wiki Titra · CJC-1295 con DAC (Teichman, fase 1, 2006)',
    measure: [M.igf1, M.glucose, M.hba1c, M.weight, M.sleep, M.recovery],
  },
  ipamorelin: {
    kind: 'no_human_data',
    compoundId: 'ipamorelin',
    summary: t(
      'Secretagogo selectivo de GH (sin subir cortisol ni prolactina en animales); su único fase 2, en íleo posoperatorio, no superó a placebo.',
      'Selective GH secretagogue (no cortisol or prolactin rise in animals); its only phase 2, in postoperative ileus, did not beat placebo.',
    ),
    source: 'Wiki Titra · Ipamorelina (Raun 1998; Gobburu 1999; Helsinn fase 2)',
    measure: [M.igf1, M.glucose, M.hba1c, M.weight, M.sleep, M.recovery],
  },
  'nad-plus': {
    kind: 'no_human_data',
    compoundId: 'nad-plus',
    summary: t(
      'Coenzima del metabolismo energético; no hay ensayos controlados que muestren beneficio clínico del NAD+ inyectado.',
      'Energy-metabolism coenzyme; no controlled trials show clinical benefit from injected NAD+.',
    ),
    source: 'Wiki Titra · NAD+ (Grant et al. 2019, piloto IV)',
    measure: [M.energy, M.focus, M.sleep, M.bp],
  },
  'ghk-cu': {
    kind: 'no_human_data',
    compoundId: 'ghk-cu',
    summary: t(
      'Tripéptido de uso cosmético tópico; el uso inyectable no tiene ningún dato en humanos.',
      'Tripeptide used in topical cosmetics; injectable use has no human data at all.',
    ),
    source: 'Wiki Titra · GHK-Cu',
    measure: [M.recovery, M.copper, M.liver],
  },
  'bpc-157': {
    kind: 'no_human_data',
    compoundId: 'bpc-157',
    summary: t(
      'Estudiado casi solo en roedores (tendón, músculo, tubo digestivo); no hay ensayos controlados publicados en humanos.',
      'Studied almost only in rodents (tendon, muscle, gut); there are no published controlled human trials.',
    ),
    source: 'Wiki Titra · BPC-157',
    measure: [M.injury, M.recovery],
  },
  'tb-500': {
    kind: 'no_human_data',
    compoundId: 'tb-500',
    summary: t(
      'Fragmento de la timosina β4; el fragmento no tiene datos en humanos y la proteína completa tuvo resultados mixtos.',
      'Thymosin β4 fragment; the fragment has no human data and the full protein had mixed results.',
    ),
    source: 'Wiki Titra · TB-500',
    measure: [M.injury, M.recovery],
  },
  kpv: {
    kind: 'no_human_data',
    compoundId: 'kpv',
    summary: t(
      'Tripéptido antiinflamatorio derivado de la α-MSH; solo datos in vitro y en ratón.',
      'Anti-inflammatory tripeptide derived from α-MSH; in vitro and mouse data only.',
    ),
    source: 'Wiki Titra · KPV',
    measure: [M.gutActivity, M.recovery],
  },
}

export function outlookFor(compoundId: string): CompoundOutlook | undefined {
  return OUTLOOK[compoundId]
}
