import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/data/database.types'
import { env } from './env'

export type TypedSupabase = SupabaseClient<Database>

let client: TypedSupabase | null = null

/**
 * Lazily create the Supabase client. Returns null when the app is not configured
 * so the UI can render a setup screen instead of crashing.
 */
export function getSupabase(): TypedSupabase | null {
  if (client) return client
  if (!env.isSupabaseConfigured) return null
  client = createClient<Database>(env.supabaseUrl!, env.supabaseAnonKey!, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
    },
    global: { headers: { 'x-titra-client': `web/${env.appVersion}` } },
  })
  return client
}

/** Throwing accessor for data hooks that only run once the app is configured and signed in. */
export function requireSupabase(): TypedSupabase {
  const c = getSupabase()
  if (!c) throw new Error('Supabase is not configured (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY)')
  return c
}
