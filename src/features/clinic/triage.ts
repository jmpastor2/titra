/**
 * Clinician triage: turns each linked patient's raw rows into the flags that
 * decide the order of the patient list. Pure, unit-tested.
 */
import type {
  DoseRow,
  MeasurementRow,
  ProfileRow,
  ProtocolRow,
  SymptomRow,
} from '@/data/database.types'
import { toDoseEvent, toProtocolLike } from '@/data/mappers'
import { adherence, nextDose, titrationStatus } from '@/domain/dosing/schedule'
import { compositionTrend } from '@/domain/lean/leanMass'

export type PatientFlag =
  'overdue' | 'severe' | 'titration' | 'fastLoss' | 'lowAdherence' | 'noData'

/** Higher is more urgent; drives sorting and the badge colour. */
const FLAG_WEIGHT: Record<PatientFlag, number> = {
  severe: 100,
  overdue: 80,
  titration: 50,
  fastLoss: 40,
  lowAdherence: 30,
  noData: 10,
}

export interface PatientSummary {
  patient: ProfileRow
  protocol: ProtocolRow | null
  compoundId: string | null
  lastDoseAt: Date | null
  adherenceRatio: number | null
  nextDoseAt: Date | null
  overdueH: number
  maxSeverity: number
  weightDeltaKg: number | null
  kgPerWeek: number | null
  flags: PatientFlag[]
  score: number
}

export interface TriageInput {
  patients: ProfileRow[]
  protocols: ProtocolRow[]
  doses: DoseRow[]
  symptoms: SymptomRow[]
  weights: MeasurementRow[]
  now: Date
}

export function summarisePatients({
  patients,
  protocols,
  doses,
  symptoms,
  weights,
  now,
}: TriageInput): PatientSummary[] {
  return patients
    .map((patient) => {
      const protocol =
        protocols.find((p) => p.patient_id === patient.id && p.status === 'active') ?? null
      const pDoses = doses
        .filter((d) => d.patient_id === patient.id)
        .toSorted((a, b) => a.administered_at.localeCompare(b.administered_at))
      const history = pDoses.map(toDoseEvent)
      const lastDoseAt = history.length ? history[history.length - 1]!.at : null

      const pl = protocol ? toProtocolLike(protocol) : null
      const next = pl ? nextDose(pl, history, now) : null
      const adh = pl ? adherence(pl, history, now) : null
      const tit = pl ? titrationStatus(pl, now) : null

      const pSymptoms = symptoms.filter((s) => s.patient_id === patient.id)
      const maxSeverity = pSymptoms.reduce((m, s) => Math.max(m, s.severity), 0)

      const pWeights = weights
        .filter((w) => w.patient_id === patient.id)
        .map((w) => ({ at: new Date(w.measured_at), kg: Number(w.value) }))
      const trend = compositionTrend(pWeights, 30)

      const flags: PatientFlag[] = []
      if (next?.status === 'overdue') flags.push('overdue')
      if (maxSeverity >= 7) flags.push('severe')
      if (tit && !tit.isMaintenance && tit.daysToNextStep !== null && tit.daysToNextStep <= 0)
        flags.push('titration')
      if (trend && pWeights[0] && trend.kgPerWeek < 0 && -trend.kgPerWeek / pWeights[0].kg > 0.01)
        flags.push('fastLoss')
      if (adh && adh.expected >= 3 && adh.ratio < 0.7) flags.push('lowAdherence')
      if (!lastDoseAt || now.getTime() - lastDoseAt.getTime() > 21 * 86_400_000)
        flags.push('noData')

      const score = flags.reduce((s, f) => s + FLAG_WEIGHT[f], 0)

      return {
        patient,
        protocol,
        compoundId: protocol?.compound_id ?? pDoses.at(-1)?.compound_id ?? null,
        lastDoseAt,
        adherenceRatio: adh?.ratio ?? null,
        nextDoseAt: next?.at ?? null,
        overdueH: next?.overdueH ?? 0,
        maxSeverity,
        weightDeltaKg: trend?.deltaKg ?? null,
        kgPerWeek: trend?.kgPerWeek ?? null,
        flags,
        score,
      }
    })
    .toSorted(
      (a, b) => b.score - a.score || a.patient.display_name.localeCompare(b.patient.display_name),
    )
}

export function flagTone(flag: PatientFlag): 'danger' | 'warn' | 'accent' | 'neutral' {
  switch (flag) {
    case 'severe':
      return 'danger'
    case 'overdue':
      return 'warn'
    case 'titration':
      return 'accent'
    case 'fastLoss':
      return 'warn'
    case 'lowAdherence':
      return 'warn'
    default:
      return 'neutral'
  }
}
