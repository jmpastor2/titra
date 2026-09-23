import { t, type CompoundEntry } from '../schema'

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

const retatrutide: CompoundEntry = {
  id: 'retatrutide',
  names: {
    generic: 'Retatrutida',
    brands: [],
    aliases: ['LY3437943', 'triple G', 'GGG tri-agonista'],
  },
  category: 'incretin',
  pharmClass: t(
    'Triple agonista de los receptores GIP/GLP-1/glucagón (acción semanal)',
    'Triple GIP/GLP-1/glucagon receptor agonist (once weekly)',
  ),
  summary: t(
    'Péptido único de 39 aminoácidos acilado con un diácido graso C20 que activa simultáneamente los receptores de GIP, GLP-1 y glucagón. En fase 2 produjo la mayor pérdida de peso publicada hasta la fecha para un fármaco (−24,2% a 48 semanas con 12 mg). En desarrollo fase 3 (programa TRIUMPH).',
    'Single 39-amino-acid peptide acylated with a C20 fatty diacid that simultaneously activates the GIP, GLP-1 and glucagon receptors. In phase 2 it produced the largest published weight loss for any drug to date (−24.2% at 48 weeks with 12 mg). In phase 3 development (TRIUMPH programme).',
  ),
  mechanism: t(
    'Combina la anorexia y la insulinotropía dependiente de glucosa de GLP-1 y GIP con el componente glucagónico, que aumenta el gasto energético y la lipólisis hepática. El brazo glucagón explica parte de la pérdida de grasa hepática y también el aumento de frecuencia cardíaca observado. Potencia relativa sesgada hacia GIP y glucagón, con agonismo GLP-1 más débil que la semaglutida a nivel molar.',
    'Combines the anorectic and glucose-dependent insulinotropic actions of GLP-1 and GIP with a glucagon component that raises energy expenditure and hepatic lipolysis. The glucagon arm accounts for part of the hepatic fat loss and also for the observed heart-rate increase. Relative potency is biased towards GIP and glucagon, with weaker GLP-1 agonism than semaglutide on a molar basis.',
  ),
  indications: [
    t(
      'Obesidad y sobrepeso con comorbilidad (fase 3, TRIUMPH-1/-3/-4)',
      'Obesity and overweight with comorbidity (phase 3, TRIUMPH-1/-3/-4)',
    ),
    t(
      'Diabetes mellitus tipo 2 con obesidad (TRIUMPH-2)',
      'Type 2 diabetes with obesity (TRIUMPH-2)',
    ),
    t(
      'Esteatohepatitis metabólica (MASH) y esteatosis hepática (fase 2: reducción de grasa hepática >80%)',
      'Metabolic steatohepatitis (MASH) and hepatic steatosis (phase 2: >80% liver fat reduction)',
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
      'Fase 2: escalada desde 2 mg/semana con incrementos cada 4 semanas hasta 4, 8 o 12 mg/semana; los brazos de escalada más lenta (2 mg → 4 → 8 → 12) toleraron mejor. Fase 3 emplea escalada análoga hasta dosis de mantenimiento de 6–12 mg/semana. No hay dosis aprobada.',
      'Phase 2: escalation from 2 mg weekly with 4-weekly increments to 4, 8 or 12 mg weekly; slower-escalation arms (2 mg → 4 → 8 → 12) were better tolerated. Phase 3 uses analogous escalation to 6–12 mg weekly maintenance. There is no approved dose.',
    ),
    frequency: t('1×/semana', 'Once weekly'),
    templateIds: ['retatrutide-triumph'],
  },
  reconstitution: t(
    'En los ensayos se administra en autoinyector/pluma precargada lista para usar. No existe presentación comercial; el polvo liofilizado del mercado de investigación carece de garantías de contenido y esterilidad.',
    'In trials it is given as a ready-to-use prefilled pen/autoinjector. There is no commercial presentation; lyophilised powder from the research market has no content or sterility guarantees.',
  ),
  storage: t(
    'Producto de ensayo: nevera 2–8 °C, protegido de la luz, sin congelar. No hay datos públicos de estabilidad a temperatura ambiente ni de caducidad tras la primera punción.',
    'Investigational product: refrigerate 2–8 °C, protect from light, do not freeze. No public stability data at room temperature or in-use shelf life.',
  ),
  adverseEffects: {
    common: [
      t(
        'Náuseas, vómitos y diarrea dependientes de la dosis (hasta ~45% de náuseas con 12 mg)',
        'Dose-dependent nausea, vomiting and diarrhoea (nausea up to ~45% at 12 mg)',
      ),
      t('Estreñimiento, dolor abdominal, dispepsia', 'Constipation, abdominal pain, dyspepsia'),
      t(
        'Aumento de frecuencia cardíaca de ~5–8 lpm (componente glucagónico), máximo a las 24 semanas',
        'Heart-rate increase of ~5–8 bpm (glucagon component), peaking at 24 weeks',
      ),
      t(
        'Reacciones en el punto de inyección; alopecia en ~5–11% con dosis altas',
        'Injection-site reactions; alopecia in ~5–11% at higher doses',
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
        'Hiperglucemia transitoria por el agonismo glucagónico si la escalada es rápida en DM2',
        'Transient hyperglycaemia from glucagon agonism with rapid escalation in T2D',
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
      'HbA1c y glucemia; en DM2 vigilar hiperglucemia paradójica inicial',
      'HbA1c and glucose; in T2D watch for initial paradoxical hyperglycaemia',
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
        '−24,2% de peso a 48 semanas con 12 mg frente a −2,1% con placebo; ninguna meseta al final del estudio.',
        '−24.2% body weight at 48 weeks with 12 mg vs −2.1% with placebo; no plateau by study end.',
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
        'Programa fase 3 en obesidad, DM2, artrosis de rodilla y apnea del sueño; resultados iniciales confirman pérdidas ponderales superiores a las de agonistas duales. Verificar publicaciones individuales.',
        'Phase 3 programme in obesity, T2D, knee osteoarthritis and sleep apnoea; initial results confirm weight loss exceeding dual agonists. Check individual publications.',
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
  lastReviewed: '2026-09-19',
}

const survodutide: CompoundEntry = {
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

const mazdutide: CompoundEntry = {
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

// ---------------------------------------------------------------------------
// Amylin analogues and fixed-dose combinations
// ---------------------------------------------------------------------------

const cagrilintide: CompoundEntry = {
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

const cagrisema: CompoundEntry = {
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

const amycretin: CompoundEntry = {
  id: 'amycretin',
  names: {
    generic: 'Amicretina',
    brands: [],
    aliases: ['amycretin', 'NNC0487-0111', 'NN9487'],
  },
  category: 'incretin',
  pharmClass: t(
    'Coagonista unimolecular de los receptores de amilina y de GLP-1 (formas subcutánea y oral)',
    'Unimolecular amylin and GLP-1 receptor co-agonist (subcutaneous and oral forms)',
  ),
  summary: t(
    'Molécula única que combina en un solo péptido el agonismo del receptor de amilina y del receptor de GLP-1, en desarrollo por Novo Nordisk en dos formulaciones: subcutánea semanal y oral diaria. En fase 1b/2a la forma subcutánea alcanzó alrededor de −22% de peso a 36 semanas y la oral en torno a −13% a 12 semanas.',
    'Single molecule combining amylin and GLP-1 receptor agonism in one peptide, in development by Novo Nordisk in two formulations: weekly subcutaneous and daily oral. In phase 1b/2a the subcutaneous form achieved about −22% weight at 36 weeks and the oral form about −13% at 12 weeks.',
  ),
  mechanism: t(
    'Un mismo péptido activa el receptor de amilina/calcitonina y el receptor de GLP-1, reproduciendo en una sola molécula la sinergia demostrada por CagriSema. Actúa sobre el área postrema, el núcleo del tracto solitario y el hipotálamo: saciedad homeostática y hedónica, enlentecimiento gástrico e insulinotropía dependiente de glucosa. La formulación oral emplea un potenciador de absorción tipo SNAC, con biodisponibilidad muy baja y requisitos de ayuno.',
    'A single peptide activates both the amylin/calcitonin receptor and the GLP-1 receptor, reproducing in one molecule the synergy demonstrated by CagriSema. It acts on the area postrema, nucleus tractus solitarius and hypothalamus: homeostatic and hedonic satiety, gastric slowing and glucose-dependent insulinotropy. The oral formulation uses a SNAC-type absorption enhancer, with very low bioavailability and fasting requirements.',
  ),
  indications: [
    t(
      'Obesidad y sobrepeso (fase 2; fase 3 planificada)',
      'Obesity and overweight (phase 2; phase 3 planned)',
    ),
    t('Diabetes mellitus tipo 2 (exploratorio)', 'Type 2 diabetes (exploratory)'),
  ],
  evidence: 'phase2',
  regulatory: {
    us: 'investigational',
    eu: 'investigational',
    notes: t(
      'No aprobada. Datos procedentes de estudios fase 1b/2a de tamaño reducido y duración corta; las cifras de eficacia deben interpretarse con cautela hasta disponer de fase 3.',
      'Not approved. Data come from small, short phase 1b/2a studies; efficacy figures should be interpreted cautiously until phase 3 data are available.',
    ),
  },
  routes: ['sc', 'oral'],
  defaultUnit: 'mg',
  pk: {
    halfLifeH: 132,
    tmaxH: 30,
    source:
      'Datos en investigación: estudios fase 1 de amicretina subcutánea y oral (Novo Nordisk). La forma subcutánea muestra t½ compatible con dosificación semanal (~5–6 días, ~132 h); la oral se administra a diario.',
    notes:
      'El motor modela la forma subcutánea semanal. La forma oral tiene biodisponibilidad muy baja y debe tomarse en ayunas con poca agua, esperando antes de otros fármacos o alimentos.',
  },
  dosing: {
    investigational: t(
      'Subcutánea: escalada hasta 5–20 mg/semana en fase 1b/2a. Oral: hasta 100 mg/día en escalada de 12 semanas. Ambas pautas son exploratorias y no hay dosis aprobada.',
      'Subcutaneous: escalation to 5–20 mg weekly in phase 1b/2a. Oral: up to 100 mg daily over a 12-week escalation. Both regimens are exploratory and there is no approved dose.',
    ),
    frequency: t('1×/semana (SC) · 1×/día (oral)', 'Once weekly (SC) · once daily (oral)'),
  },
  reconstitution: t(
    'La forma subcutánea se administra en pluma/autoinyector precargado listo para usar; la oral es un comprimido. Ninguna requiere reconstitución.',
    'The subcutaneous form is given as a ready-to-use prefilled pen/autoinjector; the oral form is a tablet. Neither requires reconstitution.',
  ),
  storage: t(
    'Inyectable de ensayo: 2–8 °C, protegido de la luz, sin congelar. Comprimidos: temperatura ambiente en el envase original, protegidos de la humedad.',
    'Investigational injectable: 2–8 °C, protect from light, do not freeze. Tablets: room temperature in the original container, protected from moisture.',
  ),
  adverseEffects: {
    common: [
      t(
        'Náuseas y vómitos dependientes de la dosis, frecuentes durante la escalada',
        'Dose-dependent nausea and vomiting, frequent during escalation',
      ),
      t(
        'Disminución del apetito, dispepsia, estreñimiento o diarrea',
        'Decreased appetite, dyspepsia, constipation or diarrhoea',
      ),
      t('Fatiga y cefalea', 'Fatigue and headache'),
    ],
    serious: [
      t(
        'Intolerancia GI que obliga a interrumpir en una proporción relevante de participantes',
        'GI intolerance leading to discontinuation in a relevant proportion of participants',
      ),
      t('Deshidratación por vómitos', 'Dehydration from vomiting'),
      t(
        'Pancreatitis aguda (esperable de clase; datos aún limitados)',
        'Acute pancreatitis (expected class effect; data still limited)',
      ),
      t(
        'Pérdida de masa magra con pérdidas ponderales rápidas',
        'Lean-mass loss with rapid weight reduction',
      ),
    ],
  },
  contraindications: [
    t(
      'Antecedente personal o familiar de carcinoma medular de tiroides o MEN2: contiene un componente agonista peptídico de GLP-1, por lo que se aplica la advertencia de clase',
      'Personal or family history of medullary thyroid carcinoma or MEN2: it contains a peptide GLP-1 agonist component, so the class warning applies',
    ),
    t(
      'Pancreatitis previa, gastroparesia, hipoglucemia inadvertida',
      'Prior pancreatitis, gastroparesis, hypoglycaemia unawareness',
    ),
    t('Embarazo y lactancia', 'Pregnancy and breastfeeding'),
    t(
      'Uso fuera de ensayo clínico: no hay indicación aprobada',
      'Use outside a clinical trial: no approved indication',
    ),
  ],
  interactions: [
    t(
      'Insulina y sulfonilureas: riesgo de hipoglucemia',
      'Insulin and sulfonylureas: hypoglycaemia risk',
    ),
    t(
      'Forma oral: cualquier alimento, bebida u otro medicamento tomado a la vez reduce drásticamente la absorción; separar la toma',
      'Oral form: any food, drink or other medicine taken simultaneously drastically reduces absorption; separate administration',
    ),
    t(
      'Orales de ventana estrecha: vigilar por vaciamiento gástrico retrasado',
      'Narrow-window oral drugs: monitor for delayed gastric emptying',
    ),
  ],
  monitoring: [
    t(
      'Peso, tolerancia GI y adherencia a la pauta de ayuno en la forma oral',
      'Weight, GI tolerance and adherence to the fasting instructions with the oral form',
    ),
    t('HbA1c y glucemia', 'HbA1c and glucose'),
    t('Hidratación y función renal', 'Hydration and renal function'),
  ],
  keyTrials: [
    {
      name: 'Fase 1b/2a subcutánea',
      year: 2025,
      finding: t(
        'Reducción de peso de aproximadamente −22% a 36 semanas con la dosis más alta frente a placebo, en un número reducido de participantes.',
        'Weight reduction of approximately −22% at 36 weeks with the highest dose versus placebo, in a small number of participants.',
      ),
    },
    {
      name: 'Fase 1 oral',
      year: 2025,
      finding: t(
        'Amicretina oral hasta 100 mg/día: en torno a −13% de peso a 12 semanas frente a −1% con placebo.',
        'Oral amycretin up to 100 mg daily: around −13% weight at 12 weeks vs −1% with placebo.',
      ),
      ref: 'Lancet 2025',
    },
  ],
  references: [
    { label: 'Novo Nordisk amycretin phase 1/2 programme (investigational)' },
    { label: 'Oral amycretin phase 1 trial. Lancet 2025' },
  ],
  tags: ['glp1', 'amilina', 'coagonista', 'obesidad', 'oral', 'semanal', 'investigacional'],
  lastReviewed: '2026-09-19',
}

// ---------------------------------------------------------------------------
// Oral non-peptide GLP-1 receptor agonists
// ---------------------------------------------------------------------------

const orforglipron: CompoundEntry = {
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

const danuglipron: CompoundEntry = {
  id: 'danuglipron',
  names: {
    generic: 'Danuglipron',
    brands: [],
    aliases: ['PF-06882961'],
  },
  category: 'incretin',
  pharmClass: t(
    'Agonista del receptor de GLP-1 oral, no peptídico (molécula pequeña) — desarrollo interrumpido',
    'Oral non-peptide small-molecule GLP-1 receptor agonist — development discontinued',
  ),
  summary: t(
    'Agonista oral no peptídico del receptor de GLP-1 desarrollado por Pfizer, administrado dos veces al día. Pfizer interrumpió su desarrollo en 2025 tras un caso de lesión hepática potencialmente inducida por el fármaco, sumado a la elevada intolerancia gastrointestinal y al abandono previo de la formulación de una toma diaria.',
    'Oral non-peptide GLP-1 receptor agonist developed by Pfizer, given twice daily. Pfizer discontinued development in 2025 after a case of potentially drug-induced liver injury, on top of high gastrointestinal intolerance and the earlier abandonment of the once-daily formulation.',
  ),
  mechanism: t(
    'Molécula pequeña que activa el receptor de GLP-1 desde un bolsillo de unión distinto al del péptido nativo, con agonismo sesgado hacia la vía de AMPc. Produce insulinotropía dependiente de glucosa, supresión de glucagón y reducción del apetito. Su semivida corta obligaba a dos tomas diarias con alimentos, y el metabolismo dependiente de CYP2C9/CYP3A4 introduce interacciones que no existen con los GLP-1 peptídicos.',
    'Small molecule activating the GLP-1 receptor from a binding pocket distinct from the native peptide, with cAMP-biased agonism. It produces glucose-dependent insulinotropy, glucagon suppression and appetite reduction. Its short half-life required twice-daily dosing with food, and CYP2C9/CYP3A4-dependent metabolism introduces interactions absent with peptide GLP-1 RAs.',
  ),
  indications: [
    t(
      'Obesidad (fase 2b; desarrollo interrumpido)',
      'Obesity (phase 2b; development discontinued)',
    ),
    t(
      'Diabetes mellitus tipo 2 (fase 2; desarrollo interrumpido)',
      'Type 2 diabetes (phase 2; development discontinued)',
    ),
  ],
  evidence: 'phase2',
  regulatory: {
    us: 'discontinued',
    eu: 'discontinued',
    notes: t(
      'Pfizer anunció en abril de 2025 el cese del desarrollo de danuglipron tras detectarse una elevación asintomática de transaminasas en un participante compatible con lesión hepática inducida por fármaco. Previamente, en 2023, se había abandonado la formulación de una sola toma diaria por intolerancia gastrointestinal. No estará disponible como medicamento; se incluye por valor histórico y porque puede aparecer en el mercado gris.',
      'In April 2025 Pfizer announced it was stopping danuglipron development after an asymptomatic transaminase elevation in one participant consistent with drug-induced liver injury. Earlier, in 2023, the once-daily formulation had been abandoned because of gastrointestinal intolerance. It will not become a medicine; it is included for historical value and because it may appear on the grey market.',
    ),
  },
  routes: ['oral'],
  defaultUnit: 'mg',
  pk: {
    halfLifeH: 5,
    tmaxH: 2,
    source:
      'Datos en investigación: fase 1 de danuglipron (PF-06882961, Pfizer). t½ corto (aproximadamente 4–6 h), tmax ~1–3 h, que obligaba a administración dos veces al día con alimentos.',
    notes:
      'Programa interrumpido en 2025; los parámetros son de estudios fase 1/2 y nunca llegarán a una ficha técnica.',
  },
  dosing: {
    investigational: t(
      'Fase 2b en obesidad: escalada hasta 80–200 mg dos veces al día con las comidas. Ninguna pauta llegó a fase 3 y no existe dosis aprobada; no debe utilizarse.',
      'Phase 2b in obesity: escalation to 80–200 mg twice daily with meals. No regimen reached phase 3 and there is no approved dose; it should not be used.',
    ),
    frequency: t(
      '2×/día (oral, con alimentos) — programa interrumpido',
      'Twice daily (oral, with food) — programme discontinued',
    ),
  },
  reconstitution: t(
    'Comprimido oral; no procede reconstitución. Sin presentación comercial: cualquier material etiquetado como danuglipron procede del mercado de investigación, sin control alguno.',
    'Oral tablet; no reconstitution. No commercial presentation: any material labelled danuglipron comes from the research market, with no quality control whatsoever.',
  ),
  storage: t(
    'Comprimidos a temperatura ambiente en envase original protegido de la humedad. Sin datos de estabilidad publicados fuera del ensayo.',
    'Tablets at room temperature in the original container, protected from moisture. No published stability data outside the trial.',
  ),
  adverseEffects: {
    common: [
      t(
        'Náuseas (hasta ~73% en algunos brazos), vómitos (hasta ~47%) y diarrea (~25%): intolerancia GI muy superior a la de los GLP-1 inyectables',
        'Nausea (up to ~73% in some arms), vomiting (up to ~47%) and diarrhoea (~25%): GI intolerance much higher than with injectable GLP-1 RAs',
      ),
      t('Dispepsia y dolor abdominal', 'Dyspepsia and abdominal pain'),
      t('Cefalea', 'Headache'),
      t(
        'Tasas de abandono superiores al 50% en algunos brazos de fase 2b',
        'Discontinuation rates above 50% in some phase 2b arms',
      ),
    ],
    serious: [
      t(
        'Señal de lesión hepática inducida por fármaco: elevación asintomática pero marcada de transaminasas en un participante, motivo de la interrupción del programa en 2025',
        'Drug-induced liver injury signal: asymptomatic but marked transaminase elevation in one participant, the reason for stopping the programme in 2025',
      ),
      t(
        'Elevaciones de transaminasas dependientes de la dosis en varios estudios',
        'Dose-dependent transaminase elevations in several studies',
      ),
      t('Deshidratación por vómitos persistentes', 'Dehydration from persistent vomiting'),
      t('Hipoglucemia con insulina o sulfonilureas', 'Hypoglycaemia with insulin or sulfonylureas'),
    ],
  },
  contraindications: [
    t(
      'Hepatopatía activa o elevación basal de transaminasas (señal de hepatotoxicidad del programa)',
      'Active liver disease or baseline transaminase elevation (programme hepatotoxicity signal)',
    ),
    t(
      'La advertencia de recuadro por carcinoma medular de tiroides corresponde a los agonistas peptídicos de GLP-1 y no se aplicó a esta molécula pequeña',
      'The medullary thyroid carcinoma boxed warning applies to peptide GLP-1 RAs and was not applied to this small molecule',
    ),
    t('Embarazo y lactancia', 'Pregnancy and breastfeeding'),
    t(
      'Uso clínico de cualquier tipo: el desarrollo está interrumpido y no hay producto autorizado',
      'Any clinical use: development is discontinued and there is no authorised product',
    ),
  ],
  interactions: [
    t(
      'Sustrato de CYP2C9 y CYP3A4: interacciones con inhibidores/inductores potentes, a diferencia de los GLP-1 peptídicos',
      'CYP2C9 and CYP3A4 substrate: interactions with strong inhibitors/inducers, unlike peptide GLP-1 RAs',
    ),
    t(
      'Fármacos hepatotóxicos concomitantes: riesgo aditivo',
      'Concomitant hepatotoxic drugs: additive risk',
    ),
    t('Insulina y sulfonilureas: hipoglucemia', 'Insulin and sulfonylureas: hypoglycaemia'),
  ],
  monitoring: [
    t(
      'Transaminasas y bilirrubina (motivo de la interrupción del programa)',
      'Transaminases and bilirubin (the reason the programme was stopped)',
    ),
    t('Peso y tolerancia GI', 'Weight and GI tolerance'),
    t(
      'Glucemia si tratamiento antidiabético concomitante',
      'Glucose if concomitant antidiabetic treatment',
    ),
  ],
  keyTrials: [
    {
      name: 'Fase 2b obesidad',
      year: 2024,
      finding: t(
        'Pérdida de peso de aproximadamente −8% a −13% a 26–32 semanas, con tasas muy elevadas de náuseas y vómitos y abandonos superiores al 50% en los brazos de dosis alta.',
        'Weight loss of approximately −8% to −13% at 26–32 weeks, with very high nausea and vomiting rates and discontinuation above 50% in high-dose arms.',
      ),
    },
    {
      name: 'Fase 2 DM2',
      year: 2023,
      finding: t(
        'Reducción de HbA1c dosis-dependiente frente a placebo, con perfil de tolerancia gastrointestinal desfavorable.',
        'Dose-dependent HbA1c reduction versus placebo, with an unfavourable gastrointestinal tolerability profile.',
      ),
    },
  ],
  references: [
    { label: 'Pfizer announcement discontinuing danuglipron development, April 2025' },
    { label: 'Danuglipron (PF-06882961) phase 2b obesity trial' },
  ],
  tags: [
    'glp1',
    'oral',
    'molécula pequeña',
    'no peptídico',
    'hepatotoxicidad',
    'discontinuado',
    'investigacional',
  ],
  lastReviewed: '2026-09-19',
}

// ---------------------------------------------------------------------------
// Long-acting conjugates and other weekly GLP-1 RAs
// ---------------------------------------------------------------------------

const efpeglenatide: CompoundEntry = {
  id: 'efpeglenatide',
  names: {
    generic: 'Efpeglenatida',
    brands: [],
    aliases: ['HM11260C', 'LAPS-Exendin4'],
  },
  category: 'incretin',
  pharmClass: t(
    'Agonista del receptor de GLP-1 basado en exendina conjugado a Fc (acción semanal)',
    'Exendin-based, Fc-conjugated GLP-1 receptor agonist (once weekly)',
  ),
  summary: t(
    'Análogo de exendina-4 unido mediante un enlazador flexible a un fragmento Fc de IgG4 (plataforma LAPSCOVERY de Hanmi), con semivida de ~1 semana. Demostró reducción de eventos cardiovasculares y renales en el ensayo AMPLITUDE-O, pero su desarrollo comercial quedó detenido tras la devolución de los derechos por Sanofi.',
    'Exendin-4 analogue linked through a flexible linker to an IgG4 Fc fragment (Hanmi LAPSCOVERY platform), with a ~1-week half-life. It reduced cardiovascular and renal events in the AMPLITUDE-O trial, but commercial development stalled after Sanofi returned the rights.',
  ),
  mechanism: t(
    'Agonismo completo del receptor GLP-1 con la estructura de exendina-4 (resistente a DPP-4), prolongado por conjugación a Fc que reduce el aclaramiento renal y permite dosificación semanal. Efectos clásicos de clase: insulinotropía dependiente de glucosa, supresión de glucagón, retraso del vaciamiento gástrico y saciedad. La eliminación depende en parte de la función renal.',
    'Full GLP-1 receptor agonism with an exendin-4 backbone (DPP-4 resistant), prolonged by Fc conjugation that lowers renal clearance and enables weekly dosing. Classic class effects: glucose-dependent insulinotropy, glucagon suppression, delayed gastric emptying and satiety. Elimination depends in part on renal function.',
  ),
  indications: [
    t(
      'Diabetes mellitus tipo 2 con alto riesgo cardiovascular o renal (AMPLITUDE-O)',
      'Type 2 diabetes with high cardiovascular or renal risk (AMPLITUDE-O)',
    ),
    t(
      'Control de peso (objetivo secundario en los ensayos)',
      'Weight management (secondary endpoint in trials)',
    ),
  ],
  evidence: 'phase3',
  regulatory: {
    us: 'investigational',
    eu: 'investigational',
    notes: t(
      'No aprobada pese a completar un programa fase 3 con resultado cardiovascular positivo: el desarrollo se detuvo por decisión comercial de Sanofi al salir del área de diabetes, no por seguridad. Sin comercialización prevista a corto plazo.',
      'Not approved despite completing a phase 3 programme with a positive cardiovascular outcome: development stopped for commercial reasons when Sanofi exited diabetes, not for safety. No marketing expected in the short term.',
    ),
  },
  routes: ['sc'],
  defaultUnit: 'mg',
  pk: {
    halfLifeH: 168,
    tmaxH: 48,
    source:
      'Datos en investigación: fase 1/2 de efpeglenatida (HM11260C, Hanmi/Sanofi) y programa AMPLITUDE. t½ ≈ 1 semana (~168 h), tmax ~2–4 días por la conjugación a Fc.',
    notes:
      'Parámetros de ensayo clínico; nunca hubo ficha técnica. La exposición aumenta en insuficiencia renal.',
  },
  dosing: {
    investigational: t(
      'AMPLITUDE-O: 4 mg/semana y 6 mg/semana tras escalada desde 2 mg. Otros estudios exploraron pautas de 4–6 mg semanales o quincenales. Sin dosis aprobada.',
      'AMPLITUDE-O: 4 mg weekly and 6 mg weekly after escalation from 2 mg. Other studies explored 4–6 mg weekly or fortnightly regimens. No approved dose.',
    ),
    frequency: t('1×/semana', 'Once weekly'),
  },
  reconstitution: t(
    'Administrada en los ensayos en pluma/autoinyector precargado listo para usar; no requiere reconstitución. No existe presentación comercial.',
    'Given in trials as a ready-to-use prefilled pen/autoinjector; no reconstitution. There is no commercial presentation.',
  ),
  storage: t(
    'Producto de ensayo: 2–8 °C, protegido de la luz, sin congelar. Al ser una proteína de fusión Fc, evitar agitación y congelación-descongelación.',
    'Investigational product: 2–8 °C, protect from light, do not freeze. As an Fc fusion protein, avoid shaking and freeze–thaw cycles.',
  ),
  adverseEffects: {
    common: [
      t(
        'Náuseas, vómitos y diarrea (perfil GI típico de las exendinas, algo más marcado que con análogos de GLP-1 humano)',
        'Nausea, vomiting and diarrhoea (typical exendin GI profile, somewhat more marked than with human GLP-1 analogues)',
      ),
      t(
        'Estreñimiento, dispepsia, disminución del apetito',
        'Constipation, dyspepsia, decreased appetite',
      ),
      t(
        'Reacciones en el punto de inyección y nódulos (frecuentes con conjugados de acción prolongada)',
        'Injection-site reactions and nodules (frequent with long-acting conjugates)',
      ),
    ],
    serious: [
      t('Pancreatitis aguda (efecto de clase)', 'Acute pancreatitis (class effect)'),
      t('Colelitiasis y colecistitis', 'Cholelithiasis and cholecystitis'),
      t('Hipoglucemia con insulina o sulfonilureas', 'Hypoglycaemia with insulin or sulfonylureas'),
      t(
        'Inmunogenicidad: anticuerpos antifármaco con posible pérdida de eficacia o reacciones locales',
        'Immunogenicity: anti-drug antibodies with possible loss of efficacy or local reactions',
      ),
    ],
  },
  contraindications: [
    t(
      'Antecedente personal o familiar de carcinoma medular de tiroides o MEN2 (advertencia de clase de los agonistas peptídicos de GLP-1)',
      'Personal or family history of medullary thyroid carcinoma or MEN2 (peptide GLP-1 RA class warning)',
    ),
    t('Pancreatitis previa; gastroparesia', 'Prior pancreatitis; gastroparesis'),
    t(
      'Insuficiencia renal grave o terminal (acumulación de las exendinas)',
      'Severe or end-stage renal impairment (exendin accumulation)',
    ),
    t('Embarazo y lactancia', 'Pregnancy and breastfeeding'),
  ],
  interactions: [
    t('Insulina y sulfonilureas: reducir dosis', 'Insulin and sulfonylureas: reduce dose'),
    t(
      'Orales de ventana estrecha y antibióticos de absorción crítica: separar administración por el retraso del vaciamiento gástrico',
      'Narrow-window oral drugs and absorption-critical antibiotics: separate administration because of delayed gastric emptying',
    ),
  ],
  monitoring: [
    t('HbA1c, glucemia y peso', 'HbA1c, glucose and weight'),
    t(
      'Función renal y albuminuria (beneficio renal demostrado en AMPLITUDE-O)',
      'Renal function and albuminuria (renal benefit shown in AMPLITUDE-O)',
    ),
    t('Tolerancia GI y reacciones locales', 'GI tolerance and local reactions'),
  ],
  keyTrials: [
    {
      name: 'AMPLITUDE-O',
      year: 2021,
      finding: t(
        'Reducción del 27% de eventos cardiovasculares mayores y del 32% del objetivo renal compuesto en DM2 con enfermedad CV o renal establecida.',
        '27% reduction in major cardiovascular events and 32% in the composite renal endpoint in T2D with established CV or kidney disease.',
      ),
      ref: 'NEJM 2021;385:896',
    },
  ],
  references: [
    {
      label:
        'Gerstein HC et al. Cardiovascular and Renal Outcomes with Efpeglenatide in Type 2 Diabetes. NEJM 2021',
    },
    { label: 'Hanmi Pharmaceutical LAPSCOVERY efpeglenatide programme (investigational)' },
  ],
  tags: ['glp1', 'exendina', 'fc', 'dm2', 'cardiovascular', 'renal', 'semanal', 'investigacional'],
  lastReviewed: '2026-09-19',
}

const maridebartCafraglutide: CompoundEntry = {
  id: 'maridebart-cafraglutide',
  names: {
    generic: 'Maridebart cafraglutida',
    brands: [],
    aliases: ['MariTide', 'AMG 133'],
  },
  category: 'incretin',
  pharmClass: t(
    'Conjugado anticuerpo-péptido: antagonista del receptor de GIP y agonista del receptor de GLP-1 (acción mensual)',
    'Antibody–peptide conjugate: GIP receptor antagonist and GLP-1 receptor agonist (monthly)',
  ),
  summary: t(
    'Anticuerpo monoclonal anti-receptor de GIP al que se conjugan covalentemente dos péptidos análogos de GLP-1. Su semivida de ~3 semanas permite administración mensual o incluso menos frecuente, un perfil único en la clase. En fase 2 alcanzó alrededor de −20% de peso a 52 semanas sin meseta, a costa de una tasa muy elevada de vómitos con la dosificación inicial sin escalada.',
    'Monoclonal antibody against the GIP receptor with two GLP-1 analogue peptides covalently conjugated to it. Its ~3-week half-life allows monthly or even less frequent dosing, a profile unique in the class. In phase 2 it reached about −20% weight at 52 weeks with no plateau, at the cost of very high vomiting rates when given without escalation.',
  ),
  mechanism: t(
    'Combinación deliberadamente paradójica: antagonismo crónico del receptor de GIP (que por desensibilización crónica remeda el efecto de la agonización sostenida) junto con agonismo de GLP-1. El armazón de anticuerpo proporciona reciclaje por FcRn y una semivida de semanas, mientras que la carga peptídica aporta la señal incretínica. El resultado es una exposición sostenida y plana con una única inyección mensual.',
    'A deliberately paradoxical combination: chronic GIP receptor antagonism (which, through chronic desensitisation, mimics the effect of sustained agonism) together with GLP-1 agonism. The antibody scaffold provides FcRn recycling and a half-life of weeks, while the peptide payload supplies the incretin signal. The result is sustained, flat exposure from a single monthly injection.',
  ),
  indications: [
    t(
      'Obesidad y sobrepeso con comorbilidad (programa fase 3 MARITIME)',
      'Obesity and overweight with comorbidity (MARITIME phase 3 programme)',
    ),
    t('Diabetes mellitus tipo 2 con obesidad (fase 3)', 'Type 2 diabetes with obesity (phase 3)'),
    t(
      'Apnea obstructiva del sueño asociada a obesidad (estudios del programa)',
      'Obesity-related obstructive sleep apnoea (programme studies)',
    ),
  ],
  evidence: 'phase3',
  regulatory: {
    us: 'investigational',
    eu: 'investigational',
    notes: t(
      'No aprobado. Amgen desarrolla el programa fase 3 MARITIME con esquemas de escalada diseñados específicamente para mitigar los vómitos observados en fase 2. La posología mensual es su principal diferenciador frente a los inyectables semanales.',
      'Not approved. Amgen is running the MARITIME phase 3 programme with escalation schemes designed specifically to mitigate the vomiting seen in phase 2. Monthly dosing is its main differentiator versus weekly injectables.',
    ),
  },
  routes: ['sc'],
  defaultUnit: 'mg',
  pk: {
    halfLifeH: 504,
    tmaxH: 168,
    source:
      'Datos en investigación: fase 1 de maridebart cafraglutida (AMG 133, Amgen; Véniant et al., Nat Metab 2024) y programa MARITIME. t½ ≈ 3 semanas (~504 h), tmax ~5–9 días; conjugado anticuerpo-péptido con reciclaje FcRn.',
    notes:
      'La semivida prolongada implica que los efectos adversos y la exposición persisten semanas tras suspender; el estado estacionario tarda ~3–4 meses. Se han explorado intervalos de 4 y de 8 semanas.',
  },
  dosing: {
    investigational: t(
      'Fase 2: 140, 280 y 420 mg cada 4 semanas, con y sin escalada, y algunos brazos cada 8 semanas. Fase 3 emplea escalada progresiva hasta dosis de mantenimiento mensuales para reducir los vómitos. Sin dosis aprobada.',
      'Phase 2: 140, 280 and 420 mg every 4 weeks, with and without escalation, plus some every-8-week arms. Phase 3 uses progressive escalation to monthly maintenance doses to reduce vomiting. No approved dose.',
    ),
    frequency: t(
      '1×/mes (cada 4 semanas; se exploran intervalos de 8 semanas)',
      'Once monthly (every 4 weeks; 8-week intervals under study)',
    ),
  },
  reconstitution: t(
    'Administrado en los ensayos mediante autoinyector precargado; por el volumen y la concentración de proteína se han empleado dispositivos de gran volumen. No requiere reconstitución por el usuario.',
    'Given in trials with a prefilled autoinjector; large-volume devices have been used because of the volume and protein concentration. No user reconstitution.',
  ),
  storage: t(
    'Producto biológico de ensayo: nevera 2–8 °C, protegido de la luz, sin congelar ni agitar. Atemperar antes de inyectar para reducir el dolor de la inyección.',
    'Investigational biologic: refrigerate 2–8 °C, protect from light, do not freeze or shake. Allow to reach room temperature before injecting to reduce injection pain.',
  ),
  adverseEffects: {
    common: [
      t(
        'Vómitos: tasa notablemente elevada (hasta ~60–70% en los brazos sin escalada de fase 2), concentrada tras las primeras dosis',
        'Vomiting: strikingly high rates (up to ~60–70% in non-escalated phase 2 arms), concentrated after the first doses',
      ),
      t(
        'Náuseas (mayoría de los participantes), diarrea, estreñimiento',
        'Nausea (most participants), diarrhoea, constipation',
      ),
      t(
        'Reacciones en el punto de inyección por el volumen administrado',
        'Injection-site reactions related to the injected volume',
      ),
      t('Fatiga y cefalea', 'Fatigue and headache'),
    ],
    serious: [
      t(
        'Vómitos intensos con deshidratación y lesión renal aguda',
        'Severe vomiting with dehydration and acute kidney injury',
      ),
      t(
        'Abandonos por efectos adversos gastrointestinales en una proporción relevante de fase 2',
        'Discontinuation for gastrointestinal adverse events in a relevant proportion in phase 2',
      ),
      t('Pancreatitis aguda (efecto de clase)', 'Acute pancreatitis (class effect)'),
      t(
        'Persistencia de los efectos adversos durante semanas por la semivida prolongada: no es reversible al suspender de forma inmediata',
        'Adverse effects persist for weeks because of the long half-life: stopping does not reverse them promptly',
      ),
      t(
        'Inmunogenicidad potencial propia de un conjugado anticuerpo-péptido',
        'Potential immunogenicity inherent to an antibody–peptide conjugate',
      ),
    ],
  },
  contraindications: [
    t(
      'Antecedente personal o familiar de carcinoma medular de tiroides o MEN2: contiene una carga peptídica agonista de GLP-1, por lo que se aplica la advertencia de clase',
      'Personal or family history of medullary thyroid carcinoma or MEN2: it carries a GLP-1 agonist peptide payload, so the class warning applies',
    ),
    t('Pancreatitis previa; gastroparesia', 'Prior pancreatitis; gastroparesis'),
    t(
      'Embarazo y lactancia; por la semivida de semanas, suspender con mucha antelación antes de una gestación planificada',
      'Pregnancy and breastfeeding; given the weeks-long half-life, discontinue well in advance of a planned pregnancy',
    ),
    t(
      'Situaciones que requieran retirada rápida del fármaco (cirugía inminente, enfermedad aguda) por la imposibilidad de revertir la exposición',
      'Situations requiring rapid drug withdrawal (imminent surgery, acute illness) given the inability to reverse exposure',
    ),
  ],
  interactions: [
    t('Insulina y sulfonilureas: reducir dosis', 'Insulin and sulfonylureas: reduce dose'),
    t(
      'Orales de ventana estrecha: el vaciamiento gástrico retrasado se mantiene durante todo el intervalo mensual',
      'Narrow-window oral drugs: delayed gastric emptying persists throughout the monthly interval',
    ),
    t(
      'Anestesia y sedación: valorar retención gástrica incluso semanas después de la última dosis',
      'Anaesthesia and sedation: consider gastric retention even weeks after the last dose',
    ),
  ],
  monitoring: [
    t('Peso y composición corporal', 'Weight and body composition'),
    t(
      'Vómitos, hidratación y función renal tras cada administración, sobre todo en las primeras dosis',
      'Vomiting, hydration and renal function after each administration, especially in the first doses',
    ),
    t('HbA1c y glucemia', 'HbA1c and glucose'),
    t(
      'Anticuerpos antifármaco si hay pérdida de eficacia o reacciones sistémicas',
      'Anti-drug antibodies if efficacy is lost or systemic reactions occur',
    ),
  ],
  keyTrials: [
    {
      name: 'Fase 2 obesidad (MariTide)',
      year: 2025,
      finding: t(
        'Pérdida de peso de aproximadamente −20% a 52 semanas con las dosis altas, sin meseta al final del estudio; los brazos con escalada redujeron sustancialmente los vómitos.',
        'Weight loss of approximately −20% at 52 weeks with the higher doses, with no plateau by study end; escalation arms substantially reduced vomiting.',
      ),
      ref: 'NEJM 2025',
    },
    {
      name: 'Fase 1 (AMG 133)',
      year: 2024,
      finding: t(
        'Dosis única con pérdida de peso sostenida hasta 150 días después de la última administración, confirmando la semivida de semanas.',
        'Single doses produced sustained weight loss up to 150 days after the last administration, confirming the weeks-long half-life.',
      ),
      ref: 'Nat Metab 2024',
    },
    {
      name: 'MARITIME (programa fase 3)',
      year: 2025,
      finding: t(
        'Programa fase 3 en obesidad, obesidad con DM2 y apnea del sueño, con esquemas de escalada orientados a la tolerancia. En curso.',
        'Phase 3 programme in obesity, obesity with T2D and sleep apnoea, with tolerability-oriented escalation schemes. Ongoing.',
      ),
    },
  ],
  references: [
    {
      label:
        'Véniant MM et al. A GIPR antagonist conjugated to GLP-1 analogues (AMG 133). Nat Metab 2024',
    },
    { label: 'MariTide phase 2 obesity trial. NEJM 2025' },
    { label: 'Amgen MARITIME phase 3 programme (investigational)' },
  ],
  tags: ['glp1', 'gip', 'anticuerpo', 'conjugado', 'obesidad', 'mensual', 'investigacional'],
  lastReviewed: '2026-09-19',
}

const ecnoglutide: CompoundEntry = {
  id: 'ecnoglutide',
  names: {
    generic: 'Ecnoglutida',
    brands: [],
    aliases: ['XW003'],
  },
  category: 'incretin',
  pharmClass: t(
    'Agonista del receptor de GLP-1 sesgado hacia AMPc (acción semanal)',
    'cAMP-biased GLP-1 receptor agonist (once weekly)',
  ),
  summary: t(
    'Análogo de GLP-1 de acción prolongada desarrollado por Sciwind Biosciences, diseñado como agonista sesgado hacia la señalización por AMPc con reclutamiento reducido de β-arrestina. Administración semanal subcutánea; los datos disponibles proceden de estudios fase 1/2 y fase 3 realizados mayoritariamente en China, con pérdidas de peso en torno al −13% a −15%.',
    'Long-acting GLP-1 analogue developed by Sciwind Biosciences, engineered as a cAMP-biased agonist with reduced β-arrestin recruitment. Weekly subcutaneous dosing; available data come from phase 1/2 and phase 3 studies conducted mainly in China, with weight losses of around −13% to −15%.',
  ),
  mechanism: t(
    'El sesgo hacia la vía del AMPc con menor internalización del receptor pretende mantener la señal incretínica con menos desensibilización. Efectos de clase: insulinotropía dependiente de glucosa, supresión de glucagón, retraso del vaciamiento gástrico y reducción del apetito. Su bajo coste de producción (expresión en levadura) se ha planteado como ventaja de acceso.',
    'The cAMP bias with reduced receptor internalisation aims to preserve the incretin signal with less desensitisation. Class effects: glucose-dependent insulinotropy, glucagon suppression, delayed gastric emptying and appetite reduction. Its low production cost (yeast expression) has been proposed as an access advantage.',
  ),
  indications: [
    t(
      'Obesidad y sobrepeso (fase 2 internacional; fase 3 en China)',
      'Obesity and overweight (international phase 2; phase 3 in China)',
    ),
    t('Diabetes mellitus tipo 2 (fase 2/3)', 'Type 2 diabetes (phase 2/3)'),
    t('Esteatosis hepática metabólica (exploratorio)', 'Metabolic hepatic steatosis (exploratory)'),
  ],
  evidence: 'phase2',
  regulatory: {
    us: 'investigational',
    eu: 'investigational',
    notes: t(
      'No aprobada. La evidencia más sólida procede de estudios realizados en China con tamaños muestrales moderados; la extrapolación a poblaciones occidentales es limitada. Comprobar el estado de las solicitudes regulatorias en China antes de informar.',
      'Not approved. The strongest evidence comes from Chinese studies with moderate sample sizes; extrapolation to Western populations is limited. Check the status of Chinese regulatory filings before counselling.',
    ),
  },
  routes: ['sc'],
  defaultUnit: 'mg',
  pk: {
    halfLifeH: 150,
    tmaxH: 36,
    source:
      'Datos en investigación: fase 1 de ecnoglutida (XW003, Sciwind Biosciences) y estudios fase 2. t½ compatible con administración semanal (aproximadamente 6 días, ~150 h), tmax ~1–2 días.',
    notes:
      'Parámetros de ensayo clínico, no de ficha técnica; la caracterización farmacocinética publicada es menos extensa que la de los agentes en fase 3 avanzada.',
  },
  dosing: {
    investigational: t(
      'Fase 2 en obesidad: 1,2; 1,8 y 2,4 mg/semana tras escalada de 8–16 semanas. En DM2 se han estudiado dosis similares. Sin dosis aprobada.',
      'Phase 2 in obesity: 1.2, 1.8 and 2.4 mg weekly after an 8–16 week escalation. Similar doses have been studied in T2D. No approved dose.',
    ),
    frequency: t('1×/semana', 'Once weekly'),
  },
  reconstitution: t(
    'Administrada en ensayos en pluma/autoinyector precargado listo para usar; no requiere reconstitución ni existe presentación comercial fuera de China.',
    'Given in trials as a ready-to-use prefilled pen/autoinjector; no reconstitution and no commercial presentation outside China.',
  ),
  storage: t(
    'Producto de ensayo: 2–8 °C, protegido de la luz, sin congelar. Sin datos públicos de estabilidad a temperatura ambiente.',
    'Investigational product: 2–8 °C, protect from light, do not freeze. No public room-temperature stability data.',
  ),
  adverseEffects: {
    common: [
      t(
        'Náuseas, diarrea, vómitos y disminución del apetito, en su mayoría leves y transitorios durante la escalada',
        'Nausea, diarrhoea, vomiting and decreased appetite, mostly mild and transient during escalation',
      ),
      t('Estreñimiento y dispepsia', 'Constipation and dyspepsia'),
      t('Reacciones en el punto de inyección', 'Injection-site reactions'),
      t('Aumento leve de frecuencia cardíaca', 'Mild heart-rate increase'),
    ],
    serious: [
      t(
        'Pancreatitis aguda (efecto de clase; datos aún limitados)',
        'Acute pancreatitis (class effect; data still limited)',
      ),
      t('Colelitiasis con pérdida rápida de peso', 'Cholelithiasis with rapid weight loss'),
      t(
        'Hipoglucemia en combinación con insulina o sulfonilureas',
        'Hypoglycaemia in combination with insulin or sulfonylureas',
      ),
      t('Deshidratación por vómitos o diarrea', 'Dehydration from vomiting or diarrhoea'),
    ],
  },
  contraindications: [
    t(
      'Antecedente personal o familiar de carcinoma medular de tiroides o MEN2 (advertencia de clase de los agonistas peptídicos de GLP-1)',
      'Personal or family history of medullary thyroid carcinoma or MEN2 (peptide GLP-1 RA class warning)',
    ),
    t('Pancreatitis previa; gastroparesia', 'Prior pancreatitis; gastroparesis'),
    t('Embarazo y lactancia', 'Pregnancy and breastfeeding'),
    t(
      'Uso fuera de ensayo clínico: no hay indicación aprobada',
      'Use outside a clinical trial: no approved indication',
    ),
  ],
  interactions: [
    t('Insulina y sulfonilureas: reducir dosis', 'Insulin and sulfonylureas: reduce dose'),
    t(
      'Orales de ventana estrecha: vigilar por vaciamiento gástrico retrasado',
      'Narrow-window oral drugs: monitor for delayed gastric emptying',
    ),
  ],
  monitoring: [
    t('Peso, HbA1c y glucemia', 'Weight, HbA1c and glucose'),
    t('Tolerancia GI durante la escalada', 'GI tolerance during escalation'),
    t('Transaminasas si indicación hepática', 'Transaminases if hepatic indication'),
  ],
  keyTrials: [
    {
      name: 'Fase 2 obesidad (China)',
      year: 2024,
      finding: t(
        'Pérdida de peso de aproximadamente −13% a −15% a 40–48 semanas con 2,4 mg/semana frente a placebo, con perfil GI de clase.',
        'Weight loss of approximately −13% to −15% at 40–48 weeks with 2.4 mg weekly versus placebo, with a class-typical GI profile.',
      ),
    },
    {
      name: 'Fase 2 DM2 (China)',
      year: 2024,
      finding: t(
        'Reducción significativa de HbA1c y peso frente a placebo en pacientes con DM2.',
        'Significant HbA1c and weight reduction versus placebo in patients with T2D.',
      ),
    },
  ],
  references: [
    { label: 'Sciwind Biosciences ecnoglutide (XW003) clinical programme (investigational)' },
    { label: 'Phase 2 obesity and T2D trials of ecnoglutide (China)' },
  ],
  tags: ['glp1', 'sesgo ampc', 'obesidad', 'dm2', 'china', 'semanal', 'investigacional'],
  lastReviewed: '2026-09-19',
}

export const INCRETINS_INVESTIGATIONAL: CompoundEntry[] = [
  retatrutide,
  cagrilintide,
  cagrisema,
  survodutide,
  mazdutide,
  orforglipron,
  efpeglenatide,
  maridebartCafraglutide,
  ecnoglutide,
  amycretin,
  danuglipron,
]
