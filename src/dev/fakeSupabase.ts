/**
 * Development lab only (lab.html, never part of the published app): an in-memory stand-in
 * for the Supabase client with the subset of the query builder the app uses, plus the
 * database triggers that matter (vial stock follows dose inserts, edits and deletes).
 */
import type { TypedSupabase } from '@/lib/supabase'

export type Row = Record<string, unknown>
export type Store = Record<string, Row[]> & {
  profiles: Row[]
  protocols: Row[]
  inventory: Row[]
  doses: Row[]
  measurements: Row[]
  saved_protocols: Row[]
}

interface Result {
  data: unknown
  error: { message: string; code?: string } | null
  count?: number | null
}

const nowIso = () => new Date().toISOString()
const uuid = () => crypto.randomUUID()

/** Columns the database fills in when a row is inserted without them. */
const DEFAULTS: Record<string, () => Row> = {
  doses: () => ({
    protocol_id: null,
    site_id: null,
    inventory_id: null,
    batch_id: null,
    planned_at: null,
    notes: null,
  }),
  protocols: () => ({
    route: 'sc',
    unit: 'mg',
    time_of_day: '09:00',
    components: [],
    status: 'active',
    template_id: null,
    notes: null,
  }),
  inventory: () => ({
    form: 'vial',
    concentration_mg_per_ml: null,
    diluent_ml: null,
    components: [],
    opened_at: null,
    expires_at: null,
    lot: null,
    storage_notes: null,
    archived: false,
  }),
  measurements: () => ({ notes: null, source: 'manual' }),
  symptoms: () => ({ notes: null }),
  lab_results: () => ({ ref_low: null, ref_high: null, notes: null }),
}

const num = (v: unknown) => Number(v ?? 0)

function applyDoseTriggers(
  db: Store,
  kind: 'insert' | 'update' | 'delete',
  next?: Row,
  prev?: Row,
) {
  const vial = (id: unknown) => db.inventory?.find((v) => v.id === id)
  const take = (row: Row | undefined) => {
    const v = row?.inventory_id ? vial(row.inventory_id) : undefined
    if (v && row) v.remaining_mg = Math.max(0, num(v.remaining_mg) - num(row.dose_mg))
  }
  const give = (row: Row | undefined) => {
    const v = row?.inventory_id ? vial(row.inventory_id) : undefined
    if (v && row) v.remaining_mg = Math.min(num(v.total_mg), num(v.remaining_mg) + num(row.dose_mg))
  }
  if (kind === 'insert') take(next)
  if (kind === 'delete') give(prev)
  if (kind === 'update' && prev && next) {
    if (prev.inventory_id === next.inventory_id && prev.dose_mg === next.dose_mg) return
    give(prev)
    take(next)
  }
}

class Query implements PromiseLike<Result> {
  private op: 'select' | 'insert' | 'update' | 'delete' | 'upsert' = 'select'
  private filters: ((r: Row) => boolean)[] = []
  private payload: Row | Row[] | undefined
  private orderBy: { col: string; asc: boolean }[] = []
  private limitTo: number | undefined
  private rangeTo: [number, number] | undefined
  private wantSingle: 'single' | 'maybe' | null = null
  private returning = false
  private head = false
  private wantCount = false
  private onConflict: string[] = []
  private ignoreDuplicates = false

  private readonly db: Store
  private readonly table: string

  constructor(db: Store, table: string) {
    this.db = db
    this.table = table
  }

  select(_cols?: string, opts?: { count?: string; head?: boolean }) {
    if (this.op !== 'select') this.returning = true
    if (opts?.count) this.wantCount = true
    if (opts?.head) this.head = true
    return this
  }
  insert(p: Row | Row[]) {
    this.op = 'insert'
    this.payload = p
    return this
  }
  update(p: Row) {
    this.op = 'update'
    this.payload = p
    return this
  }
  upsert(p: Row | Row[], opts?: { onConflict?: string; ignoreDuplicates?: boolean }) {
    this.op = 'upsert'
    this.payload = p
    this.onConflict = (opts?.onConflict ?? 'id').split(',').map((s) => s.trim())
    this.ignoreDuplicates = Boolean(opts?.ignoreDuplicates)
    return this
  }
  delete() {
    this.op = 'delete'
    return this
  }
  eq(col: string, v: unknown) {
    this.filters.push((r) => r[col] === v)
    return this
  }
  neq(col: string, v: unknown) {
    this.filters.push((r) => r[col] !== v)
    return this
  }
  in(col: string, vs: unknown[]) {
    this.filters.push((r) => vs.includes(r[col]))
    return this
  }
  is(col: string, v: unknown) {
    this.filters.push((r) => (v === null ? r[col] == null : r[col] === v))
    return this
  }
  gte(col: string, v: unknown) {
    this.filters.push((r) => String(r[col] ?? '') >= String(v))
    return this
  }
  lte(col: string, v: unknown) {
    this.filters.push((r) => String(r[col] ?? '') <= String(v))
    return this
  }
  gt(col: string, v: unknown) {
    this.filters.push((r) => String(r[col] ?? '') > String(v))
    return this
  }
  lt(col: string, v: unknown) {
    this.filters.push((r) => String(r[col] ?? '') < String(v))
    return this
  }
  or() {
    // Only used for clinician views; the lab has none.
    return this
  }
  order(col: string, opts?: { ascending?: boolean }) {
    this.orderBy.push({ col, asc: opts?.ascending !== false })
    return this
  }
  limit(n: number) {
    this.limitTo = n
    return this
  }
  range(from: number, to: number) {
    this.rangeTo = [from, to]
    return this
  }
  single() {
    this.wantSingle = 'single'
    return this
  }
  maybeSingle() {
    this.wantSingle = 'maybe'
    return this
  }

  private rows(): Row[] {
    return (this.db[this.table] ??= []).filter((r) => this.filters.every((f) => f(r)))
  }

  private run(): Result {
    const table = (this.db[this.table] ??= [])
    let out: Row[] = []

    if (this.op === 'insert' || this.op === 'upsert') {
      const list = Array.isArray(this.payload) ? this.payload : [this.payload ?? {}]
      for (const raw of list) {
        const key = this.onConflict
        const existing =
          this.op === 'upsert' ? table.find((r) => key.every((k) => r[k] === raw[k])) : undefined
        if (existing) {
          if (!this.ignoreDuplicates) Object.assign(existing, raw, { updated_at: nowIso() })
          out.push(existing)
          continue
        }
        const row: Row = {
          id: uuid(),
          created_at: nowIso(),
          ...(DEFAULTS[this.table]?.() ?? {}),
          ...raw,
        }
        if (this.table === 'protocols' && !row.times)
          row.times = [String(row.time_of_day ?? '09:00')]
        table.push(row)
        if (this.table === 'doses') applyDoseTriggers(this.db, 'insert', row)
        out.push(row)
      }
    } else if (this.op === 'update') {
      for (const r of this.rows()) {
        const prev = { ...r }
        Object.assign(r, this.payload, { updated_at: nowIso() })
        if (this.table === 'doses') applyDoseTriggers(this.db, 'update', r, prev)
        out.push(r)
      }
    } else if (this.op === 'delete') {
      const hit = this.rows()
      for (const r of hit) {
        table.splice(table.indexOf(r), 1)
        if (this.table === 'doses') applyDoseTriggers(this.db, 'delete', undefined, r)
      }
      out = hit
    } else {
      out = this.rows()
      for (const { col, asc } of this.orderBy.toReversed()) {
        out = out.toSorted((a, b) => {
          const x = String(a[col] ?? '')
          const y = String(b[col] ?? '')
          return (x < y ? -1 : x > y ? 1 : 0) * (asc ? 1 : -1)
        })
      }
      if (this.rangeTo) out = out.slice(this.rangeTo[0], this.rangeTo[1] + 1)
      if (this.limitTo !== undefined) out = out.slice(0, this.limitTo)
    }

    const count = this.wantCount ? out.length : null
    const mutation = this.op !== 'select'
    if (this.head) return { data: null, error: null, count }
    const data = mutation && !this.returning ? null : out.map((r) => ({ ...r }))
    if (this.wantSingle) {
      if (data && data.length === 1) return { data: data[0], error: null, count }
      if (this.wantSingle === 'maybe' && data && data.length === 0)
        return { data: null, error: null, count }
      return {
        data: null,
        error: {
          message: 'JSON object requested, multiple (or no) rows returned',
          code: 'PGRST116',
        },
        count,
      }
    }
    return { data, error: null, count }
  }

  then<A = Result, B = never>(
    ok?: ((v: Result) => A | PromiseLike<A>) | null,
    fail?: ((e: unknown) => B | PromiseLike<B>) | null,
  ): PromiseLike<A | B> {
    return Promise.resolve()
      .then(() => this.run())
      .then(ok, fail)
  }
}

export function createFakeSupabase(db: Store, user: { id: string; email: string }): TypedSupabase {
  const session = { user, access_token: 'lab' }
  const client = {
    from: (table: string) => new Query(db, table),
    rpc: (name: string, args: Record<string, unknown>) =>
      Promise.resolve<Result>(
        name === 'replace_reminders'
          ? { data: Array.isArray(args.p_rows) ? args.p_rows.length : 0, error: null }
          : { data: uuid(), error: null },
      ),
    auth: {
      getSession: async () => ({ data: { session }, error: null }),
      getUser: async () => ({ data: { user }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
      signOut: async () => ({ error: null }),
    },
  }
  return client as unknown as TypedSupabase
}
