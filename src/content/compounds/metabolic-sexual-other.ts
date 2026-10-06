import { t, type CompoundDetail } from '../schema'

/**
 * Metabolic and sexual-health compounds (second batch).
 * Two entries are NOT peptides (5-amino-1MQ, NAD+) and are included because
 * they circulate in the same clinical/"research" context.
 * Evidence tiers and regulatory status are stated conservatively. Dosing
 * labelled "anecdotal" is community usage reproduced for harm-reduction
 * context only and is never a recommendation.
 */
export const METABOLIC_SEXUAL_OTHER: CompoundDetail[] = [
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
      aliases: [
        'NAD',
        'NAD plus',
        'Nicotinamida adenina dinucleótido',
        'Nicotinamide adenine dinucleotide',
        'β-NAD',
      ],
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
        'Uso no aprobado — IV 250–1000 mg por sesión en 2–4 h (a veces más lento por tolerancia); SC 50–100 mg 1–3×/semana, empezando por la dosis baja. Por vía SC también puede dar rubor, náuseas o calambres en los minutos siguientes: se suele inyectar despacio.',
        'Unapproved use — IV 250–1000 mg per session over 2–4 h (sometimes slower for tolerability); SC 50–100 mg 1–3×/week, starting with the low dose. SC injection can also cause flushing, nausea or cramps in the following minutes: it is usually injected slowly.',
      ),
      frequency: t(
        'Sesiones IV variables; SC 1–3×/semana (uso no aprobado)',
        'Variable IV sessions; SC 1–3×/week (unapproved use)',
      ),
    },
    reconstitution: t(
      'Vial liofilizado de 500 mg + 5 mL de agua bacteriostática = 100 mg/mL. En jeringa U-100, 1 U = 1 mg → 50 mg = 50 U (0,5 mL); 100 mg = 100 U (1 mL). Si escuece mucho, más diluido: 500 mg + 10 mL = 50 mg/mL → 50 mg = 100 U (1 mL). Para IV se diluye en suero salino según el protocolo de la farmacia.',
      '500 mg lyophilised vial + 5 mL bacteriostatic water = 100 mg/mL. On a U-100 syringe, 1 U = 1 mg → 50 mg = 50 U (0.5 mL); 100 mg = 100 U (1 mL). If it stings a lot, dilute more: 500 mg + 10 mL = 50 mg/mL → 50 mg = 100 U (1 mL). For IV it is diluted in saline per the pharmacy protocol.',
    ),
    storage: t(
      'Liofilizado: 2–8 °C (o −20 °C a largo plazo), protegido de la luz y la humedad. Reconstituido: nevera, protegido de la luz, no congelar; el NAD+ se degrada en solución a temperatura ambiente. Se suele indicar usarlo en 2–4 semanas: orientación de fabricantes y de la comunidad, sin datos de estabilidad publicados. Desechar si amarillea o se enturbia.',
      'Lyophilisate: 2–8 °C (or −20 °C long term), protected from light and moisture. Reconstituted: fridge, protected from light, do not freeze; NAD+ degrades in solution at room temperature. The usual guidance is to use it within 2–4 weeks: manufacturer and community guidance with no published stability data. Discard if it yellows or turns cloudy.',
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
      t(
        'Vía SC: rubor, náuseas o calambres tras la dosis y reacciones locales',
        'SC route: flushing, nausea or cramps after the dose and local reactions',
      ),
      t(
        'No hay un marcador útil: el NAD+ en sangre no se mide en analíticas de rutina',
        'There is no useful marker: blood NAD+ is not measured in routine lab tests',
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
    lastReviewed: '2026-09-30',
  },

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
]
