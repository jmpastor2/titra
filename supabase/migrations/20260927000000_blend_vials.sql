-- ═══════════════════════════════════════════════════════════════════════════
--  TITRA · migración 4 · viales blend (varias sustancias en el mismo vial)
--  Ejecutar en Supabase → SQL Editor → New query → Run, después de la migración 3.
--  Idempotente: se puede ejecutar dos veces sin efectos adicionales.
--
--  Un vial blend (CJC-1295 + ipamorelina 5 + 5 mg, KLOW…) guarda su sustancia
--  principal en compound_id / total_mg y las demás en `components`:
--    [{ "compoundId": "ipamorelin", "mg": 5 }]
--  remaining_mg sigue la sustancia principal; las demás bajan en la misma proporción.
--  Al registrar una toma, solo la fila de la sustancia principal descuenta del vial.
-- ═══════════════════════════════════════════════════════════════════════════

alter table public.inventory
  add column if not exists components jsonb not null default '[]'::jsonb;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'inventory_components_is_array'
  ) then
    alter table public.inventory
      add constraint inventory_components_is_array check (jsonb_typeof(components) = 'array');
  end if;
end $$;

comment on column public.inventory.components is
  'Blend vials: other compounds and their mg in the vial, [{compoundId, mg}]';
