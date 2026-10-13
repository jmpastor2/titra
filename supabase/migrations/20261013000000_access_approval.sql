-- ═══════════════════════════════════════════════════════════════════════════
--  TITRA · migración 6 · acceso con aprobación
--  Ejecutar después de la migración 5:
--    npx supabase db query --linked -f supabase/migrations/20261013000000_access_approval.sql
--  Idempotente: se puede ejecutar dos veces sin efectos adicionales.
--
--   · Quien se registra queda «pendiente» hasta que un administrador lo aprueba.
--     Mientras tanto la base de datos no le deja leer ni escribir nada: cada tabla
--     de public lleva una política RESTRICTIVA `approved_only` que se suma (AND) a
--     las que ya tenía. La pantalla de «pendiente» es solo la cara amable de esto.
--   · Las funciones SECURITY DEFINER que actúan en nombre del usuario (enlazar,
--     avisos, suscripción push) también lo comprueban.
--   · Las cuentas que ya existían quedan aprobadas. Los administradores se marcan
--     a mano (no van aquí para no publicar correos):
--       update public.access set is_admin = true where user_id = '<uuid>';
--   · Cada solicitud nueva avisa por ntfy si existe el secreto de Vault
--     `access_ntfy_topic` (sin él no se avisa y todo lo demás funciona igual):
--       select vault.create_secret('<tema>', 'access_ntfy_topic');
--   · Tabla nueva en public = necesita su `approved_only`: basta con volver a
--     ejecutar esta migración.
-- ═══════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────── 1 · Tabla de accesos ───────────────────────
create table if not exists public.access (
  user_id      uuid primary key references auth.users(id) on delete cascade,
  status       text not null default 'pending'
               check (status in ('pending', 'approved', 'rejected')),
  is_admin     boolean not null default false,
  requested_at timestamptz not null default now(),
  decided_at   timestamptz
);
comment on table public.access is
  'Who may use the app: every sign-up starts pending until an admin approves it.';

alter table public.access enable row level security;

-- Each person can read their own row (the app shows «pending» from it). Nobody writes
-- it directly: the sign-up trigger creates it and decide_access() changes it.
drop policy if exists access_read_own on public.access;
create policy access_read_own on public.access for select to authenticated
  using (user_id = (select auth.uid()));

revoke all on public.access from anon, authenticated;
grant select on public.access to authenticated;

-- Existing accounts keep working: they are approved once, the first time this runs.
insert into public.access (user_id, status, requested_at, decided_at)
select u.id, 'approved', u.created_at, now()
from auth.users u
where not exists (select 1 from public.access);

-- ─────────────────────────────── 2 · Comprobaciones ─────────────────────────
create or replace function public.is_approved()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.access a
    where a.user_id = auth.uid() and a.status = 'approved'
  )
$$;

create or replace function public.is_access_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.access a
    where a.user_id = auth.uid() and a.status = 'approved' and a.is_admin
  )
$$;

revoke execute on function public.is_approved() from public, anon;
revoke execute on function public.is_access_admin() from public, anon;
grant execute on function public.is_approved() to authenticated;
grant execute on function public.is_access_admin() to authenticated;

-- ─────────────────────────────── 3 · Candado en cada tabla ──────────────────
-- A restrictive policy is ANDed with the permissive ones, so the existing rules stay
-- exactly as they were for approved people and nothing passes for the rest.
do $$
declare
  t record;
begin
  for t in
    select c.relname
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind in ('r', 'p') and c.relname <> 'access'
  loop
    execute format('drop policy if exists approved_only on public.%I', t.relname);
    execute format(
      'create policy approved_only on public.%I as restrictive for all to authenticated '
      'using ((select public.is_approved())) with check ((select public.is_approved()))',
      t.relname
    );
  end loop;
end $$;

-- ─────────────────────────────── 4 · Solicitud al registrarse ───────────────
create or replace function public.handle_access_request()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_topic text;
begin
  insert into public.access (user_id) values (new.id) on conflict (user_id) do nothing;

  -- The notice is best effort: it never stops anyone from signing up.
  begin
    select s.decrypted_secret into v_topic
    from vault.decrypted_secrets s
    where s.name = 'access_ntfy_topic'
    limit 1;
    if v_topic is not null then
      perform net.http_post(
        url := 'https://ntfy.sh',
        body := jsonb_build_object(
          'topic', v_topic,
          'title', 'Titra · solicitud de acceso',
          'message', 'Alguien ha pedido acceso. Ábrelo para aprobarlo o rechazarlo.',
          'click', 'https://jmpastor2.github.io/titra/#/access',
          'tags', jsonb_build_array('key')
        )
      );
    end if;
  exception when others then
    null;
  end;

  return new;
end $$;

revoke execute on function public.handle_access_request() from public, anon, authenticated;

drop trigger if exists on_auth_user_access on auth.users;
create trigger on_auth_user_access
  after insert on auth.users
  for each row execute function public.handle_access_request();

-- ─────────────────────────────── 5 · Panel del administrador ────────────────
create or replace function public.access_requests()
returns table (
  user_id      uuid,
  email        text,
  display_name text,
  status       text,
  is_admin     boolean,
  requested_at timestamptz,
  decided_at   timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_access_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  return query
    select a.user_id,
           u.email::text,
           coalesce(
             nullif(p.display_name, ''),
             nullif(u.raw_user_meta_data ->> 'display_name', ''),
             split_part(u.email::text, '@', 1)
           ),
           a.status,
           a.is_admin,
           a.requested_at,
           a.decided_at
    from public.access a
    join auth.users u on u.id = a.user_id
    left join public.profiles p on p.id = a.user_id
    order by (a.status = 'pending') desc, a.requested_at desc;
end $$;

create or replace function public.decide_access(p_user uuid, p_status text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_access_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if p_status not in ('pending', 'approved', 'rejected') then
    raise exception 'invalid_status' using errcode = '22023';
  end if;
  if p_user = auth.uid() then
    raise exception 'self' using errcode = '22023';
  end if;
  update public.access
     set status = p_status,
         decided_at = case when p_status = 'pending' then null else now() end
   where user_id = p_user;
  if not found then
    raise exception 'not_found' using errcode = 'P0002';
  end if;
end $$;

revoke execute on function public.access_requests() from public, anon;
revoke execute on function public.decide_access(uuid, text) from public, anon;
grant execute on function public.access_requests() to authenticated;
grant execute on function public.decide_access(uuid, text) to authenticated;

-- ─────────────────────────────── 6 · Funciones que actúan por el usuario ────
-- Same bodies as before plus one line: a pending account cannot use them.
create or replace function public.link_clinician(p_code text)
returns public.care_links
language plpgsql
security definer
set search_path = public
as $$
declare
  v_clinician uuid;
  v_link public.care_links;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  if not public.is_approved() then raise exception 'pending_approval' using errcode = '42501'; end if;
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

create or replace function public.replace_reminders(p_rows jsonb)
returns integer
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
  if not public.is_approved() then
    raise exception 'pending_approval' using errcode = '42501';
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

create or replace function public.save_push_subscription(
  p_endpoint text,
  p_p256dh text,
  p_auth text,
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
  if not public.is_approved() then
    raise exception 'pending_approval' using errcode = '42501';
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
