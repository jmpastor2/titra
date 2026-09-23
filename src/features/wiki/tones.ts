import type { EvidenceTier, RegulatoryStatus } from '@/domain/types'

type Tone = 'neutral' | 'brand' | 'accent' | 'ok' | 'warn' | 'danger'

export function evidenceTone(e: EvidenceTier): Tone {
  switch (e) {
    case 'fda_approved':
      return 'ok'
    case 'phase3':
      return 'brand'
    case 'phase2':
    case 'phase1':
      return 'accent'
    case 'preclinical':
      return 'warn'
    case 'anecdotal':
      return 'warn'
    case 'withdrawn':
      return 'danger'
  }
}

export function regulatoryTone(r: RegulatoryStatus): Tone {
  switch (r) {
    case 'approved':
      return 'ok'
    case 'compounded':
      return 'brand'
    case 'investigational':
      return 'accent'
    case 'research_only':
      return 'danger'
    case 'discontinued':
      return 'neutral'
    case 'controlled':
      return 'warn'
  }
}
