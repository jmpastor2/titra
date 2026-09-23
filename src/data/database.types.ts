/**
 * Database row types mirroring supabase/migrations. Hand-maintained in the
 * shape produced by `supabase gen types typescript` so the client is fully typed.
 */
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type UserRole = 'patient' | 'clinician'
export type CareLinkStatus = 'active' | 'revoked'
export type ProtocolStatus = 'active' | 'paused' | 'completed' | 'archived'
export type MeasurementKind =
  | 'weight'
  | 'waist'
  | 'body_fat_pct'
  | 'lean_mass'
  | 'bp_systolic'
  | 'bp_diastolic'
  | 'heart_rate'
  | 'glucose_fasting'
  | 'glucose_random'
  | 'hba1c'
  | 'steps'
  | 'protein_g'
  | 'resistance_session'
  | 'sleep_hours'
export type SymptomKind =
  | 'nausea'
  | 'vomiting'
  | 'diarrhea'
  | 'constipation'
  | 'reflux'
  | 'bloating'
  | 'abdominal_pain'
  | 'fatigue'
  | 'dizziness'
  | 'headache'
  | 'hypoglycemia'
  | 'injection_site_reaction'
  | 'appetite_loss'
  | 'food_noise'
  | 'mood_change'
  | 'hair_loss'
  | 'palpitations'
  | 'other'
export type InventoryForm = 'pen' | 'vial' | 'tablet' | 'cartridge'

export type ProfileRow = {
  id: string
  role: UserRole
  display_name: string
  locale: 'es' | 'en'
  unit_system: 'metric' | 'imperial'
  clinic_code: string | null
  birth_year: number | null
  sex: 'M' | 'F' | 'O' | null
  height_cm: number | null
  goal_weight_kg: number | null
  protein_g_per_kg: number
  onboarded: boolean
  created_at: string
  updated_at: string
}

export type CareLinkRow = {
  id: string
  clinician_id: string
  patient_id: string
  status: CareLinkStatus
  created_at: string
  revoked_at: string | null
}

export type ProtocolRow = {
  id: string
  patient_id: string
  created_by: string
  compound_id: string
  name: string
  route: string
  unit: string
  start_date: string
  time_of_day: string
  steps: Json
  status: ProtocolStatus
  template_id: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export type InventoryRow = {
  id: string
  patient_id: string
  compound_id: string
  form: InventoryForm
  label: string
  total_mg: number
  remaining_mg: number
  concentration_mg_per_ml: number | null
  opened_at: string | null
  expires_at: string | null
  lot: string | null
  storage_notes: string | null
  archived: boolean
  created_at: string
  updated_at: string
}

export type DoseRow = {
  id: string
  patient_id: string
  protocol_id: string | null
  compound_id: string
  dose_mg: number
  administered_at: string
  site_id: string | null
  inventory_id: string | null
  notes: string | null
  created_at: string
}

export type SymptomRow = {
  id: string
  patient_id: string
  occurred_at: string
  kind: SymptomKind
  severity: number
  notes: string | null
  created_at: string
}

export type MeasurementRow = {
  id: string
  patient_id: string
  measured_at: string
  kind: MeasurementKind
  value: number
  unit: string
  notes: string | null
  source: string
  created_at: string
}

export type LabResultRow = {
  id: string
  patient_id: string
  drawn_at: string
  analyte: string
  value: number
  unit: string
  ref_low: number | null
  ref_high: number | null
  notes: string | null
  created_at: string
}

export type ClinicalNoteRow = {
  id: string
  clinician_id: string
  patient_id: string
  body: string
  visible_to_patient: boolean
  created_at: string
  updated_at: string
}

export type CompoundNoteRow = {
  id: string
  clinician_id: string
  compound_id: string
  body: string
  created_at: string
  updated_at: string
}

export type PushSubscriptionRow = {
  id: string
  user_id: string
  endpoint: string
  p256dh: string
  auth: string
  user_agent: string | null
  created_at: string
}

type WithOptional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

type Table<Row, InsertOptional extends keyof Row> = {
  Row: Row
  Insert: WithOptional<Row, InsertOptional>
  Update: Partial<Row>
  Relationships: []
}

export type Database = {
  public: {
    Tables: {
      profiles: Table<
        ProfileRow,
        | 'role'
        | 'display_name'
        | 'locale'
        | 'unit_system'
        | 'clinic_code'
        | 'birth_year'
        | 'sex'
        | 'height_cm'
        | 'goal_weight_kg'
        | 'protein_g_per_kg'
        | 'onboarded'
        | 'created_at'
        | 'updated_at'
      >
      care_links: Table<CareLinkRow, 'id' | 'status' | 'created_at' | 'revoked_at'>
      protocols: Table<
        ProtocolRow,
        | 'id'
        | 'route'
        | 'unit'
        | 'time_of_day'
        | 'status'
        | 'template_id'
        | 'notes'
        | 'created_at'
        | 'updated_at'
      >
      inventory: Table<
        InventoryRow,
        | 'id'
        | 'form'
        | 'concentration_mg_per_ml'
        | 'opened_at'
        | 'expires_at'
        | 'lot'
        | 'storage_notes'
        | 'archived'
        | 'created_at'
        | 'updated_at'
      >
      doses: Table<
        DoseRow,
        'id' | 'protocol_id' | 'site_id' | 'inventory_id' | 'notes' | 'created_at'
      >
      symptoms: Table<SymptomRow, 'id' | 'notes' | 'created_at'>
      measurements: Table<MeasurementRow, 'id' | 'notes' | 'source' | 'created_at'>
      lab_results: Table<LabResultRow, 'id' | 'ref_low' | 'ref_high' | 'notes' | 'created_at'>
      clinical_notes: Table<
        ClinicalNoteRow,
        'id' | 'visible_to_patient' | 'created_at' | 'updated_at'
      >
      compound_notes: Table<CompoundNoteRow, 'id' | 'created_at' | 'updated_at'>
      push_subscriptions: Table<PushSubscriptionRow, 'id' | 'user_agent' | 'created_at'>
    }
    Views: { [_ in never]: never }
    Functions: {
      link_clinician: { Args: { p_code: string }; Returns: CareLinkRow }
      is_my_patient: { Args: { p_patient: string }; Returns: boolean }
      is_my_clinician: { Args: { p_clinician: string }; Returns: boolean }
    }
    Enums: {
      user_role: UserRole
      care_link_status: CareLinkStatus
      protocol_status: ProtocolStatus
      measurement_kind: MeasurementKind
      symptom_kind: SymptomKind
      inventory_form: InventoryForm
    }
    CompositeTypes: { [_ in never]: never }
  }
}
