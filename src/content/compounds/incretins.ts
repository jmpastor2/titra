import { t, type CompoundDetail } from '../schema'

/**
 * Incretin-class compounds other than semaglutide and tirzepatide (which live in
 * their own files): liraglutide.
 */

// ---------------------------------------------------------------------------
// Approved GLP-1 receptor agonists
// ---------------------------------------------------------------------------

const liraglutide: CompoundDetail = {
  id: 'liraglutide',
  names: {
    generic: 'Liraglutida',
    brands: ['Victoza', 'Saxenda', 'Xultophy (con insulina degludec)'],
    aliases: ['NN2211', 'lira'],
  },
  category: 'incretin',
  pharmClass: t(
    'Agonista del receptor de GLP-1 (acción intermedia, diario)',
    'GLP-1 receptor agonist (intermediate-acting, once daily)',
  ),
  summary: t(
    'Análogo de GLP-1 humano (97% de homología) acilado con ácido palmítico C16 que se une a albúmina y forma heptámeros en el tejido subcutáneo, prolongando la semivida a ~13 h. Primer GLP-1 RA aprobado para obesidad (Saxenda 3 mg) y primero con beneficio cardiovascular demostrado (LEADER).',
    'Human GLP-1 analogue (97% homology) acylated with a C16 palmitic acid that binds albumin and self-associates into heptamers in subcutaneous tissue, extending half-life to ~13 h. First GLP-1 RA approved for obesity (Saxenda 3 mg) and first with proven cardiovascular benefit (LEADER).',
  ),
  mechanism: t(
    'Agonista completo del receptor GLP-1: secreción de insulina dependiente de glucosa, supresión de glucagón, retraso del vaciamiento gástrico (que se atenúa con el uso crónico) y reducción del apetito por acción en núcleo arcuato y área postrema. La sustitución Lys34Arg y la cadena lipídica en Lys26 confieren resistencia parcial a DPP-4.',
    'Full GLP-1 receptor agonist: glucose-dependent insulin secretion, glucagon suppression, delayed gastric emptying (which tachyphylaxes with chronic use) and appetite reduction via arcuate nucleus and area postrema. The Lys34Arg substitution and Lys26 lipid chain confer partial DPP-4 resistance.',
  ),
  indications: [
    t(
      'Diabetes mellitus tipo 2 en adultos y niños ≥10 años (Victoza)',
      'Type 2 diabetes in adults and children ≥10 years (Victoza)',
    ),
    t(
      'Reducción de eventos CV mayores en DM2 con enfermedad CV establecida (Victoza, LEADER)',
      'Major CV event reduction in T2D with established CVD (Victoza, LEADER)',
    ),
    t(
      'Obesidad o sobrepeso con comorbilidad en adultos, adolescentes ≥12 años y niños 6–11 años (Saxenda)',
      'Obesity or overweight with comorbidity in adults, adolescents ≥12 years and children 6–11 years (Saxenda)',
    ),
  ],
  evidence: 'fda_approved',
  regulatory: {
    us: 'approved',
    eu: 'approved',
    notes: t(
      'Genéricos de liraglutida aprobados por la FDA desde 2024 (Victoza) y 2025 (Saxenda); también disponibles en la UE. Sigue siendo referencia de coste en muchos sistemas sanitarios.',
      'Generic liraglutide approved by FDA from 2024 (Victoza) and 2025 (Saxenda); also available in the EU. Remains the cost reference in many health systems.',
    ),
  },
  routes: ['sc'],
  defaultUnit: 'mg',
  pk: {
    halfLifeH: 13,
    tmaxH: 10,
    bioavailability: 0.55,
    apparentVolumeL: 13,
    molarMassGPerMol: 3751.2,
    source:
      'Victoza US label §12.3: t½ ≈ 13 h, tmax 8–12 h, F ≈ 55%, V/F 11–17 L (Saxenda label: 20–25 L). Se usan valores centrales.',
    notes:
      'Estado estacionario a los ~3 días; la fluctuación pico-valle diaria es moderada. El motor usa V ≈ 13 L; con Saxenda las concentraciones reales pueden ser algo menores.',
  },
  dosing: {
    labeled: t(
      'Victoza: 0,6 mg/día ×1 semana (dosis de inicio, no glucémica) → 1,2 mg/día; puede subir a 1,8 mg/día. Saxenda: 0,6 → 1,2 → 1,8 → 2,4 → 3,0 mg/día en escalones semanales; suspender si <4% de pérdida a las 16 semanas con 3 mg. Niños 6–11 (Saxenda): escalar hasta 1,8–3,0 mg según tolerancia.',
      'Victoza: 0.6 mg daily ×1 week (initiation dose, not glycaemic) → 1.2 mg daily; may increase to 1.8 mg daily. Saxenda: 0.6 → 1.2 → 1.8 → 2.4 → 3.0 mg daily in weekly steps; stop if <4% weight loss at 16 weeks on 3 mg. Children 6–11 (Saxenda): escalate to 1.8–3.0 mg as tolerated.',
    ),
    frequency: t(
      '1×/día, a cualquier hora, independiente de comidas',
      'Once daily, any time, independent of meals',
    ),
    templateIds: ['liraglutide-saxenda', 'liraglutide-victoza'],
  },
  reconstitution: t(
    'Plumas precargadas multidosis de 18 mg/3 mL (6 mg/mL); no requiere reconstitución. Agujas de pluma 32G desechables.',
    'Multidose prefilled pens 18 mg/3 mL (6 mg/mL); no reconstitution. Disposable 32G pen needles.',
  ),
  storage: t(
    'Antes del primer uso: nevera 2–8 °C. Tras el primer uso: 30 días a temperatura ambiente (15–30 °C) o en nevera. No congelar; retirar la aguja tras cada uso.',
    'Before first use: refrigerate 2–8 °C. After first use: 30 days at room temperature (15–30 °C) or refrigerated. Do not freeze; remove needle after each use.',
  ),
  adverseEffects: {
    common: [
      t(
        'Náuseas (18–20% en DM2; ~39% con 3 mg), diarrea, vómitos, estreñimiento, dispepsia',
        'Nausea (18–20% in T2D; ~39% at 3 mg), diarrhoea, vomiting, constipation, dyspepsia',
      ),
      t(
        'Cefalea, disminución del apetito, fatiga, mareo',
        'Headache, decreased appetite, fatigue, dizziness',
      ),
      t(
        'Hipoglucemia (con sulfonilureas/insulina; también documentada en no diabéticos con Saxenda)',
        'Hypoglycaemia (with sulfonylureas/insulin; also reported in non-diabetics on Saxenda)',
      ),
      t('Aumento medio de la frecuencia cardíaca 2–3 lpm', 'Mean heart-rate increase 2–3 bpm'),
      t(
        'Reacciones en el punto de inyección; anticuerpos antiliraglutida en ~8,6%',
        'Injection-site reactions; anti-liraglutide antibodies in ~8.6%',
      ),
    ],
    serious: [
      t(
        'Pancreatitis aguda (incluida hemorrágica/necrotizante)',
        'Acute pancreatitis (including haemorrhagic/necrotising)',
      ),
      t(
        'Enfermedad biliar aguda (colelitiasis 1,5–2,5%, colecistitis) con Saxenda',
        'Acute gallbladder disease (cholelithiasis 1.5–2.5%, cholecystitis) with Saxenda',
      ),
      t(
        'Lesión renal aguda secundaria a deshidratación',
        'Acute kidney injury secondary to dehydration',
      ),
      t(
        'Hipersensibilidad grave (anafilaxia, angioedema)',
        'Serious hypersensitivity (anaphylaxis, angioedema)',
      ),
      t(
        'Ideación/conducta suicida: vigilar estado de ánimo (advertencia en Saxenda)',
        'Suicidal ideation/behaviour: monitor mood (Saxenda warning)',
      ),
      t(
        'Retención gástrica/aspiración durante anestesia general',
        'Gastric retention/aspiration during general anaesthesia',
      ),
    ],
  },
  contraindications: [
    t(
      'Antecedente personal o familiar de carcinoma medular de tiroides o MEN2 (recuadro negro: tumores de células C tiroideas en roedores)',
      'Personal or family history of medullary thyroid carcinoma or MEN2 (boxed warning: rodent thyroid C-cell tumours)',
    ),
    t(
      'Hipersensibilidad grave previa a liraglutida o excipientes',
      'Prior serious hypersensitivity to liraglutide or excipients',
    ),
    t(
      'Embarazo (Saxenda); no combinar con otros GLP-1 RA ni Victoza con Saxenda',
      'Pregnancy (Saxenda); do not combine with other GLP-1 RAs nor Victoza with Saxenda',
    ),
  ],
  interactions: [
    t(
      'Insulina y sulfonilureas: reducir dosis para evitar hipoglucemia',
      'Insulin and sulfonylureas: reduce dose to avoid hypoglycaemia',
    ),
    t(
      'Retraso del vaciamiento gástrico: puede alterar la absorción de fármacos orales (paracetamol, atorvastatina, digoxina, lisinopril: cambios sin relevancia clínica en estudios de la ficha)',
      'Delayed gastric emptying may alter oral drug absorption (paracetamol, atorvastatin, digoxin, lisinopril: label studies showed no clinically relevant change)',
    ),
    t(
      'Warfarina: control de INR al iniciar (casos comunicados de aumento con la clase)',
      'Warfarin: INR check on initiation (class reports of INR increase)',
    ),
  ],
  monitoring: [
    t(
      'Peso, HbA1c y glucemia (si DM2); reevaluar Saxenda a las 16 semanas (regla del 4%)',
      'Weight, HbA1c and glucose (if T2D); reassess Saxenda at 16 weeks (4% rule)',
    ),
    t(
      'Frecuencia cardíaca; síntomas de taquicardia sostenida',
      'Heart rate; symptoms of sustained tachycardia',
    ),
    t('Función renal si intolerancia GI intensa', 'Renal function with severe GI intolerance'),
    t('Estado de ánimo/ideación suicida (Saxenda)', 'Mood/suicidal ideation (Saxenda)'),
    t(
      'Crecimiento y maduración puberal en niños y adolescentes',
      'Growth and pubertal maturation in children and adolescents',
    ),
  ],
  keyTrials: [
    {
      name: 'LEADER',
      year: 2016,
      finding: t(
        '−13% de MACE (HR 0,87) y −22% de muerte CV en DM2 con alto riesgo CV; 9.340 pacientes, mediana 3,8 años.',
        '−13% MACE (HR 0.87) and −22% CV death in high-CV-risk T2D; 9,340 patients, median 3.8 years.',
      ),
      ref: 'NEJM 2016;375:311 (NCT01179048)',
    },
    {
      name: 'SCALE Obesity and Prediabetes',
      year: 2015,
      finding: t(
        '−8,0% de peso a 56 semanas con 3 mg vs −2,6% placebo; 63% perdió ≥5%.',
        '−8.0% body weight at 56 weeks with 3 mg vs −2.6% placebo; 63% lost ≥5%.',
      ),
      ref: 'NEJM 2015;373:11 (NCT01272219)',
    },
    {
      name: 'SCALE Diabetes',
      year: 2015,
      finding: t(
        '−6,0% (3 mg) y −4,7% (1,8 mg) vs −2,0% placebo en obesidad con DM2 a 56 semanas.',
        '−6.0% (3 mg) and −4.7% (1.8 mg) vs −2.0% placebo in obesity with T2D at 56 weeks.',
      ),
      ref: 'JAMA 2015;314:687',
    },
    {
      name: 'SCALE Teens',
      year: 2020,
      finding: t(
        'Reducción del IMC −0,23 DE vs placebo en adolescentes 12–17 años; base de la aprobación pediátrica.',
        'BMI SDS −0.23 vs placebo in adolescents 12–17 years; basis of paediatric approval.',
      ),
      ref: 'NEJM 2020;382:2117',
    },
    {
      name: 'SCALE Kids',
      year: 2024,
      finding: t(
        'En niños 6–<12 años, IMC −5,8% vs +1,6% placebo a 56 semanas.',
        'In children 6–<12 years, BMI −5.8% vs +1.6% placebo at 56 weeks.',
      ),
      ref: 'NEJM 2024;391:1581',
    },
    {
      name: 'ELLIPSE',
      year: 2019,
      finding: t(
        'HbA1c −0,64% vs +0,42% placebo en DM2 pediátrica (10–17 años) a 26 semanas.',
        'HbA1c −0.64% vs +0.42% placebo in paediatric T2D (10–17 years) at 26 weeks.',
      ),
      ref: 'NEJM 2019;381:637',
    },
  ],
  references: [
    {
      label: 'Victoza US Prescribing Information (Novo Nordisk)',
      url: 'https://www.novo-pi.com/victoza.pdf',
    },
    {
      label: 'Saxenda US Prescribing Information (Novo Nordisk)',
      url: 'https://www.novo-pi.com/saxenda.pdf',
    },
    { label: 'EMA EPAR Saxenda', url: 'https://www.ema.europa.eu/en/medicines/human/EPAR/saxenda' },
    { label: 'EMA EPAR Victoza', url: 'https://www.ema.europa.eu/en/medicines/human/EPAR/victoza' },
  ],
  tags: ['glp1', 'obesidad', 'dm2', 'cardiovascular', 'diario', 'pediatría', 'genérico'],
  lastReviewed: '2026-09-19',
}

export const INCRETINS: CompoundDetail[] = [liraglutide]
