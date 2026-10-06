import { t, type CompoundDetail } from '../schema'

/**
 * Investigational incretin-class agents: multi-agonists, amylin analogues,
 * fixed-dose combinations, oral non-peptide GLP-1 receptor agonists and
 * long-acting antibody-peptide conjugates. None is FDA-approved; all PK values
 * come from published phase 1/2/3 data and may change with the final label.
 * Mazdutide is approved in China only.
 */

// ---------------------------------------------------------------------------
// Triple and dual agonists
// ---------------------------------------------------------------------------

const retatrutide: CompoundDetail = {
  id: 'retatrutide',
  names: {
    generic: 'Retatrutida',
    brands: [],
    aliases: ['LY3437943', 'Retatrutide', 'Reta', 'triple G', 'GGG tri-agonista'],
  },
  category: 'incretin',
  pharmClass: t(
    'Triple agonista de los receptores GIP/GLP-1/glucagón (acción semanal)',
    'Triple GIP/GLP-1/glucagon receptor agonist (once weekly)',
  ),
  summary: t(
    'Péptido único de 39 aminoácidos acilado con un diácido graso C20 que activa simultáneamente los receptores de GIP, GLP-1 y glucagón. En el fase 2 en obesidad la pérdida media de peso a 48 semanas fue del −8,7 % con 1 mg al −24,2 % con 12 mg (placebo −2,1 %). Está en fase 3 (programa TRIUMPH) y no está aprobada en ningún país.',
    'Single 39-amino-acid peptide acylated with a C20 fatty diacid that simultaneously activates the GIP, GLP-1 and glucagon receptors. In the phase 2 obesity trial mean weight loss at 48 weeks ranged from −8.7% with 1 mg to −24.2% with 12 mg (placebo −2.1%). It is in phase 3 (TRIUMPH programme) and not approved anywhere.',
  ),
  mechanism: t(
    'Combina la anorexia y la insulinotropía dependiente de glucosa de GLP-1 y GIP con el componente glucagónico, que aumenta el gasto energético y la lipólisis hepática. El brazo glucagón explica parte de la pérdida de grasa hepática y también el aumento de frecuencia cardíaca observado. Potencia relativa sesgada hacia GIP y glucagón, con agonismo GLP-1 más débil que la semaglutida a nivel molar.',
    'Combines the anorectic and glucose-dependent insulinotropic actions of GLP-1 and GIP with a glucagon component that raises energy expenditure and hepatic lipolysis. The glucagon arm accounts for part of the hepatic fat loss and also for the observed heart-rate increase. Relative potency is biased towards GIP and glucagon, with weaker GLP-1 agonism than semaglutide on a molar basis.',
  ),
  indications: [
    t(
      'Obesidad y sobrepeso con comorbilidad (fase 2 publicada; fase 3 TRIUMPH en curso)',
      'Obesity and overweight with comorbidity (published phase 2; phase 3 TRIUMPH ongoing)',
    ),
    t(
      'Diabetes tipo 2 (fase 2 publicada; en fase 3)',
      'Type 2 diabetes (published phase 2; in phase 3)',
    ),
    t(
      'Esteatosis hepática metabólica (MASLD): marcada reducción de grasa hepática en un subestudio de fase 2 (cifras pendientes de verificar)',
      'Metabolic dysfunction-associated steatotic liver disease (MASLD): marked liver-fat reduction in a phase 2 substudy (figures pending verification)',
    ),
    t(
      'Artrosis de rodilla asociada a obesidad y apnea del sueño (subestudios fase 3)',
      'Obesity-related knee osteoarthritis and sleep apnoea (phase 3 substudies)',
    ),
  ],
  evidence: 'phase3',
  regulatory: {
    us: 'investigational',
    eu: 'investigational',
    notes: t(
      'No aprobado en ninguna jurisdicción. El producto vendido como «retatrutida» en el mercado gris de péptidos de investigación no tiene control de calidad, potencia ni esterilidad garantizadas; no es el mismo material del ensayo.',
      'Not approved in any jurisdiction. Material sold as "retatrutide" on the research-peptide grey market has no guaranteed quality, potency or sterility; it is not the trial material.',
    ),
  },
  routes: ['sc'],
  defaultUnit: 'mg',
  pk: {
    halfLifeH: 144,
    tmaxH: 36,
    molarMassGPerMol: 4731,
    source:
      'Datos en investigación: fase 1 de dosis múltiples y fase 2 de retatrutida (LY3437943; Coskun et al., Cell Metab 2022; Jastreboff et al., NEJM 2023). t½ ≈ 6 días (~144 h), tmax ~24–48 h, compatible con administración semanal.',
    notes:
      'Parámetros de ensayo clínico, no de ficha técnica; pueden cambiar en el registro final. Estado estacionario a las ~4 semanas.',
  },
  dosing: {
    investigational: t(
      'Fase 2 en obesidad (Jastreboff, NEJM 2023): 1, 4, 8 o 12 mg/semana frente a placebo durante 48 semanas. El brazo de 1 mg se mantuvo en 1 mg desde el inicio, sin escalada. Los de 4, 8 y 12 mg subían por escalones cada 4 semanas, empezando en 2 mg (algunos brazos de 4 y 8 mg empezaban directamente en 4 mg); el de 12 mg hacía 2 → 4 → 8 → 12 mg. Empezar en 2 mg dio menos síntomas digestivos. Cambio medio de peso a 24 semanas: 1 mg −7,2 %, 4 mg −12,9 %, 8 mg −17,3 %, 12 mg −17,5 %, placebo −1,6 %. A 48 semanas: 1 mg −8,7 %, 4 mg −17,1 %, 8 mg −22,8 %, 12 mg −24,2 %, placebo −2,1 %. Las dosis intermedias (p. ej. 2,5 mg de mantenimiento) no se estudiaron como brazo propio. El programa TRIUMPH también escala por escalones; no hay dosis aprobada.',
      'Phase 2 obesity trial (Jastreboff, NEJM 2023): 1, 4, 8 or 12 mg weekly versus placebo for 48 weeks. The 1 mg arm stayed at 1 mg from the start, with no escalation. The 4, 8 and 12 mg arms stepped up every 4 weeks, starting at 2 mg (some 4 and 8 mg arms started directly at 4 mg); the 12 mg arm went 2 → 4 → 8 → 12 mg. Starting at 2 mg gave fewer GI symptoms. Mean weight change at 24 weeks: 1 mg −7.2%, 4 mg −12.9%, 8 mg −17.3%, 12 mg −17.5%, placebo −1.6%. At 48 weeks: 1 mg −8.7%, 4 mg −17.1%, 8 mg −22.8%, 12 mg −24.2%, placebo −2.1%. In-between doses (e.g. 2.5 mg maintenance) were not studied as an arm of their own. The TRIUMPH programme also escalates stepwise; there is no approved dose.',
    ),
    anecdotal: t(
      'Uso no aprobado — con material del mercado de investigación es habitual empezar en 1 mg/semana y subir despacio (p. ej. 1 → 2 → 2,5 mg) según la tolerancia digestiva, por debajo de las dosis altas del ensayo. Son pautas comunitarias sin ensayo que las respalde.',
      'Unapproved use — with research-market material it is common to start at 1 mg weekly and step up slowly (e.g. 1 → 2 → 2.5 mg) by GI tolerance, below the trial’s high doses. These are community schedules with no trial behind them.',
    ),
    frequency: t('1×/semana', 'Once weekly'),
    templateIds: ['retatrutide-triumph'],
  },
  reconstitution: t(
    'En los ensayos se usa producto listo para inyectar; no hay presentación comercial. El polvo liofilizado del mercado de investigación no garantiza contenido ni esterilidad. Ejemplo con jeringa U-100 (1 U = 0,01 mL): vial de 15 mg + 1,5 mL de agua bacteriostática = 10 mg/mL, así que 1 U = 0,1 mg → 1 mg = 10 U, 2 mg = 20 U, 2,5 mg = 25 U. Un vial de 10 mg + 1 mL da la misma concentración. Añadir el agua por la pared del vial y disolver girando, sin agitar.',
    'Trials use a ready-to-inject product; there is no commercial presentation. Lyophilised powder from the research market guarantees neither content nor sterility. Example with a U-100 syringe (1 U = 0.01 mL): 15 mg vial + 1.5 mL bacteriostatic water = 10 mg/mL, so 1 U = 0.1 mg → 1 mg = 10 U, 2 mg = 20 U, 2.5 mg = 25 U. A 10 mg vial + 1 mL gives the same concentration. Run the water down the vial wall and dissolve by swirling, do not shake.',
  ),
  storage: t(
    'Liofilizado: nevera 2–8 °C, protegido de la luz; −20 °C para guardarlo meses. Reconstituido: nevera, no congelar. Habitualmente se indica usarlo en 28–30 días: es orientación de fabricantes y de la comunidad, sin datos de estabilidad publicados (el límite de 28 días viene de la norma USP <797> para viales multidosis y se refiere a la esterilidad). Tampoco hay datos públicos a temperatura ambiente.',
    'Lyophilised: fridge 2–8 °C, protected from light; −20 °C to keep it for months. Reconstituted: fridge, do not freeze. The usual guidance is to use it within 28–30 days: this is manufacturer and community guidance with no published stability data (the 28-day limit comes from USP <797> for multiple-dose vials and concerns sterility). There are no public room-temperature data either.',
  ),
  adverseEffects: {
    common: [
      t(
        'Náuseas, vómitos y diarrea, dependientes de la dosis y sobre todo durante la escalada; menos frecuentes empezando en 2 mg que en 4 mg',
        'Nausea, vomiting and diarrhoea, dose-dependent and mostly during escalation; less frequent when starting at 2 mg than at 4 mg',
      ),
      t('Estreñimiento, dolor abdominal, dispepsia', 'Constipation, abdominal pain, dyspepsia'),
      t(
        'Aumento de la frecuencia cardíaca dependiente de la dosis, máximo hacia la semana 24 y menor después',
        'Dose-dependent heart-rate increase, peaking around week 24 and declining afterwards',
      ),
      t(
        'Reacciones en el punto de inyección; caída de pelo descrita con pérdidas de peso rápidas',
        'Injection-site reactions; hair loss reported with rapid weight loss',
      ),
    ],
    serious: [
      t(
        'Deshidratación y lesión renal aguda por vómitos o diarrea intensos',
        'Dehydration and acute kidney injury from severe vomiting or diarrhoea',
      ),
      t(
        'Pancreatitis aguda (esperable de clase; casos aislados en fase 2)',
        'Acute pancreatitis (class effect; isolated phase 2 cases)',
      ),
      t(
        'Colelitiasis/colecistitis asociada a pérdida rápida de peso',
        'Cholelithiasis/cholecystitis with rapid weight loss',
      ),
      t(
        'Pérdida excesiva de masa magra con pérdidas ponderales >20%',
        'Excessive lean-mass loss with >20% weight reduction',
      ),
    ],
  },
  contraindications: [
    t(
      'Antecedente personal o familiar de carcinoma medular de tiroides o MEN2: se aplica la advertencia de clase de los agonistas peptídicos de GLP-1 (tumores de células C en roedores)',
      'Personal or family history of medullary thyroid carcinoma or MEN2: the peptide GLP-1 RA class boxed warning applies (rodent C-cell tumours)',
    ),
    t(
      'Pancreatitis previa; gastroparesia establecida',
      'Prior pancreatitis; established gastroparesis',
    ),
    t(
      'Embarazo y lactancia; anticoncepción eficaz durante el tratamiento',
      'Pregnancy and breastfeeding; effective contraception during treatment',
    ),
    t(
      'Uso fuera de ensayo clínico: no existe indicación aprobada',
      'Use outside a clinical trial: there is no approved indication',
    ),
  ],
  interactions: [
    t(
      'Insulina y sulfonilureas: reducir dosis por riesgo de hipoglucemia',
      'Insulin and sulfonylureas: reduce dose because of hypoglycaemia risk',
    ),
    t(
      'Fármacos orales de ventana estrecha (levotiroxina, warfarina, antiepilépticos): el vaciamiento gástrico retrasado altera la absorción',
      'Narrow-window oral drugs (levothyroxine, warfarin, antiepileptics): delayed gastric emptying alters absorption',
    ),
    t(
      'Anestesia general/sedación: riesgo de contenido gástrico residual; seguir las recomendaciones de ayuno prolongado',
      'General anaesthesia/sedation: residual gastric content risk; follow prolonged-fasting guidance',
    ),
  ],
  monitoring: [
    t(
      'Peso, perímetro abdominal y composición corporal (masa magra)',
      'Weight, waist circumference and body composition (lean mass)',
    ),
    t(
      'Frecuencia cardíaca y presión arterial en cada escalón de dosis',
      'Heart rate and blood pressure at each dose step',
    ),
    t(
      'Glucosa y HbA1c; con insulina o sulfonilureas, riesgo de hipoglucemia al bajar de peso',
      'Glucose and HbA1c; with insulin or sulfonylureas, hypoglycaemia risk as weight falls',
    ),
    t(
      'Síntomas digestivos y lo que se come en cada escalón: con poca proteína se pierde más masa magra',
      'GI symptoms and food intake at each step: with little protein more lean mass is lost',
    ),
    t(
      'Función renal e hidratación durante la escalada',
      'Renal function and hydration during escalation',
    ),
    t(
      'Transaminasas y grasa hepática si indicación MASH',
      'Transaminases and hepatic fat if MASH is the indication',
    ),
  ],
  keyTrials: [
    {
      name: 'Fase 2 obesidad (Jastreboff)',
      year: 2023,
      finding: t(
        'Adultos con obesidad sin diabetes. Cambio medio de peso a 48 semanas: 1 mg −8,7 %, 4 mg −17,1 %, 8 mg −22,8 %, 12 mg −24,2 %, placebo −2,1 % (a 24 semanas: −7,2, −12,9, −17,3, −17,5 y −1,6 %). Con 12 mg la pérdida no se había estabilizado al final del estudio.',
        'Adults with obesity without diabetes. Mean weight change at 48 weeks: 1 mg −8.7%, 4 mg −17.1%, 8 mg −22.8%, 12 mg −24.2%, placebo −2.1% (at 24 weeks: −7.2, −12.9, −17.3, −17.5 and −1.6%). With 12 mg weight loss had not plateaued by the end of the study.',
      ),
      ref: 'NEJM 2023;389:514',
    },
    {
      name: 'Fase 2 DM2 (Rosenstock)',
      year: 2023,
      finding: t(
        'HbA1c −2,02% a 36 semanas con 12 mg y pérdida de peso de hasta −16,9%.',
        'HbA1c −2.02% at 36 weeks with 12 mg and weight loss up to −16.9%.',
      ),
      ref: 'Lancet 2023;402:529',
    },
    {
      name: 'TRIUMPH (programa fase 3)',
      year: 2025,
      finding: t(
        'Programa de fase 3 en obesidad, diabetes tipo 2, artrosis de rodilla y apnea del sueño. Esta ficha no recoge resultados de fase 3: consultar cada publicación.',
        'Phase 3 programme in obesity, type 2 diabetes, knee osteoarthritis and sleep apnoea. This entry does not include phase 3 results: check each publication.',
      ),
    },
  ],
  references: [
    {
      label:
        'Jastreboff AM et al. Triple-Hormone-Receptor Agonist Retatrutide for Obesity — A Phase 2 Trial. NEJM 2023',
    },
    {
      label:
        'Coskun T et al. LY3437943, a novel triple GIP/GLP-1/glucagon receptor agonist. Cell Metab 2022',
    },
    { label: 'Eli Lilly TRIUMPH clinical programme (investigational)' },
  ],
  tags: ['glp1', 'gip', 'glucagón', 'triple agonista', 'obesidad', 'semanal', 'investigacional'],
  lastReviewed: '2026-09-30',
}

const survodutide: CompoundDetail = {
  id: 'survodutide',
  names: {
    generic: 'Survodutida',
    brands: [],
    aliases: ['BI 456906', 'SAR441255'],
  },
  category: 'incretin',
  pharmClass: t(
    'Doble agonista del receptor de glucagón y GLP-1 (acción semanal)',
    'Dual glucagon/GLP-1 receptor agonist (once weekly)',
  ),
  summary: t(
    'Péptido acilado basado en glucagón que actúa como doble agonista glucagón/GLP-1, desarrollado por Boehringer Ingelheim y Zealand Pharma. En fase 2 logró −18,7% de peso a 46 semanas y una tasa de resolución de MASH del 62–83%. En fase 3 (programa SYNCHRONIZE) para obesidad y en fase 3 para MASH.',
    'Acylated glucagon-based peptide acting as a dual glucagon/GLP-1 agonist, developed by Boehringer Ingelheim and Zealand Pharma. In phase 2 it achieved −18.7% weight at 46 weeks and 62–83% MASH resolution. In phase 3 (SYNCHRONIZE programme) for obesity and phase 3 for MASH.',
  ),
  mechanism: t(
    'El componente GLP-1 reduce el apetito y mejora la glucemia; el componente glucagónico aumenta el gasto energético basal, la oxidación lipídica y la movilización de grasa hepática, lo que explica su efecto pronunciado sobre la esteatosis y la fibrosis. La relación de potencia glucagón:GLP-1 es más equilibrada que en otros duales, lo que aumenta el efecto termogénico pero también la frecuencia cardíaca.',
    'The GLP-1 component reduces appetite and improves glycaemia; the glucagon component raises basal energy expenditure, lipid oxidation and hepatic fat mobilisation, explaining its pronounced effect on steatosis and fibrosis. The glucagon:GLP-1 potency ratio is more balanced than in other duals, increasing thermogenesis but also heart rate.',
  ),
  indications: [
    t(
      'Obesidad y sobrepeso con comorbilidad (SYNCHRONIZE-1/-2/-CVOT)',
      'Obesity and overweight with comorbidity (SYNCHRONIZE-1/-2/-CVOT)',
    ),
    t(
      'MASH con fibrosis F2–F3 (fase 2 positiva; fase 3 LIVERAGE en curso)',
      'MASH with F2–F3 fibrosis (positive phase 2; phase 3 LIVERAGE ongoing)',
    ),
    t('Diabetes mellitus tipo 2 (SYNCHRONIZE-2)', 'Type 2 diabetes (SYNCHRONIZE-2)'),
  ],
  evidence: 'phase3',
  regulatory: {
    us: 'investigational',
    eu: 'investigational',
    notes: t(
      'No aprobado. Designación de vía rápida de la FDA para MASH con fibrosis. Sin ficha técnica publicada.',
      'Not approved. FDA fast-track designation for MASH with fibrosis. No published prescribing information.',
    ),
  },
  routes: ['sc'],
  defaultUnit: 'mg',
  pk: {
    halfLifeH: 146,
    tmaxH: 48,
    source:
      'Datos en investigación: fase 1 de dosis única/múltiple de survodutida (BI 456906) y programa fase 2/3. t½ ≈ 6 días (~146 h), tmax ~24–72 h; soporta dosificación semanal.',
    notes:
      'Cifras de ensayo clínico, no de ficha técnica. La escalada rápida aumenta notablemente los efectos GI.',
  },
  dosing: {
    investigational: t(
      'Fase 2: escalada desde 0,3 mg/semana doblando cada 2–4 semanas hasta 3,6, 4,8 o 6,0 mg/semana. Fase 3 usa mantenimiento de 3,6–6,0 mg/semana con escalada lenta para mitigar náuseas. Sin dosis aprobada.',
      'Phase 2: escalation from 0.3 mg weekly, doubling every 2–4 weeks to 3.6, 4.8 or 6.0 mg weekly. Phase 3 uses 3.6–6.0 mg weekly maintenance with slow escalation to mitigate nausea. No approved dose.',
    ),
    frequency: t('1×/semana', 'Once weekly'),
  },
  reconstitution: t(
    'Administrada en los ensayos mediante pluma/autoinyector precargado listo para usar; no requiere reconstitución ni existe vial comercial.',
    'Given in trials as a ready-to-use prefilled pen/autoinjector; no reconstitution and no commercial vial.',
  ),
  storage: t(
    'Producto de ensayo: 2–8 °C, protegido de la luz, sin congelar. No hay datos públicos de estabilidad a temperatura ambiente.',
    'Investigational product: 2–8 °C, protect from light, do not freeze. No public room-temperature stability data.',
  ),
  adverseEffects: {
    common: [
      t(
        'Náuseas (hasta ~55% con escalada rápida), vómitos, diarrea',
        'Nausea (up to ~55% with fast escalation), vomiting, diarrhoea',
      ),
      t(
        'Estreñimiento, dispepsia, disminución del apetito',
        'Constipation, dyspepsia, decreased appetite',
      ),
      t('Aumento de frecuencia cardíaca (~5–7 lpm)', 'Heart-rate increase (~5–7 bpm)'),
      t('Fatiga y cefalea durante la escalada', 'Fatigue and headache during escalation'),
    ],
    serious: [
      t(
        'Abandono por intolerancia GI en hasta ~20–25% con escalada rápida',
        'Discontinuation for GI intolerance in up to ~20–25% with fast escalation',
      ),
      t('Pancreatitis aguda (efecto de clase)', 'Acute pancreatitis (class effect)'),
      t('Colelitiasis/colecistitis', 'Cholelithiasis/cholecystitis'),
      t('Deshidratación con deterioro renal', 'Dehydration with renal impairment'),
      t(
        'Descontrol glucémico transitorio por agonismo glucagónico',
        'Transient glycaemic worsening from glucagon agonism',
      ),
    ],
  },
  contraindications: [
    t(
      'Antecedente personal o familiar de carcinoma medular de tiroides o MEN2 (advertencia de clase de los agonistas peptídicos de GLP-1)',
      'Personal or family history of medullary thyroid carcinoma or MEN2 (peptide GLP-1 RA class warning)',
    ),
    t('Pancreatitis previa o gastroparesia', 'Prior pancreatitis or gastroparesis'),
    t('Embarazo y lactancia', 'Pregnancy and breastfeeding'),
    t(
      'Hipersensibilidad conocida a análogos peptídicos de glucagón',
      'Known hypersensitivity to glucagon peptide analogues',
    ),
  ],
  interactions: [
    t(
      'Insulina y sulfonilureas: ajustar por hipoglucemia',
      'Insulin and sulfonylureas: adjust for hypoglycaemia',
    ),
    t(
      'Orales de absorción crítica: vigilar por vaciamiento gástrico retrasado',
      'Absorption-critical oral drugs: monitor due to delayed gastric emptying',
    ),
    t(
      'Betabloqueantes: pueden enmascarar el aumento de frecuencia cardíaca',
      'Beta-blockers: may mask the heart-rate increase',
    ),
  ],
  monitoring: [
    t('Peso y tolerancia GI en cada escalón', 'Weight and GI tolerance at each step'),
    t('Frecuencia cardíaca y presión arterial', 'Heart rate and blood pressure'),
    t('HbA1c y glucemia', 'HbA1c and glucose'),
    t(
      'Transaminasas, elastografía o marcadores de fibrosis si indicación hepática',
      'Transaminases, elastography or fibrosis markers if hepatic indication',
    ),
  ],
  keyTrials: [
    {
      name: 'Fase 2 obesidad',
      year: 2024,
      finding: t(
        '−18,7% de peso a 46 semanas con 6,0 mg frente a −1,1% con placebo; tolerancia dependiente de la velocidad de escalada.',
        '−18.7% body weight at 46 weeks with 6.0 mg vs −1.1% placebo; tolerability depended on escalation speed.',
      ),
      ref: 'Lancet 2024',
    },
    {
      name: 'Fase 2 MASH',
      year: 2024,
      finding: t(
        'Mejoría histológica de MASH sin empeoramiento de la fibrosis en el 47–62% frente al 14% con placebo a 48 semanas.',
        'Histological MASH improvement without fibrosis worsening in 47–62% vs 14% with placebo at 48 weeks.',
      ),
      ref: 'NEJM 2024',
    },
    {
      name: 'SYNCHRONIZE-1 / -2',
      year: 2025,
      finding: t(
        'Fase 3 en obesidad con y sin DM2; resultados comunicados como positivos. Verificar magnitudes en la publicación completa.',
        'Phase 3 in obesity with and without T2D; results reported as positive. Verify effect sizes in the full publication.',
      ),
    },
  ],
  references: [
    {
      label:
        'Boehringer Ingelheim / Zealand Pharma survodutide clinical programme (investigational)',
    },
    { label: 'Phase 2 obesity trial of survodutide. Lancet 2024' },
    { label: 'Phase 2 MASH trial of survodutide. NEJM 2024' },
  ],
  tags: ['glp1', 'glucagón', 'doble agonista', 'obesidad', 'mash', 'semanal', 'investigacional'],
  lastReviewed: '2026-09-19',
}

const mazdutide: CompoundDetail = {
  id: 'mazdutide',
  names: {
    generic: 'Mazdutida',
    brands: ['Xcretin (China)'],
    aliases: ['IBI362', 'LY3305677', 'OXM analogue'],
  },
  category: 'incretin',
  pharmClass: t(
    'Doble agonista GLP-1/glucagón análogo de oxintomodulina (acción semanal)',
    'Oxyntomodulin-analogue dual GLP-1/glucagon receptor agonist (once weekly)',
  ),
  summary: t(
    'Análogo de oxintomodulina licenciado por Innovent desde Eli Lilly que activa los receptores de GLP-1 y de glucagón. Aprobado en China en 2025 para control de peso y posteriormente para diabetes tipo 2; sigue siendo investigacional en EE. UU. y la UE. Programa clínico GLORY y DREAMS en población mayoritariamente china.',
    'Oxyntomodulin analogue licensed by Innovent from Eli Lilly that activates GLP-1 and glucagon receptors. Approved in China in 2025 for weight management and subsequently for type 2 diabetes; still investigational in the US and EU. GLORY and DREAMS clinical programmes in a predominantly Chinese population.',
  ),
  mechanism: t(
    'Agonismo dual con predominio GLP-1 y componente glucagónico moderado: reduce la ingesta, retrasa el vaciamiento gástrico y aumenta el gasto energético y la oxidación de grasa hepática. En los ensayos se acompaña de descensos marcados de transaminasas, ácido úrico y grasa hepática.',
    'Dual agonism with GLP-1 predominance and a moderate glucagon component: reduces intake, delays gastric emptying and increases energy expenditure and hepatic fat oxidation. Trials show marked reductions in transaminases, uric acid and liver fat.',
  ),
  indications: [
    t(
      'Control crónico del peso en obesidad/sobrepeso (aprobado en China, 2025)',
      'Chronic weight management in obesity/overweight (approved in China, 2025)',
    ),
    t(
      'Diabetes mellitus tipo 2 (programa DREAMS; aprobación en China)',
      'Type 2 diabetes (DREAMS programme; Chinese approval)',
    ),
    t(
      'Esteatosis hepática metabólica e hiperuricemia (objetivos exploratorios)',
      'Metabolic hepatic steatosis and hyperuricaemia (exploratory endpoints)',
    ),
  ],
  evidence: 'phase3',
  regulatory: {
    us: 'investigational',
    eu: 'investigational',
    notes: t(
      'Aprobado por la NMPA de China en 2025 (primero para control de peso, después para DM2) con marca comercial local. No está aprobado por la FDA ni la EMA, y la experiencia clínica procede sobre todo de población china, lo que limita la extrapolación de dosis y tolerancia.',
      'Approved by China’s NMPA in 2025 (first for weight management, then for T2D) under a local brand name. Not approved by the FDA or EMA, and clinical experience comes mostly from a Chinese population, limiting extrapolation of dose and tolerability.',
    ),
  },
  routes: ['sc'],
  defaultUnit: 'mg',
  pk: {
    halfLifeH: 156,
    tmaxH: 36,
    source:
      'Datos en investigación (fuera de China): fase 1 de mazdutida (IBI362/LY3305677) y programas GLORY/DREAMS. t½ ≈ 5–8 días (~156 h de media), tmax ~24–48 h; dosificación semanal.',
    notes:
      'Rango de semivida amplio entre estudios (5–8 días). Aprobada en China; los parámetros siguen considerándose de investigación fuera de ese mercado.',
  },
  dosing: {
    investigational: t(
      'Fase 3 GLORY-1: 4 mg/semana y 6 mg/semana tras escalada desde 1,5–3 mg. En DM2 se han estudiado 4–6 mg/semana y dosis de 9 mg en obesidad grave (GLORY-2). La pauta aprobada en China sigue esta escalada; fuera de China no hay dosis autorizada.',
      'Phase 3 GLORY-1: 4 mg weekly and 6 mg weekly after escalation from 1.5–3 mg. In T2D, 4–6 mg weekly has been studied, and 9 mg in severe obesity (GLORY-2). The Chinese approved regimen follows this escalation; outside China there is no authorised dose.',
    ),
    frequency: t('1×/semana', 'Once weekly'),
  },
  reconstitution: t(
    'Pluma precargada lista para usar en los ensayos y en la presentación comercial china; no requiere reconstitución.',
    'Ready-to-use prefilled pen in trials and in the Chinese commercial presentation; no reconstitution required.',
  ),
  storage: t(
    'Nevera 2–8 °C, protegido de la luz, sin congelar. Los datos de estabilidad a temperatura ambiente fuera de la ficha china no están publicados.',
    'Refrigerate 2–8 °C, protect from light, do not freeze. Room-temperature stability data outside the Chinese label are not published.',
  ),
  adverseEffects: {
    common: [
      t(
        'Náuseas, diarrea, vómitos y disminución del apetito (predominio leve-moderado)',
        'Nausea, diarrhoea, vomiting and decreased appetite (mostly mild–moderate)',
      ),
      t('Estreñimiento y dispepsia', 'Constipation and dyspepsia'),
      t('Aumento leve de frecuencia cardíaca', 'Mild heart-rate increase'),
      t('Reacciones en el punto de inyección', 'Injection-site reactions'),
    ],
    serious: [
      t(
        'Pancreatitis aguda (efecto de clase; poco frecuente)',
        'Acute pancreatitis (class effect; uncommon)',
      ),
      t('Colelitiasis y colecistitis', 'Cholelithiasis and cholecystitis'),
      t(
        'Hipoglucemia en combinación con insulina o sulfonilureas',
        'Hypoglycaemia in combination with insulin or sulfonylureas',
      ),
      t('Deshidratación y lesión renal aguda', 'Dehydration and acute kidney injury'),
    ],
  },
  contraindications: [
    t(
      'Antecedente personal o familiar de carcinoma medular de tiroides o MEN2 (advertencia de clase de los agonistas peptídicos de GLP-1)',
      'Personal or family history of medullary thyroid carcinoma or MEN2 (peptide GLP-1 RA class warning)',
    ),
    t('Pancreatitis previa, gastroparesia grave', 'Prior pancreatitis, severe gastroparesis'),
    t('Embarazo y lactancia', 'Pregnancy and breastfeeding'),
    t('Hipersensibilidad al principio activo', 'Hypersensitivity to the active substance'),
  ],
  interactions: [
    t('Insulina y secretagogos: reducir dosis', 'Insulin and secretagogues: reduce dose'),
    t(
      'Orales de ventana estrecha: vigilar por retraso del vaciamiento gástrico',
      'Narrow-window oral drugs: monitor for delayed gastric emptying',
    ),
  ],
  monitoring: [
    t('Peso, HbA1c y glucemia', 'Weight, HbA1c and glucose'),
    t(
      'Transaminasas y ácido úrico (mejoran en los ensayos)',
      'Transaminases and uric acid (improve in trials)',
    ),
    t('Frecuencia cardíaca', 'Heart rate'),
    t(
      'Hidratación y función renal durante la escalada',
      'Hydration and renal function during escalation',
    ),
  ],
  keyTrials: [
    {
      name: 'GLORY-1',
      year: 2025,
      finding: t(
        'Fase 3 en obesidad en China: pérdida de peso de aproximadamente −11% a −14% a 48 semanas con 4 y 6 mg frente a placebo; base de la aprobación china.',
        'Phase 3 in obesity in China: roughly −11% to −14% weight loss at 48 weeks with 4 and 6 mg vs placebo; basis of the Chinese approval.',
      ),
    },
    {
      name: 'DREAMS-2',
      year: 2024,
      finding: t(
        'Fase 3 en DM2: mazdutida superior a dulaglutida en reducción de HbA1c y peso.',
        'Phase 3 in T2D: mazdutide superior to dulaglutide for HbA1c and weight reduction.',
      ),
    },
  ],
  references: [
    { label: 'Innovent Biologics / Eli Lilly mazdutide (IBI362) clinical programme' },
    { label: 'GLORY-1 phase 3 obesity trial (China)' },
    { label: 'China NMPA approval announcement, 2025' },
  ],
  tags: ['glp1', 'glucagón', 'oxintomodulina', 'obesidad', 'china', 'semanal', 'investigacional'],
  lastReviewed: '2026-09-19',
}

const cagrilintide: CompoundDetail = {
  id: 'cagrilintide',
  names: {
    generic: 'Cagrilintida',
    brands: [],
    aliases: ['AM833', 'NNC0174-0833'],
  },
  category: 'incretin',
  pharmClass: t(
    'Análogo de amilina de acción prolongada (agonista no selectivo de receptores de amilina y calcitonina)',
    'Long-acting amylin analogue (non-selective amylin/calcitonin receptor agonist)',
  ),
  summary: t(
    'Análogo acilado de amilina humana diseñado para administración semanal, con semivida de ~1 semana. Como monoterapia produjo alrededor de −10% de peso a 26 semanas en fase 2; su desarrollo principal es en combinación fija con semaglutida (CagriSema).',
    'Acylated human amylin analogue designed for weekly dosing, with a ~1-week half-life. As monotherapy it produced about −10% weight loss at 26 weeks in phase 2; its main development is as a fixed-dose combination with semaglutide (CagriSema).',
  ),
  mechanism: t(
    'Agonista no selectivo de los receptores de amilina (AMY1-3) y de calcitonina en el área postrema y el núcleo del tracto solitario: induce saciedad, enlentece el vaciamiento gástrico y suprime la secreción de glucagón posprandial. Su mecanismo es complementario al de GLP-1, lo que permite efecto aditivo en la combinación. La acilación con diácido graso prolonga la semivida y evita la agregación característica de la amilina nativa.',
    'Non-selective agonist of amylin (AMY1-3) and calcitonin receptors in the area postrema and nucleus tractus solitarius: induces satiety, slows gastric emptying and suppresses postprandial glucagon. Its mechanism complements GLP-1, allowing additive effects in combination. Fatty-diacid acylation prolongs half-life and prevents the aggregation typical of native amylin.',
  ),
  indications: [
    t(
      'Obesidad y sobrepeso con comorbilidad (en monoterapia y como componente de CagriSema)',
      'Obesity and overweight with comorbidity (as monotherapy and as a CagriSema component)',
    ),
    t(
      'Diabetes mellitus tipo 2 (en combinación, programa REDEFINE/REIMAGINE)',
      'Type 2 diabetes (in combination, REDEFINE/REIMAGINE programmes)',
    ),
  ],
  evidence: 'phase3',
  regulatory: {
    us: 'investigational',
    eu: 'investigational',
    notes: t(
      'No aprobada en ninguna jurisdicción, ni sola ni combinada. La amilina como clase solo tiene un representante aprobado (pramlintida, 3 veces al día con las comidas).',
      'Not approved in any jurisdiction, alone or in combination. The amylin class has a single approved representative (pramlintide, three times daily with meals).',
    ),
  },
  routes: ['sc'],
  defaultUnit: 'mg',
  pk: {
    halfLifeH: 159,
    tmaxH: 24,
    source:
      'Datos en investigación: fase 1 de dosis única/múltiple de cagrilintida (AM833) y programa fase 2/3 de Novo Nordisk. t½ ≈ 1 semana (~159 h), tmax ~24–48 h.',
    notes:
      'Parámetros de ensayo clínico, no de ficha técnica. Estado estacionario tras 5–6 dosis semanales.',
  },
  dosing: {
    investigational: t(
      'Fase 2: 0,3; 0,6; 1,2; 2,4 y 4,5 mg/semana con escalada mensual; 4,5 mg fue la dosis más eficaz (−10,8% a 26 semanas). En combinación fija se emplea 2,4 mg/semana. Sin dosis aprobada.',
      'Phase 2: 0.3, 0.6, 1.2, 2.4 and 4.5 mg weekly with monthly escalation; 4.5 mg was the most effective dose (−10.8% at 26 weeks). The fixed-dose combination uses 2.4 mg weekly. No approved dose.',
    ),
    frequency: t('1×/semana', 'Once weekly'),
  },
  reconstitution: t(
    'Administrada en ensayos en pluma/autoinyector precargado listo para usar; no requiere reconstitución ni existe vial comercial.',
    'Given in trials as a ready-to-use prefilled pen/autoinjector; no reconstitution and no commercial vial.',
  ),
  storage: t(
    'Producto de ensayo: 2–8 °C, protegido de la luz, sin congelar. La amilina nativa es propensa a la agregación; evitar agitación vigorosa.',
    'Investigational product: 2–8 °C, protect from light, do not freeze. Native amylin is aggregation-prone; avoid vigorous shaking.',
  ),
  adverseEffects: {
    common: [
      t(
        'Náuseas (dosis-dependientes, generalmente leves y transitorias), vómitos',
        'Dose-dependent nausea (usually mild and transient), vomiting',
      ),
      t(
        'Disminución del apetito, estreñimiento, dispepsia',
        'Decreased appetite, constipation, dyspepsia',
      ),
      t('Reacciones en el punto de inyección', 'Injection-site reactions'),
      t('Fatiga', 'Fatigue'),
    ],
    serious: [
      t(
        'Hipoglucemia grave si se asocia a insulina prandial (efecto de clase de la amilina)',
        'Severe hypoglycaemia when combined with prandial insulin (amylin class effect)',
      ),
      t('Deshidratación por vómitos persistentes', 'Dehydration from persistent vomiting'),
      t('Colelitiasis asociada a pérdida rápida de peso', 'Cholelithiasis with rapid weight loss'),
    ],
  },
  contraindications: [
    t(
      'Hipoglucemia inadvertida o gastroparesia (precaución de clase heredada de la pramlintida)',
      'Hypoglycaemia unawareness or gastroparesis (class caution inherited from pramlintide)',
    ),
    t('Embarazo y lactancia', 'Pregnancy and breastfeeding'),
    t('Hipersensibilidad conocida al análogo', 'Known hypersensitivity to the analogue'),
    t(
      'No se aplica la advertencia de células C tiroideas propia de los agonistas de GLP-1: la cagrilintida no es un agonista de GLP-1, aunque sí activa receptores de calcitonina',
      'The thyroid C-cell warning specific to GLP-1 RAs does not apply: cagrilintide is not a GLP-1 agonist, although it does activate calcitonin receptors',
    ),
  ],
  interactions: [
    t(
      'Insulina prandial y sulfonilureas: reducir dosis para evitar hipoglucemia grave',
      'Prandial insulin and sulfonylureas: reduce dose to avoid severe hypoglycaemia',
    ),
    t(
      'Fármacos orales de absorción rápida o de ventana estrecha: administrar separados por el retraso del vaciamiento gástrico',
      'Rapidly absorbed or narrow-window oral drugs: separate administration because of delayed gastric emptying',
    ),
    t(
      'Anticolinérgicos y otros fármacos que enlentecen la motilidad: efecto aditivo',
      'Anticholinergics and other motility-slowing drugs: additive effect',
    ),
  ],
  monitoring: [
    t('Peso y tolerancia GI', 'Weight and GI tolerance'),
    t('Glucemia capilar si hay insulina concomitante', 'Capillary glucose if concomitant insulin'),
    t(
      'Calcio y marcadores óseos no requeridos de rutina, pero considerar por la actividad sobre el receptor de calcitonina',
      'Calcium and bone markers are not routinely required, but consider them given calcitonin-receptor activity',
    ),
  ],
  keyTrials: [
    {
      name: 'Fase 2 monoterapia (Lau)',
      year: 2021,
      finding: t(
        'Cagrilintida 4,5 mg/semana: −10,8% de peso a 26 semanas frente a −3,0% con placebo y −9,0% con liraglutida 3 mg.',
        'Cagrilintide 4.5 mg weekly: −10.8% weight at 26 weeks vs −3.0% placebo and −9.0% with liraglutide 3 mg.',
      ),
      ref: 'Lancet 2021;398:2160',
    },
    {
      name: 'Fase 1b cagrilintida + semaglutida',
      year: 2021,
      finding: t(
        'La combinación mostró efecto aditivo sobre el peso frente a cada componente por separado, base del desarrollo de CagriSema.',
        'The combination showed additive weight effects versus each component alone, the basis for CagriSema development.',
      ),
    },
  ],
  references: [
    { label: 'Lau DCW et al. Once-weekly cagrilintide for weight management. Lancet 2021' },
    { label: 'Novo Nordisk cagrilintide clinical programme (investigational)' },
  ],
  tags: ['amilina', 'saciedad', 'obesidad', 'semanal', 'investigacional'],
  lastReviewed: '2026-09-19',
}

const cagrisema: CompoundDetail = {
  id: 'cagrisema',
  names: {
    generic: 'CagriSema (cagrilintida + semaglutida)',
    brands: [],
    aliases: ['cagrilintide/semaglutide', 'NN9838'],
  },
  category: 'incretin',
  pharmClass: t(
    'Combinación a dosis fija de análogo de amilina y agonista del receptor de GLP-1 (acción semanal)',
    'Fixed-dose combination of an amylin analogue and a GLP-1 receptor agonist (once weekly)',
  ),
  summary: t(
    'Coformulación a dosis fija de cagrilintida y semaglutida en una única inyección semanal. La dosis se expresa por componente: 2,4/2,4 mg significa 2,4 mg de cagrilintida más 2,4 mg de semaglutida. En el programa fase 3 REDEFINE alcanzó alrededor de −20% de peso a 68 semanas en obesidad sin diabetes.',
    'Fixed-dose co-formulation of cagrilintide and semaglutide in a single weekly injection. The dose is expressed per component: 2.4/2.4 mg means 2.4 mg of cagrilintide plus 2.4 mg of semaglutide. In the REDEFINE phase 3 programme it reached about −20% weight loss at 68 weeks in obesity without diabetes.',
  ),
  mechanism: t(
    'Suma dos vías de saciedad complementarias: la amilínica (área postrema y núcleo del tracto solitario, saciedad homeostática y enlentecimiento gástrico) y la incretínica GLP-1 (hipotálamo, insulinotropía dependiente de glucosa y supresión de glucagón). El efecto sobre el peso es aditivo y la cagrilintida parece atenuar la pérdida de masa magra respecto a la semaglutida sola.',
    'Adds two complementary satiety pathways: amylinergic (area postrema and nucleus tractus solitarius; homeostatic satiety and gastric slowing) and GLP-1 incretin (hypothalamus, glucose-dependent insulinotropy and glucagon suppression). Weight effects are additive and cagrilintide appears to attenuate lean-mass loss relative to semaglutide alone.',
  ),
  indications: [
    t(
      'Obesidad y sobrepeso con comorbilidad (REDEFINE 1)',
      'Obesity and overweight with comorbidity (REDEFINE 1)',
    ),
    t('Obesidad con diabetes tipo 2 (REDEFINE 2)', 'Obesity with type 2 diabetes (REDEFINE 2)'),
    t(
      'Obesidad con enfermedad cardiovascular establecida (REDEFINE 3, estudio de resultados CV)',
      'Obesity with established cardiovascular disease (REDEFINE 3, CV outcomes trial)',
    ),
  ],
  evidence: 'phase3',
  regulatory: {
    us: 'investigational',
    eu: 'investigational',
    notes: t(
      'No aprobada. Novo Nordisk presentó solicitud regulatoria tras REDEFINE 1 y 2; comprobar el estado actual antes de informar al paciente. La semaglutida sola sí está aprobada, pero la combinación no puede reproducirse mezclando productos comerciales.',
      'Not approved. Novo Nordisk filed for regulatory approval after REDEFINE 1 and 2; check current status before counselling patients. Semaglutide alone is approved, but the combination cannot be reproduced by mixing commercial products.',
    ),
  },
  routes: ['sc'],
  defaultUnit: 'mg',
  pk: {
    halfLifeH: 165,
    tmaxH: 36,
    source:
      'Datos en investigación: farmacocinética de cagrilintida (t½ ≈ 1 semana) y de semaglutida (t½ ≈ 1 semana) coformuladas; programa fase 1/3 de Novo Nordisk. La dosis declarada corresponde a cada componente por separado.',
    notes:
      'Ambos componentes tienen semivida cercana a 1 semana, por lo que el modelo usa un único valor agregado (~165 h). No representa la suma de exposiciones molares.',
  },
  dosing: {
    investigational: t(
      'REDEFINE: escalada mensual 0,25/0,25 → 0,5/0,5 → 1,0/1,0 → 1,7/1,7 → 2,4/2,4 mg/semana. Cada cifra es la dosis de cagrilintida y de semaglutida respectivamente, en una sola inyección. Sin dosis aprobada.',
      'REDEFINE: monthly escalation 0.25/0.25 → 0.5/0.5 → 1.0/1.0 → 1.7/1.7 → 2.4/2.4 mg weekly. Each figure is the cagrilintide and semaglutide dose respectively, in a single injection. No approved dose.',
    ),
    frequency: t('1×/semana', 'Once weekly'),
    templateIds: ['cagrisema-redefine'],
  },
  reconstitution: t(
    'Coformulación en pluma precargada lista para usar con ambos principios activos en la misma solución; no requiere reconstitución ni mezcla por el usuario. Mezclar Wegovy con cualquier otro producto no equivale a CagriSema.',
    'Co-formulated ready-to-use prefilled pen containing both actives in the same solution; no reconstitution or user mixing. Mixing Wegovy with any other product does not reproduce CagriSema.',
  ),
  storage: t(
    'Producto de ensayo: nevera 2–8 °C, protegido de la luz, sin congelar. La estabilidad en uso a temperatura ambiente no está publicada.',
    'Investigational product: refrigerate 2–8 °C, protect from light, do not freeze. In-use room-temperature stability is not published.',
  ),
  adverseEffects: {
    common: [
      t(
        'Náuseas, vómitos, diarrea y estreñimiento (perfil GI dominante, mayoritariamente leve-moderado)',
        'Nausea, vomiting, diarrhoea and constipation (dominant GI profile, mostly mild–moderate)',
      ),
      t(
        'Disminución del apetito y saciedad precoz marcada',
        'Decreased appetite and pronounced early satiety',
      ),
      t('Fatiga y cefalea', 'Fatigue and headache'),
      t('Reacciones en el punto de inyección', 'Injection-site reactions'),
    ],
    serious: [
      t('Pancreatitis aguda (efecto de clase de GLP-1)', 'Acute pancreatitis (GLP-1 class effect)'),
      t(
        'Colelitiasis y colecistitis por pérdida rápida de peso',
        'Cholelithiasis and cholecystitis from rapid weight loss',
      ),
      t(
        'Hipoglucemia con insulina o sulfonilureas concomitantes',
        'Hypoglycaemia with concomitant insulin or sulfonylureas',
      ),
      t('Deshidratación y lesión renal aguda', 'Dehydration and acute kidney injury'),
      t(
        'Íleo/retención gástrica con riesgo de aspiración en anestesia',
        'Ileus/gastric retention with aspiration risk under anaesthesia',
      ),
    ],
  },
  contraindications: [
    t(
      'Antecedente personal o familiar de carcinoma medular de tiroides o MEN2 (por el componente semaglutida, agonista peptídico de GLP-1)',
      'Personal or family history of medullary thyroid carcinoma or MEN2 (due to the semaglutide component, a peptide GLP-1 RA)',
    ),
    t(
      'Pancreatitis previa, gastroparesia o hipoglucemia inadvertida',
      'Prior pancreatitis, gastroparesis or hypoglycaemia unawareness',
    ),
    t(
      'Embarazo: suspender con antelación suficiente antes de la concepción',
      'Pregnancy: discontinue well before conception',
    ),
    t(
      'Hipersensibilidad a cualquiera de los dos componentes',
      'Hypersensitivity to either component',
    ),
  ],
  interactions: [
    t(
      'Insulina y secretagogos: reducir dosis de forma proactiva',
      'Insulin and secretagogues: reduce dose proactively',
    ),
    t(
      'Levotiroxina, warfarina y otros orales de ventana estrecha: vigilar por vaciamiento gástrico muy retrasado',
      'Levothyroxine, warfarin and other narrow-window oral drugs: monitor for markedly delayed gastric emptying',
    ),
    t(
      'No administrar simultáneamente otro GLP-1 RA ni otro análogo de amilina',
      'Do not co-administer another GLP-1 RA or another amylin analogue',
    ),
  ],
  monitoring: [
    t('Peso y composición corporal (masa magra)', 'Weight and body composition (lean mass)'),
    t(
      'HbA1c y glucemia; riesgo de hipoglucemia en DM2 tratada',
      'HbA1c and glucose; hypoglycaemia risk in treated T2D',
    ),
    t(
      'Hidratación, función renal y sintomatología GI en cada escalón',
      'Hydration, renal function and GI symptoms at each step',
    ),
    t('Frecuencia cardíaca y presión arterial', 'Heart rate and blood pressure'),
  ],
  keyTrials: [
    {
      name: 'REDEFINE 1',
      year: 2025,
      finding: t(
        'Obesidad sin diabetes: aproximadamente −20% de peso a 68 semanas con 2,4/2,4 mg frente a −3% con placebo; superior a cada componente aislado, con una proporción notable de pacientes que no alcanzó la dosis máxima.',
        'Obesity without diabetes: approximately −20% weight at 68 weeks with 2.4/2.4 mg vs −3% placebo; superior to each component alone, with a notable proportion of patients not reaching the maximum dose.',
      ),
      ref: 'NEJM 2025',
    },
    {
      name: 'REDEFINE 2',
      year: 2025,
      finding: t(
        'Obesidad con DM2: pérdida de peso en torno al −14% a 68 semanas con mejoría de HbA1c.',
        'Obesity with T2D: around −14% weight loss at 68 weeks with HbA1c improvement.',
      ),
    },
    {
      name: 'REDEFINE 3',
      year: 2025,
      finding: t(
        'Estudio de resultados cardiovasculares en obesidad con enfermedad CV establecida; en curso.',
        'Cardiovascular outcomes trial in obesity with established CVD; ongoing.',
      ),
    },
  ],
  references: [
    { label: 'REDEFINE 1 phase 3 trial of CagriSema. NEJM 2025' },
    { label: 'Novo Nordisk CagriSema clinical programme (investigational)' },
  ],
  tags: ['glp1', 'amilina', 'combinación', 'obesidad', 'semanal', 'investigacional'],
  lastReviewed: '2026-09-19',
}

const orforglipron: CompoundDetail = {
  id: 'orforglipron',
  names: {
    generic: 'Orforglipron',
    brands: [],
    aliases: ['LY3502970', 'OWL833'],
  },
  category: 'incretin',
  pharmClass: t(
    'Agonista del receptor de GLP-1 oral, no peptídico (molécula pequeña, 1×/día)',
    'Oral non-peptide small-molecule GLP-1 receptor agonist (once daily)',
  ),
  summary: t(
    'Agonista parcial del receptor de GLP-1 de molécula pequeña y naturaleza no peptídica, activo por vía oral una vez al día y sin restricciones de comida ni de agua, a diferencia de la semaglutida oral. En fase 3 (ACHIEVE en DM2 y ATTAIN en obesidad) mostró reducciones de peso en torno al −10% a −12% y descensos de HbA1c de hasta ~1,5–2%.',
    'Small-molecule, non-peptide partial GLP-1 receptor agonist, orally active once daily with no food or water restrictions, unlike oral semaglutide. In phase 3 (ACHIEVE in T2D and ATTAIN in obesity) it showed weight reductions around −10% to −12% and HbA1c falls of up to ~1.5–2%.',
  ),
  mechanism: t(
    'Al no ser un péptido, no se degrada en el tracto gastrointestinal y no necesita potenciadores de absorción ni ayuno: puede tomarse a cualquier hora, con o sin alimentos y sin restricción de agua. Se une a un sitio alostérico/ortostérico del receptor GLP-1 con agonismo sesgado (activación de AMPc con reclutamiento reducido de β-arrestina), produciendo insulinotropía dependiente de glucosa, supresión de glucagón, retraso del vaciamiento gástrico y reducción del apetito. Metabolismo hepático con participación de CYP3A4.',
    'Because it is not a peptide, it is not degraded in the gastrointestinal tract and needs no absorption enhancers or fasting: it can be taken at any time, with or without food and without water restrictions. It binds a GLP-1 receptor site with biased agonism (cAMP activation with reduced β-arrestin recruitment), producing glucose-dependent insulinotropy, glucagon suppression, delayed gastric emptying and appetite reduction. Hepatic metabolism with CYP3A4 involvement.',
  ),
  indications: [
    t(
      'Diabetes mellitus tipo 2 (programa ACHIEVE, fase 3)',
      'Type 2 diabetes (ACHIEVE phase 3 programme)',
    ),
    t(
      'Obesidad y sobrepeso con comorbilidad (programa ATTAIN, fase 3)',
      'Obesity and overweight with comorbidity (ATTAIN phase 3 programme)',
    ),
    t(
      'Apnea obstructiva del sueño e hipertensión asociadas a obesidad (estudios complementarios)',
      'Obesity-related obstructive sleep apnoea and hypertension (companion studies)',
    ),
  ],
  evidence: 'phase3',
  regulatory: {
    us: 'investigational',
    eu: 'investigational',
    notes: t(
      'No aprobado. Solicitudes regulatorias presentadas tras los resultados fase 3; comprobar el estado actual. Su interés principal es la escalabilidad de fabricación frente a los péptidos inyectables.',
      'Not approved. Regulatory submissions filed after the phase 3 results; check current status. Its main appeal is manufacturing scalability compared with injectable peptides.',
    ),
  },
  routes: ['oral'],
  defaultUnit: 'mg',
  pk: {
    halfLifeH: 39,
    tmaxH: 5,
    source:
      'Datos en investigación: fase 1 de orforglipron (LY3502970) y programas ACHIEVE/ATTAIN. t½ ≈ 29–49 h (valor medio ~39 h), tmax ~4–6 h; permite administración 1×/día sin restricción de comida ni agua.',
    notes:
      'Molécula pequeña no peptídica: su absorción no depende de potenciadores tipo SNAC ni de ayuno, a diferencia de la semaglutida oral. Estado estacionario en ~7–10 días.',
  },
  dosing: {
    investigational: t(
      'Fase 3: escalada desde 1–3 mg/día con incrementos cada 4 semanas hasta dosis de mantenimiento de 12, 24 o 36 mg/día. Toma única diaria a cualquier hora, con o sin alimentos y sin restricción de agua. Sin dosis aprobada.',
      'Phase 3: escalation from 1–3 mg daily with 4-weekly increments to maintenance doses of 12, 24 or 36 mg daily. Single daily dose at any time, with or without food and with no water restriction. No approved dose.',
    ),
    frequency: t('1×/día (oral)', 'Once daily (oral)'),
  },
  reconstitution: t(
    'Comprimido oral: no procede reconstitución ni inyección. No requiere tomarse en ayunas ni esperar 30 minutos, a diferencia de la semaglutida oral.',
    'Oral tablet: no reconstitution or injection. It does not need to be taken fasting or followed by a 30-minute wait, unlike oral semaglutide.',
  ),
  storage: t(
    'Comprimidos a temperatura ambiente controlada en su envase original, protegidos de la humedad. No requiere cadena de frío, lo que simplifica notablemente la logística frente a los inyectables.',
    'Tablets at controlled room temperature in the original container, protected from moisture. No cold chain required, which greatly simplifies logistics versus injectables.',
  ),
  adverseEffects: {
    common: [
      t(
        'Náuseas, diarrea, vómitos, estreñimiento y dispepsia, dependientes de la dosis y de la velocidad de escalada',
        'Nausea, diarrhoea, vomiting, constipation and dyspepsia, dependent on dose and escalation speed',
      ),
      t('Disminución del apetito', 'Decreased appetite'),
      t('Cefalea, fatiga', 'Headache, fatigue'),
      t('Aumento leve de frecuencia cardíaca', 'Mild heart-rate increase'),
    ],
    serious: [
      t(
        'Pancreatitis aguda (efecto de clase; poco frecuente)',
        'Acute pancreatitis (class effect; uncommon)',
      ),
      t(
        'Colelitiasis y colecistitis con pérdida rápida de peso',
        'Cholelithiasis and cholecystitis with rapid weight loss',
      ),
      t(
        'Hipoglucemia asociada a insulina o sulfonilureas',
        'Hypoglycaemia associated with insulin or sulfonylureas',
      ),
      t(
        'Deshidratación y deterioro renal por vómitos o diarrea',
        'Dehydration and renal impairment from vomiting or diarrhoea',
      ),
      t(
        'No se ha identificado señal de hepatotoxicidad en los ensayos fase 3 publicados',
        'No hepatotoxicity signal has been identified in the published phase 3 trials',
      ),
    ],
  },
  contraindications: [
    t(
      'La advertencia de recuadro por tumores de células C tiroideas se estableció para los agonistas peptídicos de GLP-1 y no se ha aplicado a esta molécula pequeña; verificar el etiquetado final cuando se apruebe',
      'The boxed warning for thyroid C-cell tumours was established for peptide GLP-1 RAs and has not been applied to this small molecule; check the final labelling on approval',
    ),
    t('Pancreatitis previa; gastroparesia', 'Prior pancreatitis; gastroparesis'),
    t('Embarazo y lactancia', 'Pregnancy and breastfeeding'),
    t('Hipersensibilidad al principio activo', 'Hypersensitivity to the active substance'),
  ],
  interactions: [
    t(
      'Inhibidores e inductores potentes de CYP3A4 (ketoconazol, rifampicina): posible alteración de la exposición; a diferencia de los péptidos, sí tiene interacciones metabólicas',
      'Strong CYP3A4 inhibitors and inducers (ketoconazole, rifampicin): exposure may change; unlike peptides, it does have metabolic interactions',
    ),
    t('Insulina y sulfonilureas: reducir dosis', 'Insulin and sulfonylureas: reduce dose'),
    t(
      'Orales de ventana estrecha: vigilar por vaciamiento gástrico retrasado',
      'Narrow-window oral drugs: monitor for delayed gastric emptying',
    ),
  ],
  monitoring: [
    t('Peso, HbA1c y glucemia', 'Weight, HbA1c and glucose'),
    t('Tolerancia GI durante la escalada', 'GI tolerance during escalation'),
    t('Frecuencia cardíaca', 'Heart rate'),
    t(
      'Función renal si hay vómitos o diarrea intensos',
      'Renal function with severe vomiting or diarrhoea',
    ),
  ],
  keyTrials: [
    {
      name: 'ACHIEVE-1',
      year: 2025,
      finding: t(
        'Fase 3 en DM2 sin tratamiento previo: reducción de HbA1c de hasta ~1,3–1,6% y pérdida de peso de hasta ~7,9% a 40 semanas con 36 mg/día.',
        'Phase 3 in treatment-naive T2D: HbA1c reduction up to ~1.3–1.6% and weight loss up to ~7.9% at 40 weeks with 36 mg daily.',
      ),
      ref: 'NEJM 2025',
    },
    {
      name: 'ATTAIN-1',
      year: 2025,
      finding: t(
        'Fase 3 en obesidad sin diabetes: pérdida de peso en torno a −11% a −12% a 72 semanas con 36 mg/día frente a placebo.',
        'Phase 3 in obesity without diabetes: weight loss of about −11% to −12% at 72 weeks with 36 mg daily versus placebo.',
      ),
      ref: 'NEJM 2025',
    },
    {
      name: 'ATTAIN-2',
      year: 2025,
      finding: t(
        'Fase 3 en obesidad con DM2: pérdida de peso menor que en ATTAIN-1, en torno al −10%, con mejoría glucémica.',
        'Phase 3 in obesity with T2D: smaller weight loss than in ATTAIN-1, around −10%, with glycaemic improvement.',
      ),
    },
  ],
  references: [
    { label: 'Eli Lilly ACHIEVE and ATTAIN phase 3 programmes (investigational)' },
    { label: 'ACHIEVE-1 phase 3 trial of orforglipron. NEJM 2025' },
    { label: 'ATTAIN-1 phase 3 trial of orforglipron. NEJM 2025' },
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
  lastReviewed: '2026-09-19',
}

export const INCRETINS_INVESTIGATIONAL: CompoundDetail[] = [
  retatrutide,
  cagrilintide,
  cagrisema,
  survodutide,
  mazdutide,
  orforglipron,
]
