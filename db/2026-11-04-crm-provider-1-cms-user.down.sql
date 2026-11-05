-- Inverso preparado antes da migração. Desligar RD e reconciliar envios antes.
-- Não apaga exact_*; rollback do código volta a ler o histórico intacto.
--
-- Inverso de `2026-11-04-crm-provider-1-cms-user.sql`. Rode como `cms_user`, e só
-- DEPOIS de `2026-11-04-crm-provider-2-postgres.down.sql` e de
-- `2026-11-04-rd-marketing.down.sql`. Ordem completa em docs/DEPLOY.md.
begin;
do $$ begin
  if current_user <> 'cms_user' then
    raise exception 'Rode como cms_user (conectado: %)', current_user;
  end if;
end $$;

drop index if exists cms.leads_crm_pendentes_idx;
alter table cms.leads
  drop column crm_provider,
  drop column crm_deal_id,
  drop column crm_contact_id,
  drop column crm_error,
  drop column crm_status,
  drop column crm_attempts,
  drop column crm_enviado_em,
  drop column crm_travado_ate,
  drop column crm_post_iniciado_em,
  drop column crm_reconciliar_em,
  drop column crm_proxima_tentativa_em;
commit;
