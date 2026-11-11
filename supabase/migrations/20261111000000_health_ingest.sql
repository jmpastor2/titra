-- Health data from the Google Health band, pushed by Forja (the training app, another Supabase
-- project) every time it syncs. One connection to Google for both apps: Forja holds the tokens
-- and calls this function with the days it just read.
--
-- POST /rest/v1/rpc/health_ingest {"p_key": "...", "p_days": [{date, weight, body_fat, resting_hr,
-- steps, sleep_min, protein_g}], "p_workouts": [{started_at, activity}]}
--
-- Rows land in `measurements` with source 'google_health', in the kinds the app already shows
-- (weight, body_fat_pct, heart_rate, steps, sleep_hours, protein_g, resistance_session). Each call
-- replaces what the band had for those dates, so it can be repeated; manual entries are never
-- touched. The key's SHA-256 is in Vault as `health_ingest_key_sha256` and the person it writes
-- to as `health_ingest_patient_id`. Without the key: 42501.

create or replace function public.health_ingest(p_key text, p_days jsonb, p_workouts jsonb default '[]')
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_hash text;
  v_patient uuid;
  v_from date;
  v_to date;
  v_rows int := 0;
  v_more int := 0;
begin
  select s.decrypted_secret into v_hash from vault.decrypted_secrets s where s.name = 'health_ingest_key_sha256' limit 1;
  if v_hash is null or p_key is null
     or encode(extensions.digest(p_key, 'sha256'), 'hex') <> v_hash then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  select s.decrypted_secret::uuid into v_patient from vault.decrypted_secrets s where s.name = 'health_ingest_patient_id' limit 1;
  if v_patient is null then
    raise exception 'no patient configured' using errcode = '42501';
  end if;

  select min((d->>'date')::date), max((d->>'date')::date) into v_from, v_to
  from jsonb_array_elements(coalesce(p_days, '[]')) d;
  if v_from is null then
    return jsonb_build_object('rows', 0);
  end if;
  -- A sync never covers more than 90 days: refuse anything wider than that.
  if v_to - v_from > 100 or jsonb_array_length(p_days) > 100 then
    raise exception 'range too wide' using errcode = '22023';
  end if;

  delete from public.measurements m
  where m.patient_id = v_patient and m.source = 'google_health'
    and (m.measured_at at time zone 'Europe/Madrid')::date between v_from and v_to;

  -- One measurement per day and kind, stamped at 08:00 local of that day
  insert into public.measurements (patient_id, measured_at, kind, value, unit, source)
  select v_patient,
         ((d->>'date')::date + time '08:00') at time zone 'Europe/Madrid',
         k.kind::public.measurement_kind, k.value, k.unit, 'google_health'
  from jsonb_array_elements(p_days) d
  cross join lateral (values
    ('weight',       (d->>'weight')::numeric,                         'kg'),
    ('body_fat_pct', (d->>'body_fat')::numeric,                       '%'),
    ('heart_rate',   (d->>'resting_hr')::numeric,                     'bpm'),
    ('steps',        (d->>'steps')::numeric,                          'steps'),
    ('sleep_hours',  round((d->>'sleep_min')::numeric / 60, 1),       'h'),
    ('protein_g',    (d->>'protein_g')::numeric,                      'g')
  ) as k(kind, value, unit)
  where k.value is not null and k.value > 0;
  get diagnostics v_rows = row_count;

  -- Strength sessions recorded by the band, at their real time
  insert into public.measurements (patient_id, measured_at, kind, value, unit, source)
  select v_patient, (w->>'started_at')::timestamptz, 'resistance_session', 1, 'session', 'google_health'
  from jsonb_array_elements(coalesce(p_workouts, '[]')) w
  where (w->>'activity') in ('STRENGTH_TRAINING', 'WEIGHTLIFTING')
    and ((w->>'started_at')::timestamptz at time zone 'Europe/Madrid')::date between v_from and v_to;
  get diagnostics v_more = row_count;

  return jsonb_build_object('rows', v_rows + v_more, 'from', v_from, 'to', v_to);
end;
$$;

revoke all on function public.health_ingest(text, jsonb, jsonb) from public, authenticated;
grant execute on function public.health_ingest(text, jsonb, jsonb) to anon, service_role;
