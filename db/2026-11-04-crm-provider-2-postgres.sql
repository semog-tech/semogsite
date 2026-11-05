-- NÃO aplicado. Fachada de token do RD CRM para o site.
--
-- ============================================================================
-- PARTE 2 de 2 — conectado como `postgres` (MCP ou SQL Editor). `cms_user` não
-- tem USAGE em `commercial` e não pode ser dono da fachada. Pré-requisitos:
--   1. a migração do semogapp que cria `commercial.crm_rdstation_token_obter()`
--      (sem ela o `create function` falha: o corpo SQL é validado na criação);
--   2. `2026-11-04-crm-provider-1-cms-user.sql` e `2026-11-04-rd-marketing.sql`,
--      ambas como `cms_user`. Ordem completa em docs/DEPLOY.md.
-- ============================================================================
--
-- Inverso: 2026-11-04-crm-provider-2-postgres.down.sql, também como `postgres`,
-- ANTES dos `.down` da parte `cms_user`.
begin;
do $$ begin
  if current_user <> 'postgres' then
    raise exception 'Rode como postgres (conectado: %)', current_user;
  end if;
end $$;

-- Fachada privada: o site não recebe USAGE em commercial nem EXECUTE direto.
-- Deve ser criada pelo postgres, após a função de leitura da frente semogapp.
create function cms.crm_rdstation_token_obter()
returns table(access_token text, expires_at timestamptz)
language sql stable security definer set search_path = ''
as $$ select access_token, expires_at from commercial.crm_rdstation_token_obter() $$;
alter function cms.crm_rdstation_token_obter() owner to postgres;
revoke all on function cms.crm_rdstation_token_obter() from public, anon, authenticated, service_role, cms_user;
grant execute on function cms.crm_rdstation_token_obter() to cms_user;
comment on function cms.crm_rdstation_token_obter() is
  'Somente access_token/expires_at do RD para o site; fachada sem USAGE commercial, nunca refresh_token.';

do $$
declare
  objeto record;
begin
  if not has_function_privilege('cms_user', 'cms.crm_rdstation_token_obter()', 'EXECUTE') then
    raise exception 'cms_user sem EXECUTE na fachada de token';
  end if;
  if has_schema_privilege('cms_user', 'commercial', 'USAGE') then
    raise exception 'cms_user não deve ter USAGE em commercial; investigar ACL existente';
  end if;
  for objeto in select p.oid, p.proname from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'commercial'
  loop
    if has_function_privilege('cms_user', objeto.oid, 'EXECUTE') then
      raise exception 'cms_user tem EXECUTE inesperado em commercial.%', objeto.proname;
    end if;
  end loop;
  -- Defesa adicional: nenhuma ACL direta/PUBLIC de dados deve alcançar o site.
  -- Inclui crm_oauth_tokens/leads_cache e qualquer relação/sequência futura.
  for objeto in
    select c.oid, c.relname, c.relkind from pg_class c
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
