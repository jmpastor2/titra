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
