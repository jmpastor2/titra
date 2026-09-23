import { t, type CompoundEntry } from '../schema'

/**
 * Incretin-class compounds other than semaglutide and tirzepatide (which live in
 * their own files): approved GLP-1 RAs, amylin analogues, multi-agonists in
 * development, oral small molecules, and historical/withdrawn agents.
 * Setmelanotide (MC4R agonist) is included here for editorial convenience but
 * carries category 'metabolic'.
 */

// ---------------------------------------------------------------------------
// Approved GLP-1 receptor agonists
// ---------------------------------------------------------------------------

const liraglutide: CompoundEntry = {
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

const dulaglutide: CompoundEntry = {
  id: 'dulaglutide',
  names: {
    generic: 'Dulaglutida',
    brands: ['Trulicity'],
    aliases: ['LY2189265', 'dula'],
  },
  category: 'incretin',
  pharmClass: t(
    'Agonista del receptor de GLP-1 (proteína de fusión Fc, semanal)',
    'GLP-1 receptor agonist (Fc fusion protein, once weekly)',
  ),
  summary: t(
    'Proteína de fusión de ~60 kDa: dos análogos de GLP-1 modificados unidos a un fragmento Fc de IgG4 humana. El tamaño reduce el aclaramiento renal y la resistencia a DPP-4 permite administración semanal. Beneficio CV demostrado en una población mayoritariamente en prevención primaria (REWIND).',
    '~60 kDa fusion protein: two modified GLP-1 analogues linked to a human IgG4 Fc fragment. Size reduces renal clearance and DPP-4 resistance permits once-weekly dosing. CV benefit shown in a mostly primary-prevention population (REWIND).',
  ),
  mechanism: t(
    'Activación del receptor GLP-1 con secreción de insulina dependiente de glucosa, supresión de glucagón, enlentecimiento del vaciamiento gástrico (menor que con agentes de acción corta por taquifilaxia) y reducción del apetito. Las sustituciones Gly8, Glu22 y Gly36 protegen de la DPP-4; el Fc IgG4 se modificó para eliminar la función efectora.',
    'GLP-1 receptor activation with glucose-dependent insulin secretion, glucagon suppression, slowed gastric emptying (less than short-acting agents due to tachyphylaxis) and appetite reduction. Gly8, Glu22 and Gly36 substitutions protect against DPP-4; the IgG4 Fc was engineered to remove effector function.',
  ),
  indications: [
    t(
      'Diabetes mellitus tipo 2 en adultos y niños ≥10 años',
      'Type 2 diabetes in adults and children ≥10 years',
    ),
    t(
      'Reducción de MACE en DM2 con enfermedad CV establecida o múltiples factores de riesgo (REWIND)',
      'MACE reduction in T2D with established CVD or multiple risk factors (REWIND)',
    ),
    t(
      'Uso fuera de ficha en obesidad sin diabetes (eficacia ponderal modesta, −4 a −5 kg con 4,5 mg)',
      'Off-label in obesity without diabetes (modest weight efficacy, −4 to −5 kg at 4.5 mg)',
    ),
  ],
  evidence: 'fda_approved',
  regulatory: {
    us: 'approved',
    eu: 'approved',
    notes: t(
      'Dosis altas 3 mg y 4,5 mg aprobadas en 2020 (AWARD-11). Comparador activo en SURPASS-CVOT frente a tirzepatida (2025).',
      'High doses 3 mg and 4.5 mg approved in 2020 (AWARD-11). Active comparator in SURPASS-CVOT versus tirzepatide (2025).',
    ),
  },
  routes: ['sc'],
  defaultUnit: 'mg',
  pk: {
    halfLifeH: 120,
    tmaxH: 48,
    bioavailability: 0.47,
    apparentVolumeL: 9.1,
    molarMassGPerMol: 59670,
    source:
      'Trulicity US label §12.3: t½ ≈ 5 días, tmax 24–72 h (mediana 48 h), F absoluta 65% (0,75 mg) y 47% (1,5 mg), V central 3,09 L + periférico 5,98 L, MW ≈ 59,7 kDa',
    notes:
      'Estado estacionario a las 2–4 semanas. Degradación por catabolismo proteico general, no renal ni hepática: sin ajuste en insuficiencia renal o hepática.',
  },
  dosing: {
    labeled: t(
      '0,75 mg/semana (inicio) → 1,5 mg/semana. Puede aumentarse a 3 mg y después 4,5 mg en intervalos de ≥4 semanas si se requiere mayor control glucémico. Niños ≥10 años: 0,75 mg → 1,5 mg (máx. 1,5 mg). Dosis olvidada: administrar si faltan ≥3 días para la siguiente.',
      '0.75 mg weekly (initiation) → 1.5 mg weekly. May increase to 3 mg then 4.5 mg at ≥4-week intervals if additional glycaemic control needed. Children ≥10 years: 0.75 mg → 1.5 mg (max 1.5 mg). Missed dose: give if ≥3 days remain before the next dose.',
    ),
    frequency: t(
      '1×/semana, cualquier hora, con o sin comida',
      'Once weekly, any time, with or without food',
    ),
    templateIds: ['dulaglutide-trulicity'],
  },
  reconstitution: t(
    'Pluma monodosis desechable con aguja oculta (0,75 · 1,5 · 3 · 4,5 mg en 0,5 mL); solución lista, sin reconstitución. También jeringa precargada en algunos mercados.',
    'Single-dose disposable pen with hidden needle (0.75 · 1.5 · 3 · 4.5 mg in 0.5 mL); ready solution, no reconstitution. Prefilled syringe in some markets.',
  ),
  storage: t(
    'Nevera 2–8 °C en el envase original. Puede mantenerse a temperatura ambiente (<30 °C) hasta 14 días. No congelar; no usar si ha estado congelado. Proteger de la luz.',
    'Refrigerate 2–8 °C in original carton. May be kept at room temperature (<30 °C) up to 14 days. Do not freeze; discard if frozen. Protect from light.',
  ),
  adverseEffects: {
    common: [
      t(
        'Náuseas (12–21%, dosis-dependiente), diarrea (9–13%), vómitos, dolor abdominal, disminución del apetito, dispepsia',
        'Nausea (12–21%, dose-dependent), diarrhoea (9–13%), vomiting, abdominal pain, decreased appetite, dyspepsia',
      ),
      t('Fatiga, eructos, flatulencia', 'Fatigue, belching, flatulence'),
      t(
        'Taquicardia sinusal (aumento medio 2–4 lpm) y prolongación leve del PR',
        'Sinus tachycardia (mean increase 2–4 bpm) and mild PR prolongation',
      ),
      t(
        'Reacciones en el punto de inyección (0,5%); anticuerpos antifármaco en 1–2%',
        'Injection-site reactions (0.5%); anti-drug antibodies in 1–2%',
      ),
    ],
    serious: [
      t('Pancreatitis aguda', 'Acute pancreatitis'),
      t(
        'Hipoglucemia grave con insulina/sulfonilureas',
        'Severe hypoglycaemia with insulin/sulfonylureas',
      ),
      t(
        'Hipersensibilidad grave (anafilaxia, angioedema)',
        'Serious hypersensitivity (anaphylaxis, angioedema)',
      ),
      t('Lesión renal aguda por depleción de volumen', 'Acute kidney injury from volume depletion'),
      t(
        'Complicaciones de retinopatía diabética (REWIND: HR 1,24, no significativo)',
        'Diabetic retinopathy complications (REWIND: HR 1.24, non-significant)',
      ),
      t('Enfermedad aguda de vesícula biliar', 'Acute gallbladder disease'),
      t(
        'Enfermedad GI grave: no recomendado en gastroparesia grave',
        'Severe GI disease: not recommended in severe gastroparesis',
      ),
    ],
  },
  contraindications: [
    t(
      'Antecedente personal o familiar de carcinoma medular de tiroides o MEN2 (recuadro negro)',
      'Personal or family history of medullary thyroid carcinoma or MEN2 (boxed warning)',
    ),
    t(
      'Hipersensibilidad grave conocida a dulaglutida',
      'Known serious hypersensitivity to dulaglutide',
    ),
  ],
  interactions: [
    t(
      'Insulina y secretagogos: reducir dosis al iniciar',
      'Insulin and secretagogues: reduce dose on initiation',
    ),
    t(
      'Fármacos orales: retraso del vaciamiento gástrico; en estudios de la ficha no hubo cambios clínicamente relevantes (paracetamol, digoxina, lisinopril, metformina, sitagliptina, warfarina, anticonceptivos)',
      'Oral drugs: delayed gastric emptying; label studies showed no clinically relevant change (paracetamol, digoxin, lisinopril, metformin, sitagliptin, warfarin, oral contraceptives)',
    ),
  ],
  monitoring: [
    t('HbA1c, glucemia y peso', 'HbA1c, glucose and weight'),
    t(
      'Frecuencia cardíaca en cardiopatía o arritmias previas',
      'Heart rate in prior heart disease or arrhythmia',
    ),
    t(
      'Fondo de ojo en retinopatía conocida, sobre todo con descenso rápido de HbA1c',
      'Retinal exam in known retinopathy, especially with rapid HbA1c fall',
    ),
    t('Función renal ante intolerancia GI intensa', 'Renal function with severe GI intolerance'),
  ],
  keyTrials: [
    {
      name: 'REWIND',
      year: 2019,
      finding: t(
        '−12% de MACE (HR 0,88) en 9.901 pacientes con DM2, 69% sin enfermedad CV previa; mediana 5,4 años; también reducción de ictus no fatal.',
        '−12% MACE (HR 0.88) in 9,901 T2D patients, 69% without prior CVD; median 5.4 years; also fewer non-fatal strokes.',
      ),
      ref: 'Lancet 2019;394:121 (NCT01394952)',
    },
    {
      name: 'AWARD-11',
      year: 2020,
      finding: t(
        '3 mg y 4,5 mg redujeron HbA1c (−1,7 y −1,9%) y peso (−4,0 y −4,7 kg) más que 1,5 mg a 36 semanas.',
        '3 mg and 4.5 mg reduced HbA1c (−1.7 and −1.9%) and weight (−4.0 and −4.7 kg) more than 1.5 mg at 36 weeks.',
      ),
      ref: 'Diabetes Care 2021;44:765',
    },
    {
      name: 'AWARD-6',
      year: 2014,
      finding: t(
        'No inferior a liraglutida 1,8 mg en HbA1c a 26 semanas.',
        'Non-inferior to liraglutide 1.8 mg for HbA1c at 26 weeks.',
      ),
      ref: 'Lancet 2014;384:1349',
    },
    {
      name: 'AWARD-7',
      year: 2018,
      finding: t(
        'En ERC moderada-grave, HbA1c similar a insulina glargina con menor caída del FGe y menos hipoglucemias.',
        'In moderate-severe CKD, similar HbA1c to insulin glargine with smaller eGFR decline and less hypoglycaemia.',
      ),
      ref: 'Lancet Diabetes Endocrinol 2018;6:605',
    },
    {
      name: 'AWARD-PEDS',
      year: 2022,
      finding: t(
        'HbA1c −0,8% vs +0,6% placebo en jóvenes 10–17 años con DM2 a 26 semanas.',
        'HbA1c −0.8% vs +0.6% placebo in youth 10–17 years with T2D at 26 weeks.',
      ),
      ref: 'NEJM 2022;387:433',
    },
  ],
  references: [
    {
      label: 'Trulicity US Prescribing Information (Lilly)',
      url: 'https://pi.lilly.com/us/trulicity-uspi.pdf',
    },
    {
      label: 'EMA EPAR Trulicity',
      url: 'https://www.ema.europa.eu/en/medicines/human/EPAR/trulicity',
    },
  ],
  tags: ['glp1', 'dm2', 'cardiovascular', 'semanal', 'pediatría'],
  lastReviewed: '2026-09-19',
}

const exenatide: CompoundEntry = {
  id: 'exenatide',
  names: {
    generic: 'Exenatida',
    brands: [
      'Byetta (liberación inmediata)',
      'Bydureon BCise (liberación prolongada)',
      'Bydureon (retirado)',
    ],
    aliases: ['exendin-4 sintética', 'AC2993', 'exenatide ER'],
  },
  category: 'incretin',
  pharmClass: t(
    'Agonista del receptor de GLP-1 (exendina; formulaciones IR dos veces al día y ER semanal)',
    'GLP-1 receptor agonist (exendin-based; IR twice daily and ER once weekly formulations)',
  ),
  summary: t(
    'Versión sintética de la exendina-4 de la saliva del lagarto Heloderma suspectum (53% de homología con GLP-1 humano), resistente a DPP-4 pero de eliminación renal rápida (t½ 2,4 h). Byetta se inyecta antes de las comidas; Bydureon BCise encapsula el péptido en microesferas de PLGA para liberación semanal. Primer GLP-1 RA aprobado (2005).',
    'Synthetic version of exendin-4 from Heloderma suspectum lizard saliva (53% homology with human GLP-1), DPP-4 resistant but rapidly renally cleared (t½ 2.4 h). Byetta is injected before meals; Bydureon BCise encapsulates the peptide in PLGA microspheres for weekly release. First approved GLP-1 RA (2005).',
  ),
  mechanism: t(
    'Agonista del receptor GLP-1: aumenta la secreción de insulina de la primera fase dependiente de glucosa, suprime el glucagón posprandial, retrasa marcadamente el vaciamiento gástrico (efecto que domina en la formulación IR y reduce la glucemia posprandial) y disminuye la ingesta. Eliminación por filtración glomerular y proteólisis; sin acilación ni unión a albúmina.',
    'GLP-1 receptor agonist: restores glucose-dependent first-phase insulin secretion, suppresses postprandial glucagon, markedly delays gastric emptying (dominant effect of the IR formulation, lowering postprandial glucose) and reduces intake. Eliminated by glomerular filtration and proteolysis; no acylation or albumin binding.',
  ),
  indications: [
    t(
      'Diabetes mellitus tipo 2 en adultos (Byetta, Bydureon BCise)',
      'Type 2 diabetes in adults (Byetta, Bydureon BCise)',
    ),
    t(
      'DM2 pediátrica ≥10 años (Bydureon BCise, 2021)',
      'Paediatric T2D ≥10 years (Bydureon BCise, 2021)',
    ),
    t(
      'Investigado en enfermedad de Parkinson (Exenatide-PD3, fase 3 negativo 2025)',
      'Investigated in Parkinson disease (Exenatide-PD3, phase 3 negative 2025)',
    ),
  ],
  evidence: 'fda_approved',
  regulatory: {
    us: 'approved',
    eu: 'approved',
    notes: t(
      'Bydureon (kit/pluma de reconstitución) fue retirado en favor de Bydureon BCise (autoinyector en suspensión). La comercialización de Byetta se ha ido discontinuando en varios mercados por motivos comerciales; comprobar disponibilidad local. Sin beneficio CV demostrado (EXSCEL neutro).',
      'Bydureon (reconstitution kit/pen) was withdrawn in favour of Bydureon BCise (suspension autoinjector). Byetta marketing has been discontinued in several markets for commercial reasons; check local availability. No proven CV benefit (EXSCEL neutral).',
    ),
  },
  routes: ['sc'],
  defaultUnit: 'mcg',
  pk: {
    halfLifeH: 2.4,
    tmaxH: 2.1,
    apparentVolumeL: 28.3,
    molarMassGPerMol: 4186.6,
    source:
      'Byetta US label §12.3: t½ ≈ 2,4 h, tmax mediana 2,1 h, V/F 28,3 L, aclaramiento 9,1 L/h; MW 4186,6 g/mol',
    notes:
      'Parámetros de la formulación IR (Byetta). Bydureon BCise muestra cinética flip-flop: la liberación desde las microesferas de PLGA (no la eliminación) gobierna la curva; concentraciones terapéuticas a las ~2 semanas, estado estacionario a las 6–7 semanas y niveles detectables hasta ~10 semanas tras la última dosis. El motor NO modela la ER con estos parámetros.',
  },
  dosing: {
    labeled: t(
      'Byetta: 5 mcg 2×/día en los 60 min previos a las dos comidas principales (≥6 h de separación) ×1 mes → 10 mcg 2×/día. No administrar tras la comida. Bydureon BCise: 2 mg 1×/semana a cualquier hora, con o sin comida; agitar vigorosamente ≥15 s hasta suspensión homogénea. Al pasar de Byetta a BCise puede haber elevaciones transitorias de glucemia ~2 semanas.',
      'Byetta: 5 mcg twice daily within 60 min before the two main meals (≥6 h apart) ×1 month → 10 mcg twice daily. Do not give after meals. Bydureon BCise: 2 mg once weekly any time, with or without food; shake hard ≥15 s until uniformly mixed. When switching from Byetta to BCise, transient glucose elevations may occur for ~2 weeks.',
    ),
    frequency: t(
      '2×/día preprandial (Byetta) · 1×/semana (Bydureon BCise)',
      'Twice daily pre-meal (Byetta) · once weekly (Bydureon BCise)',
    ),
  },
  reconstitution: t(
    'Byetta: pluma multidosis 250 mcg/mL (1,2 mL = 60 dosis de 5 mcg; 2,4 mL = 60 dosis de 10 mcg). Bydureon BCise: autoinyector monodosis con 2 mg en suspensión oleosa (triglicéridos de cadena media); requiere 15 min a temperatura ambiente y agitación enérgica antes de inyectar. El antiguo Bydureon exigía reconstituir el polvo con el diluyente y usarlo de inmediato.',
    'Byetta: multidose pen 250 mcg/mL (1.2 mL = 60 doses of 5 mcg; 2.4 mL = 60 doses of 10 mcg). Bydureon BCise: single-dose autoinjector with 2 mg in oily suspension (medium-chain triglycerides); needs 15 min at room temperature and vigorous shaking before injection. Legacy Bydureon required reconstituting powder with diluent and immediate use.',
  ),
  storage: t(
    'Byetta: nevera 2–8 °C antes del uso; tras el primer uso 30 días a <25 °C. Bydureon BCise: nevera 2–8 °C en posición plana; puede permanecer hasta 4 semanas a <30 °C. No congelar. Proteger de la luz.',
    'Byetta: refrigerate 2–8 °C before use; after first use 30 days at <25 °C. Bydureon BCise: refrigerate 2–8 °C lying flat; may be kept up to 4 weeks at <30 °C. Do not freeze. Protect from light.',
  ),
  adverseEffects: {
    common: [
      t(
        'Náuseas (Byetta 44% en monoterapia inicial; BCise 8–13%), vómitos, diarrea, estreñimiento, dispepsia',
        'Nausea (Byetta up to 44% early monotherapy; BCise 8–13%), vomiting, diarrhoea, constipation, dyspepsia',
      ),
      t(
        'Nódulos subcutáneos en el punto de inyección (BCise: muy frecuentes, por las microesferas), prurito, hematoma',
        'Injection-site subcutaneous nodules (BCise: very common, due to microspheres), pruritus, bruising',
      ),
      t(
        'Hipoglucemia con sulfonilureas (hasta 36% con Byetta)',
        'Hypoglycaemia with sulfonylureas (up to 36% with Byetta)',
      ),
      t(
        'Cefalea, mareo, astenia, sensación de nerviosismo',
        'Headache, dizziness, asthenia, feeling jittery',
      ),
      t(
        'Anticuerpos antiexenatida (~40% con Byetta, ~45% con ER); títulos altos pueden reducir eficacia',
        'Anti-exenatide antibodies (~40% Byetta, ~45% ER); high titres may reduce efficacy',
      ),
    ],
    serious: [
      t(
        'Pancreatitis aguda, incluida necrotizante y hemorrágica mortal',
        'Acute pancreatitis including fatal necrotising/haemorrhagic',
      ),
      t(
        'Insuficiencia renal aguda y empeoramiento de ERC (notificaciones poscomercialización, a veces con necesidad de diálisis)',
        'Acute renal failure and worsening CKD (post-marketing reports, sometimes requiring dialysis)',
      ),
      t(
        'Trombocitopenia inmune inducida por fármaco (anticuerpos antiplaquetarios dependientes de exenatida), con hemorragia',
        'Drug-induced immune-mediated thrombocytopenia (exenatide-dependent antiplatelet antibodies), with bleeding',
      ),
      t(
        'Hipersensibilidad grave (anafilaxia, angioedema)',
        'Serious hypersensitivity (anaphylaxis, angioedema)',
      ),
      t('Enfermedad biliar aguda', 'Acute gallbladder disease'),
      t('Aumento del INR con warfarina y hemorragia', 'INR increase with warfarin and bleeding'),
    ],
  },
  contraindications: [
    t(
      'Bydureon BCise: antecedente personal o familiar de carcinoma medular de tiroides o MEN2 (recuadro negro; Byetta carece de recuadro por su acción corta)',
      'Bydureon BCise: personal or family history of medullary thyroid carcinoma or MEN2 (boxed warning; Byetta has no boxed warning given its short action)',
    ),
    t(
      'Hipersensibilidad grave previa a exenatida o excipientes',
      'Prior serious hypersensitivity to exenatide or excipients',
    ),
    t(
      'Antecedente de trombocitopenia inducida por exenatida',
      'History of drug-induced thrombocytopenia with exenatide',
    ),
    t(
      'Insuficiencia renal grave (CrCl <30 mL/min) o enfermedad renal terminal: no recomendado',
      'Severe renal impairment (CrCl <30 mL/min) or end-stage renal disease: not recommended',
    ),
    t(
      'Gastroparesia grave; no usar Byetta en DM1 ni cetoacidosis',
      'Severe gastroparesis; do not use Byetta in T1D or ketoacidosis',
    ),
  ],
  interactions: [
    t(
      'Sulfonilureas e insulina: reducir dosis (Byetta aprobado con insulina basal, no con insulina prandial)',
      'Sulfonylureas and insulin: reduce dose (Byetta approved with basal, not prandial, insulin)',
    ),
    t(
      'Fármacos orales que requieren absorción rápida (antibióticos, anticonceptivos, analgésicos): tomarlos ≥1 h antes de Byetta',
      'Oral drugs needing rapid absorption (antibiotics, contraceptives, analgesics): take ≥1 h before Byetta',
    ),
    t(
      'Warfarina: vigilar INR al iniciar y al ajustar',
      'Warfarin: monitor INR at initiation and dose changes',
    ),
    t(
      'Paracetamol: la Cmax cae ~40% si se toma junto con Byetta (relevancia menor)',
      'Paracetamol: Cmax falls ~40% when co-administered with Byetta (minor relevance)',
    ),
  ],
  monitoring: [
    t('Glucemia posprandial y HbA1c', 'Postprandial glucose and HbA1c'),
    t(
      'Función renal basal y ante náuseas/vómitos intensos',
      'Baseline renal function and with severe nausea/vomiting',
    ),
    t(
      'Recuento plaquetario si hematomas o sangrado inusual',
      'Platelet count with unusual bruising or bleeding',
    ),
    t(
      'Inspección de nódulos en el punto de inyección (BCise); rotar zonas',
      'Injection-site nodule inspection (BCise); rotate sites',
    ),
  ],
  keyTrials: [
    {
      name: 'EXSCEL',
      year: 2017,
      finding: t(
        'Exenatida ER 2 mg no inferior pero no superior a placebo en MACE (HR 0,91) en 14.752 pacientes con DM2; mediana 3,2 años.',
        'Exenatide ER 2 mg non-inferior but not superior to placebo for MACE (HR 0.91) in 14,752 T2D patients; median 3.2 years.',
      ),
      ref: 'NEJM 2017;377:1228 (NCT01144338)',
    },
    {
      name: 'DURATION-1',
      year: 2008,
      finding: t(
        'Exenatida semanal superior a Byetta 2×/día en HbA1c (−1,9 vs −1,5%) a 30 semanas con menos náuseas.',
        'Weekly exenatide superior to Byetta twice daily for HbA1c (−1.9 vs −1.5%) at 30 weeks with less nausea.',
      ),
      ref: 'Lancet 2008;372:1240',
    },
    {
      name: 'DURATION-6',
      year: 2013,
      finding: t(
        'Exenatida ER inferior a liraglutida 1,8 mg en reducción de HbA1c (−1,28 vs −1,48%).',
        'Exenatide ER inferior to liraglutide 1.8 mg for HbA1c reduction (−1.28 vs −1.48%).',
      ),
      ref: 'Lancet 2013;381:117',
    },
    {
      name: 'Exenatide-PD',
      year: 2017,
      finding: t(
        'Fase 2: mejoría motora off-medicación a 60 semanas en Parkinson; el fase 3 Exenatide-PD3 (2025) no confirmó beneficio.',
        'Phase 2: off-medication motor improvement at 60 weeks in Parkinson; phase 3 Exenatide-PD3 (2025) did not confirm benefit.',
      ),
      ref: 'Lancet 2017;390:1664',
    },
  ],
  references: [
    { label: 'Byetta US Prescribing Information (AstraZeneca)' },
    { label: 'Bydureon BCise US Prescribing Information (AstraZeneca)' },
    {
      label: 'EMA EPAR Bydureon',
      url: 'https://www.ema.europa.eu/en/medicines/human/EPAR/bydureon',
    },
    { label: 'EMA EPAR Byetta', url: 'https://www.ema.europa.eu/en/medicines/human/EPAR/byetta' },
  ],
  tags: ['glp1', 'exendina', 'dm2', 'preprandial', 'semanal', 'microesferas'],
  lastReviewed: '2026-09-19',
}

const lixisenatide: CompoundEntry = {
  id: 'lixisenatide',
  names: {
    generic: 'Lixisenatida',
    brands: [
      'Adlyxin (EE. UU., discontinuado)',
      'Lyxumia (UE)',
      'Soliqua 100/33 · Suliqua (con insulina glargina)',
    ],
    aliases: ['AVE0010', 'ZP10'],
  },
  category: 'incretin',
  pharmClass: t(
    'Agonista del receptor de GLP-1 de acción corta (exendina, diario preprandial)',
    'Short-acting GLP-1 receptor agonist (exendin-based, once daily pre-meal)',
  ),
  summary: t(
    'Análogo de exendina-4 con seis lisinas C-terminales y deleción de Pro38; afinidad por el receptor GLP-1 ~4× mayor que el GLP-1 nativo pero semivida corta (~3 h). Efecto predominante sobre la glucemia posprandial por enlentecimiento gástrico. Neutro en eventos CV tras síndrome coronario agudo (ELIXA). Hoy sobrevive comercialmente sobre todo combinado con insulina glargina.',
    'Exendin-4 analogue with six C-terminal lysines and Pro38 deletion; ~4× the GLP-1 receptor affinity of native GLP-1 but short half-life (~3 h). Predominant effect on postprandial glucose via gastric slowing. Neutral for CV events after acute coronary syndrome (ELIXA). Survives commercially mainly combined with insulin glargine.',
  ),
  mechanism: t(
    'Agonista del receptor GLP-1 resistente a DPP-4. Al no acumularse, mantiene el retraso del vaciamiento gástrico sin taquifilaxia, con reducción marcada de la glucemia posprandial tras la comida siguiente a la inyección y menor efecto en ayunas que los agentes de acción prolongada. Se elimina por filtración glomerular y degradación proteolítica.',
    'DPP-4-resistant GLP-1 receptor agonist. Because it does not accumulate, it preserves the gastric-emptying delay without tachyphylaxis, markedly lowering postprandial glucose after the meal following injection with less fasting effect than long-acting agents. Eliminated by glomerular filtration and proteolysis.',
  ),
  indications: [
    t(
      'Diabetes mellitus tipo 2 en adultos, sobre todo con hiperglucemia posprandial o añadida a insulina basal',
      'Type 2 diabetes in adults, particularly postprandial hyperglycaemia or add-on to basal insulin',
    ),
    t(
      'Combinación fija con insulina glargina (Soliqua/Suliqua) en DM2 insuficientemente controlada',
      'Fixed-ratio combination with insulin glargine (Soliqua/Suliqua) in inadequately controlled T2D',
    ),
    t(
      'Investigado en enfermedad de Parkinson precoz (LixiPark, fase 2, 2024)',
      'Investigated in early Parkinson disease (LixiPark, phase 2, 2024)',
    ),
  ],
  evidence: 'fda_approved',
  regulatory: {
    us: 'discontinued',
    eu: 'approved',
    notes: t(
      'Adlyxin (monofármaco) fue discontinuado en EE. UU. en enero de 2023 por motivos comerciales, no de seguridad; Soliqua 100/33 sigue comercializada. En la UE Lyxumia y Suliqua mantienen autorización (comprobar disponibilidad por país).',
      'Adlyxin (single agent) was discontinued in the US in January 2023 for commercial, not safety, reasons; Soliqua 100/33 remains marketed. In the EU Lyxumia and Suliqua keep their authorisation (check country availability).',
    ),
  },
  routes: ['sc'],
  defaultUnit: 'mcg',
  pk: {
    halfLifeH: 3,
    tmaxH: 2.5,
    apparentVolumeL: 100,
    molarMassGPerMol: 4858.5,
    source:
      'Adlyxin US label §12.3 / Lyxumia SmPC 5.2: t½ ≈ 3 h, tmax 1–3,5 h, V/F ≈ 100 L; MW 4858,5 g/mol',
    notes:
      'Sin acumulación entre dosis diarias. En insuficiencia renal moderada la exposición sube ~24%, en grave ~46%.',
  },
  dosing: {
    labeled: t(
      '10 mcg 1×/día ×14 días → 20 mcg 1×/día (dosis de mantenimiento), en la hora previa a la primera comida del día o a la comida principal. Si se omite, administrar en la hora previa a la siguiente comida. Soliqua: 15–60 U de glargina con 5–20 mcg de lixisenatida (ratio 3:1).',
      '10 mcg once daily ×14 days → 20 mcg once daily (maintenance), within 1 h before the first meal of the day or the main meal. If missed, give within 1 h before the next meal. Soliqua: 15–60 U glargine with 5–20 mcg lixisenatide (3:1 ratio).',
    ),
    frequency: t('1×/día preprandial', 'Once daily pre-meal'),
  },
  reconstitution: t(
    'Plumas precargadas de 14 dosis: verde 10 mcg (50 mcg/mL) y morada 20 mcg (100 mcg/mL). Sin reconstitución. Soliqua: pluma 100 U/mL + 33 mcg/mL.',
    '14-dose prefilled pens: green 10 mcg (50 mcg/mL) and burgundy 20 mcg (100 mcg/mL). No reconstitution. Soliqua: pen 100 U/mL + 33 mcg/mL.',
  ),
  storage: t(
    'Antes del uso: nevera 2–8 °C. Tras el primer uso: 14 días a <30 °C. No congelar; retirar aguja tras cada uso.',
    'Before use: refrigerate 2–8 °C. After first use: 14 days at <30 °C. Do not freeze; remove needle after each use.',
  ),
  adverseEffects: {
    common: [
      t(
        'Náuseas (25%), vómitos (10%), diarrea (8%), dispepsia',
        'Nausea (25%), vomiting (10%), diarrhoea (8%), dyspepsia',
      ),
      t('Cefalea (9%), mareo (7%)', 'Headache (9%), dizziness (7%)'),
      t(
        'Hipoglucemia con sulfonilureas o insulina basal',
        'Hypoglycaemia with sulfonylureas or basal insulin',
      ),
      t(
        'Anticuerpos antifármaco en ~70% a las 24 semanas (títulos altos reducen HbA1c menos y aumentan reacciones locales)',
        'Anti-drug antibodies in ~70% at 24 weeks (high titres lessen HbA1c response and increase local reactions)',
      ),
      t('Reacciones en el punto de inyección (4%)', 'Injection-site reactions (4%)'),
    ],
    serious: [
      t('Pancreatitis aguda', 'Acute pancreatitis'),
      t('Anafilaxia (0,1%) y angioedema', 'Anaphylaxis (0.1%) and angioedema'),
      t('Lesión renal aguda por deshidratación', 'Acute kidney injury from dehydration'),
      t(
        'Hipoglucemia grave en combinación con insulina',
        'Severe hypoglycaemia in combination with insulin',
      ),
    ],
  },
  contraindications: [
    t(
      'Hipersensibilidad grave previa (anafilaxia) a lixisenatida o excipientes; sin recuadro negro tiroideo por su acción corta',
      'Prior serious hypersensitivity (anaphylaxis) to lixisenatide or excipients; no thyroid boxed warning owing to short action',
    ),
    t(
      'Enfermedad renal terminal (FGe <15): no recomendado; precaución en insuficiencia grave',
      'End-stage renal disease (eGFR <15): not recommended; caution in severe impairment',
    ),
    t('Gastroparesia grave; DM1', 'Severe gastroparesis; T1D'),
  ],
  interactions: [
    t(
      'Fármacos orales con umbral de eficacia (antibióticos, anticonceptivos orales, IBP): tomarlos ≥1 h antes o ≥11 h después de lixisenatida',
      'Oral drugs with efficacy thresholds (antibiotics, oral contraceptives, PPIs): take ≥1 h before or ≥11 h after lixisenatide',
    ),
    t(
      'Paracetamol: Cmax reducida y tmax retrasado si se toma 1–4 h después',
      'Paracetamol: lower Cmax and delayed tmax if taken 1–4 h after',
    ),
    t('Insulina/sulfonilureas: reducir dosis', 'Insulin/sulfonylureas: reduce dose'),
  ],
  monitoring: [
    t('Glucemia posprandial, HbA1c', 'Postprandial glucose, HbA1c'),
    t('Función renal', 'Renal function'),
    t('Síntomas de pancreatitis', 'Pancreatitis symptoms'),
  ],
  keyTrials: [
    {
      name: 'ELIXA',
      year: 2015,
      finding: t(
        'Neutral en MACE (HR 1,02) en 6.068 pacientes con DM2 y síndrome coronario agudo reciente; primer CVOT de un GLP-1 RA.',
        'Neutral for MACE (HR 1.02) in 6,068 T2D patients with recent acute coronary syndrome; first GLP-1 RA CVOT.',
      ),
      ref: 'NEJM 2015;373:2247 (NCT01147250)',
    },
    {
      name: 'GetGoal-Duo1',
      year: 2013,
      finding: t(
        'Añadida a insulina glargina titulada, redujo HbA1c −0,3% adicional y la glucemia posprandial.',
        'Added to titrated insulin glargine, cut HbA1c a further −0.3% and postprandial glucose.',
      ),
      ref: 'Diabetes Care 2013;36:2497',
    },
    {
      name: 'LixiLan-O / LixiLan-L',
      year: 2016,
      finding: t(
        'La combinación fija con glargina fue superior a cada componente en HbA1c, base de la aprobación de Soliqua.',
        'Fixed-ratio combination with glargine superior to each component for HbA1c, basis of Soliqua approval.',
      ),
      ref: 'Diabetes Care 2016;39:2026 y 39:1972',
    },
    {
      name: 'LixiPark',
      year: 2024,
      finding: t(
        'Fase 2 en Parkinson precoz: menor progresión de discapacidad motora a 12 meses (diferencia MDS-UPDRS III 3,1 puntos), a costa de náuseas frecuentes.',
        'Phase 2 in early Parkinson: less motor disability progression at 12 months (MDS-UPDRS III difference 3.1 points), with frequent nausea.',
      ),
      ref: 'NEJM 2024;390:1176',
    },
  ],
  references: [
    { label: 'Adlyxin US Prescribing Information (Sanofi)' },
    { label: 'EMA EPAR Lyxumia', url: 'https://www.ema.europa.eu/en/medicines/human/EPAR/lyxumia' },
    { label: 'EMA EPAR Suliqua', url: 'https://www.ema.europa.eu/en/medicines/human/EPAR/suliqua' },
  ],
  tags: ['glp1', 'exendina', 'dm2', 'posprandial', 'diario', 'insulina'],
  lastReviewed: '2026-09-19',
}

// ---------------------------------------------------------------------------
// Amylin analogue (approved), withdrawn GLP-1 RA, MC4R agonist
// ---------------------------------------------------------------------------

const pramlintide: CompoundEntry = {
  id: 'pramlintide',
  names: {
    generic: 'Pramlintida',
    brands: ['Symlin', 'SymlinPen'],
    aliases: ['AC137', 'análogo de amilina'],
  },
  category: 'incretin',
  pharmClass: t(
    'Análogo sintético de amilina (amilinomimético) de acción corta',
    'Short-acting synthetic amylin analogue (amylinomimetic)',
  ),
  summary: t(
    'Análogo de la amilina humana con tres sustituciones por prolina (25, 28, 29) que evitan la agregación fibrilar. Es el único amilinomimético aprobado; se inyecta antes de las comidas como adyuvante de la insulina prandial en DM1 y DM2, reduciendo las excursiones posprandiales y el peso (−1 a −2 kg). Recuadro negro por hipoglucemia grave inducida por insulina.',
    'Human amylin analogue with three proline substitutions (25, 28, 29) preventing fibril aggregation. The only approved amylinomimetic; injected before meals as an adjunct to mealtime insulin in T1D and T2D, reducing postprandial excursions and weight (−1 to −2 kg). Boxed warning for severe insulin-induced hypoglycaemia.',
  ),
  mechanism: t(
    'Actúa sobre los receptores de amilina (receptor de calcitonina + RAMP1/3) en el área postrema: enlentece el vaciamiento gástrico, suprime la secreción posprandial de glucagón inadecuada y aumenta la saciedad. No modifica la secreción de insulina; su efecto es complementario a la insulina exógena. Se metaboliza renalmente a des-lys-pramlintida (activa).',
    'Acts on amylin receptors (calcitonin receptor + RAMP1/3) in the area postrema: slows gastric emptying, suppresses inappropriate postprandial glucagon secretion and increases satiety. Does not alter insulin secretion; its effect complements exogenous insulin. Renally metabolised to active des-lys-pramlintide.',
  ),
  indications: [
    t(
      'DM1 con insulina prandial e insuficiente control posprandial',
      'T1D on mealtime insulin with inadequate postprandial control',
    ),
    t(
      'DM2 con insulina prandial (± metformina/sulfonilurea) e insuficiente control',
      'T2D on mealtime insulin (± metformin/sulfonylurea) with inadequate control',
    ),
    t(
      'Investigado como adyuvante para pérdida de peso (dosis 120–360 mcg 2–3×/día; no aprobado) y en insulina + pramlintida coformuladas',
      'Investigated as weight-loss adjunct (120–360 mcg 2–3×/day; not approved) and in insulin + pramlintide co-formulations',
    ),
  ],
  evidence: 'fda_approved',
  regulatory: {
    us: 'approved',
    notes: t(
      'Aprobado por la FDA en 2005; nunca autorizado por la EMA. Uso clínico marginal por la carga de inyecciones prandiales adicionales y el riesgo de hipoglucemia. Comprobar disponibilidad comercial actual.',
      'FDA-approved in 2005; never authorised by EMA. Marginal clinical use given the burden of extra mealtime injections and hypoglycaemia risk. Check current commercial availability.',
    ),
  },
  routes: ['sc'],
  defaultUnit: 'mcg',
  pk: {
    halfLifeH: 0.8,
    tmaxH: 0.33,
    bioavailability: 0.35,
    molarMassGPerMol: 3949.4,
    source:
      'Symlin US label §12.3: t½ ≈ 48 min, tmax ≈ 20 min, F 30–40%, unión a proteínas ~40%; MW 3949,4 g/mol (base libre)',
    notes:
      'Acción de ~3 h por dosis; no se acumula. La inyección en brazo produce absorción más variable; preferir abdomen o muslo.',
  },
  dosing: {
    labeled: t(
      'DM1: 15 mcg antes de cada comida principal (≥250 kcal o ≥30 g de carbohidratos) → aumentar en escalones de 15 mcg hasta 30 o 60 mcg cuando no haya náuseas ≥3 días. DM2: 60 mcg → 120 mcg antes de las comidas. Reducir la insulina prandial (incluidas mezclas) un 50% al iniciar. No mezclar en la misma jeringa con insulina; inyectar en zona separada ≥5 cm.',
      'T1D: 15 mcg before each major meal (≥250 kcal or ≥30 g carbohydrate) → increase in 15 mcg steps to 30 or 60 mcg once nausea-free ≥3 days. T2D: 60 mcg → 120 mcg before meals. Reduce mealtime insulin (including premixes) by 50% on initiation. Do not mix in the same syringe as insulin; inject at a separate site ≥5 cm away.',
    ),
    frequency: t('Antes de cada comida principal (2–3×/día)', 'Before each major meal (2–3×/day)'),
  },
  reconstitution: t(
    'SymlinPen 60 (dosis 15 · 30 · 45 · 60 mcg) y SymlinPen 120 (60 · 120 mcg), 1000 mcg/mL en 1,5 mL y 2,7 mL. Sin reconstitución. Viales de 5 mL (600 mcg/mL) históricos: 15 mcg = 2,5 U en jeringa U-100.',
    'SymlinPen 60 (15 · 30 · 45 · 60 mcg doses) and SymlinPen 120 (60 · 120 mcg), 1000 mcg/mL in 1.5 mL and 2.7 mL. No reconstitution. Legacy 5 mL vials (600 mcg/mL): 15 mcg = 2.5 U in a U-100 syringe.',
  ),
  storage: t(
    'Sin abrir: nevera 2–8 °C. Tras el primer uso: 30 días en nevera o a <30 °C. No congelar; desechar si estuvo congelado o expuesto a >30 °C.',
    'Unopened: refrigerate 2–8 °C. After first use: 30 days refrigerated or at <30 °C. Do not freeze; discard if frozen or exposed to >30 °C.',
  ),
  adverseEffects: {
    common: [
      t(
        'Náuseas (28–48%, dosis-dependientes, disminuyen en 4–8 semanas), anorexia, vómitos',
        'Nausea (28–48%, dose-dependent, wanes over 4–8 weeks), anorexia, vomiting',
      ),
      t(
        'Hipoglucemia (con insulina; DM1 hasta 17% grave sin reducir insulina)',
        'Hypoglycaemia (with insulin; T1D up to 17% severe without insulin reduction)',
      ),
      t('Cefalea, fatiga, mareo, dolor abdominal', 'Headache, fatigue, dizziness, abdominal pain'),
      t(
        'Reacciones en el punto de inyección, artralgia, tos, faringitis',
        'Injection-site reactions, arthralgia, cough, pharyngitis',
      ),
    ],
    serious: [
      t(
        'Hipoglucemia grave inducida por insulina en las 3 h tras la inyección, sobre todo en DM1 (recuadro negro); riesgo al conducir o manejar maquinaria',
        'Severe insulin-induced hypoglycaemia within 3 h of injection, especially in T1D (boxed warning); risk when driving or operating machinery',
      ),
      t(
        'Anafilaxia y reacciones alérgicas sistémicas (raras)',
        'Anaphylaxis and systemic allergic reactions (rare)',
      ),
    ],
  },
  contraindications: [
    t(
      'Hipersensibilidad conocida a pramlintida o a los excipientes (metacresol)',
      'Known hypersensitivity to pramlintide or excipients (metacresol)',
    ),
    t('Gastroparesia confirmada', 'Confirmed gastroparesis'),
    t('Hipoglucemia inadvertida (hypoglycemia unawareness)', 'Hypoglycaemia unawareness'),
    t(
      'No indicado en HbA1c >9%, mala adherencia, hipoglucemias graves recurrentes en los últimos 6 meses o uso de fármacos que estimulan la motilidad GI',
      'Not appropriate with HbA1c >9%, poor adherence, recurrent severe hypoglycaemia in the past 6 months or drugs stimulating GI motility',
    ),
  ],
  interactions: [
    t(
      'Insulina: reducir 50% la dosis prandial al iniciar; ajustar según glucemias',
      'Insulin: reduce mealtime dose by 50% on initiation; titrate to glucose',
    ),
    t(
      'Fármacos orales que requieren absorción rápida (analgésicos, antibióticos): tomar ≥1 h antes o ≥2 h después',
      'Oral drugs needing rapid absorption (analgesics, antibiotics): take ≥1 h before or ≥2 h after',
    ),
    t(
      'Anticolinérgicos y otros enlentecedores del vaciamiento gástrico: evitar combinación',
      'Anticholinergics and other gastric-emptying slowers: avoid combining',
    ),
    t(
      'Inhibidores de alfa-glucosidasa: no estudiado, evitar',
      'Alpha-glucosidase inhibitors: not studied, avoid',
    ),
  ],
  monitoring: [
    t(
      'Glucemia capilar frecuente pre y posprandial (o MCG) durante el inicio y cada escalada',
      'Frequent pre- and postprandial capillary glucose (or CGM) during initiation and each escalation',
    ),
    t('HbA1c y peso', 'HbA1c and weight'),
    t('Náuseas como criterio de titulación', 'Nausea as the titration criterion'),
  ],
  keyTrials: [
    {
      name: 'Ratner (DM1, 52 semanas)',
      year: 2004,
      finding: t(
        'HbA1c −0,29 a −0,34% y peso −0,4 a −1,3 kg vs placebo en DM1 con insulina, sin aumento de hipoglucemia grave tras ajuste de insulina.',
        'HbA1c −0.29 to −0.34% and weight −0.4 to −1.3 kg vs placebo in insulin-treated T1D, without excess severe hypoglycaemia after insulin adjustment.',
      ),
      ref: 'Diabet Med 2004;21:1204',
    },
    {
      name: 'Hollander (DM2, 52 semanas)',
      year: 2003,
      finding: t(
        '120 mcg 2×/día: HbA1c −0,62% y peso −1,4 kg vs placebo en DM2 insulinizada.',
        '120 mcg twice daily: HbA1c −0.62% and weight −1.4 kg vs placebo in insulin-treated T2D.',
      ),
      ref: 'Diabetes Care 2003;26:784',
    },
    {
      name: 'Pramlintida en obesidad (Smith)',
      year: 2008,
      finding: t(
        'En obesos sin diabetes, 240–360 mcg 3×/día produjo −7,2 a −8,0 kg a 16 semanas (fase 2; no aprobado).',
        'In obese non-diabetics, 240–360 mcg three times daily produced −7.2 to −8.0 kg at 16 weeks (phase 2; not approved).',
      ),
      ref: 'Diabetes Care 2008;31:1816',
    },
  ],
  references: [{ label: 'Symlin / SymlinPen US Prescribing Information (AstraZeneca)' }],
  tags: ['amilina', 'dm1', 'dm2', 'preprandial', 'insulina', 'posprandial'],
  lastReviewed: '2026-09-19',
}

const albiglutide: CompoundEntry = {
  id: 'albiglutide',
  names: {
    generic: 'Albiglutida',
    brands: ['Tanzeum (EE. UU.)', 'Eperzan (UE)'],
    aliases: ['GSK716155', 'albugon'],
  },
  category: 'incretin',
  pharmClass: t(
    'Agonista del receptor de GLP-1 (dímero de GLP-1 fusionado a albúmina, semanal) — retirado',
    'GLP-1 receptor agonist (GLP-1 dimer fused to albumin, once weekly) — withdrawn',
  ),
  summary: t(
    'Dos copias de GLP-1 (7–36) con Ala8Gly, fusionadas en tándem a albúmina humana recombinante (~73 kDa), lo que da una semivida de ~5 días. Aprobado en 2014, retirado del mercado por GSK en 2018 por motivos comerciales pese a demostrar reducción de MACE del 22% en HARMONY Outcomes. Eficacia glucémica y ponderal menor que la de liraglutida.',
    'Two copies of GLP-1 (7–36) with Ala8Gly, fused in tandem to recombinant human albumin (~73 kDa), giving a ~5-day half-life. Approved in 2014, withdrawn by GSK in 2018 for commercial reasons despite a 22% MACE reduction in HARMONY Outcomes. Glycaemic and weight efficacy lower than liraglutide.',
  ),
  mechanism: t(
    'Agonista del receptor GLP-1 con potencia in vitro menor que el GLP-1 nativo y escasa penetración central por su tamaño, lo que explica el efecto ponderal modesto (−0,6 a −1,2 kg) y la menor incidencia de náuseas. Secreción de insulina dependiente de glucosa y supresión de glucagón; retraso gástrico atenuado.',
    'GLP-1 receptor agonist with lower in vitro potency than native GLP-1 and limited central penetration owing to its size, explaining the modest weight effect (−0.6 to −1.2 kg) and lower nausea rates. Glucose-dependent insulin secretion and glucagon suppression; attenuated gastric delay.',
  ),
  indications: [
    t(
      'Diabetes mellitus tipo 2 en adultos (indicación histórica, 2014–2018)',
      'Type 2 diabetes in adults (historical indication, 2014–2018)',
    ),
  ],
  evidence: 'withdrawn',
  regulatory: {
    us: 'discontinued',
    eu: 'discontinued',
    notes: t(
      'GSK anunció en julio de 2017 la retirada comercial; el suministro cesó en julio de 2018 (EE. UU.) y la autorización europea de Eperzan caducó. Se mantiene en la wiki por su valor histórico y su CVOT positivo.',
      'GSK announced commercial withdrawal in July 2017; supply ended July 2018 (US) and the European Eperzan authorisation lapsed. Retained in the wiki for historical value and its positive CVOT.',
    ),
  },
  routes: ['sc'],
  defaultUnit: 'mg',
  pk: {
    halfLifeH: 120,
    tmaxH: 96,
    molarMassGPerMol: 72970,
    source:
      'Tanzeum US label §12.3: t½ ≈ 5 días, tmax 3–5 días, estado estacionario a las 4–5 semanas; MW ≈ 72,97 kDa',
    notes:
      'Fusión a albúmina: eliminación por catabolismo, sin filtración renal relevante; exposición no afectada de forma clínica por insuficiencia renal.',
  },
  dosing: {
    labeled: t(
      '30 mg 1×/semana; podía aumentarse a 50 mg si el control glucémico era insuficiente. Dosis olvidada: administrar en los 3 días siguientes.',
      '30 mg once weekly; could be increased to 50 mg if glycaemic control inadequate. Missed dose: give within 3 days.',
    ),
    frequency: t('1×/semana', 'Once weekly'),
  },
  reconstitution: t(
    'Pluma monodosis de doble cámara con polvo liofilizado y diluyente: girar para mezclar, esperar 15 min (30 mg) o 30 min (50 mg) hasta disolución completa; administrar en las 8 h siguientes.',
    'Dual-chamber single-dose pen with lyophilised powder and diluent: twist to mix, wait 15 min (30 mg) or 30 min (50 mg) for full dissolution; administer within 8 h.',
  ),
  storage: t(
    'Nevera 2–8 °C; podía mantenerse a temperatura ambiente (<30 °C) hasta 4 semanas. No congelar.',
    'Refrigerate 2–8 °C; could be kept at room temperature (<30 °C) for up to 4 weeks. Do not freeze.',
  ),
  adverseEffects: {
    common: [
      t(
        'Infección respiratoria alta (14%), diarrea (13%), náuseas (11%), reacciones en el punto de inyección (10–18%, más que otros GLP-1 RA)',
        'Upper respiratory infection (14%), diarrhoea (13%), nausea (11%), injection-site reactions (10–18%, more than other GLP-1 RAs)',
      ),
      t(
        'Tos, dorsalgia, artralgia, sinusitis, gripe',
        'Cough, back pain, arthralgia, sinusitis, influenza',
      ),
      t('Anticuerpos antialbiglutida en ~5%', 'Anti-albiglutide antibodies in ~5%'),
    ],
    serious: [
      t('Pancreatitis aguda (0,3%)', 'Acute pancreatitis (0.3%)'),
      t(
        'Hipoglucemia grave con insulina/sulfonilureas',
        'Severe hypoglycaemia with insulin/sulfonylureas',
      ),
      t('Hipersensibilidad grave', 'Serious hypersensitivity'),
      t('Lesión renal aguda por reacciones GI', 'Acute kidney injury from GI reactions'),
      t(
        'Fibrilación auricular/aleteo notificados con más frecuencia que placebo (1,0 vs 0,5%)',
        'Atrial fibrillation/flutter reported more often than placebo (1.0 vs 0.5%)',
      ),
    ],
  },
  contraindications: [
    t(
      'Antecedente personal o familiar de carcinoma medular de tiroides o MEN2 (recuadro negro)',
      'Personal or family history of medullary thyroid carcinoma or MEN2 (boxed warning)',
    ),
    t('Hipersensibilidad grave a albiglutida', 'Serious hypersensitivity to albiglutide'),
    t(
      'No estudiado en gastroparesia grave ni en DM1',
      'Not studied in severe gastroparesis or T1D',
    ),
  ],
  interactions: [
    t('Insulina y sulfonilureas: reducir dosis', 'Insulin and sulfonylureas: reduce dose'),
    t(
      'Fármacos orales: retraso leve del vaciamiento; sin interacciones relevantes con simvastatina, warfarina, digoxina ni anticonceptivos en la ficha',
      'Oral drugs: mild gastric delay; no relevant interactions with simvastatin, warfarin, digoxin or oral contraceptives per label',
    ),
  ],
  monitoring: [
    t(
      'HbA1c, glucemia, peso (referencia histórica)',
      'HbA1c, glucose, weight (historical reference)',
    ),
  ],
  keyTrials: [
    {
      name: 'HARMONY Outcomes',
      year: 2018,
      finding: t(
        '−22% de MACE (HR 0,78) en 9.463 pacientes con DM2 y enfermedad CV; mediana 1,6 años; sin efecto sobre mortalidad.',
        '−22% MACE (HR 0.78) in 9,463 T2D patients with CVD; median 1.6 years; no mortality effect.',
      ),
      ref: 'Lancet 2018;392:1519 (NCT02465515)',
    },
    {
      name: 'HARMONY 7',
      year: 2014,
      finding: t(
        'Albiglutida 50 mg inferior a liraglutida 1,8 mg en HbA1c (−0,78 vs −0,99%) con menos náuseas pero más reacciones locales.',
        'Albiglutide 50 mg inferior to liraglutide 1.8 mg for HbA1c (−0.78 vs −0.99%) with less nausea but more injection-site reactions.',
      ),
      ref: 'Lancet Diabetes Endocrinol 2014;2:289',
    },
    {
      name: 'HARMONY 3',
      year: 2014,
      finding: t(
        'Superior a sitagliptina y glimepirida en HbA1c a 104 semanas añadida a metformina.',
        'Superior to sitagliptin and glimepiride for HbA1c at 104 weeks added to metformin.',
      ),
      ref: 'Diabetes Care 2014;37:2141',
    },
  ],
  references: [
    { label: 'Tanzeum US Prescribing Information (GSK, 2017)' },
    {
      label: 'EMA EPAR Eperzan (autorización caducada)',
      url: 'https://www.ema.europa.eu/en/medicines/human/EPAR/eperzan',
    },
  ],
  tags: ['glp1', 'albúmina', 'dm2', 'semanal', 'retirado', 'histórico'],
  lastReviewed: '2026-09-19',
}

const setmelanotide: CompoundEntry = {
  id: 'setmelanotide',
  names: {
    generic: 'Setmelanotida',
    brands: ['Imcivree'],
    aliases: ['RM-493', 'BIM-22493'],
  },
  category: 'metabolic',
  pharmClass: t(
    'Agonista del receptor de melanocortina 4 (MC4R)',
    'Melanocortin-4 receptor (MC4R) agonist',
  ),
  summary: t(
    'Péptido cíclico de 8 aminoácidos agonista de MC4R, 20 veces más potente que la α-MSH, que restaura la señalización de la vía leptina-melanocortina distal al defecto genético. Aprobado para obesidad por deficiencia de POMC, PCSK1 o LEPR (bialélica) y síndrome de Bardet-Biedl. No es un incretínico: se incluye aquí por su papel en obesidad monogénica/sindrómica.',
    '8-amino-acid cyclic MC4R agonist peptide, 20-fold more potent than α-MSH, restoring leptin–melanocortin pathway signalling downstream of the genetic defect. Approved for obesity due to POMC, PCSK1 or LEPR (biallelic) deficiency and Bardet-Biedl syndrome. Not an incretin: included here for its role in monogenic/syndromic obesity.',
  ),
  mechanism: t(
    'Agonista de MC4R en neuronas del núcleo paraventricular hipotalámico; reduce el hambre (hiperfagia) y aumenta el gasto energético. A diferencia de agonistas de melanocortina de primera generación, tiene escasa actividad sobre MC1R (aunque produce hiperpigmentación) y no eleva la presión arterial ni la frecuencia cardíaca de forma relevante. Vía de eliminación principalmente renal.',
    'MC4R agonist on hypothalamic paraventricular neurons; reduces hunger (hyperphagia) and increases energy expenditure. Unlike first-generation melanocortin agonists it has limited MC1R activity (although it causes hyperpigmentation) and does not meaningfully raise blood pressure or heart rate. Eliminated mainly renally.',
  ),
  indications: [
    t(
      'Obesidad por deficiencia bialélica de POMC, PCSK1 o LEPR confirmada genéticamente (≥2 años; antes ≥6 años)',
      'Obesity due to genetically confirmed biallelic POMC, PCSK1 or LEPR deficiency (≥2 years; previously ≥6 years)',
    ),
    t(
      'Obesidad en síndrome de Bardet-Biedl (≥2 años)',
      'Obesity in Bardet-Biedl syndrome (≥2 years)',
    ),
    t(
      'Obesidad hipotalámica adquirida (TRANSCEND, fase 3 positivo 2025; solicitud regulatoria presentada — comprobar estado)',
      'Acquired hypothalamic obesity (TRANSCEND, positive phase 3 2025; regulatory filing submitted — check status)',
    ),
    t(
      'Variantes heterocigotas de la vía MC4R y síndrome de Alström (investigación; el fase 3 en Alström no alcanzó el objetivo)',
      'Heterozygous MC4R-pathway variants and Alström syndrome (research; the Alström phase 3 missed its endpoint)',
    ),
  ],
  evidence: 'fda_approved',
  regulatory: {
    us: 'approved',
    eu: 'approved',
    notes: t(
      'Aprobación FDA 2020 (POMC/PCSK1/LEPR), 2022 (BBS), extensión a ≥2 años en 2024. En la UE autorizado en 2021 con indicaciones equivalentes. Requiere confirmación genética; medicamento huérfano de coste muy elevado.',
      'FDA approval 2020 (POMC/PCSK1/LEPR), 2022 (BBS), extension to ≥2 years in 2024. EU authorisation 2021 with equivalent indications. Requires genetic confirmation; very high-cost orphan drug.',
    ),
  },
  routes: ['sc'],
  defaultUnit: 'mg',
  pk: {
    halfLifeH: 11,
    tmaxH: 8,
    apparentVolumeL: 48.7,
    molarMassGPerMol: 1117.3,
    source:
      'Imcivree US label §12.3: t½ ≈ 11 h, tmax ≈ 8 h, V/F ≈ 48,7 L, aclaramiento ≈ 4,9 L/h; MW 1117,3 g/mol',
    notes:
      'Estado estacionario a los ~2 días. Exposición aumentada en insuficiencia renal moderada-grave: reducir dosis (no recomendado en ERC terminal).',
  },
  dosing: {
    labeled: t(
      'Adultos y ≥12 años: 2 mg 1×/día ×2 semanas → 3 mg 1×/día si se tolera (reducir a 2 mg ante intolerancia GI). Niños 6–<12 años: 1 mg → 2 mg → hasta 3 mg. Niños 2–<6 años: inicio 0,5 mg con escalada según peso (consultar ficha). Insuficiencia renal moderada: iniciar con 0,5–1 mg. Inyectar al inicio del día, independiente de comidas.',
      'Adults and ≥12 years: 2 mg once daily ×2 weeks → 3 mg once daily if tolerated (reduce to 2 mg for GI intolerance). Children 6–<12 years: 1 mg → 2 mg → up to 3 mg. Children 2–<6 years: start 0.5 mg with weight-based escalation (see label). Moderate renal impairment: start 0.5–1 mg. Inject at the start of the day, independent of meals.',
    ),
    frequency: t('1×/día', 'Once daily'),
  },
  reconstitution: t(
    'Viales multidosis de 10 mg/mL (1 mL) listos para usar; dosificar con jeringa U-100 de 1 mL: 1 mg = 0,1 mL = 10 U; 2 mg = 20 U; 3 mg = 30 U. Contiene alcohol bencílico (evitar en prematuros/neonatos).',
    'Ready-to-use multidose vials 10 mg/mL (1 mL); draw with a 1 mL U-100 syringe: 1 mg = 0.1 mL = 10 U; 2 mg = 20 U; 3 mg = 30 U. Contains benzyl alcohol (avoid in preterm/neonates).',
  ),
  storage: t(
    'Sin abrir: nevera 2–8 °C, protegido de la luz. Tras la primera punción: puede mantenerse en nevera o a temperatura ambiente (≤30 °C) hasta 30 días; desechar después. Puede estar sin refrigerar hasta 30 días antes de abrir. No congelar.',
    'Unopened: refrigerate 2–8 °C, protect from light. After first puncture: may be kept refrigerated or at room temperature (≤30 °C) for up to 30 days; discard afterwards. May be unrefrigerated up to 30 days before opening. Do not freeze.',
  ),
  adverseEffects: {
    common: [
      t(
        'Reacciones en el punto de inyección (96%): eritema, prurito, induración',
        'Injection-site reactions (96%): erythema, pruritus, induration',
      ),
      t(
        'Hiperpigmentación cutánea (78%) y oscurecimiento de nevus preexistentes, reversible al suspender',
        'Skin hyperpigmentation (78%) and darkening of pre-existing naevi, reversible on stopping',
      ),
      t(
        'Náuseas (56%), vómitos, diarrea, dolor abdominal',
        'Nausea (56%), vomiting, diarrhoea, abdominal pain',
      ),
      t(
        'Cefalea (41%), fatiga, dorsalgia, infección respiratoria alta',
        'Headache (41%), fatigue, back pain, upper respiratory infection',
      ),
      t(
        'Erecciones espontáneas (23% de varones) y alteraciones de la excitación sexual en mujeres',
        'Spontaneous penile erections (23% of males) and sexual arousal disturbances in females',
      ),
    ],
    serious: [
      t(
        'Depresión e ideación suicida (advertencia; suspender si aparece)',
        'Depression and suicidal ideation (warning; discontinue if it emerges)',
      ),
      t(
        'Priapismo: acudir a urgencias si erección >4 h',
        'Priapism: seek emergency care for erection >4 h',
      ),
      t(
        'Toxicidad por alcohol bencílico en neonatos (síndrome de jadeo)',
        'Benzyl alcohol toxicity in neonates (gasping syndrome)',
      ),
      t('Hipersensibilidad grave (rara)', 'Serious hypersensitivity (rare)'),
    ],
  },
  contraindications: [
    t(
      'La ficha técnica de EE. UU. no recoge contraindicaciones absolutas; en la UE: hipersensibilidad al principio activo o excipientes',
      'US label lists no absolute contraindications; EU SmPC: hypersensitivity to the active substance or excipients',
    ),
    t(
      'No indicado en obesidad por variantes benignas, de significado incierto o heterocigotas fuera de ensayo, ni en obesidad poligénica común',
      'Not indicated for obesity due to benign, uncertain-significance or heterozygous variants outside trials, nor for common polygenic obesity',
    ),
    t(
      'Neonatos y lactantes de bajo peso (alcohol bencílico)',
      'Neonates and low-birth-weight infants (benzyl alcohol)',
    ),
  ],
  interactions: [
    t(
      'Sin interacciones farmacocinéticas relevantes identificadas (no sustrato ni inhibidor significativo de CYP)',
      'No relevant pharmacokinetic interactions identified (not a significant CYP substrate or inhibitor)',
    ),
    t(
      'Precaución con fármacos que afectan al estado de ánimo; vigilancia conjunta si antidepresivos',
      'Caution with mood-affecting drugs; joint monitoring if on antidepressants',
    ),
  ],
  monitoring: [
    t(
      'Peso, IMC (percentil/z en niños) y puntuación de hambre; valorar respuesta a las 12–16 semanas (≥5% de pérdida o ≥5% de IMC en niños) y suspender si no hay respuesta',
      'Weight, BMI (percentile/z-score in children) and hunger score; assess response at 12–16 weeks (≥5% weight loss or ≥5% BMI in children) and stop if non-responder',
    ),
    t(
      'Exploración cutánea completa basal y anual (nevus, lesiones pigmentadas)',
      'Baseline and annual full-body skin exam (naevi, pigmented lesions)',
    ),
    t(
      'Estado de ánimo e ideación suicida en cada visita',
      'Mood and suicidal ideation at every visit',
    ),
    t('Función renal (ajuste de dosis)', 'Renal function (dose adjustment)'),
  ],
  keyTrials: [
    {
      name: 'Fase 3 POMC/LEPR (Clément)',
      year: 2020,
      finding: t(
        '80% de los pacientes con deficiencia de POMC y 45% con LEPR perdieron ≥10% de peso al año; reducción marcada del hambre.',
        '80% of POMC-deficient and 45% of LEPR-deficient patients lost ≥10% body weight at 1 year; marked hunger reduction.',
      ),
      ref: 'Lancet Diabetes Endocrinol 2020;8:960 (NCT02896192, NCT03287960)',
    },
    {
      name: 'Fase 3 Bardet-Biedl (Haqq)',
      year: 2022,
      finding: t(
        'IMC −7,9% a 52 semanas en BBS; 32,3% de adultos perdieron ≥10%.',
        'BMI −7.9% at 52 weeks in BBS; 32.3% of adults lost ≥10%.',
      ),
      ref: 'Lancet Diabetes Endocrinol 2022;10:859 (NCT03746522)',
    },
    {
      name: 'VENTURE (2–<6 años)',
      year: 2024,
      finding: t(
        'Reducción del IMC en niños pequeños con deficiencias POMC/LEPR o BBS; base de la extensión a ≥2 años.',
        'BMI reduction in young children with POMC/LEPR deficiency or BBS; basis for extension to ≥2 years.',
      ),
    },
    {
      name: 'TRANSCEND',
      year: 2025,
      finding: t(
        'Fase 3 en obesidad hipotalámica adquirida: reducción significativa del IMC frente a placebo a 52 semanas (resultado positivo; cifras a verificar en la publicación).',
        'Phase 3 in acquired hypothalamic obesity: significant BMI reduction vs placebo at 52 weeks (positive result; figures to be verified in the publication).',
      ),
    },
  ],
  references: [
    { label: 'Imcivree US Prescribing Information (Rhythm Pharmaceuticals)' },
    {
      label: 'EMA EPAR Imcivree',
      url: 'https://www.ema.europa.eu/en/medicines/human/EPAR/imcivree',
    },
  ],
  tags: [
    'mc4r',
    'melanocortina',
    'obesidad genética',
    'pomc',
    'lepr',
    'bardet-biedl',
    'diario',
    'huérfano',
  ],
  lastReviewed: '2026-09-19',
}

export const INCRETINS: CompoundEntry[] = [
  liraglutide,
  dulaglutide,
  exenatide,
  lixisenatide,
  pramlintide,
  albiglutide,
  setmelanotide,
]
