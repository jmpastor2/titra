/**
 * Data for the Registro rápido. Reads go through three small queries scoped by kind: a
 * water row per tap would otherwise crowd the readings that matter out of a year of
 * measurements (the API returns 1000 rows at most). Writes are optimistic, so a tap shows
 * at once, and can be undone even before the server has answered. All keys live under
 * ['measurements', patientId], so the existing hooks' invalidations refresh them too.
 */
import { useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { startOfDay, subDays } from 'date-fns'
import { useMemo } from 'react'
import type { MeasurementKind, MeasurementRow } from '@/data/database.types'
import { useAddMeasurement, useDeleteMeasurement } from '@/data/hooks'
import { WELLBEING } from '@/features/checkin/wellbeing'
import { requireSupabase } from '@/lib/supabase'
import { latestReading, ofKind, type LatestReading } from './readings'

/** Everything that adds up through the day or the week: one row per tap or session. */
export const COUNTER_KINDS: readonly MeasurementKind[] = [
  'hydration_ml',
  'protein_g',
  'resistance_session',
]
/** Slow-moving body readings: only the latest and the one before matter. */
export const BODY_KINDS: readonly MeasurementKind[] = [
  'weight',
  'waist',
  'hip',
  'chest',
  'arm',
  'thigh',
]

interface Group {
  name: string
  kinds: readonly MeasurementKind[]
  days: number
}

const COUNTERS: Group = { name: 'counters', kinds: COUNTER_KINDS, days: 8 }
const BODY: Group = { name: 'body', kinds: BODY_KINDS, days: 400 }
const CHECK_INS: Group = { name: 'wellbeing', kinds: WELLBEING, days: 45 }
const GROUPS: readonly Group[] = [COUNTERS, BODY, CHECK_INS]

const scope = (patientId: string) => ['measurements', patientId] as const
const groupKey = (patientId: string, name: string) => [...scope(patientId), 'quick', name] as const
const lastKey = (patientId: string, kind: MeasurementKind) =>
  [...scope(patientId), 'last', kind] as const

async function fetchRows(
  patientId: string,
  kinds: readonly MeasurementKind[],
  since: Date | null,
  limit?: number,
): Promise<MeasurementRow[]> {
  let query = requireSupabase()
    .from('measurements')
    .select('*')
    .eq('patient_id', patientId)
    .in('kind', [...kinds])
  if (since) query = query.gte('measured_at', since.toISOString())
  query = query.order('measured_at', { ascending: false })
  if (limit) query = query.limit(limit)
  const { data, error } = await query
  if (error) throw new Error(error.message)
  return data ?? []
}

/** The rows behind the tiles: counters this week, body readings, recent check-ins. */
export function useQuickMeasurements(patientId: string) {
  const counters = useGroup(patientId, COUNTERS)
  const body = useGroup(patientId, BODY)
  const wellbeing = useGroup(patientId, CHECK_INS)
  const rows = useMemo(
    () => [...(counters.data ?? []), ...(body.data ?? []), ...(wellbeing.data ?? [])],
    [counters.data, body.data, wellbeing.data],
  )
  return { rows, pending: counters.isPending || body.isPending || wellbeing.isPending }
}

/** Water, protein and strength sessions of the last week: what the day's counters add up. */
export function useCounterMeasurements(patientId: string) {
  return useGroup(patientId, COUNTERS)
}

function useGroup(patientId: string, group: Group) {
  return useQuery({
    queryKey: groupKey(patientId, group.name),
    enabled: Boolean(patientId),
    queryFn: () => fetchRows(patientId, group.kinds, subDays(startOfDay(new Date()), group.days)),
  })
}

/** The latest rows of a kind already in a group's cache, to open a sheet with no wait. */
function cachedRows(qc: QueryClient, patientId: string, kind: MeasurementKind) {
  const group = GROUPS.find((g) => g.kinds.includes(kind))
  const state = group && qc.getQueryState<MeasurementRow[]>(groupKey(patientId, group.name))
  const rows = state?.data ? ofKind(state.data, kind).slice(0, 2) : []
  return rows.length ? { rows, at: state?.dataUpdatedAt } : null
}

/** The latest reading of a kind and the one before it: what a stepper starts from. */
export function useLastReading(patientId: string, kind: MeasurementKind, enabled = true) {
  const qc = useQueryClient()
  const query = useQuery({
    queryKey: lastKey(patientId, kind),
    enabled: Boolean(patientId) && enabled,
    queryFn: () => fetchRows(patientId, [kind], null, 2),
    initialData: () => cachedRows(qc, patientId, kind)?.rows,
    initialDataUpdatedAt: () => cachedRows(qc, patientId, kind)?.at,
  })
  const latest: LatestReading | null = useMemo(
    () => (query.data ? latestReading(query.data, kind) : null),
    [query.data, kind],
  )
  return { latest, pending: enabled && query.isPending }
}

/* ------------------------------------------------------------------ writes */

export interface NewMeasurement {
  kind: MeasurementKind
  value: number
  unit: string
  /** ISO time; now when left out. */
  measuredAt?: string
  notes?: string | null
}

/** What a write hands back: the rows as the screen already shows them, and the server's word. */
export interface Written {
  rows: MeasurementRow[]
  /** Rejects when the server refuses (the rows are taken back off the screen by then). */
  saved: Promise<MeasurementRow[]>
}

const TEMP = 'pending-'
/** Temporary id to the id the server gave it (null if it never got one), for undoing in time. */
const realIds = new Map<string, Promise<string | null>>()

function track(temps: readonly MeasurementRow[], request: Promise<MeasurementRow[]>) {
  temps.forEach((t, index) => {
    realIds.set(
      t.id,
      request.then(
        (rows) => rows[index]?.id ?? null,
        () => null,
      ),
    )
  })
  while (realIds.size > 200) {
    const oldest = realIds.keys().next()
    if (oldest.done) break
    realIds.delete(oldest.value)
  }
}

function patchCache(
  qc: QueryClient,
  patientId: string,
  change: (rows: MeasurementRow[]) => MeasurementRow[],
) {
  qc.setQueriesData<MeasurementRow[]>({ queryKey: scope(patientId) }, (old) =>
    Array.isArray(old) ? change(old) : old,
  )
}

const byTimeDesc = (a: MeasurementRow, b: MeasurementRow) =>
  Date.parse(b.measured_at) - Date.parse(a.measured_at)

/**
 * Add and remove measurements with the screen updated first: a new row is in every cached
 * list at once and comes back out if the server refuses it. `remove` also takes a row whose
 * insert is still on its way. Stable between renders.
 */
export function useQuickWrites(patientId: string) {
  const qc = useQueryClient()
  // mutateAsync is stable for the life of the hook, unlike the mutation objects.
  const { mutateAsync: addAsync } = useAddMeasurement(patientId)
  const { mutateAsync: deleteAsync } = useDeleteMeasurement(patientId)

  return useMemo(() => {
    async function addMany(inputs: readonly NewMeasurement[]): Promise<Written> {
      await qc.cancelQueries({ queryKey: scope(patientId) })
      const stamp = new Date().toISOString()
      const temps = inputs.map((i): MeasurementRow => ({
        id: `${TEMP}${crypto.randomUUID()}`,
        patient_id: patientId,
        measured_at: i.measuredAt ?? stamp,
        kind: i.kind,
        value: i.value,
        unit: i.unit,
        notes: i.notes ?? null,
        source: 'manual',
        created_at: stamp,
      }))
      patchCache(qc, patientId, (rows) => [...temps, ...rows].toSorted(byTimeDesc))
      const saved = addAsync(
        temps.map((t) => ({
          patient_id: patientId,
          kind: t.kind,
          value: t.value,
          unit: t.unit,
          measured_at: t.measured_at,
          notes: t.notes,
        })),
      )
      track(temps, saved)
      const ids = new Set(temps.map((t) => t.id))
      // Handled here, so a caller that ignores `saved` raises no unhandled rejection.
      saved.catch(() => patchCache(qc, patientId, (rows) => rows.filter((r) => !ids.has(r.id))))
      return { rows: temps, saved }
    }

    async function remove(row: MeasurementRow): Promise<void> {
      await qc.cancelQueries({ queryKey: scope(patientId) })
      patchCache(qc, patientId, (rows) => rows.filter((r) => r.id !== row.id))
      const id = row.id.startsWith(TEMP) ? await realIds.get(row.id) : row.id
      if (!id) return
      try {
        await deleteAsync(id)
      } catch (error) {
        void qc.invalidateQueries({ queryKey: scope(patientId) })
        throw error
      }
    }

    /** Take back every row of one save (a check-in is seven). */
    async function removeMany(rows: readonly MeasurementRow[]): Promise<void> {
      await Promise.all(rows.map(remove))
    }

    return { addMany, remove, removeMany }
  }, [qc, patientId, addAsync, deleteAsync])
}

/**
 * The id of a row a mutation handed back. The insert hooks are typed as returning nothing
 * useful, though the database does return the row, so it is read defensively.
 */
export function rowId(row: unknown): string | null {
  return typeof row === 'object' && row !== null && 'id' in row && typeof row.id === 'string'
    ? row.id
    : null
}
