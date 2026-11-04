-- Inverso preparado antes da migração. Desligar RD e reconciliar envios antes.
-- Não apaga exact_*; rollback do código volta a ler o histórico intacto.
begin;
drop function if exists cms.crm_rdstation_token_obter();
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
