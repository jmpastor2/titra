/**
 * Axis helpers shared by the level and trend charts. Pure, locale-free maths: the
 * components format the numbers. Everything works on epoch milliseconds, local time.
 */
import { addDays, addMonths, startOfDay, startOfMonth } from 'date-fns'
import { stepWindows } from '@/domain/dosing/schedule'
import type { ProtocolLike } from '@/domain/types'

const DAY_MS = 86_400_000
const NICE = [1, 2, 2.5, 5, 10] as const

/** Smallest "nice" number (1, 2, 2.5, 5 × 10ⁿ) that is ≥ v. */
export function niceStep(v: number): number {
  if (!(v > 0) || !Number.isFinite(v)) return 1
  const exp = Math.floor(Math.log10(v))
  const base = 10 ** exp
  const f = v / base
  const m = NICE.find((n) => n >= f - 1e-9) ?? 10
  return round(m * base)
}

function round(v: number): number {
  return Number.parseFloat(v.toPrecision(10))
}

/**
 * Y scale starting at zero with 2–4 even steps and a little headroom, e.g. a peak of
 * 4.4 mg gives [0, 2, 4, 6]; 0.35 gives [0, 0.2, 0.4].
 */
export function niceYAxis(maxValue: number, targetSteps = 3): { max: number; ticks: number[] } {
  if (!(maxValue > 0) || !Number.isFinite(maxValue)) return { max: 1, ticks: [0, 0.5, 1] }
  const step = niceStep(maxValue / targetSteps)
  const max = round(Math.ceil((maxValue * 1.04) / step - 1e-9) * step)
  const ticks: number[] = []
  for (let v = 0; v <= max + step / 2; v += step) ticks.push(round(v))
  return { max, ticks }
}

/** Small amounts (short-acting peptides dosed in mcg) read better in mcg. */
export function amountScale(maxMg: number): { factor: number; unit: 'mg' | 'mcg' } {
  return maxMg > 0 && maxMg < 0.5 ? { factor: 1000, unit: 'mcg' } : { factor: 1, unit: 'mg' }
}

/**
 * An amount expressed on the scale chosen for `referenceMg` (e.g. the curve peak), with
 * the fraction digits a readout needs: 4.2 mg, 0.62 mg, 85 mcg.
 */
export function scaledAmount(
  mg: number,
  referenceMg = mg,
): { value: number; unit: 'mg' | 'mcg'; digits: number } {
  const { factor, unit } = amountScale(Math.max(mg, referenceMg))
  const value = mg * factor
  return { value, unit, digits: value >= 10 ? 0 : value >= 1 ? 1 : 2 }
}

export type TickPattern = 'EEE d' | 'd MMM' | 'MMM'

/**
 * Time ticks at local midnights (or month starts) that never sit on the plot edges,
 * so centred labels are not clipped on a 375 px phone.
 */
export function timeTicks(
  fromMs: number,
  toMs: number,
  maxTicks = 5,
  edgeFrac = 0.07,
): { ticks: number[]; pattern: TickPattern } {
  if (!(toMs > fromMs)) return { ticks: [], pattern: 'd MMM' }
  const span = toMs - fromMs
  const lo = fromMs + span * edgeFrac
  const hi = toMs - span * edgeFrac
  const inside = (ts: number[]) => ts.filter((t) => t >= lo && t <= hi)

  for (const step of [1, 2, 3, 7, 14]) {
    if (span / (step * DAY_MS) > maxTicks + 1) continue
    let day = startOfDay(new Date(fromMs))
    if (day.getTime() < fromMs) day = addDays(day, 1)
    if (step >= 7) {
      // Weekly ticks land on Mondays, the start of the local week.
      while (day.getDay() !== 1) day = addDays(day, 1)
    }
    const ts: number[] = []
    for (; day.getTime() <= toMs; day = addDays(day, step)) ts.push(day.getTime())
    const ticks = inside(ts)
    if (ticks.length <= maxTicks) return { ticks, pattern: step >= 7 ? 'd MMM' : 'EEE d' }
  }
  for (const months of [1, 2, 3, 6, 12]) {
    let m = startOfMonth(new Date(fromMs))
    if (m.getTime() < fromMs) m = addMonths(m, 1)
    const ts: number[] = []
    for (; m.getTime() <= toMs; m = addMonths(m, months)) ts.push(m.getTime())
    const ticks = inside(ts)
    if (ticks.length <= maxTicks) return { ticks, pattern: 'MMM' }
  }
  return { ticks: [], pattern: 'MMM' }
}

export interface StepChange {
  at: Date
  index: number
  doseMg: number
  pause: boolean
  /** Dose of the previous step; null for the first step. */
  prevDoseMg: number | null
  kind: 'start' | 'up' | 'down' | 'pause' | 'resume'
}

/** Where a protocol changes dose or pauses, within (from, to]. */
export function stepChanges(protocol: ProtocolLike, from: Date, to: Date): StepChange[] {
  const windows = stepWindows(protocol)
  const out: StepChange[] = []
  windows.forEach((w, i) => {
    const t = w.start.getTime()
    if (t <= from.getTime() || t > to.getTime()) return
    const prev = i > 0 ? windows[i - 1]!.step : null
    const pause = Boolean(w.step.pause)
    const prevDose = prev ? (prev.pause ? 0 : prev.doseMg) : null
    if (prev && !pause && !prev.pause && prev.doseMg === w.step.doseMg) return
    const kind: StepChange['kind'] = !prev
      ? 'start'
      : pause
        ? 'pause'
        : prev.pause
          ? 'resume'
          : w.step.doseMg > prev.doseMg
            ? 'up'
            : 'down'
    out.push({
      at: w.start,
      index: w.index,
      doseMg: pause ? 0 : w.step.doseMg,
      pause,
      prevDoseMg: prevDose,
      kind,
    })
  })
  return out
}

/* ------------------------------------------------------------ trend chart layout */

export const TREND_Y_AXIS_WIDTH = 36
export const TREND_MARGIN = { top: 10, right: 14, bottom: 0, left: 0 }

/**
 * Horizontal insets of the TrendChart plot area inside its container, in px. Anything
 * drawn on the same time axis above or below it (the protocol strip) uses these to line up.
 */
export const TREND_INSET = {
  left: TREND_Y_AXIS_WIDTH + TREND_MARGIN.left,
  right: TREND_MARGIN.right,
}
