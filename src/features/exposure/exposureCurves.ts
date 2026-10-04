/**
 * Everything the exposure chart of one substance needs for a range: the history curve
 * closed exactly at "now", the projection after it, the planned administrations, the
 * titration steps and the steady-state range of each step. Pure; see exposureCurves.test.ts.
 */
import { addDays } from 'date-fns'
import { effectiveIntervalH, plannedDoses, stepWindows } from '@/domain/dosing/schedule'
import {
  amountAt,
  exposureCurve,
  rateConstants,
  steadyState,
  type CurvePoint,
} from '@/domain/pk/engine'
import { projectPlanned } from '@/domain/pk/scenarios'
import type { DoseEvent, PkParams, ProtocolLike } from '@/domain/types'
import { stepChanges, type StepChange } from './chartScale'
import { curveStepH, curveToNow } from './curves'
import type { SsBand } from './pkModel'
import { curveWindow, type RangeKey } from './ranges'

const DAY_MS = 86_400_000

export interface CurveBundle {
  from: Date
  to: Date
  history: CurvePoint[]
  projection: CurvePoint[]
  /** Administrations still to come, for the hollow markers. */
  planned: DoseEvent[]
  steps: StepChange[]
  bands: SsBand[]
}

export interface CurveInput {
  compoundId: string
  pk: PkParams
  history: readonly DoseEvent[]
  protocol: ProtocolLike | null
  /** Days until the next dose change, for the default reach of the projection. */
  daysToNextStep: number | null
  range: RangeKey
  now: Date
}

/**
 * The steady-state range of every dosing step that falls inside the window. Steps that
 * follow each other with the same dose (a label change) are one band, not two with a seam.
 */
export function stepBands(
  protocol: ProtocolLike,
  pk: PkParams,
  from: Date,
  to: Date,
  now: Date,
): SsBand[] {
  const out: SsBand[] = []
  for (const w of stepWindows(protocol)) {
    if (w.step.pause || !(w.step.doseMg > 0)) continue
    const end = w.end ?? to
    if (end.getTime() <= from.getTime() || w.start.getTime() >= to.getTime()) continue
    const ss = steadyState(w.step.doseMg, effectiveIntervalH(w.step, protocol.times), pk)
    const current = w.start.getTime() <= now.getTime() && now.getTime() < end.getTime()
    const prev = out.at(-1)
    if (
      prev &&
      prev.to.getTime() === w.start.getTime() &&
      Math.abs(prev.peakMg - ss.peakMg) < 1e-9 &&
      Math.abs(prev.troughMg - ss.troughMg) < 1e-9
    ) {
      prev.to = end
      prev.current = prev.current || current
      continue
    }
    out.push({ from: w.start, to: end, troughMg: ss.troughMg, peakMg: ss.peakMg, current })
  }
  return out
}

export function buildCurveBundle(input: CurveInput): CurveBundle {
  const { pk, protocol, now } = input
  const win = curveWindow(input.range, now, protocol, input.daysToNextStep)
  // No long flat line before the first dose: start a day ahead of it.
  const first = input.history[0]?.at
  let from = first && first > win.from ? addDays(first, -1) : win.from
  if (from.getTime() >= now.getTime()) from = new Date(now.getTime() - 3_600_000)
  const spanDays = (win.to.getTime() - from.getTime()) / DAY_MS
  const stepH = curveStepH(spanDays)
  const nowMg = amountAt(input.history, now, rateConstants(pk))

  const history = curveToNow(
    exposureCurve(input.history, pk, { from, to: now, stepH, refineAtDoses: true }),
    now,
    nowMg,
  )
  const horizonDays = Math.max(1, (win.to.getTime() - now.getTime()) / DAY_MS)
  const projection = projectPlanned({
    compoundId: input.compoundId,
    pk,
    history: input.history,
    protocol,
    now,
    horizonDays,
    stepH,
  }).points
  const planned = protocol
    ? plannedDoses(protocol, input.history, now, win.to).map((p) => ({ at: p.at, mg: p.doseMg }))
    : []
  return {
    from,
    to: win.to,
    history,
    projection,
    planned,
    steps: protocol ? stepChanges(protocol, from, win.to) : [],
    bands: protocol ? stepBands(protocol, pk, from, win.to, now) : [],
  }
}
