-- NÃO aplicado. Executar após a migração do semogapp que cria a função de token.
-- CRM ainda usa pool pg / cms_user (db.ts); SITE_API_ATIVO só migrou WhatsApp/QR.
-- Por isso não se expõe token nem funções novas em site_api/PostgREST.
--
-- ============================================================================
-- PARTE 1 de 2 — conectado como `cms_user` (dono de `cms.leads`). Não roda pelo
-- MCP nem pelo SQL Editor: os dois conectam como `postgres`, que não é dono da
-- tabela nem membro de `cms_user`. A parte 2 (fachada de token, dono `postgres`)
-- é `2026-11-04-crm-provider-2-postgres.sql`, depois desta e de
-- `2026-11-04-rd-marketing.sql`. Ordem completa em docs/DEPLOY.md.
-- ============================================================================
--
-- Inverso: 2026-11-04-crm-provider-1-cms-user.down.sql, também como `cms_user`,
-- só DEPOIS do `.down` da parte 2.
begin;
do $$ begin
  if current_user <> 'cms_user' then
    raise exception 'Rode como cms_user (conectado: %)', current_user;
  end if;
end $$;

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
commit;
