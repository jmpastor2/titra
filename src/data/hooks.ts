/**
 * Data access layer: typed Supabase queries wrapped in TanStack Query.
 * Every hook takes an explicit patientId so the same components serve the
 * patient's own view and the clinician's read-only view.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { subDays } from 'date-fns'
import { requireSupabase } from '@/lib/supabase'
import type {
  CareLinkRow,
  ClinicalNoteRow,
  CompoundNoteRow,
  Database,
  DoseRow,
  InventoryRow,
  LabResultRow,
  MeasurementKind,
  MeasurementRow,
  ProfileRow,
  ProtocolRow,
  ProtocolStatus,
  SavedProtocolRow,
  SymptomRow,
} from './database.types'

type Tables = Database['public']['Tables']
type Insert<T extends keyof Tables> = Tables[T]['Insert']
type Update<T extends keyof Tables> = Tables[T]['Update']

export const qk = {
  profile: (id: string) => ['profile', id] as const,
  profiles: (ids: string[]) => ['profiles', ...ids] as const,
  protocols: (pid: string) => ['protocols', pid] as const,
  doses: (pid: string, days: number) => ['doses', pid, days] as const,
  symptoms: (pid: string, days: number) => ['symptoms', pid, days] as const,
  measurements: (pid: string, days: number) => ['measurements', pid, days] as const,
  labs: (pid: string) => ['labs', pid] as const,
  inventory: (pid: string) => ['inventory', pid] as const,
  careLinks: (uid: string) => ['care_links', uid] as const,
  clinicalNotes: (pid: string) => ['clinical_notes', pid] as const,
  compoundNotes: (cid: string) => ['compound_notes', cid] as const,
  clinicBundle: (uid: string) => ['clinic_bundle', uid] as const,
  savedProtocols: (uid: string) => ['saved_protocols', uid] as const,
}

function unwrap<T>(res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message)
  if (res.data === null) throw new Error('Empty response')
  return res.data
}

/* ------------------------------ Profile ------------------------------ */

export function useProfile(userId: string | undefined) {
  return useQuery({
    queryKey: qk.profile(userId ?? ''),
    enabled: Boolean(userId),
    queryFn: async (): Promise<ProfileRow> => {
      const sb = requireSupabase()
      return unwrap(await sb.from('profiles').select('*').eq('id', userId!).single())
    },
  })
}

export function useUpdateProfile(userId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (patch: Update<'profiles'>) => {
      const sb = requireSupabase()
      return unwrap(await sb.from('profiles').update(patch).eq('id', userId).select('*').single())
    },
    onSuccess: (row) => qc.setQueryData(qk.profile(userId), row),
  })
}

/* ------------------------------ Protocols ------------------------------ */

export function useProtocols(patientId: string | undefined) {
  return useQuery({
    queryKey: qk.protocols(patientId ?? ''),
    enabled: Boolean(patientId),
    queryFn: async (): Promise<ProtocolRow[]> => {
      const sb = requireSupabase()
      return unwrap(
        await sb
          .from('protocols')
          .select('*')
          .eq('patient_id', patientId!)
          .order('created_at', { ascending: false }),
      )
    },
  })
}

export function useSaveProtocol(patientId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: Insert<'protocols'> & { id?: string }) => {
      const sb = requireSupabase()
      if (input.id) {
        const { id, ...patch } = input
        return unwrap(await sb.from('protocols').update(patch).eq('id', id).select('*').single())
      }
      return unwrap(await sb.from('protocols').insert(input).select('*').single())
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.protocols(patientId) }),
  })
}

export function useSetProtocolStatus(patientId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: ProtocolStatus }) => {
      const sb = requireSupabase()
      return unwrap(await sb.from('protocols').update({ status }).eq('id', id).select('*').single())
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.protocols(patientId) }),
  })
}

/* ------------------------------ Doses ------------------------------ */

export function useDoses(patientId: string | undefined, days = 365) {
  return useQuery({
    queryKey: qk.doses(patientId ?? '', days),
    enabled: Boolean(patientId),
    queryFn: async (): Promise<DoseRow[]> => {
      const sb = requireSupabase()
      return unwrap(
        await sb
          .from('doses')
          .select('*')
          .eq('patient_id', patientId!)
          .gte('administered_at', subDays(new Date(), days).toISOString())
          .order('administered_at', { ascending: false }),
      )
    },
  })
}

/**
 * Log one administration. A stack (several compounds in one syringe) is several rows
 * written in a single request, tied together by `batch_id`.
 */
export function useAddDose(patientId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: Insert<'doses'> | Insert<'doses'>[]) => {
      const sb = requireSupabase()
      const rows = Array.isArray(input) ? input : [input]
      if (rows.length > 1) {
        const batchId = crypto.randomUUID()
        rows.forEach((r) => (r.batch_id ??= batchId))
      }
      return unwrap(await sb.from('doses').insert(rows).select('*'))
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['doses', patientId] })
      void qc.invalidateQueries({ queryKey: qk.inventory(patientId) })
    },
  })
}

export function useDeleteDose(patientId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const sb = requireSupabase()
      const { error } = await sb.from('doses').delete().eq('id', id)
      if (error) throw new Error(error.message)
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['doses', patientId] })
      // Deleting a dose gives its amount back to the vial (migration 3 trigger).
      void qc.invalidateQueries({ queryKey: qk.inventory(patientId) })
    },
  })
}

/* ------------------------------ Symptoms ------------------------------ */

export function useSymptoms(patientId: string | undefined, days = 180) {
  return useQuery({
    queryKey: qk.symptoms(patientId ?? '', days),
    enabled: Boolean(patientId),
    queryFn: async (): Promise<SymptomRow[]> => {
      const sb = requireSupabase()
      return unwrap(
        await sb
          .from('symptoms')
          .select('*')
          .eq('patient_id', patientId!)
          .gte('occurred_at', subDays(new Date(), days).toISOString())
          .order('occurred_at', { ascending: false }),
      )
    },
  })
}

export function useAddSymptom(patientId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: Insert<'symptoms'>) => {
      const sb = requireSupabase()
      return unwrap(await sb.from('symptoms').insert(input).select('*').single())
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['symptoms', patientId] }),
  })
}

export function useDeleteSymptom(patientId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const sb = requireSupabase()
      const { error } = await sb.from('symptoms').delete().eq('id', id)
      if (error) throw new Error(error.message)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['symptoms', patientId] }),
  })
}

/* ------------------------------ Measurements ------------------------------ */

export function useMeasurements(patientId: string | undefined, days = 365) {
  return useQuery({
    queryKey: qk.measurements(patientId ?? '', days),
    enabled: Boolean(patientId),
    queryFn: async (): Promise<MeasurementRow[]> => {
      const sb = requireSupabase()
      return unwrap(
        await sb
          .from('measurements')
          .select('*')
          .eq('patient_id', patientId!)
          .gte('measured_at', subDays(new Date(), days).toISOString())
          .order('measured_at', { ascending: false }),
      )
    },
  })
}

export function useAddMeasurement(patientId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: Insert<'measurements'> | Insert<'measurements'>[]) => {
      const sb = requireSupabase()
      const rows = Array.isArray(input) ? input : [input]
      return unwrap(await sb.from('measurements').insert(rows).select('*'))
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['measurements', patientId] }),
  })
}

export function useDeleteMeasurement(patientId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const sb = requireSupabase()
      const { error } = await sb.from('measurements').delete().eq('id', id)
      if (error) throw new Error(error.message)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['measurements', patientId] }),
  })
}

export function latestOfKind(rows: MeasurementRow[] | undefined, kind: MeasurementKind) {
  return rows?.find((r) => r.kind === kind)
}

/* ------------------------------ Labs ------------------------------ */

export function useLabs(patientId: string | undefined) {
  return useQuery({
    queryKey: qk.labs(patientId ?? ''),
    enabled: Boolean(patientId),
    queryFn: async (): Promise<LabResultRow[]> => {
      const sb = requireSupabase()
      return unwrap(
        await sb
          .from('lab_results')
          .select('*')
          .eq('patient_id', patientId!)
          .order('drawn_at', { ascending: false }),
      )
    },
  })
}

export function useAddLab(patientId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: Insert<'lab_results'>) => {
      const sb = requireSupabase()
      return unwrap(await sb.from('lab_results').insert(input).select('*').single())
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.labs(patientId) }),
  })
}

export function useDeleteLab(patientId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const sb = requireSupabase()
      const { error } = await sb.from('lab_results').delete().eq('id', id)
      if (error) throw new Error(error.message)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.labs(patientId) }),
  })
}

/* ------------------------------ Inventory ------------------------------ */

export function useInventory(patientId: string | undefined, includeArchived = false) {
  return useQuery({
    queryKey: [...qk.inventory(patientId ?? ''), includeArchived],
    enabled: Boolean(patientId),
    queryFn: async (): Promise<InventoryRow[]> => {
      const sb = requireSupabase()
      let q = sb.from('inventory').select('*').eq('patient_id', patientId!)
      if (!includeArchived) q = q.eq('archived', false)
      return unwrap(await q.order('created_at', { ascending: false }))
    },
  })
}

export function useSaveInventory(patientId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: Insert<'inventory'> & { id?: string }) => {
      const sb = requireSupabase()
      if (input.id) {
        const { id, ...patch } = input
        return unwrap(await sb.from('inventory').update(patch).eq('id', id).select('*').single())
      }
      return unwrap(await sb.from('inventory').insert(input).select('*').single())
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.inventory(patientId) }),
  })
}

export function useArchiveInventory(patientId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, archived }: { id: string; archived: boolean }) => {
      const sb = requireSupabase()
      return unwrap(
        await sb.from('inventory').update({ archived }).eq('id', id).select('*').single(),
      )
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.inventory(patientId) }),
  })
}

/* ------------------------------ Care links ------------------------------ */

export interface CareLinkWithProfiles extends CareLinkRow {
  clinician: Pick<ProfileRow, 'id' | 'display_name' | 'role'> | null
  patient: Pick<ProfileRow, 'id' | 'display_name' | 'role'> | null
}

export function useCareLinks(userId: string | undefined) {
  return useQuery({
    queryKey: qk.careLinks(userId ?? ''),
    enabled: Boolean(userId),
    queryFn: async (): Promise<CareLinkWithProfiles[]> => {
      const sb = requireSupabase()
      const links = unwrap(
        await sb
          .from('care_links')
          .select('*')
          .eq('status', 'active')
          .or(`clinician_id.eq.${userId},patient_id.eq.${userId}`),
      )
      const ids = Array.from(new Set(links.flatMap((l) => [l.clinician_id, l.patient_id])))
      const profiles = ids.length
        ? unwrap(await sb.from('profiles').select('id, display_name, role').in('id', ids))
        : []
      const byId = new Map(profiles.map((p) => [p.id, p]))
      return links.map((l) => ({
        ...l,
        clinician: byId.get(l.clinician_id) ?? null,
        patient: byId.get(l.patient_id) ?? null,
      }))
    },
  })
}

export function useLinkClinician(userId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (code: string) => {
      const sb = requireSupabase()
      const { data, error } = await sb.rpc('link_clinician', { p_code: code.trim() })
      if (error) throw new Error(error.message)
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.careLinks(userId) }),
  })
}

export function useRevokeLink(userId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (linkId: string) => {
      const sb = requireSupabase()
      const { error } = await sb
        .from('care_links')
        .update({ status: 'revoked', revoked_at: new Date().toISOString() })
        .eq('id', linkId)
      if (error) throw new Error(error.message)
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.careLinks(userId) })
      void qc.invalidateQueries({ queryKey: qk.clinicBundle(userId) })
    },
  })
}

/* ------------------------------ Clinician bundle ------------------------------ */

export interface ClinicBundle {
  patients: ProfileRow[]
  links: CareLinkRow[]
  protocols: ProtocolRow[]
  doses: DoseRow[]
  symptoms: SymptomRow[]
  weights: MeasurementRow[]
}

/** One round of queries for the clinician dashboard (all linked patients). */
export function useClinicBundle(clinicianId: string | undefined) {
  return useQuery({
    queryKey: qk.clinicBundle(clinicianId ?? ''),
    enabled: Boolean(clinicianId),
    staleTime: 30_000,
    queryFn: async (): Promise<ClinicBundle> => {
      const sb = requireSupabase()
      const links = unwrap(
        await sb
          .from('care_links')
          .select('*')
          .eq('clinician_id', clinicianId!)
          .eq('status', 'active'),
      )
      const ids = links.map((l) => l.patient_id)
      if (ids.length === 0) {
        return { patients: [], links, protocols: [], doses: [], symptoms: [], weights: [] }
      }
      const since60 = subDays(new Date(), 60).toISOString()
      const since14 = subDays(new Date(), 14).toISOString()
      const [patients, protocols, doses, symptoms, weights] = await Promise.all([
        sb.from('profiles').select('*').in('id', ids),
        sb.from('protocols').select('*').in('patient_id', ids).eq('status', 'active'),
        sb.from('doses').select('*').in('patient_id', ids).gte('administered_at', since60),
        sb.from('symptoms').select('*').in('patient_id', ids).gte('occurred_at', since14),
        sb
          .from('measurements')
          .select('*')
          .in('patient_id', ids)
          .eq('kind', 'weight')
          .gte('measured_at', since60)
          .order('measured_at', { ascending: false }),
      ])
      return {
        patients: unwrap(patients),
        links,
        protocols: unwrap(protocols),
        doses: unwrap(doses),
        symptoms: unwrap(symptoms),
        weights: unwrap(weights),
      }
    },
  })
}

/* ------------------------------ Clinical notes ------------------------------ */

export function useClinicalNotes(patientId: string | undefined) {
  return useQuery({
    queryKey: qk.clinicalNotes(patientId ?? ''),
    enabled: Boolean(patientId),
    queryFn: async (): Promise<ClinicalNoteRow[]> => {
      const sb = requireSupabase()
      return unwrap(
        await sb
          .from('clinical_notes')
          .select('*')
          .eq('patient_id', patientId!)
          .order('created_at', { ascending: false }),
      )
    },
  })
}

export function useAddClinicalNote(patientId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: Insert<'clinical_notes'>) => {
      const sb = requireSupabase()
      return unwrap(await sb.from('clinical_notes').insert(input).select('*').single())
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.clinicalNotes(patientId) }),
  })
}

export function useDeleteClinicalNote(patientId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const sb = requireSupabase()
      const { error } = await sb.from('clinical_notes').delete().eq('id', id)
      if (error) throw new Error(error.message)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.clinicalNotes(patientId) }),
  })
}

/* ------------------------------ Compound notes (wiki) ------------------------------ */

export function useCompoundNotes(compoundId: string) {
  return useQuery({
    queryKey: qk.compoundNotes(compoundId),
    queryFn: async (): Promise<CompoundNoteRow[]> => {
      const sb = requireSupabase()
      return unwrap(await sb.from('compound_notes').select('*').eq('compound_id', compoundId))
    },
  })
}

export function useSaveCompoundNote(clinicianId: string, compoundId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: string) => {
      const sb = requireSupabase()
      if (body.trim() === '') {
        const { error } = await sb
          .from('compound_notes')
          .delete()
          .eq('clinician_id', clinicianId)
          .eq('compound_id', compoundId)
        if (error) throw new Error(error.message)
        return null
      }
      return unwrap(
        await sb
          .from('compound_notes')
          .upsert(
            { clinician_id: clinicianId, compound_id: compoundId, body },
            { onConflict: 'clinician_id,compound_id' },
          )
          .select('*')
          .single(),
      )
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.compoundNotes(compoundId) }),
  })
}

/* ------------------------------ Saved protocols ------------------------------ */

/**
 * My saved regimens plus those saved by people I share my control with
 * (RLS returns both), so a clinician's standard protocols are one tap away.
 */
export function useSavedProtocols(userId: string | undefined) {
  return useQuery({
    queryKey: qk.savedProtocols(userId ?? ''),
    enabled: Boolean(userId),
    queryFn: async (): Promise<SavedProtocolRow[]> => {
      const sb = requireSupabase()
      return unwrap(await sb.from('saved_protocols').select('*').order('name'))
    },
  })
}

export function useSaveSavedProtocol(userId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: Insert<'saved_protocols'> & { id?: string }) => {
      const sb = requireSupabase()
      if (input.id) {
        const { id, ...patch } = input
        return unwrap(
          await sb.from('saved_protocols').update(patch).eq('id', id).select('*').single(),
        )
      }
      return unwrap(await sb.from('saved_protocols').insert(input).select('*').single())
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.savedProtocols(userId) }),
  })
}

export function useDeleteSavedProtocol(userId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const sb = requireSupabase()
      const { error } = await sb.from('saved_protocols').delete().eq('id', id)
      if (error) throw new Error(error.message)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.savedProtocols(userId) }),
  })
}
