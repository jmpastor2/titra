/**
 * Protocol templates from approved labels and published trial arms.
 * The app never recommends a dose: templates are starting points that the
 * prescriber chooses and edits. Anything not label-based is tagged accordingly.
 */
import { t, type ProtocolTemplate } from '../schema'

export const PROTOCOL_TEMPLATES: readonly ProtocolTemplate[] = [
  {
    id: 'semaglutide-wegovy',
    compoundId: 'semaglutide',
    name: t(
      'Semaglutida 2,4 mg (Wegovy) · escalada estándar',
      'Semaglutide 2.4 mg (Wegovy) · standard escalation',
    ),
    source: t('Ficha técnica Wegovy §2.2', 'Wegovy label §2.2'),
    evidence: 'fda_approved',
    route: 'sc',
    unit: 'mg',
    steps: [
      { doseMg: 0.25, intervalDays: 7, durationWeeks: 4, label: 'Semanas 1–4' },
      { doseMg: 0.5, intervalDays: 7, durationWeeks: 4, label: 'Semanas 5–8' },
      { doseMg: 1.0, intervalDays: 7, durationWeeks: 4, label: 'Semanas 9–12' },
      { doseMg: 1.7, intervalDays: 7, durationWeeks: 4, label: 'Semanas 13–16' },
      { doseMg: 2.4, intervalDays: 7, durationWeeks: null, label: 'Mantenimiento' },
    ],
    notes: t(
      'Si no se tolera un escalón, la ficha técnica permite retrasar la escalada 4 semanas más. 1,7 mg puede usarse como mantenimiento si 2,4 mg no se tolera.',
      'If a step is not tolerated, the label allows delaying escalation by 4 more weeks. 1.7 mg may be used as maintenance if 2.4 mg is not tolerated.',
    ),
  },
  {
    id: 'semaglutide-ozempic',
    compoundId: 'semaglutide',
    name: t('Semaglutida (Ozempic) · DM2 hasta 2 mg', 'Semaglutide (Ozempic) · T2D up to 2 mg'),
    source: t('Ficha técnica Ozempic §2.1', 'Ozempic label §2.1'),
    evidence: 'fda_approved',
    route: 'sc',
    unit: 'mg',
    steps: [
      { doseMg: 0.25, intervalDays: 7, durationWeeks: 4, label: 'Inicio' },
      { doseMg: 0.5, intervalDays: 7, durationWeeks: 4 },
      { doseMg: 1.0, intervalDays: 7, durationWeeks: 4 },
      { doseMg: 2.0, intervalDays: 7, durationWeeks: null, label: 'Mantenimiento' },
    ],
    notes: t(
      'Cada dosis puede mantenerse como dosis de mantenimiento según control glucémico.',
      'Any dose may be kept as maintenance depending on glycaemic control.',
    ),
  },
  {
    id: 'semaglutide-rybelsus',
    compoundId: 'semaglutide',
    name: t('Semaglutida oral (Rybelsus)', 'Oral semaglutide (Rybelsus)'),
    source: t('Ficha técnica Rybelsus §2.1', 'Rybelsus label §2.1'),
    evidence: 'fda_approved',
    route: 'oral',
    unit: 'mg',
    steps: [
      { doseMg: 3, intervalDays: 1, durationWeeks: 4, label: 'Inicio (30 días)' },
      { doseMg: 7, intervalDays: 1, durationWeeks: 4 },
      { doseMg: 14, intervalDays: 1, durationWeeks: null, label: 'Mantenimiento' },
    ],
    notes: t(
      'Tomar en ayunas con ≤120 mL de agua y esperar 30 min antes de comer o tomar otros fármacos. La curva PK del motor no aplica a la vía oral.',
      'Take fasting with ≤120 mL water and wait 30 min before food or other drugs. The PK engine curve does not apply to the oral route.',
    ),
  },
  {
    id: 'tirzepatide-standard',
    compoundId: 'tirzepatide',
    name: t(
      'Tirzepatida · escalada estándar hasta 15 mg',
      'Tirzepatide · standard escalation to 15 mg',
    ),
    source: t('Ficha técnica Zepbound/Mounjaro §2', 'Zepbound/Mounjaro label §2'),
    evidence: 'fda_approved',
    route: 'sc',
    unit: 'mg',
    steps: [
      { doseMg: 2.5, intervalDays: 7, durationWeeks: 4, label: 'Inicio' },
      { doseMg: 5, intervalDays: 7, durationWeeks: 4 },
      { doseMg: 7.5, intervalDays: 7, durationWeeks: 4 },
      { doseMg: 10, intervalDays: 7, durationWeeks: 4 },
      { doseMg: 12.5, intervalDays: 7, durationWeeks: 4 },
      { doseMg: 15, intervalDays: 7, durationWeeks: null, label: 'Mantenimiento' },
    ],
    notes: t(
      '5, 10 y 15 mg son dosis de mantenimiento válidas; escalar solo si se necesita más efecto.',
      '5, 10 and 15 mg are all valid maintenance doses; escalate only when more effect is needed.',
    ),
  },
  {
    id: 'tirzepatide-slow',
    compoundId: 'tirzepatide',
    name: t(
      'Tirzepatida · escalada lenta (8 semanas/escalón)',
      'Tirzepatide · slow escalation (8 weeks/step)',
    ),
    source: t(
      'Adaptación de ficha técnica para intolerancia GI',
      'Label adaptation for GI intolerance',
    ),
    evidence: 'fda_approved',
    route: 'sc',
    unit: 'mg',
    steps: [
      { doseMg: 2.5, intervalDays: 7, durationWeeks: 8 },
      { doseMg: 5, intervalDays: 7, durationWeeks: 8 },
      { doseMg: 7.5, intervalDays: 7, durationWeeks: 8 },
      { doseMg: 10, intervalDays: 7, durationWeeks: null, label: 'Mantenimiento' },
    ],
  },
  {
    id: 'liraglutide-saxenda',
    compoundId: 'liraglutide',
    name: t('Liraglutida 3 mg (Saxenda)', 'Liraglutide 3 mg (Saxenda)'),
    source: t('Ficha técnica Saxenda §2.1', 'Saxenda label §2.1'),
    evidence: 'fda_approved',
    route: 'sc',
    unit: 'mg',
    steps: [
      { doseMg: 0.6, intervalDays: 1, durationWeeks: 1 },
      { doseMg: 1.2, intervalDays: 1, durationWeeks: 1 },
      { doseMg: 1.8, intervalDays: 1, durationWeeks: 1 },
      { doseMg: 2.4, intervalDays: 1, durationWeeks: 1 },
      { doseMg: 3.0, intervalDays: 1, durationWeeks: null, label: 'Mantenimiento' },
    ],
  },
  {
    id: 'liraglutide-victoza',
    compoundId: 'liraglutide',
    name: t('Liraglutida (Victoza) · DM2', 'Liraglutide (Victoza) · T2D'),
    source: t('Ficha técnica Victoza §2.1', 'Victoza label §2.1'),
    evidence: 'fda_approved',
    route: 'sc',
    unit: 'mg',
    steps: [
      { doseMg: 0.6, intervalDays: 1, durationWeeks: 1 },
      { doseMg: 1.2, intervalDays: 1, durationWeeks: 1 },
      { doseMg: 1.8, intervalDays: 1, durationWeeks: null, label: 'Mantenimiento' },
    ],
  },
  {
    id: 'dulaglutide-trulicity',
    compoundId: 'dulaglutide',
    name: t('Dulaglutida (Trulicity)', 'Dulaglutide (Trulicity)'),
    source: t('Ficha técnica Trulicity §2.1', 'Trulicity label §2.1'),
    evidence: 'fda_approved',
    route: 'sc',
    unit: 'mg',
    steps: [
      { doseMg: 0.75, intervalDays: 7, durationWeeks: 4 },
      { doseMg: 1.5, intervalDays: 7, durationWeeks: 4 },
      { doseMg: 3.0, intervalDays: 7, durationWeeks: 4 },
      { doseMg: 4.5, intervalDays: 7, durationWeeks: null, label: 'Máximo' },
    ],
  },
  {
    id: 'retatrutide-triumph',
    compoundId: 'retatrutide',
    name: t('Retatrutida · brazo 12 mg (fase 2/3)', 'Retatrutide · 12 mg arm (phase 2/3)'),
    source: t(
      'Ensayo fase 2 NEJM 2023 / programa TRIUMPH',
      'Phase 2 NEJM 2023 / TRIUMPH programme',
    ),
    evidence: 'phase3',
    route: 'sc',
    unit: 'mg',
    steps: [
      { doseMg: 2, intervalDays: 7, durationWeeks: 4 },
      { doseMg: 4, intervalDays: 7, durationWeeks: 4 },
      { doseMg: 8, intervalDays: 7, durationWeeks: 4 },
      { doseMg: 12, intervalDays: 7, durationWeeks: null, label: 'Mantenimiento' },
    ],
    notes: t(
      'Fármaco en investigación; sin dosis aprobada. Solo referencia de ensayo.',
      'Investigational; no approved dose. Trial reference only.',
    ),
  },
  {
    id: 'cagrisema-redefine',
    compoundId: 'cagrisema',
    name: t('CagriSema 2,4/2,4 mg (REDEFINE)', 'CagriSema 2.4/2.4 mg (REDEFINE)'),
    source: t('Programa REDEFINE fase 3', 'REDEFINE phase 3 programme'),
    evidence: 'phase3',
    route: 'sc',
    unit: 'mg',
    steps: [
      { doseMg: 0.25, intervalDays: 7, durationWeeks: 4, label: '0,25/0,25' },
      { doseMg: 0.5, intervalDays: 7, durationWeeks: 4, label: '0,5/0,5' },
      { doseMg: 1.0, intervalDays: 7, durationWeeks: 4, label: '1,0/1,0' },
      { doseMg: 1.7, intervalDays: 7, durationWeeks: 4, label: '1,7/1,7' },
      { doseMg: 2.4, intervalDays: 7, durationWeeks: null, label: '2,4/2,4 mantenimiento' },
    ],
    notes: t(
      'La dosis indica mg de cada componente (cagrilintida/semaglutida).',
      'Dose shown is mg of each component (cagrilintide/semaglutide).',
    ),
  },
]

export const templatesForCompound = (compoundId: string): ProtocolTemplate[] =>
  PROTOCOL_TEMPLATES.filter((p) => p.compoundId === compoundId)

export const templateById = (id: string): ProtocolTemplate | undefined =>
  PROTOCOL_TEMPLATES.find((p) => p.id === id)
