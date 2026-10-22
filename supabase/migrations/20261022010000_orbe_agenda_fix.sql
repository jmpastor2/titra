-- Orbe agenda, fixed: a dose that was logged no longer vanishes, and step-up decisions are not doses.
--
-- send-reminders sets skipped_at on a reminder when the dose was already logged, when there is no push
-- device or when it is stale, so filtering on skipped_at hid exactly the doses that were taken. The
-- agenda now lists every planned dose and lets 'taken' say whether it was logged. Rows with
-- compound_id = 'cycle' are the weekly step-up decision, not a dose, and are left out.
--
-- Planned doses come from public.reminders, which the app keeps filled for the next 14 days only while
-- reminders are enabled on it (Más, Avisos): without them Orbe sees an empty agenda. The server does no
-- schedule maths of its own. Same signature, key check, grants and search_path as 20261022000000.

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
      where r.user_id = v_user and r.compound_id <> 'cycle'
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
                        where r.protocol_id = p.id and r.compound_id <> 'cycle' and r.occurrence_at >= now()
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
