import { t, type CompoundEntry } from '../schema'

/**
 * GH axis (GHRPs, somatropin, IGF-1 LR3, ibutamoren), tissue-repair and
 * immune peptides — second batch.
 *
 * Editorial note: most entries are research-only compounds without approved
 * labels and, for several, without any controlled human data. Evidence tiers
 * and regulatory fields are deliberately conservative; anecdotal dosing is
 * descriptive, never a recommendation. `pk` is included only where human
 * pharmacokinetic data exist.
 */

// ---------------------------------------------------------------------------
// GH AXIS
// ---------------------------------------------------------------------------

const ghrp2: CompoundEntry = {
  id: 'ghrp-2',
  names: {
    generic: 'GHRP-2',
    brands: ['GHRP Kaken 100 (Japón, diagnóstico)'],
    aliases: ['pralmorelina', 'pralmorelin', 'KP-102', 'D-Ala-D-2-Nal-Ala-Trp-D-Phe-Lys-NH2'],
  },
  category: 'gh_axis',
  pharmClass: t(
    'Secretagogo de GH hexapeptídico; agonista del receptor de ghrelina (GHS-R1a)',
    'Hexapeptide GH secretagogue; ghrelin receptor (GHS-R1a) agonist',
  ),
  summary: t(
    'Hexapéptido sintético de segunda generación (familia de Bowers), más potente que GHRP-6 como liberador de GH y con menor efecto orexígeno. Como pralmorelina se autorizó en Japón como agente diagnóstico del déficit de GH del adulto (prueba IV de 100 µg); no está aprobado en EE. UU. ni en la UE, donde solo circula como producto de investigación.',
    'Second-generation synthetic hexapeptide (Bowers family), a more potent GH releaser than GHRP-6 with less orexigenic effect. As pralmorelin it was authorised in Japan as a diagnostic agent for adult GH deficiency (100 µg IV test); not approved in the US or EU, where it circulates only as a research chemical.',
  ),
  mechanism: t(
    'Agonista del GHS-R1a hipofisario e hipotalámico (el receptor que después se identificó como el de la ghrelina): estimula la liberación de GH, actúa en sinergia con GHRH y antagoniza funcionalmente la somatostatina. A diferencia de ipamorelina, eleva de forma dosis-dependiente ACTH/cortisol y prolactina, y aumenta moderadamente el apetito.',
    'Pituitary and hypothalamic GHS-R1a agonist (the receptor later identified as the ghrelin receptor): stimulates GH release, acts synergistically with GHRH and functionally antagonises somatostatin. Unlike ipamorelin, it raises ACTH/cortisol and prolactin dose-dependently and moderately increases appetite.',
  ),
  indications: [
    t(
      'Diagnóstico del déficit de GH del adulto (prueba IV, Japón)',
      'Diagnosis of adult GH deficiency (IV test, Japan)',
    ),
    t(
      'Estudios de estimulación de GH en niños con talla baja (investigación)',
      'GH stimulation studies in short-stature children (research)',
    ),
    t(
      'Estados catabólicos / enfermedad crítica prolongada (fase 1–2, infusión continua)',
      'Catabolic states / prolonged critical illness (phase 1–2, continuous infusion)',
    ),
    t(
      'Uso comunitario: composición corporal, recuperación, sueño (sin ensayos)',
      'Community use: body composition, recovery, sleep (no trials)',
    ),
  ],
  evidence: 'phase2',
  regulatory: {
    us: 'research_only',
    notes: t(
      'Nunca aprobado por la FDA ni la EMA; autorizado en Japón únicamente como diagnóstico. Los GHRP de tipo ipamorelina se incluyeron en la categoría 2 de sustancias a granel 503A de la FDA hacia 2023–2024, lo que impide su formulación magistral legal. Prohibido por la AMA (S2, secretagogos de GH).',
      'Never approved by FDA or EMA; authorised in Japan only as a diagnostic. Ipamorelin-type GHRPs were placed in FDA 503A bulk-substance Category 2 around 2023–2024, which bars lawful compounding. WADA prohibited (S2, GH secretagogues).',
    ),
  },
  routes: ['sc', 'iv'],
  defaultUnit: 'mcg',
  dosing: {
    investigational: t(
      'Diagnóstico (Japón): 100 µg IV en bolo con GH a 15–60 min; en el adulto un pico de GH < 9 ng/mL se considera compatible con déficit grave (Chihara 2007). Estudios pediátricos: ~1 µg/kg IV. Enfermedad crítica: infusión IV continua ~1 µg/kg/h en protocolos de investigación.',
      'Diagnostic (Japan): 100 µg IV bolus with GH at 15–60 min; in adults a GH peak < 9 ng/mL is considered consistent with severe deficiency (Chihara 2007). Paediatric studies: ~1 µg/kg IV. Critical illness: continuous IV infusion ~1 µg/kg/h in research protocols.',
    ),
    anecdotal: t(
      'Uso no aprobado — 100–300 µg SC 1–3×/día en ayunas (a menudo con Modified GRF 1-29 100 µg); ciclos de 8–12 semanas. Rangos comunitarios sin ensayos que los respalden.',
      'Unapproved use — 100–300 µg SC 1–3×/day fasted (often with Modified GRF 1-29 100 µg); 8–12-week cycles. Community ranges with no supporting trials.',
    ),
    frequency: t('1–3×/día', '1–3×/day'),
  },
  reconstitution: t(
    'Viales liofilizados de 5 mg y 10 mg. 5 mg + 2 mL de agua bacteriostática = 2,5 mg/mL → 250 µg = 0,1 mL = 10 U en jeringa U-100; 100 µg = 4 U. 10 mg + 2 mL = 5 mg/mL → 100 µg = 2 U (poco preciso; preferible diluir más). Reconstituido: nevera 2–8 °C, 3–4 semanas, protegido de la luz.',
    'Lyophilised vials of 5 mg and 10 mg. 5 mg + 2 mL bacteriostatic water = 2.5 mg/mL → 250 µg = 0.1 mL = 10 U on a U-100 syringe; 100 µg = 4 U. 10 mg + 2 mL = 5 mg/mL → 100 µg = 2 U (imprecise; dilute further). Reconstituted: refrigerate 2–8 °C, 3–4 weeks, protect from light.',
  ),
  storage: t(
    'Liofilizado: nevera 2–8 °C (o −20 °C a largo plazo), protegido de la luz. Reconstituido: nevera, no congelar, no agitar.',
    'Lyophilised: refrigerate 2–8 °C (or −20 °C long term), protect from light. Reconstituted: refrigerate, do not freeze, do not shake.',
  ),
  adverseEffects: {
    common: [
      t('Rubefacción facial, sensación de calor, cefalea', 'Facial flushing, warmth, headache'),
      t('Aumento del apetito (menor que con GHRP-6)', 'Increased appetite (less than GHRP-6)'),
      t('Retención hídrica, parestesias, somnolencia', 'Fluid retention, paraesthesia, drowsiness'),
      t('Reacciones en el punto de inyección', 'Injection-site reactions'),
    ],
    serious: [
      t(
        'Elevación de cortisol y prolactina dosis-dependiente; relevante con uso crónico',
        'Dose-dependent cortisol and prolactin elevation; relevant with chronic use',
      ),
      t('Hiperglucemia / resistencia a la insulina', 'Hyperglycaemia / insulin resistance'),
      t(
        'Crecimiento de neoplasias ocultas mediado por IGF-1 (teórico)',
        'IGF-1-mediated growth of occult neoplasms (theoretical)',
      ),
      t(
        'Pureza e identidad inciertas en productos de investigación; sin datos de seguridad a largo plazo',
        'Uncertain purity and identity of research products; no long-term safety data',
      ),
    ],
  },
  contraindications: [
    t('Neoplasia activa o antecedente reciente', 'Active or recent malignancy'),
    t('Embarazo y lactancia', 'Pregnancy and lactation'),
    t(
      'Hiperprolactinemia o prolactinoma; síndrome de Cushing',
      'Hyperprolactinaemia or prolactinoma; Cushing syndrome',
    ),
    t(
      'Diabetes mal controlada o retinopatía proliferativa',
      'Poorly controlled diabetes or proliferative retinopathy',
    ),
    t('Hipersensibilidad conocida', 'Known hypersensitivity'),
  ],
  interactions: [
    t(
      'GHRH / Mod GRF 1-29: sinergia marcada en la liberación de GH',
      'GHRH / Mod GRF 1-29: marked synergy in GH release',
    ),
    t(
      'Glucocorticoides: atenúan la respuesta de GH y suman efecto hiperglucemiante',
      'Glucocorticoids: blunt the GH response and add hyperglycaemic effect',
    ),
    t(
      'Comida (glucosa, grasa) en las 1–2 h previas: reduce el pico de GH',
      'Food (glucose, fat) within 1–2 h: reduces the GH peak',
    ),
    t(
      'Insulina y antidiabéticos: ajustar por hiperglucemia',
      'Insulin and antidiabetics: adjust for hyperglycaemia',
    ),
    t('Análogos de somatostatina: antagonizan', 'Somatostatin analogues: antagonise'),
  ],
  monitoring: [
    t('IGF-1 basal y a las 4–8 semanas', 'Baseline and 4–8-week IGF-1'),
    t('Glucosa en ayunas / HbA1c', 'Fasting glucose / HbA1c'),
    t('Cortisol matinal y prolactina', 'Morning cortisol and prolactin'),
    t('Peso, edema, presión arterial', 'Weight, oedema, blood pressure'),
  ],
  keyTrials: [
    {
      name: 'Pihoker (pediatría)',
      year: 1995,
      finding: t(
        'GHRP-2 IV e intranasal en niños con talla baja: liberación de GH dosis-dependiente; se propuso como prueba diagnóstica y posible tratamiento.',
        'IV and intranasal GHRP-2 in short-stature children: dose-dependent GH release; proposed as a diagnostic test and possible therapy.',
      ),
      ref: 'JCEM 1995',
    },
    {
      name: 'Chihara (prueba diagnóstica adulto)',
      year: 2007,
      finding: t(
        'Prueba de GHRP-2 100 µg IV en adultos japoneses: discriminó el déficit grave de GH con un punto de corte de pico de GH ~9 ng/mL, con buena tolerancia.',
        'GHRP-2 100 µg IV test in Japanese adults: discriminated severe GH deficiency with a GH peak cut-off of ~9 ng/mL, well tolerated.',
      ),
      ref: 'Eur J Endocrinol 2007',
    },
  ],
  references: [
    {
      label:
        'Pihoker C et al. Diagnostic studies with intravenous and intranasal GHRP-2 in children of short stature. JCEM 1995',
    },
    {
      label:
        'Chihara K et al. A simple diagnostic test using GH-releasing peptide-2 in adult GH deficiency. Eur J Endocrinol 2007',
    },
    { label: 'FDA — 503A bulk drug substances Category 2 list (2023–2024)' },
    { label: 'WADA Prohibited List — S2 peptide hormones, growth factors and related substances' },
  ],
  tags: ['ghrp', 'ghs-r1a', 'gh', 'cortisol', 'prolactina', 'diagnóstico', 'investigación'],
  lastReviewed: '2026-09-19',
}

const ghrp6: CompoundEntry = {
  id: 'ghrp-6',
  names: {
    generic: 'GHRP-6',
    brands: [],
    aliases: [
      'His-D-Trp-Ala-Trp-D-Phe-Lys-NH2',
      'péptido liberador de GH 6',
      'growth hormone releasing peptide-6',
    ],
  },
  category: 'gh_axis',
  pharmClass: t(
    'Secretagogo de GH hexapeptídico de primera generación; agonista del receptor de ghrelina (GHS-R1a)',
    'First-generation hexapeptide GH secretagogue; ghrelin receptor (GHS-R1a) agonist',
  ),
  summary: t(
    'Primer GHRP con actividad relevante in vivo (Bowers, 1984), anterior al descubrimiento de la ghrelina (1999), cuyo receptor comparte. Libera GH de forma potente y sinérgica con GHRH, pero es el más orexígeno de la familia y eleva cortisol y prolactina. Se ha usado en pruebas diagnósticas combinadas (GHRH + GHRP-6) y estudiado en cardioprotección; nunca aprobado.',
    'First GHRP with meaningful in vivo activity (Bowers, 1984), predating the discovery of ghrelin (1999), whose receptor it shares. Releases GH potently and synergistically with GHRH, but is the most orexigenic of the family and raises cortisol and prolactin. Used in combined diagnostic tests (GHRH + GHRP-6) and studied for cardioprotection; never approved.',
  ),
  mechanism: t(
    'Agonista del GHS-R1a en hipotálamo e hipófisis: amplifica los pulsos de GH, antagoniza la somatostatina y estimula neuronas NPY/AgRP del núcleo arcuato (hambre intensa 20–30 min después de la dosis). Estimula el eje ACTH-cortisol y la prolactina. Se ha descrito unión a CD36 en tejido cardíaco (datos preclínicos).',
    'GHS-R1a agonist in hypothalamus and pituitary: amplifies GH pulses, antagonises somatostatin and stimulates arcuate NPY/AgRP neurons (intense hunger 20–30 min post-dose). Stimulates the ACTH-cortisol axis and prolactin. Binding to CD36 in cardiac tissue has been described (preclinical data).',
  ),
  indications: [
    t(
      'Prueba diagnóstica combinada GHRH + GHRP-6 para déficit de GH del adulto (investigación)',
      'Combined GHRH + GHRP-6 diagnostic test for adult GH deficiency (research)',
    ),
    t(
      'Cardioprotección en infarto agudo y miocardiopatía (preclínico; estudios iniciales en humanos en Cuba)',
      'Cardioprotection in acute infarction and cardiomyopathy (preclinical; early human studies in Cuba)',
    ),
    t(
      'Uso comunitario: ganancia de masa, apetito, recuperación (sin ensayos)',
      'Community use: mass gain, appetite, recovery (no trials)',
    ),
  ],
  evidence: 'phase1',
  regulatory: {
    us: 'research_only',
    notes: t(
      'Nunca aprobado. Los GHRP de tipo ipamorelina se incluyeron en la categoría 2 de sustancias a granel 503A de la FDA hacia 2023–2024, lo que impide su formulación magistral legal. Prohibido por la AMA (S2).',
      'Never approved. Ipamorelin-type GHRPs were placed in FDA 503A bulk-substance Category 2 around 2023–2024, which bars lawful compounding. WADA prohibited (S2).',
    ),
  },
  routes: ['sc', 'iv'],
  defaultUnit: 'mcg',
  dosing: {
    investigational: t(
      'Estudios farmacológicos en humanos: 1 µg/kg IV en bolo (dosis casi máxima para GH), solo o con GHRH 1 µg/kg en la prueba combinada; pico de GH a 15–30 min.',
      'Human pharmacology studies: 1 µg/kg IV bolus (near-maximal GH dose), alone or with GHRH 1 µg/kg in the combined test; GH peak at 15–30 min.',
    ),
    anecdotal: t(
      'Uso no aprobado — 100–300 µg SC 1–3×/día en ayunas, a menudo con Modified GRF 1-29; se usa precisamente por su efecto orexígeno en fases de volumen. Rangos comunitarios.',
      'Unapproved use — 100–300 µg SC 1–3×/day fasted, often with Modified GRF 1-29; used precisely for its orexigenic effect in bulking phases. Community ranges.',
    ),
    frequency: t('1–3×/día', '1–3×/day'),
  },
  reconstitution: t(
    'Viales liofilizados de 5 mg y 10 mg. 5 mg + 2 mL de agua bacteriostática = 2,5 mg/mL → 250 µg = 0,1 mL = 10 U en jeringa U-100; 100 µg = 4 U. 10 mg + 4 mL = 2,5 mg/mL (misma equivalencia). Reconstituido: nevera 2–8 °C, 3–4 semanas.',
    'Lyophilised vials of 5 mg and 10 mg. 5 mg + 2 mL bacteriostatic water = 2.5 mg/mL → 250 µg = 0.1 mL = 10 U on a U-100 syringe; 100 µg = 4 U. 10 mg + 4 mL = 2.5 mg/mL (same equivalence). Reconstituted: refrigerate 2–8 °C, 3–4 weeks.',
  ),
  storage: t(
    'Liofilizado: nevera 2–8 °C protegido de la luz (congelador a largo plazo). Reconstituido: nevera, no congelar, no agitar.',
    'Lyophilised: refrigerate 2–8 °C, protect from light (freezer long term). Reconstituted: refrigerate, do not freeze, do not shake.',
  ),
  adverseEffects: {
    common: [
      t(
        'Hambre intensa a los 20–30 min, aumento de peso',
        'Intense hunger at 20–30 min, weight gain',
      ),
      t('Rubefacción, cefalea, mareo', 'Flushing, headache, dizziness'),
      t('Retención hídrica, edema, parestesias', 'Fluid retention, oedema, paraesthesia'),
      t('Reacciones en el punto de inyección', 'Injection-site reactions'),
    ],
    serious: [
      t('Elevación de cortisol y prolactina', 'Cortisol and prolactin elevation'),
      t('Hiperglucemia / resistencia a la insulina', 'Hyperglycaemia / insulin resistance'),
      t(
        'Crecimiento de neoplasias ocultas mediado por IGF-1 (teórico)',
        'IGF-1-mediated growth of occult neoplasms (theoretical)',
      ),
      t(
        'Pureza e identidad inciertas en productos de investigación; sin datos a largo plazo',
        'Uncertain purity and identity of research products; no long-term data',
      ),
    ],
  },
  contraindications: [
    t('Neoplasia activa', 'Active malignancy'),
    t('Embarazo y lactancia', 'Pregnancy and lactation'),
    t('Hiperprolactinemia, síndrome de Cushing', 'Hyperprolactinaemia, Cushing syndrome'),
    t(
      'Obesidad o trastorno de la conducta alimentaria (efecto orexígeno)',
      'Obesity or eating disorder (orexigenic effect)',
    ),
    t(
      'Diabetes mal controlada o retinopatía proliferativa',
      'Poorly controlled diabetes or proliferative retinopathy',
    ),
  ],
  interactions: [
    t(
      'GHRH / Mod GRF 1-29: sinergia en la liberación de GH',
      'GHRH / Mod GRF 1-29: synergistic GH release',
    ),
    t(
      'Glucocorticoides: atenúan la GH y suman efecto hiperglucemiante',
      'Glucocorticoids: blunt GH and add hyperglycaemic effect',
    ),
    t(
      'Comida en las 1–2 h previas: reduce el pico de GH',
      'Food within 1–2 h: reduces the GH peak',
    ),
    t('Insulina y antidiabéticos: ajustar', 'Insulin and antidiabetics: adjust'),
    t(
      'Agonistas GLP-1: efecto orexígeno opuesto; valorar objetivo clínico',
      'GLP-1 agonists: opposing appetite effect; consider clinical goal',
    ),
  ],
  monitoring: [
    t('IGF-1 a las 4–8 semanas', 'IGF-1 at 4–8 weeks'),
    t('Glucosa en ayunas / HbA1c', 'Fasting glucose / HbA1c'),
    t('Cortisol matinal y prolactina', 'Morning cortisol and prolactin'),
    t('Peso, edema', 'Weight, oedema'),
  ],
  keyTrials: [
    {
      name: 'Bowers (descubrimiento)',
      year: 1984,
      finding: t(
        'Hexapéptido sintético con liberación específica de GH in vitro e in vivo en animales; base de toda la familia de GHRP.',
        'Synthetic hexapeptide with specific GH release in vitro and in vivo in animals; basis of the whole GHRP family.',
      ),
      ref: 'Endocrinology 1984',
    },
    {
      name: 'Bowers (humanos)',
      year: 1990,
      finding: t(
        'En varones sanos, GHRP-6 IV liberó GH y actuó de forma sinérgica con GHRH.',
        'In healthy men, IV GHRP-6 released GH and acted synergistically with GHRH.',
      ),
      ref: 'JCEM 1990',
    },
  ],
  references: [
    {
      label:
        'Bowers CY et al. On the in vitro and in vivo activity of a new synthetic hexapeptide that acts on the pituitary to specifically release GH. Endocrinology 1984',
    },
    {
      label:
        'Bowers CY et al. GH-releasing peptide stimulates GH release in normal men and acts synergistically with GHRH. JCEM 1990',
    },
    { label: 'FDA — 503A bulk drug substances Category 2 list (2023–2024)' },
    { label: 'WADA Prohibited List — S2' },
  ],
  tags: ['ghrp', 'ghs-r1a', 'gh', 'apetito', 'cortisol', 'prolactina', 'investigación'],
  lastReviewed: '2026-09-19',
}

const hexarelin: CompoundEntry = {
  id: 'hexarelin',
  names: {
    generic: 'Hexarelina',
    brands: [],
    aliases: [
      'hexarelin',
      'examorelina',
      'examorelin',
      'EP-23905',
      'His-D-2-Me-Trp-Ala-Trp-D-Phe-Lys-NH2',
    ],
  },
  category: 'gh_axis',
  pharmClass: t(
    'Secretagogo de GH hexapeptídico; agonista del GHS-R1a con afinidad adicional por CD36',
    'Hexapeptide GH secretagogue; GHS-R1a agonist with additional CD36 affinity',
  ),
  summary: t(
    'Análogo de GHRP-6 (2-metil-D-Trp) desarrollado en Italia, el GHRP más potente en liberación aguda de GH en humanos. Eleva también cortisol y prolactina más que GHRP-6, y con uso continuado presenta atenuación parcial de la respuesta (desensibilización). Se estudió en talla baja infantil y por efectos cardíacos directos vía CD36; nunca aprobado.',
    'GHRP-6 analogue (2-methyl-D-Trp) developed in Italy, the most potent GHRP for acute GH release in humans. Also raises cortisol and prolactin more than GHRP-6, and with continued use shows partial attenuation of response (desensitisation). Studied in childhood short stature and for direct cardiac effects via CD36; never approved.',
  ),
  mechanism: t(
    'Agonista del GHS-R1a hipotalámico-hipofisario con liberación de GH sinérgica con GHRH. Se une además al receptor scavenger CD36 en cardiomiocitos y macrófagos, con efectos inotrópicos y cardioprotectores en modelos animales independientes de GH. Estimula ACTH/cortisol y prolactina de forma clara.',
    'Hypothalamic-pituitary GHS-R1a agonist with GH release synergistic with GHRH. Also binds the scavenger receptor CD36 on cardiomyocytes and macrophages, with GH-independent inotropic and cardioprotective effects in animal models. Clearly stimulates ACTH/cortisol and prolactin.',
  ),
  indications: [
    t(
      'Talla baja / déficit de GH infantil (fase 2, formulaciones intranasal y SC)',
      'Short stature / childhood GH deficiency (phase 2, intranasal and SC formulations)',
    ),
    t(
      'Pruebas de reserva hipofisaria de GH (investigación)',
      'Pituitary GH reserve testing (research)',
    ),
    t(
      'Disfunción ventricular izquierda / cardioprotección (estudios agudos en humanos, preclínico)',
      'Left ventricular dysfunction / cardioprotection (acute human studies, preclinical)',
    ),
    t(
      'Uso comunitario: composición corporal, recuperación (sin ensayos)',
      'Community use: body composition, recovery (no trials)',
    ),
  ],
  evidence: 'phase2',
  regulatory: {
    us: 'research_only',
    notes: t(
      'Nunca aprobado en ningún país. Los GHRP de tipo ipamorelina se incluyeron en la categoría 2 de sustancias a granel 503A de la FDA hacia 2023–2024, lo que impide su formulación magistral legal. Prohibido por la AMA (S2).',
      'Never approved anywhere. Ipamorelin-type GHRPs were placed in FDA 503A bulk-substance Category 2 around 2023–2024, which bars lawful compounding. WADA prohibited (S2).',
    ),
  },
  routes: ['sc', 'iv', 'nasal'],
  defaultUnit: 'mcg',
  pk: {
    halfLifeH: 1.1,
    molarMassGPerMol: 887,
    source:
      'Ghigo E et al., JCEM 1994 e Imbimbo BP et al., Eur J Clin Pharmacol 1994 (IV/SC en voluntarios sanos): t½ plasmática ≈ 55–70 min',
    notes:
      'Valor aproximado de estudios de dosis-respuesta en sanos; pico de GH a 15–30 min tras IV y ~30–60 min tras SC. Biodisponibilidad intranasal y oral muy baja. Revisar con la fuente original.',
  },
  dosing: {
    investigational: t(
      'Voluntarios sanos: 1–2 µg/kg IV o SC (2 µg/kg ≈ dosis máxima para GH); intranasal ~20 µg/kg y oral en dosis mucho mayores por baja biodisponibilidad. Estudios de uso crónico en niños y adultos: 1–2 µg/kg SC 1–2×/día durante semanas a meses, con atenuación parcial de la respuesta.',
      'Healthy volunteers: 1–2 µg/kg IV or SC (2 µg/kg ≈ maximal GH dose); intranasal ~20 µg/kg and oral at much higher doses due to low bioavailability. Chronic-use studies in children and adults: 1–2 µg/kg SC 1–2×/day for weeks to months, with partial response attenuation.',
    ),
    anecdotal: t(
      'Uso no aprobado — 100–200 µg SC 1–3×/día, ciclos cortos de 4–8 semanas por la desensibilización. Rangos comunitarios sin ensayos.',
      'Unapproved use — 100–200 µg SC 1–3×/day, short 4–8-week cycles due to desensitisation. Community ranges without trials.',
    ),
    frequency: t('1–3×/día', '1–3×/day'),
  },
  reconstitution: t(
    'Viales liofilizados de 2 mg y 5 mg. 5 mg + 2 mL de agua bacteriostática = 2,5 mg/mL → 250 µg = 0,1 mL = 10 U en jeringa U-100; 100 µg = 4 U. 2 mg + 2 mL = 1 mg/mL → 100 µg = 10 U. Reconstituido: nevera 2–8 °C, 3–4 semanas.',
    'Lyophilised vials of 2 mg and 5 mg. 5 mg + 2 mL bacteriostatic water = 2.5 mg/mL → 250 µg = 0.1 mL = 10 U on a U-100 syringe; 100 µg = 4 U. 2 mg + 2 mL = 1 mg/mL → 100 µg = 10 U. Reconstituted: refrigerate 2–8 °C, 3–4 weeks.',
  ),
  storage: t(
    'Liofilizado: nevera 2–8 °C protegido de la luz (−20 °C a largo plazo). Reconstituido: nevera, no congelar.',
    'Lyophilised: refrigerate 2–8 °C, protect from light (−20 °C long term). Reconstituted: refrigerate, do not freeze.',
  ),
  adverseEffects: {
    common: [
      t('Rubefacción facial, sensación de calor', 'Facial flushing, warmth'),
      t('Aumento leve del apetito, retención hídrica', 'Mild appetite increase, fluid retention'),
      t('Cefalea, somnolencia', 'Headache, drowsiness'),
      t('Reacciones en el punto de inyección', 'Injection-site reactions'),
    ],
    serious: [
      t(
        'Elevación de cortisol y prolactina (mayor que otros GHRP)',
        'Cortisol and prolactin elevation (greater than other GHRPs)',
      ),
      t(
        'Desensibilización con uso continuado; efecto a largo plazo sobre el eje desconocido',
        'Desensitisation with continued use; long-term axis effects unknown',
      ),
      t('Hiperglucemia / resistencia a la insulina', 'Hyperglycaemia / insulin resistance'),
      t(
        'Crecimiento de neoplasias ocultas mediado por IGF-1 (teórico)',
        'IGF-1-mediated growth of occult neoplasms (theoretical)',
      ),
    ],
  },
  contraindications: [
    t('Neoplasia activa', 'Active malignancy'),
    t('Embarazo y lactancia', 'Pregnancy and lactation'),
    t(
      'Hiperprolactinemia, prolactinoma, síndrome de Cushing',
      'Hyperprolactinaemia, prolactinoma, Cushing syndrome',
    ),
    t(
      'Diabetes mal controlada o retinopatía proliferativa',
      'Poorly controlled diabetes or proliferative retinopathy',
    ),
    t('Hipersensibilidad conocida', 'Known hypersensitivity'),
  ],
  interactions: [
    t('GHRH: sinergia en la liberación de GH', 'GHRH: synergistic GH release'),
    t(
      'Glucocorticoides: atenúan la GH y suman efecto sobre cortisol/glucemia',
      'Glucocorticoids: blunt GH and add to cortisol/glucose effects',
    ),
    t('Insulina y antidiabéticos: ajustar', 'Insulin and antidiabetics: adjust'),
    t(
      'Agonistas dopaminérgicos (cabergolina): pueden atenuar el aumento de prolactina',
      'Dopamine agonists (cabergoline): may blunt the prolactin rise',
    ),
    t('Análogos de somatostatina: antagonizan', 'Somatostatin analogues: antagonise'),
  ],
  monitoring: [
    t('IGF-1 basal y a las 4–8 semanas', 'Baseline and 4–8-week IGF-1'),
    t('Glucosa en ayunas / HbA1c', 'Fasting glucose / HbA1c'),
    t('Cortisol matinal y prolactina', 'Morning cortisol and prolactin'),
    t('Presión arterial, edema', 'Blood pressure, oedema'),
  ],
  keyTrials: [
    {
      name: 'Ghigo (vías de administración)',
      year: 1994,
      finding: t(
        'En humanos sanos, hexarelina liberó GH de forma dosis-dependiente por vía IV, SC, intranasal y oral, con elevaciones menores de prolactina y cortisol.',
        'In healthy humans, hexarelin released GH dose-dependently by IV, SC, intranasal and oral routes, with smaller prolactin and cortisol rises.',
      ),
      ref: 'JCEM 1994',
    },
    {
      name: 'Rahim (uso prolongado)',
      year: 1998,
      finding: t(
        'Administración crónica en adultos: atenuación parcial y reversible de la respuesta de GH (desensibilización) con el tratamiento continuado.',
        'Chronic administration in adults: partial, reversible attenuation of the GH response (desensitisation) with continued treatment.',
      ),
      ref: 'JCEM 1998',
    },
  ],
  references: [
    {
      label:
        'Ghigo E et al. GH-releasing activity of hexarelin after intravenous, subcutaneous, intranasal and oral administration in man. JCEM 1994',
    },
    {
      label:
        'Imbimbo BP et al. GH-releasing activity of hexarelin in humans: a dose-response study. Eur J Clin Pharmacol 1994',
    },
    { label: 'Rahim A et al. GH status during long-term hexarelin therapy. JCEM 1998' },
    { label: 'FDA — 503A bulk drug substances Category 2 list (2023–2024)' },
    { label: 'WADA Prohibited List — S2' },
  ],
  tags: ['ghrp', 'ghs-r1a', 'cd36', 'gh', 'cortisol', 'prolactina', 'investigación'],
  lastReviewed: '2026-09-19',
}

const somatropin: CompoundEntry = {
  id: 'somatropin',
  names: {
    generic: 'Somatropina',
    brands: [
      'Genotropin',
      'Norditropin',
      'Humatrope',
      'Omnitrope',
      'Saizen',
      'Zomacton',
      'Nutropin AQ',
      'Serostim',
      'Zorbtive (retirado)',
    ],
    aliases: ['hormona de crecimiento recombinante', 'rhGH', 'hGH', 'GH', 'somatotropina'],
  },
  category: 'gh_axis',
  pharmClass: t(
    'Hormona de crecimiento humana recombinante (191 aminoácidos)',
    'Recombinant human growth hormone (191 amino acids)',
  ),
  summary: t(
    'GH humana recombinante idéntica a la isoforma hipofisaria de 22 kDa. Aprobada desde 1985 para el déficit de GH infantil y del adulto y para varias causas de talla baja; es la referencia frente a la que se comparan todos los secretagogos. En EE. UU. su distribución para usos no autorizados (antienvejecimiento, rendimiento) es delito federal.',
    'Recombinant human GH identical to the 22-kDa pituitary isoform. Approved since 1985 for childhood and adult GH deficiency and several causes of short stature; the reference against which all secretagogues are compared. In the US, distribution for unauthorised uses (anti-ageing, performance) is a federal crime.',
  ),
  mechanism: t(
    'Agonista del receptor de GH (JAK2-STAT5): induce la síntesis hepática y tisular de IGF-1, estimula la lipólisis, la síntesis proteica y el crecimiento lineal (con epífisis abiertas), retiene sodio y agua y antagoniza la acción de la insulina. A diferencia de los secretagogos, no depende de la reserva hipofisaria y suprime la GH endógena por retroalimentación.',
    'GH receptor agonist (JAK2-STAT5): induces hepatic and tissue IGF-1 synthesis, stimulates lipolysis, protein synthesis and linear growth (with open epiphyses), retains sodium and water and antagonises insulin action. Unlike secretagogues, it does not depend on pituitary reserve and suppresses endogenous GH by feedback.',
  ),
  indications: [
    t('Déficit de GH infantil (aprobado)', 'Childhood GH deficiency (approved)'),
    t(
      'Déficit de GH del adulto, de inicio infantil o adulto (aprobado)',
      'Adult GH deficiency, childhood- or adult-onset (approved)',
    ),
    t(
      'Talla baja por síndrome de Turner, Prader-Willi, Noonan, déficit de SHOX, PEG sin crecimiento recuperador, insuficiencia renal crónica, talla baja idiopática (según producto/región)',
      'Short stature due to Turner, Prader-Willi, Noonan, SHOX deficiency, SGA without catch-up, chronic kidney disease, idiopathic short stature (product/region-dependent)',
    ),
    t(
      'Caquexia asociada al VIH (Serostim); síndrome de intestino corto (Zorbtive, retirado)',
      'HIV-associated wasting (Serostim); short bowel syndrome (Zorbtive, discontinued)',
    ),
    t(
      'Fuera de indicación y no autorizado en EE. UU.: “antienvejecimiento”, rendimiento deportivo, composición corporal',
      'Off-label and not authorised in the US: “anti-ageing”, athletic performance, body composition',
    ),
  ],
  evidence: 'fda_approved',
  regulatory: {
    us: 'approved',
    eu: 'approved',
    notes: t(
      'Medicamento aprobado (FDA/EMA). En EE. UU. no figura en las listas de la DEA, pero la Crime Control Act de 1990 (la misma ley que incluyó la Anabolic Steroids Control Act) añadió el 21 U.S.C. §333(e), que tipifica como delito la distribución o posesión para distribuir de GH para cualquier uso distinto de las indicaciones autorizadas; por eso a menudo se la describe como “sustancia controlada” en la práctica. Las GH de acción prolongada (somapacitán/Sogroya, lonapegsomatropina/Skytrofa, somatrogón/Ngenla) son moléculas distintas con sus propias fichas. Prohibida por la AMA (S2).',
      'Approved medicine (FDA/EMA). In the US it is not on the DEA schedules, but the Crime Control Act of 1990 (the same law that contained the Anabolic Steroids Control Act) added 21 U.S.C. §333(e), which makes it a crime to distribute, or possess with intent to distribute, GH for any use other than authorised indications; hence it is often described as a “controlled substance” in practice. Long-acting GHs (somapacitan/Sogroya, lonapegsomatropin/Skytrofa, somatrogon/Ngenla) are distinct molecules with their own labels. WADA prohibited (S2).',
    ),
  },
  routes: ['sc', 'im'],
  defaultUnit: 'iu',
  pk: {
    halfLifeH: 2.5,
    tmaxH: 5,
    molarMassGPerMol: 22125,
    source:
      'Fichas técnicas de somatropina (p. ej. Genotropin / Norditropin, US label §12.3): t½ aparente SC ≈ 2–3 h (limitada por absorción), tmax ≈ 4–6 h; t½ IV ≈ 20–30 min',
    notes:
      'Cinética flip-flop tras SC: la t½ aparente refleja la absorción. IGF-1 (el marcador de efecto) se eleva durante 24 h o más. 1 mg ≈ 3 UI (patrón OMS).',
  },
  dosing: {
    labeled: t(
      'Déficit de GH del adulto (p. ej. Genotropin/Norditropin): inicio sin ajuste por peso de 0,1–0,3 mg/día SC (≈ 0,3–0,9 UI), menor en > 60 años y mayor en mujeres con estrógenos orales; titular 0,1–0,2 mg/día cada 1–2 meses según IGF-1 y tolerancia. Déficit de GH infantil: 0,16–0,24 mg/kg/semana repartidos en 6–7 dosis diarias (Genotropin; varía por producto). Caquexia VIH (Serostim): ~0,1 mg/kg/día hasta 6 mg/día SC.',
      'Adult GH deficiency (e.g. Genotropin/Norditropin): non-weight-based start 0.1–0.3 mg/day SC (≈ 0.3–0.9 IU), lower in > 60 years and higher in women on oral oestrogen; titrate by 0.1–0.2 mg/day every 1–2 months according to IGF-1 and tolerability. Childhood GH deficiency: 0.16–0.24 mg/kg/week divided into 6–7 daily doses (Genotropin; varies by product). HIV wasting (Serostim): ~0.1 mg/kg/day up to 6 mg/day SC.',
    ),
    investigational: t(
      'Ancianos sanos (Rudman 1990; Blackman 2002): ~0,02–0,03 mg/kg 3×/semana o dosis diarias equivalentes; efectos modestos sobre composición corporal con alta tasa de efectos adversos (edema, artralgia, túnel carpiano, intolerancia a la glucosa).',
      'Healthy elderly (Rudman 1990; Blackman 2002): ~0.02–0.03 mg/kg 3×/week or equivalent daily doses; modest body-composition effects with a high rate of adverse effects (oedema, arthralgia, carpal tunnel, glucose intolerance).',
    ),
    anecdotal: t(
      'Uso no aprobado — “antienvejecimiento” 1–2 UI/día SC; culturismo/rendimiento 2–6 UI/día o más, a menudo con productos del mercado negro de pureza e identidad inciertas. Su distribución para estos fines es ilegal en EE. UU.',
      'Unapproved use — “anti-ageing” 1–2 IU/day SC; bodybuilding/performance 2–6 IU/day or more, often with black-market products of uncertain purity and identity. Distribution for these purposes is illegal in the US.',
    ),
    frequency: t('1×/día (habitualmente por la noche)', 'Once daily (usually in the evening)'),
  },
  reconstitution: t(
    'Presentaciones comerciales: plumas precargadas líquidas (Norditropin 5/10/15 mg, sin reconstitución), cartuchos bicamerales (Genotropin 5,3/12 mg; Humatrope 6/12/24 mg) o viales liofilizados con diluyente. Seguir la ficha de cada producto: reconstituido en nevera 2–8 °C, habitualmente 14–28 días. Ejemplo en vial liofilizado: 5 mg (≈ 15 UI) + 1,5 mL de diluyente = 10 UI/mL → 1 UI = 0,1 mL = 10 U en jeringa U-100; 0,3 mg (≈ 0,9 UI) ≈ 9 U. Disolver con giro suave, nunca agitar.',
    'Commercial presentations: liquid prefilled pens (Norditropin 5/10/15 mg, no reconstitution), two-chamber cartridges (Genotropin 5.3/12 mg; Humatrope 6/12/24 mg) or lyophilised vials with diluent. Follow each product label: reconstituted refrigerated 2–8 °C, usually 14–28 days. Lyophilised vial example: 5 mg (≈ 15 IU) + 1.5 mL diluent = 10 IU/mL → 1 IU = 0.1 mL = 10 U on a U-100 syringe; 0.3 mg (≈ 0.9 IU) ≈ 9 U. Dissolve by gentle swirling, never shake.',
  ),
  storage: t(
    'Nevera 2–8 °C, no congelar, protegido de la luz; algunas plumas toleran periodos limitados a temperatura ambiente según ficha. Desechar si la solución está turbia.',
    'Refrigerate 2–8 °C, do not freeze, protect from light; some pens tolerate limited periods at room temperature per label. Discard if the solution is cloudy.',
  ),
  adverseEffects: {
    common: [
      t(
        'Edema periférico, artralgia, mialgia (dosis-dependientes; más en adultos)',
        'Peripheral oedema, arthralgia, myalgia (dose-dependent; more in adults)',
      ),
      t('Parestesias, síndrome del túnel carpiano', 'Paraesthesia, carpal tunnel syndrome'),
      t(
        'Cefalea, reacciones y lipoatrofia en el punto de inyección',
        'Headache, injection-site reactions and lipoatrophy',
      ),
      t(
        'Resistencia a la insulina, elevación de la glucemia',
        'Insulin resistance, raised glucose',
      ),
    ],
    serious: [
      t(
        'Hipertensión intracraneal idiopática (papiledema, cefalea, vómitos)',
        'Idiopathic intracranial hypertension (papilloedema, headache, vomiting)',
      ),
      t('Diabetes tipo 2 de nueva aparición', 'New-onset type 2 diabetes'),
      t(
        'Epifisiólisis femoral y progresión de escoliosis en niños',
        'Slipped capital femoral epiphysis and scoliosis progression in children',
      ),
      t(
        'Segundas neoplasias en supervivientes de cáncer infantil; riesgo de recidiva tumoral',
        'Second neoplasms in childhood cancer survivors; tumour recurrence risk',
      ),
      t(
        'Desenmascaramiento de hipotiroidismo central e insuficiencia suprarrenal central',
        'Unmasking of central hypothyroidism and central adrenal insufficiency',
      ),
      t(
        'Pancreatitis; muertes en Prader-Willi con obesidad grave o compromiso respiratorio',
        'Pancreatitis; deaths in Prader-Willi with severe obesity or respiratory impairment',
      ),
      t(
        'Aumento de mortalidad en enfermedad crítica aguda (Takala 1999)',
        'Increased mortality in acute critical illness (Takala 1999)',
      ),
    ],
  },
  contraindications: [
    t(
      'Enfermedad crítica aguda por cirugía cardíaca o abdominal, politraumatismo o insuficiencia respiratoria aguda',
      'Acute critical illness from open-heart or abdominal surgery, multiple trauma or acute respiratory failure',
    ),
    t('Neoplasia activa', 'Active malignancy'),
    t(
      'Retinopatía diabética proliferativa o no proliferativa grave',
      'Proliferative or severe non-proliferative diabetic retinopathy',
    ),
    t(
      'Prader-Willi con obesidad grave, apnea obstructiva o compromiso respiratorio grave',
      'Prader-Willi with severe obesity, obstructive apnoea or severe respiratory impairment',
    ),
    t(
      'Epífisis cerradas (para promoción del crecimiento)',
      'Closed epiphyses (for growth promotion)',
    ),
    t(
      'Embarazo: datos limitados; habitualmente se suspende (la placenta produce GH variante)',
      'Pregnancy: limited data; usually discontinued (placenta produces variant GH)',
    ),
    t(
      'Hipersensibilidad a somatropina o excipientes (metacresol, glicerina según producto)',
      'Hypersensitivity to somatropin or excipients (metacresol, glycerin per product)',
    ),
  ],
  interactions: [
    t(
      'Glucocorticoides: la GH inhibe la 11β-HSD1 (menos cortisol activo); puede precipitar insuficiencia suprarrenal o requerir ajuste; los glucocorticoides atenúan el efecto de la GH',
      'Glucocorticoids: GH inhibits 11β-HSD1 (less active cortisol); may precipitate adrenal insufficiency or need adjustment; glucocorticoids blunt GH effect',
    ),
    t(
      'Estrógenos orales: resistencia hepática a GH; requieren dosis mayores (preferir vía transdérmica)',
      'Oral oestrogens: hepatic GH resistance; need higher doses (prefer transdermal route)',
    ),
    t(
      'Insulina y antidiabéticos: ajustar por hiperglucemia',
      'Insulin and antidiabetics: adjust for hyperglycaemia',
    ),
    t(
      'Sustratos de CYP3A4 (anticonvulsivos, ciclosporina, esteroides sexuales): posible aumento del aclaramiento',
      'CYP3A4 substrates (anticonvulsants, ciclosporin, sex steroids): possible increased clearance',
    ),
    t(
      'Levotiroxina: la GH aumenta la conversión T4→T3 y puede desenmascarar hipotiroidismo',
      'Levothyroxine: GH increases T4→T3 conversion and may unmask hypothyroidism',
    ),
  ],
  monitoring: [
    t(
      'IGF-1 basal y a las 4–8 semanas de cada cambio de dosis; objetivo dentro del rango para edad y sexo',
      'IGF-1 at baseline and 4–8 weeks after each dose change; target within age- and sex-adjusted range',
    ),
    t(
      'Glucosa en ayunas y HbA1c basal y periódica',
      'Fasting glucose and HbA1c at baseline and periodically',
    ),
    t(
      'TSH y T4 libre; cortisol matinal en hipopituitarismo',
      'TSH and free T4; morning cortisol in hypopituitarism',
    ),
    t(
      'Fondo de ojo si cefalea persistente o alteraciones visuales',
      'Fundoscopy if persistent headache or visual disturbance',
    ),
    t(
      'Niños: velocidad de crecimiento, edad ósea, escoliosis, cadera',
      'Children: growth velocity, bone age, scoliosis, hips',
    ),
    t(
      'Adultos: lípidos, composición corporal, presión arterial, edema',
      'Adults: lipids, body composition, blood pressure, oedema',
    ),
  ],
  keyTrials: [
    {
      name: 'Salomon (déficit de GH del adulto)',
      year: 1989,
      finding: t(
        '6 meses de GH recombinante en adultos con déficit: aumento de masa magra y reducción de grasa frente a placebo; base del tratamiento del déficit adulto.',
        '6 months of recombinant GH in GH-deficient adults: increased lean mass and reduced fat versus placebo; foundation of adult GHD therapy.',
      ),
      ref: 'NEJM 1989;321:1797',
    },
    {
      name: 'Rudman (ancianos)',
      year: 1990,
      finding: t(
        'Varones > 60 años con IGF-1 bajo: 6 meses de GH aumentaron masa magra y densidad lumbar y redujeron grasa; origen del uso “antienvejecimiento”, sin datos funcionales ni de seguridad a largo plazo.',
        'Men > 60 years with low IGF-1: 6 months of GH increased lean mass and lumbar density and reduced fat; origin of “anti-ageing” use, with no functional or long-term safety data.',
      ),
      ref: 'NEJM 1990;323:1',
    },
    {
      name: 'Takala (enfermedad crítica)',
      year: 1999,
      finding: t(
        'Dos ensayos en adultos críticos (n ≈ 530): dosis altas de GH casi duplicaron la mortalidad hospitalaria frente a placebo.',
        'Two trials in critically ill adults (n ≈ 530): high-dose GH nearly doubled in-hospital mortality versus placebo.',
      ),
      ref: 'NEJM 1999;341:785',
    },
    {
      name: 'Liu (revisión sistemática en ancianos sanos)',
      year: 2007,
      finding: t(
        'La GH en ancianos sanos produce cambios pequeños de composición corporal sin mejoría funcional y con aumento de edema, artralgia, túnel carpiano y ginecomastia; no se recomienda como antienvejecimiento.',
        'GH in healthy elderly produces small body-composition changes without functional benefit and with increased oedema, arthralgia, carpal tunnel and gynaecomastia; not recommended for anti-ageing.',
      ),
      ref: 'Ann Intern Med 2007;146:104',
    },
    {
      name: 'SAGhE (cohorte francesa)',
      year: 2012,
      finding: t(
        'Adultos tratados con GH en la infancia por causas de bajo riesgo: aumento de mortalidad total y cardiovascular frente a población general, sobre todo con dosis altas; asociación discutida y no confirmada en todas las cohortes.',
        'Adults treated with GH in childhood for low-risk conditions: increased all-cause and cardiovascular mortality versus general population, mainly at high doses; association debated and not confirmed in all cohorts.',
      ),
      ref: 'JCEM 2012;97:416',
    },
  ],
  references: [
    {
      label: 'Genotropin / Norditropin / Humatrope US Prescribing Information — DailyMed',
      url: 'https://dailymed.nlm.nih.gov/dailymed/',
    },
    {
      label:
        'Molitch ME et al. Evaluation and treatment of adult GH deficiency: an Endocrine Society clinical practice guideline. JCEM 2011',
    },
    {
      label:
        'Takala J et al. Increased mortality associated with GH treatment in critically ill adults. NEJM 1999',
    },
    { label: '21 U.S.C. §333(e) — prohibited distribution of human growth hormone' },
  ],
  tags: ['gh', 'somatropina', 'aprobado', 'déficit de gh', 'igf-1', 'talla baja', 'diario'],
  lastReviewed: '2026-09-19',
}

const igf1Lr3: CompoundEntry = {
  id: 'igf-1-lr3',
  names: {
    generic: 'IGF-1 LR3',
    brands: [],
    aliases: [
      'Long R3 IGF-1',
      'LR3-IGF-1',
      '[Arg3]IGF-I con extensión N-terminal',
      'long arginine 3-IGF-1',
    ],
  },
  category: 'gh_axis',
  pharmClass: t(
    'Análogo recombinante de IGF-1 (83 aminoácidos) con baja afinidad por las IGFBP',
    'Recombinant IGF-1 analogue (83 amino acids) with low IGFBP affinity',
  ),
  summary: t(
    'Variante de IGF-1 con sustitución Glu3→Arg y una extensión N-terminal de 13 aminoácidos, diseñada como reactivo para cultivo celular: apenas se une a las proteínas transportadoras (IGFBP), por lo que es mucho más potente in vitro y de acción más prolongada que la IGF-1 nativa. No existe ningún ensayo en humanos; no debe confundirse con mecasermina (Increlex, IGF-1 recombinante aprobada para el déficit primario grave de IGF-1).',
    'IGF-1 variant with a Glu3→Arg substitution and a 13-amino-acid N-terminal extension, designed as a cell-culture reagent: it barely binds the carrier proteins (IGFBPs), making it far more potent in vitro and longer-acting than native IGF-1. There are no human trials at all; not to be confused with mecasermin (Increlex, recombinant IGF-1 approved for severe primary IGF-1 deficiency).',
  ),
  mechanism: t(
    'Agonista del receptor de IGF-1 (tirosina-cinasa, vías PI3K-Akt y MAPK) con reactividad cruzada con el receptor de insulina. Al escapar al secuestro por IGFBP, la fracción libre y bioactiva es muy superior a la de IGF-1 nativa: efectos anabólicos e hipoglucemiantes potentes en animales. Suprime la GH endógena por retroalimentación.',
    'IGF-1 receptor agonist (tyrosine kinase, PI3K-Akt and MAPK pathways) with cross-reactivity at the insulin receptor. By escaping IGFBP sequestration, the free bioactive fraction greatly exceeds that of native IGF-1: potent anabolic and hypoglycaemic effects in animals. Suppresses endogenous GH by feedback.',
  ),
  indications: [
    t(
      'Reactivo de cultivo celular y biotecnología (uso previsto)',
      'Cell-culture and bioprocessing reagent (intended use)',
    ),
    t(
      'Estados catabólicos en modelos animales (preclínico)',
      'Catabolic states in animal models (preclinical)',
    ),
    t(
      'Uso comunitario: hipertrofia muscular, “recomposición” (sin datos en humanos)',
      'Community use: muscle hypertrophy, “recomposition” (no human data)',
    ),
  ],
  evidence: 'preclinical',
  regulatory: {
    us: 'research_only',
    notes: t(
      'Nunca desarrollado para uso humano; comercializado como reactivo de laboratorio y en el mercado de “research chemicals”. La única IGF-1 aprobada es mecasermina (Increlex), con indicación, dosis y perfil de riesgo propios. Prohibido por la AMA (S2, IGF-1 y análogos).',
      'Never developed for human use; sold as a laboratory reagent and on the “research chemical” market. The only approved IGF-1 is mecasermin (Increlex), with its own indication, dosing and risk profile. WADA prohibited (S2, IGF-1 and analogues).',
    ),
  },
  routes: ['sc', 'im'],
  defaultUnit: 'mcg',
  dosing: {
    anecdotal: t(
      'Uso no aprobado — 20–100 µg SC o IM 1×/día (a veces intramuscular local posentrenamiento), ciclos de 4–6 semanas. Rangos comunitarios sin ningún respaldo en humanos; riesgo real de hipoglucemia grave.',
      'Unapproved use — 20–100 µg SC or IM once daily (sometimes local IM post-workout), 4–6-week cycles. Community ranges with no human support; real risk of severe hypoglycaemia.',
    ),
    frequency: t('1×/día', 'Once daily'),
  },
  reconstitution: t(
    'Viales liofilizados de 0,1 mg y 1 mg. Diluyente habitual: ácido acético 0,6 % o agua bacteriostática. 1 mg + 1 mL = 1 mg/mL → 50 µg = 0,05 mL = 5 U en jeringa U-100; 100 µg = 10 U. 1 mg + 2 mL = 0,5 mg/mL → 50 µg = 10 U (más preciso). Reconstituido: nevera 2–8 °C, uso en 2–4 semanas; muy sensible a la agitación y a la adsorción al vidrio.',
    'Lyophilised vials of 0.1 mg and 1 mg. Usual diluent: 0.6% acetic acid or bacteriostatic water. 1 mg + 1 mL = 1 mg/mL → 50 µg = 0.05 mL = 5 U on a U-100 syringe; 100 µg = 10 U. 1 mg + 2 mL = 0.5 mg/mL → 50 µg = 10 U (more precise). Reconstituted: refrigerate 2–8 °C, use within 2–4 weeks; very sensitive to shaking and adsorption to glass.',
  ),
  storage: t(
    'Liofilizado: −20 °C a largo plazo o nevera 2–8 °C a corto plazo, protegido de la luz. Reconstituido: nevera, no congelar repetidamente.',
    'Lyophilised: −20 °C long term or refrigerate 2–8 °C short term, protect from light. Reconstituted: refrigerate, avoid repeated freezing.',
  ),
  adverseEffects: {
    common: [
      t(
        'Hipoglucemia (sudoración, temblor, hambre) en las horas posteriores a la dosis',
        'Hypoglycaemia (sweating, tremor, hunger) in the hours after dosing',
      ),
      t('Cefalea, rubefacción, retención hídrica', 'Headache, flushing, fluid retention'),
      t(
        'Dolor e hipertrofia local en el punto de inyección',
        'Local pain and hypertrophy at the injection site',
      ),
    ],
    serious: [
      t(
        'Hipoglucemia grave con pérdida de conciencia',
        'Severe hypoglycaemia with loss of consciousness',
      ),
      t(
        'Promoción de neoplasias (el eje IGF-1 es mitogénico y antiapoptótico) — riesgo teórico pero biológicamente plausible',
        'Neoplasm promotion (the IGF-1 axis is mitogenic and anti-apoptotic) — theoretical but biologically plausible risk',
      ),
      t(
        'Hipertrofia de tejidos linfoides (amígdalas), hipertensión intracraneal (descritas con mecasermina)',
        'Lymphoid tissue (tonsillar) hypertrophy, intracranial hypertension (described with mecasermin)',
      ),
      t(
        'Pureza, identidad y contenido desconocidos; sin datos de seguridad en humanos',
        'Unknown purity, identity and content; no human safety data',
      ),
    ],
  },
  contraindications: [
    t('Neoplasia activa o antecedente de cáncer', 'Active malignancy or history of cancer'),
    t('Embarazo y lactancia', 'Pregnancy and lactation'),
    t(
      'Diabetes tratada con insulina o secretagogos (riesgo de hipoglucemia)',
      'Diabetes treated with insulin or secretagogues (hypoglycaemia risk)',
    ),
    t('Retinopatía diabética proliferativa', 'Proliferative diabetic retinopathy'),
    t('Menores con epífisis abiertas', 'Minors with open epiphyses'),
  ],
  interactions: [
    t(
      'Insulina, sulfonilureas, glinidas: hipoglucemia aditiva',
      'Insulin, sulfonylureas, glinides: additive hypoglycaemia',
    ),
    t(
      'Alcohol y ayuno prolongado: aumentan el riesgo de hipoglucemia',
      'Alcohol and prolonged fasting: increase hypoglycaemia risk',
    ),
    t(
      'GH exógena o secretagogos: efectos mitogénicos y metabólicos aditivos',
      'Exogenous GH or secretagogues: additive mitogenic and metabolic effects',
    ),
  ],
  monitoring: [
    t(
      'Glucemia capilar tras las primeras dosis; glucosa en ayunas / HbA1c',
      'Capillary glucose after the first doses; fasting glucose / HbA1c',
    ),
    t(
      'IGF-1 total (puede no reflejar la exposición al análogo según el inmunoensayo)',
      'Total IGF-1 (may not reflect analogue exposure depending on the immunoassay)',
    ),
    t('Cribado oncológico apropiado para la edad', 'Age-appropriate cancer screening'),
  ],
  keyTrials: [],
  references: [
    {
      label:
        'Tomas FM et al. IGF-I and especially IGF-I variants are anabolic in dexamethasone-treated rats. Biochem J 1992',
    },
    {
      label: 'Increlex (mecasermin) US Prescribing Information — DailyMed (comparador aprobado)',
      url: 'https://dailymed.nlm.nih.gov/dailymed/',
    },
    { label: 'WADA Prohibited List — S2 (IGF-1 and its analogues)' },
  ],
  tags: ['igf-1', 'análogo', 'hipoglucemia', 'anabólico', 'investigación'],
  lastReviewed: '2026-09-19',
}

const mk677: CompoundEntry = {
  id: 'mk-677',
  names: {
    generic: 'Ibutamoren',
    brands: [],
    aliases: ['MK-677', 'MK-0677', 'mesilato de ibutamoren', 'L-163,191', 'LUM-201'],
  },
  category: 'gh_axis',
  pharmClass: t(
    'Agonista oral NO peptídico del receptor de ghrelina (GHS-R1a); secretagogo de GH espiropiperidínico',
    'Oral NON-PEPTIDE ghrelin receptor (GHS-R1a) agonist; spiropiperidine GH secretagogue',
  ),
  summary: t(
    'Molécula pequeña oral (no es un péptido) desarrollada por Merck que imita a la ghrelina: una dosis diaria eleva la GH pulsátil e IGF-1 de forma sostenida hasta rangos de adulto joven. Ensayos de fase 2 en ancianos, fractura de cadera, Alzheimer y déficit de GH infantil; el ensayo en recuperación de fractura de cadera se interrumpió precozmente por una señal de insuficiencia cardíaca. No aprobado.',
    'Oral small molecule (not a peptide) developed by Merck that mimics ghrelin: a daily dose raises pulsatile GH and IGF-1 sustainedly into young-adult ranges. Phase 2 trials in the elderly, hip fracture, Alzheimer disease and childhood GH deficiency; the hip-fracture recovery trial was stopped early for a heart-failure signal. Not approved.',
  ),
  mechanism: t(
    'Agonista del GHS-R1a de larga duración y buena biodisponibilidad oral: amplifica los pulsos de GH (sobre todo nocturnos) conservando la retroalimentación por IGF-1, aumenta el apetito y eleva transitoriamente cortisol y prolactina (efecto que se atenúa con el uso continuado). Reduce la sensibilidad a la insulina.',
    'Long-acting GHS-R1a agonist with good oral bioavailability: amplifies GH pulses (mainly nocturnal) while preserving IGF-1 feedback, increases appetite and transiently raises cortisol and prolactin (an effect that attenuates with continued use). Reduces insulin sensitivity.',
  ),
  indications: [
    t(
      'Sarcopenia / fragilidad en ancianos (fase 2)',
      'Sarcopenia / frailty in the elderly (phase 2)',
    ),
    t(
      'Recuperación funcional tras fractura de cadera (fase 2b, interrumpido)',
      'Functional recovery after hip fracture (phase 2b, stopped)',
    ),
    t('Enfermedad de Alzheimer (fase 2, negativo)', 'Alzheimer disease (phase 2, negative)'),
    t(
      'Déficit de GH infantil con reserva hipofisaria (LUM-201, fase 2)',
      'Childhood GH deficiency with pituitary reserve (LUM-201, phase 2)',
    ),
    t(
      'Uso comunitario: masa muscular, sueño, “antienvejecimiento” (sin indicación)',
      'Community use: muscle mass, sleep, “anti-ageing” (no indication)',
    ),
  ],
  evidence: 'phase2',
  regulatory: {
    us: 'investigational',
    notes: t(
      'No aprobado en ningún país. Investigado por Merck en los años 90–2000 y retomado como LUM-201 (Lumos Pharma) para el déficit de GH pediátrico. Se vende ampliamente como “research chemical” en cápsulas o solución oral, a menudo mal etiquetado. No confundir con macimorelina (Macrilen), agonista oral de ghrelina aprobado solo como prueba diagnóstica. Prohibido por la AMA (S2).',
      'Not approved anywhere. Investigated by Merck in the 1990s–2000s and revived as LUM-201 (Lumos Pharma) for paediatric GH deficiency. Widely sold as a “research chemical” in capsules or oral solution, often mislabelled. Not to be confused with macimorelin (Macrilen), an oral ghrelin agonist approved only as a diagnostic test. WADA prohibited (S2).',
    ),
  },
  routes: ['oral'],
  defaultUnit: 'mg',
  pk: {
    halfLifeH: 5,
    source:
      'Estudios de fase 1 de Merck en voluntarios sanos y ancianos (Chapman IM et al., JCEM 1996 y trabajos relacionados): t½ oral ≈ 4–6 h',
    notes:
      'El efecto farmacodinámico (elevación de IGF-1) persiste 24 h pese a la t½ corta, lo que permite una dosis diaria. tmax no se ha fijado con precisión en las fuentes disponibles; el motor asume bolo.',
  },
  dosing: {
    investigational: t(
      'Ensayos en adultos mayores, Alzheimer y fractura de cadera: 25 mg VO 1×/día durante 2–24 meses (Chapman 1996; Nass 2008; Sevigny 2008). Estudios en déficit de GH infantil: ~0,8–3,2 mg/kg/día según protocolo de LUM-201.',
      'Trials in older adults, Alzheimer disease and hip fracture: 25 mg PO once daily for 2–24 months (Chapman 1996; Nass 2008; Sevigny 2008). Paediatric GH deficiency studies: ~0.8–3.2 mg/kg/day per LUM-201 protocol.',
    ),
    anecdotal: t(
      'Uso no aprobado — 10–25 mg VO 1×/día, a menudo al acostarse para minimizar el hambre diurna y aprovechar el pulso nocturno; ciclos largos de meses. Rangos comunitarios.',
      'Unapproved use — 10–25 mg PO once daily, often at bedtime to minimise daytime hunger and use the nocturnal pulse; long cycles of months. Community ranges.',
    ),
    frequency: t('1×/día, vía oral', 'Once daily, orally'),
  },
  storage: t(
    'Cápsulas o polvo: temperatura ambiente, seco y protegido de la luz. Soluciones orales de “research chemical”: estabilidad no documentada; seguir etiqueta del fabricante.',
    'Capsules or powder: room temperature, dry and protected from light. Research-chemical oral solutions: stability undocumented; follow manufacturer label.',
  ),
  adverseEffects: {
    common: [
      t('Aumento marcado del apetito', 'Marked appetite increase'),
      t('Edema periférico leve, artralgia, mialgia', 'Mild peripheral oedema, arthralgia, myalgia'),
      t('Letargia, somnolencia', 'Lethargy, drowsiness'),
      t('Aumento de peso (masa magra y grasa)', 'Weight gain (lean and fat mass)'),
    ],
    serious: [
      t(
        'Insuficiencia cardíaca congestiva: señal que motivó la interrupción del ensayo de fractura de cadera',
        'Congestive heart failure: signal that stopped the hip-fracture trial',
      ),
      t(
        'Aumento de glucosa en ayunas y HbA1c, reducción de sensibilidad a la insulina (Nass 2008)',
        'Rise in fasting glucose and HbA1c, reduced insulin sensitivity (Nass 2008)',
      ),
      t(
        'Elevación transitoria de cortisol y prolactina',
        'Transient cortisol and prolactin elevation',
      ),
      t(
        'Crecimiento de neoplasias ocultas mediado por IGF-1 (teórico)',
        'IGF-1-mediated growth of occult neoplasms (theoretical)',
      ),
    ],
  },
  contraindications: [
    t(
      'Insuficiencia cardíaca o cardiopatía estructural significativa',
      'Heart failure or significant structural heart disease',
    ),
    t('Neoplasia activa', 'Active malignancy'),
    t('Embarazo y lactancia', 'Pregnancy and lactation'),
    t(
      'Diabetes mal controlada o prediabetes avanzada',
      'Poorly controlled diabetes or advanced prediabetes',
    ),
    t('Retinopatía diabética proliferativa', 'Proliferative diabetic retinopathy'),
  ],
  interactions: [
    t(
      'Insulina y antidiabéticos: ajustar por hiperglucemia',
      'Insulin and antidiabetics: adjust for hyperglycaemia',
    ),
    t(
      'Glucocorticoides: efecto hiperglucemiante aditivo',
      'Glucocorticoids: additive hyperglycaemic effect',
    ),
    t(
      'Agonistas GLP-1: efecto opuesto sobre el apetito',
      'GLP-1 agonists: opposing appetite effect',
    ),
    t(
      'Fármacos que retienen sodio (AINE, tiazolidinedionas): más edema y riesgo de insuficiencia cardíaca',
      'Sodium-retaining drugs (NSAIDs, thiazolidinediones): more oedema and heart-failure risk',
    ),
    t(
      'Metabolismo por CYP3A4 descrito en la literatura preclínica: precaución con inhibidores potentes (dato no confirmado en humanos)',
      'CYP3A4 metabolism described in preclinical literature: caution with strong inhibitors (not confirmed in humans)',
    ),
  ],
  monitoring: [
    t('IGF-1 basal y a las 4–8 semanas', 'Baseline and 4–8-week IGF-1'),
    t(
      'Glucosa en ayunas y HbA1c basal y cada 3 meses',
      'Fasting glucose and HbA1c at baseline and every 3 months',
    ),
    t(
      'Peso, edema, signos de insuficiencia cardíaca (disnea, ortopnea)',
      'Weight, oedema, heart-failure signs (dyspnoea, orthopnoea)',
    ),
    t('Cortisol y prolactina si hay síntomas', 'Cortisol and prolactin if symptomatic'),
  ],
  keyTrials: [
    {
      name: 'Chapman (ancianos sanos)',
      year: 1996,
      finding: t(
        'Ibutamoren oral diario en adultos de 64–81 años: aumentó la GH pulsátil y restauró IGF-1 a niveles de adulto joven, con buena tolerancia a corto plazo.',
        'Daily oral ibutamoren in adults aged 64–81: increased pulsatile GH and restored IGF-1 to young-adult levels, well tolerated short term.',
      ),
      ref: 'JCEM 1996',
    },
    {
      name: 'Nass (2 años en ancianos)',
      year: 2008,
      finding: t(
        '25 mg/día durante 12–24 meses en adultos de 60–81 años: aumento de masa libre de grasa sin mejoría de fuerza ni función; elevación de glucosa en ayunas y reducción de la sensibilidad a la insulina, más apetito y edema.',
        '25 mg/day for 12–24 months in adults aged 60–81: increased fat-free mass without strength or function gains; raised fasting glucose and reduced insulin sensitivity, more appetite and oedema.',
      ),
      ref: 'Ann Intern Med 2008;149:601',
    },
    {
      name: 'Sevigny (Alzheimer)',
      year: 2008,
      finding: t(
        '12 meses de 25 mg/día en Alzheimer leve-moderado: elevó IGF-1 sin frenar la progresión clínica.',
        '12 months of 25 mg/day in mild-to-moderate Alzheimer disease: raised IGF-1 without slowing clinical progression.',
      ),
      ref: 'Neurology 2008',
    },
    {
      name: 'Adunsky (fractura de cadera, fase 2b)',
      year: 2011,
      finding: t(
        'Ancianos tras fractura de cadera: interrumpido precozmente por una señal de seguridad de insuficiencia cardíaca congestiva; sin beneficio funcional claro.',
        'Elderly after hip fracture: stopped early for a congestive heart-failure safety signal; no clear functional benefit.',
      ),
      ref: 'Arch Gerontol Geriatr 2011',
    },
  ],
  references: [
    {
      label:
        'Chapman IM et al. Stimulation of the GH-IGF axis by daily oral administration of a GH secretagogue (MK-677) in healthy elderly subjects. JCEM 1996',
    },
    {
      label:
        'Nass R et al. Effects of an oral ghrelin mimetic on body composition and clinical outcomes in healthy older adults. Ann Intern Med 2008',
    },
    {
      label:
        'Adunsky A et al. MK-0677 (ibutamoren mesylate) for the treatment of patients recovering from hip fracture. Arch Gerontol Geriatr 2011',
    },
    { label: 'WADA Prohibited List — S2 (GH secretagogues / ghrelin mimetics)' },
  ],
  tags: ['ghs-r1a', 'ghrelina', 'oral', 'no peptídico', 'gh', 'igf-1', 'investigación'],
  lastReviewed: '2026-09-19',
}

// ---------------------------------------------------------------------------
// REPAIR
// ---------------------------------------------------------------------------

const REPAIR_503A_NOTE_ES =
  'Según las listas publicadas, la FDA incluyó hacia 2023–2024 varios péptidos (BPC-157, fragmentos de timosina β4/TB-500, GHK-Cu inyectable, KPV, GHRP de tipo ipamorelina, entre otros) en la categoría 2 de sustancias a granel 503A (“problemas de seguridad significativos”), lo que restringe su formulación magistral legal.'
const REPAIR_503A_NOTE_EN =
  'According to the published lists, around 2023–2024 FDA placed several peptides (BPC-157, thymosin β4 fragments/TB-500, injectable GHK-Cu, KPV, ipamorelin-type GHRPs, among others) in 503A bulk-substance Category 2 (“significant safety risks”), restricting lawful compounding.'

const bpc157: CompoundEntry = {
  id: 'bpc-157',
  names: {
    generic: 'BPC-157',
    brands: [],
    aliases: ['Body Protection Compound-157', 'PL 14736', 'PL-10', 'bepecina', 'GEPPPGKPADDAGLV'],
  },
  category: 'repair',
  pharmClass: t(
    'Pentadecapéptido sintético derivado de una proteína del jugo gástrico humano; citoprotector / proangiogénico (experimental)',
    'Synthetic pentadecapeptide derived from a human gastric-juice protein; cytoprotective / pro-angiogenic (experimental)',
  ),
  summary: t(
    'Fragmento de 15 aminoácidos de la “body protection compound”, estudiado casi exclusivamente por un grupo de Zagreb (Sikirić) en cientos de trabajos en roedores con efectos en tendón, ligamento, músculo, tubo digestivo y vasos. No hay ensayos controlados publicados en humanos: solo un programa de Pliva (PL 14736) en enfermedad inflamatoria intestinal comunicado en resúmenes y series de casos retrospectivas. Es uno de los péptidos más usados fuera de indicación pese a ello.',
    '15-amino-acid fragment of “body protection compound”, studied almost exclusively by one Zagreb group (Sikirić) in hundreds of rodent papers with effects on tendon, ligament, muscle, gut and vessels. There are no published controlled human trials: only a Pliva programme (PL 14736) in inflammatory bowel disease reported in abstracts, and retrospective case series. It is nonetheless one of the most used off-label peptides.',
  ),
  mechanism: t(
    'Mecanismo no establecido. En modelos animales: modulación del sistema del óxido nítrico, aumento de la expresión de VEGFR2 y de la vía Akt-eNOS (angiogénesis), activación de FAK-paxilina en fibroblastos tendinosos, aumento de la expresión del receptor de GH en tenocitos y efecto citoprotector sobre la mucosa gástrica. Es estable en jugo gástrico, lo que explica su uso oral.',
    'Mechanism not established. In animal models: modulation of the nitric-oxide system, increased VEGFR2 expression and Akt-eNOS signalling (angiogenesis), FAK-paxillin activation in tendon fibroblasts, increased GH-receptor expression in tenocytes and cytoprotection of gastric mucosa. It is stable in gastric juice, which explains oral use.',
  ),
  indications: [
    t(
      'Lesiones de tendón, ligamento y músculo (preclínico)',
      'Tendon, ligament and muscle injuries (preclinical)',
    ),
    t(
      'Úlcera péptica, lesión por AINE, enfermedad inflamatoria intestinal (preclínico; PL 14736 en colitis ulcerosa comunicado solo en resúmenes)',
      'Peptic ulcer, NSAID injury, inflammatory bowel disease (preclinical; PL 14736 in ulcerative colitis reported only in abstracts)',
    ),
    t(
      'Dolor articular de rodilla (serie retrospectiva no controlada)',
      'Knee joint pain (uncontrolled retrospective series)',
    ),
    t(
      'Uso comunitario: recuperación de lesiones deportivas, “intestino permeable” (sin ensayos)',
      'Community use: sports-injury recovery, “leaky gut” (no trials)',
    ),
  ],
  evidence: 'preclinical',
  regulatory: {
    us: 'research_only',
    notes: t(
      `Nunca aprobado. ${REPAIR_503A_NOTE_ES} Incluido por la AMA en la sección S0 (sustancias no aprobadas) desde 2022. Los productos de “research chemical” presentan problemas documentados de pureza, dosis real y endotoxinas.`,
      `Never approved. ${REPAIR_503A_NOTE_EN} Listed by WADA under S0 (non-approved substances) since 2022. Research-chemical products have documented issues with purity, actual dose and endotoxin.`,
    ),
  },
  routes: ['sc', 'im', 'oral'],
  defaultUnit: 'mcg',
  dosing: {
    anecdotal: t(
      'Uso no aprobado — 250–500 µg SC 1–2×/día (a menudo cerca de la lesión) durante 2–6 semanas; oral 250–500 µg 1–2×/día para indicaciones digestivas. Dosis extrapoladas de estudios en rata (~10 µg/kg); sin ensayos que las respalden.',
      'Unapproved use — 250–500 µg SC 1–2×/day (often near the injury) for 2–6 weeks; oral 250–500 µg 1–2×/day for GI indications. Doses extrapolated from rat studies (~10 µg/kg); no trials support them.',
    ),
    frequency: t('1–2×/día', '1–2×/day'),
  },
  reconstitution: t(
    'Viales liofilizados de 5 mg y 10 mg. 5 mg + 2 mL de agua bacteriostática = 2,5 mg/mL → 250 µg = 0,1 mL = 10 U en jeringa U-100; 500 µg = 20 U. 10 mg + 2 mL = 5 mg/mL → 250 µg = 5 U. Reconstituido: nevera 2–8 °C, uso en 3–4 semanas, protegido de la luz.',
    'Lyophilised vials of 5 mg and 10 mg. 5 mg + 2 mL bacteriostatic water = 2.5 mg/mL → 250 µg = 0.1 mL = 10 U on a U-100 syringe; 500 µg = 20 U. 10 mg + 2 mL = 5 mg/mL → 250 µg = 5 U. Reconstituted: refrigerate 2–8 °C, use within 3–4 weeks, protect from light.',
  ),
  storage: t(
    'Liofilizado: nevera 2–8 °C o −20 °C a largo plazo, protegido de la luz. Reconstituido: nevera, no congelar. Cápsulas orales: temperatura ambiente, secas.',
    'Lyophilised: refrigerate 2–8 °C or −20 °C long term, protect from light. Reconstituted: refrigerate, do not freeze. Oral capsules: room temperature, dry.',
  ),
  adverseEffects: {
    common: [
      t(
        'Reacciones en el punto de inyección (dolor, eritema)',
        'Injection-site reactions (pain, erythema)',
      ),
      t(
        'Náuseas, mareo, cefalea (comunicaciones anecdóticas)',
        'Nausea, dizziness, headache (anecdotal reports)',
      ),
      t('Somnolencia o fatiga transitoria', 'Transient drowsiness or fatigue'),
    ],
    serious: [
      t(
        'Efecto proangiogénico: posible promoción de neoplasias ocultas (teórico, no estudiado)',
        'Pro-angiogenic effect: possible promotion of occult neoplasms (theoretical, unstudied)',
      ),
      t(
        'Infecciones y reacciones por contaminación o endotoxinas en productos no regulados',
        'Infections and reactions from contamination or endotoxin in unregulated products',
      ),
      t('Hipersensibilidad', 'Hypersensitivity'),
      t('Seguridad en humanos esencialmente desconocida', 'Human safety essentially unknown'),
    ],
  },
  contraindications: [
    t(
      'Neoplasia activa o antecedente reciente (angiogénesis)',
      'Active or recent malignancy (angiogenesis)',
    ),
    t('Embarazo y lactancia', 'Pregnancy and lactation'),
    t('Deportistas sujetos a control antidopaje', 'Athletes subject to anti-doping control'),
    t('Hipersensibilidad conocida', 'Known hypersensitivity'),
  ],
  interactions: [
    t('Sin estudios de interacciones en humanos', 'No human interaction studies'),
    t(
      'Antiangiogénicos (bevacizumab, inhibidores de VEGFR): efectos opuestos teóricos',
      'Anti-angiogenics (bevacizumab, VEGFR inhibitors): theoretical opposing effects',
    ),
    t(
      'Anticoagulantes: datos animales de modulación de la hemostasia; precaución',
      'Anticoagulants: animal data on haemostasis modulation; caution',
    ),
  ],
  monitoring: [
    t(
      'Evolución clínica de la lesión (sin biomarcadores validados)',
      'Clinical course of the injury (no validated biomarkers)',
    ),
    t(
      'Signos locales de infección en el punto de inyección',
      'Local signs of infection at the injection site',
    ),
    t(
      'Cribado oncológico apropiado para la edad antes de uso prolongado',
      'Age-appropriate cancer screening before prolonged use',
    ),
  ],
  keyTrials: [],
  references: [
    {
      label:
        'Sikirić P et al. — revisiones del grupo de Zagreb sobre BPC-157 (Curr Pharm Des y otras, 2011–2023)',
    },
    {
      label:
        'Lee E, Padgett B. Intra-articular injection of BPC 157 for multiple types of knee pain. Altern Ther Health Med 2021 (serie retrospectiva)',
    },
    { label: 'FDA — 503A bulk drug substances Category 2 list (2023–2024)' },
    { label: 'WADA Prohibited List — S0 non-approved substances' },
  ],
  tags: ['reparación', 'tendón', 'digestivo', 'angiogénesis', 'preclínico', 'investigación'],
  lastReviewed: '2026-09-19',
}

const tb500: CompoundEntry = {
  id: 'tb-500',
  names: {
    generic: 'TB-500',
    brands: [],
    aliases: [
      'fragmento de timosina beta-4',
      'Tβ4 17-23',
      'Ac-LKKTETQ',
      'timosina β4',
      'thymosin beta-4 fragment',
    ],
  },
  category: 'repair',
  pharmClass: t(
    'Péptido sintético derivado de la timosina β4 (motivo de unión a actina); promotor de migración celular y angiogénesis (experimental)',
    'Synthetic peptide derived from thymosin β4 (actin-binding motif); promoter of cell migration and angiogenesis (experimental)',
  ),
  summary: t(
    '“TB-500” es una denominación comercial ambigua: suele corresponder al fragmento acetilado 17-23 (LKKTETQ) de la timosina β4, aunque algunos productos contienen la proteína completa de 43 aminoácidos. La timosina β4 completa (RegeneRx) llegó a ensayos de fase 2–3 en úlceras cutáneas y ojo seco/queratopatía con resultados mixtos; el fragmento TB-500 no tiene ningún dato en humanos. Popular en medicina veterinaria equina y en el ámbito deportivo.',
    '“TB-500” is an ambiguous trade name: it usually denotes the acetylated 17-23 fragment (LKKTETQ) of thymosin β4, though some products contain the full 43-amino-acid protein. Full-length thymosin β4 (RegeneRx) reached phase 2–3 trials in skin ulcers and dry eye/keratopathy with mixed results; the TB-500 fragment has no human data at all. Popular in equine veterinary practice and sport.',
  ),
  mechanism: t(
    'La timosina β4 secuestra G-actina y regula la polimerización del citoesqueleto, favoreciendo la migración de queratinocitos, células endoteliales y progenitores cardíacos; en animales promueve angiogénesis, reduce la inflamación (NF-κB) y la fibrosis. El fragmento 17-23 contiene el dominio de unión a actina, pero su equivalencia funcional con la proteína completa in vivo no está demostrada.',
    'Thymosin β4 sequesters G-actin and regulates cytoskeletal polymerisation, favouring migration of keratinocytes, endothelial cells and cardiac progenitors; in animals it promotes angiogenesis and reduces inflammation (NF-κB) and fibrosis. The 17-23 fragment contains the actin-binding domain, but its in vivo functional equivalence to the full protein is not demonstrated.',
  ),
  indications: [
    t(
      'Úlceras venosas y por presión, epidermólisis bullosa (timosina β4 tópica, fase 2)',
      'Venous and pressure ulcers, epidermolysis bullosa (topical thymosin β4, phase 2)',
    ),
    t(
      'Ojo seco y queratopatía neurotrófica (colirio RGN-259, fase 2–3, resultados mixtos)',
      'Dry eye and neurotrophic keratopathy (RGN-259 eye drops, phase 2–3, mixed results)',
    ),
    t(
      'Reparación miocárdica tras infarto (preclínico)',
      'Myocardial repair after infarction (preclinical)',
    ),
    t(
      'Uso comunitario: lesiones musculotendinosas, recuperación (sin ensayos)',
      'Community use: musculotendinous injuries, recovery (no trials)',
    ),
  ],
  evidence: 'preclinical',
  regulatory: {
    us: 'research_only',
    notes: t(
      `El fragmento TB-500 nunca se ha desarrollado clínicamente; la timosina β4 completa sigue en investigación y no está aprobada. ${REPAIR_503A_NOTE_ES} Prohibido por la AMA (S2, “timosina β4 y sus derivados, p. ej. TB-500”).`,
      `The TB-500 fragment has never been developed clinically; full-length thymosin β4 remains investigational and unapproved. ${REPAIR_503A_NOTE_EN} WADA prohibited (S2, “thymosin β4 and its derivatives, e.g. TB-500”).`,
    ),
  },
  routes: ['sc', 'im'],
  defaultUnit: 'mg',
  dosing: {
    investigational: t(
      'Timosina β4 completa (no TB-500): fase 1 IV en voluntarios sanos con dosis únicas y repetidas de hasta ~1.260 mg, bien toleradas (Ruff 2010); gel tópico al 0,01–0,03 % en úlceras; colirio al 0,05–0,1 % en ojo seco.',
      'Full-length thymosin β4 (not TB-500): phase 1 IV in healthy volunteers with single and repeated doses up to ~1,260 mg, well tolerated (Ruff 2010); 0.01–0.03% topical gel in ulcers; 0.05–0.1% eye drops in dry eye.',
    ),
    anecdotal: t(
      'Uso no aprobado — carga de 2–2,5 mg SC/IM 2×/semana durante 4–6 semanas y mantenimiento de 2 mg cada 1–2 semanas; a menudo combinado con BPC-157. Rangos comunitarios derivados de la práctica veterinaria.',
      'Unapproved use — loading 2–2.5 mg SC/IM twice weekly for 4–6 weeks and maintenance 2 mg every 1–2 weeks; often combined with BPC-157. Community ranges derived from veterinary practice.',
    ),
    frequency: t(
      '2×/semana (carga) · cada 1–2 semanas (mantenimiento)',
      'Twice weekly (loading) · every 1–2 weeks (maintenance)',
    ),
  },
  reconstitution: t(
    'Viales liofilizados de 2 mg, 5 mg y 10 mg. 5 mg + 2 mL de agua bacteriostática = 2,5 mg/mL → 2 mg = 0,8 mL = 80 U en jeringa U-100; 250 µg = 10 U. 10 mg + 2 mL = 5 mg/mL → 2 mg = 40 U. Reconstituido: nevera 2–8 °C, 3–4 semanas.',
    'Lyophilised vials of 2 mg, 5 mg and 10 mg. 5 mg + 2 mL bacteriostatic water = 2.5 mg/mL → 2 mg = 0.8 mL = 80 U on a U-100 syringe; 250 µg = 10 U. 10 mg + 2 mL = 5 mg/mL → 2 mg = 40 U. Reconstituted: refrigerate 2–8 °C, 3–4 weeks.',
  ),
  storage: t(
    'Liofilizado: nevera 2–8 °C o −20 °C a largo plazo, protegido de la luz. Reconstituido: nevera, no congelar, no agitar.',
    'Lyophilised: refrigerate 2–8 °C or −20 °C long term, protect from light. Reconstituted: refrigerate, do not freeze, do not shake.',
  ),
  adverseEffects: {
    common: [
      t('Reacciones en el punto de inyección', 'Injection-site reactions'),
      t('Cefalea, letargia, rubefacción (anecdóticas)', 'Headache, lethargy, flushing (anecdotal)'),
      t('Náuseas', 'Nausea'),
    ],
    serious: [
      t(
        'Promoción teórica de crecimiento tumoral y metástasis (la sobreexpresión de timosina β4 se asocia a peor pronóstico en algunos cánceres)',
        'Theoretical promotion of tumour growth and metastasis (thymosin β4 overexpression is associated with worse prognosis in some cancers)',
      ),
      t(
        'Contaminación, identidad incierta (fragmento vs proteína completa) en productos no regulados',
        'Contamination, uncertain identity (fragment vs full protein) in unregulated products',
      ),
      t('Seguridad del fragmento en humanos desconocida', 'Human safety of the fragment unknown'),
    ],
  },
  contraindications: [
    t('Neoplasia activa o antecedente reciente', 'Active or recent malignancy'),
    t('Embarazo y lactancia', 'Pregnancy and lactation'),
    t('Deportistas sujetos a control antidopaje', 'Athletes subject to anti-doping control'),
    t('Hipersensibilidad conocida', 'Known hypersensitivity'),
  ],
  interactions: [
    t('Sin estudios de interacciones en humanos', 'No human interaction studies'),
    t(
      'Antiangiogénicos: efectos opuestos teóricos',
      'Anti-angiogenics: theoretical opposing effects',
    ),
  ],
  monitoring: [
    t(
      'Evolución clínica de la lesión (sin biomarcadores validados)',
      'Clinical course of the injury (no validated biomarkers)',
    ),
    t('Signos locales de infección', 'Local signs of infection'),
    t('Cribado oncológico apropiado para la edad', 'Age-appropriate cancer screening'),
  ],
  keyTrials: [
    {
      name: 'Ruff (fase 1, timosina β4 IV)',
      year: 2010,
      finding: t(
        'Voluntarios sanos: timosina β4 completa IV en dosis únicas y repetidas, sin toxicidad limitante de dosis. No aplicable directamente al fragmento TB-500.',
        'Healthy volunteers: full-length thymosin β4 IV in single and repeated doses, with no dose-limiting toxicity. Not directly applicable to the TB-500 fragment.',
      ),
      ref: 'Ann N Y Acad Sci 2010',
    },
  ],
  references: [
    {
      label:
        'Ruff D et al. A randomized, placebo-controlled, single and multiple dose study of intravenous thymosin β4 in healthy volunteers. Ann N Y Acad Sci 2010',
    },
    {
      label:
        'Goldstein AL et al. Thymosin β4: a multi-functional regenerative peptide. Expert Opin Biol Ther 2012',
    },
    { label: 'FDA — 503A bulk drug substances Category 2 list (2023–2024)' },
    { label: 'WADA Prohibited List — S2 (thymosin β4 and derivatives)' },
  ],
  tags: ['reparación', 'timosina', 'actina', 'angiogénesis', 'preclínico', 'investigación'],
  lastReviewed: '2026-09-19',
}

const ghkCu: CompoundEntry = {
  id: 'ghk-cu',
  names: {
    generic: 'GHK-Cu',
    brands: [],
    aliases: [
      'péptido de cobre',
      'copper peptide',
      'glicil-L-histidil-L-lisina-cobre',
      'tripéptido de cobre-1',
      'copper tripeptide-1',
    ],
  },
  category: 'repair',
  pharmClass: t(
    'Tripéptido endógeno quelante de cobre (Gly-His-Lys:Cu²⁺); modulador de la remodelación tisular',
    'Endogenous copper-chelating tripeptide (Gly-His-Lys:Cu²⁺); tissue-remodelling modulator',
  ),
  summary: t(
    'Tripéptido presente en plasma, saliva y orina humanos (descrito por Pickart en 1973) cuya concentración disminuye con la edad. Es un ingrediente cosmético tópico muy extendido (sérums antiarrugas, cicatrización, cuero cabelludo) con estudios pequeños financiados por la industria; su uso inyectable es reciente y carece de cualquier dato en humanos.',
    'Tripeptide present in human plasma, saliva and urine (described by Pickart in 1973) whose concentration falls with age. It is a widespread topical cosmetic ingredient (anti-wrinkle serums, wound healing, scalp) with small industry-funded studies; injectable use is recent and lacks any human data.',
  ),
  mechanism: t(
    'Transporta cobre a las células y modula enzimas dependientes de cobre (lisil-oxidasa, superóxido dismutasa). In vitro y en animales estimula la síntesis de colágeno, elastina y glicosaminoglicanos, la angiogénesis y la atracción de células inmunitarias y fibroblastos, y modula metaloproteasas. Estudios de expresión génica sugieren efectos amplios, de relevancia clínica no establecida.',
    'Delivers copper to cells and modulates copper-dependent enzymes (lysyl oxidase, superoxide dismutase). In vitro and in animals it stimulates collagen, elastin and glycosaminoglycan synthesis, angiogenesis and recruitment of immune cells and fibroblasts, and modulates metalloproteinases. Gene-expression studies suggest broad effects of unestablished clinical relevance.',
  ),
  indications: [
    t(
      'Envejecimiento cutáneo, fotodaño (cosmético tópico; estudios pequeños)',
      'Skin ageing, photodamage (topical cosmetic; small studies)',
    ),
    t('Cicatrización de heridas (preclínico)', 'Wound healing (preclinical)'),
    t(
      'Alopecia (cosmético tópico; evidencia muy limitada)',
      'Alopecia (topical cosmetic; very limited evidence)',
    ),
    t(
      'Uso comunitario inyectable: piel, “antienvejecimiento” sistémico (sin datos)',
      'Community injectable use: skin, systemic “anti-ageing” (no data)',
    ),
  ],
  evidence: 'preclinical',
  regulatory: {
    us: 'research_only',
    notes: t(
      `Como ingrediente cosmético tópico se comercializa legalmente sin estatus de medicamento. La forma inyectable no está aprobada. ${REPAIR_503A_NOTE_ES} Hasta donde consta, la restricción afecta a la vía inyectable y no a los cosméticos tópicos.`,
      `As a topical cosmetic ingredient it is lawfully sold without drug status. The injectable form is not approved. ${REPAIR_503A_NOTE_EN} As far as is known, the restriction concerns the injectable route, not topical cosmetics.`,
    ),
  },
  routes: ['topical', 'sc'],
  defaultUnit: 'mg',
  dosing: {
    anecdotal: t(
      'Uso no aprobado — inyectable: 1–2 mg SC 1×/día durante 4–8 semanas (a menudo con escozor local marcado). Tópico: cremas o sérums cosméticos de concentración variable aplicados 1–2×/día. Rangos comunitarios; sin ensayos de la vía SC.',
      'Unapproved use — injectable: 1–2 mg SC once daily for 4–8 weeks (often with marked local stinging). Topical: cosmetic creams or serums of variable concentration applied 1–2×/day. Community ranges; no trials of the SC route.',
    ),
    frequency: t('1×/día', 'Once daily'),
  },
  reconstitution: t(
    'Viales liofilizados de 50 mg y 100 mg (polvo azul). 50 mg + 5 mL de agua bacteriostática = 10 mg/mL → 1 mg = 0,1 mL = 10 U en jeringa U-100; 2 mg = 20 U. 100 mg + 5 mL = 20 mg/mL → 1 mg = 5 U. Solución azul; desechar si cambia de color o precipita. Reconstituido: nevera 2–8 °C, 3–4 semanas, protegido de la luz.',
    'Lyophilised vials of 50 mg and 100 mg (blue powder). 50 mg + 5 mL bacteriostatic water = 10 mg/mL → 1 mg = 0.1 mL = 10 U on a U-100 syringe; 2 mg = 20 U. 100 mg + 5 mL = 20 mg/mL → 1 mg = 5 U. Blue solution; discard if colour changes or it precipitates. Reconstituted: refrigerate 2–8 °C, 3–4 weeks, protect from light.',
  ),
  storage: t(
    'Liofilizado: nevera 2–8 °C o −20 °C, protegido de la luz. Reconstituido: nevera, no congelar. Cosméticos: según etiqueta; incompatibles con ácidos fuertes y vitamina C a pH bajo en la misma formulación.',
    'Lyophilised: refrigerate 2–8 °C or −20 °C, protect from light. Reconstituted: refrigerate, do not freeze. Cosmetics: per label; incompatible with strong acids and low-pH vitamin C in the same formulation.',
  ),
  adverseEffects: {
    common: [
      t(
        'Escozor, dolor y eritema intensos en el punto de inyección',
        'Intense stinging, pain and erythema at the injection site',
      ),
      t('Tópico: irritación leve, sequedad', 'Topical: mild irritation, dryness'),
      t(
        'Náuseas, sabor metálico (anecdótico con la vía SC)',
        'Nausea, metallic taste (anecdotal with SC route)',
      ),
    ],
    serious: [
      t(
        'Sobrecarga de cobre con uso sistémico prolongado (teórico)',
        'Copper overload with prolonged systemic use (theoretical)',
      ),
      t(
        'Efecto proangiogénico: posible promoción de neoplasias (teórico)',
        'Pro-angiogenic effect: possible neoplasm promotion (theoretical)',
      ),
      t(
        'Contaminación o endotoxinas en productos inyectables no regulados',
        'Contamination or endotoxin in unregulated injectable products',
      ),
    ],
  },
  contraindications: [
    t(
      'Enfermedad de Wilson u otros trastornos del metabolismo del cobre',
      'Wilson disease or other copper-metabolism disorders',
    ),
    t('Neoplasia activa (vía sistémica)', 'Active malignancy (systemic route)'),
    t('Embarazo y lactancia (vía sistémica)', 'Pregnancy and lactation (systemic route)'),
    t(
      'Hepatopatía colestásica (excreción biliar de cobre)',
      'Cholestatic liver disease (biliary copper excretion)',
    ),
    t('Hipersensibilidad conocida', 'Known hypersensitivity'),
  ],
  interactions: [
    t(
      'Suplementos de cobre o zinc: alteración del balance de oligoelementos',
      'Copper or zinc supplements: altered trace-element balance',
    ),
    t(
      'Quelantes (penicilamina, trientina): efecto opuesto',
      'Chelators (penicillamine, trientine): opposing effect',
    ),
    t(
      'Tópico: ácido ascórbico y ácidos exfoliantes pueden inactivarlo en la misma aplicación',
      'Topical: ascorbic acid and exfoliating acids may inactivate it in the same application',
    ),
  ],
  monitoring: [
    t(
      'Uso sistémico prolongado: cobre sérico y ceruloplasmina',
      'Prolonged systemic use: serum copper and ceruloplasmin',
    ),
    t('Pruebas de función hepática', 'Liver function tests'),
    t('Reacciones locales', 'Local reactions'),
  ],
  keyTrials: [],
  references: [
    {
      label:
        'Pickart L, Thaler MM. Tripeptide in human serum which prolongs survival of normal liver cells and stimulates growth in neoplastic liver. Nat New Biol 1973',
    },
    {
      label:
        'Pickart L, Margolina A. Regenerative and protective actions of the GHK-Cu peptide in the light of the new gene data. Int J Mol Sci 2018',
    },
    { label: 'FDA — 503A bulk drug substances Category 2 list (2023–2024)' },
  ],
  tags: ['reparación', 'cobre', 'piel', 'cosmético', 'tópico', 'preclínico'],
  lastReviewed: '2026-09-19',
}

const kpv: CompoundEntry = {
  id: 'kpv',
  names: {
    generic: 'KPV',
    brands: [],
    aliases: ['Lys-Pro-Val', 'α-MSH (11-13)', 'alfa-MSH 11-13', 'tripéptido KPV'],
  },
  category: 'repair',
  pharmClass: t(
    'Tripéptido C-terminal de la α-MSH; antiinflamatorio (experimental)',
    'C-terminal tripeptide of α-MSH; anti-inflammatory (experimental)',
  ),
  summary: t(
    'Tripéptido correspondiente a los aminoácidos 11-13 de la hormona estimulante de melanocitos α, que conserva buena parte de su actividad antiinflamatoria sin efectos pigmentarios relevantes. Datos exclusivamente in vitro y en modelos murinos de colitis y dermatitis; no hay ningún ensayo en humanos.',
    'Tripeptide corresponding to amino acids 11-13 of α-melanocyte-stimulating hormone, retaining much of its anti-inflammatory activity without relevant pigmentary effects. Data are exclusively in vitro and in murine colitis and dermatitis models; there are no human trials.',
  ),
  mechanism: t(
    'Inhibe la activación de NF-κB y MAPK y la producción de citocinas proinflamatorias (IL-6, IL-8, TNF-α) en células epiteliales e inmunitarias. En el colon se capta a través del transportador de péptidos PepT1, lo que explica su actividad oral en colitis murina. Su dependencia de receptores de melanocortina (MC1R/MC3R) es discutida; parte del efecto parece intracelular e independiente de receptor.',
    'Inhibits NF-κB and MAPK activation and production of pro-inflammatory cytokines (IL-6, IL-8, TNF-α) in epithelial and immune cells. In the colon it is taken up via the PepT1 peptide transporter, explaining its oral activity in murine colitis. Its dependence on melanocortin receptors (MC1R/MC3R) is debated; part of the effect appears intracellular and receptor-independent.',
  ),
  indications: [
    t(
      'Enfermedad inflamatoria intestinal (preclínico, colitis murina)',
      'Inflammatory bowel disease (preclinical, murine colitis)',
    ),
    t(
      'Dermatitis y cicatrización cutánea (preclínico)',
      'Dermatitis and skin healing (preclinical)',
    ),
    t(
      'Uso comunitario: “intestino permeable”, inflamación sistémica, piel (sin ensayos)',
      'Community use: “leaky gut”, systemic inflammation, skin (no trials)',
    ),
  ],
  evidence: 'preclinical',
  regulatory: {
    us: 'research_only',
    notes: t(
      `Nunca desarrollado clínicamente. ${REPAIR_503A_NOTE_ES}`,
      `Never developed clinically. ${REPAIR_503A_NOTE_EN}`,
    ),
  },
  routes: ['oral', 'sc', 'topical'],
  defaultUnit: 'mcg',
  dosing: {
    anecdotal: t(
      'Uso no aprobado — 200–500 µg VO (cápsulas) o SC 1–2×/día durante 4–8 semanas; tópico en cremas de concentración variable. Rangos comunitarios sin respaldo en humanos.',
      'Unapproved use — 200–500 µg PO (capsules) or SC 1–2×/day for 4–8 weeks; topical in creams of variable concentration. Community ranges without human support.',
    ),
    frequency: t('1–2×/día', '1–2×/day'),
  },
  reconstitution: t(
    'Viales liofilizados de 5 mg y 10 mg. 10 mg + 2 mL de agua bacteriostática = 5 mg/mL → 500 µg = 0,1 mL = 10 U en jeringa U-100; 250 µg = 5 U. 5 mg + 2 mL = 2,5 mg/mL → 250 µg = 10 U. Reconstituido: nevera 2–8 °C, 3–4 semanas.',
    'Lyophilised vials of 5 mg and 10 mg. 10 mg + 2 mL bacteriostatic water = 5 mg/mL → 500 µg = 0.1 mL = 10 U on a U-100 syringe; 250 µg = 5 U. 5 mg + 2 mL = 2.5 mg/mL → 250 µg = 10 U. Reconstituted: refrigerate 2–8 °C, 3–4 weeks.',
  ),
  storage: t(
    'Liofilizado: nevera 2–8 °C o −20 °C, protegido de la luz. Reconstituido: nevera, no congelar. Cápsulas: temperatura ambiente, secas.',
    'Lyophilised: refrigerate 2–8 °C or −20 °C, protect from light. Reconstituted: refrigerate, do not freeze. Capsules: room temperature, dry.',
  ),
  adverseEffects: {
    common: [
      t('Reacciones en el punto de inyección', 'Injection-site reactions'),
      t(
        'Molestias digestivas leves con la vía oral (anecdótico)',
        'Mild GI discomfort with oral route (anecdotal)',
      ),
    ],
    serious: [
      t(
        'Inmunosupresión local o sistémica: efecto sobre la defensa frente a infecciones desconocido',
        'Local or systemic immunosuppression: effect on infection defence unknown',
      ),
      t(
        'Contaminación o identidad incierta en productos no regulados',
        'Contamination or uncertain identity in unregulated products',
      ),
      t('Seguridad en humanos desconocida', 'Human safety unknown'),
    ],
  },
  contraindications: [
    t('Embarazo y lactancia', 'Pregnancy and lactation'),
    t('Infección activa no controlada', 'Uncontrolled active infection'),
    t('Hipersensibilidad conocida', 'Known hypersensitivity'),
    t(
      'Sustitución de tratamiento eficaz de EII (riesgo de brote grave)',
      'Replacement of effective IBD therapy (risk of severe flare)',
    ),
  ],
  interactions: [
    t('Sin estudios de interacciones en humanos', 'No human interaction studies'),
    t(
      'Inmunosupresores y biológicos: posible efecto aditivo teórico',
      'Immunosuppressants and biologics: possible theoretical additive effect',
    ),
  ],
  monitoring: [
    t(
      'Actividad clínica de la enfermedad de base (p. ej. calprotectina fecal, PCR en EII)',
      'Clinical activity of the underlying disease (e.g. faecal calprotectin, CRP in IBD)',
    ),
    t('Signos de infección', 'Signs of infection'),
  ],
  keyTrials: [],
  references: [
    {
      label:
        'Dalmasso G et al. PepT1-mediated tripeptide KPV uptake reduces intestinal inflammation. Gastroenterology 2008',
    },
    {
      label:
        'Brzoska T et al. α-MSH and related tripeptides: biochemistry, anti-inflammatory and protective effects. Endocr Rev 2008',
    },
    { label: 'FDA — 503A bulk drug substances Category 2 list (2023–2024)' },
  ],
  tags: [
    'reparación',
    'antiinflamatorio',
    'melanocortina',
    'intestino',
    'preclínico',
    'investigación',
  ],
  lastReviewed: '2026-09-19',
}

const pentadecaArginate: CompoundEntry = {
  id: 'pentadeca-arginate',
  names: {
    generic: 'Pentadeca-arginato',
    brands: [],
    aliases: ['PDA', 'pentadeca arginate', 'PDA (análogo de BPC-157)', 'BPC-157 arginato'],
  },
  category: 'repair',
  pharmClass: t(
    'Análogo / sal de BPC-157 (pentadecapéptido) comercializado como alternativa; composición exacta variable según proveedor',
    'BPC-157 analogue / salt (pentadecapeptide) marketed as an alternative; exact composition varies by supplier',
  ),
  summary: t(
    'Producto de aparición reciente que se presenta como una forma “más estable” de BPC-157 (secuencia de 15 aminoácidos con modificación o sal de arginina) y que empezó a comercializarse en farmacias magistrales y clínicas de bienestar tras la inclusión de BPC-157 en la categoría 2 de la FDA. La evidencia en humanos es prácticamente inexistente: no hay ensayos, ni farmacocinética, ni publicaciones revisadas por pares específicas; todo se extrapola de los datos animales de BPC-157.',
    'Recently emerged product presented as a “more stable” form of BPC-157 (15-amino-acid sequence with an arginine modification or salt) that began to be marketed by compounding pharmacies and wellness clinics after BPC-157 was placed in FDA Category 2. Human evidence is essentially absent: no trials, no pharmacokinetics, no specific peer-reviewed publications; everything is extrapolated from BPC-157 animal data.',
  ),
  mechanism: t(
    'Se asume idéntico al de BPC-157 (modulación del óxido nítrico, VEGFR2, FAK-paxilina), sin estudios propios que lo confirmen. La afirmación de mayor estabilidad o biodisponibilidad oral procede de material comercial, no de datos publicados.',
    'Assumed identical to BPC-157 (nitric-oxide modulation, VEGFR2, FAK-paxillin), with no dedicated studies confirming it. Claims of greater stability or oral bioavailability come from marketing material, not published data.',
  ),
  indications: [
    t(
      'Mismas que BPC-157 por extrapolación: tendón, músculo, intestino (sin estudios propios)',
      'Same as BPC-157 by extrapolation: tendon, muscle, gut (no dedicated studies)',
    ),
    t(
      'Uso comunitario / clínicas de bienestar: recuperación, dolor articular (sin ensayos)',
      'Community / wellness-clinic use: recovery, joint pain (no trials)',
    ),
  ],
  evidence: 'anecdotal',
  regulatory: {
    us: 'research_only',
    notes: t(
      `No aprobado. ${REPAIR_503A_NOTE_ES} El PDA se ha promocionado como sustancia distinta de BPC-157 para eludir esa restricción; su estatus regulatorio es incierto y es probable que la FDA lo considere equivalente o no apto para formulación magistral. Sin monografía farmacopeica ni estándar de identidad.`,
      `Not approved. ${REPAIR_503A_NOTE_EN} PDA has been promoted as a substance distinct from BPC-157 to sidestep that restriction; its regulatory status is uncertain and FDA may well regard it as equivalent or ineligible for compounding. No pharmacopoeial monograph or identity standard.`,
    ),
  },
  routes: ['sc', 'oral'],
  defaultUnit: 'mcg',
  dosing: {
    anecdotal: t(
      'Uso no aprobado — 250–500 µg SC 1–2×/día o cápsulas orales de 250–500 µg, calcados de BPC-157; ciclos de 4–8 semanas. Sin ningún dato que respalde estas dosis.',
      'Unapproved use — 250–500 µg SC 1–2×/day or 250–500 µg oral capsules, copied from BPC-157; 4–8-week cycles. No data support these doses.',
    ),
    frequency: t('1–2×/día', '1–2×/day'),
  },
  reconstitution: t(
    'Viales liofilizados habitualmente de 5 mg o 10 mg. 5 mg + 2 mL de agua bacteriostática = 2,5 mg/mL → 250 µg = 0,1 mL = 10 U en jeringa U-100; 500 µg = 20 U. Estabilidad tras reconstitución no documentada: por analogía, nevera 2–8 °C y uso en ≤ 3–4 semanas.',
    'Lyophilised vials usually 5 mg or 10 mg. 5 mg + 2 mL bacteriostatic water = 2.5 mg/mL → 250 µg = 0.1 mL = 10 U on a U-100 syringe; 500 µg = 20 U. Post-reconstitution stability undocumented: by analogy, refrigerate 2–8 °C and use within ≤ 3–4 weeks.',
  ),
  storage: t(
    'Liofilizado: nevera 2–8 °C protegido de la luz. Reconstituido: nevera, no congelar. Cápsulas: según etiqueta del proveedor.',
    'Lyophilised: refrigerate 2–8 °C, protect from light. Reconstituted: refrigerate, do not freeze. Capsules: per supplier label.',
  ),
  adverseEffects: {
    common: [
      t('Reacciones en el punto de inyección', 'Injection-site reactions'),
      t('Náuseas, cefalea (anecdótico)', 'Nausea, headache (anecdotal)'),
    ],
    serious: [
      t(
        'Perfil de seguridad completamente desconocido en humanos',
        'Safety profile completely unknown in humans',
      ),
      t(
        'Riesgo teórico proangiogénico / tumoral extrapolado de BPC-157',
        'Theoretical pro-angiogenic / tumour risk extrapolated from BPC-157',
      ),
      t(
        'Identidad, pureza y dosis real no verificables',
        'Identity, purity and actual dose unverifiable',
      ),
    ],
  },
  contraindications: [
    t('Neoplasia activa o antecedente reciente', 'Active or recent malignancy'),
    t('Embarazo y lactancia', 'Pregnancy and lactation'),
    t(
      'Deportistas sujetos a control antidopaje (probable inclusión como análogo de BPC-157, S0)',
      'Athletes subject to anti-doping control (likely covered as a BPC-157 analogue, S0)',
    ),
    t('Hipersensibilidad conocida', 'Known hypersensitivity'),
  ],
  interactions: [
    t('Sin estudios de interacciones', 'No interaction studies'),
    t(
      'Antiangiogénicos: efectos opuestos teóricos (por analogía con BPC-157)',
      'Anti-angiogenics: theoretical opposing effects (by analogy with BPC-157)',
    ),
  ],
  monitoring: [
    t('Evolución clínica (sin biomarcadores)', 'Clinical course (no biomarkers)'),
    t('Signos locales de infección', 'Local signs of infection'),
  ],
  keyTrials: [],
  references: [
    { label: 'FDA — 503A bulk drug substances Category 2 list (BPC-157, 2023–2024)' },
    {
      label:
        'Sin publicaciones revisadas por pares específicas de pentadeca-arginato a fecha de revisión; ver datos preclínicos de BPC-157',
    },
  ],
  tags: ['reparación', 'bpc-157', 'análogo', 'sin evidencia', 'magistral', 'investigación'],
  lastReviewed: '2026-09-19',
}

// ---------------------------------------------------------------------------
// IMMUNE
// ---------------------------------------------------------------------------

const thymosinAlpha1: CompoundEntry = {
  id: 'thymosin-alpha-1',
  names: {
    generic: 'Timosina alfa-1',
    brands: ['Zadaxin'],
    aliases: ['timalfasina', 'thymalfasin', 'Tα1', 'TA1', 'thymosin alpha-1'],
  },
  category: 'immune',
  pharmClass: t(
    'Péptido tímico sintético de 28 aminoácidos (N-acetilado); inmunomodulador',
    'Synthetic 28-amino-acid thymic peptide (N-acetylated); immunomodulator',
  ),
  summary: t(
    'Versión sintética de un péptido aislado de la fracción 5 del timo. Como timalfasina (Zadaxin, SciClone) está autorizada en decenas de países, sobre todo de Asia, Latinoamérica y Europa del Este, para hepatitis B crónica y como adyuvante inmunitario, pero no en EE. UU. ni en la UE. Evidencia de eficacia heterogénea; el gran ensayo en sepsis (TESTS) fue negativo.',
    'Synthetic version of a peptide isolated from thymosin fraction 5. As thymalfasin (Zadaxin, SciClone) it is authorised in dozens of countries, mainly in Asia, Latin America and Eastern Europe, for chronic hepatitis B and as an immune adjuvant, but not in the US or EU. Efficacy evidence is heterogeneous; the large sepsis trial (TESTS) was negative.',
  ),
  mechanism: t(
    'Agonista de receptores de tipo Toll (TLR2/TLR9) en células dendríticas y plasmocitoides: promueve la maduración de linfocitos T, la respuesta Th1 (IL-2, IFN-γ), la actividad NK y la expresión de MHC-I. Efecto inmunomodulador más que inmunoestimulante puro; no tiene actividad antiviral directa.',
    'Toll-like receptor (TLR2/TLR9) agonist on dendritic and plasmacytoid cells: promotes T-cell maturation, Th1 response (IL-2, IFN-γ), NK activity and MHC-I expression. Immunomodulatory rather than purely immunostimulatory; no direct antiviral activity.',
  ),
  indications: [
    t(
      'Hepatitis B crónica (aprobado fuera de EE. UU./UE)',
      'Chronic hepatitis B (approved outside US/EU)',
    ),
    t(
      'Hepatitis C crónica, en combinación con interferón (histórico)',
      'Chronic hepatitis C, combined with interferon (historical)',
    ),
    t(
      'Adyuvante de vacunas en inmunodeprimidos o no respondedores (autorizado en algunos países)',
      'Vaccine adjuvant in immunocompromised or non-responders (authorised in some countries)',
    ),
    t(
      'Sepsis (fase 3, negativo); coadyuvante en cáncer (hepatocarcinoma, melanoma, pulmón — fase 2–3, resultados mixtos)',
      'Sepsis (phase 3, negative); adjunct in cancer (hepatocellular, melanoma, lung — phase 2–3, mixed results)',
    ),
    t(
      'Uso comunitario: “refuerzo inmunitario”, infecciones víricas, COVID persistente (sin ensayos concluyentes)',
      'Community use: “immune boosting”, viral infections, long COVID (no conclusive trials)',
    ),
  ],
  evidence: 'phase3',
  regulatory: {
    us: 'research_only',
    notes: t(
      'Aprobada como Zadaxin en numerosos países (p. ej. China y otros de Asia, Latinoamérica), pero nunca por la FDA ni la EMA; tiene designaciones huérfanas en EE. UU. En EE. UU. circula como “research chemical” y, según las listas publicadas, también figuró entre los péptidos de la categoría 2 503A de la FDA hacia 2023–2024 (verificar).',
      'Approved as Zadaxin in many countries (e.g. China and elsewhere in Asia, Latin America), but never by FDA or EMA; holds US orphan designations. In the US it circulates as a “research chemical” and, according to the published lists, was also among the FDA 503A Category 2 peptides around 2023–2024 (verify).',
    ),
  },
  routes: ['sc'],
  defaultUnit: 'mg',
  pk: {
    halfLifeH: 2,
    molarMassGPerMol: 3108,
    source:
      'Ficha de Zadaxin (SciClone) y estudios de fase 1 en voluntarios sanos: t½ sérica ≈ 2 h tras SC',
    notes:
      'Concentración máxima ~1–2 h tras SC; vuelve al basal en ~24 h. El efecto inmunitario persiste más allá de la exposición plasmática.',
  },
  dosing: {
    labeled: t(
      'Zadaxin (ficha en países donde está aprobado; no EE. UU./UE): hepatitis B crónica 1,6 mg SC 2×/semana (con 3–4 días de separación) durante 6 meses; adyuvante vacunal 1,6 mg SC 2×/semana durante 4 semanas en torno a la vacunación.',
      'Zadaxin (label in countries where approved; not US/EU): chronic hepatitis B 1.6 mg SC twice weekly (3–4 days apart) for 6 months; vaccine adjuvant 1.6 mg SC twice weekly for 4 weeks around vaccination.',
    ),
    investigational: t(
      'Sepsis (TESTS): 1,6 mg SC cada 12 h durante 7 días. Oncología: 1,6–3,2 mg SC 2×/semana o diarios en protocolos combinados.',
      'Sepsis (TESTS): 1.6 mg SC every 12 h for 7 days. Oncology: 1.6–3.2 mg SC twice weekly or daily in combination protocols.',
    ),
    anecdotal: t(
      'Uso no aprobado — 1,5–1,6 mg SC 2×/semana durante 4–12 semanas (“refuerzo inmunitario”) o a diario durante 1–2 semanas en infecciones agudas. Rangos comunitarios basados en la ficha de Zadaxin.',
      'Unapproved use — 1.5–1.6 mg SC twice weekly for 4–12 weeks (“immune boosting”) or daily for 1–2 weeks in acute infections. Community ranges based on the Zadaxin label.',
    ),
    frequency: t('2×/semana', 'Twice weekly'),
  },
  reconstitution: t(
    'Zadaxin: vial liofilizado de 1,6 mg reconstituido con 1 mL del diluyente suministrado, administrar de inmediato. Viales de investigación de 5 y 10 mg: 10 mg + 2 mL de agua bacteriostática = 5 mg/mL → 1,6 mg = 0,32 mL = 32 U en jeringa U-100; 5 mg + 2 mL = 2,5 mg/mL → 1,6 mg = 64 U. Reconstituido (viales de investigación): nevera 2–8 °C, 2–4 semanas.',
    'Zadaxin: 1.6 mg lyophilised vial reconstituted with 1 mL of the supplied diluent, inject immediately. Research vials of 5 and 10 mg: 10 mg + 2 mL bacteriostatic water = 5 mg/mL → 1.6 mg = 0.32 mL = 32 U on a U-100 syringe; 5 mg + 2 mL = 2.5 mg/mL → 1.6 mg = 64 U. Reconstituted (research vials): refrigerate 2–8 °C, 2–4 weeks.',
  ),
  storage: t(
    'Zadaxin liofilizado: nevera 2–8 °C (consultar ficha local). Viales de investigación: nevera o −20 °C, protegidos de la luz. Reconstituido: nevera, no congelar.',
    'Zadaxin lyophilised: refrigerate 2–8 °C (see local label). Research vials: refrigerate or −20 °C, protect from light. Reconstituted: refrigerate, do not freeze.',
  ),
  adverseEffects: {
    common: [
      t(
        'Molestias locales en el punto de inyección (dolor, eritema)',
        'Local injection-site discomfort (pain, erythema)',
      ),
      t(
        'Elevación transitoria de ALT en hepatitis B (brote inmunitario)',
        'Transient ALT elevation in hepatitis B (immune flare)',
      ),
      t('Fatiga, cefalea leves', 'Mild fatigue, headache'),
    ],
    serious: [
      t(
        'Reactivación de enfermedad autoinmune (teórico, por estimulación Th1)',
        'Autoimmune disease flare (theoretical, from Th1 stimulation)',
      ),
      t(
        'Interferencia con inmunosupresión en trasplantados',
        'Interference with immunosuppression in transplant recipients',
      ),
      t('Hipersensibilidad (rara)', 'Hypersensitivity (rare)'),
    ],
  },
  contraindications: [
    t(
      'Receptores de trasplante con inmunosupresión (riesgo de rechazo)',
      'Transplant recipients on immunosuppression (rejection risk)',
    ),
    t('Hipersensibilidad a timalfasina', 'Hypersensitivity to thymalfasin'),
    t('Embarazo y lactancia (sin datos)', 'Pregnancy and lactation (no data)'),
    t('Enfermedad autoinmune activa (precaución)', 'Active autoimmune disease (caution)'),
  ],
  interactions: [
    t(
      'Inmunosupresores (tacrolimus, ciclosporina, corticoides a dosis altas): efecto opuesto',
      'Immunosuppressants (tacrolimus, ciclosporin, high-dose steroids): opposing effect',
    ),
    t(
      'Interferón-α: potenciación inmunitaria (combinación estudiada en hepatitis)',
      'Interferon-α: immune potentiation (combination studied in hepatitis)',
    ),
    t(
      'Inhibidores de puntos de control inmunitario: posible aumento de efectos inmunomediados (teórico)',
      'Immune checkpoint inhibitors: possible increase in immune-related effects (theoretical)',
    ),
  ],
  monitoring: [
    t(
      'Hepatitis B: ALT, ADN-VHB, HBeAg/anti-HBe cada 1–3 meses',
      'Hepatitis B: ALT, HBV DNA, HBeAg/anti-HBe every 1–3 months',
    ),
    t('Hemograma con recuento linfocitario', 'Full blood count with lymphocyte count'),
    t('Síntomas de autoinmunidad', 'Autoimmunity symptoms'),
  ],
  keyTrials: [
    {
      name: 'Chien (hepatitis B crónica)',
      year: 1998,
      finding: t(
        'Ensayo aleatorizado en Taiwán: 1,6 mg 2×/semana durante 6 meses aumentó la respuesta virológica diferida (pérdida de ADN-VHB y HBeAg) frente al control.',
        'Randomised trial in Taiwan: 1.6 mg twice weekly for 6 months increased delayed virological response (loss of HBV DNA and HBeAg) versus control.',
      ),
      ref: 'Hepatology 1998',
    },
    {
      name: 'TESTS (sepsis, fase 3)',
      year: 2025,
      finding: t(
        'Ensayo multicéntrico, doble ciego, en China (n ≈ 1.100): timosina α1 1,6 mg/12 h durante 7 días no redujo la mortalidad a 28 días frente a placebo.',
        'Multicentre double-blind trial in China (n ≈ 1,100): thymosin α1 1.6 mg every 12 h for 7 days did not reduce 28-day mortality versus placebo.',
      ),
      ref: 'BMJ 2025',
    },
  ],
  references: [
    { label: 'Zadaxin (thymalfasin) — ficha técnica SciClone (países donde está autorizado)' },
    {
      label:
        'Chien RN et al. Efficacy of thymosin α1 in patients with chronic hepatitis B: a randomized, controlled trial. Hepatology 1998',
    },
    {
      label:
        'Wu J et al. Efficacy and safety of thymosin α1 in sepsis (TESTS): multicentre, double-blinded, randomised, placebo-controlled trial. BMJ 2025',
    },
    {
      label:
        'Camerini R, Garaci E. Historical review of thymosin α1 in infectious diseases. Expert Opin Biol Ther 2015',
    },
  ],
  tags: ['inmunitario', 'timo', 'hepatitis b', 'tlr', 'aprobado fuera de ee. uu.', 'semanal'],
  lastReviewed: '2026-09-19',
}

const ll37: CompoundEntry = {
  id: 'll-37',
  names: {
    generic: 'LL-37',
    brands: [],
    aliases: [
      'catelicidina humana',
      'hCAP18 (134-170)',
      'CAMP',
      'ropocamptida',
      'cathelicidin LL-37',
    ],
  },
  category: 'immune',
  pharmClass: t(
    'Péptido antimicrobiano endógeno (única catelicidina humana, 37 aminoácidos); inmunomodulador',
    'Endogenous antimicrobial peptide (the only human cathelicidin, 37 amino acids); immunomodulator',
  ),
  summary: t(
    'Fragmento C-terminal activo de hCAP18, producido por neutrófilos y epitelios bajo inducción de la vitamina D. Tiene actividad bactericida, antibiopelícula, quimiotáctica y proangiogénica, pero también un papel patogénico en psoriasis, rosácea y lupus. Un ensayo pequeño de fase 2 en úlceras venosas tópicas fue positivo; el desarrollo posterior (Promore Pharma) no confirmó beneficio claro. El uso SC comunitario carece de datos.',
    'Active C-terminal fragment of hCAP18, produced by neutrophils and epithelia under vitamin D induction. It has bactericidal, anti-biofilm, chemotactic and pro-angiogenic activity, but also a pathogenic role in psoriasis, rosacea and lupus. A small phase 2 trial in topical venous ulcers was positive; later development (Promore Pharma) did not confirm clear benefit. Community SC use lacks data.',
  ),
  mechanism: t(
    'Péptido anfipático catiónico que desestabiliza membranas bacterianas y neutraliza LPS. Actúa además sobre FPR2, P2X7 y EGFR en células del huésped: quimiotaxis, angiogénesis y reepitelización. Los complejos LL-37-ADN/ARN propios activan TLR7/9 en células dendríticas plasmocitoides (interferón tipo I), mecanismo implicado en psoriasis y lupus. A concentraciones altas es citotóxico y hemolítico.',
    'Cationic amphipathic peptide that destabilises bacterial membranes and neutralises LPS. It also acts on FPR2, P2X7 and EGFR in host cells: chemotaxis, angiogenesis and re-epithelialisation. Complexes of LL-37 with self DNA/RNA activate TLR7/9 on plasmacytoid dendritic cells (type I interferon), a mechanism implicated in psoriasis and lupus. At high concentrations it is cytotoxic and haemolytic.',
  ),
  indications: [
    t('Úlceras venosas crónicas (tópico, fase 2)', 'Chronic venous leg ulcers (topical, phase 2)'),
    t(
      'Infecciones con biopelícula, heridas infectadas (preclínico)',
      'Biofilm infections, infected wounds (preclinical)',
    ),
    t(
      'Uso comunitario: infecciones crónicas, “SIBO”, Lyme, inmunidad (sin ensayos)',
      'Community use: chronic infections, “SIBO”, Lyme, immunity (no trials)',
    ),
  ],
  evidence: 'phase2',
  regulatory: {
    us: 'research_only',
    notes: t(
      'No aprobado. El desarrollo clínico tópico (ropocamptida) no ha llegado a autorización. Según las listas publicadas, LL-37 figuró entre los péptidos de la categoría 2 503A de la FDA hacia 2023–2024, junto a BPC-157, TB-500 o KPV, lo que restringe su formulación magistral.',
      'Not approved. Topical clinical development (ropocamptide) has not reached authorisation. According to the published lists, LL-37 was among the FDA 503A Category 2 peptides around 2023–2024, alongside BPC-157, TB-500 and KPV, restricting its compounding.',
    ),
  },
  routes: ['sc', 'topical'],
  defaultUnit: 'mcg',
  dosing: {
    investigational: t(
      'Úlceras venosas (Grönberg 2014): aplicación tópica sobre el lecho de la úlcera 2×/semana durante 4 semanas a concentraciones de 0,5–3,2 mg/mL; mejor cicatrización con las dosis bajas-intermedias.',
      'Venous ulcers (Grönberg 2014): topical application to the ulcer bed twice weekly for 4 weeks at 0.5–3.2 mg/mL; better healing at low-to-intermediate doses.',
    ),
    anecdotal: t(
      'Uso no aprobado — 50–125 µg SC 1×/día durante 2–6 semanas. Rangos comunitarios sin datos sistémicos en humanos; la ventana entre actividad y citotoxicidad no está definida.',
      'Unapproved use — 50–125 µg SC once daily for 2–6 weeks. Community ranges without human systemic data; the window between activity and cytotoxicity is undefined.',
    ),
    frequency: t(
      '1×/día (SC) · 2×/semana (tópico en ensayo)',
      'Once daily (SC) · twice weekly (topical in trial)',
    ),
  },
  reconstitution: t(
    'Viales liofilizados de 5 mg. 5 mg + 2 mL de agua bacteriostática = 2,5 mg/mL → 250 µg = 0,1 mL = 10 U en jeringa U-100; 100 µg = 4 U. 5 mg + 5 mL = 1 mg/mL → 100 µg = 10 U (más preciso para dosis bajas). Péptido catiónico con tendencia a adsorberse y agregarse: disolver con suavidad. Reconstituido: nevera 2–8 °C, ≤ 2–3 semanas.',
    'Lyophilised vials of 5 mg. 5 mg + 2 mL bacteriostatic water = 2.5 mg/mL → 250 µg = 0.1 mL = 10 U on a U-100 syringe; 100 µg = 4 U. 5 mg + 5 mL = 1 mg/mL → 100 µg = 10 U (more precise for low doses). Cationic peptide prone to adsorption and aggregation: dissolve gently. Reconstituted: refrigerate 2–8 °C, ≤ 2–3 weeks.',
  ),
  storage: t(
    'Liofilizado: −20 °C a largo plazo o nevera 2–8 °C, protegido de la luz. Reconstituido: nevera, no congelar.',
    'Lyophilised: −20 °C long term or refrigerate 2–8 °C, protect from light. Reconstituted: refrigerate, do not freeze.',
  ),
  adverseEffects: {
    common: [
      t(
        'Reacción inflamatoria local intensa (eritema, induración, dolor)',
        'Intense local inflammatory reaction (erythema, induration, pain)',
      ),
      t('Síntomas pseudogripales, fatiga (anecdótico)', 'Flu-like symptoms, fatigue (anecdotal)'),
      t('Tópico: dolor o prurito en la herida', 'Topical: wound pain or pruritus'),
    ],
    serious: [
      t(
        'Brote o inducción de psoriasis, rosácea o lupus (mecanismo TLR7/9-interferón)',
        'Flare or induction of psoriasis, rosacea or lupus (TLR7/9-interferon mechanism)',
      ),
      t(
        'Citotoxicidad y hemólisis a concentraciones altas',
        'Cytotoxicity and haemolysis at high concentrations',
      ),
      t(
        'Efecto ambivalente sobre tumores (promueve algunos: ovario, mama, pulmón; inhibe otros)',
        'Ambivalent tumour effect (promotes some: ovarian, breast, lung; inhibits others)',
      ),
      t('Seguridad sistémica en humanos desconocida', 'Human systemic safety unknown'),
    ],
  },
  contraindications: [
    t(
      'Psoriasis, rosácea, lupus u otra enfermedad autoinmune',
      'Psoriasis, rosacea, lupus or other autoimmune disease',
    ),
    t(
      'Neoplasia activa (sobre todo ovario, mama, pulmón)',
      'Active malignancy (especially ovarian, breast, lung)',
    ),
    t('Embarazo y lactancia', 'Pregnancy and lactation'),
    t('Hipersensibilidad conocida', 'Known hypersensitivity'),
  ],
  interactions: [
    t(
      'Vitamina D: induce la expresión endógena de catelicidina (efecto aditivo teórico)',
      'Vitamin D: induces endogenous cathelicidin expression (theoretical additive effect)',
    ),
    t(
      'Inmunosupresores y biológicos anti-IL-17/IL-23: efectos opuestos en psoriasis',
      'Immunosuppressants and anti-IL-17/IL-23 biologics: opposing effects in psoriasis',
    ),
    t(
      'Antibióticos: sinergia antibacteriana in vitro',
      'Antibiotics: in vitro antibacterial synergy',
    ),
  ],
  monitoring: [
    t(
      'Reacciones locales y cutáneas (brotes de psoriasis/rosácea)',
      'Local and skin reactions (psoriasis/rosacea flares)',
    ),
    t('Síntomas de autoinmunidad; ANA si aparecen', 'Autoimmunity symptoms; ANA if they appear'),
    t(
      'Hemograma si se usa por vía sistémica prolongada',
      'Full blood count with prolonged systemic use',
    ),
  ],
  keyTrials: [
    {
      name: 'Grönberg (úlceras venosas, fase 1/2)',
      year: 2014,
      finding: t(
        'Ensayo aleatorizado controlado con placebo en úlceras venosas de difícil cicatrización: LL-37 tópico fue seguro y mejoró la velocidad de cicatrización, sobre todo a concentraciones bajas-intermedias.',
        'Randomised placebo-controlled trial in hard-to-heal venous ulcers: topical LL-37 was safe and improved healing rate, mainly at low-to-intermediate concentrations.',
      ),
      ref: 'Wound Repair Regen 2014',
    },
  ],
  references: [
    {
      label:
        'Grönberg A et al. Treatment with LL-37 is safe and effective in enhancing healing of hard-to-heal venous leg ulcers: a randomized, placebo-controlled clinical trial. Wound Repair Regen 2014',
    },
    {
      label:
        'Lande R et al. Plasmacytoid dendritic cells sense self-DNA coupled with antimicrobial peptide. Nature 2007',
    },
    { label: 'FDA — 503A bulk drug substances Category 2 list (2023–2024)' },
  ],
  tags: [
    'inmunitario',
    'antimicrobiano',
    'catelicidina',
    'heridas',
    'autoinmunidad',
    'investigación',
  ],
  lastReviewed: '2026-09-19',
}

const thymalin: CompoundEntry = {
  id: 'thymalin',
  names: {
    generic: 'Timalina',
    brands: ['Тималин (Timalin, Rusia)'],
    aliases: ['thymalin', 'timalin', 'extracto polipeptídico tímico', 'biorregulador tímico'],
  },
  category: 'immune',
  pharmClass: t(
    'Complejo de polipéptidos extraídos del timo de ternera; “biorregulador” inmunomodulador (escuela rusa)',
    'Complex of polypeptides extracted from calf thymus; immunomodulatory “bioregulator” (Russian school)',
  ),
  summary: t(
    'Extracto polipeptídico tímico desarrollado en Leningrado (Morozov y Khavinson) en los años 70–80 y registrado como medicamento en Rusia y algunos países de la antigua URSS como inmunomodulador. Los datos clínicos proceden casi exclusivamente de ese grupo, con estudios en su mayoría no aleatorizados y de baja calidad metodológica, incluidas afirmaciones de reducción de mortalidad en ancianos que no se han replicado de forma independiente.',
    'Thymic polypeptide extract developed in Leningrad (Morozov and Khavinson) in the 1970s–80s and registered as a medicine in Russia and some former-USSR countries as an immunomodulator. Clinical data come almost exclusively from that group, mostly non-randomised and of low methodological quality, including claims of reduced mortality in the elderly that have not been independently replicated.',
  ),
  mechanism: t(
    'Mezcla no totalmente caracterizada de péptidos tímicos. Se le atribuye restauración de la diferenciación y la función de linfocitos T, normalización del cociente CD4/CD8 y estimulación de la fagocitosis. La hipótesis de los “biorreguladores” (péptidos cortos que regulan la expresión génica tisular) no está validada fuera de la escuela rusa. No debe confundirse con timógeno (Glu-Trp) ni con timosina α1, que son moléculas definidas.',
    'Not fully characterised mixture of thymic peptides. Credited with restoring T-cell differentiation and function, normalising the CD4/CD8 ratio and stimulating phagocytosis. The “bioregulator” hypothesis (short peptides regulating tissue gene expression) has not been validated outside the Russian school. Not to be confused with thymogen (Glu-Trp) or thymosin α1, which are defined molecules.',
  ),
  indications: [
    t(
      'Inmunodeficiencias secundarias, infecciones recurrentes o posquirúrgicas (ficha rusa)',
      'Secondary immunodeficiencies, recurrent or postoperative infections (Russian label)',
    ),
    t(
      'Coadyuvante tras quimio/radioterapia (ficha rusa)',
      'Adjunct after chemo/radiotherapy (Russian label)',
    ),
    t(
      '“Antienvejecimiento” en ancianos (estudios observacionales rusos)',
      '“Anti-ageing” in the elderly (Russian observational studies)',
    ),
    t(
      'Uso comunitario: ciclos de biorreguladores, longevidad (sin ensayos independientes)',
      'Community use: bioregulator cycles, longevity (no independent trials)',
    ),
  ],
  evidence: 'anecdotal',
  regulatory: {
    us: 'research_only',
    eu: 'research_only',
    notes: t(
      'Registrado como medicamento en Rusia (y otros países de la CEI), sin autorización en EE. UU. ni la UE. Se clasifica aquí como evidencia “anecdótica” porque, pese al registro nacional, no existen ensayos controlados independientes. Fuera de Rusia se vende como “research peptide” o en formulaciones de “biorregulador” de composición no verificable.',
      'Registered as a medicine in Russia (and other CIS countries), not authorised in the US or EU. Classified here as “anecdotal” evidence because, despite national registration, there are no independent controlled trials. Outside Russia it is sold as a “research peptide” or in “bioregulator” formulations of unverifiable composition.',
    ),
  },
  routes: ['im', 'sc'],
  defaultUnit: 'mg',
  dosing: {
    labeled: t(
      'Ficha rusa (Тималин): adultos 5–20 mg IM 1×/día durante 3–10 días (dosis total del ciclo habitual 30–100 mg); niños con dosis reducidas por edad. Ciclos repetibles a los 1–6 meses.',
      'Russian label (Тималин): adults 5–20 mg IM once daily for 3–10 days (usual total course 30–100 mg); children with age-reduced doses. Courses repeatable after 1–6 months.',
    ),
    anecdotal: t(
      'Uso no aprobado — 10 mg IM o SC 1×/día durante 10 días, 1–2 veces al año, a menudo junto a epitalón (“protocolo de biorreguladores”). Rangos comunitarios derivados de la ficha rusa.',
      'Unapproved use — 10 mg IM or SC once daily for 10 days, 1–2 times a year, often with epitalon (“bioregulator protocol”). Community ranges derived from the Russian label.',
    ),
    frequency: t('1×/día en ciclos de 5–10 días', 'Once daily in 5–10-day courses'),
  },
  reconstitution: t(
    'Viales liofilizados de 10 mg (ficha rusa: disolver en 1–2 mL de suero fisiológico e inyectar de inmediato por vía IM). Viales de investigación de 10–20 mg: 10 mg + 2 mL de agua bacteriostática = 5 mg/mL → 10 mg = 2 mL; 5 mg = 1 mL = 100 U en jeringa U-100 (o 1 mg = 20 U). Reconstituido (investigación): nevera 2–8 °C, uso en ≤ 2 semanas.',
    'Lyophilised 10 mg vials (Russian label: dissolve in 1–2 mL normal saline and inject IM immediately). Research vials of 10–20 mg: 10 mg + 2 mL bacteriostatic water = 5 mg/mL → 10 mg = 2 mL; 5 mg = 1 mL = 100 U on a U-100 syringe (or 1 mg = 20 U). Reconstituted (research): refrigerate 2–8 °C, use within ≤ 2 weeks.',
  ),
  storage: t(
    'Liofilizado: lugar seco y protegido de la luz; ficha rusa a temperatura ≤ 20 °C (confirmar). Reconstituido: uso inmediato (ficha) o nevera a corto plazo.',
    'Lyophilised: dry, protected from light; Russian label at ≤ 20 °C (confirm). Reconstituted: use immediately (label) or refrigerate short term.',
  ),
  adverseEffects: {
    common: [
      t(
        'Dolor y reacción local en el punto de inyección',
        'Pain and local reaction at the injection site',
      ),
      t(
        'Reacciones alérgicas leves (exantema, prurito)',
        'Mild allergic reactions (rash, pruritus)',
      ),
    ],
    serious: [
      t(
        'Hipersensibilidad a proteínas bovinas; anafilaxia (rara)',
        'Hypersensitivity to bovine proteins; anaphylaxis (rare)',
      ),
      t(
        'Riesgo teórico de transmisión de agentes de origen bovino (priones) según la calidad de la fuente',
        'Theoretical risk of bovine-origin agent (prion) transmission depending on source quality',
      ),
      t(
        'Composición y pureza no verificables en productos fuera del circuito farmacéutico ruso',
        'Unverifiable composition and purity in products outside the Russian pharmaceutical supply',
      ),
    ],
  },
  contraindications: [
    t(
      'Hipersensibilidad a timalina o proteínas bovinas',
      'Hypersensitivity to thymalin or bovine proteins',
    ),
    t('Embarazo y lactancia', 'Pregnancy and lactation'),
    t(
      'Enfermedad autoinmune activa y trasplante con inmunosupresión (precaución)',
      'Active autoimmune disease and transplant on immunosuppression (caution)',
    ),
  ],
  interactions: [
    t('Sin estudios formales de interacciones', 'No formal interaction studies'),
    t(
      'Inmunosupresores: efecto opuesto teórico',
      'Immunosuppressants: theoretical opposing effect',
    ),
  ],
  monitoring: [
    t(
      'Hemograma y subpoblaciones linfocitarias (CD4/CD8) si se usa como inmunomodulador',
      'Full blood count and lymphocyte subsets (CD4/CD8) if used as an immunomodulator',
    ),
    t('Reacciones alérgicas', 'Allergic reactions'),
  ],
  keyTrials: [],
  references: [
    { label: 'Тималин (Thymalin) — instrucción de uso, Registro Estatal de Medicamentos de Rusia' },
    {
      label:
        'Khavinson VKh, Morozov VG. Peptides of pineal gland and thymus prolong human life. Neuro Endocrinol Lett 2003 (estudio observacional; no replicado)',
    },
  ],
  tags: ['inmunitario', 'timo', 'biorregulador', 'rusia', 'longevidad', 'bovino'],
  lastReviewed: '2026-09-19',
}

export const GH_REPAIR_IMMUNE_2: CompoundEntry[] = [
  ghrp2,
  ghrp6,
  hexarelin,
  somatropin,
  igf1Lr3,
  mk677,
  bpc157,
  tb500,
  ghkCu,
  kpv,
  pentadecaArginate,
  thymosinAlpha1,
  ll37,
  thymalin,
]
