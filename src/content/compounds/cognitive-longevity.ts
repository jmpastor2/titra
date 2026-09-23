import { t, type CompoundEntry, type L10n } from '../schema'

/**
 * Cognitive (nootropic) and longevity compounds.
 * Several are nationally registered in Russia/CIS (semax, selank, noopept) or
 * in Central/Eastern Europe and Asia (cerebrolysin) but none is FDA/EMA
 * approved. Khavinson "bioregulator" peptides rest almost entirely on a single
 * research group's small or uncontrolled studies. Evidence tiers are stated
 * conservatively; "anecdotal" dosing is descriptive, never a recommendation.
 */

// ─────────────────────────── shared wording ───────────────────────────

const LYO_STORAGE: L10n = t(
  'Polvo liofilizado: −20 °C a largo plazo, 2–8 °C durante semanas o meses. Reconstituido: 2–8 °C, proteger de la luz, no congelar; desechar a las 2–4 semanas. Producto de investigación: pureza, contenido real y esterilidad no garantizados.',
  'Lyophilised powder: −20 °C long term, 2–8 °C for weeks to months. Reconstituted: 2–8 °C, protect from light, do not freeze; discard after 2–4 weeks. Research product: purity, actual content and sterility not guaranteed.',
)

const RUSSIA_NOTES = (extraEs: string, extraEn: string): L10n =>
  t(
    `Registrado como medicamento en Rusia (y en algunos países de la CEI); no aprobado por la FDA ni por la EMA. Fuera de esos países se vende como "producto de investigación". ${extraEs}`.trim(),
    `Registered as a medicine in Russia (and some CIS countries); not approved by FDA or EMA. Elsewhere it is sold as a "research product". ${extraEn}`.trim(),
  )

const KHAVINSON_NOTES: L10n = t(
  'Péptido corto "bioregulador" del grupo de V. Kh. Khavinson (Instituto de Biorregulación y Gerontología, San Petersburgo). No aprobado por la FDA ni por la EMA; en Rusia/CEI algunos péptidos cortos de esta familia se comercializan como complementos alimenticios, no como medicamentos. Fuera de allí se vende como "producto de investigación". Evidencia casi exclusivamente de un único grupo de investigación y sus colaboradores: estudios in vitro, en animales y series humanas pequeñas o no controladas, publicadas mayoritariamente en revistas rusas; sin replicación independiente ni ensayos aleatorizados.',
  'Short "bioregulator" peptide from V. Kh. Khavinson\'s group (St Petersburg Institute of Bioregulation and Gerontology). Not approved by FDA or EMA; in Russia/CIS some short peptides of this family are marketed as dietary supplements, not medicines. Elsewhere it is sold as a "research product". Evidence comes almost exclusively from a single research group and its collaborators: in vitro, animal and small or uncontrolled human series, mostly in Russian journals; no independent replication or randomised trials.',
)

const KHAVINSON_MECHANISM_TAIL = {
  es: 'El grupo propone que los di-/tri-/tetrapéptidos entran en el núcleo, se unen a secuencias de ADN o histonas y modulan la expresión génica de forma "tejido-específica"; este mecanismo no ha sido validado de forma independiente.',
  en: 'The group proposes that these di-/tri-/tetrapeptides enter the nucleus, bind DNA sequences or histones and modulate gene expression in a "tissue-specific" way; this mechanism has not been independently validated.',
}

const UNCHARACTERISED_SERIOUS: L10n = t(
  'No caracterizados: sin datos de seguridad humana controlados; riesgo de contaminación, endotoxinas o contenido erróneo en productos de investigación',
  'Uncharacterised: no controlled human safety data; risk of contamination, endotoxin or mislabelled content in research products',
)

const PREGNANCY_NO_DATA: L10n = t(
  'Embarazo y lactancia (sin datos)',
  'Pregnancy and lactation (no data)',
)
const ACTIVE_CANCER_THEORETICAL: L10n = t(
  'Neoplasia activa o reciente (precaución teórica ante péptidos con supuesta acción proliferativa o sobre la expresión génica)',
  'Active or recent malignancy (theoretical caution with peptides claimed to act on proliferation or gene expression)',
)
const INJECTION_SITE: L10n = t('Reacciones en el punto de inyección', 'Injection-site reactions')
const NO_KNOWN_INTERACTIONS: L10n = t(
  'Sin interacciones estudiadas en humanos',
  'No interactions studied in humans',
)

const KHAVINSON_GENERAL_REF = {
  label: 'Khavinson VKh. Peptides and ageing. Neuro Endocrinol Lett 2002 (suplemento monográfico)',
}
const KHAVINSON_REVIEW_REF = {
  label:
    'Khavinson VKh et al. Peptide regulation of gene expression: a systematic review. Molecules 2021',
}

const STD_VIAL_RECON = (vialMg: number): L10n => {
  const mgPerMl = vialMg / 2
  const unitsPerMg = 100 / mgPerMl
  const esNum = (n: number) => String(n).replace('.', ',')
  return t(
    `Vial liofilizado de ${vialMg} mg + 2 mL de agua bacteriostática = ${esNum(mgPerMl)} mg/mL. En jeringa U-100: 1 mg = ${esNum(unitsPerMg)} U. Disolver sin agitar enérgicamente. Estable ~2–4 semanas en nevera tras reconstituir.`,
    `${vialMg} mg lyophilised vial + 2 mL bacteriostatic water = ${mgPerMl} mg/mL. U-100 syringe: 1 mg = ${unitsPerMg} U. Dissolve without vigorous shaking. Stable ~2–4 weeks refrigerated after reconstitution.`,
  )
}

export const COGNITIVE_LONGEVITY: CompoundEntry[] = [
  // ───────────────────────────── COGNITIVE ─────────────────────────────
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
    pharmClass: t(
      'Heptapéptido análogo de ACTH(4–7) sin actividad corticotropa (nootrópico/neuroprotector)',
      'ACTH(4–7) heptapeptide analogue without corticotropic activity (nootropic/neuroprotective)',
    ),
    summary: t(
      'Heptapéptido sintético (fragmento ACTH 4–7 + Pro-Gly-Pro) desarrollado en el Instituto de Genética Molecular de la Academia Rusa de Ciencias. Registrado en Rusia en gotas nasales para ictus isquémico, trastornos cognitivos y otras indicaciones neurológicas; la evidencia clínica es rusa, pequeña y de calidad metodológica limitada.',
      'Synthetic heptapeptide (ACTH 4–7 fragment + Pro-Gly-Pro) developed at the Institute of Molecular Genetics, Russian Academy of Sciences. Registered in Russia as nasal drops for ischaemic stroke, cognitive disorders and other neurological indications; clinical evidence is Russian, small and of limited methodological quality.',
    ),
    mechanism: t(
      'Carece de efecto esteroidogénico. En roedores aumenta la expresión de BDNF y de su receptor TrkB en hipocampo y corteza, modula la neurotransmisión dopaminérgica y serotoninérgica y tiene efectos antioxidantes y antiinflamatorios en modelos de isquemia. La extensión Pro-Gly-Pro lo protege parcialmente de la degradación por peptidasas; la semivida plasmática es de minutos.',
      'Lacks steroidogenic activity. In rodents it increases expression of BDNF and its receptor TrkB in hippocampus and cortex, modulates dopaminergic and serotonergic transmission and shows antioxidant and anti-inflammatory effects in ischaemia models. The Pro-Gly-Pro extension partly protects it from peptidase degradation; plasma half-life is minutes.',
    ),
    indications: [
      t(
        'Rusia (registro nacional): ictus isquémico agudo y recuperación (solución 1%)',
        'Russia (national registration): acute ischaemic stroke and recovery (1% solution)',
      ),
      t(
        'Rusia: trastornos cognitivos de origen vascular, encefalopatía, astenia, neuropatía óptica (solución 0,1%)',
        'Russia: cognitive disorders of vascular origin, encephalopathy, asthenia, optic neuropathy (0.1% solution)',
      ),
      t('Ninguna aprobada por FDA/EMA', 'None approved by FDA/EMA'),
      t(
        'Uso no aprobado: "nootrópico" en personas sanas, TDAH, ansiedad (sin evidencia controlada)',
        'Unapproved use: "nootropic" in healthy people, ADHD, anxiety (no controlled evidence)',
      ),
    ],
    evidence: 'phase2',
    regulatory: {
      us: 'research_only',
      notes: RUSSIA_NOTES(
        'Nivel de evidencia asignado como "fase 2" por la existencia de estudios clínicos pequeños en Rusia, no por un programa de desarrollo occidental.',
        'Evidence tier set to "phase 2" because small Russian clinical studies exist, not because of a Western development programme.',
      ),
    },
    routes: ['nasal'],
    defaultUnit: 'mcg',
    dosing: {
      labeled: t(
        'Rusia (ficha nacional, gotas nasales): solución 0,1% (1 mg/mL; ~50 µg por gota) en trastornos cognitivos, habitualmente 2–3 gotas por fosa nasal 2–3×/día en ciclos de 1–2 semanas; solución 1% (10 mg/mL) en ictus isquémico agudo, del orden de 12–18 mg/día repartidos en varias tomas durante 5–10 días. Verificar la ficha vigente.',
        'Russia (national label, nasal drops): 0.1% solution (1 mg/mL; ~50 µg per drop) for cognitive disorders, typically 2–3 drops per nostril 2–3×/day in 1–2-week courses; 1% solution (10 mg/mL) for acute ischaemic stroke, in the order of 12–18 mg/day in divided doses for 5–10 days. Check the current label.',
      ),
      anecdotal: t(
        'Uso no aprobado — fuera de indicación se describen 200–1000 µg/día intranasal en ciclos de 1–4 semanas, a menudo con viales de investigación o con el derivado no registrado N-acetil semax amidato, cuya potencia y seguridad no están establecidas.',
        'Unapproved use — off-label, 200–1000 µg/day intranasally in 1–4-week courses is described, often using research vials or the unregistered derivative N-acetyl semax amidate, whose potency and safety are not established.',
      ),
      frequency: t('2–4×/día intranasal (ficha rusa)', '2–4×/day intranasally (Russian label)'),
    },
    reconstitution: t(
      'El producto registrado se presenta como solución nasal lista para usar (0,1% y 1%). Viales liofilizados de investigación: p. ej. 10 mg en 10 mL de suero fisiológico estéril = 1 mg/mL; con un pulverizador de 0,1 mL por pulsación = 100 µg por pulsación.',
      'The registered product is a ready-to-use nasal solution (0.1% and 1%). Research lyophilised vials: e.g. 10 mg in 10 mL sterile saline = 1 mg/mL; with a 0.1 mL-per-actuation sprayer = 100 µg per actuation.',
    ),
    storage: t(
      'Solución registrada: 2–8 °C; una vez abierta, usar en el plazo indicado en el envase (habitualmente semanas). Liofilizado: −20 °C; reconstituido: 2–8 °C, no congelar.',
      'Registered solution: 2–8 °C; once opened, use within the period stated on the pack (usually weeks). Lyophilised: −20 °C; reconstituted: 2–8 °C, do not freeze.',
    ),
    adverseEffects: {
      common: [
        t('Irritación de la mucosa nasal, rinorrea', 'Nasal mucosal irritation, rhinorrhoea'),
        t(
          'Cefalea, irritabilidad, insomnio si se administra tarde',
          'Headache, irritability, insomnia with late-day dosing',
        ),
      ],
      serious: [
        t(
          'No descritos de forma consistente; farmacovigilancia limitada a Rusia',
          'Not consistently described; pharmacovigilance limited to Russia',
        ),
        t(
          'Posible exacerbación de ansiedad o síntomas psicóticos (precaución de ficha)',
          'Possible worsening of anxiety or psychotic symptoms (label caution)',
        ),
      ],
    },
    contraindications: [
      t('Hipersensibilidad al principio activo', 'Hypersensitivity to the active substance'),
      t(
        'Trastornos psicóticos agudos o ansiedad marcada (según ficha rusa; verificar)',
        'Acute psychotic disorders or marked anxiety (per Russian label; verify)',
      ),
      PREGNANCY_NO_DATA,
    ],
    interactions: [
      t(
        'Sin interacciones farmacocinéticas descritas; teórica aditividad con psicoestimulantes y fármacos dopaminérgicos',
        'No pharmacokinetic interactions described; theoretical additive effect with psychostimulants and dopaminergic drugs',
      ),
    ],
    monitoring: [
      t(
        'Evaluación neurológica y cognitiva clínica en la indicación registrada',
        'Clinical neurological and cognitive assessment in the registered indication',
      ),
    ],
    keyTrials: [],
    references: [
      {
        label:
          'Ficha técnica rusa de Semax (Registro Estatal de Medicamentos de la Federación Rusa, GRLS)',
      },
      {
        label:
          'Dolotov OV et al. Semax, an analog of ACTH(4-10) with cognitive effects, regulates BDNF and trkB expression in the rat hippocampus. Brain Res 2006',
      },
    ],
    tags: ['nootropico', 'intranasal', 'ictus', 'bdnf', 'rusia'],
    lastReviewed: '2026-09-19',
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
    pharmClass: t(
      'Heptapéptido análogo de tuftsina (ansiolítico/inmunomodulador)',
      'Tuftsin-analogue heptapeptide (anxiolytic/immunomodulator)',
    ),
    summary: t(
      'Análogo sintético de la tuftsina (Thr-Lys-Pro-Arg) extendido con Pro-Gly-Pro, desarrollado en el Instituto de Genética Molecular (Rusia). Registrado en Rusia en gotas nasales como ansiolítico; los estudios clínicos son rusos, pequeños y mayoritariamente abiertos o frente a benzodiacepinas.',
      'Synthetic tuftsin (Thr-Lys-Pro-Arg) analogue extended with Pro-Gly-Pro, developed at the Institute of Molecular Genetics (Russia). Registered in Russia as nasal drops for anxiety; clinical studies are Russian, small and mostly open-label or benzodiazepine-comparator.',
    ),
    mechanism: t(
      'Mecanismo no establecido. En modelos animales se describe modulación alostérica del sistema GABA-A, inhibición de encefalinasas (prolonga la vida media de encefalinas), cambios en la expresión de IL-6 y de genes de neurotransmisión, y efectos sobre serotonina y BDNF. Sin efecto sedante ni miorrelajante marcado en los estudios rusos.',
      'Mechanism not established. Animal models suggest allosteric modulation of the GABA-A system, enkephalinase inhibition (prolonging enkephalin half-life), changes in IL-6 and neurotransmission gene expression, and effects on serotonin and BDNF. No marked sedation or muscle relaxation in Russian studies.',
    ),
    indications: [
      t(
        'Rusia (registro nacional): trastorno de ansiedad generalizada, neurastenia, trastornos de adaptación',
        'Russia (national registration): generalised anxiety disorder, neurasthenia, adjustment disorders',
      ),
      t('Ninguna aprobada por FDA/EMA', 'None approved by FDA/EMA'),
      t(
        'Uso no aprobado: ansiedad, "nootrópico", inmunomodulación',
        'Unapproved use: anxiety, "nootropic", immunomodulation',
      ),
    ],
    evidence: 'phase2',
    regulatory: {
      us: 'research_only',
      notes: RUSSIA_NOTES(
        'Nivel "fase 2" asignado por estudios clínicos rusos pequeños; no hay ensayos aleatorizados controlados con placebo de calidad occidental.',
        '"Phase 2" tier assigned because of small Russian clinical studies; there are no Western-quality placebo-controlled randomised trials.',
      ),
    },
    routes: ['nasal'],
    defaultUnit: 'mcg',
    dosing: {
      labeled: t(
        'Rusia (ficha nacional): solución nasal 0,15% (1,5 mg/mL; ~75 µg por gota), habitualmente 2–3 gotas por fosa nasal 3×/día durante 1–2 semanas; el curso puede repetirse. Verificar la ficha vigente.',
        'Russia (national label): 0.15% nasal solution (1.5 mg/mL; ~75 µg per drop), typically 2–3 drops per nostril 3×/day for 1–2 weeks; the course may be repeated. Check the current label.',
      ),
      anecdotal: t(
        'Uso no aprobado — se describen 250–500 µg intranasal 1–3×/día en ciclos de 2–4 semanas, o SC con viales de investigación; la vía SC no forma parte del registro ruso.',
        'Unapproved use — 250–500 µg intranasally 1–3×/day in 2–4-week courses is described, or SC with research vials; the SC route is not part of the Russian registration.',
      ),
      frequency: t('3×/día intranasal (ficha rusa)', '3×/day intranasally (Russian label)'),
    },
    reconstitution: t(
      'Producto registrado: solución nasal lista para usar. Viales de investigación: 5 mg + 2 mL de agua bacteriostática = 2,5 mg/mL; en jeringa U-100, 250 µg = 10 U. Para uso nasal se suele diluir en suero fisiológico estéril (p. ej. 5 mg en 5 mL = 1 mg/mL).',
      'Registered product: ready-to-use nasal solution. Research vials: 5 mg + 2 mL bacteriostatic water = 2.5 mg/mL; U-100 syringe, 250 µg = 10 U. For nasal use it is usually diluted in sterile saline (e.g. 5 mg in 5 mL = 1 mg/mL).',
    ),
    storage: t(
      'Solución registrada: 2–8 °C, usar en el plazo indicado tras abrir. Liofilizado: −20 °C; reconstituido: 2–8 °C, no congelar.',
      'Registered solution: 2–8 °C, use within the stated period after opening. Lyophilised: −20 °C; reconstituted: 2–8 °C, do not freeze.',
    ),
    adverseEffects: {
      common: [
        t('Irritación nasal', 'Nasal irritation'),
        t('Fatiga o somnolencia leve, cefalea', 'Mild fatigue or drowsiness, headache'),
      ],
      serious: [
        t(
          'No descritos de forma consistente; farmacovigilancia limitada',
          'Not consistently described; limited pharmacovigilance',
        ),
      ],
    },
    contraindications: [
      t('Hipersensibilidad', 'Hypersensitivity'),
      PREGNANCY_NO_DATA,
      t('Menores de 18 años (según ficha rusa)', 'Under 18 years (per Russian label)'),
    ],
    interactions: [
      t(
        'Benzodiacepinas y otros ansiolíticos/sedantes: posible potenciación teórica',
        'Benzodiazepines and other anxiolytics/sedatives: possible theoretical potentiation',
      ),
    ],
    monitoring: [
      t(
        'Escalas de ansiedad clínicas si se usa en la indicación registrada',
        'Clinical anxiety scales if used in the registered indication',
      ),
    ],
    keyTrials: [],
    references: [
      {
        label:
          'Ficha técnica rusa de Selank (Registro Estatal de Medicamentos de la Federación Rusa, GRLS)',
      },
      {
        label:
          'Zozulia AA et al. Selank frente a medazepam en trastorno de ansiedad generalizada. Zh Nevrol Psikhiatr Im S S Korsakova 2008',
      },
    ],
    tags: ['ansiolitico', 'intranasal', 'tuftsina', 'rusia'],
    lastReviewed: '2026-09-19',
  },
  {
    id: 'dihexa',
    names: {
      generic: 'Dihexa',
      brands: [],
      aliases: ['PNB-0408', 'N-hexanoil-Tyr-Ile-(6)-aminohexanoic amide'],
    },
    category: 'cognitive',
    pharmClass: t(
      'Análogo oligopeptídico de angiotensina IV; potenciador del sistema HGF/c-Met',
      'Angiotensin IV oligopeptide analogue; HGF/c-Met system potentiator',
    ),
    summary: t(
      'Derivado metabólicamente estabilizado de la angiotensina IV desarrollado en la Universidad Estatal de Washington (Harding, Wright). Activo por vía oral y penetrante en SNC en roedores, donde revierte déficits cognitivos inducidos. Solo existen datos preclínicos; ningún estudio en humanos.',
      'Metabolically stabilised angiotensin IV derivative developed at Washington State University (Harding, Wright). Orally active and CNS-penetrant in rodents, where it reverses induced cognitive deficits. Preclinical data only; no human studies.',
    ),
    mechanism: t(
      'Se une al factor de crecimiento hepatocitario (HGF) y facilita su dimerización, potenciando la señalización por su receptor c-Met; en cultivos neuronales induce espinogénesis y sinaptogénesis (la cifra divulgada de "potencia 10⁷ veces superior a BDNF" procede de un único ensayo in vitro). En ratas revierte déficits de memoria por escopolamina y en modelos de envejecimiento. c-Met es un protooncogén: la activación crónica plantea un riesgo oncogénico teórico no evaluado.',
      'Binds hepatocyte growth factor (HGF) and facilitates its dimerisation, potentiating signalling through its receptor c-Met; in neuronal cultures it induces spinogenesis and synaptogenesis (the widely quoted "10⁷-fold more potent than BDNF" figure comes from a single in vitro assay). In rats it reverses scopolamine-induced and age-related memory deficits. c-Met is a proto-oncogene: chronic activation raises an untested theoretical oncogenic risk.',
    ),
    indications: [
      t('Ninguna aprobada', 'None approved'),
      t(
        'Preclínico: enfermedad de Alzheimer, Parkinson, deterioro cognitivo',
        "Preclinical: Alzheimer's disease, Parkinson's disease, cognitive impairment",
      ),
      t(
        'Nota: fosgonimeton (ATH-1017, Athira), modulador de HGF relacionado pero distinto, no mostró beneficio en ensayos de fase 2/3 en Alzheimer',
        "Note: fosgonimeton (ATH-1017, Athira), a related but distinct HGF modulator, showed no benefit in phase 2/3 Alzheimer's trials",
      ),
    ],
    evidence: 'preclinical',
    regulatory: {
      us: 'research_only',
      notes: t(
        'Vendido como "producto de investigación" (polvo, cápsulas o soluciones transdérmicas). Sin IND conocido para dihexa en sí.',
        'Sold as a "research product" (powder, capsules or transdermal solutions). No known IND for dihexa itself.',
      ),
    },
    routes: ['oral', 'topical', 'sc'],
    defaultUnit: 'mg',
    dosing: {
      anecdotal: t(
        'Uso no aprobado — dosis comunitarias muy variables por vía oral o transdérmica, generalmente de pocos mg hasta ~20 mg/día en ciclos cortos; no existen datos de farmacocinética, dosis-respuesta ni seguridad en humanos.',
        'Unapproved use — highly variable community doses orally or transdermally, generally from a few mg up to ~20 mg/day in short cycles; no human pharmacokinetic, dose-response or safety data exist.',
      ),
      frequency: t('1×/día (uso no aprobado)', 'Once daily (unapproved use)'),
    },
    storage: t(
      'Polvo: −20 °C, seco y protegido de la luz. Poco soluble en agua; las soluciones comerciales usan DMSO u otros vehículos cuya seguridad transdérmica crónica no está establecida.',
      'Powder: −20 °C, dry and protected from light. Poorly water-soluble; commercial solutions use DMSO or other vehicles whose chronic transdermal safety is not established.',
    ),
    adverseEffects: {
      common: [
        t(
          'Cefalea, insomnio, irritabilidad (informes anecdóticos)',
          'Headache, insomnia, irritability (anecdotal reports)',
        ),
      ],
      serious: [
        t(
          'Riesgo oncogénico teórico por activación sostenida de HGF/c-Met (no evaluado)',
          'Theoretical oncogenic risk from sustained HGF/c-Met activation (untested)',
        ),
        UNCHARACTERISED_SERIOUS,
      ],
    },
    contraindications: [
      t(
        'Cáncer activo o antecedente oncológico (la vía c-Met participa en proliferación, invasión y metástasis)',
        'Active cancer or history of malignancy (the c-Met pathway drives proliferation, invasion and metastasis)',
      ),
      PREGNANCY_NO_DATA,
    ],
    interactions: [
      t(
        'Inhibidores de c-Met (crizotinib, capmatinib, tepotinib): antagonismo farmacodinámico teórico',
        'c-Met inhibitors (crizotinib, capmatinib, tepotinib): theoretical pharmacodynamic antagonism',
      ),
      t(
        'IECA/ARA-II: relación con el sistema renina-angiotensina teórica, no estudiada',
        'ACE inhibitors/ARBs: theoretical relationship with the renin-angiotensin system, unstudied',
      ),
    ],
    keyTrials: [],
    references: [
      {
        label:
          'McCoy AT et al. Evaluation of metabolically stabilized angiotensin IV analogs as procognitive/antidementia agents. J Pharmacol Exp Ther 2013',
      },
      {
        label:
          'Benoist CC et al. The procognitive and synaptogenic effects of angiotensin IV-derived peptides are dependent on activation of the hepatocyte growth factor/c-Met system. J Pharmacol Exp Ther 2014',
      },
    ],
    tags: ['nootropico', 'hgf', 'angiotensina', 'preclinico', 'investigacion'],
    lastReviewed: '2026-09-19',
  },
  {
    id: 'cerebrolysin',
    names: {
      generic: 'Cerebrolysin',
      brands: ['Cerebrolysin (EVER Pharma)'],
      aliases: ['FPF-1070', 'hidrolizado de cerebro porcino'],
    },
    category: 'cognitive',
    pharmClass: t(
      'Preparado de péptidos de bajo peso molecular y aminoácidos derivado de cerebro porcino (neurotrófico)',
      'Porcine brain-derived low-molecular-weight peptide and amino-acid preparation (neurotrophic)',
    ),
    summary: t(
      'Mezcla estandarizada de péptidos y aminoácidos libres obtenida por hidrólisis enzimática de proteínas de cerebro de cerdo (EVER Pharma, Austria). Aprobado en varios países de Europa central y oriental, Rusia y Asia para ictus, traumatismo craneoencefálico y demencia; los ensayos grandes son mixtos y la revisión Cochrane en ictus isquémico agudo no encontró beneficio claro.',
      'Standardised mixture of peptides and free amino acids obtained by enzymatic hydrolysis of pig-brain proteins (EVER Pharma, Austria). Approved in several Central/Eastern European countries, Russia and Asia for stroke, traumatic brain injury and dementia; large trials are mixed and the Cochrane review in acute ischaemic stroke found no clear benefit.',
    ),
    mechanism: t(
      'Se atribuye una acción "neurotrófica" similar a factores de crecimiento endógenos (efectos tipo BDNF, CNTF, NGF), con reducción de excitotoxicidad, apoptosis y formación de radicales libres, y estímulo de neurogénesis y plasticidad en modelos animales. Al ser una mezcla, no tiene un mecanismo molecular único ni una farmacocinética caracterizable.',
      'Attributed a "neurotrophic" action resembling endogenous growth factors (BDNF-, CNTF-, NGF-like effects), with reduced excitotoxicity, apoptosis and free-radical formation and stimulated neurogenesis and plasticity in animal models. Being a mixture, it has no single molecular mechanism or characterisable pharmacokinetics.',
    ),
    indications: [
      t(
        'Aprobado (registros nacionales, p. ej. Austria, Rusia, China): ictus isquémico y hemorrágico, secuelas',
        'Approved (national registrations, e.g. Austria, Russia, China): ischaemic and haemorrhagic stroke, sequelae',
      ),
      t(
        'Aprobado (registros nacionales): traumatismo craneoencefálico',
        'Approved (national registrations): traumatic brain injury',
      ),
      t(
        'Aprobado (registros nacionales): demencia tipo Alzheimer y vascular',
        'Approved (national registrations): Alzheimer-type and vascular dementia',
      ),
      t(
        'No aprobado por FDA ni por procedimiento centralizado de la EMA',
        'Not approved by FDA or via the EMA centralised procedure',
      ),
    ],
    evidence: 'phase3',
    regulatory: {
      us: 'research_only',
      eu: 'approved',
      notes: t(
        'Autorización nacional en Austria y varios Estados miembros de Europa central y oriental, no autorización centralizada EMA. En EE. UU. no está aprobado ni comercializado; se obtiene por importación o canales de "investigación". La Cochrane (Ziganshina et al., actualizaciones sucesivas) no encontró reducción de mortalidad ni de dependencia en ictus isquémico agudo y señaló un posible aumento de eventos adversos graves no mortales.',
        'National authorisation in Austria and several Central/Eastern European member states, not an EMA centralised authorisation. In the US it is neither approved nor marketed; obtained via import or "research" channels. Cochrane (Ziganshina et al., successive updates) found no reduction in death or dependency in acute ischaemic stroke and flagged a possible increase in non-fatal serious adverse events.',
      ),
    },
    routes: ['iv', 'im'],
    defaultUnit: 'ml',
    dosing: {
      labeled: t(
        'Austria (ficha técnica EVER Pharma): ictus isquémico y TCE 10–50 mL/día en infusión IV durante 10–21 días; demencia 5–30 mL/día IV, 5 días/semana durante ~4 semanas, repetible. Dosis >10 mL solo en infusión IV lenta diluida en 100–250 mL de suero fisiológico o glucosado (15–60 min); hasta 10 mL puede inyectarse IV lento sin diluir y hasta 5 mL IM.',
        'Austria (EVER Pharma SmPC): ischaemic stroke and TBI 10–50 mL/day by IV infusion for 10–21 days; dementia 5–30 mL/day IV, 5 days/week for ~4 weeks, repeatable. Doses >10 mL only as slow IV infusion diluted in 100–250 mL saline or dextrose (15–60 min); up to 10 mL may be given as slow undiluted IV injection and up to 5 mL IM.',
      ),
      investigational: t(
        'CASTA y CARS: 30 mL/día IV durante 10 días (CASTA, inicio <12 h) o 21 días (CARS, inicio a las 24–72 h con rehabilitación).',
        'CASTA and CARS: 30 mL/day IV for 10 days (CASTA, started <12 h) or 21 days (CARS, started at 24–72 h with rehabilitation).',
      ),
      anecdotal: t(
        'Uso no aprobado — uso "nootrópico" en personas sanas, IM 1–5 mL/día en ciclos de 10–20 días; sin evidencia de beneficio y con riesgos de producto de origen biológico obtenido fuera de canales regulados.',
        'Unapproved use — "nootropic" use in healthy people, IM 1–5 mL/day in 10–20-day courses; no evidence of benefit and risks of a biological product obtained outside regulated channels.',
      ),
      frequency: t('1×/día en ciclos (IV/IM)', 'Once daily in courses (IV/IM)'),
    },
    reconstitution: t(
      'Solución lista para usar (215,2 mg/mL de concentrado de péptidos de cerebro porcino; verificar ficha local) en ampollas de 1, 5 y 10 mL y viales de mayor volumen según país. Para infusión, diluir en 100–250 mL de NaCl 0,9%, Ringer o glucosa 5%; no mezclar con soluciones de aminoácidos equilibradas ni lipídicas. Usar inmediatamente tras abrir o diluir.',
      "Ready-to-use solution (215.2 mg/mL porcine brain peptide concentrate; check local SmPC) in 1, 5 and 10 mL ampoules and larger vials depending on country. For infusion, dilute in 100–250 mL 0.9% NaCl, Ringer's or 5% dextrose; do not mix with balanced amino-acid or lipid solutions. Use immediately after opening or dilution.",
    ),
    storage: t(
      'Ampollas por debajo de 25 °C, protegidas de la luz, no congelar. Solo soluciones transparentes de color ámbar.',
      'Ampoules below 25 °C, protected from light, do not freeze. Use only clear amber solutions.',
    ),
    adverseEffects: {
      common: [
        t(
          'Mareo, cefalea, sudoración, sensación de calor (sobre todo con infusión rápida)',
          'Dizziness, headache, sweating, feeling of warmth (mainly with rapid infusion)',
        ),
        t(
          'Agitación, insomnio o somnolencia, náuseas',
          'Agitation, insomnia or drowsiness, nausea',
        ),
        t('Reacción local en el punto de inyección', 'Local injection-site reaction'),
      ],
      serious: [
        t(
          'Reacciones de hipersensibilidad (proteína de origen porcino)',
          'Hypersensitivity reactions (porcine-derived protein)',
        ),
        t(
          'Convulsiones o aumento de la frecuencia de crisis en epilepsia',
          'Seizures or increased seizure frequency in epilepsy',
        ),
        t(
          'Posible aumento de eventos adversos graves no mortales en ictus agudo (Cochrane)',
          'Possible increase in non-fatal serious adverse events in acute stroke (Cochrane)',
        ),
      ],
    },
    contraindications: [
      t('Hipersensibilidad a cualquier componente', 'Hypersensitivity to any component'),
      t(
        'Epilepsia (especialmente crisis generalizadas o estatus)',
        'Epilepsy (especially generalised seizures or status epilepticus)',
      ),
      t('Insuficiencia renal grave', 'Severe renal impairment'),
      t(
        'Consideraciones religiosas o personales sobre productos de origen porcino',
        'Religious or personal considerations about porcine-derived products',
      ),
    ],
    interactions: [
      t(
        'IMAO y antidepresivos: posibles efectos aditivos descritos en ficha; ajustar dosis',
        'MAOIs and antidepressants: possible additive effects described in the label; adjust doses',
      ),
      t(
        'Incompatible en la misma infusión con soluciones de aminoácidos, lípidos o que alteren el pH',
        'Incompatible in the same infusion with amino-acid, lipid or pH-altering solutions',
      ),
    ],
    monitoring: [
      t(
        'Escalas funcionales (NIHSS, mRS) o cognitivas según indicación',
        'Functional (NIHSS, mRS) or cognitive scales depending on indication',
      ),
      t('Función renal basal', 'Baseline renal function'),
      t(
        'Vigilancia de crisis en pacientes con riesgo epiléptico',
        'Seizure monitoring in patients at epileptic risk',
      ),
    ],
    keyTrials: [
      {
        name: 'CASTA',
        year: 2012,
        finding: t(
          '1070 pacientes asiáticos con ictus isquémico agudo; 30 mL/día IV ×10 días frente a placebo sin diferencia significativa en el objetivo combinado a 90 días; tendencia favorable post hoc solo en ictus grave (NIHSS >12).',
          '1070 Asian patients with acute ischaemic stroke; 30 mL/day IV ×10 days vs placebo with no significant difference in the combined 90-day endpoint; favourable post hoc trend only in severe stroke (NIHSS >12).',
        ),
        ref: 'Stroke 2012',
      },
      {
        name: 'CARS',
        year: 2016,
        finding: t(
          'Ensayo europeo (n ≈ 200) en ictus isquémico subagudo con rehabilitación: 30 mL/día ×21 días mejoró la función motora de la extremidad superior (ARAT) a 90 días frente a placebo; muestra pequeña, financiado por el fabricante.',
          'European trial (n ≈ 200) in subacute ischaemic stroke with rehabilitation: 30 mL/day ×21 days improved upper-limb motor function (ARAT) at 90 days vs placebo; small sample, manufacturer-funded.',
        ),
        ref: 'Stroke 2016',
      },
    ],
    references: [
      { label: 'Cerebrolysin — ficha técnica (Fachinformation) Austria, EVER Neuro Pharma' },
      {
        label:
          'Heiss WD et al. Cerebrolysin in patients with acute ischemic stroke in Asia (CASTA). Stroke 2012',
      },
      { label: 'Muresanu DF et al. Cerebrolysin and Recovery After Stroke (CARS). Stroke 2016' },
      {
        label:
          'Ziganshina LE et al. Cerebrolysin for acute ischaemic stroke. Cochrane Database Syst Rev (actualizaciones sucesivas)',
      },
    ],
    tags: ['neurotrofico', 'ictus', 'demencia', 'tce', 'intravenoso', 'porcino'],
    lastReviewed: '2026-09-19',
  },
  {
    id: 'p21',
    names: {
      generic: 'P021',
      brands: [],
      aliases: ['P21', 'Ac-DGGLAG-NH2 + adamantil-glicina', 'péptido derivado de CNTF'],
    },
    category: 'cognitive',
    pharmClass: t(
      'Péptido neurotrófico derivado de CNTF (región 146–156) con adamantano',
      'CNTF-derived (region 146–156) adamantylated neurotrophic peptide',
    ),
    summary: t(
      'Pequeño péptido diseñado en el laboratorio de K. Iqbal (NYS Institute for Basic Research) a partir de la región activa del factor neurotrófico ciliar (CNTF), con glicina adamantilada para estabilidad y paso de barrera hematoencefálica. Datos exclusivamente preclínicos en modelos murinos de Alzheimer y envejecimiento.',
      "Small peptide designed in K. Iqbal's laboratory (NYS Institute for Basic Research) from the active region of ciliary neurotrophic factor (CNTF), with an adamantylated glycine for stability and blood-brain-barrier penetration. Exclusively preclinical data in murine Alzheimer's and ageing models.",
    ),
    mechanism: t(
      'Aumenta la expresión de BDNF, estimula la neurogénesis en el giro dentado y la plasticidad sináptica, e inhibe la actividad de LIF/STAT3 y de GSK-3β, reduciendo la hiperfosforilación de tau. En ratones 3xTg-AD administrado por vía oral (en la dieta) previno déficits cognitivos y redujo la patología tau y amiloide.',
      'Increases BDNF expression, stimulates dentate-gyrus neurogenesis and synaptic plasticity, and inhibits LIF/STAT3 signalling and GSK-3β activity, reducing tau hyperphosphorylation. In 3xTg-AD mice given orally (in diet) it prevented cognitive deficits and reduced tau and amyloid pathology.',
    ),
    indications: [
      t('Ninguna aprobada', 'None approved'),
      t(
        'Preclínico: enfermedad de Alzheimer, deterioro cognitivo asociado a la edad',
        "Preclinical: Alzheimer's disease, age-related cognitive decline",
      ),
    ],
    evidence: 'preclinical',
    regulatory: {
      us: 'research_only',
      notes: t(
        'Vendido como "producto de investigación" (viales o spray nasal). Sin ensayos en humanos registrados conocidos.',
        'Sold as a "research product" (vials or nasal spray). No known registered human trials.',
      ),
    },
    routes: ['nasal', 'sc'],
    defaultUnit: 'mg',
    dosing: {
      anecdotal: t(
        'Uso no aprobado — pautas comerciales no estandarizadas por vía intranasal o SC; no existe base para extrapolar a humanos las dosis orales en dieta usadas en ratones.',
        'Unapproved use — non-standardised commercial regimens intranasally or SC; there is no basis for extrapolating the in-diet oral doses used in mice to humans.',
      ),
    },
    reconstitution: STD_VIAL_RECON(10),
    storage: LYO_STORAGE,
    adverseEffects: {
      common: [INJECTION_SITE, t('Irritación nasal con spray', 'Nasal irritation with spray')],
      serious: [UNCHARACTERISED_SERIOUS],
    },
    contraindications: [PREGNANCY_NO_DATA, ACTIVE_CANCER_THEORETICAL],
    interactions: [NO_KNOWN_INTERACTIONS],
    keyTrials: [],
    references: [
      {
        label:
          "Kazim SF et al. Disease modifying effect of chronic oral treatment with a neurotrophic peptidergic compound in a triple transgenic mouse model of Alzheimer's disease. Neurobiol Dis 2014",
      },
      {
        label:
          'Iqbal K et al. — serie de estudios preclínicos sobre péptidos derivados de CNTF (P6, P021)',
      },
    ],
    tags: ['nootropico', 'cntf', 'alzheimer', 'preclinico', 'investigacion'],
    lastReviewed: '2026-09-19',
  },
  {
    id: 'pinealon',
    names: { generic: 'Pinealon', brands: [], aliases: ['Glu-Asp-Arg', 'EDR'] },
    category: 'cognitive',
    pharmClass: t(
      'Tripéptido "bioregulador" de Khavinson (neuroprotector propuesto)',
      'Khavinson "bioregulator" tripeptide (proposed neuroprotective)',
    ),
    summary: t(
      'Tripéptido sintético (Glu-Asp-Arg) del grupo de Khavinson, propuesto como bioregulador del sistema nervioso central. La evidencia procede casi solo de ese grupo: estudios en cultivos celulares y en ratas, y series humanas pequeñas no controladas.',
      "Synthetic tripeptide (Glu-Asp-Arg) from Khavinson's group, proposed as a central nervous system bioregulator. Evidence comes almost only from that group: cell-culture and rat studies and small uncontrolled human series.",
    ),
    mechanism: t(
      `En células granulares de cerebelo y otras líneas in vitro reduce especies reactivas de oxígeno y la muerte celular inducida por estrés oxidativo; en ratas con hiperhomocisteinemia prenatal se describe mejor desarrollo cognitivo de la descendencia. ${KHAVINSON_MECHANISM_TAIL.es}`,
      `In cerebellar granule cells and other lines in vitro it reduces reactive oxygen species and oxidative-stress-induced cell death; in rats with prenatal hyperhomocysteinaemia improved cognitive development of offspring is described. ${KHAVINSON_MECHANISM_TAIL.en}`,
    ),
    indications: [
      t('Ninguna aprobada', 'None approved'),
      t(
        'Propuesto (grupo de Khavinson): deterioro cognitivo, recuperación tras lesión cerebral, envejecimiento cerebral',
        'Proposed (Khavinson group): cognitive decline, recovery after brain injury, brain ageing',
      ),
    ],
    evidence: 'preclinical',
    regulatory: { us: 'research_only', notes: KHAVINSON_NOTES },
    routes: ['oral', 'sc', 'nasal'],
    defaultUnit: 'mg',
    dosing: {
      anecdotal: t(
        'Uso no aprobado — pautas comerciales no estandarizadas (cápsulas orales o viales SC/intranasal) en ciclos cortos de 10–30 días; no existen datos de dosis-respuesta en humanos.',
        'Unapproved use — non-standardised commercial regimens (oral capsules or SC/intranasal vials) in short 10–30-day cycles; no human dose-response data exist.',
      ),
      frequency: t('1×/día en ciclos (uso no aprobado)', 'Once daily in cycles (unapproved use)'),
    },
    reconstitution: STD_VIAL_RECON(10),
    storage: LYO_STORAGE,
    adverseEffects: { common: [INJECTION_SITE], serious: [UNCHARACTERISED_SERIOUS] },
    contraindications: [PREGNANCY_NO_DATA],
    interactions: [NO_KNOWN_INTERACTIONS],
    keyTrials: [],
    references: [
      {
        label:
          'Khavinson V et al. Pinealon increases cell viability by suppression of free radical levels and activating proliferative processes. Rejuvenation Res 2011',
      },
      KHAVINSON_REVIEW_REF,
    ],
    tags: ['nootropico', 'bioregulador', 'khavinson', 'preclinico'],
    lastReviewed: '2026-09-19',
  },
  {
    id: 'noopept',
    names: {
      generic: 'Noopept',
      brands: ['Noopept (Ноопепт)'],
      aliases: ['Omberacetam', 'GVS-111', 'N-fenilacetil-L-prolilglicina etil éster'],
    },
    category: 'cognitive',
    pharmClass: t(
      'Molécula pequeña derivada de dipéptido (no es un péptido propiamente dicho); nootrópico de tipo racetam-like',
      'Dipeptide-derived small molecule (not strictly a peptide); racetam-like nootropic',
    ),
    summary: t(
      'Éster etílico de N-fenilacetil-L-prolilglicina diseñado en el Instituto de Farmacología Zakusov (Moscú) como análogo dipeptídico del piracetam. Registrado en Rusia en comprimidos para trastornos cognitivos leves; fuera de allí se vende online como "suplemento nootrópico". Evidencia clínica limitada a estudios rusos pequeños.',
      'N-phenylacetyl-L-prolylglycine ethyl ester designed at the Zakusov Institute of Pharmacology (Moscow) as a dipeptide analogue of piracetam. Registered in Russia as tablets for mild cognitive disorders; elsewhere sold online as a "nootropic supplement". Clinical evidence limited to small Russian studies.',
    ),
    mechanism: t(
      'Se considera profármaco de la cicloprolilglicina, dipéptido cíclico endógeno con acción moduladora de receptores AMPA. En ratas aumenta la expresión hipocampal de NGF y BDNF, activa HIF-1 y muestra efectos antioxidantes, antiinflamatorios y neuroprotectores. Activo a dosis ~1000 veces menores que el piracetam en modelos animales.',
      'Considered a prodrug of cycloprolylglycine, an endogenous cyclic dipeptide with AMPA-receptor modulating activity. In rats it increases hippocampal NGF and BDNF expression, activates HIF-1 and shows antioxidant, anti-inflammatory and neuroprotective effects. Active at doses ~1000-fold lower than piracetam in animal models.',
    ),
    indications: [
      t(
        'Rusia (registro nacional): trastornos cognitivos leves de origen vascular, postraumático o asociados a encefalopatía; síndrome asténico',
        'Russia (national registration): mild cognitive disorders of vascular or post-traumatic origin or associated with encephalopathy; asthenic syndrome',
      ),
      t('Ninguna aprobada por FDA/EMA', 'None approved by FDA/EMA'),
      t(
        'Uso no aprobado: "nootrópico" en personas sanas',
        'Unapproved use: "nootropic" in healthy people',
      ),
    ],
    evidence: 'phase2',
    regulatory: {
      us: 'research_only',
      notes: RUSSIA_NOTES(
        'En EE. UU. y Europa se vende online como "suplemento" sin aprobación como medicamento y sin estatus claro como ingrediente dietético. Nivel "fase 2" por estudios clínicos rusos pequeños.',
        'In the US and Europe it is sold online as a "supplement" without approval as a medicine and without clear dietary-ingredient status. "Phase 2" tier because of small Russian clinical studies.',
      ),
    },
    routes: ['oral'],
    defaultUnit: 'mg',
    dosing: {
      labeled: t(
        'Rusia (ficha nacional, comprimidos de 10 mg): 10 mg 2×/día (20 mg/día) tras las comidas, pudiendo aumentarse hasta 30 mg/día; curso de 1,5–3 meses, repetible tras 1 mes de descanso. No administrar después de las 18 h. Verificar la ficha vigente.',
        'Russia (national label, 10 mg tablets): 10 mg twice daily (20 mg/day) after meals, may be increased to 30 mg/day; 1.5–3-month course, repeatable after a 1-month break. Do not take after 6 pm. Check the current label.',
      ),
      anecdotal: t(
        'Uso no aprobado — 10–30 mg/día oral o sublingual en personas sanas, a veces combinado con colina u otros nootrópicos; sin evidencia controlada de beneficio en sujetos sin deterioro.',
        'Unapproved use — 10–30 mg/day oral or sublingual in healthy people, sometimes combined with choline or other nootropics; no controlled evidence of benefit in unimpaired subjects.',
      ),
      frequency: t('2×/día (ficha rusa)', 'Twice daily (Russian label)'),
    },
    storage: t(
      'Comprimidos o polvo a temperatura ambiente (<25 °C), secos y protegidos de la luz, fuera del alcance de los niños.',
      'Tablets or powder at room temperature (<25 °C), dry and protected from light, out of reach of children.',
    ),
    adverseEffects: {
      common: [
        t(
          'Irritabilidad, nerviosismo, alteraciones del sueño',
          'Irritability, nervousness, sleep disturbance',
        ),
        t('Cefalea', 'Headache'),
      ],
      serious: [
        t(
          'Elevación de la presión arterial en pacientes hipertensos (descrita en ficha rusa)',
          'Blood pressure increase in hypertensive patients (described in Russian label)',
        ),
        t(
          'Productos "suplemento" con dosis y pureza no garantizadas',
          '"Supplement" products with unverified dose and purity',
        ),
      ],
    },
    contraindications: [
      t('Hipersensibilidad', 'Hypersensitivity'),
      t('Insuficiencia hepática o renal grave', 'Severe hepatic or renal impairment'),
      t('Embarazo y lactancia', 'Pregnancy and lactation'),
      t('Menores de 18 años (según ficha rusa)', 'Under 18 years (per Russian label)'),
    ],
    interactions: [
      t(
        'Psicoestimulantes, cafeína y otros nootrópicos: posible aditividad sobre ansiedad e insomnio',
        'Psychostimulants, caffeine and other nootropics: possible additive anxiety and insomnia',
      ),
      t(
        'Antihipertensivos: vigilar PA en hipertensos',
        'Antihypertensives: monitor BP in hypertensive patients',
      ),
    ],
    monitoring: [
      t('Presión arterial en hipertensos', 'Blood pressure in hypertensive patients'),
      t('Sueño y estado de ánimo', 'Sleep and mood'),
    ],
    keyTrials: [
      {
        name: 'Neznamov & Teleshova (Noopept vs piracetam)',
        year: 2009,
        finding: t(
          'Estudio ruso comparativo en trastornos cognitivos leves de origen vascular y postraumático: mejoría cognitiva similar o algo superior a piracetam con mejor tolerabilidad; sin grupo placebo y de tamaño reducido.',
          'Russian comparative study in mild cognitive disorders of vascular and post-traumatic origin: cognitive improvement similar to or slightly better than piracetam with better tolerability; no placebo arm and small size.',
        ),
        ref: 'Neurosci Behav Physiol 2009',
      },
    ],
    references: [
      {
        label:
          'Ficha técnica rusa de Noopept (Registro Estatal de Medicamentos de la Federación Rusa, GRLS)',
      },
      {
        label:
          'Ostrovskaya RU et al. Noopept stimulates the expression of NGF and BDNF in rat hippocampus. Bull Exp Biol Med 2008',
      },
      {
        label:
          'Neznamov GG, Teleshova ES. Comparative studies of Noopept and piracetam in the treatment of patients with mild cognitive disorders. Neurosci Behav Physiol 2009',
      },
    ],
    tags: ['nootropico', 'oral', 'racetam', 'rusia'],
    lastReviewed: '2026-09-19',
  },

  // ───────────────────────────── LONGEVITY ─────────────────────────────
  {
    id: 'epitalon',
    names: {
      generic: 'Epitalon',
      brands: [],
      aliases: ['Epithalon', 'Epithalone', 'Ala-Glu-Asp-Gly', 'AEDG'],
    },
    category: 'longevity',
    pharmClass: t(
      'Tetrapéptido "bioregulador" pineal de Khavinson (análogo sintético de la epitalamina)',
      'Khavinson pineal "bioregulator" tetrapeptide (synthetic analogue of epithalamin)',
    ),
    summary: t(
      'Tetrapéptido sintético (Ala-Glu-Asp-Gly) diseñado por el grupo de Khavinson a partir de la composición de la epitalamina, extracto de glándula pineal bovina. Popular como "antienvejecimiento" por supuesta activación de telomerasa; la evidencia procede casi exclusivamente de ese grupo, con estudios in vitro, en roedores y series humanas pequeñas o no controladas.',
      'Synthetic tetrapeptide (Ala-Glu-Asp-Gly) designed by Khavinson\'s group based on the composition of epithalamin, a bovine pineal-gland extract. Popular as "anti-ageing" for claimed telomerase activation; evidence comes almost exclusively from that group, with in vitro, rodent and small or uncontrolled human series.',
    ),
    mechanism: t(
      `En fibroblastos humanos en cultivo se describió inducción de telomerasa y alargamiento telomérico; en roedores, normalización del ritmo de melatonina, aumento modesto de la supervivencia media y menor incidencia de tumores espontáneos en algunas cepas. En ancianos (series del mismo grupo) se describe normalización de la secreción nocturna de melatonina. ${KHAVINSON_MECHANISM_TAIL.es}`,
      `In cultured human fibroblasts telomerase induction and telomere elongation were reported; in rodents, normalised melatonin rhythm, a modest increase in mean survival and fewer spontaneous tumours in some strains. In the elderly (series from the same group) normalisation of nocturnal melatonin secretion is described. ${KHAVINSON_MECHANISM_TAIL.en}`,
    ),
    indications: [
      t('Ninguna aprobada', 'None approved'),
      t(
        'Propuesto: envejecimiento, alteraciones del ritmo circadiano, retinopatía degenerativa (grupo de Khavinson)',
        'Proposed: ageing, circadian-rhythm disturbance, degenerative retinopathy (Khavinson group)',
      ),
    ],
    evidence: 'preclinical',
    regulatory: { us: 'research_only', notes: KHAVINSON_NOTES },
    routes: ['sc', 'im', 'nasal'],
    defaultUnit: 'mg',
    dosing: {
      anecdotal: t(
        'Uso no aprobado — 5–10 mg/día SC durante 10–20 días, repetido 1–2 veces al año; también pautas intranasales. Derivadas de esquemas del grupo de Khavinson sin ensayos de dosis-respuesta.',
        'Unapproved use — 5–10 mg/day SC for 10–20 days, repeated 1–2 times a year; intranasal regimens also used. Derived from Khavinson-group schedules without dose-response trials.',
      ),
      frequency: t(
        '1×/día en ciclos cortos (uso no aprobado)',
        'Once daily in short cycles (unapproved use)',
      ),
    },
    reconstitution: t(
      'Vial liofilizado de 10 mg + 1 mL de agua bacteriostática = 10 mg/mL. En jeringa U-100: 5 mg = 50 U; 1 mg = 10 U. Estable ~2–4 semanas en nevera tras reconstituir.',
      '10 mg lyophilised vial + 1 mL bacteriostatic water = 10 mg/mL. U-100 syringe: 5 mg = 50 U; 1 mg = 10 U. Stable ~2–4 weeks refrigerated after reconstitution.',
    ),
    storage: LYO_STORAGE,
    adverseEffects: {
      common: [
        INJECTION_SITE,
        t('Somnolencia o sueños vívidos (anecdótico)', 'Drowsiness or vivid dreams (anecdotal)'),
      ],
      serious: [
        UNCHARACTERISED_SERIOUS,
        t(
          'Riesgo teórico si realmente activa telomerasa en células premalignas (no evaluado)',
          'Theoretical risk if it truly activates telomerase in premalignant cells (untested)',
        ),
      ],
    },
    contraindications: [PREGNANCY_NO_DATA, ACTIVE_CANCER_THEORETICAL],
    interactions: [
      t(
        'Melatonina y fármacos que alteran el ritmo circadiano: interacción teórica',
        'Melatonin and drugs affecting circadian rhythm: theoretical interaction',
      ),
    ],
    keyTrials: [],
    references: [
      {
        label:
          'Khavinson VKh, Bondarev IE, Butyugov AA. Epithalon peptide induces telomerase activity and telomere elongation in human somatic cells. Bull Exp Biol Med 2003',
      },
      {
        label:
          'Anisimov VN et al. Effect of Epitalon on biomarkers of aging, life span and spontaneous tumor incidence in female Swiss-derived SHR mice. Biogerontology 2003',
      },
      KHAVINSON_GENERAL_REF,
    ],
    tags: ['longevidad', 'bioregulador', 'khavinson', 'telomerasa', 'pineal'],
    lastReviewed: '2026-09-19',
  },
  {
    id: 'foxo4-dri',
    names: { generic: 'FOXO4-DRI', brands: [], aliases: ['FOXO4 D-retro-inverso peptide'] },
    category: 'longevity',
    pharmClass: t(
      'Péptido D-retro-inverso senolítico (antagonista de la interacción FOXO4–p53)',
      'D-retro-inverso senolytic peptide (FOXO4–p53 interaction antagonist)',
    ),
    summary: t(
      'Péptido D-retro-inverso diseñado por el grupo de P. de Keizer (Erasmus MC) que interfiere con la unión FOXO4–p53 y provoca apoptosis selectiva de células senescentes. En ratones de envejecimiento acelerado y naturalmente envejecidos restauró parámetros de condición física, pelaje y función renal. Solo datos preclínicos.',
      "D-retro-inverso peptide designed by P. de Keizer's group (Erasmus MC) that disrupts FOXO4–p53 binding and triggers selective apoptosis of senescent cells. In accelerated-ageing and naturally aged mice it restored fitness, fur and renal function parameters. Preclinical data only.",
    ),
    mechanism: t(
      'En células senescentes FOXO4 retiene p53 en el núcleo (en cuerpos PML), manteniendo la viabilidad celular. FOXO4-DRI compite por esta unión, provoca la exclusión nuclear de p53 activo y su translocación mitocondrial, induciendo apoptosis intrínseca en células senescentes con escaso efecto en células normales in vitro. La configuración D-retro-inversa confiere resistencia a proteasas.',
      'In senescent cells FOXO4 retains p53 in the nucleus (in PML bodies), sustaining cell viability. FOXO4-DRI competes for this binding, causes nuclear exclusion of active p53 and its mitochondrial translocation, inducing intrinsic apoptosis in senescent cells with little effect on normal cells in vitro. The D-retro-inverso configuration confers protease resistance.',
    ),
    indications: [
      t('Ninguna aprobada', 'None approved'),
      t(
        'Preclínico: toxicidad por quimioterapia (doxorrubicina), envejecimiento, fragilidad, fibrosis',
        'Preclinical: chemotherapy (doxorubicin) toxicity, ageing, frailty, fibrosis',
      ),
    ],
    evidence: 'preclinical',
    regulatory: {
      us: 'research_only',
      notes: t(
        'Vendido como "producto de investigación", a precios elevados. El grupo académico fundó una empresa (Cleara Biotech) para desarrollar senolíticos peptídicos; sin ensayos en humanos publicados.',
        'Sold as a "research product" at high prices. The academic group founded a company (Cleara Biotech) to develop peptide senolytics; no published human trials.',
      ),
    },
    routes: ['sc', 'iv'],
    defaultUnit: 'mg',
    dosing: {
      investigational: t(
        'Solo animal: en el estudio original, 5 mg/kg IP en días alternos (3 dosis) en ratones; no hay dosis humanas estudiadas.',
        'Animal only: in the original study, 5 mg/kg IP every other day (3 doses) in mice; no human doses studied.',
      ),
      anecdotal: t(
        'Uso no aprobado — pautas comunitarias de pocas dosis SC en días alternos derivadas por escalado alométrico del estudio murino; sin datos de seguridad humanos y con riesgo teórico de apoptosis fuera de diana.',
        'Unapproved use — community regimens of a few SC doses on alternate days derived by allometric scaling of the mouse study; no human safety data and theoretical risk of off-target apoptosis.',
      ),
      frequency: t(
        'Pulsos cortos en días alternos (uso no aprobado)',
        'Short alternate-day pulses (unapproved use)',
      ),
    },
    reconstitution: STD_VIAL_RECON(10),
    storage: LYO_STORAGE,
    adverseEffects: {
      common: [
        INJECTION_SITE,
        t('Fatiga transitoria (anecdótico)', 'Transient fatigue (anecdotal)'),
      ],
      serious: [
        t(
          'Apoptosis fuera de diana y efectos sobre p53 en tejidos sanos (teórico)',
          'Off-target apoptosis and p53 effects in healthy tissues (theoretical)',
        ),
        t(
          'Inmunogenicidad de un péptido D no caracterizada',
          'Uncharacterised immunogenicity of a D-peptide',
        ),
        UNCHARACTERISED_SERIOUS,
      ],
    },
    contraindications: [
      PREGNANCY_NO_DATA,
      t(
        'Neoplasia activa o tratamiento oncológico en curso (interacción no estudiada con la vía p53)',
        'Active malignancy or ongoing cancer treatment (unstudied interaction with the p53 pathway)',
      ),
      t(
        'Cicatrización de heridas en curso (las células senescentes participan en la reparación)',
        'Ongoing wound healing (senescent cells participate in repair)',
      ),
    ],
    interactions: [
      t(
        'Quimioterapia y fármacos que modulan p53/MDM2: interacción teórica',
        'Chemotherapy and p53/MDM2-modulating drugs: theoretical interaction',
      ),
      t(
        'Otros senolíticos (dasatinib + quercetina, fisetina): aditividad teórica',
        'Other senolytics (dasatinib + quercetin, fisetin): theoretical additivity',
      ),
    ],
    keyTrials: [
      {
        name: 'Baar et al. (FOXO4-DRI)',
        year: 2017,
        finding: t(
          'Diseño del péptido; eliminación selectiva de células senescentes y restauración de condición física, pelaje y función renal en ratones con envejecimiento acelerado y envejecidos, y protección frente a toxicidad por doxorrubicina.',
          'Peptide design; selective clearance of senescent cells and restoration of fitness, fur and renal function in accelerated-ageing and aged mice, plus protection against doxorubicin toxicity.',
        ),
        ref: 'Cell 2017',
      },
    ],
    references: [
      {
        label:
          'Baar MP et al. Targeted apoptosis of senescent cells restores tissue homeostasis in response to chemotoxicity and aging. Cell 2017',
      },
    ],
    tags: ['longevidad', 'senolitico', 'p53', 'preclinico', 'investigacion'],
    lastReviewed: '2026-09-19',
  },
  {
    id: 'ara-290',
    names: {
      generic: 'Cibinetida',
      brands: [],
      aliases: ['ARA-290', 'ARA 290', 'pHBSP (pyroglutamate helix B surface peptide)'],
    },
    category: 'longevity',
    pharmClass: t(
      'Péptido no eritropoyético derivado de la eritropoyetina; agonista del receptor de reparación innata (EPOR/CD131)',
      'Non-erythropoietic erythropoietin-derived peptide; innate repair receptor (EPOR/CD131) agonist',
    ),
    summary: t(
      'Péptido de 11 aminoácidos derivado de la hélice B de la eritropoyetina (Araim Pharmaceuticals) que conserva los efectos tisulares protectores y antiinflamatorios de la EPO sin estimular la eritropoyesis. Estudiado en fase 2 en neuropatía de fibra fina asociada a sarcoidosis y en diabetes tipo 2 con neuropatía.',
      "11-amino-acid peptide derived from erythropoietin helix B (Araim Pharmaceuticals) that retains EPO's tissue-protective and anti-inflammatory effects without stimulating erythropoiesis. Studied in phase 2 for sarcoidosis-associated small-fibre neuropathy and in type 2 diabetes with neuropathy.",
    ),
    mechanism: t(
      'Activa selectivamente el receptor de reparación innata (heterodímero EPOR–CD131/βcR), que se expresa en tejidos lesionados, sin unirse al homodímero EPOR responsable de la eritropoyesis. Reduce la señalización inflamatoria (TNF-α, IL-6), la apoptosis y promueve la regeneración de fibras nerviosas pequeñas. Semivida plasmática muy corta (minutos) con efectos biológicos prolongados.',
      'Selectively activates the innate repair receptor (EPOR–CD131/βcR heterodimer), expressed in injured tissue, without binding the EPOR homodimer responsible for erythropoiesis. Reduces inflammatory signalling (TNF-α, IL-6) and apoptosis and promotes small-nerve-fibre regeneration. Very short plasma half-life (minutes) with prolonged biological effects.',
    ),
    indications: [
      t('Ninguna aprobada', 'None approved'),
      t(
        'Investigado (fase 2): neuropatía de fibra fina y dolor neuropático en sarcoidosis',
        'Investigated (phase 2): small-fibre neuropathy and neuropathic pain in sarcoidosis',
      ),
      t(
        'Investigado (fase 2): neuropatía y control metabólico en diabetes tipo 2',
        'Investigated (phase 2): neuropathy and metabolic control in type 2 diabetes',
      ),
      t(
        'Preclínico: lesión renal, retinopatía diabética, isquemia',
        'Preclinical: kidney injury, diabetic retinopathy, ischaemia',
      ),
    ],
    evidence: 'phase2',
    regulatory: {
      us: 'investigational',
      eu: 'investigational',
      notes: t(
        'Designación de medicamento huérfano para neuropatía asociada a sarcoidosis (verificar vigencia). Sin fase 3 publicada; también se vende como "producto de investigación".',
        'Orphan designation for sarcoidosis-associated neuropathy (verify current status). No published phase 3; also sold as a "research product".',
      ),
    },
    routes: ['sc', 'iv'],
    defaultUnit: 'mg',
    dosing: {
      investigational: t(
        'Sarcoidosis: 4 mg IV 3×/semana durante 4 semanas (piloto) y 1, 4 u 8 mg SC 1×/día durante 28 días (fase 2b; mejor señal con 4 mg). DM2: 4 mg SC/día durante 28 días.',
        'Sarcoidosis: 4 mg IV 3×/week for 4 weeks (pilot) and 1, 4 or 8 mg SC once daily for 28 days (phase 2b; best signal with 4 mg). T2D: 4 mg SC daily for 28 days.',
      ),
      anecdotal: t(
        'Uso no aprobado — imitación de los ensayos: 4 mg SC/día en ciclos de 4 semanas para neuropatía o "reparación".',
        'Unapproved use — imitating trials: 4 mg SC daily in 4-week cycles for neuropathy or "repair".',
      ),
      frequency: t('1×/día SC durante 28 días (ensayos)', 'Once daily SC for 28 days (trials)'),
    },
    reconstitution: t(
      'Vial liofilizado de 10 mg + 2 mL de agua bacteriostática = 5 mg/mL. En jeringa U-100: 4 mg = 80 U; 1 mg = 20 U. Estable ~2–4 semanas en nevera tras reconstituir.',
      '10 mg lyophilised vial + 2 mL bacteriostatic water = 5 mg/mL. U-100 syringe: 4 mg = 80 U; 1 mg = 20 U. Stable ~2–4 weeks refrigerated after reconstitution.',
    ),
    storage: LYO_STORAGE,
    adverseEffects: {
      common: [
        INJECTION_SITE,
        t(
          'Cefalea, náuseas leves; en ensayos la tolerabilidad fue similar a placebo',
          'Headache, mild nausea; tolerability similar to placebo in trials',
        ),
      ],
      serious: [
        t(
          'Sin señales graves en ensayos pequeños de 4 semanas; seguridad a largo plazo desconocida',
          'No serious signals in small 4-week trials; long-term safety unknown',
        ),
      ],
    },
    contraindications: [PREGNANCY_NO_DATA, t('Hipersensibilidad', 'Hypersensitivity')],
    interactions: [
      t(
        'Sin interacciones descritas; no eleva hemoglobina (a diferencia de la EPO)',
        'No interactions described; does not raise haemoglobin (unlike EPO)',
      ),
    ],
    monitoring: [
      t(
        'Síntomas de neuropatía (escalas SFN), densidad de fibras nerviosas corneales en ensayos',
        'Neuropathy symptoms (SFN scales), corneal nerve fibre density in trials',
      ),
      t('HbA1c si diabetes', 'HbA1c if diabetic'),
    ],
    keyTrials: [
      {
        name: 'Heij et al. (piloto sarcoidosis)',
        year: 2012,
        finding: t(
          'Ensayo piloto aleatorizado doble ciego en sarcoidosis con neuropatía de fibra fina: 4 mg IV 3×/semana ×4 semanas mejoró síntomas frente a placebo; seguro.',
          'Randomised double-blind pilot in sarcoidosis with small-fibre neuropathy: 4 mg IV 3×/week ×4 weeks improved symptoms vs placebo; safe.',
        ),
        ref: 'Mol Med 2012',
      },
      {
        name: 'Culver et al. (fase 2b sarcoidosis)',
        year: 2017,
        finding: t(
          'SC diario ×28 días (1, 4, 8 mg): aumento de la densidad de fibras nerviosas corneales y mejoría del dolor neuropático, sobre todo con 4 mg; muestra pequeña.',
          'Daily SC ×28 days (1, 4, 8 mg): increased corneal nerve fibre density and improved neuropathic pain, mainly at 4 mg; small sample.',
        ),
        ref: 'Invest Ophthalmol Vis Sci 2017',
      },
      {
        name: 'Brines et al. (DM2)',
        year: 2014,
        finding: t(
          'En DM2 con neuropatía, 4 mg SC/día ×28 días mejoró la HbA1c, el perfil lipídico y los síntomas neuropáticos frente a placebo; exploratorio.',
          'In T2D with neuropathy, 4 mg SC daily ×28 days improved HbA1c, lipid profile and neuropathic symptoms vs placebo; exploratory.',
        ),
        ref: 'Mol Med 2014',
      },
    ],
    references: [
      {
        label:
          'Heij L et al. Safety and efficacy of ARA 290 in sarcoidosis patients with symptoms of small fiber neuropathy. Mol Med 2012',
      },
      {
        label:
          'Culver DA et al. Cibinetide improves corneal nerve fiber abundance in patients with sarcoidosis-associated small nerve fiber loss and neuropathic pain. Invest Ophthalmol Vis Sci 2017',
      },
      {
        label:
          'Brines M et al. ARA 290, a nonerythropoietic peptide engineered from erythropoietin, improves metabolic control and neuropathic symptoms in patients with type 2 diabetes. Mol Med 2014',
      },
    ],
    tags: ['neuropatia', 'sarcoidosis', 'eritropoyetina', 'antiinflamatorio', 'fase2'],
    lastReviewed: '2026-09-19',
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
    pharmClass: t(
      'Nonapéptido neuromodulador del sueño y del estrés (mecanismo desconocido)',
      'Sleep- and stress-modulating nonapeptide (mechanism unknown)',
    ),
    summary: t(
      'Nonapéptido aislado en 1977 de sangre venosa cerebral de conejos durante sueño inducido eléctricamente. Se estudió en los años 80 en insomnio y en abstinencia de opioides y alcohol con resultados pequeños e inconsistentes; no existe un receptor ni un gen propio identificados y no hay desarrollo clínico actual.',
      'Nonapeptide isolated in 1977 from cerebral venous blood of rabbits during electrically induced sleep. Studied in the 1980s in insomnia and opioid/alcohol withdrawal with small and inconsistent results; no dedicated receptor or gene has been identified and there is no current clinical development.',
    ),
    mechanism: t(
      'Desconocido. Se han descrito efectos moduladores sobre el sueño de ondas lentas, el eje hipotálamo-hipofisario (LH, corticotropina, somatostatina), la respuesta al estrés y la termorregulación en animales, con resultados variables entre laboratorios. Atraviesa la barrera hematoencefálica en modelos animales; semivida plasmática corta.',
      'Unknown. Modulatory effects on slow-wave sleep, the hypothalamic-pituitary axis (LH, corticotropin, somatostatin), stress response and thermoregulation have been described in animals, with variable results between laboratories. Crosses the blood-brain barrier in animal models; short plasma half-life.',
    ),
    indications: [
      t('Ninguna aprobada', 'None approved'),
      t(
        'Estudiado (años 80, estudios pequeños): insomnio crónico, narcolepsia, abstinencia de opioides y alcohol',
        'Studied (1980s, small studies): chronic insomnia, narcolepsy, opioid and alcohol withdrawal',
      ),
      t(
        'Uso no aprobado: sueño, estrés, "recuperación"',
        'Unapproved use: sleep, stress, "recovery"',
      ),
    ],
    evidence: 'phase2',
    regulatory: {
      us: 'research_only',
      notes: t(
        'Vendido como "producto de investigación". Nivel "fase 2" asignado por estudios clínicos pequeños de los años 80 (algunos doble ciego) sin programa de desarrollo posterior.',
        'Sold as a "research product". "Phase 2" tier assigned because of small 1980s clinical studies (some double-blind) with no subsequent development programme.',
      ),
    },
    routes: ['sc', 'iv', 'nasal'],
    defaultUnit: 'mcg',
    dosing: {
      investigational: t(
        'Estudios de insomnio de los años 80: ~25 nmol/kg IV en infusión lenta, en dosis únicas o series cortas; efectos modestos e inconsistentes.',
        '1980s insomnia studies: ~25 nmol/kg IV by slow infusion, as single doses or short series; modest and inconsistent effects.',
      ),
      anecdotal: t(
        'Uso no aprobado — 100–500 µg SC antes de acostarse, de forma intermitente; sin evidencia de eficacia por vía SC.',
        'Unapproved use — 100–500 µg SC at bedtime, intermittently; no evidence of efficacy by the SC route.',
      ),
      frequency: t(
        'Al acostarse, intermitente (uso no aprobado)',
        'At bedtime, intermittently (unapproved use)',
      ),
    },
    reconstitution: t(
      'Vial liofilizado de 5 mg + 2 mL de agua bacteriostática = 2,5 mg/mL (2500 µg/mL). En jeringa U-100: 1 U = 25 µg; 250 µg = 10 U. Estable ~2–4 semanas en nevera tras reconstituir.',
      '5 mg lyophilised vial + 2 mL bacteriostatic water = 2.5 mg/mL (2500 µg/mL). U-100 syringe: 1 U = 25 µg; 250 µg = 10 U. Stable ~2–4 weeks refrigerated after reconstitution.',
    ),
    storage: LYO_STORAGE,
    adverseEffects: {
      common: [
        INJECTION_SITE,
        t(
          'Cefalea, somnolencia diurna, náuseas (anecdótico)',
          'Headache, daytime drowsiness, nausea (anecdotal)',
        ),
      ],
      serious: [UNCHARACTERISED_SERIOUS],
    },
    contraindications: [
      PREGNANCY_NO_DATA,
      t(
        'Conducción o manejo de maquinaria tras la dosis si produce somnolencia',
        'Driving or operating machinery after dosing if drowsiness occurs',
      ),
    ],
    interactions: [
      t(
        'Hipnóticos, benzodiacepinas, opioides, alcohol: posible aditividad sedante teórica',
        'Hypnotics, benzodiazepines, opioids, alcohol: possible theoretical additive sedation',
      ),
    ],
    keyTrials: [],
    references: [
      {
        label:
          'Schoenenberger GA, Monnier M. Characterization of a delta-electroencephalogram (-sleep)-inducing peptide. Proc Natl Acad Sci USA 1977',
      },
      {
        label:
          'Graf MV, Kastin AJ. Delta-sleep-inducing peptide (DSIP): a review. Neurosci Biobehav Rev 1984',
      },
      { label: 'Schneider-Helmert D — estudios clínicos de DSIP en insomnio crónico (años 80)' },
    ],
    tags: ['sueno', 'insomnio', 'estres', 'investigacion'],
    lastReviewed: '2026-09-19',
  },
  {
    id: 'vilon',
    names: { generic: 'Vilon', brands: [], aliases: ['Lys-Glu', 'KE', 'dipéptido tímico'] },
    category: 'longevity',
    pharmClass: t(
      'Dipéptido "bioregulador" tímico de Khavinson (inmunomodulador propuesto)',
      'Khavinson thymic "bioregulator" dipeptide (proposed immunomodulator)',
    ),
    summary: t(
      'Dipéptido sintético (Lys-Glu) propuesto por el grupo de Khavinson como bioregulador tímico e inmunomodulador geroprotector. La evidencia es casi exclusivamente de ese grupo: estudios en roedores (supervivencia, tumores espontáneos) y cultivos celulares, sin ensayos humanos controlados.',
      "Synthetic dipeptide (Lys-Glu) proposed by Khavinson's group as a thymic bioregulator and geroprotective immunomodulator. Evidence is almost exclusively from that group: rodent (survival, spontaneous tumours) and cell-culture studies, with no controlled human trials.",
    ),
    mechanism: t(
      `Se describe estimulación de la diferenciación de linfocitos T, cambios en la expresión de genes de proliferación y descondensación de heterocromatina en linfocitos de ancianos in vitro; en ratones, aumento modesto de la supervivencia y menor incidencia de algunos tumores espontáneos. ${KHAVINSON_MECHANISM_TAIL.es}`,
      `Stimulation of T-lymphocyte differentiation, changes in proliferation-gene expression and heterochromatin decondensation in lymphocytes from elderly donors in vitro are described; in mice, a modest survival increase and fewer of some spontaneous tumours. ${KHAVINSON_MECHANISM_TAIL.en}`,
    ),
    indications: [
      t('Ninguna aprobada', 'None approved'),
      t(
        'Propuesto: inmunosenescencia, envejecimiento (grupo de Khavinson)',
        'Proposed: immunosenescence, ageing (Khavinson group)',
      ),
    ],
    evidence: 'preclinical',
    regulatory: { us: 'research_only', notes: KHAVINSON_NOTES },
    routes: ['sc', 'im', 'oral'],
    defaultUnit: 'mg',
    dosing: {
      anecdotal: t(
        'Uso no aprobado — pautas comerciales no estandarizadas (cápsulas o viales) en ciclos de 10–20 días; sin datos de dosis-respuesta en humanos.',
        'Unapproved use — non-standardised commercial regimens (capsules or vials) in 10–20-day cycles; no human dose-response data.',
      ),
      frequency: t('1×/día en ciclos (uso no aprobado)', 'Once daily in cycles (unapproved use)'),
    },
    reconstitution: STD_VIAL_RECON(10),
    storage: LYO_STORAGE,
    adverseEffects: { common: [INJECTION_SITE], serious: [UNCHARACTERISED_SERIOUS] },
    contraindications: [
      PREGNANCY_NO_DATA,
      t(
        'Enfermedad autoinmune activa o trasplante con inmunosupresión (inmunomodulación teórica)',
        'Active autoimmune disease or transplant on immunosuppression (theoretical immunomodulation)',
      ),
    ],
    interactions: [
      t('Inmunosupresores: antagonismo teórico', 'Immunosuppressants: theoretical antagonism'),
    ],
    keyTrials: [],
    references: [KHAVINSON_GENERAL_REF, KHAVINSON_REVIEW_REF],
    tags: ['longevidad', 'bioregulador', 'khavinson', 'timo', 'inmunomodulador'],
    lastReviewed: '2026-09-19',
  },
  {
    id: 'cortagen',
    names: { generic: 'Cortagen', brands: [], aliases: ['Ala-Glu-Asp-Pro', 'AEDP'] },
    category: 'longevity',
    pharmClass: t(
      'Tetrapéptido "bioregulador" cortical de Khavinson (neuroprotector propuesto)',
      'Khavinson cortical "bioregulator" tetrapeptide (proposed neuroprotective)',
    ),
    summary: t(
      'Tetrapéptido sintético (Ala-Glu-Asp-Pro) propuesto por el grupo de Khavinson como análogo del extracto polipeptídico de corteza cerebral. La evidencia procede casi solo de ese grupo, en modelos animales de lesión nerviosa y estudios in vitro de expresión génica.',
      "Synthetic tetrapeptide (Ala-Glu-Asp-Pro) proposed by Khavinson's group as an analogue of cerebral-cortex polypeptide extract. Evidence comes almost only from that group, in animal nerve-injury models and in vitro gene-expression studies.",
    ),
    mechanism: t(
      `En ratas se describe aceleración de la regeneración de nervio periférico tras lesión y efectos sobre la expresión génica en corazón y cerebro. ${KHAVINSON_MECHANISM_TAIL.es}`,
      `In rats, faster peripheral-nerve regeneration after injury and effects on gene expression in heart and brain are described. ${KHAVINSON_MECHANISM_TAIL.en}`,
    ),
    indications: [
      t('Ninguna aprobada', 'None approved'),
      t(
        'Propuesto: lesión nerviosa, envejecimiento cerebral (grupo de Khavinson)',
        'Proposed: nerve injury, brain ageing (Khavinson group)',
      ),
    ],
    evidence: 'preclinical',
    regulatory: { us: 'research_only', notes: KHAVINSON_NOTES },
    routes: ['sc', 'im'],
    defaultUnit: 'mg',
    dosing: {
      anecdotal: t(
        'Uso no aprobado — pautas comerciales no estandarizadas en ciclos de 10–20 días; sin datos de dosis-respuesta en humanos.',
        'Unapproved use — non-standardised commercial regimens in 10–20-day cycles; no human dose-response data.',
      ),
      frequency: t('1×/día en ciclos (uso no aprobado)', 'Once daily in cycles (unapproved use)'),
    },
    reconstitution: STD_VIAL_RECON(10),
    storage: LYO_STORAGE,
    adverseEffects: { common: [INJECTION_SITE], serious: [UNCHARACTERISED_SERIOUS] },
    contraindications: [PREGNANCY_NO_DATA],
    interactions: [NO_KNOWN_INTERACTIONS],
    keyTrials: [],
    references: [KHAVINSON_GENERAL_REF, KHAVINSON_REVIEW_REF],
    tags: ['longevidad', 'bioregulador', 'khavinson', 'neuroproteccion'],
    lastReviewed: '2026-09-19',
  },
  {
    id: 'cartalax',
    names: { generic: 'Cartalax', brands: [], aliases: ['Ala-Glu-Asp', 'AED'] },
    category: 'longevity',
    pharmClass: t(
      'Tripéptido "bioregulador" de cartílago de Khavinson',
      'Khavinson cartilage "bioregulator" tripeptide',
    ),
    summary: t(
      'Tripéptido sintético (Ala-Glu-Asp) propuesto por el grupo de Khavinson como bioregulador del cartílago y del tejido conectivo. La evidencia procede casi solo de ese grupo, principalmente de cultivos de fibroblastos y condrocitos, sin ensayos clínicos controlados.',
      "Synthetic tripeptide (Ala-Glu-Asp) proposed by Khavinson's group as a cartilage and connective-tissue bioregulator. Evidence comes almost only from that group, mainly fibroblast and chondrocyte cultures, with no controlled clinical trials.",
    ),
    mechanism: t(
      `En cultivos celulares se describen cambios en marcadores de proliferación, senescencia y síntesis de matriz extracelular. ${KHAVINSON_MECHANISM_TAIL.es}`,
      `In cell cultures, changes in proliferation, senescence and extracellular-matrix synthesis markers are described. ${KHAVINSON_MECHANISM_TAIL.en}`,
    ),
    indications: [
      t('Ninguna aprobada', 'None approved'),
      t(
        'Propuesto: artrosis, envejecimiento del tejido conectivo (grupo de Khavinson)',
        'Proposed: osteoarthritis, connective-tissue ageing (Khavinson group)',
      ),
    ],
    evidence: 'preclinical',
    regulatory: { us: 'research_only', notes: KHAVINSON_NOTES },
    routes: ['sc', 'im', 'oral'],
    defaultUnit: 'mg',
    dosing: {
      anecdotal: t(
        'Uso no aprobado — pautas comerciales no estandarizadas (cápsulas o viales) en ciclos de 10–30 días; sin datos de dosis-respuesta en humanos.',
        'Unapproved use — non-standardised commercial regimens (capsules or vials) in 10–30-day cycles; no human dose-response data.',
      ),
      frequency: t('1×/día en ciclos (uso no aprobado)', 'Once daily in cycles (unapproved use)'),
    },
    reconstitution: STD_VIAL_RECON(10),
    storage: LYO_STORAGE,
    adverseEffects: { common: [INJECTION_SITE], serious: [UNCHARACTERISED_SERIOUS] },
    contraindications: [PREGNANCY_NO_DATA],
    interactions: [NO_KNOWN_INTERACTIONS],
    keyTrials: [],
    references: [KHAVINSON_GENERAL_REF, KHAVINSON_REVIEW_REF],
    tags: ['longevidad', 'bioregulador', 'khavinson', 'cartilago', 'articular'],
    lastReviewed: '2026-09-19',
  },
  {
    id: 'livagen',
    names: { generic: 'Livagen', brands: [], aliases: ['Lys-Glu-Asp-Ala', 'KEDA'] },
    category: 'longevity',
    pharmClass: t(
      'Tetrapéptido "bioregulador" hepático de Khavinson',
      'Khavinson hepatic "bioregulator" tetrapeptide',
    ),
    summary: t(
      'Tetrapéptido sintético (Lys-Glu-Asp-Ala) propuesto por el grupo de Khavinson como bioregulador hepático y geroprotector. La evidencia procede casi solo de ese grupo: estudios in vitro en linfocitos humanos y modelos animales, sin ensayos clínicos controlados.',
      "Synthetic tetrapeptide (Lys-Glu-Asp-Ala) proposed by Khavinson's group as a hepatic bioregulator and geroprotector. Evidence comes almost only from that group: in vitro human-lymphocyte studies and animal models, with no controlled clinical trials.",
    ),
    mechanism: t(
      `En linfocitos de donantes ancianos in vitro se describe descondensación de heterocromatina y reactivación de genes ribosómicos "silenciados"; en animales, normalización de enzimas hepáticas y de la actividad digestiva. ${KHAVINSON_MECHANISM_TAIL.es}`,
      `In lymphocytes from elderly donors in vitro, heterochromatin decondensation and reactivation of "silenced" ribosomal genes are described; in animals, normalisation of liver enzymes and digestive activity. ${KHAVINSON_MECHANISM_TAIL.en}`,
    ),
    indications: [
      t('Ninguna aprobada', 'None approved'),
      t(
        'Propuesto: envejecimiento hepático, disfunción digestiva (grupo de Khavinson)',
        'Proposed: hepatic ageing, digestive dysfunction (Khavinson group)',
      ),
    ],
    evidence: 'preclinical',
    regulatory: { us: 'research_only', notes: KHAVINSON_NOTES },
    routes: ['sc', 'im', 'oral'],
    defaultUnit: 'mg',
    dosing: {
      anecdotal: t(
        'Uso no aprobado — pautas comerciales no estandarizadas (cápsulas o viales) en ciclos de 10–20 días; sin datos de dosis-respuesta en humanos.',
        'Unapproved use — non-standardised commercial regimens (capsules or vials) in 10–20-day cycles; no human dose-response data.',
      ),
      frequency: t('1×/día en ciclos (uso no aprobado)', 'Once daily in cycles (unapproved use)'),
    },
    reconstitution: STD_VIAL_RECON(10),
    storage: LYO_STORAGE,
    adverseEffects: { common: [INJECTION_SITE], serious: [UNCHARACTERISED_SERIOUS] },
    contraindications: [
      PREGNANCY_NO_DATA,
      t(
        'Hepatopatía activa sin supervisión (sin datos)',
        'Active liver disease without supervision (no data)',
      ),
    ],
    interactions: [NO_KNOWN_INTERACTIONS],
    monitoring: [
      t(
        'Perfil hepático si se usa pese a la falta de evidencia',
        'Liver panel if used despite lack of evidence',
      ),
    ],
    keyTrials: [],
    references: [KHAVINSON_GENERAL_REF, KHAVINSON_REVIEW_REF],
    tags: ['longevidad', 'bioregulador', 'khavinson', 'higado'],
    lastReviewed: '2026-09-19',
  },
]
