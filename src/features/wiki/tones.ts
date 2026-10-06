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

/** Text and fill colour classes of a tone, for readouts and meters (tokens only). */
export const toneText: Record<Tone, string> = {
  neutral: 'text-ink-2',
  brand: 'text-signal',
  accent: 'text-accent',
  ok: 'text-signal',
  warn: 'text-warn',
  danger: 'text-danger',
}

export const toneFill: Record<Tone, string> = {
  neutral: 'bg-muted',
  brand: 'bg-signal',
  accent: 'bg-accent',
  ok: 'bg-signal',
  warn: 'bg-warn',
  danger: 'bg-danger',
}
