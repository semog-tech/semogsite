-- Inverso preparado antes da migração. Desligar RD e reconciliar envios antes.
--
-- Inverso de `2026-11-04-crm-provider-2-postgres.sql`. Rode como `postgres`,
-- depois de reverter o código e ANTES de `2026-11-04-crm-provider-1-cms-user.down.sql`.
-- Ordem completa em docs/DEPLOY.md.
begin;
do $$ begin
  if current_user <> 'postgres' then
    raise exception 'Rode como postgres (conectado: %)', current_user;
  end if;
end $$;

drop function if exists cms.crm_rdstation_token_obter();
commit;
