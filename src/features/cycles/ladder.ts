/**
 * A cycle's weeks as the bars of the kit's `Steps`: one bar per week, as tall as its dose,
 * solid behind us, marked today, faint ahead and hatched in a rest. A long plan groups its
 * weeks so every bar keeps a readable width on a 320 px phone. Pure; see ladder.test.ts.
 */
import type { Step } from '@/components/kpi/Steps'
import type { PhaseWeek } from './phase'

/** Most bars drawn: past this, consecutive weeks share a bar. */
export const MAX_BARS = 26

/** How tall a rest bar is next to the doses (a rest has no dose of its own). */
const REST_LEVEL = 0.3

export function ladderSteps(weeks: readonly PhaseWeek[], maxBars = MAX_BARS): Step[] {
  const size = Math.max(1, Math.ceil(weeks.length / Math.max(1, maxBars)))
  const out: Step[] = []
  for (let i = 0; i < weeks.length; i += size) {
    const group = weeks.slice(i, i + size)
    const doses = group.filter((w) => w.kind === 'dose')
    const kind: Step['kind'] = group.some((w) => w.state === 'current')
      ? 'current'
      : doses.length === 0
        ? 'rest'
        : group.every((w) => w.state === 'past')
          ? 'done'
          : 'planned'
    out.push({
      kind,
      level: doses.length ? Math.max(...doses.map((w) => w.intensity)) : REST_LEVEL,
    })
  }
  return out
}
