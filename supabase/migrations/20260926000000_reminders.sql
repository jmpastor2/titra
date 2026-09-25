-- ═══════════════════════════════════════════════════════════════════════════
--  TITRA · migración 3 · recordatorios de dosis (notificaciones push)
--  Ejecutar en Supabase → SQL Editor → New query → Run, después de la migración 2.
--  Idempotente: se puede ejecutar dos veces sin efectos adicionales.
--
--  Reparto del trabajo:
--   · La app calcula las próximas tomas de cada pauta en la zona horaria del usuario
--     y las guarda aquí con replace_reminders(). El servidor no hace cálculos de horario.
--   · pg_cron llama cada 5 minutos a la Edge Function `send-reminders`, que envía un
--     Web Push por cada recordatorio vencido cuya dosis aún no está registrada.
--
--  ── PASO ÚNICO (después de ejecutar este archivo) ─────────────────────────────
--  Guarda en Supabase Vault la dirección de las funciones y el secreto del cron.
--  Sustituye los textos en MAYÚSCULAS y ejecuta estas dos líneas en el SQL Editor:
--
--    select vault.create_secret('https://TU-REFERENCIA.supabase.co/functions/v1', 'titra_functions_url');
--    select vault.create_secret('EL_CRON_SECRET_DE_supabase/.env.reminders.local', 'titra_cron_secret');
--
--  Para cambiar un valor más adelante:
--    select vault.update_secret((select id from vault.secrets where name = 'titra_cron_secret'), 'NUEVO_VALOR');
--  Para comprobar que existen (no muestra los valores):
--    select name, created_at from vault.secrets where name like 'titra_%';
--  Mientras falte alguno de los dos, el cron se ejecuta pero no llama a la función.
-- ═══════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────── Preferencias del usuario ───────────────────
alter table public.profiles
  add column if not exists reminders_enabled boolean not null default false,
  add column if not exists reminder_lead_minutes int not null default 0
    check (reminder_lead_minutes between 0 and 120);

-- ─────────────────────────────── Recordatorios ──────────────────────────────
create table if not exists public.reminders (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references public.profiles(id) on delete cascade,
  protocol_id       uuid not null references public.protocols(id) on delete cascade,
  occurrence_at     timestamptz not null,           -- hora prevista de la toma
  fire_at           timestamptz not null,           -- occurrence_at menos la antelación
  compound_id       text not null,                  -- compuesto principal: detecta dosis ya registrada
  title             text not null,
  body              text not null,
  url               text not null default '/',
  tolerance_minutes int not null default 240 check (tolerance_minutes between 0 and 1440),
  sent_at           timestamptz,
  skipped_at        timestamptz,
  created_at        timestamptz not null default now(),
  unique (user_id, protocol_id, occurrence_at),
  check (occurrence_at >= fire_at and occurrence_at <= fire_at + interval '1 day')
);
create index if not exists reminders_pending_fire_idx on public.reminders (fire_at)
  where sent_at is null and skipped_at is null;
create index if not exists reminders_user_idx on public.reminders (user_id, fire_at);

alter table public.reminders enable row level security;

-- Clients read and delete their own rows; all writes go through replace_reminders().
drop policy if exists reminders_owner_select on public.reminders;
create policy reminders_owner_select on public.reminders for select to authenticated
  using (user_id = auth.uid());
drop policy if exists reminders_owner_delete on public.reminders;
create policy reminders_owner_delete on public.reminders for delete to authenticated
  using (user_id = auth.uid());

-- Supabase grants everything on new tables by default; narrow it down explicitly.
revoke all on public.reminders from anon, authenticated;
grant select, delete on public.reminders to authenticated;
grant all on public.reminders to service_role;

-- ─────────────────────────────── replace_reminders(p_rows) ──────────────────
-- Replaces the caller's pending future reminders with p_rows (a JSON array of
-- {protocol_id, occurrence_at, fire_at, compound_id, title, body, url?, tolerance_minutes?}).
-- Rows that do not qualify are dropped silently: another user's protocol, fire_at outside
-- (now, now + 45 days), occurrence_at before fire_at or more than a day after it, or a
-- missing compound_id/title/body. At most 500 rows (the soonest) are kept. Rows already
-- sent or skipped are never touched. Returns how many rows were inserted or updated.
-- Passing '[]' (or null) just clears the pending future reminders.
create or replace function public.replace_reminders(p_rows jsonb)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid   uuid := auth.uid();
  v_count int := 0;
begin
  if v_uid is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;
  if p_rows is not null and jsonb_typeof(p_rows) <> 'array' then
    raise exception 'p_rows must be a JSON array' using errcode = '22023';
  end if;

  delete from public.reminders r
   where r.user_id = v_uid
     and r.sent_at is null
     and r.skipped_at is null
     and r.fire_at > now();

  if p_rows is null or jsonb_array_length(p_rows) = 0 then
    return 0;
  end if;

  insert into public.reminders as r
    (user_id, protocol_id, occurrence_at, fire_at, compound_id, title, body, url, tolerance_minutes)
  select v_uid, x.protocol_id, x.occurrence_at, x.fire_at, x.compound_id,
         left(x.title, 120), left(x.body, 500),
         coalesce(nullif(left(x.url, 500), ''), '/'),
         least(greatest(coalesce(x.tolerance_minutes, 240), 0), 1440)
  from (
    select distinct on (j.protocol_id, j.occurrence_at) j.*
    from jsonb_to_recordset(p_rows) as j(
      protocol_id uuid, occurrence_at timestamptz, fire_at timestamptz, compound_id text,
      title text, body text, url text, tolerance_minutes int
    )
    where j.fire_at > now()
      and j.fire_at < now() + interval '45 days'
      and j.occurrence_at >= j.fire_at
      and j.occurrence_at <= j.fire_at + interval '1 day'
      and j.compound_id is not null
      and j.title is not null
      and j.body is not null
      and exists (select 1 from public.protocols p where p.id = j.protocol_id and p.patient_id = v_uid)
    order by j.protocol_id, j.occurrence_at, j.fire_at
  ) x
  order by x.fire_at
  limit 500
  on conflict (user_id, protocol_id, occurrence_at) do update
    set fire_at           = excluded.fire_at,
        title             = excluded.title,
        body              = excluded.body,
        url               = excluded.url,
        tolerance_minutes = excluded.tolerance_minutes,
        compound_id       = excluded.compound_id
    where r.sent_at is null and r.skipped_at is null;

  get diagnostics v_count = row_count;
  return v_count;
end $$;

revoke all on function public.replace_reminders(jsonb) from public, anon;
grant execute on function public.replace_reminders(jsonb) to authenticated;

-- ─────────────────────────────── due_reminders() (solo servidor) ────────────
-- Used by the send-reminders Edge Function (service role): pending reminders whose
-- fire_at is in (p_now - 30 min, p_now], only for users who turned reminders on.
create or replace function public.due_reminders(p_now timestamptz default now(), p_limit int default 500)
returns setof public.reminders
language sql
stable
set search_path = public
as $$
  select r.*
  from public.reminders r
  join public.profiles pr on pr.id = r.user_id and pr.reminders_enabled
  where r.sent_at is null
    and r.skipped_at is null
    and r.fire_at <= p_now
    and r.fire_at > p_now - interval '30 minutes'
  order by r.fire_at
  limit least(greatest(coalesce(p_limit, 500), 1), 500);
$$;

revoke all on function public.due_reminders(timestamptz, int) from public, anon, authenticated;
grant execute on function public.due_reminders(timestamptz, int) to service_role;

-- ─────────────────────────────── Suscripciones push ─────────────────────────
-- The push_own policy (migration 1) already lets each user insert, read, update and
-- delete their own push_subscriptions rows. What it cannot do is take over an endpoint
-- that is still registered to another account on the same browser (endpoint is unique
-- and the other row is invisible under RLS), so a plain upsert fails after switching
-- accounts. This RPC stores the current browser's subscription for the caller and
-- moves it over from the previous account if needed. Returns the row id.
create or replace function public.save_push_subscription(
  p_endpoint   text,
  p_p256dh     text,
  p_auth       text,
  p_user_agent text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_id  uuid;
begin
  if v_uid is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;
  if coalesce(p_endpoint, '') !~ '^https://' or coalesce(p_p256dh, '') = '' or coalesce(p_auth, '') = '' then
    raise exception 'invalid_subscription' using errcode = '22023';
  end if;

  insert into public.push_subscriptions (user_id, endpoint, p256dh, auth, user_agent)
  values (v_uid, p_endpoint, p_p256dh, p_auth, left(p_user_agent, 300))
  on conflict (endpoint) do update
    set user_id    = excluded.user_id,
        p256dh     = excluded.p256dh,
        auth       = excluded.auth,
        user_agent = excluded.user_agent
  returning id into v_id;
  return v_id;
end $$;

revoke all on function public.save_push_subscription(text, text, text, text) from public, anon;
grant execute on function public.save_push_subscription(text, text, text, text) to authenticated;

-- ─────────────────────────────── Inventario: borrar una dosis ───────────────
-- doses_apply_inventory (migration 1) subtracts a dose from its container on insert.
-- Deleting the dose now gives the amount back, never above the container's total.
-- The patient_id match keeps a dose from ever touching someone else's container.
create or replace function public.restore_dose_to_inventory()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.inventory_id is not null then
    update public.inventory
       set remaining_mg = least(total_mg, remaining_mg + old.dose_mg)
     where id = old.inventory_id
       and patient_id = old.patient_id;
  end if;
  return old;
end $$;

drop trigger if exists doses_restore_inventory on public.doses;
create trigger doses_restore_inventory after delete on public.doses
  for each row execute function public.restore_dose_to_inventory();

-- ─────────────────────────────── Cron: cada 5 minutos ───────────────────────
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Re-running this file replaces the job instead of adding a second one.
-- The job reads the URL and the secret from Vault on every run; if either secret is
-- missing the cross join is empty and nothing is called.
do $do$
begin
  perform cron.unschedule(jobid) from cron.job where jobname = 'titra-send-reminders';
  perform cron.schedule(
    'titra-send-reminders',
    '*/5 * * * *',
    $cron$
    select net.http_post(
      url := rtrim(u.decrypted_secret, '/') || '/send-reminders',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-cron-secret', s.decrypted_secret
      ),
      body := jsonb_build_object('source', 'pg_cron'),
      timeout_milliseconds := 30000
    )
    from (select decrypted_secret from vault.decrypted_secrets where name = 'titra_functions_url') u
    cross join (select decrypted_secret from vault.decrypted_secrets where name = 'titra_cron_secret') s;
    $cron$
  );
end $do$;
