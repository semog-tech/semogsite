-- Conversões de qualidade do RD CRM para o Google Ads ("RD - Proposta enviada"
-- e "RD - Ganho"), subidas pelo cron `upload-ads-conversions`. Decisão do
-- Leandro em 25/11/2026; regra dos marcos e ids das etapas na função do
-- semogapp `commercial.crm_rdstation_marcos_obter()`.
--
-- Conectado como `postgres` (MCP, SQL Editor ou `pnpm db:aplicar` do
-- semogapp). Pré-requisito: a migração do semogapp
-- `db/2026-11-25-crm-rdstation-marcos.sql` (sem ela o `create function` falha:
-- o corpo SQL é validado na criação). Não toca `cms.leads`, que é de
-- `cms_user`; por isso o registro de envio é uma tabela própria, de dono
-- `postgres`, como `cms.whatsapp_clicks`.
--
-- Inverso: 2026-11-25-ads-conversoes-rd-postgres.down.sql, também como
-- `postgres`. Escrito para rodar de novo sem estrago.
begin;
do $$ begin
  if current_user <> 'postgres' then
    raise exception 'Rode como postgres (conectado: %)', current_user;
  end if;
end $$;

-- Uma linha por lead e marco enviado ao Google (resposta OK do lote). A API
-- processa cada evento depois, e um descarte nessa fase (clique fora da
-- janela) não volta: a linha continua dizendo "enviado". A chave primária é a
-- deduplicação: cada lead sobe cada marco uma vez. Sem FK para `cms.leads`
-- (o `postgres` não tem REFERENCES nela); a linha guarda só o id e datas, e
-- um lead apagado por LGPD deixa aqui um id sem dado pessoal.
create table if not exists cms.ads_conversoes_rd (
  lead_id    bigint      not null,
  marco      text        not null check (marco in ('proposta_enviada', 'ganho')),
  marco_em   timestamptz not null,
  enviado_em timestamptz not null default now(),
  primary key (lead_id, marco)
);
alter table cms.ads_conversoes_rd owner to postgres;
-- O default ACL do schema concede tudo a cms_user e arwd a authenticated e
-- service_role: tira tudo e devolve só o que o cron usa.
revoke all on table cms.ads_conversoes_rd from public, anon, authenticated, service_role, cms_user;
grant select, insert on table cms.ads_conversoes_rd to cms_user;
comment on table cms.ads_conversoes_rd is
  'Marcos do RD CRM já enviados ao Google Ads (cron upload-ads-conversions); o Google processa cada evento depois e pode descartá-lo sem avisar. Sem dado pessoal.';

-- Fachada privada: o site não recebe USAGE em commercial nem EXECUTE direto.
create or replace function cms.crm_rdstation_marcos_obter()
returns table(lead_id bigint, proposta_enviada_em timestamptz, ganho_em timestamptz)
language sql stable security definer set search_path = ''
as $$ select lead_id, proposta_enviada_em, ganho_em from commercial.crm_rdstation_marcos_obter() $$;
alter function cms.crm_rdstation_marcos_obter() owner to postgres;
revoke all on function cms.crm_rdstation_marcos_obter() from public, anon, authenticated, service_role, cms_user;
grant execute on function cms.crm_rdstation_marcos_obter() to cms_user;
comment on function cms.crm_rdstation_marcos_obter() is
  'Por lead RD do site: primeira data de proposta enviada e de ganho no RD CRM. Sem dado pessoal; fachada sem USAGE commercial.';

do $$
declare
  objeto record;
begin
  if not has_function_privilege('cms_user', 'cms.crm_rdstation_marcos_obter()', 'EXECUTE') then
    raise exception 'cms_user sem EXECUTE na fachada de marcos';
  end if;
  if not has_table_privilege('cms_user', 'cms.ads_conversoes_rd', 'SELECT,INSERT') then
    raise exception 'cms_user sem SELECT/INSERT em cms.ads_conversoes_rd';
  end if;
  if has_table_privilege('anon', 'cms.ads_conversoes_rd', 'SELECT,INSERT,UPDATE,DELETE')
     or has_table_privilege('authenticated', 'cms.ads_conversoes_rd', 'SELECT,INSERT,UPDATE,DELETE')
     or has_table_privilege('service_role', 'cms.ads_conversoes_rd', 'SELECT,INSERT,UPDATE,DELETE') then
    raise exception 'cms.ads_conversoes_rd acessível a anon/authenticated/service_role';
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
