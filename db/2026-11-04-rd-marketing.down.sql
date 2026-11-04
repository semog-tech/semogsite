-- NÃO APLICADO. Voltar o código antes de executar: ele usa estas colunas no INSERT.
-- Remove apenas estado Marketing; preserva as colunas e integrações CRM/Exact.
begin;
drop index if exists cms.leads_rd_marketing_fila_idx;
alter table cms.leads
  drop column rd_marketing_payload,
  drop column rd_marketing_status,
  drop column rd_marketing_attempts,
  drop column rd_marketing_proxima_tentativa_em,
  drop column rd_marketing_event_uuid,
  drop column rd_marketing_error,
  drop column rd_marketing_enviado_em;
commit;
