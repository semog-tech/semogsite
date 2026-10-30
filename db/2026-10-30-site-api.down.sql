-- Inverso de `2026-10-30-site-api.sql`. Rode como `postgres`, numa transação.
--
-- ANTES: tirar `site_api` da lista de schemas expostos da Data API, e voltar o
-- site para a conexão direta. Schema exposto que não existe é o que derruba o
-- cache de schema do PostgREST para todo o projeto. A lista está no
-- `pgrst.db_schemas` do papel `authenticator`; a de antes desta migração
-- (medida em 30/10/2026) era:
--
--   alter role authenticator set pgrst.db_schemas =
--     'public,graphql_public,core,erp_cache,app_config,condo_management,task,authz,form,templates,notifications,financeiro,commercial,cobranca';
--   notify pgrst, 'reload config';
--   notify pgrst, 'reload schema';
--
-- E desligar, no Supabase (Authentication → Third-Party Auth), o provedor OIDC
-- do Vercel KMS, ou trocar o `role` da política dele: com o papel apagado, um
-- token com `role = site_api_runtime` daria erro em vez de acesso, mas o
-- provedor não tem mais motivo para existir.
--
-- DEPOIS: `2026-10-30-site-api-0-cms-user.down.sql`, como `cms_user`.
--
-- Medido no ensaio local (PostgREST + Postgres 17): com `site_api` na lista
-- exposta e o schema ausente, o PostgREST falha ao carregar o cache de schema
-- (erro 3F000, schema site_api does not exist) e só volta quando o schema
-- reaparece ou sai da lista.
--
-- Cada função é derrubada pela assinatura e o schema sai com `restrict` (o
-- padrão): se alguém tiver posto outra coisa em `site_api` depois, este
-- arquivo para com erro em vez de apagar o que não criou.

do $$ begin
  if current_user <> 'postgres' then
    raise exception 'Rode como postgres (conectado: %)', current_user;
  end if;
end $$;

drop function site_api.lead_inserir(text, jsonb, text, text, text, text);
drop function site_api.experience_inscrever(jsonb, text, text, text, text);
drop function site_api.lead_registrar_exact(bigint, bigint, text);
drop function site_api.proposta_candidatas_duplicidade(timestamptz);
drop function site_api.experience_lotacao();
drop function site_api.whatsapp_clique_inserir(text, text, text, text);
drop function site_api.qr_acesso_inserir(text, boolean, text, text);
drop function site_api.lead_para_desfecho(bigint);
drop function site_api.lead_registrar_desfecho(bigint, text, text, text);
drop function site_api.leads_pendentes_exact(timestamptz, integer);
drop function site_api.leads_pendentes_ads(timestamptz);
drop function site_api.whatsapp_pendentes_ads(timestamptz, text[]);
drop function site_api.leads_marcar_enviados_ads(bigint[]);
drop function site_api.whatsapp_marcar_enviados_ads(bigint[]);

drop schema site_api;

-- Sem schema e sem funções, o papel não tem mais privilégio nenhum; sobra a
-- associação ao `authenticator`, que precisa sair antes do `drop role`. O
-- `statement_timeout` do papel some junto com ele.
revoke site_api_runtime from authenticator;
drop role site_api_runtime;

notify pgrst, 'reload schema';
