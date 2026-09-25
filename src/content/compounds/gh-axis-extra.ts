import { t, type CompoundEntry } from '../schema'

/**
 * Additional GH-axis entries.
 *
 * Editorial note: Mod GRF 1-29 is the DAC-free molecule that most people mean
 * by "CJC-1295" in a CJC + ipamorelin stack. It has no published human PK, so
 * `pk` is deliberately omitted: the exposure engine must not model it.
 */

const modGrf: CompoundEntry = {
  id: 'mod-grf-1-29',
  names: {
    // Sold and dosed as "CJC-1295" in the CJC/ipamorelin blends: that is the name users know.
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
  pharmClass: t(
    'Análogo de GHRH de acción corta (GRF 1-29 tetrasustituido, sin DAC)',
    'Short-acting GHRH analogue (tetrasubstituted GRF 1-29, without DAC)',
  ),
  summary: t(
    'Análogo sintético de GHRH(1-29), la misma secuencia de 29 aminoácidos que la sermorelina, con cuatro posiciones sustituidas para resistir la degradación y sin el complejo de afinidad por albúmina (DAC). Es lo que suele venderse como “CJC-1295” en los blends con ipamorelina. Su semivida efectiva suele citarse en torno a 30 minutos, pero no hay datos farmacocinéticos humanos controlados, por lo que la app no dibuja una curva de exposición. No confundir con CJC-1295 con DAC (semivida de días). Solo circula como producto de investigación.',
    'Synthetic GHRH(1-29) analogue, the same 29-amino-acid sequence as sermorelin, with four positions substituted to resist degradation and without the albumin-binding Drug Affinity Complex (DAC). It is what is usually sold as “CJC-1295” in blends with ipamorelin. Its effective half-life is commonly quoted around 30 minutes, but there are no controlled human pharmacokinetic data, so the app does not draw an exposure curve. Not to be confused with CJC-1295 with DAC (half-life of days). It circulates only as a research chemical.',
  ),
  mechanism: t(
    'Agonista del receptor de GHRH en las somatotropas: desencadena un pulso breve de GH que respeta el ritmo fisiológico y la retroalimentación por somatostatina e IGF-1. Frente a la sermorelina cambia cuatro aminoácidos: en la posición 2 una D-alanina frena el corte por la DPP-4 (la principal vía de inactivación de la GHRH en plasma); en la 8 una glutamina evita la desamidación; en la 15 una alanina estabiliza la hélice y mejora la unión al receptor; y en la 27 una leucina sustituye a la metionina para evitar su oxidación. El resultado es más estable que la sermorelina, pero sigue siendo de acción corta. Se combina con un GHRP como la ipamorelina, que actúa sobre otro receptor (GHS-R1a) y reduce el tono de somatostatina: la combinación GHRH + GHRP produce un pico de GH mayor que la suma de ambos por separado (sinergia descrita con GHRH y GHRP en general, no con esta pareja concreta en ensayos).',
    'GHRH receptor agonist on somatotrophs: triggers a brief GH pulse that respects the physiological rhythm and feedback by somatostatin and IGF-1. Compared with sermorelin it changes four amino acids: at position 2 a D-alanine slows DPP-4 cleavage (the main route of GHRH inactivation in plasma); at 8 a glutamine prevents deamidation; at 15 an alanine stabilises the helix and improves receptor binding; and at 27 a leucine replaces methionine to prevent its oxidation. The result is more stable than sermorelin but still short-acting. It is paired with a GHRP such as ipamorelin, which acts on a different receptor (GHS-R1a) and lowers somatostatin tone: GHRH + GHRP produces a GH peak larger than the sum of each alone (synergy described for GHRH and GHRPs in general, not for this specific pair in trials).',
  ),
  indications: [
    t(
      'Uso comunitario: pulsos de GH combinado con un GHRP para composición corporal, recuperación y sueño (sin ensayos)',
      'Community use: GH pulses combined with a GHRP for body composition, recovery and sleep (no trials)',
    ),
    t(
      'Investigación preclínica del eje GHRH (precursor de CJC-1295 con DAC)',
      'Preclinical GHRH-axis research (precursor of CJC-1295 with DAC)',
    ),
  ],
  evidence: 'anecdotal',
  regulatory: {
    us: 'research_only',
    notes: t(
      'Nunca aprobado ni desarrollado clínicamente como fármaco propio; los datos disponibles son preclínicos y el uso en humanos es comunitario. Se vende como producto de investigación, con pureza y contenido no garantizados. La FDA incluyó “CJC-1295” en la categoría 2 de sustancias a granel (2023), lo que impide su formulación magistral legal en EE. UU. Prohibido por la AMA (S2, factores liberadores de GH).',
      'Never approved or clinically developed as a drug in its own right; available data are preclinical and human use is community-based. Sold as a research chemical, with unguaranteed purity and content. FDA placed “CJC-1295” in bulk-substance Category 2 (2023), which bars lawful compounding in the US. WADA prohibited (S2, GH-releasing factors).',
    ),
  },
  routes: ['sc'],
  defaultUnit: 'mcg',
  dosing: {
    anecdotal: t(
      'Uso no aprobado — 100 µg SC (a veces expresado como ~1 µg/kg) 1–3×/día, en ayunas (unas 2 h sin comer y esperando ~20–30 min antes de la siguiente comida), con frecuencia una dosis al acostarse para coincidir con el pulso nocturno de GH. Habitualmente en la misma jeringa con un GHRP como ipamorelina 100–300 µg. Rangos comunitarios sin ensayos que los respalden.',
      'Unapproved use — 100 µg SC (sometimes expressed as ~1 µg/kg) 1–3×/day, fasted (about 2 h without food and waiting ~20–30 min before the next meal), often one dose at bedtime to coincide with the nocturnal GH pulse. Usually in the same syringe with a GHRP such as ipamorelin 100–300 µg. Community ranges with no supporting trials.',
    ),
    frequency: t('1–3×/día', '1–3×/day'),
  },
  reconstitution: t(
    'Viales liofilizados de 2 mg (también de 5 mg). Ejemplo: 2 mg + 2 mL de agua bacteriostática = 1 mg/mL → 100 µg = 0,1 mL = 10 U en jeringa U-100. Para combinar con ipamorelina, cargar cada péptido desde su propio vial en la misma jeringa justo antes de inyectar. Reconstituido: nevera 2–8 °C, usar en ~3–4 semanas (estabilidad orientativa, sin datos del fabricante); no agitar, disolver girando suavemente.',
    'Lyophilised 2 mg vials (5 mg also available). Example: 2 mg + 2 mL bacteriostatic water = 1 mg/mL → 100 µg = 0.1 mL = 10 units on a U-100 syringe. To combine with ipamorelin, draw each peptide from its own vial into the same syringe just before injecting. Reconstituted: refrigerate 2–8 °C, use within ~3–4 weeks (indicative stability, no manufacturer data); do not shake, dissolve by gentle swirling.',
  ),
  storage: t(
    'Liofilizado: nevera 2–8 °C (o −20 °C a largo plazo), protegido de la luz. Reconstituido: nevera, no congelar. Parece menos estable en solución que la forma con DAC; desechar si se enturbia.',
    'Lyophilised: refrigerate 2–8 °C (or −20 °C long term), protect from light. Reconstituted: refrigerate, do not freeze. Appears less stable in solution than the DAC form; discard if it turns cloudy.',
  ),
  adverseEffects: {
    common: [
      t(
        'Rubefacción facial y sensación de calor en los minutos posteriores a la inyección (transitoria)',
        'Facial flushing and warmth in the minutes after injection (transient)',
      ),
      t(
        'Reacciones en el punto de inyección (eritema, picor, dolor)',
        'Injection-site reactions (erythema, itching, pain)',
      ),
      t('Retención hídrica leve', 'Mild water retention'),
      t(
        'Hormigueo o entumecimiento en manos (parestesias)',
        'Tingling or numbness in the hands (paraesthesia)',
      ),
      t('Cefalea, mareo transitorio', 'Headache, transient dizziness'),
      t('Somnolencia posdosis', 'Post-dose drowsiness'),
    ],
    serious: [
      t(
        'Hiperglucemia / resistencia a la insulina con uso crónico',
        'Hyperglycaemia / insulin resistance with chronic use',
      ),
      t(
        'Crecimiento de neoplasias ocultas mediado por IGF-1 (teórico)',
        'IGF-1-mediated growth of occult neoplasms (theoretical)',
      ),
      t('Hipersensibilidad', 'Hypersensitivity'),
      t(
        'Producto de investigación: riesgo de contenido incorrecto, contaminación o endotoxinas',
        'Research chemical: risk of wrong content, contamination or endotoxins',
      ),
      t(
        'Sin datos de seguridad a largo plazo ni de inmunogenicidad',
        'No long-term safety or immunogenicity data',
      ),
    ],
  },
  contraindications: [
    t('Neoplasia activa o antecedente reciente', 'Active or recent malignancy'),
    t('Embarazo y lactancia', 'Pregnancy and lactation'),
    t(
      'Diabetes mal controlada o retinopatía diabética proliferativa',
      'Poorly controlled diabetes or proliferative diabetic retinopathy',
    ),
    t('Hipersensibilidad conocida', 'Known hypersensitivity'),
  ],
  interactions: [
    t('Glucocorticoides: atenúan la liberación de GH', 'Glucocorticoids: blunt GH release'),
    t(
      'Análogos de somatostatina (octreótido, lanreótido): antagonizan el efecto',
      'Somatostatin analogues (octreotide, lanreotide): antagonise the effect',
    ),
    t(
      'Insulina y antidiabéticos: la GH reduce la sensibilidad a la insulina; vigilar glucosa y ajustar',
      'Insulin and antidiabetics: GH reduces insulin sensitivity; monitor glucose and adjust',
    ),
    t(
      'Comida (hidratos de carbono, grasa) cerca de la dosis: reduce el pico de GH',
      'Food (carbohydrate, fat) near the dose: reduces the GH peak',
    ),
    t(
      'GHRP (ipamorelina, GHRP-2/6): sinergia en la liberación de GH',
      'GHRPs (ipamorelin, GHRP-2/6): synergistic GH release',
    ),
  ],
  monitoring: [
    t('IGF-1 basal y a las 4–8 semanas', 'Baseline and 4–8-week IGF-1'),
    t('Glucosa en ayunas / HbA1c', 'Fasting glucose / HbA1c'),
    t('Peso, edema, presión arterial', 'Weight, oedema, blood pressure'),
    t(
      'Síntomas de túnel carpiano o parestesias persistentes',
      'Carpal tunnel symptoms or persistent paraesthesia',
    ),
  ],
  keyTrials: [],
  references: [
    {
      label:
        'Jetté L et al. hGRF1-29-albumin bioconjugates activate the GRF receptor on the anterior pituitary in rats: identification of CJC-1295 as a long-lasting GRF analog. Endocrinology 2005 (preclínico)',
    },
    {
      label:
        'Sermorelina (GHRH 1-29 NH2) — molécula de referencia para las sustituciones; ver ficha de sermorelina',
    },
    {
      label:
        'FDA — Bulk drug substances nominated for use in compounding under section 503A (Category 2 list, 2023)',
    },
    { label: 'WADA Prohibited List — S2 peptide hormones, growth factors and related substances' },
  ],
  tags: ['ghrh', 'gh', 'pulsátil', 'diario', 'ipamorelina', 'cjc-1295', 'investigación'],
  lastReviewed: '2026-09-25',
}

export const GH_AXIS_EXTRA: CompoundEntry[] = [modGrf]
