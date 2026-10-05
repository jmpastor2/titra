import type { EvidenceTier } from '@/domain/types'

/** Strongest first. `withdrawn` sits below phase 1: it had human data but was pulled. */
export const EVIDENCE_ORDER: readonly EvidenceTier[] = [
  'fda_approved',
  'phase3',
  'phase2',
  'phase1',
  'withdrawn',
  'preclinical',
  'anecdotal',
]

export function weakestEvidence(tiers: readonly EvidenceTier[]): EvidenceTier {
  return tiers.reduce<EvidenceTier>(
    (worst, e) => (EVIDENCE_ORDER.indexOf(e) > EVIDENCE_ORDER.indexOf(worst) ? e : worst),
    'fda_approved',
  )
}
