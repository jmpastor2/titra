import { t, type CompoundDetail } from '../schema'

/**
 * Premixed blend vials. They get a wiki page so the user can read what is in the vial,
 * but they are kept out of COMPOUNDS: protocols and inventory store the components
 * (see src/features/inventory/blendPresets.ts), never the blend id.
 *
 * Editorial rules: no blend has been studied as a combination in humans, so evidence is
 * the weakest component's tier (enforced in content.test.ts); maths assume a U-100
 * insulin syringe (1 U = 0.01 mL); in-use stability is labelled as guidance, not data.
 */

const IN_USE_ES =
  'Una vez reconstituido, habitualmente se indica usarlo en 28–30 días guardado en nevera (2–8 °C). Es orientación de fabricantes y de la comunidad: no hay datos de estabilidad publicados para la mezcla. El límite de 28 días viene de la norma USP <797> para viales multidosis abiertos, que se refiere a la esterilidad y no a la potencia del péptido.'
const IN_USE_EN =
  'Once reconstituted, the usual guidance is to use it within 28–30 days kept in the fridge (2–8 °C). This is manufacturer and community guidance: there are no published stability data for the mixture. The 28-day limit comes from USP <797> for opened multiple-dose vials, which concerns sterility, not peptide potency.'

const NO_TRIALS_ES =
  'Ningún ensayo en humanos ha estudiado esta combinación. Lo que se sabe de cada componente viene de estudios por separado; la mezcla en un mismo vial no se ha evaluado ni en eficacia, ni en seguridad, ni en estabilidad.'
const NO_TRIALS_EN =
  'No human trial has studied this combination. What is known about each component comes from separate studies; mixing them in one vial has not been evaluated for efficacy, safety or stability.'

const cjcIpamorelin: CompoundDetail = {
  id: 'blend-cjc-ipamorelin',
  names: {
    generic: 'CJC-1295 + Ipamorelina (blend)',
    brands: [],
    aliases: [
      'CJC/Ipa',
      'CJC + IPA',
      'CJC-1295/Ipamorelin',
      'CJC-1295 no DAC + Ipamorelin',
      'Mod GRF 1-29 + Ipamorelina',
      'CJC-Ipamorelin 10 mg',
    ],
  },
  category: 'gh_axis',
  pharmClass: t(
    'Blend premezclado 1:1: análogo de GHRH de acción corta + secretagogo de GH (GHRP)',
    'Premixed 1:1 blend: short-acting GHRH analogue + GH secretagogue (GHRP)',
  ),
  summary: t(
    'Vial liofilizado con CJC-1295 sin DAC (Mod GRF 1-29) e ipamorelina a partes iguales, normalmente 5 + 5 mg. Cada dosis lleva la misma cantidad de ambos, así que se inyectan juntos en un solo pinchazo. Es la combinación de secretagogos de GH más vendida, pero nunca se ha probado como tal en humanos.',
    'Lyophilised vial with DAC-free CJC-1295 (Mod GRF 1-29) and ipamorelin in equal parts, usually 5 + 5 mg. Every dose carries the same amount of both, so they are injected together in one shot. It is the best-selling GH-secretagogue combination, but it has never been tested as such in humans.',
  ),
  mechanism: t(
    'Dos vías distintas hacia el mismo pulso de GH. El CJC-1295 sin DAC activa el receptor de GHRH de la hipófisis; la ipamorelina activa el receptor de ghrelina (GHS-R1a) y baja el tono de somatostatina. Con GHRH y GHRP juntos el pico de GH es mayor que la suma de cada uno por separado. Esa sinergia está descrita para las dos clases en general, no para esta pareja concreta en ensayos. Ambos son de acción corta: el pulso dura unas 2–3 h y sigue frenado por la somatostatina, el IGF-1 y la comida.',
    'Two separate routes to the same GH pulse. DAC-free CJC-1295 activates the pituitary GHRH receptor; ipamorelin activates the ghrelin receptor (GHS-R1a) and lowers somatostatin tone. With GHRH and GHRP together the GH peak is larger than the sum of each alone. That synergy is described for the two classes in general, not for this specific pair in trials. Both are short-acting: the pulse lasts about 2–3 h and is still restrained by somatostatin, IGF-1 and food.',
  ),
  indications: [
    t(
      'Uso comunitario: composición corporal, recuperación y sueño (sin ensayos)',
      'Community use: body composition, recovery and sleep (no trials)',
    ),
    t(
      'Comodidad: un solo vial y un solo pinchazo en lugar de dos',
      'Convenience: one vial and one shot instead of two',
    ),
  ],
  evidence: 'anecdotal',
  regulatory: {
    us: 'research_only',
    notes: t(
      `Ningún componente está aprobado. Se vende como producto de investigación, con contenido y pureza no garantizados; la proporción real del vial no se puede comprobar en casa. Ambos componentes están prohibidos por la AMA (S2). ${NO_TRIALS_ES}`,
      `Neither component is approved. Sold as a research chemical, with unguaranteed content and purity; the real ratio in the vial cannot be checked at home. Both components are WADA prohibited (S2). ${NO_TRIALS_EN}`,
    ),
  },
  routes: ['sc'],
  defaultUnit: 'mcg',
  dosing: {
    anecdotal: t(
      'Uso no aprobado — lo más citado es 100 µg de cada componente por dosis, 1–2×/día, a menudo una al acostarse. En ayunas: al menos 2 h después de comer y esperar unos 30 min antes de volver a comer, porque la comida (sobre todo hidratos y grasa) reduce el pico de GH. Al ir 1:1 no se puede subir la ipamorelina sin subir también el CJC.',
      'Unapproved use — the most quoted dose is 100 µg of each component per dose, 1–2×/day, often one at bedtime. Fasted: at least 2 h after eating and wait about 30 min before eating again, because food (above all carbohydrate and fat) blunts the GH peak. Being 1:1, ipamorelin cannot be raised without raising CJC too.',
    ),
    frequency: t('1–2×/día (uso no aprobado)', '1–2×/day (unapproved use)'),
  },
  reconstitution: t(
    'Vial de 5 + 5 mg. Con 3 mL de agua bacteriostática: 1,67 mg/mL de cada uno, 1 U = 16,7 µg de cada uno → 6 U = 100 µg de CJC-1295 + 100 µg de ipamorelina. Con 2 mL: 2,5 mg/mL de cada uno → 4 U = 100 µg de cada uno. Con 3 mL el vial da unas 50 dosis de 100 + 100 µg. Añadir el agua por la pared del vial y disolver girando, sin agitar.',
    '5 + 5 mg vial. With 3 mL bacteriostatic water: 1.67 mg/mL of each, 1 U = 16.7 µg of each → 6 U = 100 µg CJC-1295 + 100 µg ipamorelin. With 2 mL: 2.5 mg/mL of each → 4 U = 100 µg of each. With 3 mL the vial gives about 50 doses of 100 + 100 µg. Run the water down the vial wall and dissolve by swirling, do not shake.',
  ),
  storage: t(
    `Liofilizado: nevera 2–8 °C, protegido de la luz; −20 °C para guardarlo meses. Reconstituido: nevera, no congelar. ${IN_USE_ES} El CJC-1295 sin DAC parece poco estable en solución: desechar si se enturbia.`,
    `Lyophilised: fridge 2–8 °C, protected from light; −20 °C to keep it for months. Reconstituted: fridge, do not freeze. ${IN_USE_EN} DAC-free CJC-1295 seems poorly stable in solution: discard if it turns cloudy.`,
  ),
  adverseEffects: {
    common: [
      t(
        'Rubor y calor en la cara durante unos minutos tras inyectar',
        'Facial flushing and warmth for a few minutes after injecting',
      ),
      t(
        'Reacciones en el punto de inyección, cefalea, mareo pasajero',
        'Injection-site reactions, headache, passing dizziness',
      ),
      t(
        'Retención de líquidos, hormigueo en manos, somnolencia',
        'Fluid retention, tingling in the hands, drowsiness',
      ),
      t('Algo más de hambre', 'Somewhat more hunger'),
    ],
    serious: [
      t(
        'Subida de glucosa y resistencia a la insulina con uso continuado',
        'Raised glucose and insulin resistance with continued use',
      ),
      t(
        'Crecimiento de tumores ocultos mediado por IGF-1 (teórico)',
        'IGF-1-mediated growth of occult tumours (theoretical)',
      ),
      t(
        'Si hay una reacción, no se puede saber qué componente la causa',
        'If a reaction occurs, there is no way to tell which component caused it',
      ),
      t(
        'Producto de investigación: contenido, contaminación o endotoxinas no controlados',
        'Research chemical: uncontrolled content, contamination or endotoxin',
      ),
    ],
  },
  contraindications: [
    t('Cáncer activo o reciente', 'Active or recent cancer'),
    t('Embarazo y lactancia', 'Pregnancy and breastfeeding'),
    t(
      'Diabetes mal controlada o retinopatía diabética proliferativa',
      'Poorly controlled diabetes or proliferative diabetic retinopathy',
    ),
    t('Deportistas con control antidopaje', 'Athletes under anti-doping control'),
  ],
  interactions: [
    t('Comida cerca de la dosis: reduce el pico de GH', 'Food near the dose: blunts the GH peak'),
    t(
      'Glucocorticoides y análogos de somatostatina: reducen el efecto',
      'Glucocorticoids and somatostatin analogues: reduce the effect',
    ),
    t(
      'Insulina y antidiabéticos: la GH sube la glucosa; vigilarla',
      'Insulin and antidiabetics: GH raises glucose; monitor it',
    ),
  ],
  monitoring: [
    t('IGF-1 antes de empezar y a las 4–8 semanas', 'IGF-1 before starting and at 4–8 weeks'),
    t('Glucosa en ayunas y HbA1c', 'Fasting glucose and HbA1c'),
    t(
      'Peso, edemas, tensión arterial y hormigueo en manos',
      'Weight, oedema, blood pressure and tingling in the hands',
    ),
  ],
  keyTrials: [],
  references: [
    {
      label:
        'Raun K et al. Ipamorelin, the first selective growth hormone secretagogue. Eur J Endocrinol 1998',
    },
    {
      label:
        'Jetté L et al. hGRF1-29-albumin bioconjugates … identification of CJC-1295 as a long-lasting GRF analog. Endocrinology 2005 (preclínico; origen de la familia CJC)',
    },
    { label: 'USP <797> — beyond-use date of opened multiple-dose containers (28 days)' },
  ],
  tags: ['blend', 'mezcla', 'premezclado', 'ghrh', 'ghrp', 'gh', 'cjc-1295', 'ipamorelina'],
  lastReviewed: '2026-09-30',
  blend: {
    components: [
      { compoundId: 'mod-grf-1-29', mg: 5 },
      { compoundId: 'ipamorelin', mg: 5 },
    ],
    rationale: t(
      'Se combinan porque actúan sobre receptores distintos (GHRH y ghrelina) y juntos dan un pulso de GH mayor que por separado. Además, al ir en el mismo vial se inyectan a la vez y con un solo pinchazo. La proporción 1:1 es una convención comercial, no una dosis estudiada.',
      'They are combined because they act on different receptors (GHRH and ghrelin) and together give a larger GH pulse than either alone. Being in the same vial, they are also injected at once with a single shot. The 1:1 ratio is a commercial convention, not a studied dose.',
    ),
    presetId: 'cjc-ipa-10',
    exampleDiluentMl: 3,
  },
}

const KLOW_GLOW_REG_ES =
  'Ningún componente está aprobado para uso inyectable. La FDA incluyó BPC-157, los fragmentos de timosina β4, el GHK-Cu inyectable y el KPV en la categoría 2 de sustancias a granel 503A, lo que impide su formulación magistral legal en EE. UU. BPC-157 (S0) y TB-500 (S2) están prohibidos por la AMA. Se venden como productos de investigación; el nombre comercial no garantiza ni la composición ni la proporción.'
const KLOW_GLOW_REG_EN =
  'No component is approved for injection. FDA placed BPC-157, thymosin β4 fragments, injectable GHK-Cu and KPV in 503A bulk-substance Category 2, which bars lawful compounding in the US. BPC-157 (S0) and TB-500 (S2) are WADA prohibited. Sold as research chemicals; the trade name guarantees neither the composition nor the ratio.'

const repairAdverse: CompoundDetail['adverseEffects'] = {
  common: [
    t(
      'Escozor o dolor al inyectar, sobre todo por el GHK-Cu (la solución es azul)',
      'Stinging or pain on injection, mainly from GHK-Cu (the solution is blue)',
    ),
    t('Enrojecimiento o bulto en el punto de inyección', 'Redness or a lump at the injection site'),
    t(
      'Náuseas, cefalea, cansancio o rubor (descripciones anecdóticas)',
      'Nausea, headache, tiredness or flushing (anecdotal reports)',
    ),
  ],
  serious: [
    t(
      'Varios componentes favorecen la formación de vasos (angiogénesis): posible estímulo de tumores ocultos (teórico, no estudiado)',
      'Several components promote vessel growth (angiogenesis): possible stimulation of occult tumours (theoretical, unstudied)',
    ),
    t(
      'Sobrecarga de cobre con uso prolongado (teórico)',
      'Copper overload with prolonged use (theoretical)',
    ),
    t(
      'Si hay una reacción, no se puede saber qué componente la causa',
      'If a reaction occurs, there is no way to tell which component caused it',
    ),
    t(
      'Producto de investigación: contenido, contaminación o endotoxinas no controlados',
      'Research chemical: uncontrolled content, contamination or endotoxin',
    ),
  ],
}

const repairContra = [
  t('Cáncer activo o reciente', 'Active or recent cancer'),
  t(
    'Enfermedad de Wilson u otros trastornos del cobre; hepatopatía colestásica',
    'Wilson disease or other copper disorders; cholestatic liver disease',
  ),
  t('Embarazo y lactancia', 'Pregnancy and breastfeeding'),
  t('Deportistas con control antidopaje', 'Athletes under anti-doping control'),
]

const repairMonitoring = [
  t(
    'Evolución de la lesión o de la piel (no hay marcadores validados)',
    'Course of the injury or the skin (no validated markers)',
  ),
  t(
    'Reacciones locales y signos de infección en el punto de inyección',
    'Local reactions and signs of infection at the injection site',
  ),
  t(
    'Uso prolongado: cobre en sangre, ceruloplasmina y perfil hepático',
    'Prolonged use: blood copper, ceruloplasmin and liver tests',
  ),
  t(
    'Cribado de cáncer adecuado a la edad antes de un uso largo',
    'Age-appropriate cancer screening before long use',
  ),
]

const repairReferences = [
  {
    label:
      'Pickart L, Margolina A. Regenerative and protective actions of the GHK-Cu peptide in the light of the new gene data. Int J Mol Sci 2018',
  },
  {
    label:
      'Sikirić P et al. — revisiones del grupo de Zagreb sobre BPC-157 (Curr Pharm Des y otras, 2011–2023)',
  },
  {
    label:
      'Goldstein AL et al. Thymosin β4: a multi-functional regenerative peptide. Expert Opin Biol Ther 2012',
  },
  { label: 'USP <797> — beyond-use date of opened multiple-dose containers (28 days)' },
]

const klow: CompoundDetail = {
  id: 'blend-klow',
  names: {
    generic: 'KLOW',
    brands: [],
    aliases: ['KLOW 80', 'KLOW 80 mg', 'KLOW blend', 'GHK-Cu + BPC-157 + TB-500 + KPV'],
  },
  category: 'repair',
  pharmClass: t(
    'Blend premezclado de cuatro péptidos de reparación: GHK-Cu + BPC-157 + TB-500 + KPV',
    'Premixed blend of four repair peptides: GHK-Cu + BPC-157 + TB-500 + KPV',
  ),
  summary: t(
    'Vial de 80 mg que suele llevar GHK-Cu 50 mg, BPC-157 10 mg, TB-500 10 mg y KPV 10 mg. Es GLOW con KPV añadido. Se vende para piel, tejidos y recuperación de lesiones. Los cuatro componentes solo tienen datos en animales o in vitro, y la mezcla nunca se ha estudiado.',
    '80 mg vial that usually holds GHK-Cu 50 mg, BPC-157 10 mg, TB-500 10 mg and KPV 10 mg. It is GLOW with KPV added. Marketed for skin, tissue and injury recovery. All four components have only animal or in vitro data, and the mixture has never been studied.',
  ),
  mechanism: t(
    'Cada componente aporta un mecanismo distinto, descrito por separado en animales: GHK-Cu lleva cobre a las células y estimula colágeno y elastina; BPC-157 favorece la formación de vasos y la reparación de tendón y mucosa; TB-500 (fragmento de timosina β4) regula la actina y la migración celular; KPV (fragmento de la α-MSH) frena la inflamación a través de NF-κB. Que juntos se complementen es una hipótesis comercial, no un resultado.',
    'Each component brings a different mechanism, described separately in animals: GHK-Cu delivers copper to cells and stimulates collagen and elastin; BPC-157 promotes vessel formation and tendon and mucosal repair; TB-500 (thymosin β4 fragment) regulates actin and cell migration; KPV (α-MSH fragment) dampens inflammation via NF-κB. That they complement each other is a marketing hypothesis, not a finding.',
  ),
  indications: [
    t(
      'Uso comunitario: lesiones musculotendinosas, cicatrización, piel (sin ensayos)',
      'Community use: musculotendinous injuries, healing, skin (no trials)',
    ),
    t(
      'Uso comunitario: inflamación intestinal o cutánea, por el KPV (sin ensayos)',
      'Community use: gut or skin inflammation, because of KPV (no trials)',
    ),
  ],
  evidence: 'preclinical',
  regulatory: {
    us: 'research_only',
    notes: t(`${KLOW_GLOW_REG_ES} ${NO_TRIALS_ES}`, `${KLOW_GLOW_REG_EN} ${NO_TRIALS_EN}`),
  },
  routes: ['sc'],
  defaultUnit: 'mg',
  dosing: {
    anecdotal: t(
      'Uso no aprobado — la dosis se suele fijar por el BPC-157 (unos 250–500 µg al día) y el resto viene arrastrado por la proporción. Con 3 mL, 10 U al día dan 333 µg de BPC-157, TB-500 y KPV y 1,67 mg de GHK-Cu, en ciclos de 4–8 semanas. Ojo: así el TB-500 queda en dosis diarias bajas, distinto de su pauta habitual por separado (2 mg 2×/semana).',
      'Unapproved use — the dose is usually set by BPC-157 (about 250–500 µg a day) and the rest follows the ratio. With 3 mL, 10 U a day give 333 µg of BPC-157, TB-500 and KPV and 1.67 mg GHK-Cu, in 4–8-week cycles. Note: TB-500 then ends up in low daily doses, unlike its usual standalone schedule (2 mg twice weekly).',
    ),
    frequency: t('1×/día (uso no aprobado)', 'Once daily (unapproved use)'),
  },
  reconstitution: t(
    'Vial de 80 mg (GHK-Cu 50 + BPC-157 10 + TB-500 10 + KPV 10). Con 3 mL de agua bacteriostática: GHK-Cu 16,7 mg/mL y 3,33 mg/mL de cada uno de los otros tres. 10 U (0,1 mL) = GHK-Cu 1,67 mg + BPC-157 333 µg + TB-500 333 µg + KPV 333 µg; 15 U = 2,5 mg + 500 µg de cada uno. Con 2 mL: 10 U = GHK-Cu 2,5 mg + 500 µg de cada uno. Más agua diluye el cobre y suele escocer menos. La solución es azul; desechar si cambia de color o aparecen partículas.',
    '80 mg vial (GHK-Cu 50 + BPC-157 10 + TB-500 10 + KPV 10). With 3 mL bacteriostatic water: GHK-Cu 16.7 mg/mL and 3.33 mg/mL of each of the other three. 10 U (0.1 mL) = GHK-Cu 1.67 mg + BPC-157 333 µg + TB-500 333 µg + KPV 333 µg; 15 U = 2.5 mg + 500 µg of each. With 2 mL: 10 U = GHK-Cu 2.5 mg + 500 µg of each. More water dilutes the copper and usually stings less. The solution is blue; discard if it changes colour or particles appear.',
  ),
  storage: t(
    `Liofilizado: nevera 2–8 °C, protegido de la luz; −20 °C para guardarlo meses. Reconstituido: nevera, protegido de la luz, no congelar. ${IN_USE_ES} Tampoco se sabe si el cobre del GHK-Cu afecta en solución a los otros péptidos.`,
    `Lyophilised: fridge 2–8 °C, protected from light; −20 °C to keep it for months. Reconstituted: fridge, protected from light, do not freeze. ${IN_USE_EN} Nor is it known whether the copper in GHK-Cu affects the other peptides in solution.`,
  ),
  adverseEffects: repairAdverse,
  contraindications: [
    ...repairContra,
    t(
      'Infección activa no controlada (KPV modula la respuesta inmunitaria)',
      'Uncontrolled active infection (KPV modulates the immune response)',
    ),
  ],
  interactions: [
    t('Sin estudios de interacciones en humanos', 'No human interaction studies'),
    t(
      'Suplementos de cobre o zinc; quelantes como penicilamina o trientina',
      'Copper or zinc supplements; chelators such as penicillamine or trientine',
    ),
    t(
      'Antiangiogénicos e inmunosupresores: efectos opuestos o aditivos teóricos',
      'Anti-angiogenics and immunosuppressants: theoretical opposing or additive effects',
    ),
  ],
  monitoring: repairMonitoring,
  keyTrials: [],
  references: [
    ...repairReferences,
    {
      label:
        'Dalmasso G et al. PepT1-mediated tripeptide KPV uptake reduces intestinal inflammation. Gastroenterology 2008',
    },
  ],
  tags: ['blend', 'mezcla', 'premezclado', 'reparación', 'cobre', 'piel', 'bpc-157', 'tb-500'],
  lastReviewed: '2026-09-30',
  blend: {
    components: [
      { compoundId: 'ghk-cu', mg: 50 },
      { compoundId: 'bpc-157', mg: 10 },
      { compoundId: 'tb-500', mg: 10 },
      { compoundId: 'kpv', mg: 10 },
    ],
    rationale: t(
      'Se combinan para cubrir en un solo pinchazo cuatro mecanismos descritos por separado en animales: colágeno y piel (GHK-Cu), vasos y tendón (BPC-157), migración celular (TB-500) e inflamación (KPV). La proporción fija 5:1:1:1 es una elección del vendedor. No se ha demostrado que los efectos se sumen ni que la mezcla sea segura.',
      'They are combined to cover, in one shot, four mechanisms described separately in animals: collagen and skin (GHK-Cu), vessels and tendon (BPC-157), cell migration (TB-500) and inflammation (KPV). The fixed 5:1:1:1 ratio is a vendor choice. It has not been shown that the effects add up or that the mixture is safe.',
    ),
    presetId: 'klow-80',
    exampleDiluentMl: 3,
  },
}

const glow: CompoundDetail = {
  id: 'blend-glow',
  names: {
    generic: 'GLOW',
    brands: [],
    aliases: ['GLOW 70', 'GLOW 70 mg', 'GLOW blend', 'GHK-Cu + BPC-157 + TB-500'],
  },
  category: 'repair',
  pharmClass: t(
    'Blend premezclado de tres péptidos de reparación: GHK-Cu + BPC-157 + TB-500',
    'Premixed blend of three repair peptides: GHK-Cu + BPC-157 + TB-500',
  ),
  summary: t(
    'Vial de 70 mg que suele llevar GHK-Cu 50 mg, BPC-157 10 mg y TB-500 10 mg. Es KLOW sin KPV. Se vende sobre todo para piel y reparación de tejidos. Los tres componentes solo tienen datos en animales o in vitro, y la mezcla nunca se ha estudiado.',
    '70 mg vial that usually holds GHK-Cu 50 mg, BPC-157 10 mg and TB-500 10 mg. It is KLOW without KPV. Marketed mainly for skin and tissue repair. All three components have only animal or in vitro data, and the mixture has never been studied.',
  ),
  mechanism: t(
    'GHK-Cu lleva cobre a las células y estimula colágeno y elastina; BPC-157 favorece la formación de vasos y la reparación de tendón y mucosa; TB-500 (fragmento de timosina β4) regula la actina y la migración celular. Cada mecanismo está descrito por separado en animales; que se complementen es una hipótesis, no un resultado.',
    'GHK-Cu delivers copper to cells and stimulates collagen and elastin; BPC-157 promotes vessel formation and tendon and mucosal repair; TB-500 (thymosin β4 fragment) regulates actin and cell migration. Each mechanism is described separately in animals; that they complement each other is a hypothesis, not a finding.',
  ),
  indications: [
    t(
      'Uso comunitario: piel, cicatrización, lesiones musculotendinosas (sin ensayos)',
      'Community use: skin, healing, musculotendinous injuries (no trials)',
    ),
  ],
  evidence: 'preclinical',
  regulatory: {
    us: 'research_only',
    notes: t(`${KLOW_GLOW_REG_ES} ${NO_TRIALS_ES}`, `${KLOW_GLOW_REG_EN} ${NO_TRIALS_EN}`),
  },
  routes: ['sc'],
  defaultUnit: 'mg',
  dosing: {
    anecdotal: t(
      'Uso no aprobado — igual que KLOW, la dosis se suele fijar por el BPC-157 (unos 250–500 µg al día). Con 3 mL, 10 U al día dan 1,67 mg de GHK-Cu y 333 µg de BPC-157 y de TB-500, en ciclos de 4–8 semanas.',
      'Unapproved use — as with KLOW, the dose is usually set by BPC-157 (about 250–500 µg a day). With 3 mL, 10 U a day give 1.67 mg GHK-Cu and 333 µg each of BPC-157 and TB-500, in 4–8-week cycles.',
    ),
    frequency: t('1×/día (uso no aprobado)', 'Once daily (unapproved use)'),
  },
  reconstitution: t(
    'Vial de 70 mg (GHK-Cu 50 + BPC-157 10 + TB-500 10). Con 3 mL de agua bacteriostática: GHK-Cu 16,7 mg/mL, BPC-157 y TB-500 3,33 mg/mL. 10 U (0,1 mL) = GHK-Cu 1,67 mg + BPC-157 333 µg + TB-500 333 µg. Con 2 mL: 10 U = GHK-Cu 2,5 mg + 500 µg de cada uno. La solución es azul; desechar si cambia de color o aparecen partículas.',
    '70 mg vial (GHK-Cu 50 + BPC-157 10 + TB-500 10). With 3 mL bacteriostatic water: GHK-Cu 16.7 mg/mL, BPC-157 and TB-500 3.33 mg/mL. 10 U (0.1 mL) = GHK-Cu 1.67 mg + BPC-157 333 µg + TB-500 333 µg. With 2 mL: 10 U = GHK-Cu 2.5 mg + 500 µg of each. The solution is blue; discard if it changes colour or particles appear.',
  ),
  storage: t(
    `Liofilizado: nevera 2–8 °C, protegido de la luz; −20 °C para guardarlo meses. Reconstituido: nevera, protegido de la luz, no congelar. ${IN_USE_ES} Tampoco se sabe si el cobre del GHK-Cu afecta en solución a los otros péptidos.`,
    `Lyophilised: fridge 2–8 °C, protected from light; −20 °C to keep it for months. Reconstituted: fridge, protected from light, do not freeze. ${IN_USE_EN} Nor is it known whether the copper in GHK-Cu affects the other peptides in solution.`,
  ),
  adverseEffects: repairAdverse,
  contraindications: repairContra,
  interactions: [
    t('Sin estudios de interacciones en humanos', 'No human interaction studies'),
    t(
      'Suplementos de cobre o zinc; quelantes como penicilamina o trientina',
      'Copper or zinc supplements; chelators such as penicillamine or trientine',
    ),
    t(
      'Antiangiogénicos: efectos opuestos teóricos',
      'Anti-angiogenics: theoretical opposing effects',
    ),
  ],
  monitoring: repairMonitoring,
  keyTrials: [],
  references: repairReferences,
  tags: ['blend', 'mezcla', 'premezclado', 'reparación', 'cobre', 'piel', 'bpc-157', 'tb-500'],
  lastReviewed: '2026-09-30',
  blend: {
    components: [
      { compoundId: 'ghk-cu', mg: 50 },
      { compoundId: 'bpc-157', mg: 10 },
      { compoundId: 'tb-500', mg: 10 },
    ],
    rationale: t(
      'Se combinan para cubrir en un solo pinchazo tres mecanismos descritos por separado en animales: colágeno y piel (GHK-Cu), vasos y tendón (BPC-157) y migración celular (TB-500). La proporción fija 5:1:1 es una elección del vendedor. No se ha demostrado que los efectos se sumen ni que la mezcla sea segura.',
      'They are combined to cover, in one shot, three mechanisms described separately in animals: collagen and skin (GHK-Cu), vessels and tendon (BPC-157) and cell migration (TB-500). The fixed 5:1:1 ratio is a vendor choice. It has not been shown that the effects add up or that the mixture is safe.',
    ),
    presetId: 'glow-70',
    exampleDiluentMl: 3,
  },
}

export const BLENDS: CompoundDetail[] = [cjcIpamorelin, klow, glow]
