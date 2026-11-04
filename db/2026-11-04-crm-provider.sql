-- NÃO aplicado. Executar após a migração do semogapp que cria a função de token.
-- CRM ainda usa pool pg / cms_user (db.ts); SITE_API_ATIVO só migrou WhatsApp/QR.
-- Por isso não se expõe token nem funções novas em site_api/PostgREST.
-- Inverso: 2026-11-04-crm-provider.down.sql.
begin;
alter table cms.leads
  add column crm_provider text check (crm_provider in ('exact', 'rdstation')),
  add column crm_deal_id text,
  add column crm_contact_id text,
  add column crm_error text,
  add column crm_status text not null default 'pendente'
    check (crm_status in ('pendente', 'enviando', 'enviado', 'erro', 'incerto', 'duplicado', 'esgotado')),
  add column crm_attempts smallint not null default 0 check (crm_attempts >= 0),
  add column crm_enviado_em timestamptz,
  add column crm_travado_ate timestamptz,
  add column crm_post_iniciado_em timestamptz,
  add column crm_reconciliar_em timestamptz,
  add column crm_proxima_tentativa_em timestamptz not null default now();

-- Tentativas antigas pertencem ao Exact, mesmo quando falharam: a virada não
-- reaproveita automaticamente a fila de outro provedor. exact_* não é alterado.
update cms.leads
set crm_provider = 'exact', crm_deal_id = exact_lead_id::text,
    crm_error = exact_error, crm_attempts = exact_attempts,
    crm_status = case when exact_lead_id is not null then 'enviado' else 'erro' end
where exact_attempts > 0 or exact_lead_id is not null;

comment on column cms.leads.crm_provider is
  'Provedor fixado na primeira tentativa; NULL ainda não foi atribuído. Nunca reenviar a outro CRM automaticamente.';
comment on column cms.leads.crm_post_iniciado_em is
  'Gravado ANTES de POST /deals. Sem confirmação, consultar @id_lead_site; após 30 min sem resultado, recriar e alertar Sentry (decisão do coordenador).';
comment on column cms.leads.crm_reconciliar_em is
  'Após recriação por incerteza, agenda busca de duplicados em 30 min mesmo com crm_deal_id preenchido.';
comment on column cms.leads.crm_travado_ate is
  'Lease atômico de 5 min; evita corrida entre action/cron sem prender conexão durante HTTP.';

create index leads_crm_pendentes_idx on cms.leads (crm_proxima_tentativa_em)
  where crm_deal_id is null and exact_lead_id is null;

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
