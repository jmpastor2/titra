-- Orbe (the home assistant on jmpserver) reads the owner's dosing agenda: «¿qué me toca mañana?».
--
-- Only the agenda leaves the database: protocol names and the dose line the app already writes into
-- each reminder («2,5 mg · carga 25 U · 09:00»), whether each planned dose was logged, and this
-- week's counts. No notes, sites, inventory or other health data. The owner agreed to this.
--
-- The caller must present Orbe's key; Vault keeps only its SHA-256 next to the owner's user id:
--   select vault.create_secret('<sha256 hex of the key>', 'orbe_key_sha256');
--   select vault.create_secret('<owner user id>', 'orbe_user_id');
-- POST /rest/v1/rpc/orbe_agenda {"p_key": "...", "p_days": 2}. Without the right key: 42501.
--
-- Planned doses come from public.reminders (the app keeps 45 days of them there), so the server
-- does no schedule maths of its own.

create or replace function public.orbe_agenda(p_key text, p_days int default 2)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_hash text;
  v_user uuid;
  v_days int := greatest(1, least(coalesce(p_days, 2), 14));
  v_monday timestamptz := date_trunc('week', now() at time zone 'Europe/Madrid') at time zone 'Europe/Madrid';
begin
  select s.decrypted_secret into v_hash from vault.decrypted_secrets s where s.name = 'orbe_key_sha256' limit 1;
  if v_hash is null or p_key is null
     or encode(extensions.digest(p_key, 'sha256'), 'hex') <> v_hash then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  select s.decrypted_secret::uuid into v_user from vault.decrypted_secrets s where s.name = 'orbe_user_id' limit 1;

  return jsonb_build_object(
    'now', to_char(now() at time zone 'Europe/Madrid', 'YYYY-MM-DD"T"HH24:MI'),
    -- Planned doses from 3 h ago until the end of the window, and whether each one was logged
    'agenda', (
      select coalesce(jsonb_agg(jsonb_build_object(
               'at', to_char(r.occurrence_at at time zone 'Europe/Madrid', 'YYYY-MM-DD"T"HH24:MI'),
               'protocol', p.name,
               'dose', r.body,
               'taken', exists (
                 select 1 from public.doses d
                 where d.patient_id = v_user
                   and (d.protocol_id = p.id or (d.protocol_id is null and d.compound_id = p.compound_id))
                   and (d.planned_at between r.occurrence_at - interval '2 hours' and r.occurrence_at + interval '2 hours'
                        or d.administered_at between r.occurrence_at - interval '6 hours' and r.occurrence_at + interval '12 hours'))
             ) order by r.occurrence_at), '[]')
      from public.reminders r
      join public.protocols p on p.id = r.protocol_id and p.status = 'active'
      where r.user_id = v_user and r.skipped_at is null
        and r.occurrence_at >= now() - interval '3 hours'
        and r.occurrence_at < ((now() at time zone 'Europe/Madrid')::date + v_days) at time zone 'Europe/Madrid'
    ),
    -- Every active protocol: its next planned dose and what was logged this week
    'protocols', (
      select coalesce(jsonb_agg(jsonb_build_object(
               'name', p.name,
               'route', p.route,
               'next', (select jsonb_build_object('at', to_char(r.occurrence_at at time zone 'Europe/Madrid', 'YYYY-MM-DD"T"HH24:MI'), 'dose', r.body)
                        from public.reminders r
                        where r.protocol_id = p.id and r.skipped_at is null and r.occurrence_at >= now()
                        order by r.occurrence_at limit 1),
               'this_week', (select count(distinct coalesce(d.batch_id, d.id)) from public.doses d
                             where d.patient_id = v_user and d.administered_at >= v_monday
                               and (d.protocol_id = p.id or (d.protocol_id is null and d.compound_id = p.compound_id))),
               'last', (select to_char(max(d.administered_at) at time zone 'Europe/Madrid', 'YYYY-MM-DD"T"HH24:MI') from public.doses d
                        where d.patient_id = v_user
                          and (d.protocol_id = p.id or (d.protocol_id is null and d.compound_id = p.compound_id)))
             ) order by p.name), '[]')
      from public.protocols p
      where p.patient_id = v_user and p.status = 'active'
    )
  );
end;
$$;

revoke all on function public.orbe_agenda(text, int) from public, authenticated;
grant execute on function public.orbe_agenda(text, int) to anon, service_role;
