import { t, type CompoundEntry } from '../schema'

export const tirzepatide: CompoundEntry = {
  id: 'tirzepatide',
  names: {
    generic: 'Tirzepatida',
    brands: ['Mounjaro', 'Zepbound'],
    aliases: ['LY3298176', 'tirz'],
  },
  category: 'incretin',
  pharmClass: t('Agonista dual de receptores GIP y GLP-1', 'Dual GIP and GLP-1 receptor agonist'),
  summary: t(
    'Péptido de 39 aminoácidos basado en la secuencia de GIP con actividad dual GIP/GLP-1 y semivida de ~5 días. La mayor pérdida de peso entre los fármacos aprobados hasta 2025 (hasta −20,9% en SURMOUNT-1).',
    '39-amino-acid GIP-sequence-based peptide with dual GIP/GLP-1 activity and a ~5-day half-life. Greatest weight loss among approved agents through 2025 (up to −20.9% in SURMOUNT-1).',
  ),
  mechanism: t(
    'Agonismo GIP (afinidad similar al GIP nativo) más agonismo GLP-1 (afinidad ~5× menor que GLP-1 nativo). Mejora la sensibilidad a la insulina, la secreción de insulina y reduce la ingesta; el componente GIP puede atenuar las náuseas y mejorar el metabolismo lipídico del adipocito.',
    'GIP agonism (affinity similar to native GIP) plus GLP-1 agonism (~5× lower affinity than native GLP-1). Improves insulin sensitivity and secretion and reduces intake; the GIP component may blunt nausea and improve adipocyte lipid handling.',
  ),
  indications: [
    t('Diabetes mellitus tipo 2 (Mounjaro)', 'Type 2 diabetes mellitus (Mounjaro)'),
    t(
      'Obesidad / sobrepeso con comorbilidad (Zepbound)',
      'Obesity / overweight with comorbidity (Zepbound)',
    ),
    t(
      'Apnea obstructiva del sueño moderada-grave con obesidad (SURMOUNT-OSA, 2024)',
      'Moderate-severe obstructive sleep apnoea with obesity (SURMOUNT-OSA, 2024)',
    ),
    t(
      'Insuficiencia cardíaca con FE preservada y obesidad (SUMMIT, en evaluación)',
      'HFpEF with obesity (SUMMIT, under review)',
    ),
  ],
  evidence: 'fda_approved',
  regulatory: {
    us: 'approved',
    eu: 'approved',
    notes: t(
      'Retirada de la lista de escasez de la FDA en diciembre 2024; la formulación magistral quedó restringida en 2025. Disponible en viales monodosis (Zepbound) además de plumas.',
      'Removed from the FDA shortage list in December 2024; compounding restricted in 2025. Available as single-dose vials (Zepbound) in addition to pens.',
    ),
  },
  routes: ['sc'],
  defaultUnit: 'mg',
  pk: {
    halfLifeH: 120,
    tmaxH: 24,
    bioavailability: 0.8,
    apparentVolumeL: 10.3,
    molarMassGPerMol: 4813.5,
    source: 'Mounjaro/Zepbound US label §12.3: t½ ≈ 5 días, tmax 8–72 h, F 80%, V ≈ 10.3 L',
  },
  dosing: {
    labeled: t(
      '2,5 mg/semana ×4 semanas (dosis de inicio, no terapéutica) → 5 mg. Aumentar en escalones de 2,5 mg cada ≥4 semanas según tolerancia hasta 7,5 · 10 · 12,5 · 15 mg (máximo).',
      '2.5 mg weekly ×4 weeks (initiation dose, not therapeutic) → 5 mg. Increase in 2.5 mg steps at ≥4-week intervals as tolerated to 7.5 · 10 · 12.5 · 15 mg (maximum).',
    ),
    frequency: t('1×/semana', 'Once weekly'),
    templateIds: ['tirzepatide-standard', 'tirzepatide-slow'],
  },
  reconstitution: t(
    'Plumas y viales listos para usar. Viales magistrales típicos 10–30 mg/vial reconstituidos a 5–10 mg/mL; 2,5 mg = 25 U a 10 mg/mL.',
    'Ready-to-use pens and vials. Typical compounded vials 10–30 mg reconstituted to 5–10 mg/mL; 2.5 mg = 25 U at 10 mg/mL.',
  ),
  storage: t(
    'Nevera 2–8 °C. Puede permanecer sin refrigerar hasta 21 días (<30 °C). No congelar. El vial monodosis se usa una sola vez.',
    'Refrigerate 2–8 °C. May be kept unrefrigerated up to 21 days (<30 °C). Do not freeze. Single-dose vial is for one use.',
  ),
  adverseEffects: {
    common: [
      t(
        'Náuseas (12–18% en DM2; hasta 33% en obesidad), diarrea, vómitos, estreñimiento',
        'Nausea (12–18% in T2D; up to 33% in obesity), diarrhoea, vomiting, constipation',
      ),
      t(
        'Dispepsia, dolor abdominal, disminución del apetito',
        'Dyspepsia, abdominal pain, decreased appetite',
      ),
      t(
        'Reacciones en el punto de inyección, fatiga, caída de cabello (obesidad)',
        'Injection-site reactions, fatigue, hair loss (obesity trials)',
      ),
    ],
    serious: [
      t('Pancreatitis aguda', 'Acute pancreatitis'),
      t('Enfermedad biliar aguda', 'Acute gallbladder disease'),
      t('Hipoglucemia con insulina/sulfonilureas', 'Hypoglycaemia with insulin/sulfonylureas'),
      t(
        'Hipersensibilidad grave (anafilaxia, angioedema)',
        'Serious hypersensitivity (anaphylaxis, angioedema)',
      ),
      t('Lesión renal aguda por depleción de volumen', 'Acute kidney injury from volume depletion'),
      t('Complicaciones de retinopatía diabética', 'Diabetic retinopathy complications'),
      t(
        'Aspiración pulmonar en anestesia general',
        'Pulmonary aspiration under general anaesthesia',
      ),
    ],
  },
  contraindications: [
    t(
      'Antecedente personal/familiar de carcinoma medular de tiroides o MEN2',
      'Personal/family history of medullary thyroid carcinoma or MEN2',
    ),
    t('Hipersensibilidad grave conocida', 'Known serious hypersensitivity'),
  ],
  interactions: [
    t('Insulina y sulfonilureas: reducir dosis', 'Insulin and sulfonylureas: reduce dose'),
    t(
      'Anticonceptivos orales: usar método barrera 4 semanas tras inicio y cada escalada (retraso del vaciado gástrico reduce exposición)',
      'Oral contraceptives: add barrier method 4 weeks after initiation and each dose escalation (delayed gastric emptying lowers exposure)',
    ),
    t('Fármacos orales de absorción rápida: vigilar', 'Rapidly absorbed oral drugs: monitor'),
  ],
  monitoring: [
    t('Peso, HbA1c, glucemia', 'Weight, HbA1c, glucose'),
    t('Frecuencia cardíaca (aumento medio 2–4 lpm)', 'Heart rate (mean increase 2–4 bpm)'),
    t('Función renal si intolerancia GI intensa', 'Renal function with severe GI intolerance'),
    t(
      'Masa magra y fuerza durante la pérdida ponderal',
      'Lean mass and strength during weight loss',
    ),
  ],
  keyTrials: [
    {
      name: 'SURMOUNT-1',
      year: 2022,
      finding: t(
        '−20,9% de peso a 72 semanas con 15 mg (−15% con 5 mg) vs −3,1% placebo.',
        '−20.9% body weight at 72 weeks with 15 mg (−15% with 5 mg) vs −3.1% placebo.',
      ),
      ref: 'NEJM 2022;387:205 (NCT04184622)',
    },
    {
      name: 'SURPASS-2',
      year: 2021,
      finding: t(
        'Superior a semaglutida 1 mg en HbA1c y peso en DM2.',
        'Superior to semaglutide 1 mg for HbA1c and weight in T2D.',
      ),
      ref: 'NEJM 2021;385:503',
    },
    {
      name: 'SURMOUNT-5',
      year: 2025,
      finding: t(
        '−20,2% vs −13,7% frente a semaglutida 2,4 mg en obesidad (comparación directa).',
        '−20.2% vs −13.7% against semaglutide 2.4 mg in obesity (head-to-head).',
      ),
      ref: 'NEJM 2025 (NCT05822830)',
    },
    {
      name: 'SURMOUNT-OSA',
      year: 2024,
      finding: t(
        'Reducción del IAH ~25–29 eventos/h en apnea del sueño con obesidad.',
        'AHI reduction of ~25–29 events/h in OSA with obesity.',
      ),
      ref: 'NEJM 2024;391:1193',
    },
    {
      name: 'SURPASS-CVOT',
      year: 2025,
      finding: t(
        'No inferior a dulaglutida en MACE; reducción de mortalidad por cualquier causa.',
        'Non-inferior to dulaglutide for MACE; reduction in all-cause mortality.',
      ),
      ref: 'NCT04255433',
    },
  ],
  references: [
    {
      label: 'Zepbound US Prescribing Information (Lilly)',
      url: 'https://pi.lilly.com/us/zepbound-uspi.pdf',
    },
    {
      label: 'Mounjaro US Prescribing Information (Lilly)',
      url: 'https://pi.lilly.com/us/mounjaro-uspi.pdf',
    },
    {
      label: 'EMA EPAR Mounjaro',
      url: 'https://www.ema.europa.eu/en/medicines/human/EPAR/mounjaro',
    },
  ],
  tags: ['glp1', 'gip', 'obesidad', 'dm2', 'apnea', 'semanal'],
  lastReviewed: '2026-09-19',
}
