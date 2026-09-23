import { t, type CompoundEntry } from '../schema'

/**
 * Insulin analogues and human insulins.
 *
 * Dosing is described in general, label-level terms only (units/kg/day, basal-bolus
 * structure). Nothing here is a recommendation for an individual patient: insulin
 * dosing is always individualised against glucose data, renal function and hypoglycaemia risk.
 */

const INSULIN_STORAGE_STANDARD = t(
  'Viales/plumas sin abrir: nevera 2–8 °C hasta la fecha de caducidad. En uso: 28 días a temperatura ambiente (<30 °C). No congelar; desechar si se ha congelado o si el aspecto ha cambiado. Proteger de la luz y del calor directo.',
  'Unopened vials/pens: refrigerate 2–8 °C until the expiry date. In use: 28 days at room temperature (<30 °C). Do not freeze; discard if frozen or if the appearance changes. Protect from light and direct heat.',
)

const INSULIN_CONTRAINDICATIONS = [
  t(
    'Episodios de hipoglucemia (contraindicación durante el episodio)',
    'Episodes of hypoglycaemia (contraindicated during the episode)',
  ),
  t(
    'Hipersensibilidad a la insulina o a cualquier excipiente (metacresol, fenol, protamina, zinc)',
    'Hypersensitivity to the insulin or to any excipient (metacresol, phenol, protamine, zinc)',
  ),
]

const INSULIN_INTERACTIONS = [
  t(
    'Betabloqueantes no selectivos: enmascaran los síntomas adrenérgicos de hipoglucemia y pueden prolongarla',
    'Non-selective beta-blockers: mask the adrenergic warning symptoms of hypoglycaemia and may prolong it',
  ),
  t(
    'Tiazolidinedionas (pioglitazona): retención hídrica e insuficiencia cardiaca al combinarse con insulina',
    'Thiazolidinediones (pioglitazone): fluid retention and heart failure when combined with insulin',
  ),
  t(
    'Agonistas del receptor GLP-1 y pramlintida: suelen exigir reducción de la dosis de insulina (habitualmente ~20% del bolo) al iniciarlos',
    'GLP-1 receptor agonists and pramlintide: usually require an insulin dose reduction (commonly ~20% of prandial dose) at initiation',
  ),
  t(
    'Sulfonilureas, meglitinidas, inhibidores de SGLT2, IECA, salicilatos, fibratos, IMAO, octreótido: potencian el efecto hipoglucemiante',
    'Sulfonylureas, meglitinides, SGLT2 inhibitors, ACE inhibitors, salicylates, fibrates, MAOIs, octreotide: potentiate the glucose-lowering effect',
  ),
  t(
    'Corticoides, diuréticos tiazídicos, simpaticomiméticos, antipsicóticos atípicos, hormona tiroidea: reducen el efecto y exigen subir dosis',
    'Corticosteroids, thiazide diuretics, sympathomimetics, atypical antipsychotics, thyroid hormone: reduce the effect and require dose increases',
  ),
  t(
    'Alcohol: efecto impredecible, con riesgo de hipoglucemia tardía nocturna',
    'Alcohol: unpredictable effect, with risk of delayed nocturnal hypoglycaemia',
  ),
]

const INSULIN_MONITORING = [
  t(
    'Glucemia capilar o monitorización continua (tiempo en rango, tiempo por debajo de 70 mg/dL)',
    'Capillary glucose or continuous monitoring (time in range, time below 70 mg/dL)',
  ),
  t('HbA1c cada 3–6 meses', 'HbA1c every 3–6 months'),
  t(
    'Potasio sérico, sobre todo en tratamiento intensivo, cetoacidosis o uso de diuréticos',
    'Serum potassium, especially with intensive therapy, ketoacidosis or diuretic use',
  ),
  t('Peso corporal y composición corporal', 'Body weight and body composition'),
  t(
    'Inspección y rotación de los puntos de inyección (lipohipertrofia)',
    'Inspection and rotation of injection sites (lipohypertrophy)',
  ),
  t(
    'Función renal y hepática: su deterioro reduce las necesidades de insulina',
    'Renal and hepatic function: deterioration reduces insulin requirements',
  ),
]

const INSULIN_AE_COMMON = [
  t(
    'Hipoglucemia (el efecto adverso más frecuente y más limitante)',
    'Hypoglycaemia (the most frequent and most limiting adverse effect)',
  ),
  t('Ganancia de peso', 'Weight gain'),
  t(
    'Reacciones en el punto de inyección: eritema, prurito, dolor',
    'Injection-site reactions: erythema, pruritus, pain',
  ),
  t(
    'Lipodistrofia: lipohipertrofia o lipoatrofia por falta de rotación',
    'Lipodystrophy: lipohypertrophy or lipoatrophy from inadequate rotation',
  ),
  t(
    'Edema periférico y alteraciones refractivas transitorias al mejorar rápidamente el control',
    'Peripheral oedema and transient refractive changes on rapid improvement of control',
  ),
]

const INSULIN_AE_SERIOUS = [
  t(
    'Hipoglucemia grave con alteración de la consciencia, convulsiones o muerte',
    'Severe hypoglycaemia with impaired consciousness, seizures or death',
  ),
  t(
    'Hipopotasemia, que puede llegar a parálisis y arritmia ventricular',
    'Hypokalaemia, which may progress to paralysis and ventricular arrhythmia',
  ),
  t(
    'Reacciones de hipersensibilidad generalizada y anafilaxia (raras)',
    'Generalised hypersensitivity reactions and anaphylaxis (rare)',
  ),
  t(
    'Errores de medicación por confusión entre concentraciones (U-100 / U-200 / U-300 / U-500)',
    'Medication errors from confusion between concentrations (U-100 / U-200 / U-300 / U-500)',
  ),
]

const insulinReferences = (brand: string, url?: string) => [
  {
    label: `${brand} US Prescribing Information §12.3 (Clinical Pharmacology)`,
    ...(url ? { url } : {}),
  },
  { label: 'ADA Standards of Care in Diabetes — Pharmacologic Approaches to Glycemic Treatment' },
]

export const INSULINS: CompoundEntry[] = [
  {
    id: 'insulin-lispro',
    names: {
      generic: 'Insulina lispro',
      brands: ['Humalog', 'Admelog', 'Lyumjev', 'Insulin Lispro-aabc'],
      aliases: ['LysB28-ProB29', 'lispro'],
    },
    category: 'insulin',
    pharmClass: t('Análogo de insulina de acción rápida', 'Rapid-acting insulin analogue'),
    summary: t(
      'Primer análogo rápido comercializado: la inversión de los residuos B28-B29 impide la autoasociación en hexámeros y acelera la absorción subcutánea, permitiendo la inyección inmediatamente antes de la comida.',
      'The first marketed rapid-acting analogue: inversion of residues B28-B29 prevents hexamer self-association and speeds subcutaneous absorption, allowing injection immediately before the meal.',
    ),
    mechanism: t(
      'Se une al receptor de insulina, promueve la captación de glucosa en músculo y tejido adiposo, inhibe la gluconeogénesis y la glucogenólisis hepáticas, y suprime la lipólisis y la proteólisis. La formulación Lyumjev añade treprostinilo y citrato para acelerar aún más la absorción local.',
      'Binds the insulin receptor, promotes glucose uptake into muscle and adipose tissue, inhibits hepatic gluconeogenesis and glycogenolysis, and suppresses lipolysis and proteolysis. The Lyumjev formulation adds treprostinil and citrate to further accelerate local absorption.',
    ),
    indications: [
      t(
        'Mejora del control glucémico en diabetes tipo 1 y tipo 2 (cobertura prandial)',
        'Improving glycaemic control in type 1 and type 2 diabetes (prandial coverage)',
      ),
      t(
        'Uso en bombas de infusión subcutánea continua (ISCI)',
        'Use in continuous subcutaneous insulin infusion (CSII) pumps',
      ),
      t(
        'Hiperglucemia intrahospitalaria y cetoacidosis (vía IV, bajo protocolo)',
        'Inpatient hyperglycaemia and ketoacidosis (IV route, under protocol)',
      ),
    ],
    evidence: 'fda_approved',
    regulatory: { us: 'approved', eu: 'approved' },
    routes: ['sc', 'iv'],
    defaultUnit: 'units',
    pk: {
      halfLifeH: 1,
      tmaxH: 1,
      bioavailability: 0.6,
      source: 'Humalog US label §12.3: tmax ≈ 0.5–1.5 h tras dosis SC; t½ ≈ 1 h',
      notes:
        'La absorción SC es el paso limitante: el tmax y la duración dependen de la dosis, del punto de inyección (abdomen > brazo > muslo) y de la temperatura local. Lyumjev alcanza el pico antes.',
    },
    dosing: {
      labeled: t(
        'Individualizada. En pauta basal-bolo la necesidad diaria total suele situarse en 0,4–1,0 unidades/kg/día, de la que aproximadamente la mitad se administra como bolos prandiales repartidos entre las comidas, ajustados por ratio insulina/hidratos y factor de sensibilidad. Se inyecta 0–15 minutos antes de comer (Lyumjev al inicio de la comida o hasta 20 minutos después).',
        'Individualised. In a basal-bolus regimen total daily requirement is typically 0.4–1.0 units/kg/day, roughly half of which is given as prandial boluses split across meals, adjusted by carbohydrate ratio and correction factor. Injected 0–15 minutes before eating (Lyumjev at the start of the meal or up to 20 minutes after).',
      ),
      frequency: t(
        'Con cada comida principal (2–4×/día) o infusión continua',
        'With each main meal (2–4×/day) or continuous infusion',
      ),
    },
    storage: INSULIN_STORAGE_STANDARD,
    adverseEffects: { common: INSULIN_AE_COMMON, serious: INSULIN_AE_SERIOUS },
    contraindications: INSULIN_CONTRAINDICATIONS,
    interactions: INSULIN_INTERACTIONS,
    monitoring: INSULIN_MONITORING,
    keyTrials: [
      {
        name: 'DCCT',
        year: 1993,
        finding: t(
          'Estableció que el tratamiento intensivo con insulina reduce las complicaciones microvasculares en diabetes tipo 1, a costa de más hipoglucemia grave.',
          'Established that intensive insulin therapy reduces microvascular complications in type 1 diabetes, at the cost of more severe hypoglycaemia.',
        ),
        ref: 'NEJM 1993;329:977',
      },
    ],
    references: insulinReferences('Humalog'),
    tags: ['insulina', 'rapida', 'prandial', 'dm1', 'dm2', 'bomba'],
    lastReviewed: '2026-09-19',
  },

  {
    id: 'insulin-aspart',
    names: {
      generic: 'Insulina aspart',
      brands: ['NovoRapid', 'NovoLog', 'Fiasp', 'Insulin Aspart-szjj'],
      aliases: ['AspB28', 'aspart'],
    },
    category: 'insulin',
    pharmClass: t('Análogo de insulina de acción rápida', 'Rapid-acting insulin analogue'),
    summary: t(
      'Análogo rápido con prolina B28 sustituida por ácido aspártico, que reduce la autoasociación hexamérica. Fiasp añade niacinamida y L-arginina para un inicio de acción más precoz.',
      'Rapid-acting analogue with proline B28 replaced by aspartic acid, reducing hexameric self-association. Fiasp adds niacinamide and L-arginine for an earlier onset of action.',
    ),
    mechanism: t(
      'Agonista del receptor de insulina: estimula la translocación de GLUT4 y la captación periférica de glucosa, e inhibe la producción hepática de glucosa, la lipólisis y la cetogénesis.',
      'Insulin receptor agonist: stimulates GLUT4 translocation and peripheral glucose uptake, and inhibits hepatic glucose production, lipolysis and ketogenesis.',
    ),
    indications: [
      t(
        'Control glucémico prandial en diabetes tipo 1 y tipo 2',
        'Prandial glycaemic control in type 1 and type 2 diabetes',
      ),
      t(
        'Bombas de insulina y sistemas de asa cerrada híbrida',
        'Insulin pumps and hybrid closed-loop systems',
      ),
      t(
        'Administración intravenosa en el hospital bajo supervisión',
        'Intravenous administration in hospital under supervision',
      ),
    ],
    evidence: 'fda_approved',
    regulatory: { us: 'approved', eu: 'approved' },
    routes: ['sc', 'iv'],
    defaultUnit: 'units',
    pk: {
      halfLifeH: 1,
      tmaxH: 0.8,
      bioavailability: 0.65,
      source: 'NovoLog US label §12.3: tmax ≈ 40–90 min; t½ ≈ 1 h tras dosis SC',
      notes:
        'Fiasp adelanta el tmax unos 5 min y duplica la exposición en los primeros 30 minutos. En infusión IV la cinética es de bolo y el t½ baja a minutos.',
    },
    dosing: {
      labeled: t(
        'Individualizada; en general 0,4–1,0 unidades/kg/día de necesidad total en pauta basal-bolo, con la fracción prandial repartida entre las comidas. Aspart se inyecta 5–10 minutos antes de la comida; Fiasp al inicio de la comida o hasta 20 minutos después.',
        'Individualised; generally a total requirement of 0.4–1.0 units/kg/day in a basal-bolus regimen, with the prandial fraction split across meals. Aspart is injected 5–10 minutes before the meal; Fiasp at the start of the meal or up to 20 minutes after.',
      ),
      frequency: t(
        'Con cada comida principal o infusión continua',
        'With each main meal or continuous infusion',
      ),
    },
    storage: INSULIN_STORAGE_STANDARD,
    adverseEffects: { common: INSULIN_AE_COMMON, serious: INSULIN_AE_SERIOUS },
    contraindications: INSULIN_CONTRAINDICATIONS,
    interactions: INSULIN_INTERACTIONS,
    monitoring: INSULIN_MONITORING,
    keyTrials: [],
    references: insulinReferences('NovoLog'),
    tags: ['insulina', 'rapida', 'prandial', 'dm1', 'dm2', 'bomba'],
    lastReviewed: '2026-09-19',
  },

  {
    id: 'insulin-glulisine',
    names: {
      generic: 'Insulina glulisina',
      brands: ['Apidra'],
      aliases: ['LysB3-GluB29', 'glulisina'],
    },
    category: 'insulin',
    pharmClass: t('Análogo de insulina de acción rápida', 'Rapid-acting insulin analogue'),
    summary: t(
      'Análogo rápido con sustituciones LysB3 y GluB29 que no contiene zinc y se estabiliza con polisorbato 20, con un perfil clínicamente equivalente al de lispro y aspart.',
      'Rapid-acting analogue with LysB3 and GluB29 substitutions, zinc-free and stabilised with polysorbate 20, with a profile clinically equivalent to lispro and aspart.',
    ),
    mechanism: t(
      'Se une con alta afinidad al receptor de insulina y desencadena la captación de glucosa en músculo y grasa, suprimiendo simultáneamente la producción hepática de glucosa.',
      'Binds the insulin receptor with high affinity and triggers glucose uptake in muscle and fat while suppressing hepatic glucose production.',
    ),
    indications: [
      t(
        'Control glucémico prandial en diabetes tipo 1 y tipo 2 (adultos y niños ≥4 años)',
        'Prandial glycaemic control in type 1 and type 2 diabetes (adults and children ≥4 years)',
      ),
      t(
        'Uso en bomba de infusión subcutánea continua',
        'Use in continuous subcutaneous infusion pumps',
      ),
    ],
    evidence: 'fda_approved',
    regulatory: { us: 'approved', eu: 'approved' },
    routes: ['sc', 'iv'],
    defaultUnit: 'units',
    pk: {
      halfLifeH: 1,
      tmaxH: 0.9,
      bioavailability: 0.7,
      source: 'Apidra US label §12.3: tmax ≈ 55 min; t½ ≈ 42 min–1 h tras dosis SC',
      notes:
        'En sujetos con obesidad el inicio de acción se conserva mejor que con insulina regular. El t½ aparente refleja la absorción, no la eliminación.',
    },
    dosing: {
      labeled: t(
        'Individualizada, dentro de una necesidad total típica de 0,4–1,0 unidades/kg/día en pauta basal-bolo. Se administra en los 15 minutos previos o en los 20 minutos siguientes al inicio de la comida.',
        'Individualised, within a typical total requirement of 0.4–1.0 units/kg/day in a basal-bolus regimen. Given within 15 minutes before or 20 minutes after the start of the meal.',
      ),
      frequency: t('Con cada comida principal', 'With each main meal'),
    },
    storage: INSULIN_STORAGE_STANDARD,
    adverseEffects: { common: INSULIN_AE_COMMON, serious: INSULIN_AE_SERIOUS },
    contraindications: INSULIN_CONTRAINDICATIONS,
    interactions: INSULIN_INTERACTIONS,
    monitoring: INSULIN_MONITORING,
    keyTrials: [],
    references: insulinReferences('Apidra'),
    tags: ['insulina', 'rapida', 'prandial', 'dm1', 'dm2'],
    lastReviewed: '2026-09-19',
  },

  {
    id: 'insulin-regular',
    names: {
      generic: 'Insulina humana regular',
      brands: ['Humulin R', 'Novolin R', 'Humulin R U-500', 'Myxredlin'],
      aliases: ['insulina soluble', 'regular human insulin'],
    },
    category: 'insulin',
    pharmClass: t('Insulina humana de acción corta', 'Short-acting human insulin'),
    summary: t(
      'Insulina humana obtenida por ADN recombinante, idéntica a la endógena. Forma hexámeros de zinc que deben disociarse antes de absorberse, lo que retrasa su inicio respecto a los análogos rápidos. Es la insulina de elección por vía intravenosa.',
      'Recombinant human insulin, identical to the endogenous hormone. It forms zinc hexamers that must dissociate before absorption, delaying its onset compared with rapid analogues. It is the insulin of choice intravenously.',
    ),
    mechanism: t(
      'Activa el receptor de insulina y la vía PI3K/Akt: aumenta la captación de glucosa mediada por GLUT4, favorece la glucogenogénesis, inhibe la gluconeogénesis y la lipólisis y desplaza el potasio al espacio intracelular.',
      'Activates the insulin receptor and the PI3K/Akt pathway: increases GLUT4-mediated glucose uptake, promotes glycogenesis, inhibits gluconeogenesis and lipolysis, and shifts potassium intracellularly.',
    ),
    indications: [
      t(
        'Control glucémico en diabetes tipo 1 y tipo 2',
        'Glycaemic control in type 1 and type 2 diabetes',
      ),
      t(
        'Cetoacidosis diabética y estado hiperosmolar (infusión intravenosa)',
        'Diabetic ketoacidosis and hyperosmolar state (intravenous infusion)',
      ),
      t(
        'Hiperpotasemia (con glucosa) y prueba de tolerancia a la insulina',
        'Hyperkalaemia (with glucose) and insulin tolerance testing',
      ),
      t(
        'Resistencia grave a la insulina con necesidades muy altas (formulación U-500)',
        'Severe insulin resistance with very high requirements (U-500 formulation)',
      ),
    ],
    evidence: 'fda_approved',
    regulatory: {
      us: 'approved',
      eu: 'approved',
      notes: t(
        'Disponible sin receta en algunos estados de EE. UU., lo que no la hace segura sin supervisión clínica.',
        'Available without prescription in some US states, which does not make it safe without clinical supervision.',
      ),
    },
    routes: ['sc', 'iv', 'im'],
    defaultUnit: 'units',
    pk: {
      halfLifeH: 1.5,
      tmaxH: 3,
      bioavailability: 0.6,
      source: 'Humulin R US label §12.3: tmax ≈ 2–4 h tras dosis SC; t½ ≈ 1,5 h',
      notes:
        'Por vía intravenosa el t½ circulante es de solo 4–6 minutos. La formulación U-500 se comporta además como insulina intermedia, con duración de hasta 24 h.',
    },
    dosing: {
      labeled: t(
        'Individualizada. Por vía subcutánea se administra unos 30 minutos antes de la comida; la necesidad total en pauta basal-bolo suele estar en 0,4–1,0 unidades/kg/día. En cetoacidosis se usa en infusión IV continua a baja dosis según protocolo hospitalario.',
        'Individualised. Subcutaneously it is given about 30 minutes before the meal; total requirement in a basal-bolus regimen is typically 0.4–1.0 units/kg/day. In ketoacidosis it is used as a low-dose continuous IV infusion per hospital protocol.',
      ),
      frequency: t(
        '2–3×/día (SC) o infusión continua (IV)',
        '2–3×/day (SC) or continuous infusion (IV)',
      ),
    },
    storage: INSULIN_STORAGE_STANDARD,
    adverseEffects: { common: INSULIN_AE_COMMON, serious: INSULIN_AE_SERIOUS },
    contraindications: INSULIN_CONTRAINDICATIONS,
    interactions: INSULIN_INTERACTIONS,
    monitoring: INSULIN_MONITORING,
    keyTrials: [
      {
        name: 'UKPDS 33',
        year: 1998,
        finding: t(
          'El control intensivo con insulina o sulfonilurea redujo las complicaciones microvasculares en diabetes tipo 2 de reciente diagnóstico.',
          'Intensive control with insulin or sulfonylurea reduced microvascular complications in newly diagnosed type 2 diabetes.',
        ),
        ref: 'Lancet 1998;352:837',
      },
    ],
    references: insulinReferences('Humulin R'),
    tags: ['insulina', 'humana', 'corta', 'intravenosa', 'cetoacidosis'],
    lastReviewed: '2026-09-19',
  },

  {
    id: 'insulin-nph',
    names: {
      generic: 'Insulina NPH (isófana)',
      brands: ['Humulin N', 'Novolin N', 'Insulatard'],
      aliases: ['isophane insulin', 'NPH', 'protamina neutra Hagedorn'],
    },
    category: 'insulin',
    pharmClass: t('Insulina humana de acción intermedia', 'Intermediate-acting human insulin'),
    summary: t(
      'Suspensión cristalina de insulina humana con protamina y zinc que retrasa la disolución subcutánea y produce una acción intermedia con un pico marcado a las 4–10 horas.',
      'Crystalline suspension of human insulin with protamine and zinc that delays subcutaneous dissolution, producing intermediate action with a pronounced peak at 4–10 hours.',
    ),
    mechanism: t(
      'Tras la inyección, los cristales de insulina-protamina se disuelven lentamente y liberan insulina humana, que actúa sobre su receptor reduciendo la producción hepática de glucosa y aumentando la captación periférica.',
      'After injection, insulin-protamine crystals dissolve slowly and release human insulin, which acts on its receptor to reduce hepatic glucose production and increase peripheral uptake.',
    ),
    indications: [
      t(
        'Cobertura basal en diabetes tipo 1 y tipo 2',
        'Basal coverage in type 1 and type 2 diabetes',
      ),
      t(
        'Diabetes gestacional y diabetes pregestacional (amplia experiencia en embarazo)',
        'Gestational and pregestational diabetes (extensive experience in pregnancy)',
      ),
      t(
        'Hiperglucemia inducida por corticoides, por la coincidencia del pico con el efecto del corticoide matutino',
        'Corticosteroid-induced hyperglycaemia, given the overlap of its peak with morning steroid effect',
      ),
    ],
    evidence: 'fda_approved',
    regulatory: { us: 'approved', eu: 'approved' },
    routes: ['sc'],
    defaultUnit: 'units',
    pk: {
      halfLifeH: 5,
      tmaxH: 6,
      source: 'Humulin N US label §12.3: tmax ≈ 4–10 h; duración 14–24 h',
      notes:
        'Cinética de flip-flop: la disolución del cristal, no la eliminación, determina el perfil. La variabilidad intraindividual es alta (hasta ~30%) y obliga a resuspender la suspensión invirtiendo el vial o la pluma antes de cada dosis.',
    },
    dosing: {
      labeled: t(
        'Individualizada. Se usa 1–2 veces al día como componente basal; cuando se reparte, es habitual dar aproximadamente dos tercios por la mañana y un tercio por la noche. La necesidad basal representa en torno a la mitad de la dosis diaria total.',
        'Individualised. Used once or twice daily as the basal component; when split, roughly two thirds in the morning and one third at night is common. Basal requirement accounts for about half of the total daily dose.',
      ),
      frequency: t('1–2×/día', 'Once or twice daily'),
    },
    storage: INSULIN_STORAGE_STANDARD,
    adverseEffects: {
      common: [
        ...INSULIN_AE_COMMON,
        t(
          'Hipoglucemia nocturna por el pico a las 4–10 h',
          'Nocturnal hypoglycaemia due to the 4–10 h peak',
        ),
      ],
      serious: [
        ...INSULIN_AE_SERIOUS,
        t(
          'Reacciones alérgicas a la protamina, relevantes también si se precisa protamina para revertir heparina',
          'Allergic reactions to protamine, also relevant if protamine is needed to reverse heparin',
        ),
      ],
    },
    contraindications: INSULIN_CONTRAINDICATIONS,
    interactions: INSULIN_INTERACTIONS,
    monitoring: INSULIN_MONITORING,
    keyTrials: [
      {
        name: 'ORIGIN',
        year: 2012,
        finding: t(
          'En disglucemia y riesgo cardiovascular alto, la insulina basal (glargina) frente a atención estándar fue neutra en eventos cardiovasculares y en cáncer, con más hipoglucemia y ganancia de peso: referencia sobre la seguridad de la insulinización basal.',
          'In dysglycaemia with high cardiovascular risk, basal insulin (glargine) versus standard care was neutral for cardiovascular events and cancer, with more hypoglycaemia and weight gain: a reference point on the safety of basal insulinisation.',
        ),
        ref: 'NEJM 2012;367:319',
      },
    ],
    references: insulinReferences('Humulin N'),
    tags: ['insulina', 'humana', 'intermedia', 'basal', 'embarazo'],
    lastReviewed: '2026-09-19',
  },

  {
    id: 'insulin-glargine',
    names: {
      generic: 'Insulina glargina',
      brands: ['Lantus', 'Toujeo', 'Basaglar', 'Semglee', 'Rezvoglar'],
      aliases: ['GlyA21-diArgB31/32', 'glargina U-100', 'glargina U-300'],
    },
    category: 'insulin',
    pharmClass: t(
      'Análogo de insulina basal de acción prolongada',
      'Long-acting basal insulin analogue',
    ),
    summary: t(
      'Análogo basal cuyo punto isoeléctrico desplazado lo hace soluble a pH ácido en el vial y precipitar al inyectarse en el tejido subcutáneo neutro, formando un depósito de liberación lenta y prácticamente sin pico.',
      'Basal analogue whose shifted isoelectric point keeps it soluble at acidic pH in the vial and makes it precipitate on injection into neutral subcutaneous tissue, forming a slow-release depot with essentially no peak.',
    ),
    mechanism: t(
      'El microprecipitado libera lentamente glargina, que se metaboliza a los productos M1 y M2, responsables de la mayor parte de la actividad. Actúa sobre el receptor de insulina suprimiendo la producción hepática nocturna de glucosa.',
      'The microprecipitate slowly releases glargine, which is metabolised to the M1 and M2 products responsible for most of the activity. It acts on the insulin receptor, suppressing nocturnal hepatic glucose production.',
    ),
    indications: [
      t(
        'Control glucémico basal en diabetes tipo 1 y tipo 2',
        'Basal glycaemic control in type 1 and type 2 diabetes',
      ),
      t(
        'Insulinización basal añadida a antidiabéticos orales o a agonistas GLP-1',
        'Basal insulinisation added to oral agents or GLP-1 receptor agonists',
      ),
    ],
    evidence: 'fda_approved',
    regulatory: {
      us: 'approved',
      eu: 'approved',
      notes: t(
        'Existen biosimilares intercambiables (Semglee, Rezvoglar) y una presentación concentrada U-300 (Toujeo) con perfil aún más plano y prolongado.',
        'Interchangeable biosimilars exist (Semglee, Rezvoglar) plus a concentrated U-300 presentation (Toujeo) with an even flatter and longer profile.',
      ),
    },
    routes: ['sc'],
    defaultUnit: 'units',
    pk: {
      halfLifeH: 12,
      tmaxH: 6,
      source:
        'Lantus US label §12.3: duración hasta 24 h, sin pico pronunciado; t½ aparente ≈ 12 h',
      notes:
        'El depósito de microprecipitado produce un perfil plano: no existe un tmax verdadero. Se usa tmaxH = 6 solo como aproximación para que el motor genere una curva suave; la concentración real es casi constante entre las 4 y las 24 horas. Toujeo U-300 es todavía más plano y dura >24 h.',
    },
    dosing: {
      labeled: t(
        'Individualizada. Como insulina basal inicial en diabetes tipo 2 suele partirse de alrededor de 0,2 unidades/kg/día (o 10 unidades) y titularse según la glucemia en ayunas; en diabetes tipo 1 representa aproximadamente la mitad de la dosis diaria total. Se administra una vez al día a la misma hora (Toujeo requiere en general un 10–18% más de unidades que U-100).',
        'Individualised. As initial basal insulin in type 2 diabetes it is commonly started around 0.2 units/kg/day (or 10 units) and titrated to fasting glucose; in type 1 diabetes it accounts for roughly half of the total daily dose. Given once daily at the same time (Toujeo generally needs 10–18% more units than U-100).',
      ),
      frequency: t('1×/día', 'Once daily'),
    },
    storage: t(
      'Sin abrir: nevera 2–8 °C. En uso: 28 días a temperatura ambiente (<30 °C); las plumas en uso no deben volver a la nevera. Toujeo: 56 días en uso según ficha técnica estadounidense. No congelar ni diluir ni mezclar con otras insulinas.',
      'Unopened: refrigerate 2–8 °C. In use: 28 days at room temperature (<30 °C); pens in use should not be returned to the fridge. Toujeo: 56 days in use per the US label. Do not freeze, dilute or mix with other insulins.',
    ),
    adverseEffects: { common: INSULIN_AE_COMMON, serious: INSULIN_AE_SERIOUS },
    contraindications: INSULIN_CONTRAINDICATIONS,
    interactions: INSULIN_INTERACTIONS,
    monitoring: INSULIN_MONITORING,
    keyTrials: [
      {
        name: 'ORIGIN',
        year: 2012,
        finding: t(
          'Glargina frente a atención estándar en disglucemia con riesgo cardiovascular alto: neutralidad cardiovascular y oncológica tras una mediana de 6,2 años.',
          'Glargine versus standard care in dysglycaemia with high cardiovascular risk: cardiovascular and oncological neutrality over a median of 6.2 years.',
        ),
        ref: 'NEJM 2012;367:319',
      },
      {
        name: 'EDITION 1–3',
        year: 2014,
        finding: t(
          'Glargina U-300 logró un control comparable al de U-100 con menos hipoglucemia nocturna confirmada.',
          'Glargine U-300 achieved control comparable to U-100 with less confirmed nocturnal hypoglycaemia.',
        ),
        ref: 'Diabetes Care 2014',
      },
    ],
    references: insulinReferences('Lantus'),
    tags: ['insulina', 'basal', 'prolongada', 'dm1', 'dm2', 'biosimilar'],
    lastReviewed: '2026-09-19',
  },

  {
    id: 'insulin-detemir',
    names: {
      generic: 'Insulina detemir',
      brands: ['Levemir'],
      aliases: ['LysB29-tetradecanoil', 'detemir'],
    },
    category: 'insulin',
    pharmClass: t(
      'Análogo de insulina basal de acción prolongada',
      'Long-acting basal insulin analogue',
    ),
    summary: t(
      'Análogo basal acilado con ácido mirístico en LysB29, que se une de forma reversible a la albúmina en el tejido subcutáneo y en plasma, prolongando y aplanando su acción con menor variabilidad que NPH.',
      'Basal analogue acylated with myristic acid at LysB29, reversibly bound to albumin in subcutaneous tissue and plasma, prolonging and flattening its action with less variability than NPH.',
    ),
    mechanism: t(
      'La unión a albúmina (>98%) actúa como reservorio y amortigua los picos; la fracción libre activa el receptor de insulina. Su efecto relativamente más hepático se ha propuesto como explicación de la menor ganancia de peso observada.',
      'Albumin binding (>98%) acts as a reservoir and buffers peaks; the free fraction activates the insulin receptor. Its relatively more hepatic effect has been proposed to explain the lesser weight gain observed.',
    ),
    indications: [
      t(
        'Control glucémico basal en diabetes tipo 1 y tipo 2',
        'Basal glycaemic control in type 1 and type 2 diabetes',
      ),
      t(
        'Opción basal cuando interesa limitar la ganancia de peso',
        'Basal option when limiting weight gain is a priority',
      ),
    ],
    evidence: 'fda_approved',
    regulatory: {
      us: 'approved',
      eu: 'approved',
      notes: t(
        'Novo Nordisk ha ido discontinuando Levemir en varios mercados, incluida la retirada del mercado estadounidense anunciada para finales de 2024.',
        'Novo Nordisk has been discontinuing Levemir in several markets, including a US market withdrawal announced for the end of 2024.',
      ),
    },
    routes: ['sc'],
    defaultUnit: 'units',
    pk: {
      halfLifeH: 6,
      tmaxH: 7,
      source:
        'Levemir US label §12.3: t½ ≈ 5–7 h; tmax 6–8 h; duración dependiente de la dosis (hasta 24 h)',
      notes:
        'La duración depende de la dosis: a dosis bajas (0,2 unidades/kg) puede no cubrir 24 horas y requerir dos administraciones diarias.',
    },
    dosing: {
      labeled: t(
        'Individualizada, 1–2 veces al día. En diabetes tipo 2 sin insulina previa suele iniciarse en torno a 0,1–0,2 unidades/kg/día (o 10 unidades) y titularse por la glucemia en ayunas; en diabetes tipo 1 se administra con frecuencia en dos dosis por su duración dependiente de la dosis.',
        'Individualised, once or twice daily. In insulin-naive type 2 diabetes it is usually started around 0.1–0.2 units/kg/day (or 10 units) and titrated to fasting glucose; in type 1 diabetes it is frequently given twice daily because of its dose-dependent duration.',
      ),
      frequency: t('1–2×/día', 'Once or twice daily'),
    },
    storage: INSULIN_STORAGE_STANDARD,
    adverseEffects: { common: INSULIN_AE_COMMON, serious: INSULIN_AE_SERIOUS },
    contraindications: INSULIN_CONTRAINDICATIONS,
    interactions: INSULIN_INTERACTIONS,
    monitoring: INSULIN_MONITORING,
    keyTrials: [],
    references: insulinReferences('Levemir'),
    tags: ['insulina', 'basal', 'prolongada', 'albumina', 'peso'],
    lastReviewed: '2026-09-19',
  },

  {
    id: 'insulin-degludec',
    names: {
      generic: 'Insulina degludec',
      brands: ['Tresiba', 'Xultophy (con liraglutida)'],
      aliases: ['IDeg', 'degludec'],
    },
    category: 'insulin',
    pharmClass: t(
      'Análogo de insulina basal de acción ultraprolongada',
      'Ultra-long-acting basal insulin analogue',
    ),
    summary: t(
      'Análogo basal acilado con ácido hexadecanodioico que forma multihexámeros solubles en el tejido subcutáneo; su disociación lenta da una semivida de unas 25 horas y una duración superior a 42 horas, con un perfil muy plano y reproducible.',
      'Basal analogue acylated with hexadecanedioic acid that forms soluble multihexamers in subcutaneous tissue; slow dissociation gives a half-life of about 25 hours and a duration beyond 42 hours, with a very flat and reproducible profile.',
    ),
    mechanism: t(
      'Los multihexámeros se desensamblan gradualmente liberando monómeros que se unen a albúmina y activan el receptor de insulina de forma sostenida, reduciendo la variabilidad día a día en torno a cuatro veces respecto a glargina U-100.',
      'The multihexamers gradually disassemble, releasing monomers that bind albumin and activate the insulin receptor in a sustained manner, reducing day-to-day variability roughly fourfold versus glargine U-100.',
    ),
    indications: [
      t(
        'Control glucémico basal en diabetes tipo 1 y tipo 2 (adultos y niños ≥1 año)',
        'Basal glycaemic control in type 1 and type 2 diabetes (adults and children ≥1 year)',
      ),
      t(
        'Pacientes con horarios irregulares, por su ventana de administración flexible',
        'Patients with irregular schedules, thanks to its flexible dosing window',
      ),
    ],
    evidence: 'fda_approved',
    regulatory: { us: 'approved', eu: 'approved' },
    routes: ['sc'],
    defaultUnit: 'units',
    pk: {
      halfLifeH: 25,
      tmaxH: 9,
      source: 'Tresiba US label §12.3: t½ ≈ 25 h, estado estacionario en 3–4 días, duración >42 h',
      notes:
        'Estado estacionario a los 3–4 días de dosis diarias: los ajustes no deben hacerse antes de 3–4 días. El perfil es plano, de modo que el tmax es nominal.',
    },
    dosing: {
      labeled: t(
        'Individualizada, una vez al día a cualquier hora, dejando al menos 8 horas entre inyecciones. En diabetes tipo 2 sin insulina previa la ficha técnica plantea un inicio de 10 unidades al día; en diabetes tipo 1 la dosis basal supone aproximadamente entre un tercio y la mitad de la dosis diaria total. Titulación no más frecuente que cada 3–4 días.',
        'Individualised, once daily at any time of day, leaving at least 8 hours between injections. In insulin-naive type 2 diabetes the label describes starting at 10 units daily; in type 1 diabetes the basal dose accounts for roughly one third to one half of the total daily dose. Titrate no more often than every 3–4 days.',
      ),
      frequency: t('1×/día, con horario flexible', 'Once daily, flexible timing'),
    },
    storage: t(
      'Sin abrir: nevera 2–8 °C. En uso: 8 semanas a temperatura ambiente (<30 °C) o en nevera, a diferencia de los 28 días habituales del resto de insulinas. No congelar.',
      'Unopened: refrigerate 2–8 °C. In use: 8 weeks at room temperature (<30 °C) or refrigerated, unlike the usual 28 days of other insulins. Do not freeze.',
    ),
    adverseEffects: { common: INSULIN_AE_COMMON, serious: INSULIN_AE_SERIOUS },
    contraindications: INSULIN_CONTRAINDICATIONS,
    interactions: INSULIN_INTERACTIONS,
    monitoring: INSULIN_MONITORING,
    keyTrials: [
      {
        name: 'DEVOTE',
        year: 2017,
        finding: t(
          'Degludec fue no inferior a glargina U-100 en eventos cardiovasculares mayores en diabetes tipo 2 de alto riesgo, con un 40% menos de hipoglucemia grave.',
          'Degludec was non-inferior to glargine U-100 for major cardiovascular events in high-risk type 2 diabetes, with 40% less severe hypoglycaemia.',
        ),
        ref: 'NEJM 2017;377:723',
      },
      {
        name: 'SWITCH 1',
        year: 2017,
        finding: t(
          'En diabetes tipo 1, degludec redujo las hipoglucemias sintomáticas graves o confirmadas frente a glargina U-100 en diseño cruzado doble ciego.',
          'In type 1 diabetes, degludec reduced severe or confirmed symptomatic hypoglycaemia versus glargine U-100 in a double-blind crossover design.',
        ),
        ref: 'JAMA 2017;318:33',
      },
      {
        name: 'SWITCH 2',
        year: 2017,
        finding: t(
          'Mismo diseño en diabetes tipo 2: menos hipoglucemia global y nocturna con degludec a igualdad de HbA1c.',
          'Same design in type 2 diabetes: less overall and nocturnal hypoglycaemia with degludec at equivalent HbA1c.',
        ),
        ref: 'JAMA 2017;318:45',
      },
      {
        name: 'BEGIN',
        year: 2012,
        finding: t(
          'Programa de fase 3 que estableció el control no inferior de degludec frente a glargina con menor hipoglucemia nocturna en diabetes tipo 1 y tipo 2.',
          'Phase 3 programme that established non-inferior control of degludec versus glargine with less nocturnal hypoglycaemia in type 1 and type 2 diabetes.',
        ),
        ref: 'Lancet 2012',
      },
    ],
    references: insulinReferences('Tresiba'),
    tags: ['insulina', 'basal', 'ultraprolongada', 'hipoglucemia', 'flexible'],
    lastReviewed: '2026-09-19',
  },

  {
    id: 'insulin-icodec',
    names: {
      generic: 'Insulina icodec',
      brands: ['Awiqli'],
      aliases: ['NN1436', 'icodec', 'insulina semanal'],
    },
    category: 'insulin',
    pharmClass: t('Análogo de insulina basal semanal', 'Once-weekly basal insulin analogue'),
    summary: t(
      'Primer análogo basal de administración semanal: tres sustituciones de aminoácidos y una cadena de ácido graso C20 le confieren una unión fuerte y reversible a la albúmina y una semivida de unas 196 horas. Aprobada en la Unión Europea como Awiqli; la FDA emitió una carta de respuesta completa en 2024.',
      'The first once-weekly basal analogue: three amino-acid substitutions and a C20 fatty-acid chain give it strong reversible albumin binding and a half-life of about 196 hours. Approved in the European Union as Awiqli; the FDA issued a Complete Response Letter in 2024.',
    ),
    mechanism: t(
      'La unión a albúmina crea un reservorio circulante inactivo del que se libera lentamente insulina activa; la reducción de la afinidad por el receptor y la baja depuración mediada por receptor mantienen concentraciones estables durante toda la semana.',
      'Albumin binding creates an inactive circulating reservoir from which active insulin is slowly released; reduced receptor affinity and low receptor-mediated clearance maintain stable concentrations across the whole week.',
    ),
    indications: [
      t(
        'Diabetes mellitus tipo 2 (indicación principal en la Unión Europea)',
        'Type 2 diabetes mellitus (main indication in the European Union)',
      ),
      t(
        'Diabetes mellitus tipo 1 con precaución, por la mayor tasa de hipoglucemia observada en ONWARDS 6',
        'Type 1 diabetes mellitus with caution, given the higher hypoglycaemia rate seen in ONWARDS 6',
      ),
    ],
    evidence: 'phase3',
    regulatory: {
      us: 'investigational',
      eu: 'approved',
      notes: t(
        'Autorizada en la Unión Europea (Awiqli, 2024). En Estados Unidos la FDA emitió en 2024 una carta de respuesta completa (Complete Response Letter) solicitando información adicional sobre fabricación y sobre el uso en diabetes tipo 1, por lo que no está aprobada allí.',
        'Authorised in the European Union (Awiqli, 2024). In the United States the FDA issued a Complete Response Letter in 2024 requesting additional information on manufacturing and on use in type 1 diabetes, so it is not approved there.',
      ),
    },
    routes: ['sc'],
    defaultUnit: 'units',
    pk: {
      halfLifeH: 196,
      tmaxH: 16,
      source:
        'Awiqli EU SmPC sección 5.2: t½ ≈ 196 h; estado estacionario tras 3–4 semanas de dosificación semanal',
      notes:
        'Semivida de ~8 días: el estado estacionario tarda 3–4 semanas y cualquier hipoglucemia puede prolongarse durante días. Los ajustes de dosis deben espaciarse al menos una semana.',
    },
    dosing: {
      labeled: t(
        'Una inyección semanal, siempre el mismo día. En diabetes tipo 2 sin insulina previa la ficha técnica europea describe un inicio en torno a 70 unidades por semana, con titulación semanal según la glucemia en ayunas. Al cambiar desde insulina basal diaria se multiplica la dosis diaria por 7, y en determinadas situaciones se emplea una dosis inicial de carga.',
        'One weekly injection, always on the same day. In insulin-naive type 2 diabetes the EU label describes starting around 70 units per week, with weekly titration to fasting glucose. When switching from daily basal insulin the daily dose is multiplied by 7, and in certain situations a loading dose is used.',
      ),
      investigational: t(
        'En el programa ONWARDS se estudiaron pautas de cambio con una dosis de carga adicional del 50% en la primera semana para acelerar el estado estacionario.',
        'In the ONWARDS programme, switch regimens with an additional 50% loading dose in the first week were studied to reach steady state faster.',
      ),
      frequency: t('1×/semana', 'Once weekly'),
    },
    storage: t(
      'Sin abrir: nevera 2–8 °C hasta la caducidad. En uso, según ficha técnica: la pluma puede conservarse hasta 4 semanas por debajo de 30 °C o en nevera. No congelar; proteger de la luz.',
      'Unopened: refrigerate 2–8 °C until expiry. In use, per the label: the pen may be kept for up to 4 weeks below 30 °C or refrigerated. Do not freeze; protect from light.',
    ),
    adverseEffects: {
      common: INSULIN_AE_COMMON,
      serious: [
        ...INSULIN_AE_SERIOUS,
        t(
          'Hipoglucemia prolongada: por la semivida semanal, un episodio puede requerir vigilancia durante varios días',
          'Prolonged hypoglycaemia: with a weekly half-life, an episode may require monitoring for several days',
        ),
      ],
    },
    contraindications: INSULIN_CONTRAINDICATIONS,
    interactions: INSULIN_INTERACTIONS,
    monitoring: [
      ...INSULIN_MONITORING,
      t(
        'Vigilancia estrecha durante las 3–4 semanas que tarda en alcanzarse el estado estacionario y tras cada cambio de dosis',
        'Close monitoring during the 3–4 weeks needed to reach steady state and after every dose change',
      ),
    ],
    keyTrials: [
      {
        name: 'ONWARDS 1',
        year: 2023,
        finding: t(
          'En diabetes tipo 2 sin insulina previa, icodec semanal fue superior a glargina U-100 en reducción de HbA1c a 52 semanas.',
          'In insulin-naive type 2 diabetes, weekly icodec was superior to glargine U-100 in HbA1c reduction at 52 weeks.',
        ),
        ref: 'NEJM 2023;389:2203',
      },
      {
        name: 'ONWARDS 2',
        year: 2023,
        finding: t(
          'Cambio desde insulina basal diaria en diabetes tipo 2: icodec no inferior a degludec, con más hipoglucemia leve.',
          'Switch from daily basal insulin in type 2 diabetes: icodec non-inferior to degludec, with more mild hypoglycaemia.',
        ),
        ref: 'Lancet 2023',
      },
      {
        name: 'ONWARDS 3',
        year: 2023,
        finding: t(
          'Icodec no inferior a degludec en diabetes tipo 2 sin insulina previa sin titulación asistida por aplicación.',
          'Icodec non-inferior to degludec in insulin-naive type 2 diabetes without app-assisted titration.',
        ),
        ref: 'JAMA 2023;330:228',
      },
      {
        name: 'ONWARDS 4',
        year: 2023,
        finding: t(
          'En pauta basal-bolo, icodec fue no inferior a glargina U-100 en diabetes tipo 2.',
          'Within a basal-bolus regimen, icodec was non-inferior to glargine U-100 in type 2 diabetes.',
        ),
        ref: 'Lancet 2023',
      },
      {
        name: 'ONWARDS 5',
        year: 2023,
        finding: t(
          'Estudio pragmático en atención real: icodec con titulación asistida logró mejor HbA1c que la insulina basal analógica habitual.',
          'Pragmatic real-world study: icodec with assisted titration achieved better HbA1c than usual analogue basal insulin.',
        ),
        ref: 'Ann Intern Med 2023',
      },
      {
        name: 'ONWARDS 6',
        year: 2023,
        finding: t(
          'En diabetes tipo 1, icodec fue no inferior en HbA1c pero con una tasa significativamente mayor de hipoglucemia de nivel 2 y 3.',
          'In type 1 diabetes, icodec was non-inferior for HbA1c but with a significantly higher rate of level 2 and 3 hypoglycaemia.',
        ),
        ref: 'Lancet 2023',
      },
    ],
    references: [
      { label: 'Awiqli EU Summary of Product Characteristics (EMA)' },
      {
        label:
          'FDA Complete Response Letter to Novo Nordisk on insulin icodec (2024), company announcement',
      },
      { label: 'ONWARDS clinical trial programme publications' },
    ],
    tags: ['insulina', 'basal', 'semanal', 'dm2', 'investigacional-eeuu'],
    lastReviewed: '2026-09-19',
  },

  {
    id: 'insulin-efsitora',
    names: {
      generic: 'Insulina efsitora alfa',
      brands: [],
      aliases: ['LY3209590', 'basal insulin Fc', 'BIF', 'efsitora'],
    },
    category: 'insulin',
    pharmClass: t(
      'Análogo de insulina basal semanal (proteína de fusión Fc)',
      'Once-weekly basal insulin analogue (Fc fusion protein)',
    ),
    summary: t(
      'Insulina basal semanal en desarrollo: un análogo de insulina de afinidad reducida fusionado a un fragmento Fc de IgG2 humana, lo que le da una semivida de unos 17 días y un perfil prácticamente plano. Evaluada en el programa QWINT.',
      'Once-weekly basal insulin in development: a reduced-affinity insulin analogue fused to a human IgG2 Fc fragment, giving a half-life of about 17 days and an essentially flat profile. Evaluated in the QWINT programme.',
    ),
    mechanism: t(
      'La fusión Fc permite el reciclaje mediado por el receptor FcRn y reduce el aclaramiento; la menor afinidad por el receptor de insulina limita la depuración mediada por diana. El resultado es una exposición estable con una relación pico/valle muy baja.',
      'The Fc fusion enables FcRn receptor-mediated recycling and reduces clearance; lower insulin receptor affinity limits target-mediated clearance. The result is stable exposure with a very low peak-to-trough ratio.',
    ),
    indications: [
      t(
        'Diabetes mellitus tipo 2 (indicación principal investigada)',
        'Type 2 diabetes mellitus (main indication under investigation)',
      ),
      t(
        'Diabetes mellitus tipo 1 en combinación con insulina prandial (QWINT-5)',
        'Type 1 diabetes mellitus combined with prandial insulin (QWINT-5)',
      ),
    ],
    evidence: 'phase3',
    regulatory: {
      us: 'investigational',
      eu: 'investigational',
      notes: t(
        'No aprobada. El programa de fase 3 QWINT (QWINT-1 a QWINT-5) completó sus resultados principales en 2024–2025 y ha sustentado las solicitudes regulatorias.',
        'Not approved. The QWINT phase 3 programme (QWINT-1 through QWINT-5) completed its primary results in 2024–2025 and has supported regulatory submissions.',
      ),
    },
    routes: ['sc'],
    defaultUnit: 'units',
    pk: {
      halfLifeH: 408,
      source:
        'Publicaciones de fase 1–2 del programa de desarrollo: t½ ≈ 17 días (≈408 h), estado estacionario en 3–4 semanas',
      notes:
        'Perfil casi plano, sin tmax significativo, por lo que se modela como bolo. Con una semivida de 17 días el estado estacionario tarda semanas y cualquier ajuste tiene un efecto muy diferido; las consecuencias de una sobredosificación pueden prolongarse.',
    },
    dosing: {
      labeled: t(
        'Sin dosificación aprobada. La posología definitiva dependerá de la ficha técnica si se autoriza.',
        'No approved dosing. Final posology will depend on the label if it is authorised.',
      ),
      investigational: t(
        'En el programa QWINT se administró una inyección subcutánea semanal, con algoritmos de titulación semanal de dosis fija según la glucemia en ayunas y, en varios estudios, una dosis de carga inicial al cambiar desde insulina basal diaria.',
        'In the QWINT programme it was given as one weekly subcutaneous injection, with weekly fixed-dose titration algorithms based on fasting glucose and, in several studies, an initial loading dose when switching from daily basal insulin.',
      ),
      frequency: t('1×/semana', 'Once weekly'),
    },
    storage: t(
      'Producto en investigación: conservación en nevera 2–8 °C según el protocolo del ensayo. Las condiciones definitivas en uso se establecerán en la ficha técnica si se aprueba.',
      'Investigational product: refrigerated storage 2–8 °C per the trial protocol. Definitive in-use conditions will be set in the label if approved.',
    ),
    adverseEffects: {
      common: INSULIN_AE_COMMON,
      serious: [
        ...INSULIN_AE_SERIOUS,
        t(
          'Hipoglucemia de resolución muy lenta por la semivida de ~17 días',
          'Very slowly resolving hypoglycaemia because of the ~17-day half-life',
        ),
      ],
    },
    contraindications: INSULIN_CONTRAINDICATIONS,
    interactions: INSULIN_INTERACTIONS,
    monitoring: [
      ...INSULIN_MONITORING,
      t(
        'Monitorización continua de glucosa recomendable durante las semanas de aproximación al estado estacionario',
        'Continuous glucose monitoring advisable during the weeks approaching steady state',
      ),
    ],
    keyTrials: [
      {
        name: 'QWINT-1',
        year: 2025,
        finding: t(
          'Diabetes tipo 2 sin insulina previa: efsitora semanal con algoritmo de dosis fija fue no inferior a glargina en HbA1c.',
          'Insulin-naive type 2 diabetes: weekly efsitora with a fixed-dose algorithm was non-inferior to glargine for HbA1c.',
        ),
        ref: 'NEJM 2025',
      },
      {
        name: 'QWINT-2',
        year: 2024,
        finding: t(
          'Diabetes tipo 2 sin insulina previa: efsitora no inferior a degludec a 52 semanas.',
          'Insulin-naive type 2 diabetes: efsitora non-inferior to degludec at 52 weeks.',
        ),
        ref: 'NEJM 2024',
      },
      {
        name: 'QWINT-3',
        year: 2024,
        finding: t(
          'Diabetes tipo 2 previamente tratada con insulina basal: efsitora no inferior a degludec.',
          'Type 2 diabetes previously treated with basal insulin: efsitora non-inferior to degludec.',
        ),
      },
      {
        name: 'QWINT-4',
        year: 2024,
        finding: t(
          'Diabetes tipo 2 en pauta basal-bolo: efsitora no inferior a glargina U-100.',
          'Type 2 diabetes on a basal-bolus regimen: efsitora non-inferior to glargine U-100.',
        ),
      },
      {
        name: 'QWINT-5',
        year: 2024,
        finding: t(
          'Diabetes tipo 1: efsitora no inferior a degludec en HbA1c, con mayor tasa de hipoglucemia observada.',
          'Type 1 diabetes: efsitora non-inferior to degludec for HbA1c, with a higher observed hypoglycaemia rate.',
        ),
        ref: 'Lancet 2024',
      },
    ],
    references: [
      { label: 'QWINT phase 3 programme publications (insulin efsitora alfa)' },
      { label: 'Phase 1–2 pharmacokinetic reports of basal insulin Fc (LY3209590)' },
    ],
    tags: ['insulina', 'basal', 'semanal', 'investigacional', 'fc'],
    lastReviewed: '2026-09-19',
  },
]
