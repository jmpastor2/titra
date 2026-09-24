/**
 * Domain types shared by the PK engine, dosing logic, content and UI.
 * These are deliberately independent from the database row shapes
 * (see src/data/database.types.ts) so the domain can be unit-tested in isolation.
 */

export type Route = 'sc' | 'im' | 'oral' | 'nasal' | 'iv' | 'topical' | 'sl'

export type DoseUnit = 'mg' | 'mcg' | 'iu' | 'units' | 'ml'

export type EvidenceTier =
  | 'fda_approved' // Approved by FDA/EMA for at least one indication
  | 'phase3' // Late-stage clinical trials
  | 'phase2'
  | 'phase1'
  | 'preclinical' // Animal / in vitro only
  | 'anecdotal' // Community reports, no controlled human data
  | 'withdrawn' // Approved then withdrawn/discontinued

export type RegulatoryStatus =
  | 'approved' // Approved medicine (may be brand or generic)
  | 'compounded' // Available via compounding pharmacies (US 503A/503B) with prescription
  | 'investigational' // In clinical development, not approved
  | 'research_only' // Sold as "research chemical", not approved for human use
  | 'discontinued'
  | 'controlled' // Controlled substance in most jurisdictions

export type CompoundCategory =
  | 'incretin' // GLP-1 / GIP / glucagon receptor agonists and amylin analogues
  | 'gh_axis' // GHRH analogues, GHRPs, GH, IGF-1
  | 'repair' // Tissue repair / anti-inflammatory peptides
  | 'metabolic' // Mitochondrial, fat metabolism
  | 'sexual' // Melanocortin agonists, kisspeptin, oxytocin
  | 'cognitive' // Nootropic peptides
  | 'longevity' // Bioregulators, senolytics
  | 'hormonal' // Reproductive axis, thyroid, adrenal adjuncts
  | 'immune' // Thymic peptides, antimicrobial peptides
  | 'insulin' // Insulins and glucose-regulating hormones
  | 'other'

/** Pharmacokinetic parameters that drive the exposure engine. Times in hours. */
export interface PkParams {
  /** Terminal elimination half-life (hours). Required for the engine. */
  halfLifeH: number
  /** Time to peak after a single dose (hours). When omitted the dose is modelled as a bolus. */
  tmaxH?: number
  /** Fraction absorbed (0–1). Defaults to 1; only affects absolute concentration, not shape. */
  bioavailability?: number
  /** Apparent volume of distribution V/F in litres. Enables concentration output. */
  apparentVolumeL?: number
  /** Molar mass in g/mol. Enables nmol/L output when apparentVolumeL is known. */
  molarMassGPerMol?: number
  /** Source citation for the parameters (label section, PMID, DOI...). */
  source?: string
  /** Free-text caveats: e.g. flip-flop kinetics for depot formulations. */
  notes?: string
}

export interface DoseEvent {
  /** Administration time. */
  at: Date
  /** Dose amount in mg (unit-normalised by the caller). */
  mg: number
}

export interface ScheduleStep {
  /** Dose of the primary compound per administration, in mg. */
  doseMg: number
  /**
   * Interval between administration days, in days (7 = weekly, 3.5 = twice a week).
   * Ignored when `weekdays` is set.
   */
  intervalDays: number
  /** Administer only on these weekdays (0 = Sunday … 6 = Saturday), e.g. [1,2,3,4,5] for 5 on / 2 off. */
  weekdays?: number[]
  /** Off-cycle step: no administrations for its duration. */
  pause?: boolean
  /** Duration of the step in weeks; null means open-ended maintenance. */
  durationWeeks: number | null
  /** Optional label like "Escalón 1" or "Mantenimiento". */
  label?: string
}

/** A compound given in the same administration as the protocol's primary compound. */
export interface StackComponent {
  compoundId: string
  /** Fixed dose per administration, in mg. */
  doseMg: number
}

export interface ProtocolLike {
  compoundId: string
  startDate: string // ISO yyyy-MM-dd
  steps: ScheduleStep[]
  /** Administration times on each dosing day, "HH:mm" local. At least one. */
  times: string[]
  /** Extra compounds drawn into the same syringe (e.g. Mod GRF 1-29 with ipamorelin). */
  components?: StackComponent[]
}

export interface InjectionSite {
  id: string
  /** i18n key suffix */
  labelKey: string
  region: 'abdomen' | 'thigh' | 'arm' | 'glute' | 'other'
  side: 'left' | 'right' | 'center'
}
