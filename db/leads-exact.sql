-- Colunas de controle do push pro Exact Spotter (CRM).
--
-- `exact_lead_id` preenchido = lead criado no CRM, e é a chave pra cruzar com
-- o `leads_cache` do app (`semogapp`, coluna `exact_lead_id` lá também).
-- `exact_error` guarda o último erro no banco, não só no log da Vercel — sem
-- isso, descobrir por que um lead não entrou no CRM exigiria caçar log.
-- `exact_attempts` limita o retry do cron.

alter table cms.leads
  add column if not exists exact_lead_id  bigint,
  add column if not exists exact_error    text,
  add column if not exists exact_attempts smallint not null default 0;

-- Índice parcial pro SELECT do cron (pendentes recentes). A tabela é pequena
-- hoje, mas o predicado é exatamente o da query e sai de graça.
create index if not exists leads_exact_pendentes_idx
  on cms.leads (created_at)
  where exact_lead_id is null;
