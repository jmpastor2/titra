/**
 * "What if" scenarios built on top of the engine: continue as planned, skip the
 * next dose, stop, or switch compound. Pure functions; the UI renders the curves.
 */
import type { DoseEvent, PkParams, ProtocolLike } from '../types'
import { plannedDoses } from '../dosing/schedule'
import { exposureCurve, type CurvePoint } from './engine'

export type ScenarioId = 'planned' | 'skip_next' | 'stop' | 'switch_from' | 'switch_to'

export interface Scenario {
  id: ScenarioId
  compoundId: string
  points: CurvePoint[]
}

export interface ProjectionInput {
  compoundId: string
  pk: PkParams
  history: readonly DoseEvent[]
  protocol: ProtocolLike | null
  now: Date
  horizonDays: number
  stepH?: number
}

const DAY_MS = 86_400_000

function horizonEnd(now: Date, days: number): Date {
  return new Date(now.getTime() + days * DAY_MS)
}

/** Historical + planned doses, then the exposure curve until now + horizon. */
export function projectPlanned(input: ProjectionInput): Scenario {
  const to = horizonEnd(input.now, input.horizonDays)
  const future = input.protocol
    ? plannedDoses(input.protocol, input.history, input.now, to).map((p) => ({
        at: p.at,
        mg: p.doseMg,
      }))
    : []
  return {
    id: 'planned',
    compoundId: input.compoundId,
    points: exposureCurve([...input.history, ...future], input.pk, {
      from: input.now,
      to,
      stepH: input.stepH ?? 6,
      refineAtDoses: true,
    }),
  }
}

/** Same as planned but the very next scheduled dose is missed. */
export function projectSkipNext(input: ProjectionInput): Scenario {
  const to = horizonEnd(input.now, input.horizonDays)
  const future = input.protocol
    ? plannedDoses(input.protocol, input.history, input.now, to)
        .slice(1)
        .map((p) => ({ at: p.at, mg: p.doseMg }))
    : []
  return {
    id: 'skip_next',
    compoundId: input.compoundId,
    points: exposureCurve([...input.history, ...future], input.pk, {
      from: input.now,
      to,
      stepH: input.stepH ?? 6,
      refineAtDoses: true,
    }),
  }
}

/** Stop dosing now: pure washout of what is already on board. */
export function projectStop(input: ProjectionInput): Scenario {
  const to = horizonEnd(input.now, input.horizonDays)
  return {
    id: 'stop',
    compoundId: input.compoundId,
    points: exposureCurve(input.history, input.pk, {
      from: input.now,
      to,
      stepH: input.stepH ?? 6,
    }),
  }
}

export interface SwitchInput {
  from: { compoundId: string; pk: PkParams; history: readonly DoseEvent[] }
  to: { compoundId: string; pk: PkParams; protocol: ProtocolLike }
  switchAt: Date
  now: Date
  horizonDays: number
  stepH?: number
}

/** Switching compounds: washout of the old one and build-up of the new one on one axis. */
export function projectSwitch(input: SwitchInput): [Scenario, Scenario] {
  const to = horizonEnd(input.now, input.horizonDays)
  const oldCurve = exposureCurve(
    input.from.history.filter((d) => d.at.getTime() < input.switchAt.getTime()),
    input.from.pk,
    { from: input.now, to, stepH: input.stepH ?? 6 },
  )
  const newDoses = plannedDoses(input.to.protocol, [], input.switchAt, to).map((p) => ({
    at: p.at,
    mg: p.doseMg,
  }))
  const newCurve = exposureCurve(newDoses, input.to.pk, {
    from: input.now,
    to,
    stepH: input.stepH ?? 6,
    refineAtDoses: true,
  })
  return [
    { id: 'switch_from', compoundId: input.from.compoundId, points: oldCurve },
    { id: 'switch_to', compoundId: input.to.compoundId, points: newCurve },
  ]
}
