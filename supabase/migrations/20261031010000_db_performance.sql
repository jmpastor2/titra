-- Database performance, from a review on 31-oct-2026 (the data is small; this keeps it fast as it grows).
--
-- Indexes for foreign keys that had none: joins and the ON DELETE checks on the parent no longer scan the table.
create index if not exists clinical_notes_clinician_id_idx on public.clinical_notes (clinician_id);
create index if not exists doses_inventory_id_idx on public.doses (inventory_id);
create index if not exists doses_protocol_id_idx on public.doses (protocol_id);
create index if not exists protocols_created_by_idx on public.protocols (created_by);
create index if not exists push_subscriptions_user_id_idx on public.push_subscriptions (user_id);
create index if not exists reminders_protocol_id_idx on public.reminders (protocol_id);

-- RLS: auth.uid() written bare is evaluated once per row; wrapped as (select auth.uid()) Postgres evaluates it
-- once per query (Supabase's "auth_rls_initplan" advice). Same rule, same result. Rewritten in place with
-- ALTER POLICY from each policy's own definition, so nothing else about the policies changes. Idempotent:
-- a policy that is already wrapped is left as it is.
do $$
declare
  p record;
  envolver constant text := '(select auth.uid())';
  usar text;
  comprobar text;
begin
  for p in
    select schemaname, tablename, policyname, qual, with_check
    from pg_policies
    where schemaname = 'public'
      and (coalesce(qual, '') ~ '(?<!SELECT )auth\.uid\(\)' or coalesce(with_check, '') ~ '(?<!SELECT )auth\.uid\(\)')
  loop
    usar := regexp_replace(p.qual, '(?<!SELECT )auth\.uid\(\)', envolver, 'g');
    comprobar := regexp_replace(p.with_check, '(?<!SELECT )auth\.uid\(\)', envolver, 'g');
    if usar is not null then
      execute format('alter policy %I on %I.%I using (%s)', p.policyname, p.schemaname, p.tablename, usar);
    end if;
    if comprobar is not null then
      execute format('alter policy %I on %I.%I with check (%s)', p.policyname, p.schemaname, p.tablename, comprobar);
    end if;
  end loop;
end
$$;
