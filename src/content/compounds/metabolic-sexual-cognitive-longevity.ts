import { t, type CompoundDetail } from '../schema'

/**
 * Metabolic, sexual-health, cognitive and longevity compounds.
 * Most entries are research chemicals without controlled human data; evidence
 * tiers and regulatory status are stated conservatively. Dosing labelled
 * "anecdotal" is community usage reproduced for harm-reduction context only.
 */
export const METABOLIC_SEXUAL_COGNITIVE_LONGEVITY: CompoundDetail[] = [
  // ───────────────────────────── METABOLIC ─────────────────────────────
  {
    id: 'mots-c',
    names: {
      generic: 'MOTS-c',
      brands: [],
      aliases: ['MOTSc', 'Mitochondrial ORF of the 12S rRNA type-c', 'CB4211 (análogo)'],
    },
    category: 'metabolic',
    pharmClass: t(
      'Péptido derivado de la mitocondria (MDP) regulador metabólico',
      'Mitochondrial-derived peptide (MDP), metabolic regulator',
    ),
    summary: t(
      'Péptido de 16 aminoácidos codificado en el ADN mitocondrial (12S rRNA) que actúa como señal mitonuclear de estrés metabólico. En roedores mejora la sensibilidad a la insulina y previene la obesidad por dieta; en humanos solo existe un ensayo de fase 1 con un análogo (CB4211) sin desarrollo posterior.',
      '16-amino-acid peptide encoded in mitochondrial DNA (12S rRNA) acting as a mitonuclear metabolic-stress signal. Improves insulin sensitivity and prevents diet-induced obesity in rodents; in humans only a phase 1 trial of an analogue (CB4211) exists, with no further development.',
    ),
    mechanism: t(
      'Inhibe la vía de purinas de novo (acumulación de AICAR) y activa AMPK; en estrés metabólico se transloca al núcleo y regula genes de respuesta antioxidante (ARE/NRF2). Aumenta la captación de glucosa en músculo y la oxidación de ácidos grasos. Sus niveles circulantes disminuyen con la edad y la resistencia a la insulina.',
      'Inhibits de novo purine synthesis (AICAR accumulation) and activates AMPK; under metabolic stress it translocates to the nucleus and regulates antioxidant-response genes (ARE/NRF2). Increases skeletal-muscle glucose uptake and fatty-acid oxidation. Circulating levels fall with age and insulin resistance.',
    ),
    indications: [
      t('Ninguna aprobada', 'None approved'),
      t(
        'Investigado: obesidad, resistencia a la insulina, MASLD (CB4211, fase 1a/1b)',
        'Investigated: obesity, insulin resistance, MASLD (CB4211, phase 1a/1b)',
      ),
      t(
        'Preclínico: sarcopenia, rendimiento físico, envejecimiento metabólico',
        'Preclinical: sarcopenia, exercise capacity, metabolic ageing',
      ),
    ],
    evidence: 'preclinical',
    regulatory: {
      us: 'research_only',
      notes: t(
        'Vendido como "producto de investigación". Incluido por la FDA en la revisión de sustancias a granel para fórmula magistral 503A con clasificación de riesgo de seguridad significativo (2023–2024). El análogo CB4211 (CohBar) completó fase 1 en 2021 sin continuar.',
        'Sold as a "research product". Included in the FDA 503A bulk-substance review with a significant-safety-risk classification (2023–2024). The analogue CB4211 (CohBar) completed phase 1 in 2021 with no further development.',
      ),
    },
    routes: ['sc'],
    defaultUnit: 'mg',
    dosing: {
      investigational: t(
        'CB4211 (análogo, no MOTS-c nativo): dosis SC diarias en fase 1 con reducción modesta de glucosa y peso a 4 semanas.',
        'CB4211 (analogue, not native MOTS-c): daily SC doses in phase 1 with modest glucose and weight reduction at 4 weeks.',
      ),
      anecdotal: t(
        'Uso no aprobado — las pautas comunitarias varían mucho: desde 1–2,5 mg hasta 5–10 mg SC, 2–3×/semana (p. ej. lunes, miércoles y viernes), en ciclos de 4–8 semanas; hay quien lo pone antes de entrenar. En roedores las dosis eficaces fueron 0,5–15 mg/kg, muy superiores por kg a las usadas en personas.',
        'Unapproved use — community schedules vary widely: from 1–2.5 mg up to 5–10 mg SC, 2–3×/week (e.g. Monday, Wednesday and Friday), in 4–8-week cycles; some inject it before training. Effective rodent doses were 0.5–15 mg/kg, far higher per kg than those used in people.',
      ),
      frequency: t('2–3×/semana (uso no aprobado)', '2–3×/week (unapproved use)'),
    },
    reconstitution: t(
      'Vial liofilizado de 10 mg. Con 1 mL de agua bacteriostática = 10 mg/mL: en jeringa U-100, 1 U = 0,1 mg → 1 mg = 10 U, 1,5 mg = 15 U, 5 mg = 50 U. Con 2 mL = 5 mg/mL → 1 mg = 20 U, 5 mg = 100 U. Menos agua deja volúmenes más pequeños; más agua facilita medir dosis bajas.',
      '10 mg lyophilised vial. With 1 mL bacteriostatic water = 10 mg/mL: on a U-100 syringe, 1 U = 0.1 mg → 1 mg = 10 U, 1.5 mg = 15 U, 5 mg = 50 U. With 2 mL = 5 mg/mL → 1 mg = 20 U, 5 mg = 100 U. Less water gives smaller volumes; more water makes low doses easier to measure.',
    ),
    storage: t(
      'Liofilizado: −20 °C a largo plazo, 2–8 °C durante meses. Reconstituido: 2–8 °C, protegido de la luz, no congelar. Habitualmente se indica usarlo en 28–30 días: orientación de fabricantes y de la comunidad, sin datos de estabilidad publicados (los 28 días vienen de la norma USP <797> para viales multidosis y se refieren a la esterilidad).',
      'Lyophilised: −20 °C long term, 2–8 °C for months. Reconstituted: 2–8 °C, protected from light, do not freeze. The usual guidance is to use it within 28–30 days: manufacturer and community guidance with no published stability data (the 28 days come from USP <797> for multiple-dose vials and concern sterility).',
    ),
    adverseEffects: {
      common: [
        t('Reacciones en el punto de inyección', 'Injection-site reactions'),
        t('Hipoglucemia leve referida anecdóticamente', 'Mild hypoglycaemia reported anecdotally'),
      ],
      serious: [
        t(
          'No caracterizados: sin datos humanos controlados; pureza y esterilidad del producto no garantizadas',
          'Uncharacterised: no controlled human data; product purity and sterility not guaranteed',
        ),
      ],
    },
    contraindications: [
      t('Embarazo y lactancia (sin datos)', 'Pregnancy and lactation (no data)'),
      t(
        'Uso concomitante de hipoglucemiantes sin supervisión',
        'Unsupervised use with glucose-lowering drugs',
      ),
    ],
    interactions: [
      t(
        'Insulina, sulfonilureas, metformina: efecto aditivo teórico sobre la glucemia (AMPK)',
        'Insulin, sulfonylureas, metformin: theoretical additive glucose-lowering (AMPK)',
      ),
      t(
        'Agonistas de GLP-1/GIP (retatrutida, tirzepatida, semaglutida): efecto aditivo teórico sobre la glucosa; sin estudios de la combinación',
        'GLP-1/GIP agonists (retatrutide, tirzepatide, semaglutide): theoretical additive glucose effect; the combination is unstudied',
      ),
    ],
    monitoring: [
      t(
        'Glucosa en ayunas y HbA1c al inicio y a los 2–3 meses',
        'Fasting glucose and HbA1c at baseline and after 2–3 months',
      ),
      t(
        'Síntomas de hipoglucemia (temblor, sudor, mareo), sobre todo si se combina con otros fármacos que bajan la glucosa',
        'Hypoglycaemia symptoms (shaking, sweating, dizziness), above all when combined with other glucose-lowering drugs',
      ),
      t('Peso y reacciones en el punto de inyección', 'Weight and injection-site reactions'),
    ],
    keyTrials: [
      {
        name: 'Lee et al. (descubrimiento MOTS-c)',
        year: 2015,
        finding: t(
          'Identificación del péptido; mejora de la sensibilidad a la insulina y prevención de obesidad por dieta en ratones.',
          'Peptide identified; improved insulin sensitivity and prevention of diet-induced obesity in mice.',
        ),
        ref: 'Cell Metab 2015;21:443',
      },
      {
        name: 'CB4211 fase 1a/1b',
        year: 2021,
        finding: t(
          'Análogo de MOTS-c en sujetos con obesidad y MASLD: seguro, con reducciones modestas de glucosa y peso; programa abandonado.',
          'MOTS-c analogue in obese subjects with MASLD: safe, modest glucose and weight reductions; programme abandoned.',
        ),
      },
    ],
    references: [
      {
        label:
          'Lee C et al. The mitochondrial-derived peptide MOTS-c promotes metabolic homeostasis. Cell Metab 2015',
      },
      {
        label:
          'Reynolds JC et al. MOTS-c is an exercise-induced mitochondrial-encoded regulator. Nat Commun 2021',
      },
      { label: 'FDA 503A Bulks List — category 2 nominations (peptides)' },
    ],
    tags: ['mitocondrial', 'metabolico', 'obesidad', 'investigacion'],
    lastReviewed: '2026-09-30',
  },
]
