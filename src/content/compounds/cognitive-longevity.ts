import { t, type CompoundDetail, type L10n } from '../schema'

/**
 * Cognitive (nootropic) and longevity compounds.
 * Semax and selank are nationally registered in Russia/CIS but neither is
 * FDA/EMA approved. Epitalon, a Khavinson "bioregulator" peptide, rests almost
 * entirely on a single research group's small or uncontrolled studies. Evidence tiers are stated
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
const KHAVINSON_GENERAL_REF = {
  label: 'Khavinson VKh. Peptides and ageing. Neuro Endocrinol Lett 2002 (suplemento monográfico)',
}
export const COGNITIVE_LONGEVITY: CompoundDetail[] = [
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
]
