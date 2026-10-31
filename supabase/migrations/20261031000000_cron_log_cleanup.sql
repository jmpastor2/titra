-- Keep pg_cron's run log small.
--
-- pg_cron writes a row to cron.job_run_details on every run and never deletes it. On 31-oct-2026 Forja's copy
-- of that log (a job every 5 seconds) reached 1.5 GB and put the shared Supabase organisation over the free
-- plan; Titra's (titra-send-reminders every 5 minutes) grows far slower but the same way. Same cleanup here.
--
-- Every 15 minutes: successful runs older than an hour go; failed runs are kept 7 days to investigate.
-- Postgres reuses the freed space, so the table stays at a few MB.

do $$
begin
  perform cron.unschedule(jobid) from cron.job where jobname = 'limpiar-historial-cron';
  perform cron.schedule(
    'limpiar-historial-cron',
    '*/15 * * * *',
    $cron$
    delete from cron.job_run_details
    where (status = 'succeeded' and end_time < now() - interval '1 hour')
       or end_time < now() - interval '7 days'
    $cron$
  );
end
$$;
