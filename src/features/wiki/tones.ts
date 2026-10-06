import type { EvidenceTier, RegulatoryStatus } from '@/domain/types'

type Tone = 'neutral' | 'brand' | 'accent' | 'ok' | 'warn' | 'danger'

/** Badge tone of an evidence tier: trials read as "fine", animal or user reports as "careful". */
export function evidenceTone(e: EvidenceTier): Tone {
  switch (e) {
    case 'fda_approved':
    case 'phase3':
    case 'phase2':
    case 'phase1':
      return 'brand'
    case 'preclinical':
    case 'anecdotal':
      return 'warn'
    case 'withdrawn':
      return 'danger'
  }
}

/** Colour of the evidence bars and readout, from the same three meanings (tokens only). */
export function evidenceColor(e: EvidenceTier): string {
  const tone = evidenceTone(e)
  return tone === 'warn' ? 'var(--warn)' : tone === 'danger' ? 'var(--danger)' : 'var(--signal)'
}

/** Quiet unless the status changes what you can do: approved, controlled, not for humans. */
export function regulatoryTone(r: RegulatoryStatus): Tone {
  switch (r) {
    case 'approved':
      return 'brand'
    case 'controlled':
      return 'warn'
    case 'research_only':
      return 'danger'
    case 'compounded':
    case 'investigational':
    case 'discontinued':
      return 'neutral'
  }
}
