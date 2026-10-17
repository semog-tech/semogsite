-- Formulário de proposta em duas etapas (site v2, fase 2; spec 4.2 e 4.3).
--
-- Uma linha por lead: a etapa 1 grava (`etapa = 1`, `envio_em` nulo) e devolve
-- `token_envio` num cookie HttpOnly; a etapa 2 atualiza a MESMA linha pelo
-- token e a reivindica (`envio_em = now()`). Quem reivindica envia Exact,
-- e-mail interno e Ads uma vez (`src/lib/leads/posGravacao.ts`).
--
-- `envio_em` tem `default now()` DE PROPÓSITO: toda linha que já existe ganha a
-- hora deste ALTER e toda linha gravada pelo formulário antigo (que não cita a
-- coluna) nasce "já processada" — o formulário antigo envia na hora, dentro da
-- action. Só a etapa 1 nova grava `envio_em` nulo, explicitamente, e é ela que
-- o cron reivindica depois de 45 min sem a etapa 2.
--
-- `exact_tentativa_em` é a trava do reenvio ao Exact entre duas execuções do
-- cron (o Exact não deduplica: `duplicityValidation: false`).
--
-- `etapa` NULL = formulário antigo e assunto "proposta comercial" do contato:
-- não tem segunda etapa e vale como completo (spec 4.3).
--
-- A tabela pertence ao `cms_user` (ver `db/leads-desfecho.sql`), então este
-- ALTER roda pela própria `DATABASE_URI`, pelo script
-- `scripts/migracao-leads-duas-etapas.ts aplicar --confirmo`, nunca pelo SQL
-- Editor do Studio (que conecta como `postgres`).

alter table cms.leads
  add column if not exists etapa smallint
    constraint leads_etapa_check check (etapa in (1, 2)),
  add column if not exists token_envio uuid
    constraint leads_token_envio_key unique,
  add column if not exists envio_em timestamptz default now(),
  add column if not exists exact_tentativa_em timestamptz;

-- Índice parcial do critério do cron (etapa 1 ainda não reivindicada).
create index if not exists leads_etapa1_pendentes_idx
  on cms.leads (created_at)
  where envio_em is null and etapa = 1;
