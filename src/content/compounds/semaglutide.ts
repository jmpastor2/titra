import { t, type CompoundEntry } from '../schema'

export const semaglutide: CompoundEntry = {
  id: 'semaglutide',
  names: {
    generic: 'Semaglutida',
    brands: ['Ozempic', 'Wegovy', 'Rybelsus'],
    aliases: ['NN9535', 'sema'],
  },
  category: 'incretin',
  pharmClass: t(
    'Agonista del receptor de GLP-1 (acción prolongada)',
    'Long-acting GLP-1 receptor agonist',
  ),
  summary: t(
    'Análogo de GLP-1 humano con semivida de ~1 semana gracias a la acilación con ácido graso C18 y unión a albúmina. Aprobado para diabetes tipo 2, obesidad y reducción de riesgo cardiovascular.',
    'Human GLP-1 analogue with a ~1-week half-life through C18 fatty-acid acylation and albumin binding. Approved for type 2 diabetes, obesity and cardiovascular risk reduction.',
  ),
  mechanism: t(
    'Activa el receptor GLP-1: aumenta la secreción de insulina dependiente de glucosa, suprime el glucagón, retrasa el vaciamiento gástrico y reduce el apetito por acción hipotalámica. La sustitución Aib8 lo protege de la DPP-4.',
    'Activates the GLP-1 receptor: glucose-dependent insulin secretion, glucagon suppression, delayed gastric emptying and hypothalamic appetite reduction. The Aib8 substitution protects it from DPP-4.',
  ),
  indications: [
    t(
      'Diabetes mellitus tipo 2 (Ozempic, Rybelsus)',
      'Type 2 diabetes mellitus (Ozempic, Rybelsus)',
    ),
    t(
      'Obesidad o sobrepeso con comorbilidad (Wegovy)',
      'Obesity or overweight with comorbidity (Wegovy)',
    ),
    t(
      'Reducción de eventos cardiovasculares mayores (SELECT, SUSTAIN-6)',
      'Major cardiovascular event reduction (SELECT, SUSTAIN-6)',
    ),
    t('Enfermedad renal crónica en DM2 (FLOW)', 'Chronic kidney disease in T2D (FLOW)'),
    t(
      'MASH con fibrosis (ESSENCE, aprobación 2025)',
      'MASH with fibrosis (ESSENCE, approved 2025)',
    ),
  ],
  evidence: 'fda_approved',
  regulatory: {
    us: 'approved',
    eu: 'approved',
    notes: t(
      'Versiones compuestas (compounded) existieron en EE. UU. durante el desabastecimiento; la FDA retiró la semaglutida de la lista de escasez en 2025, limitando la formulación magistral.',
      'Compounded versions existed in the US during the shortage; FDA removed semaglutide from the shortage list in 2025, restricting compounding.',
    ),
  },
  routes: ['sc', 'oral'],
  defaultUnit: 'mg',
  pk: {
    halfLifeH: 168,
    tmaxH: 48,
    bioavailability: 0.89,
    apparentVolumeL: 12.5,
    molarMassGPerMol: 4113.6,
    source: 'Ozempic/Wegovy US label §12.3: t½ ≈ 1 semana, tmax 1–3 días, F 89%, V ≈ 12.5 L',
    notes:
      'La formulación oral (Rybelsus) tiene F ~1% y cinética distinta; el motor modela la vía subcutánea.',
  },
  dosing: {
    labeled: t(
      'Ozempic: 0,25 mg/semana ×4 sem → 0,5 mg; puede subir a 1 mg y 2 mg cada ≥4 sem. Wegovy: 0,25 → 0,5 → 1 → 1,7 → 2,4 mg/semana en escalones de 4 semanas. Rybelsus: 3 mg/día ×30 d → 7 mg → 14 mg.',
      'Ozempic: 0.25 mg weekly ×4 wk → 0.5 mg; may increase to 1 mg and 2 mg at ≥4-week intervals. Wegovy: 0.25 → 0.5 → 1 → 1.7 → 2.4 mg weekly in 4-week steps. Rybelsus: 3 mg daily ×30 d → 7 mg → 14 mg.',
    ),
    frequency: t('1×/semana (SC) · 1×/día (oral)', 'Once weekly (SC) · once daily (oral)'),
    templateIds: ['semaglutide-wegovy', 'semaglutide-ozempic', 'semaglutide-rybelsus'],
  },
  reconstitution: t(
    'Plumas precargadas listas para usar; no requiere reconstitución. Viales magistrales (p. ej. 5 mg/2 mL) se dosifican en jeringa U-100: 0,25 mg = 10 U a 2,5 mg/mL.',
    'Ready-to-use prefilled pens; no reconstitution. Compounded vials (e.g. 5 mg/2 mL) are drawn in U-100 syringes: 0.25 mg = 10 U at 2.5 mg/mL.',
  ),
  storage: t(
    'Antes del primer uso: nevera 2–8 °C. Tras el primer uso: 56 días a temperatura ambiente (<30 °C) o en nevera. No congelar; proteger de la luz.',
    'Before first use: refrigerate 2–8 °C. After first use: 56 days at room temperature (<30 °C) or refrigerated. Do not freeze; protect from light.',
  ),
  adverseEffects: {
    common: [
      t(
        'Náuseas (hasta 44% con 2,4 mg), vómitos, diarrea, estreñimiento',
        'Nausea (up to 44% at 2.4 mg), vomiting, diarrhoea, constipation',
      ),
      t(
        'Dolor abdominal, dispepsia, eructos, reflujo',
        'Abdominal pain, dyspepsia, belching, reflux',
      ),
      t('Fatiga, cefalea, mareo', 'Fatigue, headache, dizziness'),
      t('Reacciones en el punto de inyección', 'Injection-site reactions'),
    ],
    serious: [
      t('Pancreatitis aguda', 'Acute pancreatitis'),
      t(
        'Colelitiasis y colecistitis (más frecuente con pérdida rápida de peso)',
        'Gallstones and cholecystitis (more frequent with rapid weight loss)',
      ),
      t(
        'Hipoglucemia si se combina con insulina o sulfonilureas',
        'Hypoglycaemia when combined with insulin or sulfonylureas',
      ),
      t(
        'Empeoramiento de retinopatía diabética (SUSTAIN-6)',
        'Worsening of diabetic retinopathy (SUSTAIN-6)',
      ),
      t('Lesión renal aguda por deshidratación', 'Acute kidney injury from dehydration'),
      t(
        'Íleo / retención gástrica; riesgo de aspiración en anestesia',
        'Ileus / gastric retention; aspiration risk under anaesthesia',
      ),
      t(
        'Ideación suicida (vigilancia; sin señal confirmada en FDA 2024)',
        'Suicidal ideation (monitor; no confirmed signal, FDA 2024)',
      ),
    ],
  },
  contraindications: [
    t(
      'Antecedente personal o familiar de carcinoma medular de tiroides o MEN2 (recuadro negro por tumores de células C en roedores)',
      'Personal or family history of medullary thyroid carcinoma or MEN2 (boxed warning: rodent C-cell tumours)',
    ),
    t('Hipersensibilidad grave previa', 'Prior serious hypersensitivity'),
    t(
      'Embarazo: suspender ≥2 meses antes de la concepción',
      'Pregnancy: discontinue ≥2 months before conception',
    ),
  ],
  interactions: [
    t(
      'Insulina y secretagogos: reducir dosis para evitar hipoglucemia',
      'Insulin and secretagogues: reduce dose to avoid hypoglycaemia',
    ),
    t(
      'Fármacos orales de ventana terapéutica estrecha (levotiroxina, warfarin): vigilar por vaciado gástrico retrasado',
      'Narrow-therapeutic-index oral drugs (levothyroxine, warfarin): monitor due to delayed gastric emptying',
    ),
    t(
      'Anticonceptivos orales: sin interacción relevante con SC; con Rybelsus se recomienda precaución',
      'Oral contraceptives: no relevant interaction with SC; caution advised with Rybelsus',
    ),
  ],
  monitoring: [
    t('Peso, HbA1c, glucemia (si DM2)', 'Weight, HbA1c, glucose (if T2D)'),
    t('Función renal si vómitos/diarrea intensos', 'Renal function with severe vomiting/diarrhoea'),
    t('Fondo de ojo basal en retinopatía conocida', 'Baseline retinal exam if known retinopathy'),
    t('Lipasa solo si síntomas de pancreatitis', 'Lipase only with pancreatitis symptoms'),
    t(
      'Composición corporal / masa magra durante la pérdida de peso',
      'Body composition / lean mass during weight loss',
    ),
  ],
  keyTrials: [
    {
      name: 'STEP 1',
      year: 2021,
      finding: t(
        '−14,9% de peso a 68 semanas con 2,4 mg vs −2,4% placebo en obesidad sin diabetes.',
        '−14.9% body weight at 68 weeks with 2.4 mg vs −2.4% placebo in obesity without diabetes.',
      ),
      ref: 'NEJM 2021;384:989 (NCT03548935)',
    },
    {
      name: 'SUSTAIN-6',
      year: 2016,
      finding: t(
        'Reducción del 26% de eventos CV mayores en DM2 con alto riesgo.',
        '26% reduction in major CV events in high-risk T2D.',
      ),
      ref: 'NEJM 2016;375:1834',
    },
    {
      name: 'SELECT',
      year: 2023,
      finding: t(
        '−20% de MACE en obesidad con enfermedad CV establecida sin diabetes.',
        '−20% MACE in obesity with established CVD without diabetes.',
      ),
      ref: 'NEJM 2023;389:2221 (NCT03574597)',
    },
    {
      name: 'FLOW',
      year: 2024,
      finding: t(
        '−24% de eventos renales mayores en DM2 con ERC.',
        '−24% major kidney events in T2D with CKD.',
      ),
      ref: 'NEJM 2024;391:109',
    },
    {
      name: 'STEP 5',
      year: 2022,
      finding: t(
        'Pérdida de peso mantenida (−15,2%) a 104 semanas.',
        'Weight loss sustained (−15.2%) at 104 weeks.',
      ),
      ref: 'Nat Med 2022;28:2083',
    },
  ],
  references: [
    {
      label: 'Wegovy US Prescribing Information (Novo Nordisk)',
      url: 'https://www.novo-pi.com/wegovy.pdf',
    },
    {
      label: 'Ozempic US Prescribing Information (Novo Nordisk)',
      url: 'https://www.novo-pi.com/ozempic.pdf',
    },
    {
      label: 'Rybelsus US Prescribing Information (Novo Nordisk)',
      url: 'https://www.novo-pi.com/rybelsus.pdf',
    },
    { label: 'EMA EPAR Ozempic', url: 'https://www.ema.europa.eu/en/medicines/human/EPAR/ozempic' },
  ],
  tags: ['glp1', 'obesidad', 'dm2', 'cardiovascular', 'semanal'],
  lastReviewed: '2026-09-19',
}
