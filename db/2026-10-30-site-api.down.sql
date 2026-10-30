-- Inverso de `2026-10-30-site-api.sql`. Rode como `postgres`, numa transação
-- só (`psql -1`).
--
-- ANTES: voltar o site para a conexão direta (ou para onde ele for) — depois
-- deste arquivo, toda chamada a `site_api` falha.
--
-- Este arquivo TIRA `site_api` da lista de schemas expostos da Data API sozinho,
-- antes de apagar qualquer coisa. Não depende de ninguém lembrar: schema
-- exposto que não existe derruba o cache de schema do PostgREST, e com ele a
-- Data API do projeto inteiro, semogapp incluído. A lista está no
-- `pgrst.db_schemas` do papel `authenticator`. O valor novo é montado a partir
-- do atual, tirando só o item `site_api` e mantendo os outros na ordem; se o
-- ajuste não existir, ou se o resultado sair diferente do esperado, o arquivo
-- aborta antes do primeiro `drop`. Se `site_api` já tiver saído da lista (pelo
-- painel: Settings → Data API → Exposed schemas), ele só avisa e segue.
--
-- Por que os dois `notify` vêm ANTES dos `drop`: numa transação o NOTIFY só é
-- entregue no commit, junto com tudo o mais, e repetições idênticas são
-- descartadas mantendo a PRIMEIRA posição. O Supabase tem um gatilho de DDL que
-- manda `reload schema` a cada `drop`; com os nossos antes, o PostgREST recebe
-- `reload config` primeiro e recarrega o cache já com a lista nova. Com a ordem
-- invertida, o `reload schema` chegaria antes e recarregaria com a lista velha,
-- que ainda aponta para o schema apagado.
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

-- Tira `site_api` de `pgrst.db_schemas`. Por elemento, não por `replace` de
-- texto: `replace(',site_api', '')` também comeria um `,site_api_x` futuro.
do $$
declare
  v_atual text;
  v_itens text[];
  v_resto text[];
  v_novo text;
begin
  select substr(c, length('pgrst.db_schemas=') + 1) into v_atual
    from pg_roles r, unnest(r.rolconfig) c
   where r.rolname = 'authenticator' and c like 'pgrst.db_schemas=%';
  if v_atual is null then
    raise exception 'authenticator sem pgrst.db_schemas: a lista exposta não está onde este arquivo espera. Confira em Settings → Data API antes de apagar o schema.';
  end if;

  select array_agg(btrim(i)) into v_itens from unnest(string_to_array(v_atual, ',')) i;
  select coalesce(array_agg(i order by o), '{}') into v_resto
    from unnest(v_itens) with ordinality as t(i, o)
   where i <> 'site_api';

  if cardinality(v_resto) = cardinality(v_itens) then
    raise notice 'site_api já não está em pgrst.db_schemas (%); segue sem alterar', v_atual;
    return;
  end if;

  v_novo := array_to_string(v_resto, ',');
  if cardinality(v_resto) = 0 or not ('public' = any(v_resto))
     or cardinality(v_itens) - cardinality(v_resto) <> 1 then
    raise exception 'pgrst.db_schemas inesperado (atual: %, ficaria: %). Nada foi alterado.', v_atual, v_novo;
  end if;

  execute format('alter role authenticator set pgrst.db_schemas = %L', v_novo);

  if (select substr(c, length('pgrst.db_schemas=') + 1)
        from pg_roles r, unnest(r.rolconfig) c
       where r.rolname = 'authenticator' and c like 'pgrst.db_schemas=%') is distinct from v_novo then
    raise exception 'pgrst.db_schemas não ficou como esperado (%)', v_novo;
  end if;
  raise notice 'pgrst.db_schemas: % -> %', v_atual, v_novo;
end $$;

notify pgrst, 'reload config';
notify pgrst, 'reload schema';

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
