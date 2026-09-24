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
      const active = protocols.filter((p) => p.patient_id === patient.id && p.status === 'active')
      const pDoses = doses
        .filter((d) => d.patient_id === patient.id)
        .toSorted((a, b) => a.administered_at.localeCompare(b.administered_at))
      const lastDoseAt = pDoses.length ? new Date(pDoses[pDoses.length - 1]!.administered_at) : null

      // Evaluate every active protocol against its own compound's history, then keep the
      // most urgent signal of each kind: one overdue peptide is enough to raise the flag.
      const perProtocol = active.map((p) => {
        const pl = toProtocolLike(p)
        const history = pDoses.filter((d) => d.compound_id === p.compound_id).map(toDoseEvent)
        return {
          protocol: p,
          next: nextDose(pl, history, now),
          adh: adherence(pl, history, now),
          tit: titrationStatus(pl, now),
        }
      })
      const overdue = perProtocol
        .filter((x) => x.next?.status === 'overdue')
        .toSorted((a, b) => (b.next?.overdueH ?? 0) - (a.next?.overdueH ?? 0))[0]
      const soonest = perProtocol
        .filter((x) => x.next)
        .toSorted((a, b) => a.next!.at.getTime() - b.next!.at.getTime())[0]
      const lowest = perProtocol
        .filter((x) => x.adh.expected >= 3)
        .toSorted((a, b) => a.adh.ratio - b.adh.ratio)[0]
      const escalationDue = perProtocol.some(
        ({ tit }) =>
          tit && !tit.isMaintenance && tit.daysToNextStep !== null && tit.daysToNextStep <= 0,
      )
      const protocol = overdue?.protocol ?? soonest?.protocol ?? active[0] ?? null
      const next = overdue?.next ?? soonest?.next ?? null

      const pSymptoms = symptoms.filter((s) => s.patient_id === patient.id)
      const maxSeverity = pSymptoms.reduce((m, s) => Math.max(m, s.severity), 0)

      const pWeights = weights
        .filter((w) => w.patient_id === patient.id)
        .map((w) => ({ at: new Date(w.measured_at), kg: Number(w.value) }))
      const trend = compositionTrend(pWeights, 30)

      const flags: PatientFlag[] = []
      if (overdue) flags.push('overdue')
      if (maxSeverity >= 7) flags.push('severe')
      if (escalationDue) flags.push('titration')
      if (trend && pWeights[0] && trend.kgPerWeek < 0 && -trend.kgPerWeek / pWeights[0].kg > 0.01)
        flags.push('fastLoss')
      if (lowest && lowest.adh.ratio < 0.7) flags.push('lowAdherence')
      if (!lastDoseAt || now.getTime() - lastDoseAt.getTime() > 21 * 86_400_000)
        flags.push('noData')

      const score = flags.reduce((s, f) => s + FLAG_WEIGHT[f], 0)

      return {
        patient,
        protocol,
        compoundId: protocol?.compound_id ?? pDoses.at(-1)?.compound_id ?? null,
        lastDoseAt,
        adherenceRatio: lowest?.adh.ratio ?? perProtocol[0]?.adh.ratio ?? null,
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
