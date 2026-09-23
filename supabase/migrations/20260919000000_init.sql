-- ═══════════════════════════════════════════════════════════════════════════
--  TITRA · Supabase schema v1
--  Ejecutar en Supabase → SQL Editor → New query → Run  (o `supabase db push`)
--  Idempotente en lo posible. Todas las tablas con Row Level Security.
-- ═══════════════════════════════════════════════════════════════════════════

create extension if not exists pgcrypto;

-- ─────────────────────────────── Enums ───────────────────────────────────────
do $$ begin
  create type public.user_role as enum ('patient', 'clinician');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.care_link_status as enum ('active', 'revoked');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.protocol_status as enum ('active', 'paused', 'completed', 'archived');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.measurement_kind as enum (
    'weight', 'waist', 'body_fat_pct', 'lean_mass', 'bp_systolic', 'bp_diastolic',
    'heart_rate', 'glucose_fasting', 'glucose_random', 'hba1c', 'steps',
    'protein_g', 'resistance_session', 'sleep_hours'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.symptom_kind as enum (
    'nausea', 'vomiting', 'diarrhea', 'constipation', 'reflux', 'bloating',
    'abdominal_pain', 'fatigue', 'dizziness', 'headache', 'hypoglycemia',
    'injection_site_reaction', 'appetite_loss', 'food_noise', 'mood_change',
    'hair_loss', 'palpitations', 'other'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.inventory_form as enum ('pen', 'vial', 'tablet', 'cartridge');
exception when duplicate_object then null; end $$;

-- ─────────────────────────────── Helpers ─────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- Short, unambiguous clinic code (no 0/O/1/I).
create or replace function public.generate_clinic_code()
returns text language plpgsql as $$
declare
  alphabet text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  code text := '';
  i int;
begin
  for i in 1..6 loop
    code := code || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
  end loop;
  return code;
end $$;

-- ─────────────────────────────── Profiles ────────────────────────────────────
create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  role          public.user_role not null default 'patient',
  display_name  text not null default '',
  locale        text not null default 'es' check (locale in ('es', 'en')),
  unit_system   text not null default 'metric' check (unit_system in ('metric', 'imperial')),
  clinic_code   text unique,
  birth_year    int check (birth_year between 1900 and 2100),
  sex           text check (sex in ('M', 'F', 'O')),
  height_cm     numeric(5,1) check (height_cm between 50 and 260),
  goal_weight_kg numeric(5,1),
  protein_g_per_kg numeric(3,1) not null default 1.6,
  onboarded     boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- Clinicians get a clinic code automatically.
create or replace function public.ensure_clinic_code()
returns trigger language plpgsql as $$
begin
  if new.role = 'clinician' and new.clinic_code is null then
    loop
      new.clinic_code := public.generate_clinic_code();
      exit when not exists (select 1 from public.profiles p where p.clinic_code = new.clinic_code and p.id <> new.id);
    end loop;
  end if;
  return new;
end $$;

drop trigger if exists profiles_clinic_code on public.profiles;
create trigger profiles_clinic_code before insert or update of role on public.profiles
  for each row execute function public.ensure_clinic_code();

-- Auto-create profile on sign-up (display_name/role/locale from signUp metadata).
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name, role, locale)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)),
    coalesce((new.raw_user_meta_data ->> 'role')::public.user_role, 'patient'),
    coalesce(new.raw_user_meta_data ->> 'locale', 'es')
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─────────────────────────────── Care links ──────────────────────────────────
create table if not exists public.care_links (
  id            uuid primary key default gen_random_uuid(),
  clinician_id  uuid not null references public.profiles(id) on delete cascade,
  patient_id    uuid not null references public.profiles(id) on delete cascade,
  status        public.care_link_status not null default 'active',
  created_at    timestamptz not null default now(),
  revoked_at    timestamptz,
  unique (clinician_id, patient_id),
  check (clinician_id <> patient_id)
);
create index if not exists care_links_patient_idx on public.care_links (patient_id) where status = 'active';
create index if not exists care_links_clinician_idx on public.care_links (clinician_id) where status = 'active';

-- Is the current user an active clinician for this patient?
create or replace function public.is_my_patient(p_patient uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.care_links cl
    where cl.patient_id = p_patient
      and cl.clinician_id = auth.uid()
      and cl.status = 'active'
  );
$$;

-- Is this clinician linked to the current user (patient)?
create or replace function public.is_my_clinician(p_clinician uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.care_links cl
    where cl.clinician_id = p_clinician
      and cl.patient_id = auth.uid()
      and cl.status = 'active'
  );
$$;

-- Patient links to a clinician by code (RPC). Reactivates a revoked link.
create or replace function public.link_clinician(p_code text)
returns public.care_links language plpgsql security definer set search_path = public as $$
declare
  v_clinician uuid;
  v_link public.care_links;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  select id into v_clinician from public.profiles
    where role = 'clinician' and upper(clinic_code) = upper(trim(p_code));
  if v_clinician is null then raise exception 'invalid_code'; end if;
  if v_clinician = auth.uid() then raise exception 'self_link'; end if;

  insert into public.care_links (clinician_id, patient_id, status)
  values (v_clinician, auth.uid(), 'active')
  on conflict (clinician_id, patient_id)
    do update set status = 'active', revoked_at = null
  returning * into v_link;
  return v_link;
end $$;

-- ─────────────────────────────── Protocols ───────────────────────────────────
create table if not exists public.protocols (
  id            uuid primary key default gen_random_uuid(),
  patient_id    uuid not null references public.profiles(id) on delete cascade,
  created_by    uuid not null references public.profiles(id) on delete set null,
  compound_id   text not null,
  name          text not null,
  route         text not null default 'sc',
  unit          text not null default 'mg',
  start_date    date not null,
  time_of_day   text not null default '09:00',
  steps         jsonb not null,  -- ScheduleStep[]: {doseMg, intervalDays, durationWeeks|null, label?}
  status        public.protocol_status not null default 'active',
  template_id   text,
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  check (jsonb_typeof(steps) = 'array' and jsonb_array_length(steps) > 0)
);
create index if not exists protocols_patient_idx on public.protocols (patient_id, status);
drop trigger if exists protocols_updated_at on public.protocols;
create trigger protocols_updated_at before update on public.protocols
  for each row execute function public.set_updated_at();

-- ─────────────────────────────── Inventory ───────────────────────────────────
create table if not exists public.inventory (
  id                      uuid primary key default gen_random_uuid(),
  patient_id              uuid not null references public.profiles(id) on delete cascade,
  compound_id             text not null,
  form                    public.inventory_form not null default 'pen',
  label                   text not null,
  total_mg                numeric(12,4) not null check (total_mg > 0),
  remaining_mg            numeric(12,4) not null check (remaining_mg >= 0),
  concentration_mg_per_ml numeric(12,4),
  opened_at               date,
  expires_at              date,
  lot                     text,
  storage_notes           text,
  archived                boolean not null default false,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);
create index if not exists inventory_patient_idx on public.inventory (patient_id) where archived = false;
drop trigger if exists inventory_updated_at on public.inventory;
create trigger inventory_updated_at before update on public.inventory
  for each row execute function public.set_updated_at();

-- ─────────────────────────────── Doses ───────────────────────────────────────
create table if not exists public.doses (
  id              uuid primary key default gen_random_uuid(),
  patient_id      uuid not null references public.profiles(id) on delete cascade,
  protocol_id     uuid references public.protocols(id) on delete set null,
  compound_id     text not null,
  dose_mg         numeric(12,4) not null check (dose_mg > 0),
  administered_at timestamptz not null,
  site_id         text,
  inventory_id    uuid references public.inventory(id) on delete set null,
  notes           text,
  created_at      timestamptz not null default now()
);
create index if not exists doses_patient_time_idx on public.doses (patient_id, administered_at desc);

-- Decrement inventory when a dose is linked to a container.
create or replace function public.apply_dose_to_inventory()
returns trigger language plpgsql as $$
begin
  if new.inventory_id is not null then
    update public.inventory
      set remaining_mg = greatest(0, remaining_mg - new.dose_mg)
      where id = new.inventory_id;
  end if;
  return new;
end $$;
drop trigger if exists doses_apply_inventory on public.doses;
create trigger doses_apply_inventory after insert on public.doses
  for each row execute function public.apply_dose_to_inventory();

-- ─────────────────────────────── Symptoms ────────────────────────────────────
create table if not exists public.symptoms (
  id          uuid primary key default gen_random_uuid(),
  patient_id  uuid not null references public.profiles(id) on delete cascade,
  occurred_at timestamptz not null,
  kind        public.symptom_kind not null,
  severity    int not null check (severity between 0 and 10),
  notes       text,
  created_at  timestamptz not null default now()
);
create index if not exists symptoms_patient_time_idx on public.symptoms (patient_id, occurred_at desc);

-- ─────────────────────────────── Measurements ────────────────────────────────
create table if not exists public.measurements (
  id          uuid primary key default gen_random_uuid(),
  patient_id  uuid not null references public.profiles(id) on delete cascade,
  measured_at timestamptz not null,
  kind        public.measurement_kind not null,
  value       numeric(12,3) not null,
  unit        text not null,
  notes       text,
  source      text not null default 'manual',
  created_at  timestamptz not null default now()
);
create index if not exists measurements_patient_kind_idx on public.measurements (patient_id, kind, measured_at desc);

-- ─────────────────────────────── Lab results ─────────────────────────────────
create table if not exists public.lab_results (
  id          uuid primary key default gen_random_uuid(),
  patient_id  uuid not null references public.profiles(id) on delete cascade,
  drawn_at    date not null,
  analyte     text not null,
  value       numeric(14,4) not null,
  unit        text not null,
  ref_low     numeric(14,4),
  ref_high    numeric(14,4),
  notes       text,
  created_at  timestamptz not null default now()
);
create index if not exists lab_results_patient_idx on public.lab_results (patient_id, drawn_at desc);

-- ─────────────────────────────── Clinical notes ──────────────────────────────
create table if not exists public.clinical_notes (
  id                 uuid primary key default gen_random_uuid(),
  clinician_id       uuid not null references public.profiles(id) on delete cascade,
  patient_id         uuid not null references public.profiles(id) on delete cascade,
  body               text not null,
  visible_to_patient boolean not null default false,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index if not exists clinical_notes_patient_idx on public.clinical_notes (patient_id, created_at desc);
drop trigger if exists clinical_notes_updated_at on public.clinical_notes;
create trigger clinical_notes_updated_at before update on public.clinical_notes
  for each row execute function public.set_updated_at();

-- ─────────────────────────────── Compound notes (wiki curation) ──────────────
create table if not exists public.compound_notes (
  id           uuid primary key default gen_random_uuid(),
  clinician_id uuid not null references public.profiles(id) on delete cascade,
  compound_id  text not null,
  body         text not null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (clinician_id, compound_id)
);
drop trigger if exists compound_notes_updated_at on public.compound_notes;
create trigger compound_notes_updated_at before update on public.compound_notes
  for each row execute function public.set_updated_at();

-- ─────────────────────────────── Push subscriptions ──────────────────────────
create table if not exists public.push_subscriptions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  endpoint   text not null unique,
  p256dh     text not null,
  auth       text not null,
  user_agent text,
  created_at timestamptz not null default now()
);

-- ═══════════════════════════════ RLS ═════════════════════════════════════════
alter table public.profiles           enable row level security;
alter table public.care_links         enable row level security;
alter table public.protocols          enable row level security;
alter table public.inventory          enable row level security;
alter table public.doses              enable row level security;
alter table public.symptoms           enable row level security;
alter table public.measurements       enable row level security;
alter table public.lab_results        enable row level security;
alter table public.clinical_notes     enable row level security;
alter table public.compound_notes     enable row level security;
alter table public.push_subscriptions enable row level security;

-- profiles
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_my_patient(id) or public.is_my_clinician(id));
drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());
drop policy if exists profiles_insert on public.profiles;
create policy profiles_insert on public.profiles for insert to authenticated
  with check (id = auth.uid());

-- care_links (insert only through link_clinician RPC)
drop policy if exists care_links_select on public.care_links;
create policy care_links_select on public.care_links for select to authenticated
  using (clinician_id = auth.uid() or patient_id = auth.uid());
drop policy if exists care_links_update on public.care_links;
create policy care_links_update on public.care_links for update to authenticated
  using (clinician_id = auth.uid() or patient_id = auth.uid())
  with check (clinician_id = auth.uid() or patient_id = auth.uid());

-- Generic patient-owned tables: patient full access, linked clinician read-only.
do $$
declare tbl text;
begin
  foreach tbl in array array['doses', 'symptoms', 'measurements', 'lab_results', 'inventory'] loop
    execute format('drop policy if exists %1$s_owner_all on public.%1$s', tbl);
    execute format(
      'create policy %1$s_owner_all on public.%1$s for all to authenticated
         using (patient_id = auth.uid()) with check (patient_id = auth.uid())', tbl);
    execute format('drop policy if exists %1$s_clinician_read on public.%1$s', tbl);
    execute format(
      'create policy %1$s_clinician_read on public.%1$s for select to authenticated
         using (public.is_my_patient(patient_id))', tbl);
  end loop;
end $$;

-- protocols: patient full access; linked clinician can read, create and edit.
drop policy if exists protocols_owner_all on public.protocols;
create policy protocols_owner_all on public.protocols for all to authenticated
  using (patient_id = auth.uid()) with check (patient_id = auth.uid());
drop policy if exists protocols_clinician_select on public.protocols;
create policy protocols_clinician_select on public.protocols for select to authenticated
  using (public.is_my_patient(patient_id));
drop policy if exists protocols_clinician_insert on public.protocols;
create policy protocols_clinician_insert on public.protocols for insert to authenticated
  with check (public.is_my_patient(patient_id) and created_by = auth.uid());
drop policy if exists protocols_clinician_update on public.protocols;
create policy protocols_clinician_update on public.protocols for update to authenticated
  using (public.is_my_patient(patient_id)) with check (public.is_my_patient(patient_id));

-- clinical_notes
drop policy if exists clinical_notes_clinician_all on public.clinical_notes;
create policy clinical_notes_clinician_all on public.clinical_notes for all to authenticated
  using (clinician_id = auth.uid())
  with check (clinician_id = auth.uid() and public.is_my_patient(patient_id));
drop policy if exists clinical_notes_patient_read on public.clinical_notes;
create policy clinical_notes_patient_read on public.clinical_notes for select to authenticated
  using (patient_id = auth.uid() and visible_to_patient);

-- compound_notes
drop policy if exists compound_notes_clinician_all on public.compound_notes;
create policy compound_notes_clinician_all on public.compound_notes for all to authenticated
  using (clinician_id = auth.uid()) with check (clinician_id = auth.uid());
drop policy if exists compound_notes_patient_read on public.compound_notes;
create policy compound_notes_patient_read on public.compound_notes for select to authenticated
  using (public.is_my_clinician(clinician_id));

-- push_subscriptions
drop policy if exists push_own on public.push_subscriptions;
create policy push_own on public.push_subscriptions for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Grants (Supabase default roles)
grant usage on schema public to anon, authenticated;
grant all on all tables in schema public to authenticated;
grant execute on function public.link_clinician(text) to authenticated;
grant execute on function public.is_my_patient(uuid) to authenticated;
grant execute on function public.is_my_clinician(uuid) to authenticated;
