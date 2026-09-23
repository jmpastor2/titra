import { t, type CompoundEntry } from '../schema'

/**
 * Hormonal axis agents: gonadotropins and GnRH analogues, posterior pituitary,
 * bone anabolics, somatostatin analogues, and glucose/metabolic hormones.
 *
 * Off-label uses (notably hCG and gonadorelin as adjuncts to testosterone therapy)
 * are labelled as such and kept out of `dosing.labeled`.
 */

export const HORMONAL: CompoundEntry[] = [
  {
    id: 'hcg',
    names: {
      generic: 'Gonadotropina coriónica humana',
      brands: ['Pregnyl', 'Novarel', 'Ovidrel (coriogonadotropina alfa)'],
      aliases: ['hCG', 'HCG', 'coriogonadotropina'],
    },
    category: 'hormonal',
    pharmClass: t(
      'Gonadotropina; agonista del receptor de LH/hCG',
      'Gonadotropin; LH/hCG receptor agonist',
    ),
    summary: t(
      'Glucoproteína placentaria que actúa como análogo de la LH sobre el receptor LHCGR. Aprobada para inducción de la ovulación, criptorquidia prepuberal e hipogonadismo hipogonadotropo; su uso como adyuvante de la testosterona es off-label.',
      'Placental glycoprotein acting as an LH analogue at the LHCGR receptor. Approved for ovulation induction, prepubertal cryptorchidism and hypogonadotropic hypogonadism; its use as an adjunct to testosterone is off-label.',
    ),
    mechanism: t(
      'Se une al receptor de LH/hCG en las células de Leydig y en la granulosa/teca, activando la vía AMPc-PKA y la esteroidogénesis (StAR, CYP17A1). En el varón mantiene la producción intratesticular de testosterona y el volumen testicular; en la mujer desencadena la ovulación y sostiene el cuerpo lúteo.',
      'Binds the LH/hCG receptor on Leydig and granulosa/theca cells, activating the cAMP-PKA pathway and steroidogenesis (StAR, CYP17A1). In men it maintains intratesticular testosterone production and testicular volume; in women it triggers ovulation and supports the corpus luteum.',
    ),
    indications: [
      t(
        'Inducción de la ovulación y desencadenamiento final de la maduración folicular en reproducción asistida',
        'Ovulation induction and final follicular maturation trigger in assisted reproduction',
      ),
      t(
        'Criptorquidia prepuberal no debida a obstrucción anatómica',
        'Prepubertal cryptorchidism not due to anatomical obstruction',
      ),
      t(
        'Hipogonadismo hipogonadotropo masculino y estímulo de la espermatogénesis (con FSH)',
        'Male hypogonadotropic hypogonadism and stimulation of spermatogenesis (with FSH)',
      ),
      t(
        'Uso off-label: preservación de la función testicular y de la fertilidad durante tratamiento con testosterona',
        'Off-label use: preservation of testicular function and fertility during testosterone therapy',
      ),
    ],
    evidence: 'fda_approved',
    regulatory: {
      us: 'approved',
      eu: 'approved',
      notes: t(
        'Aprobada para las indicaciones reproductivas. El uso como adyuvante de la terapia con testosterona no figura en ficha técnica: es off-label y queda a criterio clínico. Sustancia prohibida en el deporte (WADA, categoría S2).',
        'Approved for the reproductive indications. Use as an adjunct to testosterone therapy is not in the label: it is off-label and left to clinical judgement. Prohibited in sport (WADA class S2).',
      ),
    },
    routes: ['sc', 'im'],
    defaultUnit: 'iu',
    pk: {
      halfLifeH: 30,
      tmaxH: 12,
      source:
        'Pregnyl/Novarel US label §12.3: semivida bifásica, fase terminal ≈ 24–36 h tras administración IM',
      notes:
        'Cinética bifásica (fase inicial ~11 h, terminal 24–36 h). La coriogonadotropina alfa recombinante tiene un perfil similar por vía subcutánea. Los tests de embarazo pueden dar falsos positivos hasta 10–14 días después de una dosis alta.',
    },
    dosing: {
      labeled: t(
        'Reproducción asistida: dosis única de 5.000–10.000 UI por vía intramuscular tras la preparación folicular adecuada. Criptorquidia e hipogonadismo hipogonadotropo: pautas intramusculares de 1.000–4.000 UI dos o tres veces por semana durante varias semanas o meses, según ficha técnica y respuesta.',
        'Assisted reproduction: a single 5,000–10,000 IU intramuscular dose after adequate follicular preparation. Cryptorchidism and hypogonadotropic hypogonadism: intramuscular regimens of 1,000–4,000 IU two or three times weekly over several weeks or months, per label and response.',
      ),
      anecdotal: t(
        'Uso no aprobado — como adyuvante de la terapia con testosterona se describen en la práctica clínica y en foros pautas de 250–500 UI por vía subcutánea dos o tres veces por semana para mantener el volumen testicular y la esteroidogénesis intratesticular, y de 1.500–3.000 UI dos veces por semana en protocolos de recuperación del eje tras suspender la testosterona. No hay indicación aprobada ni posología validada para esta finalidad.',
        'Unapproved use — as an adjunct to testosterone therapy, clinical practice and community reports describe 250–500 IU subcutaneously two or three times weekly to maintain testicular volume and intratesticular steroidogenesis, and 1,500–3,000 IU twice weekly in axis-restart protocols after stopping testosterone. There is no approved indication or validated posology for this purpose.',
      ),
      frequency: t(
        'Dosis única (disparo ovulatorio) o 2–3×/semana (pautas crónicas)',
        'Single dose (ovulation trigger) or 2–3×/week (chronic regimens)',
      ),
    },
    reconstitution: t(
      'Vial liofilizado de 10.000 UI + 10 mL de disolvente (agua bacteriostática) → 1.000 UI/mL. Con esa concentración, en una jeringa de insulina U-100 (100 unidades = 1 mL): 500 UI = 50 unidades de la jeringa; 250 UI = 25 unidades; 1.000 UI = 100 unidades (1 mL completo). Reconstituir con un vial de 5 mL en lugar de 10 mL duplica la concentración a 2.000 UI/mL y, por tanto, halva el volumen. Una vez reconstituida, conservar en nevera y usar habitualmente en un plazo de 30 a 60 días según la ficha técnica y el disolvente.',
      'Lyophilised 10,000 IU vial + 10 mL diluent (bacteriostatic water) → 1,000 IU/mL. At that concentration, on a U-100 insulin syringe (100 units = 1 mL): 500 IU = 50 syringe units; 250 IU = 25 units; 1,000 IU = 100 units (a full 1 mL). Reconstituting with 5 mL instead of 10 mL doubles the concentration to 2,000 IU/mL and therefore halves the volume. Once reconstituted, refrigerate and typically use within 30 to 60 days depending on the label and the diluent.',
    ),
    storage: t(
      'Vial liofilizado: temperatura ambiente controlada (15–30 °C) protegido de la luz, según ficha técnica. Tras la reconstitución: nevera 2–8 °C. Las plumas precargadas de coriogonadotropina alfa se conservan refrigeradas.',
      'Lyophilised vial: controlled room temperature (15–30 °C) protected from light, per the label. After reconstitution: refrigerate 2–8 °C. Prefilled choriogonadotropin alfa pens are stored refrigerated.',
    ),
    adverseEffects: {
      common: [
        t(
          'Dolor y reacción local en el punto de inyección',
          'Pain and local reaction at the injection site',
        ),
        t(
          'Cefalea, irritabilidad, cansancio, edema leve',
          'Headache, irritability, fatigue, mild oedema',
        ),
        t(
          'Ginecomastia y acné por aromatización de la testosterona a estradiol',
          'Gynaecomastia and acne from aromatisation of testosterone to estradiol',
        ),
        t(
          'Distensión y molestia abdominal en ciclos de reproducción asistida',
          'Abdominal distension and discomfort in assisted reproduction cycles',
        ),
      ],
      serious: [
        t(
          'Síndrome de hiperestimulación ovárica, que puede cursar con ascitis, derrame pleural y hemoconcentración',
          'Ovarian hyperstimulation syndrome, which may involve ascites, pleural effusion and haemoconcentration',
        ),
        t('Embarazo múltiple', 'Multiple pregnancy'),
        t('Tromboembolismo arterial o venoso', 'Arterial or venous thromboembolism'),
        t('Pubertad precoz cuando se emplea en niños', 'Precocious puberty when used in children'),
      ],
    },
    contraindications: [
      t('Hipersensibilidad a la hCG', 'Hypersensitivity to hCG'),
      t('Pubertad precoz', 'Precocious puberty'),
      t(
        'Carcinomas hormonodependientes, incluido el de próstata',
        'Hormone-dependent carcinomas, including prostate cancer',
      ),
      t(
        'Sangrado uterino anormal de causa no filiada; quistes ováricos no debidos a poliquistosis',
        'Undiagnosed abnormal uterine bleeding; ovarian cysts not due to polycystic ovary syndrome',
      ),
    ],
    interactions: [
      t(
        'Gonadotropinas (FSH, hMG): efecto aditivo sobre la estimulación ovárica y mayor riesgo de hiperestimulación',
        'Gonadotropins (FSH, hMG): additive ovarian stimulation and higher hyperstimulation risk',
      ),
      t(
        'Inhibidores de la aromatasa (anastrozol) y moduladores del receptor de estrógeno (clomifeno, tamoxifeno): se combinan off-label para controlar el estradiol o reactivar el eje',
        'Aromatase inhibitors (anastrozole) and estrogen receptor modulators (clomiphene, tamoxifen): combined off-label to control estradiol or restart the axis',
      ),
      t(
        'Testosterona exógena: suprime la LH endógena, que es precisamente lo que la hCG intenta sustituir',
        'Exogenous testosterone: suppresses endogenous LH, which is precisely what hCG is intended to replace',
      ),
    ],
    monitoring: [
      t(
        'Testosterona total y libre, y estradiol (riesgo de aromatización excesiva)',
        'Total and free testosterone, and estradiol (risk of excessive aromatisation)',
      ),
      t(
        'Volumen testicular y seminograma cuando el objetivo es la fertilidad',
        'Testicular volume and semen analysis when fertility is the goal',
      ),
      t(
        'Hematocrito y PSA en varones tratados junto con testosterona',
        'Haematocrit and PSA in men treated together with testosterone',
      ),
      t(
        'Ecografía ovárica y estradiol seriado en estimulación ovárica',
        'Ovarian ultrasound and serial estradiol during ovarian stimulation',
      ),
    ],
    keyTrials: [],
    references: [
      { label: 'Pregnyl (chorionic gonadotropin) US Prescribing Information' },
      { label: 'Ovidrel (choriogonadotropin alfa) US Prescribing Information' },
      {
        label:
          'Endocrine Society Clinical Practice Guideline: Testosterone Therapy in Men with Hypogonadism',
      },
    ],
    tags: ['gonadotropina', 'fertilidad', 'testosterona', 'off-label', 'hipogonadismo'],
    lastReviewed: '2026-09-19',
  },

  {
    id: 'gonadorelin',
    names: {
      generic: 'Gonadorelina',
      brands: ['Factrel (descatalogado)', 'Lutrepulse (descatalogado)'],
      aliases: ['GnRH', 'LHRH', 'gonadorelin'],
    },
    category: 'hormonal',
    pharmClass: t('Decapéptido GnRH nativo', 'Native GnRH decapeptide'),
    summary: t(
      'Forma sintética idéntica a la hormona liberadora de gonadotropinas hipotalámica. Sus presentaciones comerciales están descatalogadas en Estados Unidos; hoy se obtiene sobre todo por formulación magistral y se usa off-label como adyuvante de la terapia con testosterona.',
      'Synthetic form identical to hypothalamic gonadotropin-releasing hormone. Its commercial presentations are discontinued in the United States; today it is mostly obtained through compounding and used off-label as an adjunct to testosterone therapy.',
    ),
    mechanism: t(
      'Estimula los receptores GnRH de la hipófisis anterior liberando LH y FSH. Administrada de forma pulsátil mantiene el eje; en exposición continua produce desensibilización y supresión, que es el fundamento de los agonistas de acción prolongada.',
      'Stimulates anterior pituitary GnRH receptors, releasing LH and FSH. Given in pulses it sustains the axis; with continuous exposure it causes desensitisation and suppression, which is the basis of long-acting agonists.',
    ),
    indications: [
      t(
        'Prueba diagnóstica de reserva gonadotropa hipofisaria (uso histórico)',
        'Diagnostic test of pituitary gonadotropin reserve (historical use)',
      ),
      t(
        'Amenorrea hipotalámica mediante bomba de infusión pulsátil (uso histórico)',
        'Hypothalamic amenorrhoea via pulsatile infusion pump (historical use)',
      ),
      t(
        'Uso off-label: mantenimiento de la función testicular durante terapia con testosterona, como alternativa a la hCG',
        'Off-label use: maintaining testicular function during testosterone therapy, as an alternative to hCG',
      ),
    ],
    evidence: 'fda_approved',
    regulatory: {
      us: 'compounded',
      eu: 'discontinued',
      notes: t(
        'Las especialidades farmacéuticas están descatalogadas; la disponibilidad actual procede de farmacias de formulación magistral. La FDA ha restringido la formulación magistral de varias sustancias peptídicas a granel al incluirlas en la categoría 2 de su lista de evaluación de sustancias, por dudas de seguridad, lo que ha limitado el acceso a este y a otros péptidos.',
        'The commercial products are discontinued; current availability comes from compounding pharmacies. The FDA has restricted compounding from several bulk peptide substances by placing them in category 2 of its bulk drug substances review list over safety concerns, which has limited access to this and other peptides.',
      ),
    },
    routes: ['sc', 'iv'],
    defaultUnit: 'mcg',
    pk: {
      halfLifeH: 0.07,
      tmaxH: 0.3,
      source: 'Datos farmacocinéticos históricos de Factrel: semivida plasmática de 2 a 10 minutos',
      notes:
        'Semivida muy corta (2–10 min) por degradación peptidasa: cada inyección genera un pulso breve de LH/FSH, no una estimulación sostenida. Este perfil pulsátil es el motivo por el que las pautas off-label requieren inyecciones frecuentes.',
    },
    dosing: {
      labeled: t(
        'Como prueba diagnóstica se administraban históricamente 100 microgramos por vía intravenosa o subcutánea con determinación seriada de LH. No existe hoy una ficha técnica vigente en la mayoría de mercados.',
        'As a diagnostic test, 100 micrograms were historically given intravenously or subcutaneously with serial LH sampling. There is no current label in most markets today.',
      ),
      anecdotal: t(
        'Uso no aprobado — en protocolos de medicina hormonal se describen dosis de 100–200 microgramos por vía subcutánea de una a varias veces al día junto con testosterona. La evidencia de eficacia para preservar la fertilidad es escasa y claramente inferior a la de la hCG, cuya semivida permite una estimulación mucho más sostenida.',
        'Unapproved use — hormone clinics describe 100–200 micrograms subcutaneously once to several times daily alongside testosterone. Evidence of efficacy for preserving fertility is scarce and clearly weaker than for hCG, whose half-life allows far more sustained stimulation.',
      ),
      frequency: t(
        '1–3×/día en las pautas off-label descritas',
        '1–3×/day in the described off-label regimens',
      ),
    },
    reconstitution: t(
      'Polvo liofilizado que se reconstituye con agua bacteriostática. Ejemplo habitual: vial de 10 mg + 10 mL → 1 mg/mL, de modo que 100 microgramos equivalen a 10 unidades en una jeringa U-100. Conservar refrigerado tras la reconstitución.',
      'Lyophilised powder reconstituted with bacteriostatic water. A common example: 10 mg vial + 10 mL → 1 mg/mL, so 100 micrograms equal 10 units on a U-100 syringe. Refrigerate after reconstitution.',
    ),
    storage: t(
      'Liofilizado: refrigerado y protegido de la luz. Reconstituido: nevera 2–8 °C, con caducidad fijada por la farmacia formuladora (habitualmente unas semanas). No congelar.',
      'Lyophilised: refrigerated and protected from light. Reconstituted: 2–8 °C, with a beyond-use date set by the compounding pharmacy (usually a few weeks). Do not freeze.',
    ),
    adverseEffects: {
      common: [
        t('Reacción local en el punto de inyección', 'Local injection-site reaction'),
        t('Cefalea, náuseas, molestias abdominales', 'Headache, nausea, abdominal discomfort'),
        t('Sofocos', 'Flushing'),
      ],
      serious: [
        t(
          'Reacciones de hipersensibilidad, incluida anafilaxia (raras)',
          'Hypersensitivity reactions including anaphylaxis (rare)',
        ),
        t(
          'Con exposición continua no pulsátil, supresión paradójica del eje gonadal',
          'With continuous non-pulsatile exposure, paradoxical suppression of the gonadal axis',
        ),
        t(
          'Riesgos de calidad y esterilidad propios de los preparados magistrales',
          'Quality and sterility risks inherent to compounded preparations',
        ),
      ],
    },
    contraindications: [
      t(
        'Hipersensibilidad a la gonadorelina o a análogos de GnRH',
        'Hypersensitivity to gonadorelin or GnRH analogues',
      ),
      t('Tumores hormonodependientes', 'Hormone-dependent tumours'),
      t('Embarazo y lactancia', 'Pregnancy and breastfeeding'),
    ],
    interactions: [
      t(
        'Andrógenos, estrógenos y progestágenos: suprimen la respuesta gonadotropa y reducen su efecto',
        'Androgens, estrogens and progestogens: suppress the gonadotropin response and reduce its effect',
      ),
      t(
        'Agonistas de GnRH de acción prolongada (leuprorelina, triptorelina): efecto antagónico funcional',
        'Long-acting GnRH agonists (leuprolide, triptorelin): functionally antagonistic effect',
      ),
      t(
        'Glucocorticoides y dopaminérgicos: pueden alterar la respuesta de LH en las pruebas diagnósticas',
        'Glucocorticoids and dopaminergic agents: may alter the LH response in diagnostic testing',
      ),
    ],
    monitoring: [
      t('LH, FSH, testosterona total y estradiol', 'LH, FSH, total testosterone and estradiol'),
      t(
        'Volumen testicular y seminograma si el objetivo es la fertilidad',
        'Testicular volume and semen analysis if fertility is the goal',
      ),
      t(
        'Procedencia y controles de calidad del preparado magistral',
        'Source and quality controls of the compounded preparation',
      ),
    ],
    keyTrials: [],
    references: [
      { label: 'Factrel (gonadorelin hydrochloride) historical Prescribing Information' },
      {
        label:
          'FDA list of bulk drug substances nominated for use in compounding under section 503A — category 2 peptides',
      },
    ],
    tags: ['gnrh', 'off-label', 'magistral', 'testosterona', 'fertilidad'],
    lastReviewed: '2026-09-19',
  },

  {
    id: 'triptorelin',
    names: {
      generic: 'Triptorelina',
      brands: ['Trelstar', 'Decapeptyl', 'Triptodur'],
      aliases: ['D-Trp6-LHRH', 'triptorelin'],
    },
    category: 'hormonal',
    pharmClass: t('Agonista de GnRH de acción prolongada', 'Long-acting GnRH agonist'),
    summary: t(
      'Análogo decapeptídico de GnRH con D-triptófano en posición 6, lo que aumenta su afinidad y resistencia a la degradación. En formulación depot produce, tras un brote inicial, una castración química mantenida.',
      'Decapeptide GnRH analogue with D-tryptophan at position 6, increasing affinity and resistance to degradation. In depot form it produces, after an initial flare, sustained chemical castration.',
    ),
    mechanism: t(
      'La estimulación continua del receptor GnRH hipofisario provoca primero un aumento de LH y FSH (efecto flare) y después una regulación a la baja y desensibilización del receptor, con caída de las gonadotropinas y de los esteroides sexuales a valores de castración en 2–4 semanas.',
      'Continuous stimulation of the pituitary GnRH receptor first raises LH and FSH (flare effect) and then downregulates and desensitises the receptor, with gonadotropins and sex steroids falling to castrate levels within 2–4 weeks.',
    ),
    indications: [
      t(
        'Cáncer de próstata avanzado hormonosensible',
        'Advanced hormone-sensitive prostate cancer',
      ),
      t('Pubertad precoz central (Triptodur)', 'Central precocious puberty (Triptodur)'),
      t(
        'Endometriosis, miomas uterinos y supresión hipofisaria en reproducción asistida (según mercado)',
        'Endometriosis, uterine fibroids and pituitary suppression in assisted reproduction (market-dependent)',
      ),
    ],
    evidence: 'fda_approved',
    regulatory: { us: 'approved', eu: 'approved' },
    routes: ['im', 'sc'],
    defaultUnit: 'mg',
    pk: {
      halfLifeH: 720,
      tmaxH: 3,
      source:
        'Trelstar US label §12.3: pico inicial en 1–4 h tras la inyección depot, con liberación mantenida durante 1, 3 o 6 meses según presentación',
      notes:
        'Cinética de flip-flop: tras el pico inicial por la fracción no encapsulada, la concentración plasmática está determinada por la degradación lenta de las microesferas de poliláctico-coglicólico, no por la eliminación del péptido (cuya semivida intrínseca es de horas). La semivida aparente de ~30 días refleja la liberación del depósito.',
    },
    dosing: {
      labeled: t(
        'Formulaciones depot intramusculares de 3,75 mg cada 4 semanas, 11,25 mg cada 12 semanas o 22,5 mg cada 24 semanas en cáncer de próstata. En pubertad precoz central, Triptodur 22,5 mg por vía intramuscular cada 24 semanas.',
        'Intramuscular depot formulations of 3.75 mg every 4 weeks, 11.25 mg every 12 weeks or 22.5 mg every 24 weeks in prostate cancer. In central precocious puberty, Triptodur 22.5 mg intramuscularly every 24 weeks.',
      ),
      frequency: t(
        'Cada 1, 3 o 6 meses según presentación',
        'Every 1, 3 or 6 months depending on the presentation',
      ),
    },
    reconstitution: t(
      'Microesferas liofilizadas que se reconstituyen con el disolvente acuoso incluido inmediatamente antes de la inyección; la suspensión debe administrarse enseguida porque sedimenta y puede obstruir la aguja.',
      'Lyophilised microspheres reconstituted with the supplied aqueous diluent immediately before injection; the suspension must be given at once because it settles and can block the needle.',
    ),
    storage: t(
      'Conservar a temperatura ambiente controlada (20–25 °C) protegido de la luz; no refrigerar el kit. Usar inmediatamente tras la reconstitución.',
      'Store at controlled room temperature (20–25 °C) protected from light; do not refrigerate the kit. Use immediately after reconstitution.',
    ),
    adverseEffects: {
      common: [
        t('Sofocos y sudoración', 'Hot flushes and sweating'),
        t(
          'Disminución de la libido y disfunción eréctil',
          'Reduced libido and erectile dysfunction',
        ),
        t('Dolor en el punto de inyección', 'Injection-site pain'),
        t('Fatiga, cambios de ánimo, cefalea', 'Fatigue, mood changes, headache'),
      ],
      serious: [
        t(
          'Efecto flare inicial con empeoramiento clínico: dolor óseo, obstrucción urinaria o compresión medular en enfermedad metastásica',
          'Initial flare with clinical worsening: bone pain, urinary obstruction or spinal cord compression in metastatic disease',
        ),
        t(
          'Pérdida de densidad mineral ósea y fracturas con el uso prolongado',
          'Loss of bone mineral density and fractures with prolonged use',
        ),
        t(
          'Síndrome metabólico, diabetes y aumento del riesgo cardiovascular',
          'Metabolic syndrome, diabetes and increased cardiovascular risk',
        ),
        t(
          'Prolongación del QT por la deprivación androgénica',
          'QT prolongation from androgen deprivation',
        ),
        t(
          'Apoplejía hipofisaria (rara, típicamente tras la primera dosis en adenoma no diagnosticado)',
          'Pituitary apoplexy (rare, typically after the first dose in an undiagnosed adenoma)',
        ),
      ],
    },
    contraindications: [
      t(
        'Hipersensibilidad a la triptorelina o a otros análogos de GnRH',
        'Hypersensitivity to triptorelin or other GnRH analogues',
      ),
      t('Embarazo y lactancia', 'Pregnancy and breastfeeding'),
    ],
    interactions: [
      t(
        'Fármacos que prolongan el QT: efecto aditivo con la deprivación androgénica',
        'QT-prolonging drugs: additive effect with androgen deprivation',
      ),
      t(
        'Fármacos hiperprolactinemiantes: pueden interferir en la respuesta hipofisaria',
        'Drugs that raise prolactin: may interfere with the pituitary response',
      ),
      t(
        'Antiandrógenos: se asocian en las primeras semanas precisamente para bloquear el efecto flare',
        'Antiandrogens: combined in the first weeks precisely to block the flare effect',
      ),
    ],
    monitoring: [
      t('Testosterona y PSA en cáncer de próstata', 'Testosterone and PSA in prostate cancer'),
      t(
        'Densitometría ósea periódica en tratamientos prolongados',
        'Periodic bone densitometry with prolonged treatment',
      ),
      t('Glucemia, HbA1c y perfil lipídico', 'Glucose, HbA1c and lipid profile'),
      t(
        'En pubertad precoz: estadio de Tanner, velocidad de crecimiento, edad ósea y LH estimulada',
        'In precocious puberty: Tanner stage, growth velocity, bone age and stimulated LH',
      ),
    ],
    keyTrials: [],
    references: [
      { label: 'Trelstar (triptorelin pamoate) US Prescribing Information' },
      { label: 'Triptodur (triptorelin) US Prescribing Information' },
    ],
    tags: ['gnrh', 'agonista', 'depot', 'prostata', 'pubertad-precoz'],
    lastReviewed: '2026-09-19',
  },

  {
    id: 'leuprolide',
    names: {
      generic: 'Leuprorelina (leuprolide)',
      brands: ['Lupron Depot', 'Eligard', 'Camcevi', 'Fensolvi'],
      aliases: ['leuprorelin', 'LHRH agonist'],
    },
    category: 'hormonal',
    pharmClass: t('Agonista de GnRH de acción prolongada', 'Long-acting GnRH agonist'),
    summary: t(
      'Nonapéptido agonista de GnRH, el más utilizado de su clase. Sus formulaciones depot, intramusculares o subcutáneas, mantienen concentraciones de castración durante 1 a 6 meses.',
      'Nonapeptide GnRH agonist, the most widely used of its class. Its depot formulations, intramuscular or subcutaneous, maintain castrate concentrations for 1 to 6 months.',
    ),
    mechanism: t(
      'Tras un brote inicial de LH y FSH, la ocupación continua del receptor GnRH produce desensibilización e internalización, suprimiendo la esteroidogénesis gonadal hasta valores de castración (testosterona <50 ng/dL, habitualmente <20 ng/dL con las formulaciones actuales).',
      'After an initial LH and FSH surge, continuous GnRH receptor occupancy causes desensitisation and internalisation, suppressing gonadal steroidogenesis to castrate levels (testosterone <50 ng/dL, usually <20 ng/dL with current formulations).',
    ),
    indications: [
      t(
        'Cáncer de próstata avanzado hormonosensible',
        'Advanced hormone-sensitive prostate cancer',
      ),
      t(
        'Pubertad precoz central (Fensolvi, Lupron Depot-PED)',
        'Central precocious puberty (Fensolvi, Lupron Depot-PED)',
      ),
      t('Endometriosis y miomas uterinos', 'Endometriosis and uterine fibroids'),
      t(
        'Supresión hipofisaria en ciclos de reproducción asistida',
        'Pituitary suppression in assisted reproduction cycles',
      ),
      t(
        'Supresión hormonal en tratamiento de afirmación de género',
        'Hormonal suppression in gender-affirming care',
      ),
    ],
    evidence: 'fda_approved',
    regulatory: { us: 'approved', eu: 'approved' },
    routes: ['im', 'sc'],
    defaultUnit: 'mg',
    pk: {
      halfLifeH: 3,
      tmaxH: 4,
      source:
        'Lupron Depot / Eligard US label §12.3: semivida intrínseca del péptido ≈ 3 h; la liberación depot mantiene concentraciones durante 1–6 meses',
      notes:
        'Cinética de flip-flop marcada: la semivida terminal aparente refleja la disolución de las microesferas (Lupron) o la solidificación del polímero Atrigel (Eligard), no la eliminación del péptido, cuya semivida real es de unas 3 horas. El motor farmacocinético no reproduce bien este perfil de liberación de orden cero.',
    },
    dosing: {
      labeled: t(
        'Cáncer de próstata: formulaciones depot de 7,5 mg al mes, 22,5 mg cada 3 meses, 30 mg cada 4 meses o 45 mg cada 6 meses, por vía intramuscular o subcutánea según producto. Endometriosis: 3,75 mg al mes o 11,25 mg cada 3 meses, con duración total limitada por la pérdida ósea. Pubertad precoz: dosis ajustada al peso.',
        'Prostate cancer: depot formulations of 7.5 mg monthly, 22.5 mg every 3 months, 30 mg every 4 months or 45 mg every 6 months, intramuscularly or subcutaneously depending on the product. Endometriosis: 3.75 mg monthly or 11.25 mg every 3 months, with total duration limited by bone loss. Precocious puberty: weight-adjusted dosing.',
      ),
      frequency: t('Cada 1, 3, 4 o 6 meses', 'Every 1, 3, 4 or 6 months'),
    },
    reconstitution: t(
      'Lupron Depot: kit de microesferas liofilizadas con jeringa precargada de doble cámara, que se mezcla y se inyecta inmediatamente. Eligard: dos jeringas (polvo y vehículo Atrigel) que se acoplan y se mezclan unas 45 veces; debe inyectarse en los 30 minutos siguientes y alcanzar temperatura ambiente antes de mezclar.',
      'Lupron Depot: a kit of lyophilised microspheres in a dual-chamber prefilled syringe, mixed and injected immediately. Eligard: two syringes (powder and Atrigel vehicle) that are coupled and mixed about 45 times; it must be injected within 30 minutes and be at room temperature before mixing.',
    ),
    storage: t(
      'Lupron Depot: temperatura ambiente controlada. Eligard: nevera 2–8 °C; sacar y dejar atemperar unos 30 minutos antes de preparar. Proteger de la luz y usar inmediatamente tras la mezcla.',
      'Lupron Depot: controlled room temperature. Eligard: refrigerate 2–8 °C; remove and let it reach room temperature about 30 minutes before preparation. Protect from light and use immediately after mixing.',
    ),
    adverseEffects: {
      common: [
        t(
          'Sofocos (hasta más del 50% de los pacientes)',
          'Hot flushes (in more than 50% of patients)',
        ),
        t(
          'Disminución de la libido, disfunción eréctil, atrofia testicular',
          'Reduced libido, erectile dysfunction, testicular atrophy',
        ),
        t('Fatiga, labilidad emocional, insomnio', 'Fatigue, emotional lability, insomnia'),
        t('Reacción y nódulo en el punto de inyección', 'Injection-site reaction and nodule'),
        t('Ganancia de peso y pérdida de masa magra', 'Weight gain and loss of lean mass'),
      ],
      serious: [
        t(
          'Efecto flare inicial con dolor óseo, obstrucción urinaria o compresión medular',
          'Initial flare with bone pain, urinary obstruction or spinal cord compression',
        ),
        t('Osteoporosis y fracturas por fragilidad', 'Osteoporosis and fragility fractures'),
        t(
          'Diabetes de nueva aparición y eventos cardiovasculares',
          'New-onset diabetes and cardiovascular events',
        ),
        t('Prolongación del intervalo QT', 'QT interval prolongation'),
        t('Convulsiones y apoplejía hipofisaria (raras)', 'Seizures and pituitary apoplexy (rare)'),
      ],
    },
    contraindications: [
      t(
        'Hipersensibilidad a la leuprorelina, a otros análogos de GnRH o a los excipientes',
        'Hypersensitivity to leuprolide, other GnRH analogues or the excipients',
      ),
      t('Embarazo y lactancia', 'Pregnancy and breastfeeding'),
      t('Sangrado vaginal de causa no diagnosticada', 'Undiagnosed vaginal bleeding'),
    ],
    interactions: [
      t('Fármacos que prolongan el QT: efecto aditivo', 'QT-prolonging drugs: additive effect'),
      t(
        'Antiandrógenos (bicalutamida, flutamida): se inician antes para prevenir el flare',
        'Antiandrogens (bicalutamide, flutamide): started beforehand to prevent the flare',
      ),
      t(
        'Terapia añadida (add-back) con estrógeno/progestágeno o bisfosfonatos: mitiga la pérdida ósea en tratamientos prolongados',
        'Add-back therapy with estrogen/progestogen or bisphosphonates: mitigates bone loss with prolonged treatment',
      ),
    ],
    monitoring: [
      t('Testosterona y PSA en cáncer de próstata', 'Testosterone and PSA in prostate cancer'),
      t(
        'Densidad mineral ósea y vitamina D en tratamientos de más de 6 meses',
        'Bone mineral density and vitamin D with treatment beyond 6 months',
      ),
      t(
        'Glucemia, HbA1c, perfil lipídico y presión arterial',
        'Glucose, HbA1c, lipid profile and blood pressure',
      ),
      t(
        'En pubertad precoz: crecimiento, edad ósea y estadio puberal',
        'In precocious puberty: growth, bone age and pubertal stage',
      ),
    ],
    keyTrials: [],
    references: [
      { label: 'Lupron Depot (leuprolide acetate) US Prescribing Information' },
      { label: 'Eligard (leuprolide acetate) US Prescribing Information' },
    ],
    tags: ['gnrh', 'agonista', 'depot', 'prostata', 'endometriosis'],
    lastReviewed: '2026-09-19',
  },

  {
    id: 'degarelix',
    names: {
      generic: 'Degarelix',
      brands: ['Firmagon'],
      aliases: ['FE200486', 'antagonista de GnRH'],
    },
    category: 'hormonal',
    pharmClass: t('Antagonista del receptor de GnRH', 'GnRH receptor antagonist'),
    summary: t(
      'Decapéptido antagonista competitivo del receptor de GnRH que suprime la testosterona en días, sin el efecto flare inicial característico de los agonistas.',
      'Decapeptide competitive GnRH receptor antagonist that suppresses testosterone within days, without the initial flare characteristic of agonists.',
    ),
    mechanism: t(
      'Bloquea de forma inmediata y reversible el receptor GnRH hipofisario, impidiendo la liberación de LH y FSH. Consigue concentraciones de castración en unos 3 días sin estímulo previo, por lo que no requiere cobertura con antiandrógeno.',
      'Immediately and reversibly blocks the pituitary GnRH receptor, preventing LH and FSH release. It achieves castrate concentrations in about 3 days without prior stimulation, so no antiandrogen cover is needed.',
    ),
    indications: [
      t(
        'Cáncer de próstata avanzado hormonosensible',
        'Advanced hormone-sensitive prostate cancer',
      ),
      t(
        'Situaciones en que el efecto flare sería peligroso: compresión medular inminente, obstrucción urinaria, gran carga metastásica',
        'Situations where a flare would be dangerous: impending cord compression, urinary obstruction, high metastatic burden',
      ),
    ],
    evidence: 'fda_approved',
    regulatory: { us: 'approved', eu: 'approved' },
    routes: ['sc'],
    defaultUnit: 'mg',
    pk: {
      halfLifeH: 1128,
      tmaxH: 48,
      source:
        'Firmagon US label §12.3: t½ terminal ≈ 47 días tras dosis subcutánea de carga; tmax ≈ 2 días',
      notes:
        'Forma un depósito gel en el tejido subcutáneo del que se libera lentamente: la semivida terminal de ~47 días es de nuevo un fenómeno de flip-flop determinado por la disolución del depósito.',
    },
    dosing: {
      labeled: t(
        'Dosis de carga de 240 mg administrada en dos inyecciones subcutáneas de 120 mg (40 mg/mL), seguida de 80 mg (20 mg/mL) por vía subcutánea cada 28 días. Siempre en el abdomen, en zona no sometida a presión.',
        'A 240 mg loading dose given as two 120 mg subcutaneous injections (40 mg/mL), followed by 80 mg (20 mg/mL) subcutaneously every 28 days. Always in the abdomen, in an area not exposed to pressure.',
      ),
      frequency: t('Carga inicial y después 1×/28 días', 'Initial loading dose then every 28 days'),
    },
    reconstitution: t(
      'Vial liofilizado que se reconstituye con agua para inyección y se agita suavemente sin sacudir hasta obtener una solución transparente; puede tardar varios minutos. Administrar en los 60 minutos siguientes.',
      'Lyophilised vial reconstituted with water for injection and swirled gently without shaking until a clear solution is obtained; this may take several minutes. Administer within 60 minutes.',
    ),
    storage: t(
      'Viales sin reconstituir: temperatura ambiente controlada (25 °C). Una vez reconstituido, usar en 60 minutos; no refrigerar la solución preparada.',
      'Unreconstituted vials: controlled room temperature (25 °C). Once reconstituted, use within 60 minutes; do not refrigerate the prepared solution.',
    ),
    adverseEffects: {
      common: [
        t(
          'Reacciones en el punto de inyección: dolor, eritema, induración y nódulo (muy frecuentes con la dosis de carga)',
          'Injection-site reactions: pain, erythema, induration and nodule (very common with the loading dose)',
        ),
        t('Sofocos', 'Hot flushes'),
        t('Aumento de peso y fatiga', 'Weight gain and fatigue'),
        t('Elevación de transaminasas', 'Transaminase elevation'),
      ],
      serious: [
        t(
          'Reacciones de hipersensibilidad, incluida anafilaxia',
          'Hypersensitivity reactions including anaphylaxis',
        ),
        t(
          'Prolongación del QT por deprivación androgénica',
          'QT prolongation from androgen deprivation',
        ),
        t('Pérdida de masa ósea y fracturas', 'Bone loss and fractures'),
        t(
          'Alteraciones metabólicas: hiperglucemia y dislipidemia',
          'Metabolic disturbance: hyperglycaemia and dyslipidaemia',
        ),
      ],
    },
    contraindications: [
      t(
        'Hipersensibilidad conocida al degarelix o a cualquiera de sus excipientes',
        'Known hypersensitivity to degarelix or any of its excipients',
      ),
      t('Embarazo (no procede: uso en varones)', 'Pregnancy (not applicable: used in men)'),
    ],
    interactions: [
      t(
        'Fármacos que prolongan el QT: valorar el riesgo conjunto',
        'QT-prolonging drugs: assess combined risk',
      ),
      t(
        'No presenta interacciones relevantes mediadas por citocromo P450',
        'No relevant cytochrome P450-mediated interactions',
      ),
    ],
    monitoring: [
      t('Testosterona y PSA', 'Testosterone and PSA'),
      t('Transaminasas periódicamente', 'Transaminases periodically'),
      t(
        'Densidad mineral ósea, glucemia y perfil lipídico en tratamiento prolongado',
        'Bone mineral density, glucose and lipid profile with prolonged treatment',
      ),
      t(
        'ECG y electrolitos en pacientes con riesgo de QT largo',
        'ECG and electrolytes in patients at risk of long QT',
      ),
    ],
    keyTrials: [],
    references: [{ label: 'Firmagon (degarelix) US Prescribing Information' }],
    tags: ['gnrh', 'antagonista', 'prostata', 'sin-flare'],
    lastReviewed: '2026-09-19',
  },

  {
    id: 'desmopressin',
    names: {
      generic: 'Desmopresina',
      brands: ['DDAVP', 'Minirin', 'Nocdurna', 'Noctiva', 'Stimate'],
      aliases: ['DDAVP', '1-desamino-8-D-arginina vasopresina'],
    },
    category: 'hormonal',
    pharmClass: t(
      'Análogo sintético de vasopresina, agonista selectivo V2',
      'Synthetic vasopressin analogue, selective V2 agonist',
    ),
    summary: t(
      'Análogo de la vasopresina con selectividad por el receptor V2 y mínima actividad vasopresora V1, empleado en diabetes insípida central, enuresis nocturna y trastornos hemorrágicos leves.',
      'Vasopressin analogue selective for the V2 receptor with minimal V1 vasopressor activity, used in central diabetes insipidus, nocturnal enuresis and mild bleeding disorders.',
    ),
    mechanism: t(
      'Activa los receptores V2 del túbulo colector renal, insertando acuaporina 2 en la membrana apical y aumentando la reabsorción de agua libre. A dosis altas libera factor VIII y factor de von Willebrand del endotelio, lo que sustenta su uso hemostático.',
      'Activates V2 receptors in the renal collecting duct, inserting aquaporin 2 into the apical membrane and increasing free water reabsorption. At high doses it releases factor VIII and von Willebrand factor from the endothelium, underpinning its haemostatic use.',
    ),
    indications: [
      t(
        'Diabetes insípida central (arginina-vasopresina deficiente)',
        'Central diabetes insipidus (arginine vasopressin deficiency)',
      ),
      t(
        'Enuresis nocturna primaria y nicturia por poliuria nocturna',
        'Primary nocturnal enuresis and nocturia due to nocturnal polyuria',
      ),
      t(
        'Hemofilia A leve y enfermedad de von Willebrand tipo 1',
        'Mild haemophilia A and type 1 von Willebrand disease',
      ),
      t(
        'Prueba de concentración urinaria en el estudio de poliuria',
        'Urinary concentration testing in the work-up of polyuria',
      ),
    ],
    evidence: 'fda_approved',
    regulatory: {
      us: 'approved',
      eu: 'approved',
      notes: t(
        'La ficha técnica incluye una advertencia destacada sobre hiponatremia, especialmente con las formulaciones nasales y en mayores de 65 años.',
        'The label carries a prominent warning about hyponatraemia, particularly with the nasal formulations and in people over 65.',
      ),
    },
    routes: ['oral', 'nasal', 'sl', 'iv', 'sc'],
    defaultUnit: 'mcg',
    pk: {
      halfLifeH: 3,
      tmaxH: 1,
      bioavailability: 0.04,
      source:
        'DDAVP US label §12.3: biodisponibilidad nasal ≈ 3–5% y oral ≈ 0,1%; t½ terminal ≈ 3 h (nasal), tmax ≈ 40–55 min',
      notes:
        'Biodisponibilidad muy distinta según vía: intranasal 3–5%, oral ~0,1%, sublingual algo mayor que la oral. De ahí las enormes diferencias de dosis entre presentaciones; la duración del efecto antidiurético (6–12 h) supera a la semivida plasmática.',
    },
    dosing: {
      labeled: t(
        'Diabetes insípida central: 10–40 microgramos al día por vía intranasal repartidos en 1–3 tomas, o 0,1–1,2 mg al día por vía oral en 2–3 tomas; por vía parenteral, 2–4 microgramos al día en dos dosis. Enuresis nocturna: 0,2–0,6 mg orales al acostarse. Hemostasia: 0,3 microgramos/kg por vía intravenosa en 15–30 minutos. Siempre la dosis mínima eficaz y titulada por diuresis y natremia.',
        'Central diabetes insipidus: 10–40 micrograms daily intranasally in 1–3 doses, or 0.1–1.2 mg daily orally in 2–3 doses; parenterally, 2–4 micrograms daily in two doses. Nocturnal enuresis: 0.2–0.6 mg orally at bedtime. Haemostasis: 0.3 micrograms/kg intravenously over 15–30 minutes. Always the lowest effective dose, titrated by urine output and serum sodium.',
      ),
      frequency: t('1–3×/día según indicación y vía', '1–3×/day depending on indication and route'),
    },
    storage: t(
      'Comprimidos y liofilizados sublinguales: temperatura ambiente, protegidos de la humedad. Soluciones nasales e inyectables: nevera 2–8 °C; algunas presentaciones nasales admiten temperatura ambiente durante un periodo limitado según ficha técnica. No congelar.',
      'Tablets and sublingual lyophilisates: room temperature, protected from moisture. Nasal and injectable solutions: refrigerate 2–8 °C; some nasal presentations allow room temperature for a limited period per the label. Do not freeze.',
    ),
    adverseEffects: {
      common: [
        t('Cefalea', 'Headache'),
        t('Náuseas y dolor abdominal', 'Nausea and abdominal pain'),
        t(
          'Congestión nasal, epistaxis y rinitis con las formulaciones nasales',
          'Nasal congestion, epistaxis and rhinitis with nasal formulations',
        ),
        t(
          'Rubefacción facial y ligero aumento de la presión arterial',
          'Facial flushing and slight blood pressure increase',
        ),
      ],
      serious: [
        t(
          'Hiponatremia dilucional con convulsiones, edema cerebral y coma: el riesgo clave del fármaco',
          'Dilutional hyponatraemia with seizures, cerebral oedema and coma: the drug’s key risk',
        ),
        t(
          'Intoxicación hídrica si no se restringe la ingesta de líquidos',
          'Water intoxication if fluid intake is not restricted',
        ),
        t(
          'Eventos trombóticos tras dosis hemostáticas en pacientes con riesgo cardiovascular',
          'Thrombotic events after haemostatic doses in patients at cardiovascular risk',
        ),
      ],
    },
    contraindications: [
      t(
        'Hiponatremia o antecedente de hiponatremia',
        'Hyponatraemia or a history of hyponatraemia',
      ),
      t('Aclaramiento de creatinina inferior a 50 mL/min', 'Creatinine clearance below 50 mL/min'),
      t('Polidipsia primaria o psicógena', 'Primary or psychogenic polydipsia'),
      t(
        'Insuficiencia cardiaca o cualquier situación que requiera tratamiento diurético',
        'Heart failure or any condition requiring diuretic therapy',
      ),
      t('SIADH', 'SIADH'),
      t('Hipersensibilidad a la desmopresina', 'Hypersensitivity to desmopressin'),
    ],
    interactions: [
      t(
        'ISRS, tricíclicos, carbamazepina, clorpropamida, lamotrigina y AINE: aumentan el riesgo de hiponatremia',
        'SSRIs, tricyclics, carbamazepine, chlorpropamide, lamotrigine and NSAIDs: increase the risk of hyponatraemia',
      ),
      t(
        'Glucocorticoides y diuréticos de asa: alteran el balance hídrico y sódico',
        'Glucocorticoids and loop diuretics: alter fluid and sodium balance',
      ),
      t(
        'Demeclociclina y litio: antagonizan el efecto antidiurético',
        'Demeclocycline and lithium: antagonise the antidiuretic effect',
      ),
    ],
    monitoring: [
      t(
        'Sodio sérico: basal, a los 3–7 días del inicio o de cada aumento de dosis, y después periódicamente',
        'Serum sodium: at baseline, 3–7 days after starting or after each dose increase, and periodically thereafter',
      ),
      t('Balance hídrico, peso diario y diuresis', 'Fluid balance, daily weight and urine output'),
      t('Osmolalidad plasmática y urinaria', 'Plasma and urine osmolality'),
      t(
        'Presión arterial y signos de sobrecarga de volumen',
        'Blood pressure and signs of volume overload',
      ),
    ],
    keyTrials: [],
    references: [
      { label: 'DDAVP (desmopressin acetate) US Prescribing Information' },
      {
        label:
          'Endocrine Society / European guidance on the diagnosis and management of arginine vasopressin deficiency',
      },
    ],
    tags: ['vasopresina', 'diabetes-insipida', 'hiponatremia', 'enuresis', 'nicturia'],
    lastReviewed: '2026-09-19',
  },

  {
    id: 'teriparatide',
    names: {
      generic: 'Teriparatida',
      brands: ['Forteo', 'Forsteo', 'Bonsity'],
      aliases: ['PTH(1-34)', 'rhPTH(1-34)'],
    },
    category: 'hormonal',
    pharmClass: t('Análogo de PTH; anabólico óseo', 'PTH analogue; bone anabolic'),
    summary: t(
      'Fragmento 1-34 recombinante de la paratohormona humana. Administrado en pulso diario estimula preferentemente la formación ósea sobre la resorción, aumentando la densidad mineral y reduciendo fracturas vertebrales y no vertebrales.',
      'Recombinant 1-34 fragment of human parathyroid hormone. Given as a daily pulse it preferentially stimulates bone formation over resorption, increasing bone mineral density and reducing vertebral and non-vertebral fractures.',
    ),
    mechanism: t(
      'Activa el receptor PTH1R en osteoblastos y osteocitos; la exposición intermitente favorece la supervivencia del osteoblasto y la señalización Wnt (con descenso de esclerostina), con una ventana anabólica inicial en la que la formación supera a la resorción. La exposición continua, en cambio, es catabólica.',
      'Activates the PTH1R receptor on osteoblasts and osteocytes; intermittent exposure favours osteoblast survival and Wnt signalling (with falling sclerostin), producing an initial anabolic window in which formation exceeds resorption. Continuous exposure, by contrast, is catabolic.',
    ),
    indications: [
      t(
        'Osteoporosis posmenopáusica con alto riesgo de fractura',
        'Postmenopausal osteoporosis at high risk of fracture',
      ),
      t(
        'Osteoporosis en varones con alto riesgo de fractura',
        'Osteoporosis in men at high risk of fracture',
      ),
      t('Osteoporosis inducida por glucocorticoides', 'Glucocorticoid-induced osteoporosis'),
    ],
    evidence: 'fda_approved',
    regulatory: {
      us: 'approved',
      eu: 'approved',
      notes: t(
        'La advertencia de recuadro negro sobre osteosarcoma se retiró en 2020, junto con el límite estricto de 2 años de tratamiento de por vida; se mantiene la precaución en pacientes de riesgo.',
        'The boxed warning on osteosarcoma was removed in 2020, along with the strict lifetime 2-year treatment limit; caution remains in at-risk patients.',
      ),
    },
    routes: ['sc'],
    defaultUnit: 'mcg',
    pk: {
      halfLifeH: 1,
      tmaxH: 0.5,
      bioavailability: 0.95,
      source:
        'Forteo US label §12.3: biodisponibilidad SC ≈ 95%, tmax ≈ 30 min, t½ ≈ 1 h tras dosis subcutánea (5 min por vía intravenosa)',
      notes:
        'La brevedad de la exposición es esencial: el pulso corto diario es lo que produce el efecto anabólico. Una exposición sostenida invertiría el balance hacia la resorción.',
    },
    dosing: {
      labeled: t(
        'Veinte microgramos al día por vía subcutánea en muslo o abdomen. La primera dosis debe administrarse con el paciente sentado o tumbado por el riesgo de hipotensión ortostática. La duración habitual del tratamiento es de hasta 24 meses, seguida siempre de un antirresortivo para conservar la ganancia ósea.',
        'Twenty micrograms daily subcutaneously in the thigh or abdomen. The first dose should be given with the patient seated or lying down because of the risk of orthostatic hypotension. Treatment usually lasts up to 24 months, always followed by an antiresorptive to preserve the bone gained.',
      ),
      frequency: t('1×/día', 'Once daily'),
    },
    storage: t(
      'Pluma precargada: nevera 2–8 °C en todo momento, también durante el periodo de uso, que es de 28 días tras la primera inyección. No congelar; desechar si se ha congelado. Proteger de la luz.',
      'Prefilled pen: refrigerate 2–8 °C at all times, including during the in-use period of 28 days after the first injection. Do not freeze; discard if frozen. Protect from light.',
    ),
    adverseEffects: {
      common: [
        t('Náuseas', 'Nausea'),
        t('Artralgias y dolor en extremidades', 'Arthralgia and pain in extremities'),
        t('Cefalea y mareo', 'Headache and dizziness'),
        t(
          'Hipotensión ortostática transitoria en las primeras dosis',
          'Transient orthostatic hypotension with the first doses',
        ),
        t('Calambres en las piernas', 'Leg cramps'),
      ],
      serious: [
        t(
          'Hipercalcemia, habitualmente leve y transitoria',
          'Hypercalcaemia, usually mild and transient',
        ),
        t('Hipercalciuria y litiasis renal', 'Hypercalciuria and renal stones'),
        t(
          'Osteosarcoma: señal observada en rata a dosis altas y durante toda la vida; el riesgo en humanos no se ha confirmado en los estudios de vigilancia poscomercialización',
          'Osteosarcoma: signal seen in rats at high, lifelong doses; the risk in humans has not been confirmed in post-marketing surveillance studies',
        ),
      ],
    },
    contraindications: [
      t(
        'Antecedente de osteosarcoma o de otra neoplasia ósea primaria',
        'History of osteosarcoma or other primary bone malignancy',
      ),
      t(
        'Enfermedad de Paget ósea o elevación inexplicada de la fosfatasa alcalina',
        'Paget disease of bone or unexplained elevation of alkaline phosphatase',
      ),
      t(
        'Radioterapia externa o con implantes sobre el esqueleto',
        'Prior external beam or implant radiation involving the skeleton',
      ),
      t(
        'Metástasis óseas o hipercalcemia preexistente, incluido el hiperparatiroidismo',
        'Bone metastases or pre-existing hypercalcaemia, including hyperparathyroidism',
      ),
      t(
        'Epífisis abiertas (pacientes pediátricos y adultos jóvenes)',
        'Open epiphyses (paediatric patients and young adults)',
      ),
    ],
    interactions: [
      t(
        'Digoxina: la hipercalcemia puede predisponer a toxicidad digitálica',
        'Digoxin: hypercalcaemia may predispose to digitalis toxicity',
      ),
      t(
        'Suplementos de calcio y vitamina D: necesarios, pero pueden favorecer la hipercalcemia',
        'Calcium and vitamin D supplements: necessary, but may promote hypercalcaemia',
      ),
      t(
        'Bisfosfonatos concomitantes: pueden atenuar la respuesta anabólica si se administran de forma simultánea',
        'Concomitant bisphosphonates: may blunt the anabolic response if given simultaneously',
      ),
    ],
    monitoring: [
      t(
        'Calcio sérico (y corregido por albúmina), idealmente 16 horas después de la dosis',
        'Serum calcium (albumin-corrected), ideally 16 hours after the dose',
      ),
      t(
        'Calcio urinario en 24 horas si hay antecedente de litiasis',
        'Twenty-four-hour urinary calcium if there is a history of stones',
      ),
      t(
        'Vitamina D, función renal y fosfatasa alcalina',
        'Vitamin D, renal function and alkaline phosphatase',
      ),
      t(
        'Densitometría ósea a los 12–24 meses y planificación del tratamiento secuencial antirresortivo',
        'Bone densitometry at 12–24 months and planning of sequential antiresorptive therapy',
      ),
    ],
    keyTrials: [
      {
        name: 'Fracture Prevention Trial',
        year: 2001,
        finding: t(
          'En mujeres posmenopáusicas con fractura vertebral previa, teriparatida redujo un 65% las fracturas vertebrales nuevas y un 53% las no vertebrales frente a placebo.',
          'In postmenopausal women with a prior vertebral fracture, teriparatide reduced new vertebral fractures by 65% and non-vertebral fractures by 53% versus placebo.',
        ),
        ref: 'NEJM 2001;344:1434',
      },
      {
        name: 'VERO',
        year: 2018,
        finding: t(
          'Teriparatida fue superior a risedronato en la reducción de fracturas vertebrales y clínicas en osteoporosis grave.',
          'Teriparatide was superior to risedronate in reducing vertebral and clinical fractures in severe osteoporosis.',
        ),
        ref: 'Lancet 2018;391:230',
      },
    ],
    references: [
      { label: 'Forteo (teriparatide) US Prescribing Information' },
      {
        label:
          'Endocrine Society Clinical Practice Guideline: Pharmacological Management of Osteoporosis in Postmenopausal Women',
      },
    ],
    tags: ['pth', 'osteoporosis', 'anabolico-oseo', 'calcio'],
    lastReviewed: '2026-09-19',
  },

  {
    id: 'abaloparatide',
    names: {
      generic: 'Abaloparatida',
      brands: ['Tymlos', 'Eladynos'],
      aliases: ['BA058', 'PTHrP(1-34) analógico'],
    },
    category: 'hormonal',
    pharmClass: t('Análogo de PTHrP; anabólico óseo', 'PTHrP analogue; bone anabolic'),
    summary: t(
      'Análogo sintético del fragmento 1-34 de la proteína relacionada con la paratohormona, con preferencia por la conformación RG del receptor PTH1R, lo que produce un efecto anabólico con menor tendencia a la hipercalcemia que la teriparatida.',
      'Synthetic analogue of the 1-34 fragment of parathyroid hormone-related protein, with preference for the RG conformation of the PTH1R receptor, producing an anabolic effect with less tendency to hypercalcaemia than teriparatide.',
    ),
    mechanism: t(
      'Se une selectivamente a la conformación RG, de señalización más transitoria, del receptor PTH1R. El resultado es una activación anabólica marcada con una elevación menor y más breve del calcio sérico y de los marcadores de resorción.',
      'Binds selectively to the more transiently signalling RG conformation of the PTH1R receptor. The result is marked anabolic activation with a smaller and briefer rise in serum calcium and resorption markers.',
    ),
    indications: [
      t(
        'Osteoporosis posmenopáusica con alto riesgo de fractura',
        'Postmenopausal osteoporosis at high risk of fracture',
      ),
      t(
        'Osteoporosis en varones con alto riesgo de fractura',
        'Osteoporosis in men at high risk of fracture',
      ),
    ],
    evidence: 'fda_approved',
    regulatory: {
      us: 'approved',
      eu: 'approved',
      notes: t(
        'La advertencia de recuadro negro sobre osteosarcoma y el límite de 2 años de tratamiento se retiraron en 2021. En Europa se comercializa como Eladynos.',
        'The osteosarcoma boxed warning and the 2-year treatment limit were removed in 2021. In Europe it is marketed as Eladynos.',
      ),
    },
    routes: ['sc'],
    defaultUnit: 'mcg',
    pk: {
      halfLifeH: 1.7,
      tmaxH: 0.5,
      bioavailability: 0.36,
      source: 'Tymlos US label §12.3: t½ ≈ 1,7 h, tmax ≈ 0,5 h, biodisponibilidad absoluta ≈ 36%',
      notes:
        'Igual que con teriparatida, el carácter pulsátil de la exposición diaria es lo que determina el efecto anabólico.',
    },
    dosing: {
      labeled: t(
        'Ochenta microgramos al día por vía subcutánea en la región periumbilical, rotando el punto. Las primeras dosis deben administrarse con el paciente sentado o tumbado por el riesgo de hipotensión ortostática. Tratamiento habitualmente de hasta 18–24 meses seguido de un antirresortivo.',
        'Eighty micrograms daily subcutaneously in the periumbilical region, rotating the site. The first doses should be given with the patient seated or lying down because of the risk of orthostatic hypotension. Treatment usually up to 18–24 months followed by an antiresorptive.',
      ),
      frequency: t('1×/día', 'Once daily'),
    },
    storage: t(
      'Antes del primer uso: nevera 2–8 °C. Tras la primera inyección: temperatura ambiente (20–25 °C) durante un máximo de 30 días, y después desechar aunque quede producto. No congelar.',
      'Before first use: refrigerate 2–8 °C. After the first injection: room temperature (20–25 °C) for a maximum of 30 days, then discard even if product remains. Do not freeze.',
    ),
    adverseEffects: {
      common: [
        t('Hipercalciuria', 'Hypercalciuria'),
        t('Mareo, cefalea y palpitaciones', 'Dizziness, headache and palpitations'),
        t('Náuseas y fatiga', 'Nausea and fatigue'),
        t('Reacciones en el punto de inyección', 'Injection-site reactions'),
        t(
          'Taquicardia transitoria en las horas siguientes a la dosis',
          'Transient tachycardia in the hours after the dose',
        ),
      ],
      serious: [
        t('Hipotensión ortostática con síncope', 'Orthostatic hypotension with syncope'),
        t('Hipercalcemia y urolitiasis', 'Hypercalcaemia and urolithiasis'),
        t(
          'Osteosarcoma: señal en roedores; no confirmada en humanos',
          'Osteosarcoma: rodent signal; not confirmed in humans',
        ),
      ],
    },
    contraindications: [
      t(
        'Antecedente de osteosarcoma o de otra neoplasia ósea primaria',
        'History of osteosarcoma or other primary bone malignancy',
      ),
      t(
        'Enfermedad de Paget o elevación inexplicada de la fosfatasa alcalina',
        'Paget disease or unexplained alkaline phosphatase elevation',
      ),
      t('Radioterapia previa sobre el esqueleto', 'Prior skeletal radiotherapy'),
      t(
        'Hipercalcemia o hiperparatiroidismo preexistente; metástasis óseas',
        'Pre-existing hypercalcaemia or hyperparathyroidism; bone metastases',
      ),
      t('Epífisis abiertas', 'Open epiphyses'),
    ],
    interactions: [
      t(
        'Digoxina: precaución por la hipercalcemia transitoria',
        'Digoxin: caution because of transient hypercalcaemia',
      ),
      t(
        'Antihipertensivos y nitratos: pueden sumarse a la hipotensión ortostática',
        'Antihypertensives and nitrates: may add to orthostatic hypotension',
      ),
      t(
        'Suplementos de calcio y vitamina D: recomendados, pero vigilando la calcemia',
        'Calcium and vitamin D supplements: recommended, but monitor calcaemia',
      ),
    ],
    monitoring: [
      t('Calcio sérico corregido y calcio urinario', 'Corrected serum calcium and urinary calcium'),
      t(
        'Presión arterial en bipedestación en las primeras semanas',
        'Standing blood pressure in the first weeks',
      ),
      t('Frecuencia cardiaca si hay palpitaciones', 'Heart rate if palpitations occur'),
      t(
        'Densitometría ósea y planificación del antirresortivo posterior',
        'Bone densitometry and planning of subsequent antiresorptive therapy',
      ),
    ],
    keyTrials: [
      {
        name: 'ACTIVE',
        year: 2016,
        finding: t(
          'Abaloparatida redujo un 86% las fracturas vertebrales nuevas frente a placebo en mujeres posmenopáusicas con osteoporosis a 18 meses.',
          'Abaloparatide reduced new vertebral fractures by 86% versus placebo in postmenopausal women with osteoporosis over 18 months.',
        ),
        ref: 'JAMA 2016;316:722',
      },
      {
        name: 'ACTIVExtend',
        year: 2017,
        finding: t(
          'El paso a alendronato tras abaloparatida mantuvo y amplió la reducción de fracturas hasta los 43 meses.',
          'Switching to alendronate after abaloparatide maintained and extended the fracture reduction through 43 months.',
        ),
        ref: 'Mayo Clin Proc 2017',
      },
      {
        name: 'ATOM',
        year: 2022,
        finding: t(
          'En varones con osteoporosis, abaloparatida aumentó la densidad mineral ósea frente a placebo a 12 meses.',
          'In men with osteoporosis, abaloparatide increased bone mineral density versus placebo at 12 months.',
        ),
        ref: 'J Bone Miner Res 2022',
      },
    ],
    references: [{ label: 'Tymlos (abaloparatide) US Prescribing Information' }],
    tags: ['pthrp', 'osteoporosis', 'anabolico-oseo', 'calcio'],
    lastReviewed: '2026-09-19',
  },

  {
    id: 'octreotide',
    names: {
      generic: 'Octreotida',
      brands: ['Sandostatin', 'Sandostatin LAR', 'Bynfezia', 'Mycapssa'],
      aliases: ['SMS 201-995', 'octreotide'],
    },
    category: 'hormonal',
    pharmClass: t(
      'Análogo de somatostatina (afinidad SSTR2 > SSTR5)',
      'Somatostatin analogue (SSTR2 > SSTR5 affinity)',
    ),
    summary: t(
      'Octapéptido análogo de la somatostatina, mucho más estable que la hormona nativa, que inhibe la secreción de GH, TSH, insulina, glucagón y hormonas gastroenteropancreáticas. Disponible en forma subcutánea, depot intramuscular y oral.',
      'Octapeptide somatostatin analogue, far more stable than the native hormone, inhibiting secretion of GH, TSH, insulin, glucagon and gastroenteropancreatic hormones. Available subcutaneously, as an intramuscular depot and orally.',
    ),
    mechanism: t(
      'Agonista de los receptores de somatostatina, sobre todo SSTR2 y en menor grado SSTR5, acoplados a proteína Gi: inhibe la adenilato ciclasa y los canales de calcio, con el resultado de una supresión de la exocitosis hormonal y un efecto antiproliferativo en tumores neuroendocrinos.',
      'Agonist of somatostatin receptors, mainly SSTR2 and to a lesser extent SSTR5, coupled to Gi protein: it inhibits adenylate cyclase and calcium channels, suppressing hormone exocytosis and exerting an antiproliferative effect in neuroendocrine tumours.',
    ),
    indications: [
      t('Acromegalia', 'Acromegaly'),
      t(
        'Síndrome carcinoide: diarrea y crisis de rubefacción',
        'Carcinoid syndrome: diarrhoea and flushing episodes',
      ),
      t(
        'VIPomas y otros tumores neuroendocrinos funcionantes',
        'VIPomas and other functioning neuroendocrine tumours',
      ),
      t(
        'Hemorragia por varices esofágicas (uso off-label frecuente en urgencias)',
        'Oesophageal variceal bleeding (frequent off-label use in emergencies)',
      ),
    ],
    evidence: 'fda_approved',
    regulatory: { us: 'approved', eu: 'approved' },
    routes: ['sc', 'im', 'iv', 'oral'],
    defaultUnit: 'mcg',
    pk: {
      halfLifeH: 1.7,
      tmaxH: 0.5,
      bioavailability: 1,
      source:
        'Sandostatin US label §12.3: biodisponibilidad SC prácticamente completa, tmax ≈ 0,4 h, t½ ≈ 1,7 h (1,5 h por vía intravenosa)',
      notes:
        'Estos parámetros corresponden a la forma subcutánea inmediata. Sandostatin LAR (microesferas intramusculares) tiene liberación durante ~4 semanas con un pico a los 28 días y un patrón de flip-flop; la forma oral (Mycapssa) tiene biodisponibilidad baja y variable y requiere ayuno.',
    },
    dosing: {
      labeled: t(
        'Acromegalia: forma subcutánea de 50–100 microgramos tres veces al día, titulada hasta un máximo de 500 microgramos tres veces al día; forma depot LAR de 20–30 mg por vía intramuscular cada 4 semanas. Síndrome carcinoide: 100–600 microgramos al día por vía subcutánea repartidos en 2–4 dosis. Se suele iniciar con la forma subcutánea para comprobar tolerancia antes de pasar al depot.',
        'Acromegaly: subcutaneous 50–100 micrograms three times daily, titrated to a maximum of 500 micrograms three times daily; LAR depot 20–30 mg intramuscularly every 4 weeks. Carcinoid syndrome: 100–600 micrograms daily subcutaneously in 2–4 divided doses. The subcutaneous form is usually used first to check tolerance before switching to the depot.',
      ),
      frequency: t('2–4×/día (SC) o cada 4 semanas (LAR)', '2–4×/day (SC) or every 4 weeks (LAR)'),
    },
    reconstitution: t(
      'Sandostatin LAR: kit de microesferas liofilizadas con jeringa de diluyente; se deja atemperar 30–60 minutos, se mezcla hasta obtener una suspensión uniforme y se inyecta de inmediato por vía intramuscular glútea profunda, alternando los lados. La ampolla subcutánea es una solución lista para usar que no requiere reconstitución.',
      'Sandostatin LAR: a kit of lyophilised microspheres with a diluent syringe; let it reach room temperature for 30–60 minutes, mix to a uniform suspension and inject immediately by deep gluteal intramuscular route, alternating sides. The subcutaneous ampoule is a ready-to-use solution needing no reconstitution.',
    ),
    storage: t(
      'Ampollas y viales multidosis subcutáneos: nevera 2–8 °C; a temperatura ambiente son estables 14 días protegidos de la luz. Kits LAR: nevera 2–8 °C hasta el momento de la preparación. No congelar.',
      'Subcutaneous ampoules and multidose vials: refrigerate 2–8 °C; at room temperature they are stable for 14 days protected from light. LAR kits: refrigerate 2–8 °C until preparation. Do not freeze.',
    ),
    adverseEffects: {
      common: [
        t(
          'Diarrea, esteatorrea, dolor abdominal, flatulencia y náuseas',
          'Diarrhoea, steatorrhoea, abdominal pain, flatulence and nausea',
        ),
        t(
          'Dolor e induración en el punto de inyección',
          'Pain and induration at the injection site',
        ),
        t(
          'Hiperglucemia o hipoglucemia por la supresión simultánea de insulina y glucagón',
          'Hyperglycaemia or hypoglycaemia from simultaneous suppression of insulin and glucagon',
        ),
        t(
          'Colelitiasis, a menudo asintomática, hasta en la mitad de los tratamientos prolongados',
          'Gallstones, often asymptomatic, in up to half of prolonged treatments',
        ),
      ],
      serious: [
        t(
          'Colecistitis, colangitis y pancreatitis biliar',
          'Cholecystitis, cholangitis and biliary pancreatitis',
        ),
        t(
          'Bradicardia sinusal y alteraciones de la conducción',
          'Sinus bradycardia and conduction disturbances',
        ),
        t('Hipotiroidismo por supresión de TSH', 'Hypothyroidism from TSH suppression'),
        t(
          'Déficit de vitamina B12 con el uso prolongado',
          'Vitamin B12 deficiency with prolonged use',
        ),
      ],
    },
    contraindications: [
      t(
        'Hipersensibilidad a la octreotida o a sus excipientes',
        'Hypersensitivity to octreotide or its excipients',
      ),
      t(
        'Precaución o contraindicación relativa en colelitiasis sintomática y en enfermedad biliar activa',
        'Caution or relative contraindication in symptomatic gallstones and active biliary disease',
      ),
    ],
    interactions: [
      t(
        'Ciclosporina: la octreotida reduce sus concentraciones y puede provocar rechazo del injerto',
        'Ciclosporin: octreotide lowers its concentrations and may precipitate graft rejection',
      ),
      t(
        'Insulina y antidiabéticos: requieren reajuste por los cambios en la secreción de insulina y glucagón',
        'Insulin and antidiabetic agents: require adjustment because of changes in insulin and glucagon secretion',
      ),
      t(
        'Betabloqueantes y otros fármacos bradicardizantes: efecto aditivo sobre la frecuencia cardiaca',
        'Beta-blockers and other bradycardic drugs: additive effect on heart rate',
      ),
      t(
        'Bromocriptina y quinidina: aumento de sus concentraciones',
        'Bromocriptine and quinidine: increased concentrations',
      ),
    ],
    monitoring: [
      t(
        'Ecografía de vesícula biliar basal y después cada 6–12 meses',
        'Gallbladder ultrasound at baseline and then every 6–12 months',
      ),
      t('Glucemia y HbA1c', 'Glucose and HbA1c'),
      t('Vitamina B12 en tratamientos prolongados', 'Vitamin B12 with prolonged treatment'),
      t(
        'IGF-1 y GH en acromegalia; función tiroidea (TSH y T4 libre)',
        'IGF-1 and GH in acromegaly; thyroid function (TSH and free T4)',
      ),
      t(
        'Frecuencia cardiaca y ECG en pacientes con cardiopatía',
        'Heart rate and ECG in patients with heart disease',
      ),
    ],
    keyTrials: [
      {
        name: 'PROMID',
        year: 2009,
        finding: t(
          'Octreotida LAR prolongó el tiempo hasta la progresión tumoral frente a placebo en tumores neuroendocrinos de intestino medio metastásicos.',
          'Octreotide LAR prolonged time to tumour progression versus placebo in metastatic midgut neuroendocrine tumours.',
        ),
        ref: 'J Clin Oncol 2009;27:4656',
      },
    ],
    references: [
      { label: 'Sandostatin / Sandostatin LAR Depot US Prescribing Information' },
      { label: 'Endocrine Society Clinical Practice Guideline: Acromegaly' },
    ],
    tags: ['somatostatina', 'acromegalia', 'carcinoide', 'vesicula', 'neuroendocrino'],
    lastReviewed: '2026-09-19',
  },

  {
    id: 'lanreotide',
    names: {
      generic: 'Lanreotida',
      brands: ['Somatuline Depot', 'Somatuline Autogel', 'Cipla lanreotide'],
      aliases: ['BIM 23014', 'lanreotide autogel'],
    },
    category: 'hormonal',
    pharmClass: t(
      'Análogo de somatostatina de acción prolongada',
      'Long-acting somatostatin analogue',
    ),
    summary: t(
      'Octapéptido análogo de somatostatina formulado como gel acuoso supersaturado de liberación prolongada (autogel), que se administra por vía subcutánea profunda una vez al mes sin necesidad de reconstitución.',
      'Octapeptide somatostatin analogue formulated as a supersaturated aqueous extended-release gel (autogel), given by deep subcutaneous injection once monthly with no reconstitution needed.',
    ),
    mechanism: t(
      'Agonista de SSTR2 y SSTR5 que inhibe la secreción de GH, IGF-1 y hormonas gastroenteropancreáticas, y ejerce un efecto antiproliferativo directo sobre las células tumorales neuroendocrinas.',
      'SSTR2 and SSTR5 agonist that inhibits secretion of GH, IGF-1 and gastroenteropancreatic hormones, and exerts a direct antiproliferative effect on neuroendocrine tumour cells.',
    ),
    indications: [
      t('Acromegalia', 'Acromegaly'),
      t(
        'Tumores neuroendocrinos gastroenteropancreáticos no resecables (control del crecimiento tumoral)',
        'Unresectable gastroenteropancreatic neuroendocrine tumours (tumour growth control)',
      ),
      t('Síndrome carcinoide', 'Carcinoid syndrome'),
    ],
    evidence: 'fda_approved',
    regulatory: { us: 'approved', eu: 'approved' },
    routes: ['sc'],
    defaultUnit: 'mg',
    pk: {
      halfLifeH: 624,
      tmaxH: 12,
      bioavailability: 0.7,
      source:
        'Somatuline Depot US label §12.3: t½ terminal aparente ≈ 23–30 días tras inyección subcutánea profunda del autogel',
      notes:
        'Cinética de flip-flop clara: la semivida aparente de varias semanas refleja la disolución lenta del gel en el tejido subcutáneo, no la eliminación del péptido. El estado estacionario se alcanza tras 4–5 inyecciones mensuales.',
    },
    dosing: {
      labeled: t(
        'Acromegalia: 60–120 mg por vía subcutánea profunda cada 4 semanas, titulando según IGF-1 y GH; en pacientes bien controlados puede espaciarse el intervalo. Tumores neuroendocrinos: 120 mg cada 4 semanas.',
        'Acromegaly: 60–120 mg by deep subcutaneous injection every 4 weeks, titrated by IGF-1 and GH; in well-controlled patients the interval may be extended. Neuroendocrine tumours: 120 mg every 4 weeks.',
      ),
      frequency: t('Cada 4 semanas', 'Every 4 weeks'),
    },
    reconstitution: t(
      'No requiere reconstitución: jeringa precargada lista para usar. Debe sacarse de la nevera 30 minutos antes e inyectarse en el cuadrante superoexterno del glúteo por vía subcutánea profunda, alternando el lado en cada administración.',
      'No reconstitution needed: ready-to-use prefilled syringe. Remove from the fridge 30 minutes beforehand and inject into the upper outer quadrant of the buttock by deep subcutaneous route, alternating sides each time.',
    ),
    storage: t(
      'Nevera 2–8 °C en el envase original, protegido de la luz, hasta la fecha de caducidad. No congelar. Atemperar antes de inyectar para reducir el dolor.',
      'Refrigerate 2–8 °C in the original carton, protected from light, until the expiry date. Do not freeze. Let it warm before injecting to reduce pain.',
    ),
    adverseEffects: {
      common: [
        t('Diarrea, dolor abdominal y náuseas', 'Diarrhoea, abdominal pain and nausea'),
        t('Colelitiasis', 'Cholelithiasis'),
        t(
          'Reacción, nódulo e induración en el punto de inyección',
          'Injection-site reaction, nodule and induration',
        ),
        t('Hiperglucemia o hipoglucemia', 'Hyperglycaemia or hypoglycaemia'),
      ],
      serious: [
        t('Colecistitis y pancreatitis', 'Cholecystitis and pancreatitis'),
        t('Bradicardia y bloqueo de la conducción', 'Bradycardia and conduction block'),
        t('Hipotiroidismo', 'Hypothyroidism'),
      ],
    },
    contraindications: [
      t(
        'Hipersensibilidad a la lanreotida o a otros análogos de somatostatina',
        'Hypersensitivity to lanreotide or other somatostatin analogues',
      ),
      t('Precaución en enfermedad biliar sintomática', 'Caution in symptomatic biliary disease'),
    ],
    interactions: [
      t('Ciclosporina: reducción de sus concentraciones', 'Ciclosporin: reduced concentrations'),
      t(
        'Insulina y antidiabéticos orales: reajuste de dosis',
        'Insulin and oral antidiabetics: dose adjustment',
      ),
      t(
        'Bradicardizantes (betabloqueantes): efecto aditivo',
        'Bradycardic agents (beta-blockers): additive effect',
      ),
    ],
    monitoring: [
      t('IGF-1 y GH en acromegalia', 'IGF-1 and GH in acromegaly'),
      t('Ecografía de vesícula biliar periódica', 'Periodic gallbladder ultrasound'),
      t('Glucemia, HbA1c y función tiroidea', 'Glucose, HbA1c and thyroid function'),
      t('Frecuencia cardiaca', 'Heart rate'),
    ],
    keyTrials: [
      {
        name: 'CLARINET',
        year: 2014,
        finding: t(
          'Lanreotida autogel 120 mg prolongó significativamente la supervivencia libre de progresión frente a placebo en tumores neuroendocrinos enteropancreáticos.',
          'Lanreotide autogel 120 mg significantly prolonged progression-free survival versus placebo in enteropancreatic neuroendocrine tumours.',
        ),
        ref: 'NEJM 2014;371:224',
      },
    ],
    references: [{ label: 'Somatuline Depot (lanreotide) US Prescribing Information' }],
    tags: ['somatostatina', 'acromegalia', 'neuroendocrino', 'depot', 'mensual'],
    lastReviewed: '2026-09-19',
  },

  {
    id: 'pasireotide',
    names: {
      generic: 'Pasireotida',
      brands: ['Signifor', 'Signifor LAR'],
      aliases: ['SOM230', 'pasireotide'],
    },
    category: 'hormonal',
    pharmClass: t(
      'Análogo multirreceptor de somatostatina (SSTR1, 2, 3 y 5)',
      'Multireceptor somatostatin analogue (SSTR1, 2, 3 and 5)',
    ),
    summary: t(
      'Análogo de somatostatina con afinidad amplia, especialmente alta por SSTR5, lo que le permite actuar sobre los corticotropinomas y sobre las acromegalias resistentes a octreotida, a costa de una hiperglucemia frecuente y marcada.',
      'Somatostatin analogue with broad affinity, especially high for SSTR5, allowing it to act on corticotroph adenomas and on acromegaly resistant to octreotide, at the cost of frequent and marked hyperglycaemia.',
    ),
    mechanism: t(
      'Se une a SSTR1, 2, 3 y 5 con una afinidad por SSTR5 unas 40 veces superior a la de la octreotida. En la enfermedad de Cushing inhibe la secreción de ACTH por el adenoma corticotropo; la supresión de SSTR5 en la célula beta y de GLP-1 y GIP explica su impacto glucémico.',
      'Binds SSTR1, 2, 3 and 5 with roughly 40-fold higher SSTR5 affinity than octreotide. In Cushing disease it inhibits ACTH secretion by the corticotroph adenoma; suppression of SSTR5 in the beta cell and of GLP-1 and GIP explains its glycaemic impact.',
    ),
    indications: [
      t(
        'Enfermedad de Cushing en pacientes no candidatos a cirugía o con cirugía no curativa',
        'Cushing disease in patients who are not surgical candidates or in whom surgery was not curative',
      ),
      t(
        'Acromegalia con respuesta insuficiente a cirugía y a otros análogos de somatostatina',
        'Acromegaly with inadequate response to surgery and other somatostatin analogues',
      ),
    ],
    evidence: 'fda_approved',
    regulatory: { us: 'approved', eu: 'approved' },
    routes: ['sc', 'im'],
    defaultUnit: 'mcg',
    pk: {
      halfLifeH: 12,
      tmaxH: 0.4,
      source:
        'Signifor US label §12.3: t½ ≈ 12 h tras administración subcutánea; tmax ≈ 0,25–0,5 h',
      notes:
        'Signifor LAR (microesferas intramusculares mensuales) sigue una cinética de liberación lenta, con estado estacionario tras unas tres inyecciones.',
    },
    dosing: {
      labeled: t(
        'Enfermedad de Cushing: forma subcutánea de 0,3–0,9 mg dos veces al día, o forma LAR de 10–30 mg por vía intramuscular cada 4 semanas. Acromegalia: LAR de 20–60 mg cada 4 semanas. Se recomienda optimizar el control glucémico antes de iniciar el tratamiento.',
        'Cushing disease: subcutaneous 0.3–0.9 mg twice daily, or LAR 10–30 mg intramuscularly every 4 weeks. Acromegaly: LAR 20–60 mg every 4 weeks. Optimising glycaemic control before starting is recommended.',
      ),
      frequency: t('2×/día (SC) o cada 4 semanas (LAR)', 'Twice daily (SC) or every 4 weeks (LAR)'),
    },
    reconstitution: t(
      'Signifor LAR: kit de microesferas liofilizadas con jeringa de disolvente; atemperar al menos 30 minutos, mezclar hasta suspensión homogénea e inyectar de inmediato por vía intramuscular glútea profunda. La forma subcutánea es una ampolla lista para usar.',
      'Signifor LAR: a kit of lyophilised microspheres with a diluent syringe; let it warm for at least 30 minutes, mix to a uniform suspension and inject immediately by deep gluteal intramuscular route. The subcutaneous form is a ready-to-use ampoule.',
    ),
    storage: t(
      'Ampollas subcutáneas: temperatura ambiente controlada, protegidas de la luz. Kits LAR: nevera 2–8 °C hasta la preparación; usar inmediatamente tras la mezcla. No congelar.',
      'Subcutaneous ampoules: controlled room temperature, protected from light. LAR kits: refrigerate 2–8 °C until preparation; use immediately after mixing. Do not freeze.',
    ),
    adverseEffects: {
      common: [
        t(
          'Hiperglucemia y diabetes de nueva aparición (en la mayoría de los pacientes)',
          'Hyperglycaemia and new-onset diabetes (in the majority of patients)',
        ),
        t('Diarrea, náuseas y dolor abdominal', 'Diarrhoea, nausea and abdominal pain'),
        t('Colelitiasis', 'Cholelithiasis'),
        t('Fatiga y cefalea', 'Fatigue and headache'),
      ],
      serious: [
        t('Hiperglucemia grave y cetoacidosis', 'Severe hyperglycaemia and ketoacidosis'),
        t(
          'Bradicardia y prolongación del intervalo QT',
          'Bradycardia and QT interval prolongation',
        ),
        t(
          'Elevación de transaminasas y hepatotoxicidad',
          'Transaminase elevation and hepatotoxicity',
        ),
        t(
          'Insuficiencia suprarrenal por corrección excesiva del hipercortisolismo',
          'Adrenal insufficiency from over-correction of hypercortisolism',
        ),
      ],
    },
    contraindications: [
      t('Hipersensibilidad a la pasireotida', 'Hypersensitivity to pasireotide'),
      t('Insuficiencia hepática grave (Child-Pugh C)', 'Severe hepatic impairment (Child-Pugh C)'),
      t(
        'Precaución en diabetes mal controlada y en QT largo',
        'Caution in poorly controlled diabetes and in long QT',
      ),
    ],
    interactions: [
      t(
        'Fármacos que prolongan el QT y bradicardizantes: efecto aditivo',
        'QT-prolonging and bradycardic drugs: additive effect',
      ),
      t(
        'Antidiabéticos: casi siempre es necesario intensificarlos, con preferencia por metformina y agentes basados en incretinas',
        'Antidiabetics: intensification is almost always needed, favouring metformin and incretin-based agents',
      ),
      t('Ciclosporina: descenso de sus concentraciones', 'Ciclosporin: decreased concentrations'),
    ],
    monitoring: [
      t(
        'Glucemia en ayunas semanal los primeros 3 meses y HbA1c periódica',
        'Weekly fasting glucose for the first 3 months and periodic HbA1c',
      ),
      t(
        'Cortisol libre urinario o cortisol salival nocturno en enfermedad de Cushing',
        'Urinary free cortisol or late-night salivary cortisol in Cushing disease',
      ),
      t('IGF-1 en acromegalia', 'IGF-1 in acromegaly'),
      t(
        'ECG, electrolitos, transaminasas y ecografía de vesícula',
        'ECG, electrolytes, transaminases and gallbladder ultrasound',
      ),
    ],
    keyTrials: [
      {
        name: 'PASPORT-CUSHINGS (fase 3 de pasireotida en enfermedad de Cushing)',
        year: 2012,
        finding: t(
          'Pasireotida subcutánea normalizó el cortisol libre urinario en una minoría significativa de pacientes con enfermedad de Cushing, con hiperglucemia en cerca del 73%.',
          'Subcutaneous pasireotide normalised urinary free cortisol in a significant minority of patients with Cushing disease, with hyperglycaemia in about 73%.',
        ),
        ref: 'NEJM 2012;366:914',
      },
      {
        name: 'PAOLA',
        year: 2014,
        finding: t(
          'Pasireotida LAR logró control bioquímico en acromegalia con respuesta inadecuada a octreotida o lanreotida a dosis máximas.',
          'Pasireotide LAR achieved biochemical control in acromegaly inadequately responsive to maximal octreotide or lanreotide.',
        ),
        ref: 'Lancet Diabetes Endocrinol 2014',
      },
    ],
    references: [{ label: 'Signifor / Signifor LAR US Prescribing Information' }],
    tags: ['somatostatina', 'cushing', 'acromegalia', 'hiperglucemia'],
    lastReviewed: '2026-09-19',
  },

  {
    id: 'teduglutide',
    names: {
      generic: 'Teduglutida',
      brands: ['Gattex', 'Revestive'],
      aliases: ['ALX-0600', 'análogo de GLP-2'],
    },
    category: 'hormonal',
    pharmClass: t('Análogo de GLP-2 resistente a DPP-4', 'DPP-4-resistant GLP-2 analogue'),
    summary: t(
      'Análogo del péptido similar al glucagón tipo 2 con sustitución Ala2Gly que lo protege de la DPP-4, indicado para reducir la dependencia de nutrición parenteral en el síndrome de intestino corto.',
      'Glucagon-like peptide-2 analogue with an Ala2Gly substitution that protects it from DPP-4, indicated to reduce dependence on parenteral nutrition in short bowel syndrome.',
    ),
    mechanism: t(
      'Activa el receptor de GLP-2 en las células subepiteliales del intestino, induciendo IGF-1 y factores de crecimiento locales: aumenta la altura de las vellosidades y la profundidad de las criptas, mejora la absorción de líquidos y nutrientes y enlentece el tránsito.',
      'Activates the GLP-2 receptor on intestinal subepithelial cells, inducing IGF-1 and local growth factors: it increases villus height and crypt depth, improves fluid and nutrient absorption and slows transit.',
    ),
    indications: [
      t(
        'Síndrome de intestino corto con dependencia de soporte parenteral, en adultos y en pacientes pediátricos ≥1 año',
        'Short bowel syndrome with dependence on parenteral support, in adults and paediatric patients ≥1 year',
      ),
    ],
    evidence: 'fda_approved',
    regulatory: {
      us: 'approved',
      eu: 'approved',
      notes: t(
        'Medicamento huérfano en Estados Unidos y en la Unión Europea.',
        'Orphan drug in both the United States and the European Union.',
      ),
    },
    routes: ['sc'],
    defaultUnit: 'mg',
    pk: {
      halfLifeH: 2,
      tmaxH: 3.5,
      bioavailability: 0.88,
      source:
        'Gattex US label §12.3: biodisponibilidad absoluta ≈ 88%, tmax ≈ 3–5 h, t½ ≈ 2 h en adultos',
      notes:
        'El efecto trófico intestinal persiste mucho más allá de la exposición plasmática; la semivida corta no refleja la duración del efecto farmacodinámico.',
    },
    dosing: {
      labeled: t(
        'Cero coma cero cinco mg/kg una vez al día por vía subcutánea, rotando entre los cuadrantes abdominales, los muslos y los brazos. Se requiere ajuste de dosis en insuficiencia renal moderada o grave. La respuesta se evalúa a los 6 meses.',
        'Zero point zero five mg/kg once daily subcutaneously, rotating between abdominal quadrants, thighs and arms. Dose adjustment is required in moderate or severe renal impairment. Response is assessed at 6 months.',
      ),
      frequency: t('1×/día', 'Once daily'),
    },
    reconstitution: t(
      'Vial de polvo liofilizado que se reconstituye con el disolvente de la jeringa precargada incluida; se deja disolver unos 30 segundos sin agitar, se gira suavemente el vial y se administra en un plazo máximo de 3 horas a temperatura ambiente. No mezclar varios viales.',
      'Lyophilised powder vial reconstituted with the diluent in the supplied prefilled syringe; allow about 30 seconds to dissolve without shaking, swirl the vial gently and administer within a maximum of 3 hours at room temperature. Do not pool multiple vials.',
    ),
    storage: t(
      'Kit sin reconstituir: temperatura ambiente controlada (20–25 °C). Tras la reconstitución: usar en 3 horas; no refrigerar ni congelar la solución preparada.',
      'Unreconstituted kit: controlled room temperature (20–25 °C). After reconstitution: use within 3 hours; do not refrigerate or freeze the prepared solution.',
    ),
    adverseEffects: {
      common: [
        t('Dolor y distensión abdominal', 'Abdominal pain and distension'),
        t('Náuseas y vómitos', 'Nausea and vomiting'),
        t('Reacciones en el punto de inyección', 'Injection-site reactions'),
        t(
          'Complicaciones del estoma: edema y dificultad para el dispositivo',
          'Stoma complications: oedema and difficulty with the appliance',
        ),
        t(
          'Sobrecarga de líquidos al reducir la nutrición parenteral',
          'Fluid overload as parenteral nutrition is reduced',
        ),
      ],
      serious: [
        t(
          'Neoplasia colorrectal: el efecto trófico obliga a colonoscopia previa y de seguimiento',
          'Colorectal neoplasia: the trophic effect mandates baseline and follow-up colonoscopy',
        ),
        t('Obstrucción intestinal', 'Intestinal obstruction'),
        t(
          'Enfermedad de la vesícula y de las vías biliares, y pancreatitis',
          'Gallbladder and biliary tract disease, and pancreatitis',
        ),
        t(
          'Crecimiento de pólipos y de otras neoplasias del tracto gastrointestinal',
          'Growth of polyps and other gastrointestinal neoplasms',
        ),
      ],
    },
    contraindications: [
      t(
        'Neoplasia maligna gastrointestinal activa (incluidas hepatobiliar y pancreática)',
        'Active gastrointestinal malignancy (including hepatobiliary and pancreatic)',
      ),
      t(
        'Hipersensibilidad a la teduglutida o a residuos de tetraciclina del proceso de fabricación',
        'Hypersensitivity to teduglutide or to tetracycline residues from the manufacturing process',
      ),
    ],
    interactions: [
      t(
        'Fármacos orales de ventana estrecha (benzodiazepinas, psicotropos): la mejor absorción intestinal puede aumentar sus concentraciones',
        'Narrow-window oral drugs (benzodiazepines, psychotropics): improved intestinal absorption may raise their concentrations',
      ),
      t(
        'Nutrición parenteral: debe reducirse progresivamente para evitar sobrecarga de volumen',
        'Parenteral nutrition: must be tapered to avoid volume overload',
      ),
    ],
    monitoring: [
      t(
        'Colonoscopia con extirpación de pólipos antes de iniciar, al año y después cada 5 años como mínimo',
        'Colonoscopy with polyp removal before starting, at 1 year and at least every 5 years thereafter',
      ),
      t(
        'Bilirrubina, fosfatasa alcalina, lipasa y amilasa cada 6 meses',
        'Bilirubin, alkaline phosphatase, lipase and amylase every 6 months',
      ),
      t(
        'Balance hídrico, peso y electrolitos al reducir la nutrición parenteral',
        'Fluid balance, weight and electrolytes as parenteral nutrition is reduced',
      ),
      t(
        'Vigilancia de síntomas de obstrucción intestinal y de enfermedad biliar',
        'Surveillance for symptoms of bowel obstruction and biliary disease',
      ),
    ],
    keyTrials: [
      {
        name: 'STEPS',
        year: 2012,
        finding: t(
          'Teduglutida redujo el volumen de soporte parenteral en al menos un 20% en una proporción significativamente mayor de pacientes que el placebo a las 24 semanas.',
          'Teduglutide reduced parenteral support volume by at least 20% in a significantly greater proportion of patients than placebo at 24 weeks.',
        ),
        ref: 'Gastroenterology 2012;143:1473',
      },
      {
        name: 'STEPS-2',
        year: 2013,
        finding: t(
          'La extensión abierta mostró reducciones mantenidas del soporte parenteral y algunos pacientes lograron independencia completa.',
          'The open-label extension showed sustained reductions in parenteral support, with some patients achieving complete independence.',
        ),
      },
    ],
    references: [{ label: 'Gattex (teduglutide) US Prescribing Information' }],
    tags: ['glp2', 'intestino-corto', 'huerfano', 'nutricion-parenteral'],
    lastReviewed: '2026-09-19',
  },

  {
    id: 'metreleptin',
    names: {
      generic: 'Metreleptina',
      brands: ['Myalept', 'Myalepta'],
      aliases: ['r-metHuLeptin', 'leptina recombinante'],
    },
    category: 'hormonal',
    pharmClass: t('Análogo recombinante de la leptina humana', 'Recombinant human leptin analogue'),
    summary: t(
      'Análogo de leptina humana producido en Escherichia coli, indicado como tratamiento sustitutivo en las complicaciones metabólicas de la lipodistrofia generalizada, donde la deficiencia de leptina es la causa de la hipertrigliceridemia y de la resistencia extrema a la insulina.',
      'Human leptin analogue produced in Escherichia coli, indicated as replacement therapy for the metabolic complications of generalised lipodystrophy, where leptin deficiency drives hypertriglyceridaemia and extreme insulin resistance.',
    ),
    mechanism: t(
      'Se une al receptor de leptina ObR y activa la vía JAK2-STAT3 en el hipotálamo, restaurando la señal de saciedad y el eje neuroendocrino, y reduciendo la esteatosis hepática, la lipotoxicidad y la resistencia a la insulina.',
      'Binds the ObR leptin receptor and activates the JAK2-STAT3 pathway in the hypothalamus, restoring the satiety signal and the neuroendocrine axis, and reducing hepatic steatosis, lipotoxicity and insulin resistance.',
    ),
    indications: [
      t(
        'Complicaciones metabólicas de la lipodistrofia generalizada congénita o adquirida',
        'Metabolic complications of congenital or acquired generalised lipodystrophy',
      ),
      t(
        'En la Unión Europea, también determinadas lipodistrofias parciales con complicaciones metabólicas no controladas',
        'In the European Union, also selected partial lipodystrophies with uncontrolled metabolic complications',
      ),
    ],
    evidence: 'fda_approved',
    regulatory: {
      us: 'approved',
      eu: 'approved',
      notes: t(
        'Advertencia de recuadro negro por riesgo de anticuerpos neutralizantes anti-metreleptina y por linfoma de células T. Distribución restringida mediante programa REMS en Estados Unidos.',
        'Boxed warning for the risk of anti-metreleptin neutralising antibodies and for T-cell lymphoma. Restricted distribution through a REMS programme in the United States.',
      ),
    },
    routes: ['sc'],
    defaultUnit: 'mg',
    pk: {
      halfLifeH: 4,
      tmaxH: 4.5,
      source:
        'Myalept US label §12.3: tmax ≈ 4 h y t½ ≈ 3,8–4,7 h tras dosis subcutánea; aclaramiento renal',
      notes:
        'El efecto clínico depende de restablecer la señalización leptínica, no de mantener concentraciones altas; se administra una vez al día (o dos en dosis altas).',
    },
    dosing: {
      labeled: t(
        'Peso ≤40 kg: 0,06 mg/kg al día por vía subcutánea, con posibilidad de aumentar hasta 0,13 mg/kg al día. Varones de más de 40 kg: 2,5 mg al día, ajustable hasta 10 mg. Mujeres de más de 40 kg: 5 mg al día, ajustable hasta 10 mg. Se administra una vez al día, o repartido en dos si la dosis es alta.',
        'Weight ≤40 kg: 0.06 mg/kg daily subcutaneously, with the option to increase to 0.13 mg/kg daily. Men over 40 kg: 2.5 mg daily, adjustable to 10 mg. Women over 40 kg: 5 mg daily, adjustable to 10 mg. Given once daily, or split into two doses if the dose is high.',
      ),
      frequency: t('1–2×/día', 'Once or twice daily'),
    },
    reconstitution: t(
      'Vial liofilizado de 11,3 mg que se reconstituye con agua bacteriostática o con agua estéril para inyección según la frecuencia de uso, hasta obtener 5 mg/mL. Girar suavemente sin agitar hasta disolución completa. La solución reconstituida con agua bacteriostática se conserva refrigerada hasta 3 días; la preparada con agua estéril debe usarse de inmediato.',
      'An 11.3 mg lyophilised vial reconstituted with bacteriostatic water or sterile water for injection depending on frequency of use, to give 5 mg/mL. Swirl gently without shaking until fully dissolved. Solution reconstituted with bacteriostatic water keeps refrigerated for up to 3 days; that prepared with sterile water must be used immediately.',
    ),
    storage: t(
      'Viales sin reconstituir: nevera 2–8 °C, protegidos de la luz, en el envase original. Reconstituido: nevera y uso según el disolvente empleado. No congelar ni agitar.',
      'Unreconstituted vials: refrigerate 2–8 °C, protected from light, in the original carton. Reconstituted: refrigerate and use according to the diluent employed. Do not freeze or shake.',
    ),
    adverseEffects: {
      common: [
        t(
          'Hipoglucemia, sobre todo si se mantiene la dosis previa de insulina',
          'Hypoglycaemia, especially if the previous insulin dose is maintained',
        ),
        t('Cefalea y pérdida de peso', 'Headache and weight loss'),
        t('Dolor abdominal y náuseas', 'Abdominal pain and nausea'),
        t('Reacciones en el punto de inyección', 'Injection-site reactions'),
      ],
      serious: [
        t(
          'Anticuerpos neutralizantes anti-metreleptina, con pérdida de eficacia e infecciones graves (recuadro negro)',
          'Anti-metreleptin neutralising antibodies, with loss of efficacy and severe infections (boxed warning)',
        ),
        t(
          'Linfoma de células T, descrito sobre todo en lipodistrofia generalizada adquirida (recuadro negro)',
          'T-cell lymphoma, reported mainly in acquired generalised lipodystrophy (boxed warning)',
        ),
        t(
          'Pancreatitis, especialmente al suspender bruscamente el tratamiento en pacientes con hipertrigliceridemia',
          'Pancreatitis, particularly on abrupt discontinuation in patients with hypertriglyceridaemia',
        ),
        t(
          'Hipoglucemia grave en pacientes tratados con insulina a dosis altas',
          'Severe hypoglycaemia in patients on high-dose insulin',
        ),
      ],
    },
    contraindications: [
      t(
        'Obesidad general no asociada a lipodistrofia congénita o adquirida',
        'General obesity not associated with congenital or acquired lipodystrophy',
      ),
      t('Hipersensibilidad a la metreleptina', 'Hypersensitivity to metreleptin'),
      t(
        'Precaución extrema en antecedente de linfoma o de trastorno linfoproliferativo',
        'Extreme caution with a history of lymphoma or lymphoproliferative disorder',
      ),
    ],
    interactions: [
      t(
        'Insulina y secretagogos: casi siempre requieren reducción importante de dosis al iniciar',
        'Insulin and secretagogues: almost always require a substantial dose reduction at initiation',
      ),
      t(
        'Fármacos de ventana terapéutica estrecha metabolizados por CYP450: la normalización metabólica puede alterar su aclaramiento',
        'Narrow-therapeutic-index drugs metabolised by CYP450: metabolic normalisation may alter their clearance',
      ),
      t(
        'Anticonceptivos hormonales: puede reducirse su eficacia',
        'Hormonal contraceptives: efficacy may be reduced',
      ),
    ],
    monitoring: [
      t('Triglicéridos, HbA1c y glucemia', 'Triglycerides, HbA1c and glucose'),
      t(
        'Transaminasas y grado de esteatosis hepática',
        'Transaminases and degree of hepatic steatosis',
      ),
      t(
        'Vigilancia hematológica y clínica de linfoma',
        'Haematological and clinical surveillance for lymphoma',
      ),
      t(
        'Anticuerpos anti-metreleptina si se pierde eficacia o aparecen infecciones graves',
        'Anti-metreleptin antibodies if efficacy is lost or severe infections occur',
      ),
    ],
    keyTrials: [],
    references: [
      { label: 'Myalept (metreleptin) US Prescribing Information, including boxed warning' },
    ],
    tags: ['leptina', 'lipodistrofia', 'huerfano', 'linfoma', 'resistencia-insulina'],
    lastReviewed: '2026-09-19',
  },

  {
    id: 'glucagon',
    names: {
      generic: 'Glucagón',
      brands: [
        'GlucaGen HypoKit',
        'Glucagon Emergency Kit',
        'Baqsimi (nasal)',
        'Gvoke (autoinyector)',
      ],
      aliases: ['glucagón recombinante', 'glucagon'],
    },
    category: 'hormonal',
    pharmClass: t(
      'Hormona pancreática contrarreguladora; agonista del receptor de glucagón',
      'Counter-regulatory pancreatic hormone; glucagon receptor agonist',
    ),
    summary: t(
      'Polipéptido de 29 aminoácidos de las células alfa pancreáticas, tratamiento de rescate de la hipoglucemia grave. Disponible como kit de emergencia liofilizado, solución lista para usar (Gvoke) y polvo nasal sin necesidad de inhalación activa (Baqsimi).',
      'Twenty-nine amino-acid polypeptide from pancreatic alpha cells, the rescue treatment for severe hypoglycaemia. Available as a lyophilised emergency kit, a ready-to-use solution (Gvoke) and a nasal powder that needs no active inhalation (Baqsimi).',
    ),
    mechanism: t(
      'Activa el receptor de glucagón hepático acoplado a Gs, aumentando el AMPc y la PKA: estimula la glucogenólisis y la gluconeogénesis y eleva rápidamente la glucemia. Requiere reservas hepáticas de glucógeno, por lo que su eficacia es limitada en ayuno prolongado, hepatopatía o hipoglucemia alcohólica. Relaja además el músculo liso digestivo, propiedad usada en radiología.',
      'Activates the Gs-coupled hepatic glucagon receptor, raising cAMP and PKA: it stimulates glycogenolysis and gluconeogenesis and rapidly raises blood glucose. It requires hepatic glycogen stores, so efficacy is limited in prolonged fasting, liver disease or alcohol-related hypoglycaemia. It also relaxes gastrointestinal smooth muscle, a property used in radiology.',
    ),
    indications: [
      t(
        'Hipoglucemia grave en personas con diabetes tratadas con insulina o secretagogos',
        'Severe hypoglycaemia in people with diabetes treated with insulin or secretagogues',
      ),
      t(
        'Relajación del tracto digestivo en exploraciones radiológicas',
        'Gastrointestinal tract relaxation for radiological examinations',
      ),
      t(
        'Prueba de estímulo en el estudio de la reserva de GH y del péptido C (uso diagnóstico)',
        'Stimulation test in the assessment of GH reserve and C-peptide (diagnostic use)',
      ),
      t(
        'Intoxicación por betabloqueantes o por calcioantagonistas (uso off-label en urgencias)',
        'Beta-blocker or calcium-channel blocker poisoning (off-label emergency use)',
      ),
    ],
    evidence: 'fda_approved',
    regulatory: { us: 'approved', eu: 'approved' },
    routes: ['im', 'sc', 'iv', 'nasal'],
    defaultUnit: 'mg',
    pk: {
      halfLifeH: 0.2,
      tmaxH: 0.2,
      source:
        'GlucaGen / Baqsimi US labels §12.3: t½ ≈ 8–18 min tras administración intramuscular; tmax ≈ 13 min (IM) y ≈ 15 min (nasal)',
      notes:
        'Semivida muy corta: el efecto glucémico dura solo 60–90 minutos, por lo que tras la recuperación es imprescindible administrar hidratos de carbono orales. Baqsimi 3 mg nasal alcanza concentraciones eficaces incluso con congestión nasal o con vasoconstrictores.',
    },
    dosing: {
      labeled: t(
        'Hipoglucemia grave en adultos y en niños de 25 kg o más: 1 mg por vía intramuscular, subcutánea o intravenosa; en niños de menos de 25 kg, 0,5 mg. Puede repetirse una dosis a los 15 minutos si no hay respuesta. Baqsimi: 3 mg en polvo nasal, administrados en una sola fosa nasal sin necesidad de inspirar. Tras la recuperación, dar hidratos de carbono por vía oral.',
        'Severe hypoglycaemia in adults and children weighing 25 kg or more: 1 mg intramuscularly, subcutaneously or intravenously; in children under 25 kg, 0.5 mg. A dose may be repeated after 15 minutes if there is no response. Baqsimi: 3 mg nasal powder, given into one nostril with no need to inhale. After recovery, give oral carbohydrate.',
      ),
      frequency: t('Uso de rescate puntual', 'Single-use rescue'),
    },
    reconstitution: t(
      'Kit de emergencia: vial de 1 mg de polvo liofilizado con jeringa precargada de 1 mL de diluyente. Inyectar todo el diluyente en el vial, girar suavemente hasta que la solución sea transparente y aspirar de nuevo el volumen completo (1 mg = 1 mL). Utilizar inmediatamente y desechar el resto; la solución no se conserva. Gvoke y Baqsimi no requieren reconstitución, lo que reduce los errores en manos de un cuidador durante una urgencia.',
      'Emergency kit: a 1 mg lyophilised powder vial with a prefilled 1 mL diluent syringe. Inject all the diluent into the vial, swirl gently until the solution is clear and draw the full volume back up (1 mg = 1 mL). Use immediately and discard any remainder; the solution is not stored. Gvoke and Baqsimi need no reconstitution, which reduces errors in a caregiver’s hands during an emergency.',
    ),
    storage: t(
      'Kits liofilizados y autoinyectores: temperatura ambiente controlada (20–25 °C) en el envase original hasta la caducidad. Baqsimi: temperatura ambiente hasta 30 °C, dentro de su tubo cerrado hasta el momento de usarlo. No refrigerar el polvo nasal ni congelar ningún formato.',
      'Lyophilised kits and autoinjectors: controlled room temperature (20–25 °C) in the original packaging until expiry. Baqsimi: room temperature up to 30 °C, kept inside its sealed tube until use. Do not refrigerate the nasal powder or freeze any presentation.',
    ),
    adverseEffects: {
      common: [
        t('Náuseas y vómitos (muy frecuentes)', 'Nausea and vomiting (very common)'),
        t('Cefalea', 'Headache'),
        t(
          'Irritación nasal, lagrimeo y estornudos con la forma nasal',
          'Nasal irritation, watery eyes and sneezing with the nasal form',
        ),
        t('Hiperglucemia de rebote y taquicardia', 'Rebound hyperglycaemia and tachycardia'),
      ],
      serious: [
        t(
          'Crisis hipertensiva en pacientes con feocromocitoma',
          'Hypertensive crisis in patients with phaeochromocytoma',
        ),
        t(
          'Hipoglucemia grave en pacientes con insulinoma, por liberación reactiva de insulina',
          'Severe hypoglycaemia in patients with insulinoma, from reactive insulin release',
        ),
        t(
          'Reacciones de hipersensibilidad, incluida anafilaxia (raras)',
          'Hypersensitivity reactions including anaphylaxis (rare)',
        ),
        t(
          'Ineficacia en ausencia de glucógeno hepático: requiere glucosa intravenosa',
          'Ineffectiveness without hepatic glycogen: intravenous glucose is required',
        ),
      ],
    },
    contraindications: [
      t('Feocromocitoma', 'Phaeochromocytoma'),
      t('Insulinoma', 'Insulinoma'),
      t(
        'Hipersensibilidad al glucagón o a los excipientes (lactosa en algunas formulaciones)',
        'Hypersensitivity to glucagon or the excipients (lactose in some formulations)',
      ),
      t('Precaución en glucagonoma', 'Caution in glucagonoma'),
    ],
    interactions: [
      t(
        'Betabloqueantes: pueden acentuar la respuesta hipertensiva y taquicárdica transitoria',
        'Beta-blockers: may accentuate the transient hypertensive and tachycardic response',
      ),
      t(
        'Anticoagulantes cumarínicos: el glucagón puede potenciar su efecto',
        'Coumarin anticoagulants: glucagon may potentiate their effect',
      ),
      t(
        'Indometacina: puede impedir el aumento de glucemia',
        'Indomethacin: may prevent the rise in blood glucose',
      ),
    ],
    monitoring: [
      t(
        'Glucemia capilar tras la administración, con controles repetidos por el riesgo de recaída',
        'Capillary glucose after administration, with repeated checks because of the risk of relapse',
      ),
      t(
        'Nivel de consciencia y capacidad de ingesta oral',
        'Level of consciousness and ability to take food orally',
      ),
      t(
        'Potasio sérico si se han usado dosis repetidas',
        'Serum potassium if repeated doses were used',
      ),
      t(
        'Revisión periódica de la caducidad del kit y del adiestramiento del cuidador',
        'Periodic review of kit expiry and of caregiver training',
      ),
    ],
    keyTrials: [],
    references: [
      { label: 'GlucaGen HypoKit US Prescribing Information' },
      { label: 'Baqsimi (glucagon nasal powder) US Prescribing Information' },
      { label: 'ADA Standards of Care — Hypoglycemia' },
    ],
    tags: ['glucagon', 'hipoglucemia', 'rescate', 'nasal', 'urgencias'],
    lastReviewed: '2026-09-19',
  },

  {
    id: 'dasiglucagon',
    names: { generic: 'Dasiglucagón', brands: ['Zegalogue'], aliases: ['ZP4207', 'dasiglucagon'] },
    category: 'hormonal',
    pharmClass: t(
      'Análogo peptídico de glucagón estable en solución acuosa',
      'Glucagon peptide analogue stable in aqueous solution',
    ),
    summary: t(
      'Análogo de glucagón con siete sustituciones de aminoácidos que lo hacen estable en solución acuosa, lo que permite presentarlo como autoinyector o jeringa precargada listos para usar, sin reconstitución.',
      'Glucagon analogue with seven amino-acid substitutions that make it stable in aqueous solution, allowing presentation as a ready-to-use autoinjector or prefilled syringe with no reconstitution.',
    ),
    mechanism: t(
      'Agonista del receptor de glucagón con potencia equivalente a la del glucagón nativo: activa la glucogenólisis y la gluconeogénesis hepáticas y eleva la glucemia en unos 10 minutos.',
      'Glucagon receptor agonist with potency equivalent to native glucagon: it activates hepatic glycogenolysis and gluconeogenesis and raises blood glucose within about 10 minutes.',
    ),
    indications: [
      t(
        'Hipoglucemia grave en pacientes con diabetes de 6 años o más',
        'Severe hypoglycaemia in patients with diabetes aged 6 years and older',
      ),
    ],
    evidence: 'fda_approved',
    regulatory: {
      us: 'approved',
      eu: 'approved',
      notes: t(
        'También en desarrollo para el hiperinsulinismo congénito mediante infusión subcutánea continua.',
        'Also in development for congenital hyperinsulinism via continuous subcutaneous infusion.',
      ),
    },
    routes: ['sc'],
    defaultUnit: 'mg',
    pk: {
      halfLifeH: 0.5,
      tmaxH: 0.6,
      source:
        'Zegalogue US label §12.3: tmax ≈ 35 min y t½ ≈ 30 min tras dosis subcutánea de 0,6 mg',
      notes:
        'El tiempo mediano hasta la recuperación glucémica en los ensayos fue de unos 10 minutos. Como con el glucagón, el efecto es breve y exige aporte oral de hidratos de carbono después.',
    },
    dosing: {
      labeled: t(
        'Cero coma seis mg por vía subcutánea en el abdomen, el muslo o la cara externa del brazo, en adultos y en niños de 6 años o más. Si no hay respuesta en 15 minutos puede administrarse una segunda dosis de un dispositivo nuevo, y debe buscarse asistencia médica.',
        'Zero point six mg subcutaneously into the abdomen, thigh or outer upper arm, in adults and children aged 6 years and older. If there is no response within 15 minutes a second dose from a new device may be given, and medical assistance should be sought.',
      ),
      frequency: t('Uso de rescate puntual', 'Single-use rescue'),
    },
    reconstitution: t(
      'No requiere reconstitución: autoinyector o jeringa precargada listos para usar, lo que es su principal ventaja práctica frente al kit clásico de glucagón liofilizado en una situación de urgencia.',
      'No reconstitution needed: ready-to-use autoinjector or prefilled syringe, which is its main practical advantage over the classic lyophilised glucagon kit in an emergency.',
    ),
    storage: t(
      'Nevera 2–8 °C hasta la caducidad. Alternativamente puede conservarse a temperatura ambiente (20–25 °C) durante un máximo de 12 meses, anotando la nueva fecha límite. No congelar; proteger de la luz.',
      'Refrigerate 2–8 °C until expiry. Alternatively it may be kept at room temperature (20–25 °C) for a maximum of 12 months, noting the new use-by date. Do not freeze; protect from light.',
    ),
    adverseEffects: {
      common: [
        t('Náuseas y vómitos', 'Nausea and vomiting'),
        t('Cefalea', 'Headache'),
        t('Dolor en el punto de inyección', 'Injection-site pain'),
        t('Diarrea', 'Diarrhoea'),
      ],
      serious: [
        t('Crisis hipertensiva en feocromocitoma', 'Hypertensive crisis in phaeochromocytoma'),
        t(
          'Hipoglucemia por liberación reactiva de insulina en insulinoma',
          'Hypoglycaemia from reactive insulin release in insulinoma',
        ),
        t('Reacciones de hipersensibilidad', 'Hypersensitivity reactions'),
      ],
    },
    contraindications: [
      t('Feocromocitoma', 'Phaeochromocytoma'),
      t('Insulinoma', 'Insulinoma'),
      t(
        'Hipersensibilidad al dasiglucagón o a los excipientes',
        'Hypersensitivity to dasiglucagon or the excipients',
      ),
    ],
    interactions: [
      t(
        'Betabloqueantes: aumento transitorio de la presión arterial y del pulso',
        'Beta-blockers: transient increase in blood pressure and pulse',
      ),
      t(
        'Indometacina: puede anular el aumento de glucemia',
        'Indomethacin: may abolish the rise in blood glucose',
      ),
      t(
        'Warfarina: posible potenciación del efecto anticoagulante',
        'Warfarin: possible potentiation of the anticoagulant effect',
      ),
    ],
    monitoring: [
      t(
        'Glucemia tras la administración y durante las horas siguientes',
        'Blood glucose after administration and over the following hours',
      ),
      t(
        'Recuperación del nivel de consciencia y tolerancia oral',
        'Recovery of consciousness and oral tolerance',
      ),
      t(
        'Caducidad del dispositivo y fecha límite si se guarda fuera de la nevera',
        'Device expiry and use-by date if stored outside the fridge',
      ),
    ],
    keyTrials: [],
    references: [{ label: 'Zegalogue (dasiglucagon) US Prescribing Information' }],
    tags: ['glucagon', 'hipoglucemia', 'rescate', 'autoinyector'],
    lastReviewed: '2026-09-19',
  },

  {
    id: 'thyrotropin-alfa',
    names: {
      generic: 'Tirotropina alfa',
      brands: ['Thyrogen'],
      aliases: ['rhTSH', 'TSH recombinante', 'thyrotropin alfa'],
    },
    category: 'hormonal',
    pharmClass: t(
      'Hormona estimulante del tiroides humana recombinante',
      'Recombinant human thyroid-stimulating hormone',
    ),
    summary: t(
      'TSH humana recombinante que permite estimular el tejido tiroideo residual para el seguimiento del carcinoma diferenciado de tiroides sin necesidad de suspender la levotiroxina y provocar hipotiroidismo.',
      'Recombinant human TSH that stimulates residual thyroid tissue for follow-up of differentiated thyroid carcinoma without withdrawing levothyroxine and inducing hypothyroidism.',
    ),
    mechanism: t(
      'Se une al receptor de TSH en los tirocitos y activa la vía AMPc: aumenta la captación de yodo y la producción y liberación de tiroglobulina, lo que mejora la sensibilidad de la determinación de tiroglobulina y de la gammagrafía con yodo radiactivo.',
      'Binds the TSH receptor on thyrocytes and activates the cAMP pathway: it increases iodine uptake and the production and release of thyroglobulin, improving the sensitivity of thyroglobulin measurement and radioiodine scanning.',
    ),
    indications: [
      t(
        'Estimulación para la determinación de tiroglobulina, con o sin gammagrafía con yodo radiactivo, en el seguimiento del carcinoma diferenciado de tiroides',
        'Stimulation for thyroglobulin testing, with or without radioiodine scanning, in follow-up of differentiated thyroid carcinoma',
      ),
      t(
        'Preparación para la ablación de restos tiroideos con yodo radiactivo tras tiroidectomía',
        'Preparation for radioiodine remnant ablation after thyroidectomy',
      ),
    ],
    evidence: 'fda_approved',
    regulatory: { us: 'approved', eu: 'approved' },
    routes: ['im'],
    defaultUnit: 'mg',
    pk: {
      halfLifeH: 25,
      tmaxH: 10,
      source:
        'Thyrogen US label §12.3: tmax ≈ 3–24 h (media ≈ 10 h) y t½ ≈ 25 h tras administración intramuscular',
      notes:
        'La TSH sérica alcanza el pico unas 4–24 horas después de la segunda dosis, que es cuando se programan la gammagrafía y la extracción de tiroglobulina.',
    },
    dosing: {
      labeled: t(
        'Zero nueve mg por vía intramuscular en el glúteo, dos dosis separadas 24 horas. El yodo radiactivo se administra 24 horas después de la segunda inyección y la tiroglobulina se determina 72 horas después de esta. No debe administrarse por vía intravenosa.',
        'Zero point nine mg intramuscularly into the buttock, two doses 24 hours apart. Radioiodine is given 24 hours after the second injection and thyroglobulin is measured 72 hours after it. It must not be given intravenously.',
      ),
      frequency: t(
        'Dos dosis separadas 24 horas, por episodio diagnóstico',
        'Two doses 24 hours apart, per diagnostic episode',
      ),
    },
    reconstitution: t(
      'Vial liofilizado de 1,1 mg que se reconstituye con 1,2 mL de agua estéril para inyección, obteniendo 0,9 mg/mL; se administran 1 mL. Girar suavemente sin agitar para evitar espuma. Usar preferiblemente en las 3 horas siguientes; la solución puede conservarse refrigerada hasta 24 horas.',
      'A 1.1 mg lyophilised vial reconstituted with 1.2 mL of sterile water for injection, giving 0.9 mg/mL; 1 mL is administered. Swirl gently without shaking to avoid foaming. Use preferably within 3 hours; the solution may be kept refrigerated for up to 24 hours.',
    ),
    storage: t(
      'Viales liofilizados: nevera 2–8 °C protegidos de la luz. Reconstituido: hasta 24 horas refrigerado. No congelar.',
      'Lyophilised vials: refrigerate 2–8 °C protected from light. Reconstituted: up to 24 hours refrigerated. Do not freeze.',
    ),
    adverseEffects: {
      common: [
        t('Náuseas', 'Nausea'),
        t('Cefalea', 'Headache'),
        t('Astenia y mareo', 'Asthenia and dizziness'),
        t(
          'Dolor en el punto de inyección y sensación de calor',
          'Injection-site pain and a sensation of warmth',
        ),
      ],
      serious: [
        t(
          'Crecimiento agudo del tumor o de restos tiroideos, con dolor o compresión local (relevante en metástasis en el sistema nervioso central o cerca de la vía aérea)',
          'Acute enlargement of tumour or thyroid remnants, with local pain or compression (relevant with central nervous system metastases or near the airway)',
        ),
        t(
          'Tirotoxicosis transitoria en pacientes con tejido tiroideo funcionante residual',
          'Transient thyrotoxicosis in patients with residual functioning thyroid tissue',
        ),
        t(
          'Ictus e hipersensibilidad, notificados de forma infrecuente',
          'Stroke and hypersensitivity, reported infrequently',
        ),
      ],
    },
    contraindications: [
      t(
        'Hipersensibilidad a la TSH bovina o humana o a los excipientes',
        'Hypersensitivity to bovine or human TSH or to the excipients',
      ),
      t(
        'Precaución en metástasis en localizaciones críticas, donde puede considerarse corticoterapia previa',
        'Caution with metastases in critical locations, where pre-treatment with corticosteroids may be considered',
      ),
    ],
    interactions: [
      t(
        'Amiodarona, contrastes yodados y otras fuentes de yodo: reducen la captación de yodo radiactivo y pueden invalidar el estudio',
        'Amiodarone, iodinated contrast and other iodine sources: reduce radioiodine uptake and can invalidate the study',
      ),
      t(
        'Levotiroxina: se mantiene durante el procedimiento, que es precisamente su ventaja',
        'Levothyroxine: continued during the procedure, which is precisely its advantage',
      ),
      t(
        'Corticoides: se emplean de forma preventiva si se teme edema tumoral',
        'Corticosteroids: used preventively if tumour oedema is a concern',
      ),
    ],
    monitoring: [
      t(
        'Tiroglobulina y anticuerpos antitiroglobulina estimulados',
        'Stimulated thyroglobulin and antithyroglobulin antibodies',
      ),
      t(
        'TSH sérica para confirmar la estimulación adecuada',
        'Serum TSH to confirm adequate stimulation',
      ),
      t(
        'Síntomas neurológicos o compresivos en pacientes con metástasis de riesgo',
        'Neurological or compressive symptoms in patients with high-risk metastases',
      ),
    ],
    keyTrials: [
      {
        name: 'HiLo',
        year: 2012,
        finding: t(
          'La ablación con 1,1 GBq fue no inferior a 3,7 GBq, y la preparación con TSH recombinante fue equivalente a la retirada de levotiroxina, con menos efectos adversos.',
          'Ablation with 1.1 GBq was non-inferior to 3.7 GBq, and preparation with recombinant TSH was equivalent to levothyroxine withdrawal, with fewer adverse effects.',
        ),
        ref: 'NEJM 2012;366:1674',
      },
      {
        name: 'ESTIMABL',
        year: 2012,
        finding: t(
          'Resultados concordantes en Francia: tasas de ablación equivalentes con TSH recombinante y con dosis baja de yodo radiactivo.',
          'Concordant results in France: equivalent ablation rates with recombinant TSH and with low-dose radioiodine.',
        ),
        ref: 'NEJM 2012;366:1663',
      },
    ],
    references: [
      { label: 'Thyrogen (thyrotropin alfa) US Prescribing Information' },
      {
        label:
          'American Thyroid Association Management Guidelines for Adult Patients with Thyroid Nodules and Differentiated Thyroid Cancer',
      },
    ],
    tags: ['tsh', 'tiroides', 'carcinoma-diferenciado', 'diagnostico', 'yodo-radiactivo'],
    lastReviewed: '2026-09-19',
  },

  {
    id: 'cosyntropin',
    names: {
      generic: 'Cosintropina (tetracosáctido)',
      brands: ['Cortrosyn', 'Synacthen', 'Synacthen Depot'],
      aliases: ['ACTH(1-24)', 'tetracosactide', 'cosyntropin'],
    },
    category: 'hormonal',
    pharmClass: t(
      'Análogo sintético de ACTH (fragmento 1-24)',
      'Synthetic ACTH analogue (1-24 fragment)',
    ),
    summary: t(
      'Fragmento sintético de los 24 primeros aminoácidos de la corticotropina, que conserva toda la actividad biológica de la ACTH con menor inmunogenicidad. Es el reactivo estándar de la prueba de estimulación suprarrenal.',
      'Synthetic fragment of the first 24 amino acids of corticotropin, retaining the full biological activity of ACTH with lower immunogenicity. It is the standard reagent for adrenal stimulation testing.',
    ),
    mechanism: t(
      'Agonista del receptor de melanocortina tipo 2 en la corteza suprarrenal: activa la vía AMPc-PKA, moviliza colesterol mediante StAR y estimula la síntesis de cortisol, que alcanza el pico a los 30–60 minutos de su administración.',
      'Melanocortin type 2 receptor agonist in the adrenal cortex: it activates the cAMP-PKA pathway, mobilises cholesterol via StAR and stimulates cortisol synthesis, which peaks 30–60 minutes after administration.',
    ),
    indications: [
      t(
        'Prueba de estimulación para el diagnóstico de insuficiencia suprarrenal primaria y secundaria',
        'Stimulation test for the diagnosis of primary and secondary adrenal insufficiency',
      ),
      t(
        'Evaluación de la reserva suprarrenal tras corticoterapia prolongada',
        'Assessment of adrenal reserve after prolonged corticosteroid therapy',
      ),
      t(
        'Estudio de la hiperplasia suprarrenal congénita no clásica mediante 17-hidroxiprogesterona estimulada',
        'Work-up of non-classic congenital adrenal hyperplasia using stimulated 17-hydroxyprogesterone',
      ),
    ],
    evidence: 'fda_approved',
    regulatory: {
      us: 'approved',
      eu: 'approved',
      notes: t(
        'En Estados Unidos se comercializa como Cortrosyn para uso diagnóstico; Synacthen Depot, con uso terapéutico en algunos países europeos, no está disponible allí.',
        'In the United States it is marketed as Cortrosyn for diagnostic use; Synacthen Depot, used therapeutically in some European countries, is not available there.',
      ),
    },
    routes: ['iv', 'im'],
    defaultUnit: 'mcg',
    pk: {
      halfLifeH: 0.25,
      tmaxH: 0.17,
      source:
        'Cortrosyn US label §12.3: desaparición plasmática rápida, con semivida del orden de 15 minutos; el pico de cortisol se alcanza a los 30–60 min',
      notes:
        'La semivida del péptido es muy corta, pero la respuesta biológica (cortisol) se prolonga durante una hora larga, que es el intervalo en que se toman las muestras. La presentación depot (tetracosáctido de zinc) tiene una duración muy superior.',
    },
    dosing: {
      labeled: t(
        'Prueba estándar: 250 microgramos por vía intravenosa o intramuscular, con determinación de cortisol basal y a los 30 y 60 minutos. En el estudio de insuficiencia suprarrenal secundaria leve algunos protocolos emplean la prueba de dosis baja con 1 microgramo, que requiere dilución cuidadosa y no está recogida en la ficha técnica.',
        'Standard test: 250 micrograms intravenously or intramuscularly, with cortisol measured at baseline and at 30 and 60 minutes. In the evaluation of mild secondary adrenal insufficiency some protocols use the low-dose 1 microgram test, which requires careful dilution and is not covered by the label.',
      ),
      frequency: t('Dosis única por prueba diagnóstica', 'Single dose per diagnostic test'),
    },
    reconstitution: t(
      'Vial liofilizado de 0,25 mg que se reconstituye con 1 mL de suero salino fisiológico, obteniendo 250 microgramos/mL. Para la prueba de dosis baja se requiere una dilución seriada en salino hasta 1 microgramo/mL, con cuidado por la adsorción del péptido al plástico. Usar la solución inmediatamente.',
      'A 0.25 mg lyophilised vial reconstituted with 1 mL of normal saline, giving 250 micrograms/mL. The low-dose test requires serial dilution in saline to 1 microgram/mL, with care because the peptide adsorbs to plastic. Use the solution immediately.',
    ),
    storage: t(
      'Viales liofilizados: temperatura ambiente controlada (15–30 °C) según ficha técnica. Una vez reconstituido, usar de inmediato y desechar el resto; no conservar la solución.',
      'Lyophilised vials: controlled room temperature (15–30 °C) per the label. Once reconstituted, use immediately and discard the remainder; do not store the solution.',
    ),
    adverseEffects: {
      common: [
        t('Rubefacción y sensación de calor', 'Flushing and a sensation of warmth'),
        t('Molestia leve en el punto de inyección', 'Mild injection-site discomfort'),
        t('Náuseas transitorias', 'Transient nausea'),
      ],
      serious: [
        t(
          'Reacciones de hipersensibilidad y anafilaxia, más frecuentes en pacientes atópicos o asmáticos',
          'Hypersensitivity reactions and anaphylaxis, more frequent in atopic or asthmatic patients',
        ),
        t(
          'Retención hidrosalina e hipertensión con el uso terapéutico repetido de las formas depot',
          'Fluid and sodium retention and hypertension with repeated therapeutic use of depot forms',
        ),
        t(
          'Descompensación glucémica en diabetes con el uso terapéutico',
          'Glycaemic decompensation in diabetes with therapeutic use',
        ),
      ],
    },
    contraindications: [
      t(
        'Hipersensibilidad conocida a la cosintropina o al tetracosáctido',
        'Known hypersensitivity to cosyntropin or tetracosactide',
      ),
      t(
        'Para las formas depot con uso terapéutico: úlcera péptica activa, infección no controlada, psicosis e insuficiencia cardiaca',
        'For depot forms in therapeutic use: active peptic ulcer, uncontrolled infection, psychosis and heart failure',
      ),
    ],
    interactions: [
      t(
        'Glucocorticoides exógenos: la hidrocortisona y la prednisolona interfieren en el inmunoensayo de cortisol; se prefiere dexametasona si es imprescindible tratar antes de la prueba',
        'Exogenous glucocorticoids: hydrocortisone and prednisolone interfere with the cortisol immunoassay; dexamethasone is preferred if treatment before the test is unavoidable',
      ),
      t(
        'Estrógenos y anticonceptivos orales: elevan la globulina transportadora de cortisol y pueden dar resultados falsamente normales',
        'Estrogens and oral contraceptives: raise cortisol-binding globulin and may give falsely normal results',
      ),
      t(
        'Espironolactona: puede interferir en algunos ensayos de cortisol',
        'Spironolactone: may interfere with some cortisol assays',
      ),
    ],
    monitoring: [
      t(
        'Cortisol sérico basal y a los 30 y 60 minutos',
        'Serum cortisol at baseline and at 30 and 60 minutes',
      ),
      t(
        'ACTH plasmática basal para distinguir insuficiencia primaria de secundaria',
        'Baseline plasma ACTH to distinguish primary from secondary insufficiency',
      ),
      t(
        'Renina y aldosterona si se sospecha afectación mineralocorticoide',
        'Renin and aldosterone if mineralocorticoid involvement is suspected',
      ),
      t(
        'Vigilancia inmediata de reacción alérgica tras la inyección',
        'Immediate observation for allergic reaction after injection',
      ),
    ],
    keyTrials: [],
    references: [
      { label: 'Cortrosyn (cosyntropin) US Prescribing Information' },
      {
        label:
          'Endocrine Society Clinical Practice Guideline: Diagnosis and Treatment of Primary Adrenal Insufficiency',
      },
    ],
    tags: ['acth', 'suprarrenal', 'diagnostico', 'cortisol'],
    lastReviewed: '2026-09-19',
  },
]
