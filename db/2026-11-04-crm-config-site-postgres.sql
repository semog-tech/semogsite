-- NÃO aplicado. Após migrações crm-provider e crm-rdstation-config do semogapp
-- (sem `commercial.crm_rdstation_config_obter()` o `create function` falha) e
-- após a parte `cms_user` do site; antes do deploy do site.
-- Só leitura, sem token; inverso: 2026-11-04-crm-config-site-postgres.down.sql.
--
-- Conectado como `postgres` (MCP ou SQL Editor), junto com
-- `2026-11-04-crm-provider-2-postgres.sql`. Não toca `cms.leads`. Ordem completa
-- em docs/DEPLOY.md.
begin;
do $$ begin
  if current_user <> 'postgres' then
    raise exception 'Rode como postgres (conectado: %)', current_user;
  end if;
end $$;

create function cms.crm_rdstation_config_obter() returns jsonb
language sql stable security definer set search_path = ''
as $$ select commercial.crm_rdstation_config_obter() $$;
alter function cms.crm_rdstation_config_obter() owner to postgres;
revoke all on function cms.crm_rdstation_config_obter() from public, anon, authenticated, service_role, cms_user;
grant execute on function cms.crm_rdstation_config_obter() to cms_user;
comment on function cms.crm_rdstation_config_obter() is
  'Configuração RD schema_version=1 mantida pelo admin no semogapp; NULL permite envs legadas. Sem USAGE commercial para o site.';

do $$
declare objeto record;
begin
  if not has_function_privilege('cms_user', 'cms.crm_rdstation_config_obter()', 'EXECUTE') then
    raise exception 'cms_user sem EXECUTE na fachada de configuração RD';
  end if;
  if has_schema_privilege('cms_user', 'commercial', 'USAGE') then
    raise exception 'cms_user não deve ter USAGE em commercial';
  end if;
  for objeto in select p.oid, p.proname from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'commercial'
  loop
    if has_function_privilege('cms_user', objeto.oid, 'EXECUTE') then
      raise exception 'cms_user tem EXECUTE inesperado em commercial.%', objeto.proname;
    end if;
  end loop;
  for objeto in select c.oid, c.relname, c.relkind from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'commercial' and c.relkind in ('r','v','m','p','f','S')
  loop
    if objeto.relkind = 'S' then
      if has_sequence_privilege('cms_user', objeto.oid, 'USAGE,SELECT,UPDATE') then
        raise exception 'cms_user tem acesso inesperado à sequence commercial.%', objeto.relname;
      end if;
    elsif has_table_privilege('cms_user', objeto.oid, 'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER')
       or has_any_column_privilege('cms_user', objeto.oid, 'SELECT,INSERT,UPDATE,REFERENCES') then
      raise exception 'cms_user tem acesso inesperado à relação commercial.%', objeto.relname;
    end if;
  end loop;
end $$;
commit;
