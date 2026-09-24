-- ═══════════════════════════════════════════════════════════════════════════
--  TITRA · migración 2 · control personal
--  Ejecutar en Supabase → SQL Editor → New query → Run, después de la migración 1.
--  Idempotente: se puede ejecutar dos veces sin efectos adicionales.
--
--  Cada usuario lleva su propio control. Compartir es opcional: el dueño del control
--  introduce el código de quien quiere que lo vea (care_links.clinician_id = quien ve,
--  care_links.patient_id = dueño). Por eso ahora todas las cuentas tienen código.
-- ═══════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────── Códigos para compartir ──────────────────────
create or replace function public.ensure_clinic_code()
returns trigger language plpgsql as $$
begin
  if new.clinic_code is null then
    loop
      new.clinic_code := public.generate_clinic_code();
      exit when not exists (
        select 1 from public.profiles p where p.clinic_code = new.clinic_code and p.id <> new.id
      );
    end loop;
  end if;
  return new;
end $$;

drop trigger if exists profiles_clinic_code on public.profiles;
create trigger profiles_clinic_code before insert or update on public.profiles
  for each row execute function public.ensure_clinic_code();

-- Backfill: the trigger assigns a unique code to every profile that has none.
update public.profiles set clinic_code = null where clinic_code is null;

-- ─────────────────────────────── Pautas: mezclas y varias tomas ──────────────
alter table public.protocols
  add column if not exists components jsonb not null default '[]'::jsonb,
  add column if not exists times text[] not null default array['09:00'];

-- Carry the single legacy time over the first time this migration runs.
update public.protocols
  set times = array[left(time_of_day, 5)]
  where times = array['09:00'] and time_of_day is not null and left(time_of_day, 5) <> '09:00';

alter table public.protocols drop constraint if exists protocols_components_is_array;
alter table public.protocols add constraint protocols_components_is_array
  check (jsonb_typeof(components) = 'array');
alter table public.protocols drop constraint if exists protocols_times_not_empty;
alter table public.protocols add constraint protocols_times_not_empty
  check (cardinality(times) between 1 and 8);

-- ─────────────────────────────── Dosis: tomas agrupadas ──────────────────────
-- Every compound drawn into the same syringe is its own dose row; batch_id ties them.
alter table public.doses add column if not exists batch_id uuid;
create index if not exists doses_batch_idx on public.doses (batch_id) where batch_id is not null;

-- ─────────────────────────────── Viales: reconstitución ──────────────────────
alter table public.inventory add column if not exists diluent_ml numeric(8,3)
  check (diluent_ml is null or diluent_ml > 0);

-- ─────────────────────────────── Bienestar (escala 0–10) ─────────────────────
alter type public.measurement_kind add value if not exists 'energy';
alter type public.measurement_kind add value if not exists 'sleep_quality';
alter type public.measurement_kind add value if not exists 'mood';
alter type public.measurement_kind add value if not exists 'recovery';
alter type public.measurement_kind add value if not exists 'libido';
alter type public.measurement_kind add value if not exists 'appetite';
alter type public.measurement_kind add value if not exists 'focus';

-- ─────────────────────────────── Pautas guardadas ────────────────────────────
create table if not exists public.saved_protocols (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references public.profiles(id) on delete cascade,
  name        text not null check (length(trim(name)) > 0),
  compound_id text not null,
  unit        text not null default 'mg',
  components  jsonb not null default '[]'::jsonb check (jsonb_typeof(components) = 'array'),
  steps       jsonb not null check (jsonb_typeof(steps) = 'array' and jsonb_array_length(steps) > 0),
  times       text[] not null default array['09:00'] check (cardinality(times) between 1 and 8),
  notes       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists saved_protocols_owner_idx on public.saved_protocols (owner_id);
drop trigger if exists saved_protocols_updated_at on public.saved_protocols;
create trigger saved_protocols_updated_at before update on public.saved_protocols
  for each row execute function public.set_updated_at();

alter table public.saved_protocols enable row level security;

drop policy if exists saved_protocols_owner_all on public.saved_protocols;
create policy saved_protocols_owner_all on public.saved_protocols for all to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- People who share their control with me can reuse the protocols I have saved
-- (for example, a clinician's standard regimens).
drop policy if exists saved_protocols_shared_read on public.saved_protocols;
create policy saved_protocols_shared_read on public.saved_protocols for select to authenticated
  using (public.is_my_clinician(owner_id));

grant select, insert, update, delete on public.saved_protocols to authenticated;
