/**
 * Axes of the trend charts. Pure, locale-free maths on top of chartScale: a value axis that
 * does not start at zero (a weight, a lab result), time ticks that also work for a span of
 * hours, and a filter that keeps neighbouring labels from touching.
 */
import { setHours, startOfDay } from 'date-fns'
import { tickDecimals, timeTicks } from './chartScale'

const HOUR_MS = 3_600_000
const DAY_MS = 86_400_000

function round(v: number): number {
  return Number.parseFloat(v.toPrecision(10))
}

/**
 * The step between ticks: 1, 2, 2.5 or 5 × 10ⁿ, the smallest that is at least `raw` and that
 * the readings' own precision can write (a weight in tenths never gets ticks of 0.25, a heart
 * rate never gets 2.5).
 */
export function tickStep(raw: number, digits: number): number {
  const unit = 10 ** -digits
  const target = Math.max(Number.isFinite(raw) ? raw : 0, unit)
  const exp = Math.floor(Math.log10(target))
  for (const e of [exp, exp + 1]) {
    for (const m of [1, 2, 2.5, 5]) {
      const step = round(m * 10 ** e)
      const k = step / unit
      if (step >= target - 1e-9 && Math.abs(k - Math.round(k)) < 1e-6) return step
    }
  }
  return round(10 ** (exp + 1))
}

export interface ValueAxis {
  domain: [number, number]
  ticks: number[]
  /** Fewest fraction digits that write every tick exactly. */
  decimals: number
}

/**
 * The value axis for readings between `lo` and `hi`: some air above and below, even ticks,
 * and edges that are ticks themselves. A flat series (or a single reading) still gets a span
 * to sit in. `fixed` pins the domain instead, e.g. a score of 0 to 10 with ticks at 0, 5, 10.
 */
export function valueAxis({
  lo,
  hi,
  plotHeight,
  digits,
  fixed,
}: {
  lo: number
  hi: number
  plotHeight: number
  digits: number
  fixed?: readonly [number, number]
}): ValueAxis {
  if (fixed && Math.abs(fixed[1] - fixed[0]) > 1e-9) {
    const a = Math.min(fixed[0], fixed[1])
    const b = Math.max(fixed[0], fixed[1])
    const ticks = [a, round((a + b) / 2), b]
    return { domain: [a, b], ticks, decimals: tickDecimals(ticks) }
  }
  const unit = 10 ** -digits
  const span = hi - lo
  const pad = span > 0 ? span * 0.15 : Math.max(Math.abs(lo) * 0.05, unit * 2)
  const steps = Math.max(2, Math.min(5, Math.floor(plotHeight / 32)))
  const step = tickStep((span + 2 * pad) / steps, digits)
  const first = round(Math.floor((lo - pad) / step + 1e-9) * step)
  const last = round(Math.ceil((hi + pad) / step - 1e-9) * step)
  const ticks: number[] = []
  for (let i = 0; first + i * step <= last + step / 2; i++) ticks.push(round(first + i * step))
  return { domain: [first, last], ticks, decimals: tickDecimals(ticks) }
}

/** Ticks on whole local hours for a span of a day or two, away from both edges. */
export function hourTicks(
  fromMs: number,
  toMs: number,
  maxTicks = 5,
  edgeFrac = 0.07,
): { ticks: number[]; pattern: string } {
  const span = toMs - fromMs
  const pattern = span > DAY_MS ? 'EEE HH:mm' : 'HH:mm'
  if (!(span > 0)) return { ticks: [], pattern }
  const lo = fromMs + span * edgeFrac
  const hi = toMs - span * edgeFrac
  for (const step of [1, 2, 3, 4, 6, 12]) {
    if (span / (step * HOUR_MS) > maxTicks + 1) continue
    const ticks: number[] = []
    for (let day = startOfDay(new Date(fromMs)); day.getTime() <= toMs;) {
      for (let h = 0; h < 24; h += step) {
        const at = setHours(day, h).getTime()
        if (at >= lo && at <= hi) ticks.push(at)
      }
      day = new Date(day.getFullYear(), day.getMonth(), day.getDate() + 1)
    }
    if (ticks.length > 0 && ticks.length <= maxTicks) return { ticks, pattern }
  }
  return { ticks: [], pattern }
}

/**
 * Time ticks for any span: days, weeks or months as the level charts have them, and whole
 * hours when the readings are only hours apart (two weigh-ins on the same day).
 */
export function trendTimeTicks(
  fromMs: number,
  toMs: number,
  maxTicks = 5,
  edgeFrac = 0.07,
): { ticks: number[]; pattern: string } {
  const days = timeTicks(fromMs, toMs, maxTicks, edgeFrac)
  const span = toMs - fromMs
  if (span > 3 * DAY_MS || days.ticks.length >= 2) return days
  const hours = hourTicks(fromMs, toMs, maxTicks, edgeFrac)
  return hours.ticks.length > days.ticks.length ? hours : days
}

/** A label's footprint on the axis, in px. */
export interface Extent {
  left: number
  right: number
}

/**
 * Keeps, in order, the labels that clear the one before by `gap` px: of two that would touch,
 * the earlier stays. Whatever is dropped is still marked on the axis by its grid line or tick.
 */
export function spaceOut<T extends Extent>(items: readonly T[], gap = 6): T[] {
  const kept: T[] = []
  let edge = Number.NEGATIVE_INFINITY
  for (const item of items) {
    if (item.left < edge + gap) continue
    kept.push(item)
    edge = item.right
  }
  return kept
}
