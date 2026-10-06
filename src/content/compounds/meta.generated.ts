// GENERATED FILE: do not edit by hand.
// The light half of the compound catalog: the fields every screen reads synchronously, projected
// from the full entries in this folder by toMeta.ts. Regenerate it with `npm run content:meta`
// after changing an entry (the test in meta.test.ts fails while this file is stale).
import type { CompoundMeta } from '../schema'

export const SUBSTANCE_META: readonly CompoundMeta[] = [
  {
    id: 'semaglutide',
    names: {
      generic: 'Semaglutida',
      brands: ['Ozempic', 'Wegovy', 'Rybelsus'],
      aliases: ['NN9535', 'sema'],
    },
    category: 'incretin',
    pharmClass: {
      es: 'Agonista del receptor de GLP-1 (acción prolongada)',
      en: 'Long-acting GLP-1 receptor agonist',
    },
    summary: {
      es: 'Análogo de GLP-1 humano con semivida de ~1 semana gracias a la acilación con ácido graso C18 y unión a albúmina. Aprobado para diabetes tipo 2, obesidad y reducción de riesgo cardiovascular.',
      en: 'Human GLP-1 analogue with a ~1-week half-life through C18 fatty-acid acylation and albumin binding. Approved for type 2 diabetes, obesity and cardiovascular risk reduction.',
    },
    evidence: 'fda_approved',
    regulatory: { us: 'approved', eu: 'approved' },
    routes: ['sc', 'oral'],
    defaultUnit: 'mg',
    pk: {
      halfLifeH: 168,
      tmaxH: 48,
      bioavailability: 0.89,
      apparentVolumeL: 12.5,
      molarMassGPerMol: 4113.6,
    },
    dosing: { templateIds: ['semaglutide-wegovy', 'semaglutide-ozempic', 'semaglutide-rybelsus'] },
    monitoring: [
      { es: 'Peso, HbA1c, glucemia (si DM2)', en: 'Weight, HbA1c, glucose (if T2D)' },
      {
        es: 'Función renal si vómitos/diarrea intensos',
        en: 'Renal function with severe vomiting/diarrhoea',
      },
      {
        es: 'Fondo de ojo basal en retinopatía conocida',
        en: 'Baseline retinal exam if known retinopathy',
      },
      {
        es: 'Lipasa solo si síntomas de pancreatitis',
        en: 'Lipase only with pancreatitis symptoms',
      },
      {
        es: 'Composición corporal / masa magra durante la pérdida de peso',
        en: 'Body composition / lean mass during weight loss',
      },
    ],
    tags: ['glp1', 'obesidad', 'dm2', 'cardiovascular', 'semanal'],
  },
  {
    id: 'tirzepatide',
    names: {
      generic: 'Tirzepatida',
      brands: ['Mounjaro', 'Zepbound'],
      aliases: ['LY3298176', 'tirz'],
    },
    category: 'incretin',
    pharmClass: {
      es: 'Agonista dual de receptores GIP y GLP-1',
      en: 'Dual GIP and GLP-1 receptor agonist',
    },
    summary: {
      es: 'Péptido de 39 aminoácidos basado en la secuencia de GIP con actividad dual GIP/GLP-1 y semivida de ~5 días. La mayor pérdida de peso entre los fármacos aprobados hasta 2025 (hasta −20,9% en SURMOUNT-1).',
      en: '39-amino-acid GIP-sequence-based peptide with dual GIP/GLP-1 activity and a ~5-day half-life. Greatest weight loss among approved agents through 2025 (up to −20.9% in SURMOUNT-1).',
    },
    evidence: 'fda_approved',
    regulatory: { us: 'approved', eu: 'approved' },
    routes: ['sc'],
    defaultUnit: 'mg',
    pk: {
      halfLifeH: 120,
      tmaxH: 24,
      bioavailability: 0.8,
      apparentVolumeL: 10.3,
      molarMassGPerMol: 4813.5,
    },
    dosing: { templateIds: ['tirzepatide-standard', 'tirzepatide-slow'] },
    monitoring: [
      { es: 'Peso, HbA1c, glucemia', en: 'Weight, HbA1c, glucose' },
      {
        es: 'Frecuencia cardíaca (aumento medio 2–4 lpm)',
        en: 'Heart rate (mean increase 2–4 bpm)',
      },
      {
        es: 'Función renal si intolerancia GI intensa',
        en: 'Renal function with severe GI intolerance',
      },
      {
        es: 'Masa magra y fuerza durante la pérdida ponderal',
        en: 'Lean mass and strength during weight loss',
      },
    ],
    tags: ['glp1', 'gip', 'obesidad', 'dm2', 'apnea', 'semanal'],
  },
  {
    id: 'liraglutide',
    names: {
      generic: 'Liraglutida',
      brands: ['Victoza', 'Saxenda', 'Xultophy (con insulina degludec)'],
      aliases: ['NN2211', 'lira'],
    },
    category: 'incretin',
    pharmClass: {
      es: 'Agonista del receptor de GLP-1 (acción intermedia, diario)',
      en: 'GLP-1 receptor agonist (intermediate-acting, once daily)',
    },
    summary: {
      es: 'Análogo de GLP-1 humano (97% de homología) acilado con ácido palmítico C16 que se une a albúmina y forma heptámeros en el tejido subcutáneo, prolongando la semivida a ~13 h. Primer GLP-1 RA aprobado para obesidad (Saxenda 3 mg) y primero con beneficio cardiovascular demostrado (LEADER).',
      en: 'Human GLP-1 analogue (97% homology) acylated with a C16 palmitic acid that binds albumin and self-associates into heptamers in subcutaneous tissue, extending half-life to ~13 h. First GLP-1 RA approved for obesity (Saxenda 3 mg) and first with proven cardiovascular benefit (LEADER).',
    },
    evidence: 'fda_approved',
    regulatory: { us: 'approved', eu: 'approved' },
    routes: ['sc'],
    defaultUnit: 'mg',
    pk: {
      halfLifeH: 13,
      tmaxH: 10,
      bioavailability: 0.55,
      apparentVolumeL: 13,
      molarMassGPerMol: 3751.2,
    },
    dosing: { templateIds: ['liraglutide-saxenda', 'liraglutide-victoza'] },
    monitoring: [
      {
        es: 'Peso, HbA1c y glucemia (si DM2); reevaluar Saxenda a las 16 semanas (regla del 4%)',
        en: 'Weight, HbA1c and glucose (if T2D); reassess Saxenda at 16 weeks (4% rule)',
      },
      {
        es: 'Frecuencia cardíaca; síntomas de taquicardia sostenida',
        en: 'Heart rate; symptoms of sustained tachycardia',
      },
      {
        es: 'Función renal si intolerancia GI intensa',
        en: 'Renal function with severe GI intolerance',
      },
      { es: 'Estado de ánimo/ideación suicida (Saxenda)', en: 'Mood/suicidal ideation (Saxenda)' },
      {
        es: 'Crecimiento y maduración puberal en niños y adolescentes',
        en: 'Growth and pubertal maturation in children and adolescents',
      },
    ],
    tags: ['glp1', 'obesidad', 'dm2', 'cardiovascular', 'diario', 'pediatría', 'genérico'],
  },
  {
    id: 'retatrutide',
    names: {
      generic: 'Retatrutida',
      brands: [],
      aliases: ['LY3437943', 'Retatrutide', 'Reta', 'triple G', 'GGG tri-agonista'],
    },
    category: 'incretin',
    pharmClass: {
      es: 'Triple agonista de los receptores GIP/GLP-1/glucagón (acción semanal)',
      en: 'Triple GIP/GLP-1/glucagon receptor agonist (once weekly)',
    },
    summary: {
      es: 'Péptido único de 39 aminoácidos acilado con un diácido graso C20 que activa simultáneamente los receptores de GIP, GLP-1 y glucagón. En el fase 2 en obesidad la pérdida media de peso a 48 semanas fue del −8,7 % con 1 mg al −24,2 % con 12 mg (placebo −2,1 %). Está en fase 3 (programa TRIUMPH) y no está aprobada en ningún país.',
      en: 'Single 39-amino-acid peptide acylated with a C20 fatty diacid that simultaneously activates the GIP, GLP-1 and glucagon receptors. In the phase 2 obesity trial mean weight loss at 48 weeks ranged from −8.7% with 1 mg to −24.2% with 12 mg (placebo −2.1%). It is in phase 3 (TRIUMPH programme) and not approved anywhere.',
    },
    evidence: 'phase3',
    regulatory: { us: 'investigational', eu: 'investigational' },
    routes: ['sc'],
    defaultUnit: 'mg',
    pk: { halfLifeH: 144, tmaxH: 36, molarMassGPerMol: 4731 },
    dosing: { templateIds: ['retatrutide-triumph'] },
    monitoring: [
      {
        es: 'Peso, perímetro abdominal y composición corporal (masa magra)',
        en: 'Weight, waist circumference and body composition (lean mass)',
      },
      {
        es: 'Frecuencia cardíaca y presión arterial en cada escalón de dosis',
        en: 'Heart rate and blood pressure at each dose step',
      },
      {
        es: 'Glucosa y HbA1c; con insulina o sulfonilureas, riesgo de hipoglucemia al bajar de peso',
        en: 'Glucose and HbA1c; with insulin or sulfonylureas, hypoglycaemia risk as weight falls',
      },
      {
        es: 'Síntomas digestivos y lo que se come en cada escalón: con poca proteína se pierde más masa magra',
        en: 'GI symptoms and food intake at each step: with little protein more lean mass is lost',
      },
      {
        es: 'Función renal e hidratación durante la escalada',
        en: 'Renal function and hydration during escalation',
      },
      {
        es: 'Transaminasas y grasa hepática si indicación MASH',
        en: 'Transaminases and hepatic fat if MASH is the indication',
      },
    ],
    tags: ['glp1', 'gip', 'glucagón', 'triple agonista', 'obesidad', 'semanal', 'investigacional'],
  },
  {
    id: 'cagrilintide',
    names: { generic: 'Cagrilintida', brands: [], aliases: ['AM833', 'NNC0174-0833'] },
    category: 'incretin',
    pharmClass: {
      es: 'Análogo de amilina de acción prolongada (agonista no selectivo de receptores de amilina y calcitonina)',
      en: 'Long-acting amylin analogue (non-selective amylin/calcitonin receptor agonist)',
    },
    summary: {
      es: 'Análogo acilado de amilina humana diseñado para administración semanal, con semivida de ~1 semana. Como monoterapia produjo alrededor de −10% de peso a 26 semanas en fase 2; su desarrollo principal es en combinación fija con semaglutida (CagriSema).',
      en: 'Acylated human amylin analogue designed for weekly dosing, with a ~1-week half-life. As monotherapy it produced about −10% weight loss at 26 weeks in phase 2; its main development is as a fixed-dose combination with semaglutide (CagriSema).',
    },
    evidence: 'phase3',
    regulatory: { us: 'investigational', eu: 'investigational' },
    routes: ['sc'],
    defaultUnit: 'mg',
    pk: { halfLifeH: 159, tmaxH: 24 },
    dosing: {},
    monitoring: [
      { es: 'Peso y tolerancia GI', en: 'Weight and GI tolerance' },
      {
        es: 'Glucemia capilar si hay insulina concomitante',
        en: 'Capillary glucose if concomitant insulin',
      },
      {
        es: 'Calcio y marcadores óseos no requeridos de rutina, pero considerar por la actividad sobre el receptor de calcitonina',
        en: 'Calcium and bone markers are not routinely required, but consider them given calcitonin-receptor activity',
      },
    ],
    tags: ['amilina', 'saciedad', 'obesidad', 'semanal', 'investigacional'],
  },
  {
    id: 'cagrisema',
    names: {
      generic: 'CagriSema (cagrilintida + semaglutida)',
      brands: [],
      aliases: ['cagrilintide/semaglutide', 'NN9838'],
    },
    category: 'incretin',
    pharmClass: {
      es: 'Combinación a dosis fija de análogo de amilina y agonista del receptor de GLP-1 (acción semanal)',
      en: 'Fixed-dose combination of an amylin analogue and a GLP-1 receptor agonist (once weekly)',
    },
    summary: {
      es: 'Coformulación a dosis fija de cagrilintida y semaglutida en una única inyección semanal. La dosis se expresa por componente: 2,4/2,4 mg significa 2,4 mg de cagrilintida más 2,4 mg de semaglutida. En el programa fase 3 REDEFINE alcanzó alrededor de −20% de peso a 68 semanas en obesidad sin diabetes.',
      en: 'Fixed-dose co-formulation of cagrilintide and semaglutide in a single weekly injection. The dose is expressed per component: 2.4/2.4 mg means 2.4 mg of cagrilintide plus 2.4 mg of semaglutide. In the REDEFINE phase 3 programme it reached about −20% weight loss at 68 weeks in obesity without diabetes.',
    },
    evidence: 'phase3',
    regulatory: { us: 'investigational', eu: 'investigational' },
    routes: ['sc'],
    defaultUnit: 'mg',
    pk: { halfLifeH: 165, tmaxH: 36 },
    dosing: { templateIds: ['cagrisema-redefine'] },
    monitoring: [
      {
        es: 'Peso y composición corporal (masa magra)',
        en: 'Weight and body composition (lean mass)',
      },
      {
        es: 'HbA1c y glucemia; riesgo de hipoglucemia en DM2 tratada',
        en: 'HbA1c and glucose; hypoglycaemia risk in treated T2D',
      },
      {
        es: 'Hidratación, función renal y sintomatología GI en cada escalón',
        en: 'Hydration, renal function and GI symptoms at each step',
      },
      { es: 'Frecuencia cardíaca y presión arterial', en: 'Heart rate and blood pressure' },
    ],
    tags: ['glp1', 'amilina', 'combinación', 'obesidad', 'semanal', 'investigacional'],
  },
  {
    id: 'survodutide',
    names: { generic: 'Survodutida', brands: [], aliases: ['BI 456906', 'SAR441255'] },
    category: 'incretin',
    pharmClass: {
      es: 'Doble agonista del receptor de glucagón y GLP-1 (acción semanal)',
      en: 'Dual glucagon/GLP-1 receptor agonist (once weekly)',
    },
    summary: {
      es: 'Péptido acilado basado en glucagón que actúa como doble agonista glucagón/GLP-1, desarrollado por Boehringer Ingelheim y Zealand Pharma. En fase 2 logró −18,7% de peso a 46 semanas y una tasa de resolución de MASH del 62–83%. En fase 3 (programa SYNCHRONIZE) para obesidad y en fase 3 para MASH.',
      en: 'Acylated glucagon-based peptide acting as a dual glucagon/GLP-1 agonist, developed by Boehringer Ingelheim and Zealand Pharma. In phase 2 it achieved −18.7% weight at 46 weeks and 62–83% MASH resolution. In phase 3 (SYNCHRONIZE programme) for obesity and phase 3 for MASH.',
    },
    evidence: 'phase3',
    regulatory: { us: 'investigational', eu: 'investigational' },
    routes: ['sc'],
    defaultUnit: 'mg',
    pk: { halfLifeH: 146, tmaxH: 48 },
    dosing: {},
    monitoring: [
      { es: 'Peso y tolerancia GI en cada escalón', en: 'Weight and GI tolerance at each step' },
      { es: 'Frecuencia cardíaca y presión arterial', en: 'Heart rate and blood pressure' },
      { es: 'HbA1c y glucemia', en: 'HbA1c and glucose' },
      {
        es: 'Transaminasas, elastografía o marcadores de fibrosis si indicación hepática',
        en: 'Transaminases, elastography or fibrosis markers if hepatic indication',
      },
    ],
    tags: ['glp1', 'glucagón', 'doble agonista', 'obesidad', 'mash', 'semanal', 'investigacional'],
  },
  {
    id: 'mazdutide',
    names: {
      generic: 'Mazdutida',
      brands: ['Xcretin (China)'],
      aliases: ['IBI362', 'LY3305677', 'OXM analogue'],
    },
    category: 'incretin',
    pharmClass: {
      es: 'Doble agonista GLP-1/glucagón análogo de oxintomodulina (acción semanal)',
      en: 'Oxyntomodulin-analogue dual GLP-1/glucagon receptor agonist (once weekly)',
    },
    summary: {
      es: 'Análogo de oxintomodulina licenciado por Innovent desde Eli Lilly que activa los receptores de GLP-1 y de glucagón. Aprobado en China en 2025 para control de peso y posteriormente para diabetes tipo 2; sigue siendo investigacional en EE. UU. y la UE. Programa clínico GLORY y DREAMS en población mayoritariamente china.',
      en: 'Oxyntomodulin analogue licensed by Innovent from Eli Lilly that activates GLP-1 and glucagon receptors. Approved in China in 2025 for weight management and subsequently for type 2 diabetes; still investigational in the US and EU. GLORY and DREAMS clinical programmes in a predominantly Chinese population.',
    },
    evidence: 'phase3',
    regulatory: { us: 'investigational', eu: 'investigational' },
    routes: ['sc'],
    defaultUnit: 'mg',
    pk: { halfLifeH: 156, tmaxH: 36 },
    dosing: {},
    monitoring: [
      { es: 'Peso, HbA1c y glucemia', en: 'Weight, HbA1c and glucose' },
      {
        es: 'Transaminasas y ácido úrico (mejoran en los ensayos)',
        en: 'Transaminases and uric acid (improve in trials)',
      },
      { es: 'Frecuencia cardíaca', en: 'Heart rate' },
      {
        es: 'Hidratación y función renal durante la escalada',
        en: 'Hydration and renal function during escalation',
      },
    ],
    tags: ['glp1', 'glucagón', 'oxintomodulina', 'obesidad', 'china', 'semanal', 'investigacional'],
  },
  {
    id: 'orforglipron',
    names: { generic: 'Orforglipron', brands: [], aliases: ['LY3502970', 'OWL833'] },
    category: 'incretin',
    pharmClass: {
      es: 'Agonista del receptor de GLP-1 oral, no peptídico (molécula pequeña, 1×/día)',
      en: 'Oral non-peptide small-molecule GLP-1 receptor agonist (once daily)',
    },
    summary: {
      es: 'Agonista parcial del receptor de GLP-1 de molécula pequeña y naturaleza no peptídica, activo por vía oral una vez al día y sin restricciones de comida ni de agua, a diferencia de la semaglutida oral. En fase 3 (ACHIEVE en DM2 y ATTAIN en obesidad) mostró reducciones de peso en torno al −10% a −12% y descensos de HbA1c de hasta ~1,5–2%.',
      en: 'Small-molecule, non-peptide partial GLP-1 receptor agonist, orally active once daily with no food or water restrictions, unlike oral semaglutide. In phase 3 (ACHIEVE in T2D and ATTAIN in obesity) it showed weight reductions around −10% to −12% and HbA1c falls of up to ~1.5–2%.',
    },
    evidence: 'phase3',
    regulatory: { us: 'investigational', eu: 'investigational' },
    routes: ['oral'],
    defaultUnit: 'mg',
    pk: { halfLifeH: 39, tmaxH: 5 },
    dosing: {},
    monitoring: [
      { es: 'Peso, HbA1c y glucemia', en: 'Weight, HbA1c and glucose' },
      { es: 'Tolerancia GI durante la escalada', en: 'GI tolerance during escalation' },
      { es: 'Frecuencia cardíaca', en: 'Heart rate' },
      {
        es: 'Función renal si hay vómitos o diarrea intensos',
        en: 'Renal function with severe vomiting or diarrhoea',
      },
    ],
    tags: [
      'glp1',
      'oral',
      'molécula pequeña',
      'no peptídico',
      'obesidad',
      'dm2',
      'diario',
      'investigacional',
    ],
  },
  {
    id: 'hcg',
    names: {
      generic: 'Gonadotropina coriónica humana',
      brands: ['Pregnyl', 'Novarel', 'Ovidrel (coriogonadotropina alfa)'],
      aliases: ['hCG', 'HCG', 'coriogonadotropina'],
    },
    category: 'hormonal',
    pharmClass: {
      es: 'Gonadotropina; agonista del receptor de LH/hCG',
      en: 'Gonadotropin; LH/hCG receptor agonist',
    },
    summary: {
      es: 'Glucoproteína placentaria que actúa como análogo de la LH sobre el receptor LHCGR. Aprobada para inducción de la ovulación, criptorquidia prepuberal e hipogonadismo hipogonadotropo; su uso como adyuvante de la testosterona es off-label.',
      en: 'Placental glycoprotein acting as an LH analogue at the LHCGR receptor. Approved for ovulation induction, prepubertal cryptorchidism and hypogonadotropic hypogonadism; its use as an adjunct to testosterone is off-label.',
    },
    evidence: 'fda_approved',
    regulatory: { us: 'approved', eu: 'approved' },
    routes: ['sc', 'im'],
    defaultUnit: 'iu',
    pk: { halfLifeH: 30, tmaxH: 12 },
    dosing: {},
    monitoring: [
      {
        es: 'Testosterona total y libre, y estradiol (riesgo de aromatización excesiva)',
        en: 'Total and free testosterone, and estradiol (risk of excessive aromatisation)',
      },
      {
        es: 'Volumen testicular y seminograma cuando el objetivo es la fertilidad',
        en: 'Testicular volume and semen analysis when fertility is the goal',
      },
      {
        es: 'Hematocrito y PSA en varones tratados junto con testosterona',
        en: 'Haematocrit and PSA in men treated together with testosterone',
      },
      {
        es: 'Ecografía ovárica y estradiol seriado en estimulación ovárica',
        en: 'Ovarian ultrasound and serial estradiol during ovarian stimulation',
      },
    ],
    tags: ['gonadotropina', 'fertilidad', 'testosterona', 'off-label', 'hipogonadismo'],
  },
  {
    id: 'gonadorelin',
    names: {
      generic: 'Gonadorelina',
      brands: ['Factrel (descatalogado)', 'Lutrepulse (descatalogado)'],
      aliases: ['GnRH', 'LHRH', 'gonadorelin'],
    },
    category: 'hormonal',
    pharmClass: { es: 'Decapéptido GnRH nativo', en: 'Native GnRH decapeptide' },
    summary: {
      es: 'Forma sintética idéntica a la hormona liberadora de gonadotropinas hipotalámica. Sus presentaciones comerciales están descatalogadas en Estados Unidos; hoy se obtiene sobre todo por formulación magistral y se usa off-label como adyuvante de la terapia con testosterona.',
      en: 'Synthetic form identical to hypothalamic gonadotropin-releasing hormone. Its commercial presentations are discontinued in the United States; today it is mostly obtained through compounding and used off-label as an adjunct to testosterone therapy.',
    },
    evidence: 'fda_approved',
    regulatory: { us: 'compounded', eu: 'discontinued' },
    routes: ['sc', 'iv'],
    defaultUnit: 'mcg',
    pk: { halfLifeH: 0.07, tmaxH: 0.3 },
    dosing: {},
    monitoring: [
      {
        es: 'LH, FSH, testosterona total y estradiol',
        en: 'LH, FSH, total testosterone and estradiol',
      },
      {
        es: 'Volumen testicular y seminograma si el objetivo es la fertilidad',
        en: 'Testicular volume and semen analysis if fertility is the goal',
      },
      {
        es: 'Procedencia y controles de calidad del preparado magistral',
        en: 'Source and quality controls of the compounded preparation',
      },
    ],
    tags: ['gnrh', 'off-label', 'magistral', 'testosterona', 'fertilidad'],
  },
  {
    id: 'cjc-1295',
    names: {
      generic: 'CJC-1295 con DAC',
      brands: [],
      aliases: ['CJC-1295 DAC', 'DAC:GRF', 'CJC-1295 with DAC', 'CJC-1295 + DAC'],
    },
    category: 'gh_axis',
    pharmClass: {
      es: 'Análogo de GHRH de acción prolongada (GRF 1-29 tetrasustituido unido a un complejo de afinidad por albúmina, DAC)',
      en: 'Long-acting GHRH analogue (tetrasubstituted GRF 1-29 bound to a Drug Affinity Complex, DAC)',
    },
    summary: {
      es: 'Análogo sintético de GHRH(1-29) con cuatro sustituciones que lo protegen de la DPP-4, al que se añade en el extremo C-terminal una lisina con un grupo maleimidopropionamida (DAC) que se une covalentemente a la albúmina circulante; así alcanza una semivida de ~6–8 días y permite dosis semanales. El desarrollo clínico (ConjuChem) se detuvo en 2006; hoy solo circula como producto de investigación. Si usas “CJC” de acción corta en la misma jeringa que la ipamorelina, consulta la ficha separada «Mod GRF 1-29 (CJC-1295 sin DAC)»: es otra molécula, con una semivida de minutos.',
      en: 'Synthetic GHRH(1-29) analogue with four substitutions protecting it from DPP-4, extended at the C-terminus with a lysine carrying a maleimidopropionamide group (DAC) that binds circulating albumin covalently; this yields a ~6–8-day half-life and allows weekly dosing. Clinical development (ConjuChem) stopped in 2006; today it circulates only as a research chemical. If you use short-acting “CJC” in the same syringe as ipamorelin, see the separate “Mod GRF 1-29 (CJC-1295 sin DAC)” entry: it is a different molecule with a half-life of minutes.',
    },
    evidence: 'phase1',
    regulatory: { us: 'research_only' },
    routes: ['sc'],
    defaultUnit: 'mg',
    pk: { halfLifeH: 168, molarMassGPerMol: 3648 },
    dosing: {},
    monitoring: [
      { es: 'IGF-1 basal y a las 4–8 semanas', en: 'Baseline and 4–8-week IGF-1' },
      { es: 'Glucosa en ayunas / HbA1c', en: 'Fasting glucose / HbA1c' },
      { es: 'TSH y T4 libre', en: 'TSH and free T4' },
      { es: 'Peso, edema, presión arterial', en: 'Weight, oedema, blood pressure' },
    ],
    tags: ['ghrh', 'gh', 'igf-1', 'semanal', 'dac', 'albúmina', 'investigación'],
  },
  {
    id: 'ipamorelin',
    names: {
      generic: 'Ipamorelina',
      brands: [],
      aliases: ['Ipamorelin', 'NNC 26-0161', 'ipa', 'IPA'],
    },
    category: 'gh_axis',
    pharmClass: {
      es: 'Secretagogo de GH pentapeptídico; agonista selectivo del receptor de ghrelina (GHS-R1a)',
      en: 'Pentapeptide GH secretagogue; selective ghrelin receptor (GHS-R1a) agonist',
    },
    summary: {
      es: 'Pentapéptido (Aib-His-D-2-Nal-D-Phe-Lys-NH2) desarrollado por Novo Nordisk como el primer GHRP selectivo: libera GH con potencia similar a GHRP-6 sin elevar ACTH/cortisol ni prolactina a dosis equipotentes. Un programa de fase 2 (Helsinn) en íleo posoperatorio no demostró eficacia. Hoy solo producto de investigación, frecuentemente combinado con CJC-1295 sin DAC.',
      en: 'Pentapeptide (Aib-His-D-2-Nal-D-Phe-Lys-NH2) developed by Novo Nordisk as the first selective GHRP: releases GH with GHRP-6-like potency without raising ACTH/cortisol or prolactin at equipotent doses. A phase 2 programme (Helsinn) in postoperative ileus failed to show efficacy. Now research-only, frequently combined with DAC-free CJC-1295.',
    },
    evidence: 'phase2',
    regulatory: { us: 'research_only' },
    routes: ['sc', 'iv'],
    defaultUnit: 'mcg',
    pk: { halfLifeH: 2, molarMassGPerMol: 711.9 },
    dosing: {},
    monitoring: [
      {
        es: 'IGF-1 antes de empezar y a las 4–8 semanas',
        en: 'IGF-1 before starting and at 4–8 weeks',
      },
      {
        es: 'Glucosa en ayunas y HbA1c (la GH reduce la sensibilidad a la insulina)',
        en: 'Fasting glucose and HbA1c (GH lowers insulin sensitivity)',
      },
      { es: 'Peso y edema', en: 'Weight and oedema' },
      {
        es: 'Cortisol y prolactina solo si hay síntomas (no se esperan cambios)',
        en: 'Cortisol and prolactin only if symptomatic (no change expected)',
      },
    ],
    tags: ['ghrp', 'ghs-r1a', 'gh', 'selectivo', 'investigación'],
  },
  {
    id: 'sermorelin',
    names: {
      generic: 'Sermorelina',
      brands: ['Geref (retirado)'],
      aliases: ['GHRH(1-29)NH2', 'GRF 1-29', 'acetato de sermorelina'],
    },
    category: 'gh_axis',
    pharmClass: {
      es: 'Análogo de GHRH (fragmento 1-29 de la GHRH humana)',
      en: 'GHRH analogue (fragment 1-29 of human GHRH)',
    },
    summary: {
      es: 'Fragmento activo 1-29 de la GHRH humana. Geref (Serono) fue aprobado por la FDA como diagnóstico (1990) y para el déficit de GH pediátrico (1997) y se retiró del mercado en 2008 por motivos no relacionados con la seguridad. Sigue disponible en EE. UU. mediante formulación magistral (503A) y se usa fuera de indicación en adultos para el “declive somatopáusico”.',
      en: 'Active 1-29 fragment of human GHRH. Geref (Serono) was FDA-approved as a diagnostic (1990) and for paediatric GH deficiency (1997) and was withdrawn in 2008 for reasons unrelated to safety. Still available in the US through 503A compounding and used off-label in adults for “somatopause”.',
    },
    evidence: 'withdrawn',
    regulatory: { us: 'compounded' },
    routes: ['sc', 'iv'],
    defaultUnit: 'mcg',
    pk: { halfLifeH: 0.2, bioavailability: 0.06, molarMassGPerMol: 3358 },
    dosing: {},
    monitoring: [
      {
        es: 'IGF-1 (objetivo dentro del rango normal para edad)',
        en: 'IGF-1 (target within age-adjusted normal range)',
      },
      { es: 'Glucosa en ayunas / HbA1c', en: 'Fasting glucose / HbA1c' },
      { es: 'TSH y T4 libre', en: 'TSH and free T4' },
      { es: 'Edema, artralgia, peso', en: 'Oedema, arthralgia, weight' },
    ],
    tags: ['ghrh', 'gh', 'magistral', 'nocturno', 'retirado'],
  },
  {
    id: 'tesamorelin',
    names: {
      generic: 'Tesamorelina',
      brands: ['Egrifta', 'Egrifta SV', 'Egrifta WR'],
      aliases: ['TH9507', 'trans-3-hexenoil-GHRH(1-44)'],
    },
    category: 'gh_axis',
    pharmClass: { es: 'Análogo estabilizado de GHRH(1-44)', en: 'Stabilised GHRH(1-44) analogue' },
    summary: {
      es: 'GHRH humana completa (1-44) con un grupo trans-3-hexenoílo N-terminal que la protege de la DPP-4. Aprobada por la FDA en 2010 para reducir el exceso de grasa abdominal en la lipodistrofia asociada al VIH (−15 % de tejido adiposo visceral a 26 semanas). Único análogo de GHRH comercializado; estudiada también en esteatosis hepática del VIH y en deterioro cognitivo leve.',
      en: 'Full-length human GHRH (1-44) with an N-terminal trans-3-hexenoyl group protecting it from DPP-4. FDA-approved in 2010 to reduce excess abdominal fat in HIV-associated lipodystrophy (−15% visceral adipose tissue at 26 weeks). The only marketed GHRH analogue; also studied in HIV-associated hepatic steatosis and mild cognitive impairment.',
    },
    evidence: 'fda_approved',
    regulatory: { us: 'approved' },
    routes: ['sc'],
    defaultUnit: 'mg',
    pk: {
      halfLifeH: 0.63,
      tmaxH: 0.15,
      bioavailability: 0.04,
      apparentVolumeL: 10.5,
      molarMassGPerMol: 5136,
    },
    dosing: {},
    monitoring: [
      {
        es: 'IGF-1 basal y periódica; reconsiderar si persiste > +3 SDS',
        en: 'Baseline and periodic IGF-1; reconsider if persistently > +3 SDS',
      },
      {
        es: 'Glucosa en ayunas y HbA1c basal y cada 3–6 meses',
        en: 'Fasting glucose and HbA1c at baseline and every 3–6 months',
      },
      {
        es: 'Perímetro abdominal, TAC/DEXA de grasa visceral a los 6 meses',
        en: 'Waist circumference, CT/DEXA visceral fat at 6 months',
      },
      {
        es: 'Signos de hipersensibilidad y retención hídrica',
        en: 'Signs of hypersensitivity and fluid retention',
      },
    ],
    tags: ['ghrh', 'vih', 'lipodistrofia', 'grasa visceral', 'aprobado', 'diario'],
  },
  {
    id: 'ghrp-2',
    names: {
      generic: 'GHRP-2',
      brands: ['GHRP Kaken 100 (Japón, diagnóstico)'],
      aliases: ['pralmorelina', 'pralmorelin', 'KP-102', 'D-Ala-D-2-Nal-Ala-Trp-D-Phe-Lys-NH2'],
    },
    category: 'gh_axis',
    pharmClass: {
      es: 'Secretagogo de GH hexapeptídico; agonista del receptor de ghrelina (GHS-R1a)',
      en: 'Hexapeptide GH secretagogue; ghrelin receptor (GHS-R1a) agonist',
    },
    summary: {
      es: 'Hexapéptido sintético de segunda generación (familia de Bowers), más potente que GHRP-6 como liberador de GH y con menor efecto orexígeno. Como pralmorelina se autorizó en Japón como agente diagnóstico del déficit de GH del adulto (prueba IV de 100 µg); no está aprobado en EE. UU. ni en la UE, donde solo circula como producto de investigación.',
      en: 'Second-generation synthetic hexapeptide (Bowers family), a more potent GH releaser than GHRP-6 with less orexigenic effect. As pralmorelin it was authorised in Japan as a diagnostic agent for adult GH deficiency (100 µg IV test); not approved in the US or EU, where it circulates only as a research chemical.',
    },
    evidence: 'phase2',
    regulatory: { us: 'research_only' },
    routes: ['sc', 'iv'],
    defaultUnit: 'mcg',
    dosing: {},
    monitoring: [
      { es: 'IGF-1 basal y a las 4–8 semanas', en: 'Baseline and 4–8-week IGF-1' },
      { es: 'Glucosa en ayunas / HbA1c', en: 'Fasting glucose / HbA1c' },
      { es: 'Cortisol matinal y prolactina', en: 'Morning cortisol and prolactin' },
      { es: 'Peso, edema, presión arterial', en: 'Weight, oedema, blood pressure' },
    ],
    tags: ['ghrp', 'ghs-r1a', 'gh', 'cortisol', 'prolactina', 'diagnóstico', 'investigación'],
  },
  {
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
    pharmClass: {
      es: 'Secretagogo de GH hexapeptídico de primera generación; agonista del receptor de ghrelina (GHS-R1a)',
      en: 'First-generation hexapeptide GH secretagogue; ghrelin receptor (GHS-R1a) agonist',
    },
    summary: {
      es: 'Primer GHRP con actividad relevante in vivo (Bowers, 1984), anterior al descubrimiento de la ghrelina (1999), cuyo receptor comparte. Libera GH de forma potente y sinérgica con GHRH, pero es el más orexígeno de la familia y eleva cortisol y prolactina. Se ha usado en pruebas diagnósticas combinadas (GHRH + GHRP-6) y estudiado en cardioprotección; nunca aprobado.',
      en: 'First GHRP with meaningful in vivo activity (Bowers, 1984), predating the discovery of ghrelin (1999), whose receptor it shares. Releases GH potently and synergistically with GHRH, but is the most orexigenic of the family and raises cortisol and prolactin. Used in combined diagnostic tests (GHRH + GHRP-6) and studied for cardioprotection; never approved.',
    },
    evidence: 'phase1',
    regulatory: { us: 'research_only' },
    routes: ['sc', 'iv'],
    defaultUnit: 'mcg',
    dosing: {},
    monitoring: [
      { es: 'IGF-1 a las 4–8 semanas', en: 'IGF-1 at 4–8 weeks' },
      { es: 'Glucosa en ayunas / HbA1c', en: 'Fasting glucose / HbA1c' },
      { es: 'Cortisol matinal y prolactina', en: 'Morning cortisol and prolactin' },
      { es: 'Peso, edema', en: 'Weight, oedema' },
    ],
    tags: ['ghrp', 'ghs-r1a', 'gh', 'apetito', 'cortisol', 'prolactina', 'investigación'],
  },
  {
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
    pharmClass: {
      es: 'Hormona de crecimiento humana recombinante (191 aminoácidos)',
      en: 'Recombinant human growth hormone (191 amino acids)',
    },
    summary: {
      es: 'GH humana recombinante idéntica a la isoforma hipofisaria de 22 kDa. Aprobada desde 1985 para el déficit de GH infantil y del adulto y para varias causas de talla baja; es la referencia frente a la que se comparan todos los secretagogos. En EE. UU. su distribución para usos no autorizados (antienvejecimiento, rendimiento) es delito federal.',
      en: 'Recombinant human GH identical to the 22-kDa pituitary isoform. Approved since 1985 for childhood and adult GH deficiency and several causes of short stature; the reference against which all secretagogues are compared. In the US, distribution for unauthorised uses (anti-ageing, performance) is a federal crime.',
    },
    evidence: 'fda_approved',
    regulatory: { us: 'approved', eu: 'approved' },
    routes: ['sc', 'im'],
    defaultUnit: 'iu',
    pk: { halfLifeH: 2.5, tmaxH: 5, molarMassGPerMol: 22125 },
    dosing: {},
    monitoring: [
      {
        es: 'IGF-1 basal y a las 4–8 semanas de cada cambio de dosis; objetivo dentro del rango para edad y sexo',
        en: 'IGF-1 at baseline and 4–8 weeks after each dose change; target within age- and sex-adjusted range',
      },
      {
        es: 'Glucosa en ayunas y HbA1c basal y periódica',
        en: 'Fasting glucose and HbA1c at baseline and periodically',
      },
      {
        es: 'TSH y T4 libre; cortisol matinal en hipopituitarismo',
        en: 'TSH and free T4; morning cortisol in hypopituitarism',
      },
      {
        es: 'Fondo de ojo si cefalea persistente o alteraciones visuales',
        en: 'Fundoscopy if persistent headache or visual disturbance',
      },
      {
        es: 'Niños: velocidad de crecimiento, edad ósea, escoliosis, cadera',
        en: 'Children: growth velocity, bone age, scoliosis, hips',
      },
      {
        es: 'Adultos: lípidos, composición corporal, presión arterial, edema',
        en: 'Adults: lipids, body composition, blood pressure, oedema',
      },
    ],
    tags: ['gh', 'somatropina', 'aprobado', 'déficit de gh', 'igf-1', 'talla baja', 'diario'],
  },
  {
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
    pharmClass: {
      es: 'Análogo recombinante de IGF-1 (83 aminoácidos) con baja afinidad por las IGFBP',
      en: 'Recombinant IGF-1 analogue (83 amino acids) with low IGFBP affinity',
    },
    summary: {
      es: 'Variante de IGF-1 con sustitución Glu3→Arg y una extensión N-terminal de 13 aminoácidos, diseñada como reactivo para cultivo celular: apenas se une a las proteínas transportadoras (IGFBP), por lo que es mucho más potente in vitro y de acción más prolongada que la IGF-1 nativa. No existe ningún ensayo en humanos; no debe confundirse con mecasermina (Increlex, IGF-1 recombinante aprobada para el déficit primario grave de IGF-1).',
      en: 'IGF-1 variant with a Glu3→Arg substitution and a 13-amino-acid N-terminal extension, designed as a cell-culture reagent: it barely binds the carrier proteins (IGFBPs), making it far more potent in vitro and longer-acting than native IGF-1. There are no human trials at all; not to be confused with mecasermin (Increlex, recombinant IGF-1 approved for severe primary IGF-1 deficiency).',
    },
    evidence: 'preclinical',
    regulatory: { us: 'research_only' },
    routes: ['sc', 'im'],
    defaultUnit: 'mcg',
    dosing: {},
    monitoring: [
      {
        es: 'Glucemia capilar tras las primeras dosis; glucosa en ayunas / HbA1c',
        en: 'Capillary glucose after the first doses; fasting glucose / HbA1c',
      },
      {
        es: 'IGF-1 total (puede no reflejar la exposición al análogo según el inmunoensayo)',
        en: 'Total IGF-1 (may not reflect analogue exposure depending on the immunoassay)',
      },
      { es: 'Cribado oncológico apropiado para la edad', en: 'Age-appropriate cancer screening' },
    ],
    tags: ['igf-1', 'análogo', 'hipoglucemia', 'anabólico', 'investigación'],
  },
  {
    id: 'mk-677',
    names: {
      generic: 'Ibutamoren',
      brands: [],
      aliases: ['MK-677', 'MK-0677', 'mesilato de ibutamoren', 'L-163,191', 'LUM-201'],
    },
    category: 'gh_axis',
    pharmClass: {
      es: 'Agonista oral NO peptídico del receptor de ghrelina (GHS-R1a); secretagogo de GH espiropiperidínico',
      en: 'Oral NON-PEPTIDE ghrelin receptor (GHS-R1a) agonist; spiropiperidine GH secretagogue',
    },
    summary: {
      es: 'Molécula pequeña oral (no es un péptido) desarrollada por Merck que imita a la ghrelina: una dosis diaria eleva la GH pulsátil e IGF-1 de forma sostenida hasta rangos de adulto joven. Ensayos de fase 2 en ancianos, fractura de cadera, Alzheimer y déficit de GH infantil; el ensayo en recuperación de fractura de cadera se interrumpió precozmente por una señal de insuficiencia cardíaca. No aprobado.',
      en: 'Oral small molecule (not a peptide) developed by Merck that mimics ghrelin: a daily dose raises pulsatile GH and IGF-1 sustainedly into young-adult ranges. Phase 2 trials in the elderly, hip fracture, Alzheimer disease and childhood GH deficiency; the hip-fracture recovery trial was stopped early for a heart-failure signal. Not approved.',
    },
    evidence: 'phase2',
    regulatory: { us: 'investigational' },
    routes: ['oral'],
    defaultUnit: 'mg',
    pk: { halfLifeH: 5 },
    dosing: {},
    monitoring: [
      { es: 'IGF-1 basal y a las 4–8 semanas', en: 'Baseline and 4–8-week IGF-1' },
      {
        es: 'Glucosa en ayunas y HbA1c basal y cada 3 meses',
        en: 'Fasting glucose and HbA1c at baseline and every 3 months',
      },
      {
        es: 'Peso, edema, signos de insuficiencia cardíaca (disnea, ortopnea)',
        en: 'Weight, oedema, heart-failure signs (dyspnoea, orthopnoea)',
      },
      { es: 'Cortisol y prolactina si hay síntomas', en: 'Cortisol and prolactin if symptomatic' },
    ],
    tags: ['ghs-r1a', 'ghrelina', 'oral', 'no peptídico', 'gh', 'igf-1', 'investigación'],
  },
  {
    id: 'bpc-157',
    names: {
      generic: 'BPC-157',
      brands: [],
      aliases: ['Body Protection Compound-157', 'PL 14736', 'PL-10', 'bepecina', 'GEPPPGKPADDAGLV'],
    },
    category: 'repair',
    pharmClass: {
      es: 'Pentadecapéptido sintético derivado de una proteína del jugo gástrico humano; citoprotector / proangiogénico (experimental)',
      en: 'Synthetic pentadecapeptide derived from a human gastric-juice protein; cytoprotective / pro-angiogenic (experimental)',
    },
    summary: {
      es: 'Fragmento de 15 aminoácidos de la “body protection compound”, estudiado casi exclusivamente por un grupo de Zagreb (Sikirić) en cientos de trabajos en roedores con efectos en tendón, ligamento, músculo, tubo digestivo y vasos. No hay ensayos controlados publicados en humanos: solo un programa de Pliva (PL 14736) en enfermedad inflamatoria intestinal comunicado en resúmenes y series de casos retrospectivas. Es uno de los péptidos más usados fuera de indicación pese a ello.',
      en: '15-amino-acid fragment of “body protection compound”, studied almost exclusively by one Zagreb group (Sikirić) in hundreds of rodent papers with effects on tendon, ligament, muscle, gut and vessels. There are no published controlled human trials: only a Pliva programme (PL 14736) in inflammatory bowel disease reported in abstracts, and retrospective case series. It is nonetheless one of the most used off-label peptides.',
    },
    evidence: 'preclinical',
    regulatory: { us: 'research_only' },
    routes: ['sc', 'im', 'oral'],
    defaultUnit: 'mcg',
    dosing: {},
    monitoring: [
      {
        es: 'Evolución clínica de la lesión (sin biomarcadores validados)',
        en: 'Clinical course of the injury (no validated biomarkers)',
      },
      {
        es: 'Signos locales de infección en el punto de inyección',
        en: 'Local signs of infection at the injection site',
      },
      {
        es: 'Cribado oncológico apropiado para la edad antes de uso prolongado',
        en: 'Age-appropriate cancer screening before prolonged use',
      },
    ],
    tags: ['reparación', 'tendón', 'digestivo', 'angiogénesis', 'preclínico', 'investigación'],
  },
  {
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
    pharmClass: {
      es: 'Péptido sintético derivado de la timosina β4 (motivo de unión a actina); promotor de migración celular y angiogénesis (experimental)',
      en: 'Synthetic peptide derived from thymosin β4 (actin-binding motif); promoter of cell migration and angiogenesis (experimental)',
    },
    summary: {
      es: '“TB-500” es una denominación comercial ambigua: suele corresponder al fragmento acetilado 17-23 (LKKTETQ) de la timosina β4, aunque algunos productos contienen la proteína completa de 43 aminoácidos. La timosina β4 completa (RegeneRx) llegó a ensayos de fase 2–3 en úlceras cutáneas y ojo seco/queratopatía con resultados mixtos; el fragmento TB-500 no tiene ningún dato en humanos. Popular en medicina veterinaria equina y en el ámbito deportivo.',
      en: '“TB-500” is an ambiguous trade name: it usually denotes the acetylated 17-23 fragment (LKKTETQ) of thymosin β4, though some products contain the full 43-amino-acid protein. Full-length thymosin β4 (RegeneRx) reached phase 2–3 trials in skin ulcers and dry eye/keratopathy with mixed results; the TB-500 fragment has no human data at all. Popular in equine veterinary practice and sport.',
    },
    evidence: 'preclinical',
    regulatory: { us: 'research_only' },
    routes: ['sc', 'im'],
    defaultUnit: 'mg',
    dosing: {},
    monitoring: [
      {
        es: 'Evolución clínica de la lesión (sin biomarcadores validados)',
        en: 'Clinical course of the injury (no validated biomarkers)',
      },
      { es: 'Signos locales de infección', en: 'Local signs of infection' },
      { es: 'Cribado oncológico apropiado para la edad', en: 'Age-appropriate cancer screening' },
    ],
    tags: ['reparación', 'timosina', 'actina', 'angiogénesis', 'preclínico', 'investigación'],
  },
  {
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
    pharmClass: {
      es: 'Tripéptido endógeno quelante de cobre (Gly-His-Lys:Cu²⁺); modulador de la remodelación tisular',
      en: 'Endogenous copper-chelating tripeptide (Gly-His-Lys:Cu²⁺); tissue-remodelling modulator',
    },
    summary: {
      es: 'Tripéptido presente en plasma, saliva y orina humanos (descrito por Pickart en 1973) cuya concentración disminuye con la edad. Es un ingrediente cosmético tópico muy extendido (sérums antiarrugas, cicatrización, cuero cabelludo) con estudios pequeños financiados por la industria; su uso inyectable es reciente y carece de cualquier dato en humanos.',
      en: 'Tripeptide present in human plasma, saliva and urine (described by Pickart in 1973) whose concentration falls with age. It is a widespread topical cosmetic ingredient (anti-wrinkle serums, wound healing, scalp) with small industry-funded studies; injectable use is recent and lacks any human data.',
    },
    evidence: 'preclinical',
    regulatory: { us: 'research_only' },
    routes: ['topical', 'sc'],
    defaultUnit: 'mg',
    dosing: {},
    monitoring: [
      {
        es: 'Uso sistémico prolongado: cobre sérico y ceruloplasmina',
        en: 'Prolonged systemic use: serum copper and ceruloplasmin',
      },
      { es: 'Pruebas de función hepática', en: 'Liver function tests' },
      { es: 'Reacciones locales', en: 'Local reactions' },
    ],
    tags: ['reparación', 'cobre', 'piel', 'cosmético', 'tópico', 'preclínico'],
  },
  {
    id: 'kpv',
    names: {
      generic: 'KPV',
      brands: [],
      aliases: ['Lys-Pro-Val', 'α-MSH (11-13)', 'alfa-MSH 11-13', 'tripéptido KPV'],
    },
    category: 'repair',
    pharmClass: {
      es: 'Tripéptido C-terminal de la α-MSH; antiinflamatorio (experimental)',
      en: 'C-terminal tripeptide of α-MSH; anti-inflammatory (experimental)',
    },
    summary: {
      es: 'Tripéptido correspondiente a los aminoácidos 11-13 de la hormona estimulante de melanocitos α, que conserva buena parte de su actividad antiinflamatoria sin efectos pigmentarios relevantes. Datos exclusivamente in vitro y en modelos murinos de colitis y dermatitis; no hay ningún ensayo en humanos.',
      en: 'Tripeptide corresponding to amino acids 11-13 of α-melanocyte-stimulating hormone, retaining much of its anti-inflammatory activity without relevant pigmentary effects. Data are exclusively in vitro and in murine colitis and dermatitis models; there are no human trials.',
    },
    evidence: 'preclinical',
    regulatory: { us: 'research_only' },
    routes: ['oral', 'sc', 'topical'],
    defaultUnit: 'mcg',
    dosing: {},
    monitoring: [
      {
        es: 'Actividad clínica de la enfermedad de base (p. ej. calprotectina fecal, PCR en EII)',
        en: 'Clinical activity of the underlying disease (e.g. faecal calprotectin, CRP in IBD)',
      },
      { es: 'Signos de infección', en: 'Signs of infection' },
    ],
    tags: [
      'reparación',
      'antiinflamatorio',
      'melanocortina',
      'intestino',
      'preclínico',
      'investigación',
    ],
  },
  {
    id: 'pentadeca-arginate',
    names: {
      generic: 'Pentadeca-arginato',
      brands: [],
      aliases: ['PDA', 'pentadeca arginate', 'PDA (análogo de BPC-157)', 'BPC-157 arginato'],
    },
    category: 'repair',
    pharmClass: {
      es: 'Análogo / sal de BPC-157 (pentadecapéptido) comercializado como alternativa; composición exacta variable según proveedor',
      en: 'BPC-157 analogue / salt (pentadecapeptide) marketed as an alternative; exact composition varies by supplier',
    },
    summary: {
      es: 'Producto de aparición reciente que se presenta como una forma “más estable” de BPC-157 (secuencia de 15 aminoácidos con modificación o sal de arginina) y que empezó a comercializarse en farmacias magistrales y clínicas de bienestar tras la inclusión de BPC-157 en la categoría 2 de la FDA. La evidencia en humanos es prácticamente inexistente: no hay ensayos, ni farmacocinética, ni publicaciones revisadas por pares específicas; todo se extrapola de los datos animales de BPC-157.',
      en: 'Recently emerged product presented as a “more stable” form of BPC-157 (15-amino-acid sequence with an arginine modification or salt) that began to be marketed by compounding pharmacies and wellness clinics after BPC-157 was placed in FDA Category 2. Human evidence is essentially absent: no trials, no pharmacokinetics, no specific peer-reviewed publications; everything is extrapolated from BPC-157 animal data.',
    },
    evidence: 'anecdotal',
    regulatory: { us: 'research_only' },
    routes: ['sc', 'oral'],
    defaultUnit: 'mcg',
    dosing: {},
    monitoring: [
      { es: 'Evolución clínica (sin biomarcadores)', en: 'Clinical course (no biomarkers)' },
      { es: 'Signos locales de infección', en: 'Local signs of infection' },
    ],
    tags: ['reparación', 'bpc-157', 'análogo', 'sin evidencia', 'magistral', 'investigación'],
  },
  {
    id: 'thymosin-alpha-1',
    names: {
      generic: 'Timosina alfa-1',
      brands: ['Zadaxin'],
      aliases: ['timalfasina', 'thymalfasin', 'Tα1', 'TA1', 'thymosin alpha-1'],
    },
    category: 'immune',
    pharmClass: {
      es: 'Péptido tímico sintético de 28 aminoácidos (N-acetilado); inmunomodulador',
      en: 'Synthetic 28-amino-acid thymic peptide (N-acetylated); immunomodulator',
    },
    summary: {
      es: 'Versión sintética de un péptido aislado de la fracción 5 del timo. Como timalfasina (Zadaxin, SciClone) está autorizada en decenas de países, sobre todo de Asia, Latinoamérica y Europa del Este, para hepatitis B crónica y como adyuvante inmunitario, pero no en EE. UU. ni en la UE. Evidencia de eficacia heterogénea; el gran ensayo en sepsis (TESTS) fue negativo.',
      en: 'Synthetic version of a peptide isolated from thymosin fraction 5. As thymalfasin (Zadaxin, SciClone) it is authorised in dozens of countries, mainly in Asia, Latin America and Eastern Europe, for chronic hepatitis B and as an immune adjuvant, but not in the US or EU. Efficacy evidence is heterogeneous; the large sepsis trial (TESTS) was negative.',
    },
    evidence: 'phase3',
    regulatory: { us: 'research_only' },
    routes: ['sc'],
    defaultUnit: 'mg',
    pk: { halfLifeH: 2, molarMassGPerMol: 3108 },
    dosing: {},
    monitoring: [
      {
        es: 'Hepatitis B: ALT, ADN-VHB, HBeAg/anti-HBe cada 1–3 meses',
        en: 'Hepatitis B: ALT, HBV DNA, HBeAg/anti-HBe every 1–3 months',
      },
      { es: 'Hemograma con recuento linfocitario', en: 'Full blood count with lymphocyte count' },
      { es: 'Síntomas de autoinmunidad', en: 'Autoimmunity symptoms' },
    ],
    tags: ['inmunitario', 'timo', 'hepatitis b', 'tlr', 'aprobado fuera de ee. uu.', 'semanal'],
  },
  {
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
    pharmClass: {
      es: 'Péptido antimicrobiano endógeno (única catelicidina humana, 37 aminoácidos); inmunomodulador',
      en: 'Endogenous antimicrobial peptide (the only human cathelicidin, 37 amino acids); immunomodulator',
    },
    summary: {
      es: 'Fragmento C-terminal activo de hCAP18, producido por neutrófilos y epitelios bajo inducción de la vitamina D. Tiene actividad bactericida, antibiopelícula, quimiotáctica y proangiogénica, pero también un papel patogénico en psoriasis, rosácea y lupus. Un ensayo pequeño de fase 2 en úlceras venosas tópicas fue positivo; el desarrollo posterior (Promore Pharma) no confirmó beneficio claro. El uso SC comunitario carece de datos.',
      en: 'Active C-terminal fragment of hCAP18, produced by neutrophils and epithelia under vitamin D induction. It has bactericidal, anti-biofilm, chemotactic and pro-angiogenic activity, but also a pathogenic role in psoriasis, rosacea and lupus. A small phase 2 trial in topical venous ulcers was positive; later development (Promore Pharma) did not confirm clear benefit. Community SC use lacks data.',
    },
    evidence: 'phase2',
    regulatory: { us: 'research_only' },
    routes: ['sc', 'topical'],
    defaultUnit: 'mcg',
    dosing: {},
    monitoring: [
      {
        es: 'Reacciones locales y cutáneas (brotes de psoriasis/rosácea)',
        en: 'Local and skin reactions (psoriasis/rosacea flares)',
      },
      {
        es: 'Síntomas de autoinmunidad; ANA si aparecen',
        en: 'Autoimmunity symptoms; ANA if they appear',
      },
      {
        es: 'Hemograma si se usa por vía sistémica prolongada',
        en: 'Full blood count with prolonged systemic use',
      },
    ],
    tags: [
      'inmunitario',
      'antimicrobiano',
      'catelicidina',
      'heridas',
      'autoinmunidad',
      'investigación',
    ],
  },
  {
    id: 'mod-grf-1-29',
    names: {
      generic: 'CJC-1295 (sin DAC)',
      brands: [],
      aliases: [
        'Mod GRF 1-29',
        'CJC-1295 sin DAC',
        'CJC-1295 no DAC',
        'Modified GRF (1-29)',
        'tetrasubstituted GRF(1-29)',
      ],
    },
    category: 'gh_axis',
    pharmClass: {
      es: 'Análogo de GHRH de acción corta (GRF 1-29 tetrasustituido, sin DAC)',
      en: 'Short-acting GHRH analogue (tetrasubstituted GRF 1-29, without DAC)',
    },
    summary: {
      es: 'Análogo sintético de GHRH(1-29), la misma secuencia de 29 aminoácidos que la sermorelina, con cuatro posiciones sustituidas para resistir la degradación y sin el complejo de afinidad por albúmina (DAC). Es lo que suele venderse como “CJC-1295” en los blends con ipamorelina. Su semivida efectiva suele citarse en torno a 30 minutos, pero no hay datos farmacocinéticos humanos controlados, por lo que la app no dibuja una curva de exposición. No confundir con CJC-1295 con DAC (semivida de días). Solo circula como producto de investigación.',
      en: 'Synthetic GHRH(1-29) analogue, the same 29-amino-acid sequence as sermorelin, with four positions substituted to resist degradation and without the albumin-binding Drug Affinity Complex (DAC). It is what is usually sold as “CJC-1295” in blends with ipamorelin. Its effective half-life is commonly quoted around 30 minutes, but there are no controlled human pharmacokinetic data, so the app does not draw an exposure curve. Not to be confused with CJC-1295 with DAC (half-life of days). It circulates only as a research chemical.',
    },
    evidence: 'anecdotal',
    regulatory: { us: 'research_only' },
    routes: ['sc'],
    defaultUnit: 'mcg',
    dosing: {},
    monitoring: [
      {
        es: 'IGF-1 antes de empezar y a las 4–8 semanas; como referencia se usa el rango normal para la edad, igual que con la GH',
        en: 'IGF-1 before starting and at 4–8 weeks; the age-specific normal range is used as reference, as with GH',
      },
      {
        es: 'Glucosa en ayunas y HbA1c (la GH reduce la sensibilidad a la insulina)',
        en: 'Fasting glucose and HbA1c (GH lowers insulin sensitivity)',
      },
      { es: 'Peso, edemas y tensión arterial', en: 'Weight, oedema and blood pressure' },
      {
        es: 'Síntomas de túnel carpiano o parestesias persistentes',
        en: 'Carpal tunnel symptoms or persistent paraesthesia',
      },
    ],
    tags: ['ghrh', 'gh', 'pulsátil', 'diario', 'ipamorelina', 'cjc-1295', 'investigación'],
  },
  {
    id: 'mots-c',
    names: {
      generic: 'MOTS-c',
      brands: [],
      aliases: ['MOTSc', 'Mitochondrial ORF of the 12S rRNA type-c', 'CB4211 (análogo)'],
    },
    category: 'metabolic',
    pharmClass: {
      es: 'Péptido derivado de la mitocondria (MDP) regulador metabólico',
      en: 'Mitochondrial-derived peptide (MDP), metabolic regulator',
    },
    summary: {
      es: 'Péptido de 16 aminoácidos codificado en el ADN mitocondrial (12S rRNA) que actúa como señal mitonuclear de estrés metabólico. En roedores mejora la sensibilidad a la insulina y previene la obesidad por dieta; en humanos solo existe un ensayo de fase 1 con un análogo (CB4211) sin desarrollo posterior.',
      en: '16-amino-acid peptide encoded in mitochondrial DNA (12S rRNA) acting as a mitonuclear metabolic-stress signal. Improves insulin sensitivity and prevents diet-induced obesity in rodents; in humans only a phase 1 trial of an analogue (CB4211) exists, with no further development.',
    },
    evidence: 'preclinical',
    regulatory: { us: 'research_only' },
    routes: ['sc'],
    defaultUnit: 'mg',
    dosing: {},
    monitoring: [
      {
        es: 'Glucosa en ayunas y HbA1c al inicio y a los 2–3 meses',
        en: 'Fasting glucose and HbA1c at baseline and after 2–3 months',
      },
      {
        es: 'Síntomas de hipoglucemia (temblor, sudor, mareo), sobre todo si se combina con otros fármacos que bajan la glucosa',
        en: 'Hypoglycaemia symptoms (shaking, sweating, dizziness), above all when combined with other glucose-lowering drugs',
      },
      {
        es: 'Peso y reacciones en el punto de inyección',
        en: 'Weight and injection-site reactions',
      },
    ],
    tags: ['mitocondrial', 'metabolico', 'obesidad', 'investigacion'],
  },
  {
    id: 'semax',
    names: {
      generic: 'Semax',
      brands: ['Semax (Семакс)'],
      aliases: [
        'Met-Glu-His-Phe-Pro-Gly-Pro',
        'ACTH(4–7)-PGP',
        'N-acetil semax amidato (derivado no registrado)',
      ],
    },
    category: 'cognitive',
    pharmClass: {
      es: 'Heptapéptido análogo de ACTH(4–7) sin actividad corticotropa (nootrópico/neuroprotector)',
      en: 'ACTH(4–7) heptapeptide analogue without corticotropic activity (nootropic/neuroprotective)',
    },
    summary: {
      es: 'Heptapéptido sintético (fragmento ACTH 4–7 + Pro-Gly-Pro) desarrollado en el Instituto de Genética Molecular de la Academia Rusa de Ciencias. Registrado en Rusia en gotas nasales para ictus isquémico, trastornos cognitivos y otras indicaciones neurológicas; la evidencia clínica es rusa, pequeña y de calidad metodológica limitada.',
      en: 'Synthetic heptapeptide (ACTH 4–7 fragment + Pro-Gly-Pro) developed at the Institute of Molecular Genetics, Russian Academy of Sciences. Registered in Russia as nasal drops for ischaemic stroke, cognitive disorders and other neurological indications; clinical evidence is Russian, small and of limited methodological quality.',
    },
    evidence: 'phase2',
    regulatory: { us: 'research_only' },
    routes: ['nasal'],
    defaultUnit: 'mcg',
    dosing: {},
    monitoring: [
      {
        es: 'Evaluación neurológica y cognitiva clínica en la indicación registrada',
        en: 'Clinical neurological and cognitive assessment in the registered indication',
      },
    ],
    tags: ['nootropico', 'intranasal', 'ictus', 'bdnf', 'rusia'],
  },
  {
    id: 'selank',
    names: {
      generic: 'Selank',
      brands: ['Selank (Селанк)'],
      aliases: [
        'Thr-Lys-Pro-Arg-Pro-Gly-Pro',
        'TP-7',
        'N-acetil selank amidato (derivado no registrado)',
      ],
    },
    category: 'cognitive',
    pharmClass: {
      es: 'Heptapéptido análogo de tuftsina (ansiolítico/inmunomodulador)',
      en: 'Tuftsin-analogue heptapeptide (anxiolytic/immunomodulator)',
    },
    summary: {
      es: 'Análogo sintético de la tuftsina (Thr-Lys-Pro-Arg) extendido con Pro-Gly-Pro, desarrollado en el Instituto de Genética Molecular (Rusia). Registrado en Rusia en gotas nasales como ansiolítico; los estudios clínicos son rusos, pequeños y mayoritariamente abiertos o frente a benzodiacepinas.',
      en: 'Synthetic tuftsin (Thr-Lys-Pro-Arg) analogue extended with Pro-Gly-Pro, developed at the Institute of Molecular Genetics (Russia). Registered in Russia as nasal drops for anxiety; clinical studies are Russian, small and mostly open-label or benzodiazepine-comparator.',
    },
    evidence: 'phase2',
    regulatory: { us: 'research_only' },
    routes: ['nasal'],
    defaultUnit: 'mcg',
    dosing: {},
    monitoring: [
      {
        es: 'Escalas de ansiedad clínicas si se usa en la indicación registrada',
        en: 'Clinical anxiety scales if used in the registered indication',
      },
    ],
    tags: ['ansiolitico', 'intranasal', 'tuftsina', 'rusia'],
  },
  {
    id: 'dihexa',
    names: {
      generic: 'Dihexa',
      brands: [],
      aliases: ['PNB-0408', 'N-hexanoil-Tyr-Ile-(6)-aminohexanoic amide'],
    },
    category: 'cognitive',
    pharmClass: {
      es: 'Análogo oligopeptídico de angiotensina IV; potenciador del sistema HGF/c-Met',
      en: 'Angiotensin IV oligopeptide analogue; HGF/c-Met system potentiator',
    },
    summary: {
      es: 'Derivado metabólicamente estabilizado de la angiotensina IV desarrollado en la Universidad Estatal de Washington (Harding, Wright). Activo por vía oral y penetrante en SNC en roedores, donde revierte déficits cognitivos inducidos. Solo existen datos preclínicos; ningún estudio en humanos.',
      en: 'Metabolically stabilised angiotensin IV derivative developed at Washington State University (Harding, Wright). Orally active and CNS-penetrant in rodents, where it reverses induced cognitive deficits. Preclinical data only; no human studies.',
    },
    evidence: 'preclinical',
    regulatory: { us: 'research_only' },
    routes: ['oral', 'topical', 'sc'],
    defaultUnit: 'mg',
    dosing: {},
    tags: ['nootropico', 'hgf', 'angiotensina', 'preclinico', 'investigacion'],
  },
  {
    id: 'epitalon',
    names: {
      generic: 'Epitalon',
      brands: [],
      aliases: ['Epithalon', 'Epithalone', 'Ala-Glu-Asp-Gly', 'AEDG'],
    },
    category: 'longevity',
    pharmClass: {
      es: 'Tetrapéptido "bioregulador" pineal de Khavinson (análogo sintético de la epitalamina)',
      en: 'Khavinson pineal "bioregulator" tetrapeptide (synthetic analogue of epithalamin)',
    },
    summary: {
      es: 'Tetrapéptido sintético (Ala-Glu-Asp-Gly) diseñado por el grupo de Khavinson a partir de la composición de la epitalamina, extracto de glándula pineal bovina. Popular como "antienvejecimiento" por supuesta activación de telomerasa; la evidencia procede casi exclusivamente de ese grupo, con estudios in vitro, en roedores y series humanas pequeñas o no controladas.',
      en: 'Synthetic tetrapeptide (Ala-Glu-Asp-Gly) designed by Khavinson\'s group based on the composition of epithalamin, a bovine pineal-gland extract. Popular as "anti-ageing" for claimed telomerase activation; evidence comes almost exclusively from that group, with in vitro, rodent and small or uncontrolled human series.',
    },
    evidence: 'preclinical',
    regulatory: { us: 'research_only' },
    routes: ['sc', 'im', 'nasal'],
    defaultUnit: 'mg',
    dosing: {},
    tags: ['longevidad', 'bioregulador', 'khavinson', 'telomerasa', 'pineal'],
  },
  {
    id: 'dsip',
    names: {
      generic: 'DSIP',
      brands: [],
      aliases: [
        'Delta sleep-inducing peptide',
        'Péptido inductor del sueño delta',
        'Emideltide',
        'Trp-Ala-Gly-Gly-Asp-Ala-Ser-Gly-Glu',
      ],
    },
    category: 'longevity',
    pharmClass: {
      es: 'Nonapéptido neuromodulador del sueño y del estrés (mecanismo desconocido)',
      en: 'Sleep- and stress-modulating nonapeptide (mechanism unknown)',
    },
    summary: {
      es: 'Nonapéptido aislado en 1977 de sangre venosa cerebral de conejos durante sueño inducido eléctricamente. Se estudió en los años 80 en insomnio y en abstinencia de opioides y alcohol con resultados pequeños e inconsistentes; no existe un receptor ni un gen propio identificados y no hay desarrollo clínico actual.',
      en: 'Nonapeptide isolated in 1977 from cerebral venous blood of rabbits during electrically induced sleep. Studied in the 1980s in insomnia and opioid/alcohol withdrawal with small and inconsistent results; no dedicated receptor or gene has been identified and there is no current clinical development.',
    },
    evidence: 'phase2',
    regulatory: { us: 'research_only' },
    routes: ['sc', 'iv', 'nasal'],
    defaultUnit: 'mcg',
    dosing: {},
    tags: ['sueno', 'insomnio', 'estres', 'investigacion'],
  },
  {
    id: 'aod-9604',
    names: {
      generic: 'AOD-9604',
      brands: [],
      aliases: ['Tyr-hGH(177-191)', 'Fragmento lipolítico de hGH', 'Advanced Obesity Drug 9604'],
    },
    category: 'metabolic',
    pharmClass: {
      es: 'Fragmento C-terminal modificado de la hormona de crecimiento (hGH 177-191 + Tyr)',
      en: 'Modified C-terminal growth hormone fragment (hGH 177-191 + Tyr)',
    },
    summary: {
      es: 'Hexadecapéptido derivado del extremo C-terminal de la hGH, diseñado para conservar el efecto lipolítico sin efectos sobre IGF-1 ni glucemia. Los ensayos de fase 2b en obesidad no mostraron pérdida de peso significativa frente a placebo y el desarrollo farmacéutico se abandonó (~2007).',
      en: 'Hexadecapeptide derived from the hGH C-terminus, designed to retain lipolytic activity without IGF-1 or glycaemic effects. Phase 2b obesity trials showed no significant weight loss versus placebo and pharmaceutical development was abandoned (~2007).',
    },
    evidence: 'anecdotal',
    regulatory: { us: 'research_only' },
    routes: ['sc', 'oral'],
    defaultUnit: 'mcg',
    dosing: {},
    monitoring: [
      {
        es: 'Peso y composición corporal para objetivar la ausencia/presencia de efecto',
        en: 'Weight and body composition to objectify presence/absence of effect',
      },
    ],
    tags: ['fragmento-gh', 'metabolico', 'obesidad', 'investigacion', 'fracasado'],
  },
  {
    id: 'elamipretide',
    names: {
      generic: 'Elamipretida',
      brands: ['Forzinity'],
      aliases: ['SS-31', 'MTP-131', 'Bendavia', 'D-Arg-Dmt-Lys-Phe-NH2'],
    },
    category: 'metabolic',
    pharmClass: {
      es: 'Tetrapéptido dirigido a la mitocondria (ligando de cardiolipina)',
      en: 'Mitochondria-targeted tetrapeptide (cardiolipin ligand)',
    },
    summary: {
      es: 'Tetrapéptido aromático-catiónico (Szeto-Schiller) que se concentra en la membrana mitocondrial interna. Según la información disponible, recibió aprobación acelerada de la FDA en septiembre de 2025 como Forzinity para el síndrome de Barth (pacientes ≥30 kg), basada en mejoría de fuerza muscular; confirmar en ficha técnica vigente. Fracasó en miopatía mitocondrial primaria (MMPOWER-3) y en otras indicaciones.',
      en: 'Aromatic-cationic (Szeto-Schiller) tetrapeptide that concentrates in the inner mitochondrial membrane. Per available information it received FDA accelerated approval in September 2025 as Forzinity for Barth syndrome (patients ≥30 kg), based on improved muscle strength; confirm against the current label. It failed in primary mitochondrial myopathy (MMPOWER-3) and other indications.',
    },
    evidence: 'fda_approved',
    regulatory: { us: 'approved', eu: 'investigational' },
    routes: ['sc', 'iv'],
    defaultUnit: 'mg',
    dosing: {},
    monitoring: [
      {
        es: 'Fuerza muscular (extensores de rodilla) y capacidad funcional (test de marcha de 6 min)',
        en: 'Muscle strength (knee extensors) and functional capacity (6-minute walk test)',
      },
      {
        es: 'Función cardiaca en síndrome de Barth (ecocardiografía)',
        en: 'Cardiac function in Barth syndrome (echocardiography)',
      },
      { es: 'Piel en zonas de inyección', en: 'Skin at injection sites' },
    ],
    tags: ['mitocondrial', 'cardiolipina', 'barth', 'enfermedad-rara', 'aprobado'],
  },
  {
    id: '5-amino-1mq',
    names: {
      generic: '5-Amino-1MQ',
      brands: [],
      aliases: ['5-amino-1-metilquinolinio', '5-amino-1-methylquinolinium', 'NNMTi'],
    },
    category: 'metabolic',
    pharmClass: {
      es: 'Inhibidor de molécula pequeña de la NNMT (NO es un péptido)',
      en: 'Small-molecule NNMT inhibitor (NOT a peptide)',
    },
    summary: {
      es: 'Catión de quinolinio metilado, de molécula pequeña (no peptídico), que inhibe la nicotinamida N-metiltransferasa. En ratones obesos por dieta redujo peso y masa grasa sin cambiar la ingesta. No existen ensayos clínicos publicados en humanos; se vende como cápsulas orales de "investigación".',
      en: 'Methylated quinolinium cation, a small molecule (non-peptide), that inhibits nicotinamide N-methyltransferase. In diet-induced obese mice it reduced weight and fat mass without changing food intake. No published human clinical trials exist; it is sold as oral "research" capsules.',
    },
    evidence: 'preclinical',
    regulatory: { us: 'research_only' },
    routes: ['oral'],
    defaultUnit: 'mg',
    dosing: {},
    tags: ['no-peptido', 'nnmt', 'nad', 'obesidad', 'oral', 'investigacion'],
  },
  {
    id: 'nad-plus',
    names: {
      generic: 'NAD+',
      brands: [],
      aliases: [
        'NAD',
        'NAD plus',
        'Nicotinamida adenina dinucleótido',
        'Nicotinamide adenine dinucleotide',
        'β-NAD',
      ],
    },
    category: 'metabolic',
    pharmClass: {
      es: 'Coenzima redox (dinucleótido; NO es un péptido)',
      en: 'Redox coenzyme (dinucleotide; NOT a peptide)',
    },
    summary: {
      es: 'Coenzima esencial del metabolismo energético y sustrato de sirtuinas y PARP; no es un péptido. Se administra en perfusiones IV o inyecciones SC en clínicas de "bienestar" y longevidad, sin ensayos controlados que demuestren beneficio clínico. Los estudios humanos controlados existentes son con precursores orales (NR, NMN), no con NAD+ parenteral.',
      en: 'Essential coenzyme of energy metabolism and substrate of sirtuins and PARPs; not a peptide. Given as IV infusions or SC injections in "wellness" and longevity clinics, without controlled trials showing clinical benefit. Existing controlled human studies use oral precursors (NR, NMN), not parenteral NAD+.',
    },
    evidence: 'anecdotal',
    regulatory: { us: 'compounded' },
    routes: ['iv', 'sc'],
    defaultUnit: 'mg',
    dosing: {},
    monitoring: [
      {
        es: 'Tensión arterial y síntomas durante la perfusión; ajustar velocidad',
        en: 'Blood pressure and symptoms during infusion; adjust rate',
      },
      {
        es: 'Vía SC: rubor, náuseas o calambres tras la dosis y reacciones locales',
        en: 'SC route: flushing, nausea or cramps after the dose and local reactions',
      },
      {
        es: 'No hay un marcador útil: el NAD+ en sangre no se mide en analíticas de rutina',
        en: 'There is no useful marker: blood NAD+ is not measured in routine lab tests',
      },
    ],
    tags: ['no-peptido', 'nad', 'longevidad', 'intravenoso', 'magistral'],
  },
  {
    id: 'pt-141',
    names: { generic: 'Bremelanotida', brands: ['Vyleesi'], aliases: ['PT-141', 'Bremelanotide'] },
    category: 'sexual',
    pharmClass: {
      es: 'Agonista no selectivo de receptores de melanocortinas (principalmente MC4R)',
      en: 'Non-selective melanocortin receptor agonist (mainly MC4R)',
    },
    summary: {
      es: 'Heptapéptido cíclico (metabolito/derivado de melanotan II) aprobado por la FDA en 2019 como Vyleesi para el trastorno del deseo sexual hipoactivo (HSDD) adquirido y generalizado en mujeres premenopáusicas. Se administra a demanda, SC, ≥45 min antes de la actividad sexual. Beneficio modesto en deseo y malestar asociado (RECONNECT).',
      en: 'Cyclic heptapeptide (metabolite/derivative of melanotan II) FDA-approved in 2019 as Vyleesi for acquired, generalised hypoactive sexual desire disorder (HSDD) in premenopausal women. Given on demand, SC, ≥45 min before sexual activity. Modest benefit on desire and related distress (RECONNECT).',
    },
    evidence: 'fda_approved',
    regulatory: { us: 'approved' },
    routes: ['sc'],
    defaultUnit: 'mg',
    pk: {
      halfLifeH: 2.7,
      tmaxH: 1,
      bioavailability: 1,
      apparentVolumeL: 25,
      molarMassGPerMol: 1025.2,
    },
    dosing: {},
    monitoring: [
      {
        es: 'Tensión arterial basal y en las primeras dosis',
        en: 'Blood pressure at baseline and with the first doses',
      },
      { es: 'Piel y encías (hiperpigmentación)', en: 'Skin and gums (hyperpigmentation)' },
      {
        es: 'Respuesta a 8 semanas (deseo, malestar)',
        en: 'Response at 8 weeks (desire, distress)',
      },
    ],
    tags: ['melanocortina', 'deseo-sexual', 'hsdd', 'aprobado', 'a-demanda'],
  },
  {
    id: 'melanotan-ii',
    names: {
      generic: 'Melanotan II',
      brands: [],
      aliases: ['MT-II', 'MT2', 'Ac-Nle-c[Asp-His-D-Phe-Arg-Trp-Lys]-NH2'],
    },
    category: 'sexual',
    pharmClass: {
      es: 'Análogo cíclico de α-MSH, agonista no selectivo de melanocortinas (MC1R, MC3R, MC4R, MC5R)',
      en: 'Cyclic α-MSH analogue, non-selective melanocortin agonist (MC1R, MC3R, MC4R, MC5R)',
    },
    summary: {
      es: 'Lactama cíclica desarrollada en la Universidad de Arizona (años 90) como agente de bronceado; en estudios piloto produjo erecciones espontáneas, lo que originó la bremelanotida. Nunca se aprobó; se vende ilegalmente para bronceado, libido y pérdida de apetito. Riesgos pigmentarios (nevus nuevos, casos de melanoma) y priapismo.',
      en: 'Cyclic lactam developed at the University of Arizona (1990s) as a tanning agent; in pilot studies it produced spontaneous erections, which led to bremelanotide. Never approved; sold illegally for tanning, libido and appetite suppression. Pigmentary risks (new naevi, melanoma cases) and priapism.',
    },
    evidence: 'anecdotal',
    regulatory: { us: 'research_only', eu: 'research_only' },
    routes: ['sc', 'nasal'],
    defaultUnit: 'mg',
    dosing: {},
    monitoring: [
      {
        es: 'Exploración dermatológica con dermatoscopia basal y periódica',
        en: 'Dermatological examination with dermoscopy at baseline and periodically',
      },
      { es: 'Tensión arterial', en: 'Blood pressure' },
    ],
    tags: ['melanocortina', 'bronceado', 'libido', 'mercado-gris', 'riesgo-melanoma'],
  },
  {
    id: 'oxytocin',
    names: { generic: 'Oxitocina', brands: ['Pitocin', 'Syntocinon'], aliases: ['Oxytocin', 'OT'] },
    category: 'sexual',
    pharmClass: {
      es: 'Hormona neurohipofisaria (nonapéptido), agonista del receptor de oxitocina',
      en: 'Neurohypophyseal hormone (nonapeptide), oxytocin receptor agonist',
    },
    summary: {
      es: 'Nonapéptido hipotalámico aprobado por vía IV/IM para inducción y estimulación del parto y para la hemorragia posparto. El uso intranasal para conducta social, autismo, libido u obesidad es fuera de ficha y los ensayos grandes (p. ej. en autismo) han sido negativos. Semivida IV de pocos minutos.',
      en: 'Hypothalamic nonapeptide approved IV/IM for labour induction and augmentation and for postpartum haemorrhage. Intranasal use for social behaviour, autism, libido or obesity is off-label and large trials (e.g. in autism) have been negative. IV half-life of a few minutes.',
    },
    evidence: 'fda_approved',
    regulatory: { us: 'approved', eu: 'approved' },
    routes: ['iv', 'im', 'nasal'],
    defaultUnit: 'iu',
    pk: { halfLifeH: 0.075, molarMassGPerMol: 1007.2 },
    dosing: {},
    monitoring: [
      {
        es: 'Dinámica uterina y registro cardiotocográfico continuo',
        en: 'Uterine activity and continuous cardiotocography',
      },
      {
        es: 'Balance hídrico y sodio sérico en perfusiones prolongadas',
        en: 'Fluid balance and serum sodium with prolonged infusions',
      },
      { es: 'Tensión arterial y frecuencia cardiaca', en: 'Blood pressure and heart rate' },
    ],
    tags: ['oxitocina', 'obstetricia', 'intranasal', 'aprobado', 'fuera-de-ficha'],
  },
]

export const BLEND_META: readonly CompoundMeta[] = [
  {
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
    pharmClass: {
      es: 'Blend premezclado 1:1: análogo de GHRH de acción corta + secretagogo de GH (GHRP)',
      en: 'Premixed 1:1 blend: short-acting GHRH analogue + GH secretagogue (GHRP)',
    },
    summary: {
      es: 'Vial liofilizado con CJC-1295 sin DAC (Mod GRF 1-29) e ipamorelina a partes iguales, normalmente 5 + 5 mg. Cada dosis lleva la misma cantidad de ambos, así que se inyectan juntos en un solo pinchazo. Es la combinación de secretagogos de GH más vendida, pero nunca se ha probado como tal en humanos.',
      en: 'Lyophilised vial with DAC-free CJC-1295 (Mod GRF 1-29) and ipamorelin in equal parts, usually 5 + 5 mg. Every dose carries the same amount of both, so they are injected together in one shot. It is the best-selling GH-secretagogue combination, but it has never been tested as such in humans.',
    },
    evidence: 'anecdotal',
    regulatory: { us: 'research_only' },
    routes: ['sc'],
    defaultUnit: 'mcg',
    dosing: {},
    monitoring: [
      {
        es: 'IGF-1 antes de empezar y a las 4–8 semanas',
        en: 'IGF-1 before starting and at 4–8 weeks',
      },
      { es: 'Glucosa en ayunas y HbA1c', en: 'Fasting glucose and HbA1c' },
      {
        es: 'Peso, edemas, tensión arterial y hormigueo en manos',
        en: 'Weight, oedema, blood pressure and tingling in the hands',
      },
    ],
    tags: ['blend', 'mezcla', 'premezclado', 'ghrh', 'ghrp', 'gh', 'cjc-1295', 'ipamorelina'],
    blend: {
      components: [
        { compoundId: 'mod-grf-1-29', mg: 5 },
        { compoundId: 'ipamorelin', mg: 5 },
      ],
      presetId: 'cjc-ipa-10',
      exampleDiluentMl: 3,
    },
  },
  {
    id: 'blend-klow',
    names: {
      generic: 'KLOW',
      brands: [],
      aliases: ['KLOW 80', 'KLOW 80 mg', 'KLOW blend', 'GHK-Cu + BPC-157 + TB-500 + KPV'],
    },
    category: 'repair',
    pharmClass: {
      es: 'Blend premezclado de cuatro péptidos de reparación: GHK-Cu + BPC-157 + TB-500 + KPV',
      en: 'Premixed blend of four repair peptides: GHK-Cu + BPC-157 + TB-500 + KPV',
    },
    summary: {
      es: 'Vial de 80 mg que suele llevar GHK-Cu 50 mg, BPC-157 10 mg, TB-500 10 mg y KPV 10 mg. Es GLOW con KPV añadido. Se vende para piel, tejidos y recuperación de lesiones. Los cuatro componentes solo tienen datos en animales o in vitro, y la mezcla nunca se ha estudiado.',
      en: '80 mg vial that usually holds GHK-Cu 50 mg, BPC-157 10 mg, TB-500 10 mg and KPV 10 mg. It is GLOW with KPV added. Marketed for skin, tissue and injury recovery. All four components have only animal or in vitro data, and the mixture has never been studied.',
    },
    evidence: 'preclinical',
    regulatory: { us: 'research_only' },
    routes: ['sc'],
    defaultUnit: 'mg',
    dosing: {},
    monitoring: [
      {
        es: 'Evolución de la lesión o de la piel (no hay marcadores validados)',
        en: 'Course of the injury or the skin (no validated markers)',
      },
      {
        es: 'Reacciones locales y signos de infección en el punto de inyección',
        en: 'Local reactions and signs of infection at the injection site',
      },
      {
        es: 'Uso prolongado: cobre en sangre, ceruloplasmina y perfil hepático',
        en: 'Prolonged use: blood copper, ceruloplasmin and liver tests',
      },
      {
        es: 'Cribado de cáncer adecuado a la edad antes de un uso largo',
        en: 'Age-appropriate cancer screening before long use',
      },
    ],
    tags: ['blend', 'mezcla', 'premezclado', 'reparación', 'cobre', 'piel', 'bpc-157', 'tb-500'],
    blend: {
      components: [
        { compoundId: 'ghk-cu', mg: 50 },
        { compoundId: 'bpc-157', mg: 10 },
        { compoundId: 'tb-500', mg: 10 },
        { compoundId: 'kpv', mg: 10 },
      ],
      presetId: 'klow-80',
      exampleDiluentMl: 3,
    },
  },
  {
    id: 'blend-glow',
    names: {
      generic: 'GLOW',
      brands: [],
      aliases: ['GLOW 70', 'GLOW 70 mg', 'GLOW blend', 'GHK-Cu + BPC-157 + TB-500'],
    },
    category: 'repair',
    pharmClass: {
      es: 'Blend premezclado de tres péptidos de reparación: GHK-Cu + BPC-157 + TB-500',
      en: 'Premixed blend of three repair peptides: GHK-Cu + BPC-157 + TB-500',
    },
    summary: {
      es: 'Vial de 70 mg que suele llevar GHK-Cu 50 mg, BPC-157 10 mg y TB-500 10 mg. Es KLOW sin KPV. Se vende sobre todo para piel y reparación de tejidos. Los tres componentes solo tienen datos en animales o in vitro, y la mezcla nunca se ha estudiado.',
      en: '70 mg vial that usually holds GHK-Cu 50 mg, BPC-157 10 mg and TB-500 10 mg. It is KLOW without KPV. Marketed mainly for skin and tissue repair. All three components have only animal or in vitro data, and the mixture has never been studied.',
    },
    evidence: 'preclinical',
    regulatory: { us: 'research_only' },
    routes: ['sc'],
    defaultUnit: 'mg',
    dosing: {},
    monitoring: [
      {
        es: 'Evolución de la lesión o de la piel (no hay marcadores validados)',
        en: 'Course of the injury or the skin (no validated markers)',
      },
      {
        es: 'Reacciones locales y signos de infección en el punto de inyección',
        en: 'Local reactions and signs of infection at the injection site',
      },
      {
        es: 'Uso prolongado: cobre en sangre, ceruloplasmina y perfil hepático',
        en: 'Prolonged use: blood copper, ceruloplasmin and liver tests',
      },
      {
        es: 'Cribado de cáncer adecuado a la edad antes de un uso largo',
        en: 'Age-appropriate cancer screening before long use',
      },
    ],
    tags: ['blend', 'mezcla', 'premezclado', 'reparación', 'cobre', 'piel', 'bpc-157', 'tb-500'],
    blend: {
      components: [
        { compoundId: 'ghk-cu', mg: 50 },
        { compoundId: 'bpc-157', mg: 10 },
        { compoundId: 'tb-500', mg: 10 },
      ],
      presetId: 'glow-70',
      exampleDiluentMl: 3,
    },
  },
]
