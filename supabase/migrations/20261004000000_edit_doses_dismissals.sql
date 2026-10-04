-- ═══════════════════════════════════════════════════════════════════════════
--  TITRA · migración 5 · editar tomas, alertas descartadas y más medidas
--  Ejecutar en Supabase → SQL Editor → New query → Run, después de la migración 4.
--  Idempotente: se puede ejecutar dos veces sin efectos adicionales.
--
--   · doses.planned_at: a qué toma planificada corresponde una dosis. Sirve para
--     que una toma tardía (o una "extra" para compensar) cuente como la que se
--     perdió, en vez de dejar una perdida y una extra.
--   · Editar una toma (cantidad o vial) ajusta el stock del vial, igual que
--     registrarla o borrarla.
--   · alert_dismissals: alertas marcadas como leídas, para que no vuelvan a salir.
--   · Medidas nuevas (cadera, pecho, brazo, muslo, agua) se añaden en el paso 2.
-- ═══════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────── 1 · Tomas ──────────────────────────────────
alter table public.doses add column if not exists planned_at timestamptz;
comment on column public.doses.planned_at is
  'Planned administration this dose covers; null = matched automatically by time.';

-- Editing a dose gives the old amount back to its vial and takes the new one.
create or replace function public.apply_dose_update_to_inventory()
returns trigger
language plpgsql
as $$
begin
  if old.inventory_id is not distinct from new.inventory_id and old.dose_mg = new.dose_mg then
    return new;
  end if;
  if old.inventory_id is not null then
    update public.inventory
       set remaining_mg = least(total_mg, remaining_mg + old.dose_mg)
     where id = old.inventory_id and patient_id = old.patient_id;
  end if;
  if new.inventory_id is not null then
    update public.inventory
       set remaining_mg = greatest(0, remaining_mg - new.dose_mg)
     where id = new.inventory_id and patient_id = new.patient_id;
  end if;
  return new;
end $$;

drop trigger if exists doses_update_inventory on public.doses;
create trigger doses_update_inventory after update of dose_mg, inventory_id on public.doses
  for each row execute function public.apply_dose_update_to_inventory();

-- ─────────────────────────────── 2 · Alertas leídas ─────────────────────────
create table if not exists public.alert_dismissals (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  alert_key  text not null check (length(alert_key) between 1 and 200),
  created_at timestamptz not null default now(),
  unique (user_id, alert_key)
);
create index if not exists alert_dismissals_user_idx on public.alert_dismissals (user_id);

alter table public.alert_dismissals enable row level security;

drop policy if exists alert_dismissals_owner_all on public.alert_dismissals;
create policy alert_dismissals_owner_all on public.alert_dismissals for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

revoke all on public.alert_dismissals from anon;
grant select, insert, update, delete on public.alert_dismissals to authenticated;

-- ─────────────────────────────── 3 · Medidas nuevas ─────────────────────────
-- Cada una va en su propia sentencia: un valor nuevo del enum no se puede usar
-- dentro de la misma transacción que lo crea.
alter type public.measurement_kind add value if not exists 'hydration_ml';
alter type public.measurement_kind add value if not exists 'hip';
alter type public.measurement_kind add value if not exists 'chest';
alter type public.measurement_kind add value if not exists 'arm';
alter type public.measurement_kind add value if not exists 'thigh';
