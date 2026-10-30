import type { SiteHeat } from '@/domain/sites/rotation'

/** Fresh sites burn warm; rested ones cool down to the action colour. */
export const HEAT: Record<SiteHeat, { fill: string; ink: string }> = {
  hot: { fill: 'var(--danger)', ink: 'var(--panel)' },
  warm: { fill: 'var(--warn)', ink: 'var(--panel)' },
  cool: { fill: 'color-mix(in oklab, var(--signal) 45%, var(--panel))', ink: 'var(--ink)' },
  rested: { fill: 'var(--signal)', ink: 'var(--panel)' },
  never: { fill: 'var(--panel)', ink: 'var(--muted)' },
}
export const LEGEND: readonly SiteHeat[] = ['hot', 'warm', 'cool', 'rested', 'never']
