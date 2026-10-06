/**
 * One row per substance in the Niveles card of Hoy: how close a long-acting compound is to
 * its steady level, or when a short-acting one was last taken and how the last two weeks went.
 * Pure; see levels.test.ts.
 */
import type { TickState } from '@/components/kpi/Ticks'
import { doseDays, levelKind, type DayState } from '@/features/exposure/levelSummary'
import type { CompoundExposure } from '@/features/exposure/useExposure'

/** Days drawn for a short-acting substance. */
export const LEVEL_DAYS = 14

/** At or above this share of the steady level the substance counts as steady (the band). */
export const STEADY_FROM = 0.9

export type LevelRow =
  | {
      kind: 'steady'
      x: CompoundExposure
      /** Amount on board now against the steady level of the plan, 0..1.5. */
      fraction: number
      nowMg: number
      /** Hours to 90 % of the steady level if dosing goes on as planned; 0 once there. */
      hoursTo90: number
    }
  | {
      kind: 'recent'
      x: CompoundExposure
      lastAt: Date | null
      /** One bar per day, oldest first, today last. */
      ticks: TickState[]
      /** Days with the planned dose taken, and days that had one planned and are over. */
      taken: number
      expected: number
    }

/** How a day of the dose strip reads as a bar. An off-plan dose is half a bar. */
export function dayTick(state: DayState): TickState {
  switch (state) {
    case 'taken':
    case 'late':
      return 'full'
    case 'extra':
      return 'partial'
    case 'missed':
      return 'missed'
    case 'planned':
    case 'rest':
      return 'none'
  }
}

export function levelRow(x: CompoundExposure, days = LEVEL_DAYS): LevelRow {
  if (levelKind(x) === 'curve' && x.progress && x.nowMg !== null) {
    return {
      kind: 'steady',
      x,
      fraction: x.progress.fraction,
      nowMg: x.nowMg,
      hoursTo90: x.progress.hoursTo90,
    }
  }
  const cells = doseDays(x.history, x.protocolLike, x.asOf, days)
  const taken = cells.filter((c) => c.state === 'taken' || c.state === 'late').length
  return {
    kind: 'recent',
    x,
    lastAt: x.lastDose?.at ?? null,
    ticks: cells.map((c) => dayTick(c.state)),
    taken,
    expected: taken + cells.filter((c) => c.state === 'missed').length,
  }
}

/** How long ago, short: "25 min", "36 h", "3 d". Hours up to two days, so "yesterday" is not "2 days". */
export function sinceShort(from: Date, now: Date): string {
  const min = Math.max(1, Math.round((now.getTime() - from.getTime()) / 60_000))
  if (min < 60) return `${min} min`
  const h = Math.floor(min / 60)
  return h < 48 ? `${h} h` : `${Math.floor(h / 24)} d`
}
