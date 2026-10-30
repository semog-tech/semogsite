-- Pré-requisito de `2026-10-30-site-api.sql`: o `postgres` passa a poder
-- gravar nas duas tabelas do `cms_user` que o site escreve.
--
-- ============================================================================
-- COMO RODAR — conectado como `cms_user` (a `DATABASE_URI` de hoje), ANTES do
-- arquivo principal. Não roda pelo MCP nem pelo SQL Editor: os dois conectam
-- como `postgres`, que não pode conceder o que não é dele.
-- ============================================================================
--
-- Por que existe (medido em 30/10/2026, só leitura):
--
--   tabela               dono       postgres SELECT  INSERT  UPDATE
--   cms.leads            cms_user   sim (*)          não     não
--   cms.qr_scans         cms_user   sim (*)          não     não
--   cms.whatsapp_clicks  postgres   sim              sim     sim
--
--   (*) só por `pg_read_all_data`, papel de que o `postgres` é membro — não há
--       grant na tabela (`relacl` vazio).
--
-- As funções de `site_api` são `SECURITY DEFINER` com dono `postgres`, então
-- rodam com os privilégios dele. Sem este arquivo, a primeira inscrição pela
-- Data API daria `permission denied for table leads` (42501).
--
-- O caminho óbvio, trocar o dono da tabela, não existe: o `postgres` não é
-- membro de `cms_user` (`pg_has_role(...,'MEMBER')` = false, e ninguém tem
-- ADMIN sobre `cms_user`), e o `cms_user` não é membro de `postgres`. Resta o
-- dono conceder.
--
-- O UPDATE é por coluna, só nas que o site altera hoje — o `postgres` não
-- ganha licença para reescrever `form`, `data` ou `created_at` por aqui. O
-- SELECT é explícito para o `returning id` e o `exact_attempts + 1` não
-- dependerem de `pg_read_all_data` continuar existindo.
--
-- Sequência: medido no ensaio local (Postgres 17), INSERT em coluna
-- `generated always as identity` NÃO exige USAGE na sequência — o grant de
-- tabela basta. Por isso não há grant de sequência aqui.
--
-- Inverso: `2026-10-30-site-api-0-cms-user.down.sql`, também como `cms_user`,
-- e só DEPOIS do `.down` do arquivo principal.

do $$ begin
  if current_user <> 'cms_user' then
    raise exception 'Rode como cms_user (conectado: %)', current_user;
  end if;
end $$;

grant select, insert on cms.leads to postgres;
grant update (
  exact_lead_id, exact_error, exact_attempts,
  desfecho, desfecho_motivo, desfecho_observacao, desfecho_em,
  uploaded_to_ads
) on cms.leads to postgres;

grant insert on cms.qr_scans to postgres;
