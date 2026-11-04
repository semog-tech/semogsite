-- Preparado antes do avanço. Reverter código antes de remover a fachada.
-- Rode como `postgres`, primeiro passo da descida do banco (docs/DEPLOY.md).
begin;
do $$ begin
  if current_user <> 'postgres' then
    raise exception 'Rode como postgres (conectado: %)', current_user;
  end if;
end $$;

drop function if exists cms.crm_rdstation_config_obter();
commit;
