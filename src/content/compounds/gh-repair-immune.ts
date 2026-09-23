import { t, type CompoundEntry } from '../schema'

/**
 * GH axis, tissue-repair and immune peptides.
 *
 * Editorial note: most entries here are research-only compounds without
 * approved labels. Evidence tiers and regulatory fields are deliberately
 * conservative; anecdotal dosing is descriptive, never a recommendation.
 */

// ---------------------------------------------------------------------------
// GH AXIS
// ---------------------------------------------------------------------------

const cjc1295: CompoundEntry = {
  id: 'cjc-1295',
  names: {
    generic: 'CJC-1295',
    brands: [],
    aliases: [
      'CJC-1295 DAC',
      'DAC:GRF',
      'Modified GRF 1-29',
      'Mod GRF 1-29',
      'CJC-1295 sin DAC',
      'GRF(1-29) tetrasustituido',
    ],
  },
  category: 'gh_axis',
  pharmClass: t(
    'Análogo de GHRH (GRF 1-29 tetrasustituido), con o sin complejo de afinidad por albúmina (DAC)',
    'GHRH analogue (tetrasubstituted GRF 1-29), with or without Drug Affinity Complex (DAC)',
  ),
  summary: t(
    'Análogo sintético de GHRH(1-29) con cuatro sustituciones (D-Ala2, Gln8, Ala15, Leu27) que lo protegen de la DPP-4. La forma con DAC (ácido maleimidopropiónico) se une covalentemente a la albúmina y alcanza una semivida de ~6–8 días; la forma sin DAC (Modified GRF 1-29) tiene una semivida de ~30 min y se usa en pulsos junto a un GHRP. El desarrollo clínico (ConjuChem) se detuvo en 2006; hoy solo circula como producto de investigación.',
    'Synthetic GHRH(1-29) analogue with four substitutions (D-Ala2, Gln8, Ala15, Leu27) protecting it from DPP-4. The DAC form (maleimidopropionic acid) binds albumin covalently and reaches a ~6–8-day half-life; the DAC-free form (Modified GRF 1-29) has a ~30-min half-life and is pulsed with a GHRP. Clinical development (ConjuChem) stopped in 2006; today it circulates only as a research chemical.',
  ),
  mechanism: t(
    'Agonista del receptor de GHRH en las somatotropas: aumenta la amplitud de los pulsos fisiológicos de GH sin abolir su ritmo y eleva IGF-1 de forma sostenida (×1,5–3 durante 9–11 días con la forma DAC). Conserva la retroalimentación negativa por somatostatina e IGF-1, por lo que el riesgo de exceso masivo de GH es menor que con GH exógena, aunque la forma DAC aplana la pulsatilidad.',
    'GHRH receptor agonist on somatotrophs: increases the amplitude of physiological GH pulses without abolishing their rhythm and raises IGF-1 sustainedly (×1.5–3 for 9–11 days with the DAC form). Negative feedback by somatostatin and IGF-1 is preserved, so massive GH excess is less likely than with exogenous GH, although the DAC form flattens pulsatility.',
  ),
  indications: [
    t(
      'Lipodistrofia asociada al VIH (fase 2 detenida en 2006)',
      'HIV-associated lipodystrophy (phase 2 halted in 2006)',
    ),
    t('Déficit de GH adulto (preclínico / fase 1)', 'Adult GH deficiency (preclinical / phase 1)'),
    t(
      'Uso comunitario: composición corporal, “antienvejecimiento”, sueño (sin ensayos)',
      'Community use: body composition, “anti-ageing”, sleep (no trials)',
    ),
  ],
  evidence: 'phase1',
  regulatory: {
    us: 'research_only',
    notes: t(
      'Nunca aprobado. Se formuló en farmacias 503A/503B durante años hasta que la FDA lo incluyó en la categoría 2 de sustancias a granel (septiembre 2023, junto a ipamorelina), lo que impide su elaboración magistral legal. Prohibido por la AMA (S2).',
      'Never approved. Compounded by 503A/503B pharmacies for years until FDA placed it in bulk-substance Category 2 (September 2023, alongside ipamorelin), which bars lawful compounding. WADA prohibited (S2).',
    ),
  },
  routes: ['sc'],
  defaultUnit: 'mg',
  pk: {
    halfLifeH: 168,
    molarMassGPerMol: 3648,
    source:
      'Teichman SL et al., JCEM 2006;91:799 (fase 1, dosis única y repetida SC en adultos sanos: t½ 5,8–8,1 días)',
    notes:
      'Parámetros de la forma con DAC. Modified GRF 1-29 (sin DAC) tiene t½ ≈ 30 min y pico de GH a 15–30 min; no se modela aquí. tmax plasmático no publicado con precisión; el motor asume bolo.',
  },
  dosing: {
    investigational: t(
      'Fase 1 (Teichman 2006): dosis única SC de 30–60 µg/kg o dosis repetidas de 30–60 µg/kg cada 7–14 días; GH media ×2–10 durante ≥6 días e IGF-1 ×1,5–3 durante 9–11 días tras una sola dosis.',
      'Phase 1 (Teichman 2006): single SC dose of 30–60 µg/kg or repeated 30–60 µg/kg every 7–14 days; mean GH ×2–10 for ≥6 days and IGF-1 ×1.5–3 for 9–11 days after a single dose.',
    ),
    anecdotal: t(
      'Uso no aprobado — CJC-1295 DAC: 1–2 mg SC 1×/semana (o 0,5–1 mg 2×/semana). Modified GRF 1-29 (sin DAC): 100 µg SC 1–3×/día en ayunas, a menudo junto a ipamorelina 100–300 µg (“blend”). Rangos comunitarios sin ensayos que los respalden.',
      'Unapproved use — CJC-1295 DAC: 1–2 mg SC once weekly (or 0.5–1 mg twice weekly). Modified GRF 1-29 (no DAC): 100 µg SC 1–3×/day fasted, often with ipamorelin 100–300 µg (“blend”). Community ranges with no supporting trials.',
    ),
    frequency: t('DAC: 1×/semana · sin DAC: 1–3×/día', 'DAC: once weekly · no DAC: 1–3×/day'),
  },
  reconstitution: t(
    'Viales liofilizados de 2 mg (DAC) o 2–5 mg (Mod GRF). 2 mg + 1 mL de agua bacteriostática = 2 mg/mL → 1 mg = 0,5 mL = 50 U en jeringa U-100; 100 µg = 5 U. Mod GRF 5 mg + 2,5 mL = 2 mg/mL → 100 µg = 5 U. Reconstituido: nevera 2–8 °C, 3–4 semanas, protegido de la luz; no agitar.',
    'Lyophilised vials of 2 mg (DAC) or 2–5 mg (Mod GRF). 2 mg + 1 mL bacteriostatic water = 2 mg/mL → 1 mg = 0.5 mL = 50 U on a U-100 syringe; 100 µg = 5 U. Mod GRF 5 mg + 2.5 mL = 2 mg/mL → 100 µg = 5 U. Reconstituted: refrigerate 2–8 °C, 3–4 weeks, protect from light; do not shake.',
  ),
  storage: t(
    'Liofilizado: nevera 2–8 °C (o −20 °C a largo plazo), protegido de la luz; tolera días a temperatura ambiente durante el transporte. Reconstituido: nevera, no congelar.',
    'Lyophilised: refrigerate 2–8 °C (or −20 °C long term), protect from light; tolerates days at room temperature in transit. Reconstituted: refrigerate, do not freeze.',
  ),
  adverseEffects: {
    common: [
      t(
        'Reacciones en el punto de inyección (eritema, dolor, induración)',
        'Injection-site reactions (erythema, pain, induration)',
      ),
      t(
        'Rubefacción facial, cefalea, mareo transitorio',
        'Facial flushing, headache, transient dizziness',
      ),
      t(
        'Retención hídrica leve, parestesias, artralgia',
        'Mild fluid retention, paraesthesia, arthralgia',
      ),
      t('Somnolencia posdosis', 'Post-dose drowsiness'),
    ],
    serious: [
      t(
        'Hiperglucemia / resistencia a la insulina con elevación sostenida de GH',
        'Hyperglycaemia / insulin resistance with sustained GH elevation',
      ),
      t(
        'Crecimiento de neoplasias ocultas mediado por IGF-1 (teórico)',
        'IGF-1-mediated growth of occult neoplasms (theoretical)',
      ),
      t(
        'Pérdida de pulsatilidad de GH con la forma DAC (“GH bleed”): efecto a largo plazo desconocido',
        'Loss of GH pulsatility with the DAC form (“GH bleed”): long-term effect unknown',
      ),
      t(
        'Hipersensibilidad; una muerte en el programa de fase 2 (no atribuida al fármaco) motivó su interrupción',
        'Hypersensitivity; one death in the phase 2 programme (not attributed to drug) led to its halt',
      ),
      t(
        'Sin datos de seguridad a largo plazo ni de inmunogenicidad',
        'No long-term safety or immunogenicity data',
      ),
    ],
  },
  contraindications: [
    t('Neoplasia activa o antecedente reciente', 'Active or recent malignancy'),
    t('Embarazo y lactancia', 'Pregnancy and lactation'),
    t('Retinopatía diabética proliferativa', 'Proliferative diabetic retinopathy'),
    t('Hipertensión intracraneal', 'Intracranial hypertension'),
    t('Hipersensibilidad conocida', 'Known hypersensitivity'),
  ],
  interactions: [
    t('Glucocorticoides: atenúan la respuesta de GH', 'Glucocorticoids: blunt the GH response'),
    t(
      'Insulina y antidiabéticos: posible hiperglucemia, ajustar',
      'Insulin and antidiabetics: possible hyperglycaemia, adjust',
    ),
    t(
      'Estrógenos orales: reducen la respuesta de IGF-1',
      'Oral oestrogens: reduce the IGF-1 response',
    ),
    t(
      'Levotiroxina: la GH puede desenmascarar hipotiroidismo central',
      'Levothyroxine: GH may unmask central hypothyroidism',
    ),
    t('Análogos de somatostatina: antagonizan', 'Somatostatin analogues: antagonise'),
  ],
  monitoring: [
    t('IGF-1 basal y a las 4–8 semanas', 'Baseline and 4–8-week IGF-1'),
    t('Glucosa en ayunas / HbA1c', 'Fasting glucose / HbA1c'),
    t('TSH y T4 libre', 'TSH and free T4'),
    t('Peso, edema, presión arterial', 'Weight, oedema, blood pressure'),
  ],
  keyTrials: [
    {
      name: 'Teichman (fase 1)',
      year: 2006,
      finding: t(
        'Adultos sanos de 21–61 años: dosis únicas de 30–60 µg/kg elevaron la GH media ×2–10 durante ≥6 días e IGF-1 ×1,5–3 durante 9–11 días; t½ 5,8–8,1 días; bien tolerado.',
        'Healthy adults aged 21–61: single 30–60 µg/kg doses raised mean GH ×2–10 for ≥6 days and IGF-1 ×1.5–3 for 9–11 days; t½ 5.8–8.1 days; well tolerated.',
      ),
      ref: 'JCEM 2006;91:799',
    },
    {
      name: 'Ionescu & Frohman',
      year: 2006,
      finding: t(
        'La secreción pulsátil de GH persiste durante la estimulación continua con CJC-1295: aumenta la amplitud de los pulsos y el nivel basal sin alterar la frecuencia.',
        'Pulsatile GH secretion persists during continuous CJC-1295 stimulation: pulse amplitude and trough rise without change in frequency.',
      ),
      ref: 'JCEM 2006;91:4792',
    },
  ],
  references: [
    {
      label:
        'Teichman SL et al. Prolonged stimulation of GH and IGF-1 secretion by CJC-1295. JCEM 2006',
    },
    {
      label:
        'Ionescu M, Frohman LA. Pulsatile secretion of GH persists during continuous stimulation by CJC-1295. JCEM 2006',
    },
    {
      label:
        'FDA — Bulk drug substances nominated for use in compounding under section 503A (Category 2 list, 2023)',
    },
    { label: 'WADA Prohibited List — S2 peptide hormones, growth factors and related substances' },
  ],
  tags: ['ghrh', 'gh', 'igf-1', 'semanal', 'dac', 'investigación'],
  lastReviewed: '2026-09-19',
}

const ipamorelin: CompoundEntry = {
  id: 'ipamorelin',
  names: {
    generic: 'Ipamorelina',
    brands: [],
    aliases: ['NNC 26-0161', 'ipa'],
  },
  category: 'gh_axis',
  pharmClass: t(
    'Secretagogo de GH pentapeptídico; agonista selectivo del receptor de ghrelina (GHS-R1a)',
    'Pentapeptide GH secretagogue; selective ghrelin receptor (GHS-R1a) agonist',
  ),
  summary: t(
    'Pentapéptido (Aib-His-D-2-Nal-D-Phe-Lys-NH2) desarrollado por Novo Nordisk como el primer GHRP selectivo: libera GH con potencia similar a GHRP-6 sin elevar ACTH/cortisol ni prolactina a dosis equipotentes. Un programa de fase 2 (Helsinn) en íleo posoperatorio no demostró eficacia. Hoy solo producto de investigación, frecuentemente combinado con CJC-1295 sin DAC.',
    'Pentapeptide (Aib-His-D-2-Nal-D-Phe-Lys-NH2) developed by Novo Nordisk as the first selective GHRP: releases GH with GHRP-6-like potency without raising ACTH/cortisol or prolactin at equipotent doses. A phase 2 programme (Helsinn) in postoperative ileus failed to show efficacy. Now research-only, frequently combined with DAC-free CJC-1295.',
  ),
  mechanism: t(
    'Agonista del GHS-R1a hipofisario e hipotalámico: estimula la liberación de GH de forma sinérgica con GHRH y suprime la somatostatina. A diferencia de GHRP-2/6 y hexarelina, en animales y humanos no incrementa cortisol, ACTH ni prolactina de forma relevante ni estimula marcadamente el apetito.',
    'Pituitary and hypothalamic GHS-R1a agonist: stimulates GH release synergistically with GHRH and suppresses somatostatin. Unlike GHRP-2/6 and hexarelin, it does not meaningfully raise cortisol, ACTH or prolactin in animals or humans, nor markedly stimulate appetite.',
  ),
  indications: [
    t(
      'Íleo posoperatorio tras resección intestinal (fase 2, negativo)',
      'Postoperative ileus after bowel resection (phase 2, negative)',
    ),
    t(
      'Estados catabólicos / composición corporal (preclínico)',
      'Catabolic states / body composition (preclinical)',
    ),
    t(
      'Uso comunitario: “antienvejecimiento”, recuperación, sueño (sin ensayos)',
      'Community use: “anti-ageing”, recovery, sleep (no trials)',
    ),
  ],
  evidence: 'phase2',
  regulatory: {
    us: 'research_only',
    notes: t(
      'Nunca aprobado. Ampliamente formulado en 503A/503B (solo o en “blend” con CJC-1295) hasta su inclusión en la categoría 2 de la FDA en septiembre de 2023 por ausencia de datos de seguridad e inmunogenicidad. Prohibido por la AMA (S2).',
      'Never approved. Widely compounded by 503A/503B pharmacies (alone or blended with CJC-1295) until FDA placed it in Category 2 in September 2023 for lack of safety and immunogenicity data. WADA prohibited (S2).',
    ),
  },
  routes: ['sc', 'iv'],
  defaultUnit: 'mcg',
  pk: {
    halfLifeH: 2,
    molarMassGPerMol: 711.9,
    source:
      'Gobburu JV et al., Pharm Res 1999;16:1412 (fase 1 IV en voluntarios sanos, modelo PK/PD)',
    notes:
      'Datos IV. Tras SC el pico de GH aparece a ~30–60 min y vuelve al basal en 2–3 h; biodisponibilidad SC no publicada.',
  },
  dosing: {
    investigational: t(
      'Fase 1: bolos IV en voluntarios sanos con liberación de GH dosis-dependiente. Fase 2 en íleo posoperatorio (Helsinn): 0,03 mg/kg IV 2×/día hasta 7 días.',
      'Phase 1: IV boluses in healthy volunteers with dose-dependent GH release. Phase 2 in postoperative ileus (Helsinn): 0.03 mg/kg IV twice daily for up to 7 days.',
    ),
    anecdotal: t(
      'Uso no aprobado — 200–300 µg SC 1–3×/día (al acostarse y/o en ayunas), habitualmente con Modified GRF 1-29 100 µg; ciclos de 8–12 semanas. Rangos comunitarios.',
      'Unapproved use — 200–300 µg SC 1–3×/day (bedtime and/or fasted), usually with Modified GRF 1-29 100 µg; 8–12-week cycles. Community ranges.',
    ),
    frequency: t('1–3×/día', '1–3×/day'),
  },
  reconstitution: t(
    'Viales liofilizados de 2 mg y 5 mg. 5 mg + 2,5 mL de agua bacteriostática = 2 mg/mL → 200 µg = 0,1 mL = 10 U en jeringa U-100; 300 µg = 15 U. 2 mg + 1 mL = 2 mg/mL. Reconstituido en nevera 2–8 °C durante 3–4 semanas.',
    'Lyophilised vials of 2 mg and 5 mg. 5 mg + 2.5 mL bacteriostatic water = 2 mg/mL → 200 µg = 0.1 mL = 10 U on a U-100 syringe; 300 µg = 15 U. 2 mg + 1 mL = 2 mg/mL. Reconstituted: refrigerate 2–8 °C for 3–4 weeks.',
  ),
  storage: t(
    'Liofilizado: nevera 2–8 °C protegido de la luz (congelador a largo plazo). Reconstituido: nevera, no congelar, no agitar.',
    'Lyophilised: refrigerate 2–8 °C, protect from light (freezer long term). Reconstituted: refrigerate, do not freeze, do not shake.',
  ),
  adverseEffects: {
    common: [
      t('Cefalea, rubefacción, mareo transitorio', 'Headache, flushing, transient dizziness'),
      t('Reacciones locales en el punto de inyección', 'Injection-site reactions'),
      t(
        'Aumento leve del apetito, retención hídrica, somnolencia',
        'Mild appetite increase, fluid retention, drowsiness',
      ),
    ],
    serious: [
      t(
        'Hiperglucemia / resistencia a la insulina con uso crónico',
        'Hyperglycaemia / insulin resistance with chronic use',
      ),
      t(
        'Crecimiento de neoplasias ocultas por IGF-1 (teórico)',
        'IGF-1-mediated growth of occult neoplasms (theoretical)',
      ),
      t('Hipersensibilidad', 'Hypersensitivity'),
      t(
        'Seguridad a largo plazo e inmunogenicidad desconocidas',
        'Unknown long-term safety and immunogenicity',
      ),
    ],
  },
  contraindications: [
    t('Neoplasia activa', 'Active malignancy'),
    t('Embarazo y lactancia', 'Pregnancy and lactation'),
    t(
      'Diabetes mal controlada o retinopatía proliferativa',
      'Poorly controlled diabetes or proliferative retinopathy',
    ),
    t('Hipersensibilidad conocida', 'Known hypersensitivity'),
  ],
  interactions: [
    t('Glucocorticoides: atenúan la liberación de GH', 'Glucocorticoids: blunt GH release'),
    t(
      'Insulina y antidiabéticos: ajustar por hiperglucemia',
      'Insulin and antidiabetics: adjust for hyperglycaemia',
    ),
    t(
      'Comida (glucosa, grasa) en las 1–2 h previas: reduce el pico de GH; se administra en ayunas',
      'Food (glucose, fat) within 1–2 h: reduces the GH peak; given fasted',
    ),
    t(
      'GHRH / Mod GRF 1-29: sinergia en la liberación de GH',
      'GHRH / Mod GRF 1-29: synergistic GH release',
    ),
    t('Análogos de somatostatina: antagonizan', 'Somatostatin analogues: antagonise'),
  ],
  monitoring: [
    t('IGF-1 a las 4–8 semanas', 'IGF-1 at 4–8 weeks'),
    t('Glucosa en ayunas / HbA1c', 'Fasting glucose / HbA1c'),
    t('Peso y edema', 'Weight and oedema'),
    t(
      'Cortisol y prolactina solo si hay síntomas (no se esperan cambios)',
      'Cortisol and prolactin only if symptomatic (no change expected)',
    ),
  ],
  keyTrials: [
    {
      name: 'Raun (Novo Nordisk)',
      year: 1998,
      finding: t(
        'Primer secretagogo de GH selectivo: en rata y cerdo libera GH como GHRP-6 sin elevar ACTH ni cortisol a dosis equipotentes.',
        'First selective GH secretagogue: releases GH like GHRP-6 in rat and swine without raising ACTH or cortisol at equipotent doses.',
      ),
      ref: 'Eur J Endocrinol 1998;139:552',
    },
    {
      name: 'Gobburu (fase 1)',
      year: 1999,
      finding: t(
        'Voluntarios sanos, IV: modelo PK/PD con t½ ≈ 2 h y liberación de GH dosis-dependiente.',
        'Healthy volunteers, IV: PK/PD model with t½ ≈ 2 h and dose-dependent GH release.',
      ),
      ref: 'Pharm Res 1999;16:1412',
    },
    {
      name: 'Fase 2 íleo posoperatorio (Helsinn)',
      year: 2016,
      finding: t(
        'No superó a placebo en la recuperación de la función gastrointestinal tras resección intestinal; programa abandonado.',
        'Did not beat placebo for recovery of GI function after bowel resection; programme discontinued.',
      ),
    },
  ],
  references: [
    {
      label:
        'Raun K et al. Ipamorelin, the first selective growth hormone secretagogue. Eur J Endocrinol 1998',
    },
    {
      label:
        'Gobburu JV et al. Pharmacokinetic-pharmacodynamic modeling of ipamorelin in human volunteers. Pharm Res 1999',
    },
    { label: 'FDA — 503A bulk drug substances Category 2 (September 2023)' },
    { label: 'WADA Prohibited List — S2' },
  ],
  tags: ['ghrp', 'ghs-r1a', 'gh', 'selectivo', 'investigación'],
  lastReviewed: '2026-09-19',
}

const sermorelin: CompoundEntry = {
  id: 'sermorelin',
  names: {
    generic: 'Sermorelina',
    brands: ['Geref (retirado)'],
    aliases: ['GHRH(1-29)NH2', 'GRF 1-29', 'acetato de sermorelina'],
  },
  category: 'gh_axis',
  pharmClass: t(
    'Análogo de GHRH (fragmento 1-29 de la GHRH humana)',
    'GHRH analogue (fragment 1-29 of human GHRH)',
  ),
  summary: t(
    'Fragmento activo 1-29 de la GHRH humana. Geref (Serono) fue aprobado por la FDA como diagnóstico (1990) y para el déficit de GH pediátrico (1997) y se retiró del mercado en 2008 por motivos no relacionados con la seguridad. Sigue disponible en EE. UU. mediante formulación magistral (503A) y se usa fuera de indicación en adultos para el “declive somatopáusico”.',
    'Active 1-29 fragment of human GHRH. Geref (Serono) was FDA-approved as a diagnostic (1990) and for paediatric GH deficiency (1997) and was withdrawn in 2008 for reasons unrelated to safety. Still available in the US through 503A compounding and used off-label in adults for “somatopause”.',
  ),
  mechanism: t(
    'Agonista del receptor de GHRH: estimula la síntesis y la liberación pulsátil de GH por las somatotropas preservando la retroalimentación por IGF-1 y somatostatina. Semivida muy corta (~10–20 min): administrado al acostarse genera un pulso nocturno fisiológico.',
    'GHRH receptor agonist: stimulates GH synthesis and pulsatile release from somatotrophs while preserving IGF-1 and somatostatin feedback. Very short half-life (~10–20 min): given at bedtime it produces a physiological nocturnal pulse.',
  ),
  indications: [
    t(
      'Déficit de GH pediátrico (etiqueta Geref, retirada)',
      'Paediatric GH deficiency (Geref label, withdrawn)',
    ),
    t(
      'Prueba diagnóstica de reserva hipofisaria de GH (1 µg/kg IV)',
      'Diagnostic test of pituitary GH reserve (1 µg/kg IV)',
    ),
    t(
      'Fuera de indicación: déficit de GH adulto / somatopausia, composición corporal, sueño',
      'Off-label: adult GH deficiency / somatopause, body composition, sleep',
    ),
  ],
  evidence: 'withdrawn',
  regulatory: {
    us: 'compounded',
    notes: t(
      'Geref discontinuado en 2008 (causas comerciales/producción). Al haber sido componente de un fármaco aprobado, el acetato de sermorelina puede formularse en farmacias 503A con receta y no está afectado por las listas de categoría 2 de 2023. No autorizado actualmente en la UE.',
      'Geref discontinued in 2008 (commercial/manufacturing reasons). Having been a component of an approved drug, sermorelin acetate may be compounded by 503A pharmacies on prescription and is not affected by the 2023 Category 2 lists. Not currently authorised in the EU.',
    ),
  },
  routes: ['sc', 'iv'],
  defaultUnit: 'mcg',
  pk: {
    halfLifeH: 0.2,
    bioavailability: 0.06,
    molarMassGPerMol: 3358,
    source: 'Geref US label (Clinical Pharmacology): t½ IV ≈ 11–12 min; biodisponibilidad SC ≈ 6 %',
    notes:
      'Pico de GH 15–60 min tras la inyección SC. La cinética plasmática es irrelevante para el efecto, que depende del pulso de GH inducido.',
  },
  dosing: {
    labeled: t(
      'Geref (ficha retirada): 30 µg/kg SC 1×/día al acostarse en niños con déficit de GH. Prueba diagnóstica: 1 µg/kg IV con GH a 15, 30, 45 y 60 min.',
      'Geref (withdrawn label): 30 µg/kg SC once daily at bedtime in children with GH deficiency. Diagnostic test: 1 µg/kg IV with GH at 15, 30, 45 and 60 min.',
    ),
    investigational: t(
      'Adultos mayores sanos: 10 µg/kg SC al acostarse durante 16 semanas (Khorram 1997) o 1–2 mg SC nocturnos durante 6 semanas (Vittone 1997) elevaron GH e IGF-1 con efectos modestos sobre composición corporal.',
      'Healthy older adults: 10 µg/kg SC at bedtime for 16 weeks (Khorram 1997) or 1–2 mg SC nightly for 6 weeks (Vittone 1997) raised GH and IGF-1 with modest body-composition effects.',
    ),
    anecdotal: t(
      'Uso no aprobado — 200–500 µg SC al acostarse (habitualmente 300 µg) 5–7 noches/semana, a veces combinada con ipamorelina; rangos habituales de la formulación magistral estadounidense.',
      'Unapproved use — 200–500 µg SC at bedtime (usually 300 µg) 5–7 nights/week, sometimes combined with ipamorelin; usual US compounding ranges.',
    ),
    frequency: t('1×/día al acostarse', 'Once daily at bedtime'),
  },
  reconstitution: t(
    'Viales liofilizados magistrales de 2, 5, 9 y 15 mg. 5 mg + 2,5 mL de agua bacteriostática = 2 mg/mL → 300 µg = 0,15 mL = 15 U en jeringa U-100. 9 mg + 3 mL = 3 mg/mL → 300 µg = 10 U. Reconstituido en nevera 2–8 °C, uso en 3–4 semanas.',
    'Compounded lyophilised vials of 2, 5, 9 and 15 mg. 5 mg + 2.5 mL bacteriostatic water = 2 mg/mL → 300 µg = 0.15 mL = 15 U on a U-100 syringe. 9 mg + 3 mL = 3 mg/mL → 300 µg = 10 U. Reconstituted: refrigerate 2–8 °C, use within 3–4 weeks.',
  ),
  storage: t(
    'Liofilizado: nevera 2–8 °C protegido de la luz. Reconstituido: nevera, no congelar.',
    'Lyophilised: refrigerate 2–8 °C, protect from light. Reconstituted: refrigerate, do not freeze.',
  ),
  adverseEffects: {
    common: [
      t(
        'Reacciones locales (dolor, eritema, hinchazón) en ~1 de cada 6 pacientes del ensayo pediátrico',
        'Local reactions (pain, erythema, swelling) in ~1 in 6 patients of the paediatric trial',
      ),
      t('Rubefacción facial, cefalea, mareo', 'Facial flushing, headache, dizziness'),
      t(
        'Disgeusia, somnolencia o hiperactividad, urticaria',
        'Dysgeusia, drowsiness or hyperactivity, urticaria',
      ),
    ],
    serious: [
      t('Hipersensibilidad', 'Hypersensitivity'),
      t('Hiperglucemia con uso prolongado', 'Hyperglycaemia with prolonged use'),
      t(
        'Crecimiento de neoplasias por IGF-1 (teórico)',
        'IGF-1-mediated neoplasm growth (theoretical)',
      ),
      t(
        'Anticuerpos anti-GHRH (raros, sin repercusión clínica descrita)',
        'Anti-GHRH antibodies (rare, no described clinical impact)',
      ),
    ],
  },
  contraindications: [
    t('Neoplasia activa', 'Active malignancy'),
    t('Hipersensibilidad conocida', 'Known hypersensitivity'),
    t('Embarazo y lactancia', 'Pregnancy and lactation'),
    t(
      'Hipotiroidismo no tratado (respuesta atenuada; corregir antes)',
      'Untreated hypothyroidism (blunted response; correct first)',
    ),
  ],
  interactions: [
    t('Glucocorticoides: inhiben la respuesta de GH', 'Glucocorticoids: inhibit the GH response'),
    t(
      'Antimuscarínicos (atropina, pirenzepina) y análogos de somatostatina: atenúan la liberación de GH',
      'Antimuscarinics (atropine, pirenzepine) and somatostatin analogues: blunt GH release',
    ),
    t('Insulina y antidiabéticos: ajustar', 'Insulin and antidiabetics: adjust'),
    t(
      'Levotiroxina: revisar dosis; la GH aumenta la conversión T4→T3',
      'Levothyroxine: review dose; GH increases T4→T3 conversion',
    ),
  ],
  monitoring: [
    t(
      'IGF-1 (objetivo dentro del rango normal para edad)',
      'IGF-1 (target within age-adjusted normal range)',
    ),
    t('Glucosa en ayunas / HbA1c', 'Fasting glucose / HbA1c'),
    t('TSH y T4 libre', 'TSH and free T4'),
    t('Edema, artralgia, peso', 'Oedema, arthralgia, weight'),
  ],
  keyTrials: [
    {
      name: 'Corpas',
      year: 1992,
      finding: t(
        'GHRH(1-29) 2×/día durante 14 días revirtió los niveles bajos de GH e IGF-1 en varones ancianos.',
        'GHRH(1-29) twice daily for 14 days reversed low GH and IGF-1 in elderly men.',
      ),
      ref: 'JCEM 1992',
    },
    {
      name: 'Khorram',
      year: 1997,
      finding: t(
        '16 semanas de 10 µg/kg SC nocturnos en adultos de 60–79 años: aumento de IGF-1, mejora de masa magra en varones y del grosor cutáneo; bien tolerado.',
        '16 weeks of 10 µg/kg SC nightly in adults aged 60–79: IGF-1 rise, improved lean mass in men and skin thickness; well tolerated.',
      ),
      ref: 'JCEM 1997',
    },
    {
      name: 'Vittone',
      year: 1997,
      finding: t(
        '6 semanas de 1–2 mg SC nocturnos en varones mayores sanos: aumento de GH e IGF-1 con mejoras funcionales modestas.',
        '6 weeks of 1–2 mg SC nightly in healthy older men: GH and IGF-1 rise with modest functional improvements.',
      ),
      ref: 'Metabolism 1997',
    },
  ],
  references: [
    {
      label: 'Geref (sermorelin acetate) US Prescribing Information — Serono (archivo DailyMed)',
      url: 'https://dailymed.nlm.nih.gov/dailymed/',
    },
    {
      label:
        'Corpas E et al. GHRH-(1-29) twice daily reverses the decreased GH and IGF-I levels in old men. JCEM 1992',
    },
    { label: 'Khorram O et al. Effects of GHRH analog administration in the elderly. JCEM 1997' },
  ],
  tags: ['ghrh', 'gh', 'magistral', 'nocturno', 'retirado'],
  lastReviewed: '2026-09-19',
}

const tesamorelin: CompoundEntry = {
  id: 'tesamorelin',
  names: {
    generic: 'Tesamorelina',
    brands: ['Egrifta', 'Egrifta SV', 'Egrifta WR'],
    aliases: ['TH9507', 'trans-3-hexenoil-GHRH(1-44)'],
  },
  category: 'gh_axis',
  pharmClass: t('Análogo estabilizado de GHRH(1-44)', 'Stabilised GHRH(1-44) analogue'),
  summary: t(
    'GHRH humana completa (1-44) con un grupo trans-3-hexenoílo N-terminal que la protege de la DPP-4. Aprobada por la FDA en 2010 para reducir el exceso de grasa abdominal en la lipodistrofia asociada al VIH (−15 % de tejido adiposo visceral a 26 semanas). Único análogo de GHRH comercializado; estudiada también en esteatosis hepática del VIH y en deterioro cognitivo leve.',
    'Full-length human GHRH (1-44) with an N-terminal trans-3-hexenoyl group protecting it from DPP-4. FDA-approved in 2010 to reduce excess abdominal fat in HIV-associated lipodystrophy (−15% visceral adipose tissue at 26 weeks). The only marketed GHRH analogue; also studied in HIV-associated hepatic steatosis and mild cognitive impairment.',
  ),
  mechanism: t(
    'Agonista del receptor de GHRH: aumenta la GH pulsátil endógena e IGF-1 conservando la retroalimentación. La GH lipolítica reduce preferentemente la grasa visceral con menor efecto sobre la subcutánea; el impacto sobre la sensibilidad a la insulina es menor que con GH exógena, aunque eleva la glucemia en algunos pacientes.',
    'GHRH receptor agonist: increases endogenous pulsatile GH and IGF-1 while preserving feedback. Lipolytic GH preferentially reduces visceral fat with less effect on subcutaneous fat; impact on insulin sensitivity is smaller than with exogenous GH, although glucose rises in some patients.',
  ),
  indications: [
    t(
      'Reducción del exceso de grasa abdominal en lipodistrofia asociada al VIH (aprobado)',
      'Reduction of excess abdominal fat in HIV-associated lipodystrophy (approved)',
    ),
    t(
      'Esteatosis hepática asociada al VIH (fase 2, Stanley 2019)',
      'HIV-associated hepatic steatosis (phase 2, Stanley 2019)',
    ),
    t(
      'Deterioro cognitivo leve / envejecimiento cognitivo (fase 2, Baker 2012)',
      'Mild cognitive impairment / cognitive ageing (phase 2, Baker 2012)',
    ),
  ],
  evidence: 'fda_approved',
  regulatory: {
    us: 'approved',
    notes: t(
      'No autorizada en la UE (Theratechnologies retiró la solicitud a la EMA); aprobada en Canadá. Egrifta SV (2 mg, 2019) y Egrifta WR (1,28 mg/día con reconstitución semanal, 2025) han sustituido a la presentación original de 1 mg. No modifica la evolución del VIH y no está indicada para pérdida de peso.',
      'Not authorised in the EU (Theratechnologies withdrew its EMA application); approved in Canada. Egrifta SV (2 mg, 2019) and Egrifta WR (1.28 mg/day, weekly reconstitution, 2025) replaced the original 1 mg presentation. Does not alter HIV course and is not indicated for weight loss.',
    ),
  },
  routes: ['sc'],
  defaultUnit: 'mg',
  pk: {
    halfLifeH: 0.63,
    tmaxH: 0.15,
    bioavailability: 0.04,
    apparentVolumeL: 10.5,
    molarMassGPerMol: 5136,
    source:
      'Egrifta US label §12.3: t½ 26 min (sanos) – 38 min (VIH), tmax ≈ 0,15 h, F < 4 %, V ≈ 9,4–10,5 L',
    notes:
      'Semivida ultracorta: el efecto clínico depende del pulso de GH inducido, no de la concentración plasmática del fármaco.',
  },
  dosing: {
    labeled: t(
      'Egrifta SV: 2 mg SC 1×/día en abdomen (vial de 2 mg reconstituido en 0,5 mL). Egrifta WR: 1,28 mg SC 1×/día a partir de un vial multidosis reconstituido 1×/semana. Reevaluar a los 6 meses y continuar solo si hay reducción clara de la grasa visceral.',
      'Egrifta SV: 2 mg SC once daily into the abdomen (2 mg vial reconstituted in 0.5 mL). Egrifta WR: 1.28 mg SC once daily from a multi-dose vial reconstituted once weekly. Reassess at 6 months and continue only with clear visceral-fat reduction.',
    ),
    investigational: t(
      'Esteatosis hepática en VIH: 2 mg/día durante 12 meses (Stanley 2019). Deterioro cognitivo leve: 1 mg/día durante 20 semanas (Baker 2012).',
      'Hepatic steatosis in HIV: 2 mg/day for 12 months (Stanley 2019). Mild cognitive impairment: 1 mg/day for 20 weeks (Baker 2012).',
    ),
    anecdotal: t(
      'Uso no aprobado — 1–2 mg SC al acostarse, 5–7 días/semana, para grasa visceral en no infectados por VIH; a veces alternada con ipamorelina. Sin ensayos en esta población salvo los de cognición.',
      'Unapproved use — 1–2 mg SC at bedtime, 5–7 days/week, for visceral fat in HIV-negative people; sometimes alternated with ipamorelin. No trials in this population other than the cognition studies.',
    ),
    frequency: t('1×/día', 'Once daily'),
  },
  reconstitution: t(
    'Egrifta SV: vial de 2 mg + 0,5 mL de agua estéril, administrar de inmediato. Egrifta WR: reconstituir 1×/semana según ficha y conservar en nevera hasta 7 días. Viales magistrales de 5–10 mg (fuera de ficha): 10 mg + 2 mL de agua bacteriostática = 5 mg/mL → 2 mg = 0,4 mL = 40 U en jeringa U-100; 1 mg = 20 U. Reconstituido magistral: nevera ≤ 4 semanas, proteger de la luz.',
    'Egrifta SV: 2 mg vial + 0.5 mL sterile water, inject immediately. Egrifta WR: reconstitute once weekly per label and refrigerate up to 7 days. Compounded 5–10 mg vials (off-label): 10 mg + 2 mL bacteriostatic water = 5 mg/mL → 2 mg = 0.4 mL = 40 U on a U-100 syringe; 1 mg = 20 U. Compounded reconstituted: refrigerate ≤ 4 weeks, protect from light.',
  ),
  storage: t(
    'Egrifta SV liofilizado: temperatura ambiente 20–25 °C protegido de la luz; una vez reconstituido, uso inmediato. Egrifta WR: consultar ficha (multidosis en nevera tras reconstituir). Viales magistrales: nevera 2–8 °C.',
    'Egrifta SV lyophilised: room temperature 20–25 °C, protect from light; once reconstituted, use immediately. Egrifta WR: see label (multi-dose refrigerated after reconstitution). Compounded vials: refrigerate 2–8 °C.',
  ),
  adverseEffects: {
    common: [
      t(
        'Artralgia (~13 %), mialgia, dolor en extremidades',
        'Arthralgia (~13%), myalgia, limb pain',
      ),
      t(
        'Eritema, prurito y dolor en el punto de inyección (8–9 %)',
        'Injection-site erythema, pruritus and pain (8–9%)',
      ),
      t(
        'Edema periférico (~6 %), parestesias, hipoestesia, síndrome del túnel carpiano',
        'Peripheral oedema (~6%), paraesthesia, hypoaesthesia, carpal tunnel syndrome',
      ),
      t('Náuseas, exantema, hiperhidrosis', 'Nausea, rash, hyperhidrosis'),
    ],
    serious: [
      t(
        'Intolerancia a la glucosa / diabetes de nueva aparición; aumento de HbA1c',
        'Glucose intolerance / new-onset diabetes; HbA1c rise',
      ),
      t(
        'Hipersensibilidad (urticaria, angioedema) hasta ~4 %',
        'Hypersensitivity (urticaria, angioedema) up to ~4%',
      ),
      t(
        'Elevación de IGF-1 por encima de +3 SDS en una fracción de pacientes; posible crecimiento de neoplasias',
        'IGF-1 above +3 SDS in a fraction of patients; possible neoplasm growth',
      ),
      t(
        'Retención hídrica con artralgia y neuropatía por atrapamiento',
        'Fluid retention with arthralgia and entrapment neuropathy',
      ),
      t('Recuperación de la grasa visceral al suspender', 'Visceral fat regain on discontinuation'),
    ],
  },
  contraindications: [
    t(
      'Alteración del eje hipotálamo-hipofisario: hipofisectomía, hipopituitarismo, tumor o cirugía hipofisaria, radiación craneal, traumatismo craneal',
      'Disruption of the hypothalamic-pituitary axis: hypophysectomy, hypopituitarism, pituitary tumour or surgery, cranial irradiation, head trauma',
    ),
    t('Neoplasia activa', 'Active malignancy'),
    t(
      'Embarazo (la grasa visceral aumenta fisiológicamente; riesgo fetal)',
      'Pregnancy (visceral fat rises physiologically; fetal risk)',
    ),
    t('Hipersensibilidad a tesamorelina o manitol', 'Hypersensitivity to tesamorelin or mannitol'),
  ],
  interactions: [
    t(
      'Sustratos de CYP450: la GH puede aumentar su aclaramiento (anticonvulsivos, ciclosporina, esteroides sexuales)',
      'CYP450 substrates: GH may increase their clearance (anticonvulsants, ciclosporin, sex steroids)',
    ),
    t(
      'Cortisona/prednisona: la GH inhibe la 11β-HSD1 y reduce la conversión a cortisol/prednisolona; puede requerir aumento de dosis',
      'Cortisone/prednisone: GH inhibits 11β-HSD1 and reduces conversion to cortisol/prednisolone; may need dose increase',
    ),
    t(
      'Insulina y antidiabéticos: ajustar por hiperglucemia',
      'Insulin and antidiabetics: adjust for hyperglycaemia',
    ),
    t(
      'Estrógenos orales: reducen la respuesta de IGF-1',
      'Oral oestrogens: reduce the IGF-1 response',
    ),
  ],
  monitoring: [
    t(
      'IGF-1 basal y periódica; reconsiderar si persiste > +3 SDS',
      'Baseline and periodic IGF-1; reconsider if persistently > +3 SDS',
    ),
    t(
      'Glucosa en ayunas y HbA1c basal y cada 3–6 meses',
      'Fasting glucose and HbA1c at baseline and every 3–6 months',
    ),
    t(
      'Perímetro abdominal, TAC/DEXA de grasa visceral a los 6 meses',
      'Waist circumference, CT/DEXA visceral fat at 6 months',
    ),
    t(
      'Signos de hipersensibilidad y retención hídrica',
      'Signs of hypersensitivity and fluid retention',
    ),
  ],
  keyTrials: [
    {
      name: 'Falutz (fase 3)',
      year: 2007,
      finding: t(
        '412 pacientes con VIH y acumulación de grasa abdominal: 2 mg/día durante 26 semanas redujo el tejido adiposo visceral −15,2 % vs +5,0 % con placebo, con aumento de IGF-1 y mejora de triglicéridos.',
        '412 HIV patients with abdominal fat accumulation: 2 mg/day for 26 weeks reduced visceral adipose tissue −15.2% vs +5.0% with placebo, with IGF-1 rise and triglyceride improvement.',
      ),
      ref: 'NEJM 2007;357:2359',
    },
    {
      name: 'Falutz (análisis combinado fase 3)',
      year: 2010,
      finding: t(
        'Dos ensayos de fase 3 (n = 806): −15,4 % de grasa visceral a 26 semanas, mantenida a 52 semanas en quienes continuaron y recuperada al pasar a placebo.',
        'Two phase 3 trials (n = 806): −15.4% visceral fat at 26 weeks, maintained at 52 weeks in continuers and regained after switching to placebo.',
      ),
      ref: 'JCEM 2010;95:4291',
    },
    {
      name: 'Stanley (esteatosis en VIH)',
      year: 2019,
      finding: t(
        '12 meses de 2 mg/día en VIH con esteatosis: reducción de la fracción de grasa hepática y menor progresión de la fibrosis frente a placebo.',
        '12 months of 2 mg/day in HIV with steatosis: reduced hepatic fat fraction and less fibrosis progression versus placebo.',
      ),
      ref: 'Lancet HIV 2019',
    },
    {
      name: 'Baker (cognición)',
      year: 2012,
      finding: t(
        '20 semanas de 1 mg/día en adultos mayores sanos y con deterioro cognitivo leve: mejora de función ejecutiva y memoria verbal.',
        '20 weeks of 1 mg/day in healthy older adults and MCI: improved executive function and verbal memory.',
      ),
      ref: 'Arch Neurol 2012;69:1420',
    },
  ],
  references: [
    {
      label: 'Egrifta SV / Egrifta WR US Prescribing Information (Theratechnologies) — DailyMed',
      url: 'https://dailymed.nlm.nih.gov/dailymed/',
    },
    { label: 'Falutz J et al. Metabolic effects of a GHRH analog in patients with HIV. NEJM 2007' },
    { label: 'Stanley TL et al. Effects of tesamorelin on NAFLD in HIV. Lancet HIV 2019' },
  ],
  tags: ['ghrh', 'vih', 'lipodistrofia', 'grasa visceral', 'aprobado', 'diario'],
  lastReviewed: '2026-09-19',
}

export const GH_REPAIR_IMMUNE: CompoundEntry[] = [cjc1295, ipamorelin, sermorelin, tesamorelin]
