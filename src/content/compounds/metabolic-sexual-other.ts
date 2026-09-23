import { t, type CompoundEntry } from '../schema'

/**
 * Metabolic, sexual-health and miscellaneous compounds (second batch).
 * Several entries are NOT peptides (5-amino-1MQ, NAD+, tesofensine) and are
 * included because they circulate in the same clinical/"research" context.
 * Evidence tiers and regulatory status are stated conservatively. Dosing
 * labelled "anecdotal" is community usage reproduced for harm-reduction
 * context only and is never a recommendation.
 */
export const METABOLIC_SEXUAL_OTHER: CompoundEntry[] = [
  // ───────────────────────────── METABOLIC ─────────────────────────────
  {
    id: 'aod-9604',
    names: {
      generic: 'AOD-9604',
      brands: [],
      aliases: ['Tyr-hGH(177-191)', 'Fragmento lipolítico de hGH', 'Advanced Obesity Drug 9604'],
    },
    category: 'metabolic',
    pharmClass: t(
      'Fragmento C-terminal modificado de la hormona de crecimiento (hGH 177-191 + Tyr)',
      'Modified C-terminal growth hormone fragment (hGH 177-191 + Tyr)',
    ),
    summary: t(
      'Hexadecapéptido derivado del extremo C-terminal de la hGH, diseñado para conservar el efecto lipolítico sin efectos sobre IGF-1 ni glucemia. Los ensayos de fase 2b en obesidad no mostraron pérdida de peso significativa frente a placebo y el desarrollo farmacéutico se abandonó (~2007).',
      'Hexadecapeptide derived from the hGH C-terminus, designed to retain lipolytic activity without IGF-1 or glycaemic effects. Phase 2b obesity trials showed no significant weight loss versus placebo and pharmaceutical development was abandoned (~2007).',
    ),
    mechanism: t(
      'En roedores estimula la lipólisis y la oxidación de grasas e inhibe la lipogénesis en el adipocito, con efecto independiente del receptor β3-adrenérgico; no se une de forma relevante al receptor de GH ni eleva IGF-1. La traslación a humanos no se confirmó.',
      'In rodents it stimulates lipolysis and fat oxidation and inhibits adipocyte lipogenesis, an effect independent of the β3-adrenergic receptor; it does not bind the GH receptor meaningfully or raise IGF-1. Translation to humans was not confirmed.',
    ),
    indications: [
      t('Ninguna aprobada', 'None approved'),
      t(
        'Investigado (fracasado): obesidad, formulación oral (Metabolic Pharmaceuticals, fase 2b)',
        'Investigated (failed): obesity, oral formulation (Metabolic Pharmaceuticals, phase 2b)',
      ),
      t(
        'Preclínico/anecdótico: reparación de cartílago, "quema de grasa" localizada',
        'Preclinical/anecdotal: cartilage repair, localised "fat burning"',
      ),
    ],
    evidence: 'anecdotal',
    regulatory: {
      us: 'research_only',
      notes: t(
        'El fabricante comunicó una autodeclaración GRAS (Generally Recognized As Safe) para uso alimentario hacia 2014; no es una aprobación de la FDA ni una evaluación como fármaco. La FDA lo clasificó en la categoría 2 de sustancias a granel 503A (riesgo de seguridad; 2023), lo que impide su formulación magistral. Prohibido por la AMA/WADA (S2, fragmentos de GH).',
        'The manufacturer announced a self-affirmed GRAS (Generally Recognized As Safe) status for food use around 2014; this is not an FDA approval nor a drug evaluation. FDA placed it in 503A bulk-substance category 2 (safety risk; 2023), which blocks compounding. Prohibited by WADA (S2, GH fragments).',
      ),
    },
    routes: ['sc', 'oral'],
    defaultUnit: 'mcg',
    dosing: {
      investigational: t(
        'Fase 2b: dosis orales diarias de hasta ~1 mg durante 12–24 semanas, sin diferencia significativa de peso frente a placebo.',
        'Phase 2b: daily oral doses up to ~1 mg for 12–24 weeks, with no significant weight difference versus placebo.',
      ),
      anecdotal: t(
        'Uso no aprobado — 250–500 mcg SC 1×/día, a menudo en ayunas, en ciclos de 8–12 semanas; sin evidencia de eficacia en humanos.',
        'Unapproved use — 250–500 mcg SC once daily, often fasted, in 8–12-week cycles; no evidence of efficacy in humans.',
      ),
      frequency: t('1×/día (uso no aprobado)', 'Once daily (unapproved use)'),
    },
    reconstitution: t(
      'Vial liofilizado de 5 mg + 2 mL de agua bacteriostática = 2,5 mg/mL (2500 mcg/mL). En jeringa U-100: 300 mcg = 0,12 mL = 12 U; 250 mcg = 10 U. Estable ~3–4 semanas en nevera tras reconstituir.',
      '5 mg lyophilised vial + 2 mL bacteriostatic water = 2.5 mg/mL (2500 mcg/mL). U-100 syringe: 300 mcg = 0.12 mL = 12 U; 250 mcg = 10 U. Stable ~3–4 weeks refrigerated after reconstitution.',
    ),
    storage: t(
      'Polvo liofilizado: −20 °C a largo plazo, 2–8 °C durante meses. Reconstituido: 2–8 °C, proteger de la luz, no congelar.',
      'Lyophilised powder: −20 °C long term, 2–8 °C for months. Reconstituted: 2–8 °C, protect from light, do not freeze.',
    ),
    adverseEffects: {
      common: [
        t('Reacciones en el punto de inyección', 'Injection-site reactions'),
        t(
          'Cefalea (referida en ensayos, similar a placebo)',
          'Headache (reported in trials, similar to placebo)',
        ),
      ],
      serious: [
        t(
          'Sin señal grave en los ensayos orales agrupados; la vía SC de mercado gris no está caracterizada',
          'No serious signal in pooled oral trials; grey-market SC use is uncharacterised',
        ),
        t(
          'Inmunogenicidad y contaminación del producto no evaluadas (motivo de la clasificación FDA 503A)',
          'Immunogenicity and product contamination not evaluated (reason for the FDA 503A classification)',
        ),
      ],
    },
    contraindications: [
      t('Embarazo y lactancia (sin datos)', 'Pregnancy and lactation (no data)'),
      t('Deportistas sujetos a control antidopaje', 'Athletes subject to anti-doping testing'),
    ],
    interactions: [
      t(
        'No se han descrito interacciones farmacocinéticas relevantes',
        'No relevant pharmacokinetic interactions described',
      ),
    ],
    monitoring: [
      t(
        'Peso y composición corporal para objetivar la ausencia/presencia de efecto',
        'Weight and body composition to objectify presence/absence of effect',
      ),
    ],
    keyTrials: [
      {
        name: 'Heffernan et al. (ratones obesos)',
        year: 2001,
        finding: t(
          'Reducción de grasa corporal y aumento de oxidación lipídica en ratones obesos, también en knock-out β3-AR.',
          'Reduced body fat and increased lipid oxidation in obese mice, including β3-AR knock-outs.',
        ),
        ref: 'Endocrinology 2001',
      },
      {
        name: 'Stier et al. (seguridad agrupada)',
        year: 2013,
        finding: t(
          'Análisis de seis ensayos aleatorizados en humanos: tolerabilidad similar a placebo, sin efecto sobre IGF-1 ni glucemia.',
          'Analysis of six randomised human trials: placebo-like tolerability, no effect on IGF-1 or glucose.',
        ),
      },
    ],
    references: [
      {
        label:
          'Heffernan M et al. Effects of hGH and its lipolytic fragment (AOD9604) on lipid metabolism in obese mice and β3-AR knock-out mice. Endocrinology 2001',
      },
      {
        label:
          'Stier H et al. Safety and tolerability of the hexadecapeptide AOD9604 in humans. J Endocrinol Metab 2013',
      },
      { label: 'FDA 503A Bulks List — category 2 (AOD-9604)' },
    ],
    tags: ['fragmento-gh', 'metabolico', 'obesidad', 'investigacion', 'fracasado'],
    lastReviewed: '2026-09-19',
  },
  {
    id: 'elamipretide',
    names: {
      generic: 'Elamipretida',
      brands: ['Forzinity'],
      aliases: ['SS-31', 'MTP-131', 'Bendavia', 'D-Arg-Dmt-Lys-Phe-NH2'],
    },
    category: 'metabolic',
    pharmClass: t(
      'Tetrapéptido dirigido a la mitocondria (ligando de cardiolipina)',
      'Mitochondria-targeted tetrapeptide (cardiolipin ligand)',
    ),
    summary: t(
      'Tetrapéptido aromático-catiónico (Szeto-Schiller) que se concentra en la membrana mitocondrial interna. Según la información disponible, recibió aprobación acelerada de la FDA en septiembre de 2025 como Forzinity para el síndrome de Barth (pacientes ≥30 kg), basada en mejoría de fuerza muscular; confirmar en ficha técnica vigente. Fracasó en miopatía mitocondrial primaria (MMPOWER-3) y en otras indicaciones.',
      'Aromatic-cationic (Szeto-Schiller) tetrapeptide that concentrates in the inner mitochondrial membrane. Per available information it received FDA accelerated approval in September 2025 as Forzinity for Barth syndrome (patients ≥30 kg), based on improved muscle strength; confirm against the current label. It failed in primary mitochondrial myopathy (MMPOWER-3) and other indications.',
    ),
    mechanism: t(
      'Se une a la cardiolipina de la membrana mitocondrial interna, estabiliza las crestas y los supercomplejos de la cadena respiratoria, mejora el acoplamiento de la fosforilación oxidativa y reduce la producción de ROS. En el síndrome de Barth (mutación TAZ, cardiolipina anómala) se postula una corrección parcial del defecto bioenergético.',
      'Binds cardiolipin in the inner mitochondrial membrane, stabilises cristae and respiratory-chain supercomplexes, improves oxidative-phosphorylation coupling and reduces ROS production. In Barth syndrome (TAZ mutation, abnormal cardiolipin) it is proposed to partly correct the bioenergetic defect.',
    ),
    indications: [
      t(
        'Síndrome de Barth en pacientes ≥30 kg (Forzinity, aprobación acelerada FDA 2025; verificar)',
        'Barth syndrome in patients ≥30 kg (Forzinity, FDA accelerated approval 2025; verify)',
      ),
      t(
        'Investigado sin éxito: miopatía mitocondrial primaria, insuficiencia cardiaca, IAMCEST (IV)',
        'Investigated without success: primary mitochondrial myopathy, heart failure, STEMI (IV)',
      ),
      t(
        'Investigado: degeneración macular asociada a la edad seca, neuropatía óptica de Leber',
        'Investigated: dry age-related macular degeneration, Leber hereditary optic neuropathy',
      ),
    ],
    evidence: 'fda_approved',
    regulatory: {
      us: 'approved',
      eu: 'investigational',
      notes: t(
        'Aprobación acelerada (sujeta a ensayo confirmatorio) en EE. UU.; sin autorización en la UE. Fuera de Barth, los viales de "SS-31" se venden como producto de investigación sin control de calidad farmacéutico.',
        'Accelerated approval (subject to a confirmatory trial) in the US; not authorised in the EU. Outside Barth syndrome, "SS-31" vials are sold as research products without pharmaceutical quality control.',
      ),
    },
    routes: ['sc', 'iv'],
    defaultUnit: 'mg',
    dosing: {
      labeled: t(
        'Forzinity: 40 mg SC 1×/día (pacientes ≥30 kg). Confirmar en la ficha técnica vigente.',
        'Forzinity: 40 mg SC once daily (patients ≥30 kg). Confirm against the current label.',
      ),
      investigational: t(
        'TAZPOWER y MMPOWER-3: 40 mg SC 1×/día. Estudios cardiacos agudos: perfusión IV (dosis en mg/kg/h).',
        'TAZPOWER and MMPOWER-3: 40 mg SC once daily. Acute cardiac studies: IV infusion (mg/kg/h dosing).',
      ),
      anecdotal: t(
        'Uso no aprobado — "longevidad"/rendimiento: 5–20 mg SC/día en ciclos; sin datos de beneficio en personas sanas.',
        'Unapproved use — "longevity"/performance: 5–20 mg SC daily in cycles; no benefit data in healthy people.',
      ),
      frequency: t('1×/día', 'Once daily'),
    },
    reconstitution: t(
      'Forzinity: presentación comercial lista para uso según ficha técnica. Viales de investigación: 10 mg liofilizados + 2 mL de agua bacteriostática = 5 mg/mL; en jeringa U-100, 5 mg = 1 mL = 100 U; 1 mg = 20 U.',
      'Forzinity: commercial ready-to-use presentation per label. Research vials: 10 mg lyophilised + 2 mL bacteriostatic water = 5 mg/mL; U-100 syringe, 5 mg = 1 mL = 100 U; 1 mg = 20 U.',
    ),
    storage: t(
      'Producto comercial: según ficha técnica. Liofilizado de investigación: −20 °C a largo plazo; reconstituido 2–8 °C, uso en 2–4 semanas, no congelar.',
      'Commercial product: per label. Research lyophilisate: −20 °C long term; reconstituted 2–8 °C, use within 2–4 weeks, do not freeze.',
    ),
    adverseEffects: {
      common: [
        t(
          'Reacciones en el punto de inyección (eritema, prurito, dolor, induración): muy frecuentes',
          'Injection-site reactions (erythema, pruritus, pain, induration): very common',
        ),
        t('Cefalea, mareo', 'Headache, dizziness'),
      ],
      serious: [
        t(
          'Reacciones locales intensas que motivan suspensión',
          'Severe local reactions leading to discontinuation',
        ),
        t(
          'Hipersensibilidad (vigilar; perfil a largo plazo limitado)',
          'Hypersensitivity (monitor; limited long-term profile)',
        ),
      ],
    },
    contraindications: [
      t('Hipersensibilidad conocida a elamipretida', 'Known hypersensitivity to elamipretide'),
      t('Embarazo y lactancia: datos insuficientes', 'Pregnancy and lactation: insufficient data'),
    ],
    interactions: [
      t(
        'Sin interacciones farmacocinéticas relevantes conocidas; consultar ficha técnica',
        'No known relevant pharmacokinetic interactions; consult the label',
      ),
    ],
    monitoring: [
      t(
        'Fuerza muscular (extensores de rodilla) y capacidad funcional (test de marcha de 6 min)',
        'Muscle strength (knee extensors) and functional capacity (6-minute walk test)',
      ),
      t(
        'Función cardiaca en síndrome de Barth (ecocardiografía)',
        'Cardiac function in Barth syndrome (echocardiography)',
      ),
      t('Piel en zonas de inyección', 'Skin at injection sites'),
    ],
    keyTrials: [
      {
        name: 'TAZPOWER',
        year: 2021,
        finding: t(
          'Fase 2/3 cruzada en Barth: no alcanzó el objetivo primario a 12 semanas; la extensión abierta mostró mejoría de fuerza y marcha, base de la aprobación acelerada.',
          'Phase 2/3 crossover in Barth: missed the 12-week primary endpoint; the open-label extension showed improved strength and walking, the basis of accelerated approval.',
        ),
        ref: 'Genet Med 2021',
      },
      {
        name: 'MMPOWER-3',
        year: 2020,
        finding: t(
          'Fase 3 en miopatía mitocondrial primaria: sin mejoría significativa en test de marcha ni fatiga frente a placebo.',
          'Phase 3 in primary mitochondrial myopathy: no significant improvement in walk test or fatigue versus placebo.',
        ),
      },
    ],
    references: [
      {
        label:
          'Forzinity (elamipretide) US Prescribing Information (Stealth BioTherapeutics), 2025',
      },
      {
        label:
          'Reid Thompson W et al. A phase 2/3 randomized clinical trial followed by an open-label extension to evaluate the effectiveness of elamipretide in Barth syndrome. Genet Med 2021',
      },
      {
        label:
          'Szeto HH. First-in-class cardiolipin-protective compound as a therapeutic agent to restore mitochondrial bioenergetics. Br J Pharmacol 2014',
      },
    ],
    tags: ['mitocondrial', 'cardiolipina', 'barth', 'enfermedad-rara', 'aprobado'],
    lastReviewed: '2026-09-19',
  },
  {
    id: '5-amino-1mq',
    names: {
      generic: '5-Amino-1MQ',
      brands: [],
      aliases: ['5-amino-1-metilquinolinio', '5-amino-1-methylquinolinium', 'NNMTi'],
    },
    category: 'metabolic',
    pharmClass: t(
      'Inhibidor de molécula pequeña de la NNMT (NO es un péptido)',
      'Small-molecule NNMT inhibitor (NOT a peptide)',
    ),
    summary: t(
      'Catión de quinolinio metilado, de molécula pequeña (no peptídico), que inhibe la nicotinamida N-metiltransferasa. En ratones obesos por dieta redujo peso y masa grasa sin cambiar la ingesta. No existen ensayos clínicos publicados en humanos; se vende como cápsulas orales de "investigación".',
      'Methylated quinolinium cation, a small molecule (non-peptide), that inhibits nicotinamide N-methyltransferase. In diet-induced obese mice it reduced weight and fat mass without changing food intake. No published human clinical trials exist; it is sold as oral "research" capsules.',
    ),
    mechanism: t(
      'La NNMT metila la nicotinamida consumiendo SAM; está sobreexpresada en el tejido adiposo en obesidad. Su inhibición aumenta los niveles intracelulares de NAD+ y SAM, favorece el gasto energético del adipocito y reduce la lipogénesis (modelos celulares y murinos).',
      'NNMT methylates nicotinamide, consuming SAM, and is overexpressed in adipose tissue in obesity. Its inhibition raises intracellular NAD+ and SAM, promotes adipocyte energy expenditure and reduces lipogenesis (cell and murine models).',
    ),
    indications: [
      t('Ninguna aprobada', 'None approved'),
      t(
        'Preclínico: obesidad, sarcopenia (envejecimiento muscular en ratones)',
        'Preclinical: obesity, sarcopenia (muscle ageing in mice)',
      ),
    ],
    evidence: 'preclinical',
    regulatory: {
      us: 'research_only',
      notes: t(
        'Sin IND público conocido para uso clínico; comercializado como producto de investigación o "suplemento" sin estatus regulatorio legítimo.',
        'No known public IND for clinical use; marketed as a research product or "supplement" with no legitimate regulatory status.',
      ),
    },
    routes: ['oral'],
    defaultUnit: 'mg',
    dosing: {
      anecdotal: t(
        'Uso no aprobado — 50–150 mg VO/día en ciclos de 4–8 semanas; dosis extrapoladas de ratón sin datos de farmacocinética humana.',
        'Unapproved use — 50–150 mg PO daily in 4–8-week cycles; doses extrapolated from mice with no human pharmacokinetic data.',
      ),
      frequency: t('1×/día (uso no aprobado)', 'Once daily (unapproved use)'),
    },
    storage: t(
      'Cápsulas/polvo: temperatura ambiente (<25 °C), secas y protegidas de la luz.',
      'Capsules/powder: room temperature (<25 °C), dry and protected from light.',
    ),
    adverseEffects: {
      common: [
        t(
          'No caracterizados; referidos anecdóticamente molestias GI y cefalea',
          'Uncharacterised; GI discomfort and headache reported anecdotally',
        ),
      ],
      serious: [
        t(
          'Desconocidos: sin datos toxicológicos humanos; efectos a largo plazo de la alteración del metabolismo de metilación (SAM) no estudiados',
          'Unknown: no human toxicology data; long-term effects of altered methylation (SAM) metabolism unstudied',
        ),
      ],
    },
    contraindications: [
      t('Embarazo y lactancia', 'Pregnancy and lactation'),
      t(
        'Hepatopatía (la NNMT es muy abundante en hígado; sin datos)',
        'Liver disease (NNMT is highly abundant in liver; no data)',
      ),
    ],
    interactions: [
      t(
        'Teóricas con precursores de NAD+ (nicotinamida, NR, NMN) y fármacos metabolizados por metilación; no estudiadas',
        'Theoretical with NAD+ precursors (nicotinamide, NR, NMN) and methylation-dependent drugs; unstudied',
      ),
    ],
    keyTrials: [
      {
        name: 'Neelakantan et al. (ratones obesos)',
        year: 2018,
        finding: t(
          'Inhibidores de NNMT redujeron peso, masa grasa blanca y tamaño adipocitario en ratones con obesidad por dieta.',
          'NNMT inhibitors reduced body weight, white fat mass and adipocyte size in diet-induced obese mice.',
        ),
        ref: 'Biochem Pharmacol 2018',
      },
      {
        name: 'Kraus et al. (knockdown de NNMT)',
        year: 2014,
        finding: t(
          'El silenciamiento de NNMT en tejido adiposo e hígado protegió frente a la obesidad inducida por dieta.',
          'NNMT knockdown in adipose tissue and liver protected against diet-induced obesity.',
        ),
        ref: 'Nature 2014',
      },
    ],
    references: [
      {
        label:
          'Neelakantan H et al. Selective and membrane-permeable small molecule inhibitors of NNMT reverse high fat diet-induced obesity in mice. Biochem Pharmacol 2018',
      },
      {
        label:
          'Kraus D et al. Nicotinamide N-methyltransferase knockdown protects against diet-induced obesity. Nature 2014',
      },
    ],
    tags: ['no-peptido', 'nnmt', 'nad', 'obesidad', 'oral', 'investigacion'],
    lastReviewed: '2026-09-19',
  },
  {
    id: 'nad-plus',
    names: {
      generic: 'NAD+',
      brands: [],
      aliases: ['Nicotinamida adenina dinucleótido', 'Nicotinamide adenine dinucleotide', 'β-NAD'],
    },
    category: 'metabolic',
    pharmClass: t(
      'Coenzima redox (dinucleótido; NO es un péptido)',
      'Redox coenzyme (dinucleotide; NOT a peptide)',
    ),
    summary: t(
      'Coenzima esencial del metabolismo energético y sustrato de sirtuinas y PARP; no es un péptido. Se administra en perfusiones IV o inyecciones SC en clínicas de "bienestar" y longevidad, sin ensayos controlados que demuestren beneficio clínico. Los estudios humanos controlados existentes son con precursores orales (NR, NMN), no con NAD+ parenteral.',
      'Essential coenzyme of energy metabolism and substrate of sirtuins and PARPs; not a peptide. Given as IV infusions or SC injections in "wellness" and longevity clinics, without controlled trials showing clinical benefit. Existing controlled human studies use oral precursors (NR, NMN), not parenteral NAD+.',
    ),
    mechanism: t(
      'Aceptor/donador de electrones (NAD+/NADH) en glucólisis, ciclo de Krebs y fosforilación oxidativa; cosustrato de sirtuinas, PARP y CD38. Los niveles tisulares descienden con la edad. El NAD+ extracelular apenas atraviesa membranas intacto: se degrada a NMN/nicotinamida/adenosina antes de su captación, lo que cuestiona la lógica de la vía IV.',
      'Electron acceptor/donor (NAD+/NADH) in glycolysis, the Krebs cycle and oxidative phosphorylation; co-substrate for sirtuins, PARPs and CD38. Tissue levels decline with age. Extracellular NAD+ barely crosses membranes intact: it is degraded to NMN/nicotinamide/adenosine before uptake, which questions the rationale for IV use.',
    ),
    indications: [
      t('Ninguna aprobada como fármaco', 'None approved as a drug'),
      t(
        'Uso no aprobado: "antienvejecimiento", fatiga, deshabituación de alcohol/opioides (protocolos IV de clínicas privadas)',
        'Unapproved use: "anti-ageing", fatigue, alcohol/opioid withdrawal (private-clinic IV protocols)',
      ),
    ],
    evidence: 'anecdotal',
    regulatory: {
      us: 'compounded',
      notes: t(
        'En EE. UU. se prepara en farmacias de fórmula magistral para perfusión/inyección; su estatus en la lista 503A ha sido objeto de revisión y puede cambiar (verificar). No es un medicamento aprobado en ninguna jurisdicción para estas indicaciones. Existen solo estudios piloto farmacocinéticos en humanos (p. ej. perfusión IV de 6 h).',
        'In the US it is prepared by compounding pharmacies for infusion/injection; its 503A-list status has been under review and may change (verify). It is not an approved medicine in any jurisdiction for these uses. Only pilot human pharmacokinetic studies exist (e.g. a 6-h IV infusion).',
      ),
    },
    routes: ['iv', 'sc'],
    defaultUnit: 'mg',
    dosing: {
      investigational: t(
        'Estudio piloto: 750 mg IV en perfusión de 6 h en voluntarios sanos (farmacocinética/metaboloma, sin variables clínicas).',
        'Pilot study: 750 mg IV infused over 6 h in healthy volunteers (pharmacokinetics/metabolome, no clinical endpoints).',
      ),
      anecdotal: t(
        'Uso no aprobado — IV 250–1000 mg por sesión en 2–4 h (a veces más lento por tolerancia); SC 50–100 mg 1–3×/semana.',
        'Unapproved use — IV 250–1000 mg per session over 2–4 h (sometimes slower for tolerability); SC 50–100 mg 1–3×/week.',
      ),
      frequency: t(
        'Sesiones IV variables; SC 1–3×/semana (uso no aprobado)',
        'Variable IV sessions; SC 1–3×/week (unapproved use)',
      ),
    },
    reconstitution: t(
      'Vial liofilizado de 500 mg + 5 mL de agua bacteriostática = 100 mg/mL. En jeringa U-100: 50 mg = 0,5 mL = 50 U; 100 mg = 100 U. Para IV se diluye en suero salino según protocolo de farmacia. Reconstituido: nevera, uso en ≤2–4 semanas.',
      '500 mg lyophilised vial + 5 mL bacteriostatic water = 100 mg/mL. U-100 syringe: 50 mg = 0.5 mL = 50 U; 100 mg = 100 U. For IV it is diluted in saline per pharmacy protocol. Reconstituted: refrigerate, use within ≤2–4 weeks.',
    ),
    storage: t(
      'Liofilizado: 2–8 °C (o −20 °C a largo plazo), protegido de la luz y la humedad. Solución: 2–8 °C; el NAD+ se degrada en solución a temperatura ambiente.',
      'Lyophilisate: 2–8 °C (or −20 °C long term), protected from light and moisture. Solution: 2–8 °C; NAD+ degrades in solution at room temperature.',
    ),
    adverseEffects: {
      common: [
        t(
          'Dependientes de la velocidad de perfusión: rubor, opresión torácica, náuseas, calambres abdominales, cefalea, ansiedad',
          'Infusion-rate dependent: flushing, chest tightness, nausea, abdominal cramps, headache, anxiety',
        ),
        t('Dolor y escozor en el punto de inyección SC', 'Pain and stinging at SC injection site'),
      ],
      serious: [
        t(
          'Riesgos propios de la vía IV en entornos no hospitalarios (flebitis, infección, reacción vasovagal)',
          'Risks inherent to IV access in non-hospital settings (phlebitis, infection, vasovagal reaction)',
        ),
        t('Seguridad a largo plazo desconocida', 'Long-term safety unknown'),
      ],
    },
    contraindications: [
      t('Embarazo y lactancia (sin datos)', 'Pregnancy and lactation (no data)'),
      t(
        'Neoplasia activa: precaución teórica (el NAD+ sostiene el metabolismo tumoral; sin datos clínicos)',
        'Active malignancy: theoretical caution (NAD+ supports tumour metabolism; no clinical data)',
      ),
    ],
    interactions: [
      t(
        'Sin interacciones clínicas documentadas; precaución teórica con inhibidores de PARP en oncología',
        'No documented clinical interactions; theoretical caution with PARP inhibitors in oncology',
      ),
    ],
    monitoring: [
      t(
        'Tensión arterial y síntomas durante la perfusión; ajustar velocidad',
        'Blood pressure and symptoms during infusion; adjust rate',
      ),
    ],
    keyTrials: [
      {
        name: 'Grant et al. (piloto IV)',
        year: 2019,
        finding: t(
          'Perfusión de 750 mg en 6 h: el NAD+ plasmático no aumentó hasta pasadas ~2 h y aparecieron metabolitos urinarios; sin evaluación de eficacia.',
          '750 mg infused over 6 h: plasma NAD+ did not rise until after ~2 h and urinary metabolites appeared; no efficacy evaluation.',
        ),
        ref: 'Front Aging Neurosci 2019',
      },
    ],
    references: [
      {
        label:
          'Grant R et al. A pilot study investigating changes in the human plasma and urine NAD+ metabolome during a 6 hour intravenous infusion of NAD+. Front Aging Neurosci 2019',
      },
      {
        label:
          'Rajman L, Chwalek K, Sinclair DA. Therapeutic potential of NAD-boosting molecules: the in vivo evidence. Cell Metab 2018',
      },
    ],
    tags: ['no-peptido', 'nad', 'longevidad', 'intravenoso', 'magistral'],
    lastReviewed: '2026-09-19',
  },
  {
    id: 'humanin',
    names: {
      generic: 'Humanina',
      brands: [],
      aliases: ['Humanin', 'HN', 'HNG (análogo S14G)', 'MT-RNR2'],
    },
    category: 'metabolic',
    pharmClass: t(
      'Péptido derivado de la mitocondria (MDP), citoprotector',
      'Mitochondrial-derived peptide (MDP), cytoprotective',
    ),
    summary: t(
      'Péptido de 24 aminoácidos codificado en el gen mitocondrial 16S rRNA (MT-RNR2), descubierto en 2001 por su capacidad de proteger neuronas frente a agresiones asociadas a Alzheimer. Preclínicamente mejora la sensibilidad a la insulina y es citoprotector; en humanos solo hay estudios observacionales de niveles circulantes, sin ensayos de intervención.',
      '24-amino-acid peptide encoded in the mitochondrial 16S rRNA gene (MT-RNR2), discovered in 2001 for protecting neurons against Alzheimer-related insults. Preclinically it improves insulin sensitivity and is cytoprotective; in humans only observational studies of circulating levels exist, with no interventional trials.',
    ),
    mechanism: t(
      'Actúa por receptores de superficie (FPRL1/FPR2 y un complejo trimérico CNTFR/WSX-1/gp130 que activa JAK2/STAT3) e intracelularmente inhibiendo Bax e IGFBP-3 proapoptóticos. El análogo HNG (Ser14→Gly) es ~1000 veces más potente in vitro. Los niveles plasmáticos disminuyen con la edad.',
      'Acts through surface receptors (FPRL1/FPR2 and a trimeric CNTFR/WSX-1/gp130 complex activating JAK2/STAT3) and intracellularly by inhibiting pro-apoptotic Bax and IGFBP-3. The HNG analogue (Ser14→Gly) is ~1000-fold more potent in vitro. Plasma levels decline with age.',
    ),
    indications: [
      t('Ninguna aprobada', 'None approved'),
      t(
        'Preclínico: neurodegeneración, resistencia a la insulina, aterosclerosis, cardioprotección isquémica',
        'Preclinical: neurodegeneration, insulin resistance, atherosclerosis, ischaemic cardioprotection',
      ),
    ],
    evidence: 'preclinical',
    regulatory: {
      us: 'research_only',
      notes: t(
        'Sin desarrollo clínico registrado; se vende como producto de investigación.',
        'No registered clinical development; sold as a research product.',
      ),
    },
    routes: ['sc'],
    defaultUnit: 'mg',
    dosing: {
      anecdotal: t(
        'Uso no aprobado — no existen rangos comunitarios consolidados ni datos de dosis humanas; las dosis de estudios en roedores (a menudo con HNG) no son extrapolables.',
        'Unapproved use — no consolidated community ranges nor human dosing data exist; rodent study doses (often HNG) are not extrapolable.',
      ),
    },
    reconstitution: t(
      'Vial liofilizado de 10 mg + 2 mL de agua bacteriostática = 5 mg/mL. En jeringa U-100: 1 mg = 0,2 mL = 20 U. Estable 2–4 semanas en nevera tras reconstituir.',
      '10 mg lyophilised vial + 2 mL bacteriostatic water = 5 mg/mL. U-100 syringe: 1 mg = 0.2 mL = 20 U. Stable 2–4 weeks refrigerated after reconstitution.',
    ),
    storage: t(
      'Liofilizado: −20 °C a largo plazo. Reconstituido: 2–8 °C, proteger de la luz, no congelar.',
      'Lyophilisate: −20 °C long term. Reconstituted: 2–8 °C, protect from light, do not freeze.',
    ),
    adverseEffects: {
      common: [t('Reacciones en el punto de inyección', 'Injection-site reactions')],
      serious: [
        t(
          'No caracterizados: sin datos humanos; efecto antiapoptótico con riesgo teórico en neoplasias',
          'Uncharacterised: no human data; anti-apoptotic effect carries a theoretical oncological risk',
        ),
      ],
    },
    contraindications: [
      t(
        'Neoplasia activa o antecedente reciente (riesgo teórico por acción antiapoptótica)',
        'Active or recent malignancy (theoretical risk from anti-apoptotic action)',
      ),
      t('Embarazo y lactancia', 'Pregnancy and lactation'),
    ],
    interactions: [
      t(
        'No estudiadas; efecto aditivo teórico con hipoglucemiantes',
        'Unstudied; theoretical additive effect with glucose-lowering drugs',
      ),
    ],
    keyTrials: [
      {
        name: 'Hashimoto et al. (descubrimiento)',
        year: 2001,
        finding: t(
          'Identificación de la humanina en tejido cerebral de Alzheimer; protección neuronal frente a mutantes de APP/presenilina y Aβ in vitro.',
          'Humanin identified from Alzheimer brain tissue; neuronal protection against APP/presenilin mutants and Aβ in vitro.',
        ),
        ref: 'PNAS 2001',
      },
    ],
    references: [
      {
        label:
          'Hashimoto Y et al. A rescue factor abolishing neuronal cell death by a wide spectrum of familial Alzheimer’s disease genes and Aβ. PNAS 2001',
      },
      {
        label:
          'Kim SJ et al. Mitochondrial peptides modulate mitochondrial function during cellular senescence. Aging (Albany NY) 2018',
      },
    ],
    tags: ['mitocondrial', 'neuroproteccion', 'metabolico', 'investigacion'],
    lastReviewed: '2026-09-19',
  },
  {
    id: 'adipotide',
    names: {
      generic: 'Adipotide',
      brands: [],
      aliases: [
        'FTPP',
        'Fat-Targeted Proapoptotic Peptide',
        'Prohibitin-TP01',
        'CKGGRAKDC-GG-D(KLAKLAK)2',
      ],
    },
    category: 'metabolic',
    pharmClass: t(
      'Peptidomimético proapoptótico dirigido a la vasculatura del tejido adiposo',
      'Proapoptotic peptidomimetic targeting adipose vasculature',
    ),
    summary: t(
      'Péptido quimérico que se une a la prohibitina del endotelio del tejido adiposo blanco y provoca apoptosis vascular con reabsorción de grasa. Redujo peso en ratones y monos rhesus obesos, pero causó toxicidad tubular renal dosis-dependiente en primates; el desarrollo (Arrowhead/Ablaris) se detuvo tras un fase 1 oncológico no publicado.',
      'Chimeric peptide that binds prohibitin on white-adipose endothelium, triggering vascular apoptosis and fat resorption. It reduced weight in obese mice and rhesus monkeys but caused dose-dependent renal tubular toxicity in primates; development (Arrowhead/Ablaris) stopped after an unpublished oncology phase 1.',
    ),
    mechanism: t(
      'El motivo CKGGRAKDC se une a prohibitina (con anexina A2) en el endotelio de la grasa blanca; tras la internalización, el dominio D(KLAKLAK)2 disrumpe la membrana mitocondrial e induce apoptosis de las células endoteliales, con isquemia y regresión del tejido adiposo. El túbulo proximal renal también expresa prohibitina, lo que explica la nefrotoxicidad.',
      'The CKGGRAKDC motif binds prohibitin (with annexin A2) on white-fat endothelium; after internalisation the D(KLAKLAK)2 domain disrupts mitochondrial membranes and induces endothelial apoptosis, leading to ischaemia and adipose regression. The renal proximal tubule also expresses prohibitin, explaining nephrotoxicity.',
    ),
    indications: [
      t('Ninguna aprobada', 'None approved'),
      t('Preclínico: obesidad (ratón, primate)', 'Preclinical: obesity (mouse, primate)'),
      t(
        'Fase 1 en cáncer de próstata (sin resultados publicados)',
        'Phase 1 in prostate cancer (no published results)',
      ),
    ],
    evidence: 'preclinical',
    regulatory: {
      us: 'discontinued',
      notes: t(
        'Desarrollo clínico abandonado; los viales disponibles son de mercado gris ("research chemical"). La toxicidad renal observada en primates hace especialmente peligroso su uso no supervisado.',
        'Clinical development abandoned; available vials are grey-market ("research chemical"). The renal toxicity seen in primates makes unsupervised use particularly dangerous.',
      ),
    },
    routes: ['sc'],
    defaultUnit: 'mg',
    dosing: {
      investigational: t(
        'Monos rhesus obesos: inyección SC diaria en mg/kg durante 4 semanas; sin dosis humana establecida.',
        'Obese rhesus monkeys: daily SC injection in mg/kg for 4 weeks; no established human dose.',
      ),
      anecdotal: t(
        'Uso no aprobado — se comunican ~1–2 mg SC/día en ciclos cortos (≤4 semanas); no existe margen de seguridad renal conocido en humanos.',
        'Unapproved use — ~1–2 mg SC daily in short cycles (≤4 weeks) is reported; no known renal safety margin in humans.',
      ),
      frequency: t('1×/día (uso no aprobado)', 'Once daily (unapproved use)'),
    },
    reconstitution: t(
      'Vial liofilizado de 5 mg + 2 mL de agua bacteriostática = 2,5 mg/mL. En jeringa U-100: 1 mg = 0,4 mL = 40 U. Uso en ≤2–3 semanas refrigerado.',
      '5 mg lyophilised vial + 2 mL bacteriostatic water = 2.5 mg/mL. U-100 syringe: 1 mg = 0.4 mL = 40 U. Use within ≤2–3 weeks refrigerated.',
    ),
    storage: t(
      'Liofilizado: −20 °C. Reconstituido: 2–8 °C, proteger de la luz, no congelar.',
      'Lyophilisate: −20 °C. Reconstituted: 2–8 °C, protect from light, do not freeze.',
    ),
    adverseEffects: {
      common: [
        t(
          'Deshidratación, disminución de apetito, fatiga (primates)',
          'Dehydration, reduced appetite, fatigue (primates)',
        ),
        t('Reacciones en el punto de inyección', 'Injection-site reactions'),
      ],
      serious: [
        t(
          'Nefrotoxicidad tubular proximal dosis-dependiente (elevación de creatinina, cilindros, alteraciones electrolíticas), reversible en primates tras suspender',
          'Dose-dependent proximal tubular nephrotoxicity (raised creatinine, casts, electrolyte disturbance), reversible in primates after stopping',
        ),
        t(
          'Riesgo de fracaso renal agudo en uso humano no supervisado',
          'Risk of acute kidney injury in unsupervised human use',
        ),
      ],
    },
    contraindications: [
      t('Cualquier grado de enfermedad renal crónica', 'Any degree of chronic kidney disease'),
      t('Uso de nefrotóxicos concomitantes', 'Concomitant nephrotoxic drugs'),
      t('Embarazo y lactancia', 'Pregnancy and lactation'),
    ],
    interactions: [
      t(
        'AINE, aminoglucósidos, contrastes yodados, IECA/ARA-II y diuréticos: potenciación del daño renal',
        'NSAIDs, aminoglycosides, iodinated contrast, ACE inhibitors/ARBs and diuretics: potentiation of kidney injury',
      ),
    ],
    monitoring: [
      t(
        'Creatinina, filtrado glomerular, sedimento y electrolitos (K, P, Mg) basales y frecuentes',
        'Creatinine, eGFR, urine sediment and electrolytes (K, P, Mg) at baseline and frequently',
      ),
      t('Estado de hidratación', 'Hydration status'),
    ],
    keyTrials: [
      {
        name: 'Kolonin et al. (ratones)',
        year: 2004,
        finding: t(
          'Direccionamiento a la vasculatura adiposa por prohibitina; regresión de grasa blanca y pérdida de peso en ratones obesos.',
          'Prohibitin-mediated targeting of adipose vasculature; white-fat regression and weight loss in obese mice.',
        ),
        ref: 'Nat Med 2004',
      },
      {
        name: 'Barnhart et al. (monos rhesus)',
        year: 2011,
        finding: t(
          'Pérdida de peso (~11% en 4 semanas en obesos) y mejor sensibilidad a la insulina, con toxicidad tubular renal dosis-dependiente y reversible.',
          'Weight loss (~11% over 4 weeks in obese animals) and improved insulin sensitivity, with dose-dependent, reversible renal tubular toxicity.',
        ),
        ref: 'Sci Transl Med 2011',
      },
    ],
    references: [
      {
        label:
          'Kolonin MG et al. Reversal of obesity by targeted ablation of adipose tissue. Nat Med 2004',
      },
      {
        label:
          'Barnhart KF et al. A peptidomimetic targeting white fat causes weight loss and improved insulin resistance in obese monkeys. Sci Transl Med 2011',
      },
    ],
    tags: ['obesidad', 'proapoptotico', 'nefrotoxico', 'abandonado', 'investigacion'],
    lastReviewed: '2026-09-19',
  },
  {
    id: 'tesofensine',
    names: {
      generic: 'Tesofensina',
      brands: [],
      aliases: ['NS2330', 'Tesomet (combinación con metoprolol)'],
    },
    category: 'metabolic',
    pharmClass: t(
      'Inhibidor triple de la recaptación de monoaminas (noradrenalina, dopamina, serotonina); NO es un péptido',
      'Triple monoamine (noradrenaline, dopamine, serotonin) reuptake inhibitor; NOT a peptide',
    ),
    summary: t(
      'Molécula pequeña oral desarrollada inicialmente para Parkinson y Alzheimer, donde se observó pérdida de peso. En fase 2 (TIPO-1) produjo pérdidas de peso de hasta ~11% sobre placebo a 24 semanas, con aumento de frecuencia cardiaca. Saniona completó un fase 3 en México con su socio Medix; su autorización por COFEPRIS se ha comunicado pero debe verificarse. No aprobada por FDA ni EMA.',
      'Oral small molecule initially developed for Parkinson’s and Alzheimer’s disease, where weight loss was observed. In phase 2 (TIPO-1) it produced placebo-subtracted weight loss of up to ~11% at 24 weeks, with increased heart rate. Saniona completed a phase 3 in Mexico with partner Medix; COFEPRIS authorisation has been reported but must be verified. Not approved by FDA or EMA.',
    ),
    mechanism: t(
      'Bloquea los transportadores NET, DAT y SERT, aumentando las monoaminas sinápticas en circuitos hipotalámicos y de recompensa: reduce el apetito y aumenta la saciedad, con posible aumento modesto del gasto energético. El tono simpático explica la taquicardia; en Tesomet se añade metoprolol para contrarrestarla.',
      'Blocks NET, DAT and SERT, raising synaptic monoamines in hypothalamic and reward circuits: reduces appetite and increases satiety, with a possible modest rise in energy expenditure. Sympathetic tone explains the tachycardia; Tesomet adds metoprolol to counter it.',
    ),
    indications: [
      t('Ninguna aprobada por FDA/EMA', 'None approved by FDA/EMA'),
      t(
        'Investigado: obesidad (fase 3 en México); posible autorización COFEPRIS (verificar)',
        'Investigated: obesity (phase 3 in Mexico); possible COFEPRIS authorisation (verify)',
      ),
      t(
        'Investigado (Tesomet): obesidad hipotalámica, síndrome de Prader-Willi (fase 2)',
        'Investigated (Tesomet): hypothalamic obesity, Prader-Willi syndrome (phase 2)',
      ),
    ],
    evidence: 'phase3',
    regulatory: {
      us: 'investigational',
      eu: 'investigational',
      notes: t(
        'México: Medix/Saniona comunicaron presentación y posterior autorización ante COFEPRIS; confirmar estado y ficha local antes de citarlo. En otros países circula como producto de mercado gris ("research chemical") de calidad no garantizada.',
        'Mexico: Medix/Saniona announced submission and subsequent authorisation by COFEPRIS; confirm status and local labelling before citing. Elsewhere it circulates as a grey-market "research chemical" of unverified quality.',
      ),
    },
    routes: ['oral'],
    defaultUnit: 'mg',
    pk: {
      halfLifeH: 220,
      source:
        'Datos de fase 1/2 (NeuroSearch) citados en Astrup A et al. Lancet 2008: t½ ≈ 9 días (~220 h)',
      notes:
        'Semivida muy larga: estado estacionario en ~6–7 semanas y persistencia de efectos adversos tras suspender. Verificar parámetros en la fuente primaria.',
    },
    dosing: {
      investigational: t(
        'TIPO-1: 0,25, 0,5 o 1 mg VO 1×/día durante 24 semanas; el fase 3 mexicano usó dosis de 0,25–0,5 mg/día.',
        'TIPO-1: 0.25, 0.5 or 1 mg PO once daily for 24 weeks; the Mexican phase 3 used 0.25–0.5 mg/day.',
      ),
      anecdotal: t(
        'Uso no aprobado — 0,25–0,5 mg VO/día (producto de mercado gris o importado de México).',
        'Unapproved use — 0.25–0.5 mg PO daily (grey-market product or imported from Mexico).',
      ),
      frequency: t('1×/día', 'Once daily'),
    },
    storage: t(
      'Comprimidos/cápsulas: temperatura ambiente (<25 °C), protegidos de la humedad.',
      'Tablets/capsules: room temperature (<25 °C), protected from moisture.',
    ),
    adverseEffects: {
      common: [
        t(
          'Sequedad de boca, insomnio, náuseas, estreñimiento o diarrea',
          'Dry mouth, insomnia, nausea, constipation or diarrhoea',
        ),
        t(
          'Aumento de frecuencia cardiaca (~7–8 lpm con 0,5 mg en TIPO-1)',
          'Increased heart rate (~7–8 bpm at 0.5 mg in TIPO-1)',
        ),
        t('Ansiedad, irritabilidad, alteraciones del ánimo', 'Anxiety, irritability, mood changes'),
      ],
      serious: [
        t(
          'Elevación de la tensión arterial y taquiarritmias; relevancia cardiovascular a largo plazo desconocida',
          'Blood-pressure elevation and tachyarrhythmias; long-term cardiovascular relevance unknown',
        ),
        t(
          'Síntomas psiquiátricos (depresión, agitación); potencial de abuso teórico por acción dopaminérgica',
          'Psychiatric symptoms (depression, agitation); theoretical abuse potential from dopaminergic action',
        ),
      ],
    },
    contraindications: [
      t(
        'Hipertensión no controlada, cardiopatía isquémica, arritmias, insuficiencia cardiaca',
        'Uncontrolled hypertension, ischaemic heart disease, arrhythmias, heart failure',
      ),
      t('Uso de IMAO en los 14 días previos', 'MAOI use within the previous 14 days'),
      t(
        'Trastorno psiquiátrico grave, trastorno bipolar, historia de abuso de sustancias',
        'Severe psychiatric disorder, bipolar disorder, history of substance abuse',
      ),
      t('Embarazo y lactancia', 'Pregnancy and lactation'),
    ],
    interactions: [
      t(
        'IMAO: riesgo de crisis hipertensiva y síndrome serotoninérgico',
        'MAOIs: risk of hypertensive crisis and serotonin syndrome',
      ),
      t(
        'ISRS, IRSN, triptanes, tramadol, linezolid: riesgo serotoninérgico',
        'SSRIs, SNRIs, triptans, tramadol, linezolid: serotonergic risk',
      ),
      t(
        'Simpaticomiméticos, estimulantes, bupropión, fentermina: efecto aditivo sobre FC/TA',
        'Sympathomimetics, stimulants, bupropion, phentermine: additive HR/BP effect',
      ),
      t(
        'Metabolismo hepático (probablemente CYP3A4): precaución con inhibidores/inductores potentes (verificar)',
        'Hepatic metabolism (probably CYP3A4): caution with strong inhibitors/inducers (verify)',
      ),
    ],
    monitoring: [
      t(
        'Tensión arterial y frecuencia cardiaca basales y periódicas',
        'Blood pressure and heart rate at baseline and periodically',
      ),
      t('Ánimo, sueño y ansiedad', 'Mood, sleep and anxiety'),
      t('Peso y perímetro de cintura', 'Weight and waist circumference'),
    ],
    keyTrials: [
      {
        name: 'TIPO-1',
        year: 2008,
        finding: t(
          'Fase 2, 24 semanas: pérdida de peso de 6,7%, 11,3% y 12,8% con 0,25, 0,5 y 1 mg vs 2,0% con placebo; aumento de FC con dosis altas.',
          'Phase 2, 24 weeks: weight loss of 6.7%, 11.3% and 12.8% with 0.25, 0.5 and 1 mg vs 2.0% with placebo; heart-rate increase at higher doses.',
        ),
        ref: 'Lancet 2008',
      },
    ],
    references: [
      {
        label:
          'Astrup A et al. Effect of tesofensine on bodyweight loss, body composition, and quality of life in obese patients: a randomised, double-blind, placebo-controlled trial. Lancet 2008',
      },
      {
        label:
          'Saniona AB — comunicados sobre el fase 3 en México y la presentación ante COFEPRIS (Medix)',
      },
    ],
    tags: ['no-peptido', 'obesidad', 'oral', 'monoaminas', 'investigacional'],
    lastReviewed: '2026-09-19',
  },

  // ───────────────────────────── SEXUAL ─────────────────────────────
  {
    id: 'pt-141',
    names: { generic: 'Bremelanotida', brands: ['Vyleesi'], aliases: ['PT-141', 'Bremelanotide'] },
    category: 'sexual',
    pharmClass: t(
      'Agonista no selectivo de receptores de melanocortinas (principalmente MC4R)',
      'Non-selective melanocortin receptor agonist (mainly MC4R)',
    ),
    summary: t(
      'Heptapéptido cíclico (metabolito/derivado de melanotan II) aprobado por la FDA en 2019 como Vyleesi para el trastorno del deseo sexual hipoactivo (HSDD) adquirido y generalizado en mujeres premenopáusicas. Se administra a demanda, SC, ≥45 min antes de la actividad sexual. Beneficio modesto en deseo y malestar asociado (RECONNECT).',
      'Cyclic heptapeptide (metabolite/derivative of melanotan II) FDA-approved in 2019 as Vyleesi for acquired, generalised hypoactive sexual desire disorder (HSDD) in premenopausal women. Given on demand, SC, ≥45 min before sexual activity. Modest benefit on desire and related distress (RECONNECT).',
    ),
    mechanism: t(
      'Activa MC4R (y MC3R) en el hipotálamo y circuitos mesolímbicos, modulando vías dopaminérgicas implicadas en la motivación sexual. La actividad sobre MC1R explica la hiperpigmentación focal. No actúa sobre la vasculatura genital como los iPDE5.',
      'Activates MC4R (and MC3R) in hypothalamic and mesolimbic circuits, modulating dopaminergic pathways involved in sexual motivation. MC1R activity explains focal hyperpigmentation. It does not act on genital vasculature like PDE5 inhibitors.',
    ),
    indications: [
      t(
        'HSDD adquirido y generalizado en mujeres premenopáusicas, no debido a enfermedad, fármacos o problemas de pareja (Vyleesi)',
        'Acquired, generalised HSDD in premenopausal women, not due to illness, drugs or relationship problems (Vyleesi)',
      ),
      t(
        'Investigado: disfunción eréctil y disfunción sexual en varones (fase 2, formulación intranasal abandonada por elevación de TA)',
        'Investigated: erectile dysfunction and male sexual dysfunction (phase 2; intranasal formulation abandoned due to BP rise)',
      ),
    ],
    evidence: 'fda_approved',
    regulatory: {
      us: 'approved',
      notes: t(
        'Aprobado en EE. UU. (2019); no autorizado por la EMA. Uso en varones y mujeres posmenopáusicas fuera de ficha. Los viales de "PT-141" de mercado gris no equivalen al producto registrado.',
        'Approved in the US (2019); not authorised by the EMA. Use in men and postmenopausal women is off-label. Grey-market "PT-141" vials are not equivalent to the registered product.',
      ),
    },
    routes: ['sc'],
    defaultUnit: 'mg',
    pk: {
      halfLifeH: 2.7,
      tmaxH: 1,
      bioavailability: 1,
      apparentVolumeL: 25,
      molarMassGPerMol: 1025.2,
      source:
        'Vyleesi US label §12.3: t½ 2,7 h (1,9–4,0), tmax mediana 1,0 h (0,5–1,0), F SC ~100%, Vd ≈ 25 L',
      notes: 'Dosificación a demanda; no se acumula con el límite de 1 dosis/24 h.',
    },
    dosing: {
      labeled: t(
        'Vyleesi: 1,75 mg SC (autoinyector, abdomen o muslo) ≥45 min antes de la actividad sexual prevista. Máx. 1 dosis/24 h y 8 dosis/mes. Suspender si no hay mejoría tras 8 semanas.',
        'Vyleesi: 1.75 mg SC (autoinjector, abdomen or thigh) ≥45 min before anticipated sexual activity. Max 1 dose/24 h and 8 doses/month. Discontinue if no improvement after 8 weeks.',
      ),
      investigational: t(
        'Fase 2b: 0,75, 1,25 y 1,75 mg SC a demanda; 1,75 mg fue la dosis seleccionada para fase 3.',
        'Phase 2b: 0.75, 1.25 and 1.75 mg SC on demand; 1.75 mg was selected for phase 3.',
      ),
      anecdotal: t(
        'Uso no aprobado — en varones, 1–2 mg SC a demanda con viales de mercado gris; mayor riesgo de náuseas y elevación de TA con dosis altas.',
        'Unapproved use — in men, 1–2 mg SC on demand from grey-market vials; higher risk of nausea and BP rise at higher doses.',
      ),
      frequency: t('A demanda (máx. 1/24 h, 8/mes)', 'On demand (max 1/24 h, 8/month)'),
    },
    reconstitution: t(
      'Vyleesi: autoinyector precargado, no requiere reconstitución. Viales de investigación: 10 mg liofilizados + 2 mL de agua bacteriostática = 5 mg/mL; en jeringa U-100, 1,75 mg = 0,35 mL = 35 U.',
      'Vyleesi: prefilled autoinjector, no reconstitution. Research vials: 10 mg lyophilised + 2 mL bacteriostatic water = 5 mg/mL; U-100 syringe, 1.75 mg = 0.35 mL = 35 U.',
    ),
    storage: t(
      'Vyleesi: a ≤25 °C, no congelar, proteger de la luz. Viales liofilizados: −20 °C; reconstituidos 2–8 °C.',
      'Vyleesi: at ≤25 °C, do not freeze, protect from light. Lyophilised vials: −20 °C; reconstituted 2–8 °C.',
    ),
    adverseEffects: {
      common: [
        t(
          'Náuseas (~40%; ~13% requirió antiemético), vómitos (~5%)',
          'Nausea (~40%; ~13% needed an antiemetic), vomiting (~5%)',
        ),
        t('Rubor (~20%), cefalea (~11%)', 'Flushing (~20%), headache (~11%)'),
        t('Reacciones en el punto de inyección (~13%)', 'Injection-site reactions (~13%)'),
      ],
      serious: [
        t(
          'Elevación transitoria de la TA (~6 mmHg sistólica, ~3 mmHg diastólica) y descenso de FC, con resolución en ≤12 h',
          'Transient BP rise (~6 mmHg systolic, ~3 mmHg diastolic) and HR decrease, resolving within ≤12 h',
        ),
        t(
          'Hiperpigmentación focal (cara, encías, mamas; ~1%, más con >8 dosis/mes y fototipos oscuros); puede no revertir',
          'Focal hyperpigmentation (face, gums, breasts; ~1%, more with >8 doses/month and darker skin); may not resolve',
        ),
      ],
    },
    contraindications: [
      t('Hipertensión no controlada', 'Uncontrolled hypertension'),
      t('Enfermedad cardiovascular conocida', 'Known cardiovascular disease'),
      t('Embarazo (suspender si se produce)', 'Pregnancy (discontinue if it occurs)'),
    ],
    interactions: [
      t(
        'Naltrexona oral: la bremelanotida reduce de forma marcada su exposición; evitar en tratamiento de dependencia',
        'Oral naltrexone: bremelanotide markedly reduces its exposure; avoid in addiction treatment',
      ),
      t(
        'Retrasa el vaciamiento gástrico: puede reducir la absorción de fármacos orales dependientes de concentración umbral (p. ej. antibióticos, indometacina)',
        'Delays gastric emptying: may reduce absorption of oral drugs needing threshold concentrations (e.g. antibiotics, indomethacin)',
      ),
    ],
    monitoring: [
      t(
        'Tensión arterial basal y en las primeras dosis',
        'Blood pressure at baseline and with the first doses',
      ),
      t('Piel y encías (hiperpigmentación)', 'Skin and gums (hyperpigmentation)'),
      t('Respuesta a 8 semanas (deseo, malestar)', 'Response at 8 weeks (desire, distress)'),
    ],
    keyTrials: [
      {
        name: 'RECONNECT (estudios 301 y 302)',
        year: 2019,
        finding: t(
          'Dos fases 3 de 24 semanas en HSDD premenopáusico: mejoría pequeña pero significativa del dominio de deseo (FSFI) y del malestar (FSDS-DAO) vs placebo; sin diferencia en eventos sexuales satisfactorios.',
          'Two 24-week phase 3 trials in premenopausal HSDD: small but significant improvement in desire (FSFI) and distress (FSDS-DAO) vs placebo; no difference in satisfying sexual events.',
        ),
        ref: 'Obstet Gynecol 2019',
      },
      {
        name: 'Clayton et al. (fase 2b)',
        year: 2016,
        finding: t(
          'Búsqueda de dosis en disfunción sexual femenina premenopáusica; 1,75 mg SC mostró el mejor balance eficacia/tolerabilidad.',
          'Dose-finding in premenopausal female sexual dysfunction; 1.75 mg SC showed the best efficacy/tolerability balance.',
        ),
        ref: "Women's Health 2016",
      },
    ],
    references: [
      { label: 'Vyleesi (bremelanotide) US Prescribing Information' },
      {
        label:
          'Kingsberg SA et al. Bremelanotide for the treatment of hypoactive sexual desire disorder: two randomized phase 3 trials. Obstet Gynecol 2019',
      },
    ],
    tags: ['melanocortina', 'deseo-sexual', 'hsdd', 'aprobado', 'a-demanda'],
    lastReviewed: '2026-09-19',
  },
  {
    id: 'melanotan-i',
    names: {
      generic: 'Afamelanotida',
      brands: ['Scenesse'],
      aliases: ['Melanotan I', 'MT-I', 'CUV1647', '[Nle4, D-Phe7]-α-MSH', 'NDP-MSH'],
    },
    category: 'sexual',
    pharmClass: t('Análogo de α-MSH, agonista del receptor MC1R', 'α-MSH analogue, MC1R agonist'),
    summary: t(
      'Análogo lineal de α-MSH que estimula la eumelanogénesis y la fotoprotección. Aprobado como implante SC de 16 mg (Scenesse) para aumentar la tolerancia a la luz en la protoporfiria eritropoyética (EMA 2014, FDA 2019). Los viales de "Melanotan I" para bronceado son de mercado gris y no equivalen al implante.',
      'Linear α-MSH analogue that stimulates eumelanogenesis and photoprotection. Approved as a 16 mg SC implant (Scenesse) to increase light tolerance in erythropoietic protoporphyria (EMA 2014, FDA 2019). "Melanotan I" tanning vials are grey-market and not equivalent to the implant.',
    ),
    mechanism: t(
      'Agonista potente y más estable que α-MSH en MC1R de melanocitos: aumenta la síntesis de eumelanina con independencia de la radiación UV, además de efectos antioxidantes y de reparación del ADN. Mucho más selectivo por MC1R que melanotan II, con escaso efecto sobre la función sexual.',
      'Potent MC1R agonist on melanocytes, more stable than α-MSH: increases eumelanin synthesis independently of UV exposure, with antioxidant and DNA-repair effects. Far more MC1R-selective than melanotan II, with little effect on sexual function.',
    ),
    indications: [
      t(
        'Protoporfiria eritropoyética en adultos: prevención de fototoxicidad (Scenesse)',
        'Erythropoietic protoporphyria in adults: prevention of phototoxicity (Scenesse)',
      ),
      t(
        'Investigado: vitíligo (con fototerapia NB-UVB), otras fotodermatosis',
        'Investigated: vitiligo (with NB-UVB phototherapy), other photodermatoses',
      ),
    ],
    evidence: 'fda_approved',
    regulatory: {
      us: 'approved',
      eu: 'approved',
      notes: t(
        'EMA 2014 (circunstancias excepcionales) y FDA 2019; implante administrado solo por profesionales formados en centros acreditados. El uso cosmético de viales "Melanotan I" no está autorizado.',
        'EMA 2014 (exceptional circumstances) and FDA 2019; implant inserted only by trained professionals at accredited centres. Cosmetic use of "Melanotan I" vials is not authorised.',
      ),
    },
    routes: ['sc'],
    defaultUnit: 'mg',
    dosing: {
      labeled: t(
        'Scenesse: un implante de 16 mg SC (sobre la cresta ilíaca anterosuperior) cada 2 meses durante los periodos de exposición solar. En la UE, la ficha limita el número de implantes anuales (consultar SmPC).',
        'Scenesse: one 16 mg SC implant (above the anterior superior iliac crest) every 2 months during periods of sun exposure. In the EU the SmPC limits the number of implants per year (consult SmPC).',
      ),
      anecdotal: t(
        'Uso no aprobado — viales de "Melanotan I" para bronceado, dosis SC diarias o semanales sin rangos fiables; mismos riesgos pigmentarios sin control de calidad.',
        'Unapproved use — "Melanotan I" tanning vials, daily or weekly SC doses without reliable ranges; same pigmentary risks without quality control.',
      ),
      frequency: t('Cada 2 meses (implante)', 'Every 2 months (implant)'),
    },
    reconstitution: t(
      'Scenesse: implante sólido biodegradable, sin reconstitución. Viales de investigación: 10 mg liofilizados + 2 mL de agua bacteriostática = 5 mg/mL; en jeringa U-100, 1 mg = 0,2 mL = 20 U.',
      'Scenesse: solid biodegradable implant, no reconstitution. Research vials: 10 mg lyophilised + 2 mL bacteriostatic water = 5 mg/mL; U-100 syringe, 1 mg = 0.2 mL = 20 U.',
    ),
    storage: t(
      'Scenesse: nevera 2–8 °C en su envase, proteger de la luz. Viales liofilizados: −20 °C; reconstituidos 2–8 °C.',
      'Scenesse: refrigerate 2–8 °C in original package, protect from light. Lyophilised vials: −20 °C; reconstituted 2–8 °C.',
    ),
    adverseEffects: {
      common: [
        t(
          'Reacciones en el lugar del implante (dolor, hematoma, cambio de color)',
          'Implant-site reactions (pain, bruising, discolouration)',
        ),
        t(
          'Náuseas, cefalea, nasofaringitis, dolor lumbar',
          'Nausea, headache, nasopharyngitis, back pain',
        ),
        t(
          'Hiperpigmentación cutánea generalizada, oscurecimiento de nevus y pecas',
          'Generalised skin hyperpigmentation, darkening of naevi and freckles',
        ),
      ],
      serious: [
        t(
          'Cambios en lesiones melanocíticas que pueden dificultar la vigilancia del melanoma',
          'Changes in melanocytic lesions that may hamper melanoma surveillance',
        ),
      ],
    },
    contraindications: [
      t(
        'Hepatopatía grave e insuficiencia renal/hepática (según ficha)',
        'Severe liver disease and renal/hepatic impairment (per label)',
      ),
      t('Hipersensibilidad a afamelanotida', 'Hypersensitivity to afamelanotide'),
      t('Embarazo y lactancia: datos insuficientes', 'Pregnancy and lactation: insufficient data'),
    ],
    interactions: [
      t(
        'Sin interacciones farmacocinéticas relevantes conocidas; mantener fotoprotección',
        'No known relevant pharmacokinetic interactions; maintain photoprotection',
      ),
    ],
    monitoring: [
      t(
        'Exploración cutánea completa 2×/año (nevus, lesiones pigmentadas)',
        'Full-body skin examination twice yearly (naevi, pigmented lesions)',
      ),
      t(
        'Tiempo tolerado de exposición a la luz sin dolor',
        'Pain-free tolerated light-exposure time',
      ),
    ],
    keyTrials: [
      {
        name: 'Langendonk et al. (EPP, EE. UU. y UE)',
        year: 2015,
        finding: t(
          'Dos ensayos aleatorizados: más horas de exposición solar sin dolor, menos episodios fototóxicos y mejor calidad de vida vs placebo.',
          'Two randomised trials: more pain-free hours of sun exposure, fewer phototoxic episodes and better quality of life vs placebo.',
        ),
        ref: 'NEJM 2015',
      },
    ],
    references: [
      { label: 'Scenesse (afamelanotide) US Prescribing Information (Clinuvel), 2019' },
      {
        label: 'EMA EPAR Scenesse',
        url: 'https://www.ema.europa.eu/en/medicines/human/EPAR/scenesse',
      },
      { label: 'Langendonk JG et al. Afamelanotide for erythropoietic protoporphyria. NEJM 2015' },
    ],
    tags: ['melanocortina', 'mc1r', 'fotoproteccion', 'porfiria', 'implante', 'aprobado'],
    lastReviewed: '2026-09-19',
  },
  {
    id: 'melanotan-ii',
    names: {
      generic: 'Melanotan II',
      brands: [],
      aliases: ['MT-II', 'MT2', 'Ac-Nle-c[Asp-His-D-Phe-Arg-Trp-Lys]-NH2'],
    },
    category: 'sexual',
    pharmClass: t(
      'Análogo cíclico de α-MSH, agonista no selectivo de melanocortinas (MC1R, MC3R, MC4R, MC5R)',
      'Cyclic α-MSH analogue, non-selective melanocortin agonist (MC1R, MC3R, MC4R, MC5R)',
    ),
    summary: t(
      'Lactama cíclica desarrollada en la Universidad de Arizona (años 90) como agente de bronceado; en estudios piloto produjo erecciones espontáneas, lo que originó la bremelanotida. Nunca se aprobó; se vende ilegalmente para bronceado, libido y pérdida de apetito. Riesgos pigmentarios (nevus nuevos, casos de melanoma) y priapismo.',
      'Cyclic lactam developed at the University of Arizona (1990s) as a tanning agent; in pilot studies it produced spontaneous erections, which led to bremelanotide. Never approved; sold illegally for tanning, libido and appetite suppression. Pigmentary risks (new naevi, melanoma cases) and priapism.',
    ),
    mechanism: t(
      'MC1R: estimula la eumelanogénesis (bronceado sin UV). MC4R/MC3R centrales: aumenta la excitación sexual y la erección por vías oxitocinérgicas espinales y reduce la ingesta. Sus efectos simpáticos y eméticos derivan de la activación central amplia.',
      'MC1R: stimulates eumelanogenesis (UV-independent tanning). Central MC4R/MC3R: enhances sexual arousal and erection via spinal oxytocinergic pathways and reduces food intake. Sympathetic and emetic effects stem from broad central activation.',
    ),
    indications: [
      t('Ninguna aprobada', 'None approved'),
      t(
        'Históricamente investigado: bronceado/fotoprotección, disfunción eréctil psicógena (estudios piloto)',
        'Historically investigated: tanning/photoprotection, psychogenic erectile dysfunction (pilot studies)',
      ),
    ],
    evidence: 'anecdotal',
    regulatory: {
      us: 'research_only',
      eu: 'research_only',
      notes: t(
        'Sin autorización en ninguna jurisdicción; múltiples alertas de agencias (FDA, MHRA, AEMPS, TGA, entre otras) sobre su venta en línea. Existen solo ensayos piloto pequeños de los años 90, sin desarrollo posterior; la evidencia de uso actual es comunitaria.',
        'Not authorised anywhere; multiple agency warnings (FDA, MHRA, AEMPS, TGA, among others) about online sales. Only small 1990s pilot trials exist, without further development; current-use evidence is community-based.',
      ),
    },
    routes: ['sc', 'nasal'],
    defaultUnit: 'mg',
    dosing: {
      investigational: t(
        'Estudios piloto (1996–2000): ~0,01–0,025 mg/kg SC en dosis únicas o en días alternos.',
        'Pilot studies (1996–2000): ~0.01–0.025 mg/kg SC as single doses or on alternate days.',
      ),
      anecdotal: t(
        'Uso no aprobado — "carga" de 0,25–0,5 mg SC/día hasta pigmentación, luego 0,5–1 mg 1–2×/semana; también aerosoles nasales de concentración desconocida.',
        'Unapproved use — "loading" 0.25–0.5 mg SC daily until pigmented, then 0.5–1 mg 1–2×/week; also nasal sprays of unknown concentration.',
      ),
      frequency: t(
        'Diaria (carga) → 1–2×/semana (uso no aprobado)',
        'Daily (loading) → 1–2×/week (unapproved use)',
      ),
    },
    reconstitution: t(
      'Vial liofilizado de 10 mg + 2 mL de agua bacteriostática = 5 mg/mL. En jeringa U-100: 0,25 mg = 0,05 mL = 5 U; 0,5 mg = 10 U. Reconstituido: nevera, uso en 3–4 semanas.',
      '10 mg lyophilised vial + 2 mL bacteriostatic water = 5 mg/mL. U-100 syringe: 0.25 mg = 0.05 mL = 5 U; 0.5 mg = 10 U. Reconstituted: refrigerate, use within 3–4 weeks.',
    ),
    storage: t(
      'Liofilizado: −20 °C (2–8 °C a corto plazo). Reconstituido: 2–8 °C, proteger de la luz.',
      'Lyophilisate: −20 °C (2–8 °C short term). Reconstituted: 2–8 °C, protect from light.',
    ),
    adverseEffects: {
      common: [
        t(
          'Náuseas y vómitos (muy frecuentes, sobre todo al inicio)',
          'Nausea and vomiting (very common, especially at start)',
        ),
        t(
          'Rubor facial, bostezos, somnolencia, disminución del apetito',
          'Facial flushing, yawning, drowsiness, reduced appetite',
        ),
        t('Erecciones espontáneas', 'Spontaneous erections'),
        t(
          'Oscurecimiento cutáneo, de pecas y de nevus existentes; nevus nuevos',
          'Darkening of skin, freckles and existing naevi; new naevi',
        ),
      ],
      serious: [
        t('Priapismo', 'Priapism'),
        t(
          'Nevus eruptivos/atípicos y casos publicados de melanoma en usuarios (causalidad no establecida)',
          'Eruptive/atypical naevi and published melanoma cases in users (causality not established)',
        ),
        t(
          'Casos aislados de rabdomiólisis, infarto renal y síndrome simpaticomimético',
          'Isolated cases of rhabdomyolysis, renal infarction and sympathomimetic syndrome',
        ),
        t(
          'Contaminación y dosificación errónea de productos ilícitos',
          'Contamination and misdosing of illicit products',
        ),
      ],
    },
    contraindications: [
      t(
        'Antecedente personal o familiar de melanoma, síndrome de nevus displásicos',
        'Personal or family history of melanoma, dysplastic naevus syndrome',
      ),
      t(
        'Enfermedad cardiovascular o hipertensión no controlada',
        'Cardiovascular disease or uncontrolled hypertension',
      ),
      t('Embarazo y lactancia', 'Pregnancy and lactation'),
    ],
    interactions: [
      t(
        'iPDE5 (sildenafilo, tadalafilo): mayor riesgo de priapismo',
        'PDE5 inhibitors (sildenafil, tadalafil): increased priapism risk',
      ),
      t('Bremelanotida: duplicación del mecanismo', 'Bremelanotide: mechanism duplication'),
      t(
        'Naltrexona oral: interacción teórica por analogía con bremelanotida',
        'Oral naltrexone: theoretical interaction by analogy with bremelanotide',
      ),
    ],
    monitoring: [
      t(
        'Exploración dermatológica con dermatoscopia basal y periódica',
        'Dermatological examination with dermoscopy at baseline and periodically',
      ),
      t('Tensión arterial', 'Blood pressure'),
    ],
    keyTrials: [
      {
        name: 'Wessells et al. (disfunción eréctil psicógena)',
        year: 1998,
        finding: t(
          'Cruzado doble ciego en pocos varones: erecciones en la mayoría tras MT-II SC; náuseas y bostezos frecuentes.',
          'Small double-blind crossover in men: erections in most after SC MT-II; nausea and yawning common.',
        ),
        ref: 'J Urol 1998',
      },
    ],
    references: [
      {
        label:
          'Dorr RT et al. Evaluation of melanotan-II, a superpotent cyclic melanotropic peptide, in a pilot phase-I clinical study. Life Sci 1996',
      },
      {
        label:
          'Wessells H et al. Synthetic melanotropic peptide initiates erections in men with psychogenic erectile dysfunction. J Urol 1998',
      },
      {
        label:
          'Revisiones y series de casos dermatológicos sobre nevus eruptivos y melanoma tras uso de melanotan (2009–2020)',
      },
    ],
    tags: ['melanocortina', 'bronceado', 'libido', 'mercado-gris', 'riesgo-melanoma'],
    lastReviewed: '2026-09-19',
  },
  {
    id: 'kisspeptin-10',
    names: {
      generic: 'Kisspeptina-10',
      brands: [],
      aliases: ['Kisspeptin-10', 'KP-10', 'Metastina 45-54'],
    },
    category: 'sexual',
    pharmClass: t(
      'Agonista del receptor KISS1R (GPR54); regulador del eje hipotálamo-hipófiso-gonadal',
      'KISS1R (GPR54) agonist; hypothalamic-pituitary-gonadal axis regulator',
    ),
    summary: t(
      'Decapéptido C-terminal de la kisspeptina, el principal estímulo fisiológico de las neuronas GnRH. En estudios fisiológicos humanos (bolos o perfusiones IV) eleva LH y testosterona en varones; la kisspeptina-54 y análogos (MVT-602) se han investigado en inducción de maduración ovocitaria en FIV. Sin indicación aprobada.',
      'C-terminal decapeptide of kisspeptin, the main physiological stimulus of GnRH neurons. In human physiology studies (IV boluses or infusions) it raises LH and testosterone in men; kisspeptin-54 and analogues (MVT-602) have been investigated for triggering oocyte maturation in IVF. No approved indication.',
    ),
    mechanism: t(
      'Se une a KISS1R en neuronas GnRH, induciendo liberación pulsátil de GnRH y secundariamente de LH y FSH. La exposición continua puede desensibilizar el receptor (taquifilaxia), a diferencia de la administración intermitente. Papel central en pubertad, fertilidad y modulación límbica de la conducta sexual.',
      'Binds KISS1R on GnRH neurons, inducing pulsatile GnRH and secondarily LH and FSH release. Continuous exposure can desensitise the receptor (tachyphylaxis), unlike intermittent dosing. Central role in puberty, fertility and limbic modulation of sexual behaviour.',
    ),
    indications: [
      t('Ninguna aprobada', 'None approved'),
      t(
        'Investigado (herramienta diagnóstica/fisiológica): hipogonadismo hipogonadotrópico, amenorrea hipotalámica, pubertad retrasada',
        'Investigated (diagnostic/physiological tool): hypogonadotropic hypogonadism, hypothalamic amenorrhoea, delayed puberty',
      ),
      t(
        'Investigado (kisspeptina-54, análogos): desencadenante de maduración ovocitaria en FIV con menor riesgo de SHO',
        'Investigated (kisspeptin-54, analogues): oocyte-maturation trigger in IVF with lower OHSS risk',
      ),
    ],
    evidence: 'phase1',
    regulatory: {
      us: 'investigational',
      notes: t(
        'Uso en investigación clínica académica bajo protocolos aprobados; fuera de ese contexto se vende como "research chemical" (p. ej. para "reactivar" el eje tras esteroides anabolizantes), sin datos que lo respalden.',
        'Used in academic clinical research under approved protocols; outside that context it is sold as a "research chemical" (e.g. to "restart" the axis after anabolic steroids), with no supporting data.',
      ),
    },
    routes: ['iv', 'sc'],
    defaultUnit: 'mcg',
    dosing: {
      investigational: t(
        'Estudios fisiológicos en varones: bolos IV de ~0,01–3 µg/kg y perfusiones continuas en el rango de µg/kg/h; respuesta de LH en minutos.',
        'Physiology studies in men: IV boluses of ~0.01–3 µg/kg and continuous infusions in the µg/kg/h range; LH response within minutes.',
      ),
      anecdotal: t(
        'Uso no aprobado — decenas a cientos de mcg SC, 1–2×/día o en días alternos; sin datos de eficacia y con riesgo de desensibilización.',
        'Unapproved use — tens to hundreds of mcg SC, once or twice daily or on alternate days; no efficacy data and a risk of desensitisation.',
      ),
      frequency: t('Variable (uso no aprobado)', 'Variable (unapproved use)'),
    },
    reconstitution: t(
      'Vial liofilizado de 5 mg + 2 mL de agua bacteriostática = 2,5 mg/mL (2500 mcg/mL). En jeringa U-100: 100 mcg = 0,04 mL = 4 U; 250 mcg = 10 U. Para dosis de pocos mcg conviene mayor dilución.',
      '5 mg lyophilised vial + 2 mL bacteriostatic water = 2.5 mg/mL (2500 mcg/mL). U-100 syringe: 100 mcg = 0.04 mL = 4 U; 250 mcg = 10 U. For single-digit mcg doses a greater dilution is advisable.',
    ),
    storage: t(
      'Liofilizado: −20 °C. Reconstituido: 2–8 °C, uso en ≤2–3 semanas, no congelar.',
      'Lyophilisate: −20 °C. Reconstituted: 2–8 °C, use within ≤2–3 weeks, do not freeze.',
    ),
    adverseEffects: {
      common: [
        t(
          'Bien tolerada en estudios agudos; rubor leve, cefalea ocasional',
          'Well tolerated in acute studies; mild flushing, occasional headache',
        ),
        t('Reacciones en el punto de inyección', 'Injection-site reactions'),
      ],
      serious: [
        t(
          'Desensibilización del eje con exposición continua (supresión paradójica de LH)',
          'Axis desensitisation with continuous exposure (paradoxical LH suppression)',
        ),
        t(
          'Seguridad con uso repetido prolongado no establecida',
          'Safety with prolonged repeated use not established',
        ),
      ],
    },
    contraindications: [
      t('Embarazo', 'Pregnancy'),
      t(
        'Tumores hormonodependientes (próstata, mama)',
        'Hormone-dependent tumours (prostate, breast)',
      ),
    ],
    interactions: [
      t(
        'Agonistas/antagonistas de GnRH, testosterona exógena y esteroides anabolizantes: modifican o anulan la respuesta del eje',
        'GnRH agonists/antagonists, exogenous testosterone and anabolic steroids: alter or abolish axis response',
      ),
    ],
    monitoring: [t('LH, FSH, testosterona o estradiol', 'LH, FSH, testosterone or oestradiol')],
    keyTrials: [
      {
        name: 'George et al. (varones sanos)',
        year: 2011,
        finding: t(
          'La kisspeptina-10 IV elevó LH de forma dosis-dependiente y aumentó la frecuencia de pulsos de LH y la testosterona.',
          'IV kisspeptin-10 raised LH dose-dependently and increased LH pulse frequency and testosterone.',
        ),
        ref: 'J Clin Endocrinol Metab 2011',
      },
      {
        name: 'Jayasena et al. (FIV, kisspeptina-54)',
        year: 2014,
        finding: t(
          'Una dosis única de kisspeptina-54 desencadenó la maduración ovocitaria en FIV (compuesto distinto de KP-10).',
          'A single kisspeptin-54 dose triggered oocyte maturation in IVF (a different compound from KP-10).',
        ),
        ref: 'J Clin Invest 2014',
      },
    ],
    references: [
      {
        label:
          'George JT et al. Kisspeptin-10 is a potent stimulator of LH and increases pulse frequency in men. J Clin Endocrinol Metab 2011',
      },
      {
        label:
          'Dhillo WS et al. Kisspeptin-54 stimulates the hypothalamic-pituitary gonadal axis in human males. J Clin Endocrinol Metab 2005',
      },
    ],
    tags: ['kisspeptina', 'eje-gonadal', 'lh', 'fertilidad', 'investigacion'],
    lastReviewed: '2026-09-19',
  },
  {
    id: 'oxytocin',
    names: { generic: 'Oxitocina', brands: ['Pitocin', 'Syntocinon'], aliases: ['Oxytocin', 'OT'] },
    category: 'sexual',
    pharmClass: t(
      'Hormona neurohipofisaria (nonapéptido), agonista del receptor de oxitocina',
      'Neurohypophyseal hormone (nonapeptide), oxytocin receptor agonist',
    ),
    summary: t(
      'Nonapéptido hipotalámico aprobado por vía IV/IM para inducción y estimulación del parto y para la hemorragia posparto. El uso intranasal para conducta social, autismo, libido u obesidad es fuera de ficha y los ensayos grandes (p. ej. en autismo) han sido negativos. Semivida IV de pocos minutos.',
      'Hypothalamic nonapeptide approved IV/IM for labour induction and augmentation and for postpartum haemorrhage. Intranasal use for social behaviour, autism, libido or obesity is off-label and large trials (e.g. in autism) have been negative. IV half-life of a few minutes.',
    ),
    mechanism: t(
      'Activa el receptor de oxitocina (acoplado a Gq) en miometrio (contracción), células mioepiteliales mamarias (eyección láctea) y circuitos centrales (amígdala, núcleo accumbens) relacionados con vínculo, orgasmo y saciedad. Tiene cierta actividad sobre receptores de vasopresina (efecto antidiurético a dosis altas).',
      'Activates the Gq-coupled oxytocin receptor in myometrium (contraction), mammary myoepithelial cells (milk ejection) and central circuits (amygdala, nucleus accumbens) involved in bonding, orgasm and satiety. Some vasopressin-receptor activity (antidiuretic effect at high doses).',
    ),
    indications: [
      t(
        'Inducción y estimulación del trabajo de parto con indicación médica (IV)',
        'Medically indicated labour induction and augmentation (IV)',
      ),
      t(
        'Hemorragia posparto / atonía uterina; tercera fase del parto (IV/IM)',
        'Postpartum haemorrhage / uterine atony; third stage of labour (IV/IM)',
      ),
      t(
        'Aborto incompleto o inevitable como coadyuvante',
        'Adjunct in incomplete or inevitable abortion',
      ),
      t(
        'Fuera de ficha (intranasal): autismo, ansiedad social, disfunción sexual, obesidad; evidencia débil o negativa',
        'Off-label (intranasal): autism, social anxiety, sexual dysfunction, obesity; weak or negative evidence',
      ),
    ],
    evidence: 'fda_approved',
    regulatory: {
      us: 'approved',
      eu: 'approved',
      notes: t(
        'Aprobada para uso obstétrico parenteral. La formulación intranasal (Syntocinon spray para la eyección láctea) se retiró en EE. UU. y en varios países europeos; los aerosoles actuales suelen ser de fórmula magistral. Pitocin lleva advertencia de no usar para inducción electiva.',
        'Approved for parenteral obstetric use. The intranasal formulation (Syntocinon spray for milk let-down) was withdrawn in the US and several European countries; current sprays are usually compounded. Pitocin carries a warning against elective induction.',
      ),
    },
    routes: ['iv', 'im', 'nasal'],
    defaultUnit: 'iu',
    pk: {
      halfLifeH: 0.075,
      source: 'Pitocin US label §12.3: t½ plasmática ≈ 1–6 min; datos clásicos IV 3–6 min',
      notes:
        'Uso IV en perfusión continua; el modelo en bolo no representa la práctica obstétrica. Datos intranasales con absorción variable y paso a SNC controvertido.',
      molarMassGPerMol: 1007.2,
    },
    dosing: {
      labeled: t(
        'Inducción (Pitocin): perfusión IV 0,5–1 mU/min, aumentando 1–2 mU/min cada 30–60 min hasta patrón contráctil adecuado (habitualmente ≤20 mU/min). Posparto: 10–40 UI en 1000 mL a la velocidad necesaria para controlar la atonía, o 10 UI IM tras la expulsión placentaria.',
        'Induction (Pitocin): IV infusion 0.5–1 mU/min, increased by 1–2 mU/min every 30–60 min until an adequate contraction pattern (usually ≤20 mU/min). Postpartum: 10–40 IU in 1000 mL at the rate needed to control atony, or 10 IU IM after placental delivery.',
      ),
      investigational: t(
        'Ensayos intranasales: habitualmente 24 UI (8–48 UI) por administración, 1–2×/día.',
        'Intranasal trials: typically 24 IU (8–48 IU) per administration, once or twice daily.',
      ),
      anecdotal: t(
        'Uso no aprobado — aerosoles magistrales de 10–40 UI intranasales a demanda (libido, "vínculo") o diarios.',
        'Unapproved use — compounded sprays of 10–40 IU intranasally on demand (libido, "bonding") or daily.',
      ),
      frequency: t(
        'Perfusión continua (obstetricia) · a demanda o 1–2×/día (intranasal, fuera de ficha)',
        'Continuous infusion (obstetrics) · on demand or once–twice daily (intranasal, off-label)',
      ),
    },
    storage: t(
      'Pitocin (EE. UU.): 20–25 °C. Syntocinon y genéricos UE: frecuentemente 2–8 °C (ver ficha de cada producto). Aerosoles magistrales: nevera. No congelar.',
      'Pitocin (US): 20–25 °C. Syntocinon and EU generics: often 2–8 °C (check each product label). Compounded sprays: refrigerate. Do not freeze.',
    ),
    adverseEffects: {
      common: [
        t('Náuseas, vómitos', 'Nausea, vomiting'),
        t('Cefalea, rubor', 'Headache, flushing'),
        t('Irritación nasal (intranasal)', 'Nasal irritation (intranasal)'),
      ],
      serious: [
        t(
          'Hiperestimulación uterina, rotura uterina, sufrimiento fetal',
          'Uterine hyperstimulation, uterine rupture, fetal distress',
        ),
        t(
          'Intoxicación hídrica e hiponatremia con perfusiones prolongadas en soluciones hipotónicas',
          'Water intoxication and hyponatraemia with prolonged infusions in hypotonic fluids',
        ),
        t(
          'Hipotensión, taquicardia y cambios del ST/QT con bolo IV rápido',
          'Hypotension, tachycardia and ST/QT changes with rapid IV bolus',
        ),
        t('Anafilaxia (rara)', 'Anaphylaxis (rare)'),
      ],
    },
    contraindications: [
      t(
        'Desproporción cefalopélvica significativa, presentaciones fetales desfavorables',
        'Significant cephalopelvic disproportion, unfavourable fetal presentations',
      ),
      t(
        'Sufrimiento fetal sin parto inminente; urgencias obstétricas que requieren cirugía',
        'Fetal distress without imminent delivery; obstetric emergencies requiring surgery',
      ),
      t(
        'Hipertonía uterina; uso prolongado en inercia uterina resistente',
        'Uterine hypertonus; prolonged use in resistant uterine inertia',
      ),
      t('Hipersensibilidad a oxitocina', 'Hypersensitivity to oxytocin'),
    ],
    interactions: [
      t(
        'Prostaglandinas y misoprostol: potenciación uterotónica (no simultáneos)',
        'Prostaglandins and misoprostol: uterotonic potentiation (not simultaneously)',
      ),
      t(
        'Vasoconstrictores (efedrina, metilergometrina): riesgo de hipertensión',
        'Vasoconstrictors (ephedrine, methylergometrine): risk of hypertension',
      ),
      t(
        'Anestésicos inhalados: hipotensión y arritmias',
        'Inhaled anaesthetics: hypotension and arrhythmias',
      ),
      t('Fármacos que prolongan el QT: precaución', 'QT-prolonging drugs: caution'),
    ],
    monitoring: [
      t(
        'Dinámica uterina y registro cardiotocográfico continuo',
        'Uterine activity and continuous cardiotocography',
      ),
      t(
        'Balance hídrico y sodio sérico en perfusiones prolongadas',
        'Fluid balance and serum sodium with prolonged infusions',
      ),
      t('Tensión arterial y frecuencia cardiaca', 'Blood pressure and heart rate'),
    ],
    keyTrials: [
      {
        name: 'SOARS-B (autismo)',
        year: 2021,
        finding: t(
          'Oxitocina intranasal diaria 24 semanas en niños y adolescentes con TEA: sin mejoría de la interacción social frente a placebo.',
          'Daily intranasal oxytocin for 24 weeks in children and adolescents with ASD: no improvement in social interaction vs placebo.',
        ),
        ref: 'NEJM 2021',
      },
    ],
    references: [
      { label: 'Pitocin (oxytocin injection) US Prescribing Information' },
      { label: 'Syntocinon — Summary of Product Characteristics (UE/Reino Unido)' },
      {
        label:
          'Sikich L et al. Intranasal oxytocin in children and adolescents with autism spectrum disorder. NEJM 2021',
      },
    ],
    tags: ['oxitocina', 'obstetricia', 'intranasal', 'aprobado', 'fuera-de-ficha'],
    lastReviewed: '2026-09-19',
  },

  // ───────────────────────────── OTHER ─────────────────────────────
  {
    id: 'aviptadil',
    names: {
      generic: 'Aviptadil',
      brands: ['Invicorp (con fentolamina)'],
      aliases: [
        'Zyesami (nombre propuesto, no aprobado)',
        'VIP',
        'Péptido intestinal vasoactivo',
        'Vasoactive intestinal peptide',
        'RLF-100',
      ],
    },
    category: 'other',
    pharmClass: t(
      'Péptido intestinal vasoactivo sintético (agonista VPAC1/VPAC2)',
      'Synthetic vasoactive intestinal peptide (VPAC1/VPAC2 agonist)',
    ),
    summary: t(
      'Forma sintética del VIP humano (28 aminoácidos), vasodilatador, broncodilatador e inmunomodulador. Se investigó en perfusión IV para la insuficiencia respiratoria crítica por COVID-19 sin demostrar beneficio en los ensayos controlados, y en forma inhalada para sarcoidosis e hipertensión pulmonar. En combinación intracavernosa con fentolamina está autorizado para disfunción eréctil en algunos países europeos (verificar).',
      'Synthetic form of human VIP (28 amino acids), a vasodilator, bronchodilator and immunomodulator. Studied as IV infusion for critical COVID-19 respiratory failure without demonstrating benefit in controlled trials, and inhaled for sarcoidosis and pulmonary hypertension. In intracavernosal combination with phentolamine it is authorised for erectile dysfunction in some European countries (verify).',
    ),
    mechanism: t(
      'Activa VPAC1/VPAC2 (acoplados a Gs, ↑AMPc): relaja el músculo liso vascular y bronquial, inhibe citocinas proinflamatorias (TNF-α, IL-6) y protege a los neumocitos tipo II. Se degrada rápidamente en plasma (semivida de pocos minutos), lo que limita la vía sistémica.',
      'Activates VPAC1/VPAC2 (Gs-coupled, ↑cAMP): relaxes vascular and bronchial smooth muscle, inhibits pro-inflammatory cytokines (TNF-α, IL-6) and protects type II pneumocytes. Rapidly degraded in plasma (half-life of a few minutes), which limits systemic use.',
    ),
    indications: [
      t(
        'Disfunción eréctil: aviptadil/fentolamina intracavernosa (autorizado en algunos países europeos)',
        'Erectile dysfunction: intracavernosal aviptadil/phentolamine (authorised in some European countries)',
      ),
      t(
        'Investigado sin éxito: insuficiencia respiratoria crítica por COVID-19 (IV)',
        'Investigated without success: critical COVID-19 respiratory failure (IV)',
      ),
      t(
        'Investigado: sarcoidosis pulmonar, hipertensión arterial pulmonar (inhalado)',
        'Investigated: pulmonary sarcoidosis, pulmonary arterial hypertension (inhaled)',
      ),
    ],
    evidence: 'phase3',
    regulatory: {
      us: 'investigational',
      notes: t(
        'EE. UU.: la FDA no concedió autorización de uso de emergencia para COVID-19 (2021–2022). Designación de medicamento huérfano para algunas indicaciones pulmonares. UE: la combinación intracavernosa con fentolamina tiene autorización nacional en algunos Estados miembros (verificar por país).',
        'US: FDA did not grant emergency use authorisation for COVID-19 (2021–2022). Orphan designation for some pulmonary indications. EU: the intracavernosal combination with phentolamine holds national authorisation in some member states (verify per country).',
      ),
    },
    routes: ['iv', 'nasal'],
    defaultUnit: 'mcg',
    dosing: {
      investigational: t(
        'COVID-19 crítico: tres perfusiones IV de 12 h en días consecutivos a 50, 100 y 150 pmol/kg/min. Inhalado (sarcoidosis, piloto): dosis nebulizadas de microgramos varias veces al día.',
        'Critical COVID-19: three 12-h IV infusions on consecutive days at 50, 100 and 150 pmol/kg/min. Inhaled (sarcoidosis, pilot): nebulised microgram doses several times daily.',
      ),
      anecdotal: t(
        'Uso no aprobado — VIP nasal/SC de fórmula magistral o mercado gris (p. ej. en protocolos de "enfermedad inflamatoria crónica por biotoxinas"), sin ensayos controlados.',
        'Unapproved use — compounded or grey-market nasal/SC VIP (e.g. in "chronic inflammatory response syndrome" protocols), without controlled trials.',
      ),
    },
    reconstitution: t(
      'Vial liofilizado de 5 mg + 2 mL de agua bacteriostática = 2,5 mg/mL (2500 mcg/mL). En jeringa U-100: 50 mcg = 0,02 mL = 2 U; 100 mcg = 4 U (volúmenes muy pequeños: valorar mayor dilución). Muy lábil en solución.',
      '5 mg lyophilised vial + 2 mL bacteriostatic water = 2.5 mg/mL (2500 mcg/mL). U-100 syringe: 50 mcg = 0.02 mL = 2 U; 100 mcg = 4 U (very small volumes: consider greater dilution). Very labile in solution.',
    ),
    storage: t(
      'Liofilizado: −20 °C. Reconstituido o en aerosol: 2–8 °C, uso a corto plazo; el VIP se degrada rápidamente en solución.',
      'Lyophilisate: −20 °C. Reconstituted or as spray: 2–8 °C, short-term use; VIP degrades rapidly in solution.',
    ),
    adverseEffects: {
      common: [
        t('Rubor facial, hipotensión, taquicardia', 'Facial flushing, hypotension, tachycardia'),
        t('Diarrea (efecto secretor intestinal)', 'Diarrhoea (intestinal secretory effect)'),
        t('Cefalea', 'Headache'),
      ],
      serious: [
        t(
          'Hipotensión significativa en perfusión IV',
          'Significant hypotension during IV infusion',
        ),
        t('Priapismo con uso intracavernoso', 'Priapism with intracavernosal use'),
      ],
    },
    contraindications: [
      t('Hipotensión o inestabilidad hemodinámica', 'Hypotension or haemodynamic instability'),
      t('Embarazo y lactancia', 'Pregnancy and lactation'),
    ],
    interactions: [
      t(
        'Antihipertensivos, nitratos, iPDE5: efecto hipotensor aditivo',
        'Antihypertensives, nitrates, PDE5 inhibitors: additive hypotensive effect',
      ),
    ],
    monitoring: [
      t(
        'Tensión arterial y frecuencia cardiaca durante la perfusión',
        'Blood pressure and heart rate during infusion',
      ),
      t('Electrolitos si diarrea', 'Electrolytes if diarrhoea'),
    ],
    keyTrials: [
      {
        name: 'COVID-AIV (NeuroRx/Relief)',
        year: 2021,
        finding: t(
          'Fase 2b/3 en insuficiencia respiratoria crítica por COVID-19: no alcanzó el objetivo primario (supervivencia libre de insuficiencia respiratoria a 60 días).',
          'Phase 2b/3 in critical COVID-19 respiratory failure: missed the primary endpoint (respiratory-failure-free survival at day 60).',
        ),
      },
      {
        name: 'Prasse et al. (sarcoidosis inhalado)',
        year: 2010,
        finding: t(
          'Estudio piloto abierto: VIP inhalado redujo TNF-α en lavado broncoalveolar y aumentó células T reguladoras; sin variables clínicas duras.',
          'Open pilot study: inhaled VIP reduced BAL TNF-α and increased regulatory T cells; no hard clinical endpoints.',
        ),
        ref: 'Am J Respir Crit Care Med 2010',
      },
    ],
    references: [
      {
        label:
          'Prasse A et al. Inhaled vasoactive intestinal peptide exerts immunoregulatory effects in sarcoidosis. Am J Respir Crit Care Med 2010',
      },
      {
        label:
          'NeuroRx / Relief Therapeutics — comunicados de resultados del ensayo COVID-AIV (2021)',
      },
    ],
    tags: ['vip', 'vasodilatador', 'pulmonar', 'covid', 'investigacional'],
    lastReviewed: '2026-09-19',
  },
  {
    id: 'pe-22-28',
    names: {
      generic: 'PE-22-28',
      brands: [],
      aliases: ['Análogo acortado de spadina', 'Mini-spadin', 'GVSWGLR'],
    },
    category: 'other',
    pharmClass: t(
      'Péptido bloqueante del canal de potasio TREK-1 (análogo de spadina)',
      'TREK-1 potassium-channel blocking peptide (spadin analogue)',
    ),
    summary: t(
      'Heptapéptido derivado de la spadina (fragmento del propéptido de la sortilina) que bloquea el canal TREK-1. En ratones mostró efecto de tipo antidepresivo en ~4 días y neurogénesis hipocampal, más estable que la spadina. Sin ningún estudio en humanos; se vende como "nootrópico/antidepresivo" de investigación.',
      'Heptapeptide derived from spadin (a sortilin-propeptide fragment) that blocks the TREK-1 channel. In mice it showed antidepressant-like effects within ~4 days and hippocampal neurogenesis, with better stability than spadin. No human studies at all; sold as a research "nootropic/antidepressant".',
    ),
    mechanism: t(
      'TREK-1 (K2P2.1) es un canal de potasio de dos poros cuya deleción en ratones produce un fenotipo resistente a la depresión. Su bloqueo aumenta la excitabilidad de neuronas serotoninérgicas del rafe y favorece la neurogénesis y la sinaptogénesis, con inicio de acción más rápido que los ISRS en modelos animales.',
      'TREK-1 (K2P2.1) is a two-pore potassium channel whose deletion in mice produces a depression-resistant phenotype. Blocking it increases raphe serotonergic-neuron excitability and promotes neurogenesis and synaptogenesis, with faster onset than SSRIs in animal models.',
    ),
    indications: [
      t('Ninguna aprobada', 'None approved'),
      t('Preclínico: depresión (modelos murinos)', 'Preclinical: depression (murine models)'),
    ],
    evidence: 'preclinical',
    regulatory: {
      us: 'research_only',
      notes: t(
        'Sin desarrollo clínico registrado; producto de investigación de mercado gris.',
        'No registered clinical development; grey-market research product.',
      ),
    },
    routes: ['sc', 'nasal'],
    defaultUnit: 'mcg',
    dosing: {
      anecdotal: t(
        'Uso no aprobado — ~200–1000 mcg/día SC o intranasal en ciclos cortos; dosis sin base farmacocinética humana.',
        'Unapproved use — ~200–1000 mcg/day SC or intranasal in short cycles; doses without human pharmacokinetic basis.',
      ),
      frequency: t('1×/día (uso no aprobado)', 'Once daily (unapproved use)'),
    },
    reconstitution: t(
      'Vial liofilizado de 5 mg + 2 mL de agua bacteriostática = 2,5 mg/mL (2500 mcg/mL). En jeringa U-100: 500 mcg = 0,2 mL = 20 U; 250 mcg = 10 U.',
      '5 mg lyophilised vial + 2 mL bacteriostatic water = 2.5 mg/mL (2500 mcg/mL). U-100 syringe: 500 mcg = 0.2 mL = 20 U; 250 mcg = 10 U.',
    ),
    storage: t(
      'Liofilizado: −20 °C. Reconstituido: 2–8 °C, uso en 2–4 semanas, proteger de la luz.',
      'Lyophilisate: −20 °C. Reconstituted: 2–8 °C, use within 2–4 weeks, protect from light.',
    ),
    adverseEffects: {
      common: [
        t(
          'No caracterizados; referidos anecdóticamente cefalea, irritabilidad, alteración del sueño',
          'Uncharacterised; headache, irritability and sleep disturbance reported anecdotally',
        ),
      ],
      serious: [
        t(
          'Riesgos teóricos del bloqueo de TREK-1: menor umbral convulsivo y menor neuroprotección frente a isquemia (fenotipo del ratón knock-out)',
          'Theoretical risks of TREK-1 blockade: lower seizure threshold and reduced neuroprotection against ischaemia (knock-out mouse phenotype)',
        ),
        t('Riesgo de viraje maníaco no evaluado', 'Risk of manic switch unevaluated'),
      ],
    },
    contraindications: [
      t('Epilepsia', 'Epilepsy'),
      t('Trastorno bipolar', 'Bipolar disorder'),
      t(
        'Depresión en tratamiento: no sustituye a terapias con evidencia',
        'Depression under treatment: not a substitute for evidence-based therapies',
      ),
      t('Embarazo y lactancia', 'Pregnancy and lactation'),
    ],
    interactions: [
      t(
        'Antidepresivos (ISRS, IRSN, IMAO): interacción farmacodinámica no estudiada',
        'Antidepressants (SSRIs, SNRIs, MAOIs): unstudied pharmacodynamic interaction',
      ),
      t(
        'Fármacos que reducen el umbral convulsivo (bupropión, tramadol)',
        'Seizure-threshold-lowering drugs (bupropion, tramadol)',
      ),
    ],
    monitoring: [
      t(
        'Ánimo, ideación suicida y síntomas de hipomanía',
        'Mood, suicidal ideation and hypomanic symptoms',
      ),
    ],
    keyTrials: [
      {
        name: 'Djillani et al. (análogos de spadina)',
        year: 2017,
        finding: t(
          'Los análogos acortados (incl. PE-22-28) mostraron mayor inhibición de TREK-1, mayor estabilidad in vivo y efecto antidepresivo en ratones.',
          'Shortened analogues (incl. PE-22-28) showed stronger TREK-1 inhibition, greater in vivo stability and antidepressant effects in mice.',
        ),
        ref: 'Front Pharmacol 2017',
      },
      {
        name: 'Mazella et al. (spadina)',
        year: 2010,
        finding: t(
          'Identificación de la spadina como antidepresivo de acción rápida por bloqueo de TREK-1 en ratones.',
          'Spadin identified as a fast-acting antidepressant through TREK-1 blockade in mice.',
        ),
        ref: 'PLoS Biol 2010',
      },
    ],
    references: [
      {
        label:
          'Djillani A et al. Shortened spadin analogs display better TREK-1 inhibition, in vivo stability and antidepressant activity. Front Pharmacol 2017',
      },
      {
        label:
          'Mazella J et al. Spadin, a sortilin-derived peptide, targeting rodent TREK-1 channels: a new concept in the antidepressant drug design. PLoS Biol 2010',
      },
    ],
    tags: ['trek-1', 'antidepresivo', 'nootropico', 'investigacion'],
    lastReviewed: '2026-09-19',
  },
  {
    id: 'larazotide',
    names: {
      generic: 'Acetato de larazotida',
      brands: [],
      aliases: ['Larazotide acetate', 'AT-1001', 'INN-202', 'GGVLVQPG'],
    },
    category: 'other',
    pharmClass: t(
      'Regulador de uniones estrechas intestinales (antagonista funcional de zonulina)',
      'Intestinal tight-junction regulator (functional zonulin antagonist)',
    ),
    summary: t(
      'Octapéptido oral de liberación retardada derivado de la toxina zonula occludens de Vibrio cholerae, que actúa localmente sobre la permeabilidad paracelular intestinal. En fase 2b, 0,5 mg 3×/día redujo síntomas en celíacos con dieta sin gluten; el fase 3 CeDLara se interrumpió en 2022 por futilidad y el desarrollo se detuvo.',
      'Oral delayed-release octapeptide derived from Vibrio cholerae zonula occludens toxin, acting locally on intestinal paracellular permeability. In phase 2b, 0.5 mg three times daily reduced symptoms in coeliac patients on a gluten-free diet; the phase 3 CeDLara trial was stopped in 2022 for futility and development halted.',
    ),
    mechanism: t(
      'Impide el desensamblaje de las uniones estrechas inducido por zonulina/gliadina (redistribución de ZO-1 y actina), reduciendo el paso paracelular de péptidos de gliadina a la lámina propia. Actúa en la luz intestinal con absorción sistémica mínima.',
      'Prevents zonulin/gliadin-induced tight-junction disassembly (ZO-1 and actin redistribution), reducing paracellular passage of gliadin peptides into the lamina propria. Acts in the gut lumen with minimal systemic absorption.',
    ),
    indications: [
      t('Ninguna aprobada', 'None approved'),
      t(
        'Investigado (fracasado en fase 3): celiaquía con síntomas persistentes pese a dieta sin gluten',
        'Investigated (failed in phase 3): coeliac disease with persistent symptoms despite a gluten-free diet',
      ),
    ],
    evidence: 'phase3',
    regulatory: {
      us: 'discontinued',
      notes: t(
        'Programa detenido tras el análisis intermedio de futilidad del fase 3 (junio de 2022); la compañía promotora (9 Meters Biopharma) cesó actividad posteriormente. Existen cápsulas de mercado gris sin la formulación de liberación retardada validada.',
        'Programme halted after the phase 3 interim futility analysis (June 2022); the sponsor (9 Meters Biopharma) later ceased operations. Grey-market capsules exist without the validated delayed-release formulation.',
      ),
    },
    routes: ['oral'],
    defaultUnit: 'mg',
    dosing: {
      investigational: t(
        'Fase 2b y 3: 0,5 mg VO 3×/día, 15 min antes de las comidas. Dosis de 1 y 2 mg no superaron a placebo (curva dosis-respuesta inversa).',
        'Phase 2b and 3: 0.5 mg PO three times daily, 15 min before meals. 1 and 2 mg doses did not beat placebo (inverse dose-response).',
      ),
      anecdotal: t(
        'Uso no aprobado — cápsulas de mercado gris de 0,5–1 mg antes de comidas con posible exposición a gluten; eficacia no demostrada.',
        'Unapproved use — grey-market 0.5–1 mg capsules before meals with possible gluten exposure; efficacy not demonstrated.',
      ),
      frequency: t('3×/día antes de comidas (ensayos)', 'Three times daily before meals (trials)'),
    },
    storage: t(
      'Cápsulas: temperatura ambiente (<25 °C), secas.',
      'Capsules: room temperature (<25 °C), dry.',
    ),
    adverseEffects: {
      common: [
        t(
          'Similares a placebo en ensayos: cefalea, molestias GI leves',
          'Placebo-like in trials: headache, mild GI discomfort',
        ),
      ],
      serious: [
        t(
          'Sin señal grave en ensayos; riesgo principal: falsa seguridad frente a la dieta sin gluten estricta',
          'No serious signal in trials; main risk: false reassurance undermining a strict gluten-free diet',
        ),
      ],
    },
    contraindications: [
      t('No sustituye a la dieta sin gluten', 'Not a substitute for a gluten-free diet'),
      t('Embarazo y lactancia (sin datos)', 'Pregnancy and lactation (no data)'),
    ],
    interactions: [
      t(
        'No se esperan interacciones sistémicas relevantes (absorción mínima)',
        'No relevant systemic interactions expected (minimal absorption)',
      ),
    ],
    monitoring: [
      t(
        'Serología celíaca (anti-tTG IgA) y síntomas; adherencia a la dieta',
        'Coeliac serology (anti-tTG IgA) and symptoms; dietary adherence',
      ),
    ],
    keyTrials: [
      {
        name: 'Leffler et al. (fase 2b)',
        year: 2015,
        finding: t(
          'En 342 celíacos con síntomas persistentes, 0,5 mg 3×/día redujo síntomas (CeD-GSRS) frente a placebo; 1 y 2 mg sin diferencia.',
          'In 342 coeliac patients with persistent symptoms, 0.5 mg three times daily reduced symptoms (CeD-GSRS) vs placebo; 1 and 2 mg showed no difference.',
        ),
        ref: 'Gastroenterology 2015',
      },
      {
        name: 'CeDLara (fase 3)',
        year: 2022,
        finding: t(
          'Interrumpido tras análisis intermedio: improbable alcanzar significación en el objetivo primario (futilidad).',
          'Stopped after interim analysis: unlikely to reach significance on the primary endpoint (futility).',
        ),
      },
    ],
    references: [
      {
        label:
          'Leffler DA et al. Larazotide acetate for persistent symptoms of celiac disease despite a gluten-free diet: a randomized controlled trial. Gastroenterology 2015',
      },
      { label: '9 Meters Biopharma — comunicado de interrupción del fase 3 CeDLara (junio 2022)' },
    ],
    tags: ['celiaquia', 'permeabilidad-intestinal', 'zonulina', 'oral', 'abandonado'],
    lastReviewed: '2026-09-19',
  },
  {
    id: 'zinc-thymulin',
    names: {
      generic: 'Timulina-zinc',
      brands: [],
      aliases: [
        'Zinc-thymulin',
        'Thymulin',
        'Factor tímico sérico (FTS)',
        'Facteur thymique sérique',
        'pGlu-Ala-Lys-Ser-Gln-Gly-Gly-Asn',
      ],
    },
    category: 'other',
    pharmClass: t(
      'Hormona tímica (nonapéptido dependiente de zinc)',
      'Thymic hormone (zinc-dependent nonapeptide)',
    ),
    summary: t(
      'Nonapéptido secretado por el epitelio tímico que solo es biológicamente activo unido a Zn2+. Participa en la diferenciación de linfocitos T; sus niveles caen con la edad y el déficit de zinc, y la suplementación con zinc restaura su actividad en ancianos. La administración del péptido carece de estudios clínicos modernos; se vende para "inmunidad" y crecimiento capilar.',
      'Nonapeptide secreted by thymic epithelium that is biologically active only when bound to Zn2+. Involved in T-lymphocyte differentiation; levels fall with age and zinc deficiency, and zinc supplementation restores its activity in the elderly. Administration of the peptide lacks modern clinical studies; it is sold for "immunity" and hair growth.',
    ),
    mechanism: t(
      'El complejo Zn-timulina induce marcadores de diferenciación T, modula la actividad de células NK y la producción de citocinas, y tiene efectos neuroendocrinos (interacción bidireccional con el eje GH/prolactina y glucocorticoides). La forma sin zinc es inactiva, por lo que el estado de zinc condiciona su efecto.',
      'The Zn-thymulin complex induces T-cell differentiation markers, modulates NK-cell activity and cytokine production, and has neuroendocrine effects (bidirectional interplay with the GH/prolactin axis and glucocorticoids). The zinc-free form is inactive, so zinc status determines its effect.',
    ),
    indications: [
      t('Ninguna aprobada', 'None approved'),
      t(
        'Preclínico: inmunosenescencia, inflamación, dolor neuropático; alopecia (evidencia muy débil)',
        'Preclinical: immunosenescence, inflammation, neuropathic pain; alopecia (very weak evidence)',
      ),
    ],
    evidence: 'preclinical',
    regulatory: {
      us: 'research_only',
      notes: t(
        'Sin desarrollo clínico actual; producto de investigación de mercado gris, a veces en formulaciones tópicas capilares.',
        'No current clinical development; grey-market research product, sometimes in topical hair formulations.',
      ),
    },
    routes: ['sc', 'topical'],
    defaultUnit: 'mcg',
    dosing: {
      anecdotal: t(
        'Uso no aprobado — sin rangos comunitarios fiables; se citan cientos de mcg SC varias veces por semana o aplicaciones tópicas en cuero cabelludo.',
        'Unapproved use — no reliable community ranges; hundreds of mcg SC several times weekly or topical scalp applications are cited.',
      ),
    },
    reconstitution: t(
      'Vial liofilizado de 5 mg + 2 mL de agua bacteriostática = 2,5 mg/mL (2500 mcg/mL). En jeringa U-100: 250 mcg = 0,1 mL = 10 U.',
      '5 mg lyophilised vial + 2 mL bacteriostatic water = 2.5 mg/mL (2500 mcg/mL). U-100 syringe: 250 mcg = 0.1 mL = 10 U.',
    ),
    storage: t(
      'Liofilizado: −20 °C. Reconstituido: 2–8 °C, uso en 2–4 semanas.',
      'Lyophilisate: −20 °C. Reconstituted: 2–8 °C, use within 2–4 weeks.',
    ),
    adverseEffects: {
      common: [
        t('Reacciones locales (inyección o tópica)', 'Local reactions (injection or topical)'),
      ],
      serious: [
        t(
          'No caracterizados: sin datos de seguridad humana del péptido administrado',
          'Uncharacterised: no human safety data for the administered peptide',
        ),
      ],
    },
    contraindications: [
      t(
        'Enfermedad autoinmune activa (inmunomodulación no caracterizada)',
        'Active autoimmune disease (uncharacterised immunomodulation)',
      ),
      t('Embarazo y lactancia', 'Pregnancy and lactation'),
    ],
    interactions: [
      t(
        'Inmunosupresores: interacción farmacodinámica teórica',
        'Immunosuppressants: theoretical pharmacodynamic interaction',
      ),
    ],
    monitoring: [
      t(
        'Zinc sérico: el déficit de zinc es la causa corregible más probable de baja actividad de timulina',
        'Serum zinc: zinc deficiency is the most likely correctable cause of low thymulin activity',
      ),
    ],
    keyTrials: [
      {
        name: 'Dardenne et al. (dependencia de zinc)',
        year: 1982,
        finding: t(
          'Demostración de que la actividad biológica del factor tímico sérico requiere zinc.',
          'Showed that biological activity of serum thymic factor requires zinc.',
        ),
        ref: 'PNAS 1982',
      },
    ],
    references: [
      {
        label:
          'Dardenne M et al. Contribution of zinc and other metals to the biological activity of the serum thymic factor. PNAS 1982',
      },
      { label: 'Revisiones sobre timulina e inmunosenescencia (Mocchegiani E y cols.)' },
    ],
    tags: ['timo', 'zinc', 'inmunidad', 'investigacion'],
    lastReviewed: '2026-09-19',
  },
  {
    id: 'pnc-27',
    names: {
      generic: 'PNC-27',
      brands: [],
      aliases: ['p53(12-26)-penetratina', 'Péptido anti-HDM-2'],
    },
    category: 'other',
    pharmClass: t(
      'Péptido quimérico citolítico (dominio de p53 + péptido de penetración celular)',
      'Chimeric cytolytic peptide (p53 domain + cell-penetrating peptide)',
    ),
    summary: t(
      'Péptido de 32 aminoácidos formado por los residuos 12–26 de p53 (dominio de unión a HDM-2) unidos a penetratina. In vitro y en xenoinjertos murinos provoca necrosis de células tumorales que expresan HDM-2 en membrana. NO existen datos creíbles de eficacia en humanos ni ensayos clínicos publicados; se ofrece en clínicas de "terapias alternativas" contra el cáncer.',
      '32-amino-acid peptide made of p53 residues 12–26 (HDM-2-binding domain) linked to penetratin. In vitro and in murine xenografts it causes necrosis of tumour cells expressing membrane HDM-2. There are NO credible human efficacy data and no published clinical trials; it is offered by "alternative" cancer clinics.',
    ),
    mechanism: t(
      'Se propone que se une a HDM-2 expresada en la membrana plasmática de células tumorales (no en células normales) y forma poros transmembrana que causan necrosis independiente de p53 intracelular. Mecanismo descrito por un único grupo investigador; no replicado de forma independiente en modelos clínicos.',
      'Proposed to bind HDM-2 expressed on tumour-cell plasma membranes (not normal cells) and form transmembrane pores causing necrosis independent of intracellular p53. Mechanism described by a single research group; not independently replicated in clinical models.',
    ),
    indications: [
      t('Ninguna aprobada', 'None approved'),
      t(
        'Preclínico: diversos tumores sólidos y leucemias (in vitro, xenoinjertos)',
        'Preclinical: various solid tumours and leukaemias (in vitro, xenografts)',
      ),
    ],
    evidence: 'preclinical',
    regulatory: {
      us: 'research_only',
      notes: t(
        'Sin IND activo conocido ni ensayos clínicos publicados. Su oferta como tratamiento oncológico carece de base; no debe usarse como sustituto ni retrasar tratamientos oncológicos con evidencia.',
        'No known active IND nor published clinical trials. Its promotion as a cancer treatment is unfounded; it must not replace or delay evidence-based oncological treatment.',
      ),
    },
    routes: ['iv', 'sc'],
    defaultUnit: 'mg',
    dosing: {
      anecdotal: t(
        'Uso no aprobado — se administra en clínicas alternativas por vía IV o SC sin dosis validadas; no se reproducen rangos por ausencia total de datos humanos.',
        'Unapproved use — administered in alternative clinics IV or SC without validated doses; no ranges are given given the complete absence of human data.',
      ),
    },
    reconstitution: t(
      'Solo como referencia aritmética: vial liofilizado de 10 mg + 2 mL de agua bacteriostática = 5 mg/mL; en jeringa U-100, 1 mg = 0,2 mL = 20 U. No implica dosis alguna.',
      'Arithmetic reference only: 10 mg lyophilised vial + 2 mL bacteriostatic water = 5 mg/mL; U-100 syringe, 1 mg = 0.2 mL = 20 U. Implies no dose whatsoever.',
    ),
    storage: t(
      'Liofilizado: −20 °C. Reconstituido: 2–8 °C, uso inmediato o a corto plazo.',
      'Lyophilisate: −20 °C. Reconstituted: 2–8 °C, immediate or short-term use.',
    ),
    adverseEffects: {
      common: [t('No caracterizados en humanos', 'Uncharacterised in humans')],
      serious: [
        t(
          'Retraso o abandono de tratamiento oncológico eficaz (principal daño documentable)',
          'Delay or abandonment of effective cancer treatment (main documentable harm)',
        ),
        t(
          'Toxicidad desconocida: péptidos de penetración y formadores de poros pueden lisar células normales; riesgo de hemólisis y síndrome de lisis tumoral teórico',
          'Unknown toxicity: penetrating and pore-forming peptides can lyse normal cells; theoretical haemolysis and tumour-lysis syndrome risk',
        ),
        t('Riesgos de productos no estériles por vía IV', 'Risks of non-sterile products given IV'),
      ],
    },
    contraindications: [
      t(
        'Uso en sustitución de tratamiento oncológico estándar',
        'Use in place of standard cancer treatment',
      ),
      t('Embarazo y lactancia', 'Pregnancy and lactation'),
    ],
    interactions: [
      t(
        'No estudiadas con quimioterapia, inmunoterapia ni radioterapia',
        'Unstudied with chemotherapy, immunotherapy or radiotherapy',
      ),
    ],
    monitoring: [
      t(
        'Si el paciente lo usa: seguimiento oncológico estándar, hemograma, función renal, LDH, ácido úrico',
        'If the patient uses it: standard oncology follow-up, blood count, renal function, LDH, uric acid',
      ),
    ],
    keyTrials: [
      {
        name: 'Sarafraz-Yazdi et al. (mecanismo)',
        year: 2010,
        finding: t(
          'PNC-27 se une a HDM-2 de membrana y forma poros que matan células tumorales in vitro sin afectar a células normales (mismo grupo investigador).',
          'PNC-27 binds membrane HDM-2 and forms pores that kill tumour cells in vitro without affecting normal cells (same research group).',
        ),
        ref: 'PNAS 2010',
      },
    ],
    references: [
      {
        label:
          'Sarafraz-Yazdi E et al. Anticancer peptide PNC-27 adopts an HDM-2-binding conformation and kills cancer cells by binding to HDM-2 in their membranes. PNAS 2010',
      },
      {
        label:
          'Ausencia de ensayos clínicos publicados a fecha de revisión (búsqueda en registros de ensayos)',
      },
    ],
    tags: ['oncologia', 'p53', 'terapia-alternativa', 'sin-evidencia-humana', 'investigacion'],
    lastReviewed: '2026-09-19',
  },
]
