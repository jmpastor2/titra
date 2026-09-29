/**
 * Content schema for the peptide wiki and protocol templates.
 *
 * Content is authored in TypeScript so it is type-checked, reviewable in pull
 * requests and bundled for offline use. Clinician annotations live in the DB.
 */
import type {
  CompoundCategory,
  DoseUnit,
  EvidenceTier,
  PkParams,
  RegulatoryStatus,
  Route,
  ScheduleStep,
} from '@/domain/types'

/** Spanish first, English second. Both required. */
export interface L10n {
  es: string
  en: string
}

export interface KeyTrial {
  name: string
  year: number
  finding: L10n
  /** Registry id, DOI, PMID or label section. Never invent identifiers. */
  ref?: string
}

export interface Reference {
  label: string
  url?: string
}

export interface DosingInfo {
  /** Approved-label dosing, when the compound is approved somewhere. */
  labeled?: L10n
  /** Dosing reported in trials or clinical literature (not approved use). */
  investigational?: L10n
  /** Community / anecdotal usage, always shown with a warning. */
  anecdotal?: L10n
  /** Typical frequency wording, e.g. "1×/semana". */
  frequency?: L10n
  /** Ids of protocol templates available for this compound. */
  templateIds?: string[]
}

/** One peptide inside a premixed vial. */
export interface BlendComponent {
  /** Id of the component's own wiki entry. */
  compoundId: string
  /** Typical label amount per vial, in mg. */
  mg: number
}

/**
 * Premixed multi-peptide vial ("blend"). Blends are wiki entries in their own right
 * (so they have a page), but they are not substances: protocols and inventory store
 * their components. Evidence must equal the weakest component (see content tests).
 */
export interface BlendInfo {
  /** Components in label order; the first is the vial's primary. */
  components: BlendComponent[]
  /** Why these peptides are sold together. */
  rationale: L10n
  /** Matching preset id in src/features/inventory/blendPresets.ts, if there is one. */
  presetId?: string
  /** Water volume (mL) used for the worked example and the default of the calculator. */
  exampleDiluentMl?: number
}

export interface CompoundEntry {
  /** Stable slug used as primary key everywhere (e.g. "semaglutide"). */
  id: string
  names: {
    generic: string
    brands: string[]
    aliases: string[]
  }
  category: CompoundCategory
  /** Pharmacological class, e.g. "Agonista del receptor GLP-1". */
  pharmClass: L10n
  /** 1–2 sentence summary. */
  summary: L10n
  mechanism: L10n
  /** Approved and investigated uses. */
  indications: L10n[]
  evidence: EvidenceTier
  regulatory: {
    us: RegulatoryStatus
    eu?: RegulatoryStatus
    notes?: L10n
  }
  routes: Route[]
  defaultUnit: DoseUnit
  /** Required for incretins (drives the PK engine); optional elsewhere. */
  pk?: PkParams
  dosing: DosingInfo
  /** Vial sizes, diluent, stability after reconstitution. */
  reconstitution?: L10n
  storage: L10n
  adverseEffects: {
    common: L10n[]
    serious: L10n[]
  }
  contraindications: L10n[]
  interactions: L10n[]
  /** Labs/parameters a clinician would monitor. */
  monitoring?: L10n[]
  keyTrials: KeyTrial[]
  references: Reference[]
  tags: string[]
  /** ISO date of last editorial review. */
  lastReviewed: string
  /** Present only on premixed blend entries. */
  blend?: BlendInfo
}

export interface ProtocolTemplate {
  id: string
  compoundId: string
  name: L10n
  /** Where the schedule comes from (label, trial arm...). */
  source: L10n
  evidence: EvidenceTier
  route: Route
  unit: DoseUnit
  steps: ScheduleStep[]
  notes?: L10n
}

/** Helper for terse bilingual literals. */
export const t = (es: string, en: string): L10n => ({ es, en })
