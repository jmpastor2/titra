import { t, type CompoundDetail } from '../schema'

/**
 * Hormonal axis agents that people run next to peptides: hCG and gonadorelin.
 *
 * Off-label uses (notably as adjuncts to testosterone therapy) are labelled as such
 * and kept out of `dosing.labeled`.
 */

export const HORMONAL: CompoundDetail[] = [
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
]
