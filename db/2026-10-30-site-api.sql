-- Schema `site_api` — a porta do site para o banco pela Data API (PostgREST),
-- no lugar da conexão Postgres direta pelo proxy 7432 do droplet.
--
-- Por que trocar: a conexão direta depende do proxy na VPS e da allowlist de
-- IP (Network Restrictions), e a Vercel não tem IP fixo. A Data API não passa
-- pelas Network Restrictions (supabase.com/docs/guides/platform/network-restrictions).
--
-- Desenho:
--   * `site_api` contém SÓ funções. Nenhuma tabela, nenhuma view. `cms`
--     continua fora da lista de schemas expostos.
--   * Uma função por operação que o site faz hoje, com a MESMA semântica do
--     SQL que ela substitui (filtros, ordenação, colunas). Cada uma diz qual.
--   * `SECURITY DEFINER`, dono `postgres`, `search_path = ''` e todo nome
--     qualificado — o padrão de `cms.experience_lotacao`.
--   * `USAGE` no schema e `EXECUTE` nas funções SÓ para `site_api_runtime`, um
--     papel próprio, criado aqui. O site chama do servidor com um JWT curto
--     assinado pelo Vercel KMS (Supabase Third-Party Auth → Custom OIDC), cujo
--     claim `role` é fixado em `site_api_runtime` na política do emissor.
--     NÃO é o `service_role`: ele ignora RLS e alcança quase o banco inteiro;
--     este papel só alcança as 14 funções abaixo.
--
-- ============================================================================
-- O PAPEL `site_api_runtime`
-- ============================================================================
--   * `nologin`: ninguém conecta como ele; o PostgREST entra como
--     `authenticator` e troca para ele (`set local role`) a cada requisição.
--     Para isso o `authenticator` precisa ser membro — `grant ... with inherit
--     false`, igual a `anon`/`authenticated`/`service_role` (medido em
--     30/10/2026: os três com inherit=false, set=true). Com inherit false o
--     `authenticator` não ganha os privilégios do papel; só pode assumi-lo.
--   * `noinherit`: o papel não herda de nada que um dia lhe concedam.
--   * `statement_timeout = 8s`: o PostgREST aplica o setting do papel
--     personificado. Medido em 30/10/2026: `authenticated` = 8s, `anon` = 3s,
--     `authenticator` = 8s (com `lock_timeout` = 8s). 8s, e não os 3s do
--     `anon`, porque a inscrição do Experience espera até 5s pela trava
--     (`lock_timeout` abaixo) e ainda precisa contar e gravar depois: com 3s o
--     `statement_timeout` venceria antes do `lock_timeout` e a decisão de
--     17/09/2026 (esperar 5s) viraria 3s calada. 8s dá a folga de 3s sobre a
--     espera máxima, e é o mesmo teto que o semogapp já vive.
--
-- ============================================================================
-- COMO RODAR
-- ============================================================================
--   1. `2026-10-30-site-api-0-cms-user.sql`, conectado como `cms_user`.
--   2. Este arquivo, como `postgres`, numa transação só (`psql -1`, ou
--      envolvido em begin/commit). Ele não tem `begin;`/`commit;` próprios, como
--      os outros de `db/`, justamente para poder ser ensaiado dentro de uma
--      transação com rollback sem se aplicar sozinho.
--   3. SÓ DEPOIS, acrescentar `site_api` à lista de schemas expostos. Medido no
--      ensaio local: com um schema exposto que não existe, o PostgREST falha ao
--      carregar o cache de schema (3F000) — em produção, a Data API do projeto
--      inteiro, semogapp incluído.
--
-- ============================================================================
-- GRANTS — o que foi medido e por que cada revoke está aqui
-- ============================================================================
-- `pg_default_acl` em 30/10/2026:
--
--   global (sem schema), funções criadas por `postgres`:
--       {postgres=X, authenticated=X, service_role=X}
--
-- Isto é: toda função que o `postgres` cria, em QUALQUER schema, nasce
-- executável por `authenticated`. O `anon` e o `PUBLIC` não aparecem (a entrada
-- global substitui o default de fábrica, que daria EXECUTE a `PUBLIC`).
--
-- `alter default privileges in schema site_api revoke ...` NÃO resolve: a doc
-- do Postgres (sql-alterdefaultprivileges) diz que o default por schema só
-- SOMA ao global — "you cannot revoke privileges per-schema if they are
-- granted globally". Mudar o global mexeria em todos os schemas do projeto, e
-- está fora do escopo. Por isso este arquivo não tem `alter default
-- privileges`, e a proteção são três camadas:
--   1. `revoke` explícito, pelo nome, de `public`, `anon`, `authenticated` e
--      `service_role` em todas as funções do schema (os dois últimos recebem
--      EXECUTE pelo default global; `anon`/`public` é defensivo: se alguém um
--      dia acrescentar o default, o revoke continua segurando);
--   2. `USAGE` no schema só para `site_api_runtime` — sem USAGE, um EXECUTE
--      que escape numa função futura continua inalcançável;
--   3. a autoconferência no fim, que aborta a migração se qualquer uma das
--      duas não valer no catálogo.
-- Função nova neste schema PRECISA repetir o revoke: ela nasce com
-- `authenticated=X` e `service_role=X`.
--
-- Inverso: `2026-10-30-site-api.down.sql` (tirar `site_api` dos schemas
-- expostos ANTES de rodá-lo). Ele também tira o papel do `authenticator` e o
-- apaga.

do $$ begin
  if current_user <> 'postgres' then
    raise exception 'Rode como postgres (conectado: %)', current_user;
  end if;
  -- Sem o pré-requisito, as funções nasceriam e falhariam no primeiro uso.
  if not has_table_privilege('postgres', 'cms.leads', 'INSERT')
     or not has_column_privilege('postgres', 'cms.leads', 'desfecho', 'UPDATE')
     or not has_table_privilege('postgres', 'cms.qr_scans', 'INSERT') then
    raise exception 'Rode antes 2026-10-30-site-api-0-cms-user.sql (como cms_user)';
  end if;
end $$;

create role site_api_runtime nologin noinherit;
comment on role site_api_runtime is
  'Papel do site (semogsite) na Data API: só USAGE em site_api e EXECUTE nas funções dele. Ver db/2026-10-30-site-api.sql no semogsite.';
grant site_api_runtime to authenticator with inherit false;
alter role site_api_runtime set statement_timeout = '8s';

create schema site_api;
comment on schema site_api is
  'Porta do site (semogsite) pela Data API: só funções SECURITY DEFINER, executáveis só por site_api_runtime. Ver db/2026-10-30-site-api.sql no semogsite.';

-- ----------------------------------------------------------------------------
-- Formulários (src/app/(frontend)/_actions/submit-form.ts)
-- ----------------------------------------------------------------------------

-- Substitui `gravarLeadSemLimite`:
--   insert into cms.leads (form, data, gclid, email, ads_consent, notificado_para)
--   values ($1..$6) returning id
-- Recusa `experience`: a inscrição tem teto de vagas e só entra por
-- `experience_inscrever`, que serializa e conta. Hoje quem garante isso é o
-- `gravarLead` do app; aqui o banco garante também, para a porta nova não ser
-- um jeito de furar a lotação.
create function site_api.lead_inserir(
  p_form text,
  p_data jsonb,
  p_gclid text,
  p_email text,
  p_ads_consent text,
  p_notificado_para text
) returns bigint
language plpgsql volatile security definer
set search_path = ''
as $fn$
declare
  v_id bigint;
begin
  if p_form = 'experience' then
    raise exception 'Inscrição do Experience entra por site_api.experience_inscrever'
      using errcode = '22023';
  end if;
  insert into cms.leads as l (form, data, gclid, email, ads_consent, notificado_para)
  values (p_form, p_data, p_gclid, p_email, p_ads_consent, p_notificado_para)
  returning l.id into v_id;
  return v_id;
end;
$fn$;

-- Substitui `gravarInscricaoDoExperience` inteira — a transação que hoje o app
-- monta em cinco idas ao banco:
--   begin
--   set local idle_in_transaction_session_timeout = '60s'
--   set local lock_timeout = '5s'
--   select pg_advisory_xact_lock(26092026)
--   select * from cms.experience_lotacao($1::jsonb)
--   (pessoas > capacidade → rollback, `lotado`)
--   insert into cms.leads (...) values ('experience', ...) returning id
--   commit
--
-- **A ordem é o contrato, e ela só funciona porque esta função é VOLATILE.**
-- O comentário de `gravarInscricaoDoExperience` registra o que foi medido: a
-- contagem tem de ser lida DEPOIS do lock, senão N envios simultâneos leem o
-- mesmo total e gravam todos (10 de 10 passaram do teto, até com o lock numa
-- CTE do mesmo comando). Pela doc (xfunc-volatility), uma função VOLATILE tira
-- um snapshot novo a cada comando que executa; a STABLE `experience_lotacao`
-- usa o snapshot do comando que a chama — que, aqui, é o `select` abaixo,
-- iniciado já com o lock na mão. Se esta função fosse STABLE, a contagem seria
-- a do início da chamada RPC, anterior ao lock, e o teto voltaria a furar.
-- Não marque STABLE "porque só tem um insert".
--
-- `lock_timeout` vem ANTES do lock pelo mesmo motivo do app (depois, não
-- limita a espera que existe para limitar). `set local` vale até o fim da
-- transação, que na Data API é o fim da requisição. Os 5s são a decisão de
-- 17/09/2026 registrada em `submit-form.ts`; estourando, a requisição falha
-- com 55P03 e o app responde o erro genérico, nunca um falso sucesso.
--
-- `idle_in_transaction_session_timeout` NÃO é reproduzido, de propósito. No
-- app ele existe porque a transação é montada pelo cliente em cinco idas ao
-- banco: se a função da Vercel morre entre duas delas, a sessão fica `idle in
-- transaction` com a trava na mão. Aqui a transação inteira é uma requisição
-- do PostgREST, que abre, chama a função e fecha sem devolver o controle a
-- ninguém no meio — não existe intervalo ocioso para o limite medir. Se o
-- cliente HTTP cair, a função termina (ou estoura o `statement_timeout` de 8s
-- do papel) e a trava `xact` sai no fim da transação. E um `set local` dele
-- aqui dentro só valeria para esta mesma transação, que nunca fica ociosa.
--
-- A chave 26092026 é a mesma do app: durante a troca, uma inscrição pela
-- conexão direta e outra pela Data API serializam uma com a outra.
--
-- A validação dos totais repete `validarLotacaoExperience`
-- (src/lib/experienceLotacao.ts): total incoerente, ou `evento_id` ausente, é
-- erro, não vaga. `select ... into strict` falha se a projeção não devolver
-- exatamente uma linha, como o `rows[0]` indefinido falha no app.
--
-- Devolve uma linha: ('inserido', id) ou ('lotado', null). A coluna se chama
-- `lead_id`, não `id`, porque em PL/pgSQL a coluna de saída vira variável e
-- colidiria com `cms.leads.id`.
--
-- Chamar com POST (padrão do `rpc()` do supabase-js). Por GET o PostgREST abre
-- a transação como somente leitura e o insert falha.
create function site_api.experience_inscrever(
  p_data jsonb,
  p_gclid text,
  p_email text,
  p_ads_consent text,
  p_notificado_para text
) returns table (resultado text, lead_id bigint)
language plpgsql volatile security definer
set search_path = ''
as $fn$
declare
  v_evento_id uuid;
  v_capacidade int;
  v_inscritos int;
  v_acompanhantes int;
  v_pessoas int;
  v_id bigint;
begin
  set local lock_timeout = '5s';
  perform pg_catalog.pg_advisory_xact_lock(26092026::bigint);

  -- A projeção já inclui o candidato: um reenvio não consome outra vaga.
  select x.evento_id, x.capacidade, x.inscritos, x.acompanhantes, x.pessoas
    into strict v_evento_id, v_capacidade, v_inscritos, v_acompanhantes, v_pessoas
    from cms.experience_lotacao(p_data) x;

  if v_evento_id is null then
    raise exception 'Contrato da lotação inválido.';
  end if;

  if v_capacidade is null or v_inscritos is null or v_acompanhantes is null
     or v_pessoas is null or v_capacidade <= 0 or v_inscritos < 0
     or v_acompanhantes < 0 or v_pessoas <> v_inscritos + v_acompanhantes then
    raise exception 'Totais da lotação inválidos.';
  end if;

  if v_pessoas > v_capacidade then
    return query select 'lotado'::text, null::bigint;
    return;
  end if;

  insert into cms.leads as l (form, data, gclid, email, ads_consent, notificado_para)
  values ('experience', p_data, p_gclid, p_email, p_ads_consent, p_notificado_para)
  returning l.id into v_id;

  return query select 'inserido'::text, v_id;
end;
$fn$;

-- Substitui o UPDATE do retorno do Exact, que existe IGUAL em dois lugares
-- (`enviarAoExact` em submit-form.ts e o cron push-exact-leads):
--   update cms.leads
--      set exact_lead_id = $1, exact_error = $2, exact_attempts = exact_attempts + 1
--    where id = $3
-- Devolve quantas linhas mudou (0 ou 1); os dois chamadores de hoje ignoram.
create function site_api.lead_registrar_exact(
  p_id bigint,
  p_exact_lead_id bigint,
  p_exact_error text
) returns integer
language sql volatile security definer
set search_path = ''
as $fn$
  with alterada as (
    update cms.leads as l
       set exact_lead_id = p_exact_lead_id,
           exact_error = p_exact_error,
           exact_attempts = l.exact_attempts + 1
     where l.id = p_id
    returning 1
  )
  select count(*)::integer from alterada;
$fn$;

-- Substitui `propostaRecenteDoMesmoPedido` (src/lib/propostaDuplicada.ts):
--   select id, data->>'telefone' as telefone, data->>'cidade' as cidade,
--          data->>'nomeCondominio' as nome_condominio
--     from cms.leads
--    where form = 'proposta' and created_at > $1
--      and data->>'duplicaDe' is null
--    order by created_at desc
--    limit 200
-- `'duplicaDe'` é `DUPLICA_DE_FIELD` (src/lib/forms.ts) e 200 é
-- `TETO_DE_CANDIDATAS`: no app eram interpolados no texto; aqui ficam fixos, e
-- mudar um lá exige mudar aqui. A comparação de telefone e condomínio continua
-- no app, como hoje.
create function site_api.proposta_candidatas_duplicidade(p_corte timestamptz)
returns table (id bigint, telefone text, cidade text, nome_condominio text)
language sql stable security definer
set search_path = ''
as $fn$
  select l.id, l.data->>'telefone', l.data->>'cidade', l.data->>'nomeCondominio'
    from cms.leads l
   where l.form = 'proposta'
     and l.created_at > p_corte
     and l.data->>'duplicaDe' is null
   order by l.created_at desc
   limit 200;
$fn$;

-- Substitui `lerEstadoDaInscricao` (src/lib/experienceVagas.ts):
--   select * from cms.experience_lotacao()
-- Só leitura, para a página mostrar o estado; a trava real é
-- `experience_inscrever`.
create function site_api.experience_lotacao()
returns table (evento_id uuid, capacidade integer, inscritos integer, acompanhantes integer, pessoas integer)
language sql stable security definer
set search_path = ''
as $fn$
  select x.evento_id, x.capacidade, x.inscritos, x.acompanhantes, x.pessoas
    from cms.experience_lotacao() x;
$fn$;

-- ----------------------------------------------------------------------------
-- Medição (beacon do WhatsApp e QR code)
-- ----------------------------------------------------------------------------

-- Substitui src/app/api/track/whatsapp/route.ts:
--   insert into cms.whatsapp_clicks (gclid, page, section, ads_consent) values ($1..$4)
create function site_api.whatsapp_clique_inserir(
  p_gclid text,
  p_page text,
  p_section text,
  p_ads_consent text
) returns void
language sql volatile security definer
set search_path = ''
as $fn$
  insert into cms.whatsapp_clicks (gclid, page, section, ads_consent)
  values (p_gclid, p_page, p_section, p_ads_consent);
$fn$;

-- Substitui `registraAcesso` (src/app/qr/[slug]/route.ts):
--   insert into cms.qr_scans (slug, conhecido, destino, dispositivo) values ($1..$4)
create function site_api.qr_acesso_inserir(
  p_slug text,
  p_conhecido boolean,
  p_destino text,
  p_dispositivo text
) returns void
language sql volatile security definer
set search_path = ''
as $fn$
  insert into cms.qr_scans (slug, conhecido, destino, dispositivo)
  values (p_slug, p_conhecido, p_destino, p_dispositivo);
$fn$;

-- ----------------------------------------------------------------------------
-- Desfecho comercial (área interna, link assinado do e-mail)
-- ----------------------------------------------------------------------------

-- Substitui src/app/(interno)/desfecho/[id]/page.tsx:
--   select id, created_at, form, data, desfecho, desfecho_motivo,
--          desfecho_observacao, desfecho_em, notificado_para
--     from cms.leads where id = $1
-- O token HMAC continua conferido no app, antes da chamada. Esta função não o
-- confere: o JWT de `site_api_runtime` só é emitido no servidor do site (KMS,
-- ambiente de produção), o mesmo perímetro da `DATABASE_URI` de hoje, que lê
-- `cms.leads` inteira. Conferir o HMAC aqui exigiria o segredo no banco.
create function site_api.lead_para_desfecho(p_id bigint)
returns table (
  id bigint,
  created_at timestamptz,
  form text,
  data jsonb,
  desfecho text,
  desfecho_motivo text,
  desfecho_observacao text,
  desfecho_em timestamptz,
  notificado_para text
)
language sql stable security definer
set search_path = ''
as $fn$
  select l.id, l.created_at, l.form, l.data, l.desfecho, l.desfecho_motivo,
         l.desfecho_observacao, l.desfecho_em, l.notificado_para
    from cms.leads l
   where l.id = p_id;
$fn$;

-- Substitui src/app/(interno)/_actions/registrar-desfecho.ts:
--   update cms.leads
--      set desfecho = $1, desfecho_motivo = $2, desfecho_observacao = $3, desfecho_em = now()
--    where id = $4
-- Devolve as linhas alteradas: o app usa o 0 para dizer "este lead não existe
-- mais" (era o `rowCount`).
create function site_api.lead_registrar_desfecho(
  p_id bigint,
  p_desfecho text,
  p_motivo text,
  p_observacao text
) returns integer
language sql volatile security definer
set search_path = ''
as $fn$
  with alterada as (
    update cms.leads as l
       set desfecho = p_desfecho,
           desfecho_motivo = p_motivo,
           desfecho_observacao = p_observacao,
           desfecho_em = pg_catalog.now()
     where l.id = p_id
    returning 1
  )
  select count(*)::integer from alterada;
$fn$;

-- ----------------------------------------------------------------------------
-- Crons
-- ----------------------------------------------------------------------------

-- Substitui o SELECT de src/app/api/cron/push-exact-leads/route.ts:
--   select id, form, data from cms.leads
--    where exact_lead_id is null
--      and created_at > $1
--      and exact_attempts < $2
--      and (form = 'proposta' or (form = 'contato' and data->>'assunto' = 'proposta-comercial'))
--      and data->>'duplicaDe' is null
--    order by created_at asc
-- O UPDATE do mesmo cron é `lead_registrar_exact`.
create function site_api.leads_pendentes_exact(p_corte timestamptz, p_max_tentativas integer)
returns table (id bigint, form text, data jsonb)
language sql stable security definer
set search_path = ''
as $fn$
  select l.id, l.form, l.data
    from cms.leads l
   where l.exact_lead_id is null
     and l.created_at > p_corte
     and l.exact_attempts < p_max_tentativas
     and (l.form = 'proposta' or (l.form = 'contato' and l.data->>'assunto' = 'proposta-comercial'))
     and l.data->>'duplicaDe' is null
   order by l.created_at asc;
$fn$;

-- Substitui o 1º SELECT de src/app/api/cron/upload-ads-conversions/route.ts:
--   select id, created_at, gclid, ads_consent,
--          data->>'origem — Tipo do clique (Google Ads)' as tipo_de_clique
--     from cms.leads
--    where gclid is not null
--      and (form = 'proposta' or (form = 'contato' and data->>'assunto' = 'proposta-comercial'))
--      and created_at > $1 and uploaded_to_ads = false
--    order by created_at desc
-- A chave do jsonb é `TIPO_CLIQUE_FIELD` (src/lib/forms.ts), com travessão.
create function site_api.leads_pendentes_ads(p_corte timestamptz)
returns table (id bigint, created_at timestamptz, gclid text, ads_consent text, tipo_de_clique text)
language sql stable security definer
set search_path = ''
as $fn$
  select l.id, l.created_at, l.gclid, l.ads_consent,
         l.data->>'origem — Tipo do clique (Google Ads)'
    from cms.leads l
   where l.gclid is not null
     and (l.form = 'proposta' or (l.form = 'contato' and l.data->>'assunto' = 'proposta-comercial'))
     and l.created_at > p_corte
     and l.uploaded_to_ads = false
   order by l.created_at desc;
$fn$;

-- Substitui o 2º SELECT do mesmo cron:
--   select id, created_at, gclid, ads_consent from cms.whatsapp_clicks
--    where gclid is not null and created_at > $1 and uploaded_to_ads = false
--      and coalesce(section, '') <> all($2::text[])
--    order by created_at desc
-- `p_secoes_fora` é `SECOES_FORA_DO_ADS` (src/lib/triagem.ts), passado pelo
-- app como hoje. Mesma semântica de `<> all`: array vazio deixa tudo passar,
-- array nulo não deixa nada.
create function site_api.whatsapp_pendentes_ads(p_corte timestamptz, p_secoes_fora text[])
returns table (id bigint, created_at timestamptz, gclid text, ads_consent text)
language sql stable security definer
set search_path = ''
as $fn$
  select w.id, w.created_at, w.gclid, w.ads_consent
    from cms.whatsapp_clicks w
   where w.gclid is not null
     and w.created_at > p_corte
     and w.uploaded_to_ads = false
     and coalesce(w.section, '') <> all(p_secoes_fora)
   order by w.created_at desc;
$fn$;

-- Substituem o UPDATE do mesmo cron, que hoje monta o nome da tabela no texto
-- (`update ${table} set uploaded_to_ads = true where id = any($1::bigint[])`).
-- Duas funções em vez de uma com o nome da tabela por parâmetro: SQL dinâmico
-- numa função DEFINER é justamente o que não se quer aqui.
create function site_api.leads_marcar_enviados_ads(p_ids bigint[])
returns integer
language sql volatile security definer
set search_path = ''
as $fn$
  with alterada as (
    update cms.leads as l set uploaded_to_ads = true
     where l.id = any(p_ids)
    returning 1
  )
  select count(*)::integer from alterada;
$fn$;

create function site_api.whatsapp_marcar_enviados_ads(p_ids bigint[])
returns integer
language sql volatile security definer
set search_path = ''
as $fn$
  with alterada as (
    update cms.whatsapp_clicks as w set uploaded_to_ads = true
     where w.id = any(p_ids)
    returning 1
  )
  select count(*)::integer from alterada;
$fn$;

-- ----------------------------------------------------------------------------
-- Grants
-- ----------------------------------------------------------------------------

revoke all on schema site_api from public, anon, authenticated, service_role;
grant usage on schema site_api to site_api_runtime;

revoke all on all functions in schema site_api from public, anon, authenticated, service_role;
grant execute on all functions in schema site_api to site_api_runtime;

-- ----------------------------------------------------------------------------
-- Autoconferência: aborta se o catálogo não disser o que este arquivo promete.
-- ----------------------------------------------------------------------------
do $$
declare
  f record;
  r text;
  v_total int := 0;
  -- Quem NÃO pode alcançar o schema. `cms_user` entra porque é a credencial
  -- de hoje (pg-proxy), que vai ser revogada; `authenticator` porque, com
  -- inherit true, ele próprio executaria sem trocar de papel.
  v_barrados text[] := array['public', 'anon', 'authenticated', 'service_role',
                             'cms_user', 'authenticator'];
begin
  if not pg_has_role('authenticator', 'site_api_runtime', 'MEMBER') then
    raise exception 'authenticator não é membro de site_api_runtime';
  end if;
  if exists (select 1 from pg_auth_members m
              where m.roleid = 'site_api_runtime'::regrole
                and m.member = 'authenticator'::regrole
                and m.inherit_option) then
    raise exception 'authenticator herda site_api_runtime (esperado inherit false)';
  end if;

  foreach r in array v_barrados loop
    if has_schema_privilege(r, 'site_api', 'USAGE') then
      raise exception 'site_api: % tem USAGE', r;
    end if;
  end loop;
  if not has_schema_privilege('site_api_runtime', 'site_api', 'USAGE') then
    raise exception 'site_api: site_api_runtime sem USAGE';
  end if;

  for f in
    select p.oid, p.oid::regprocedure::text as nome, p.prosecdef, p.proconfig,
           pg_get_userbyid(p.proowner) as dono
      from pg_proc p
     where p.pronamespace = 'site_api'::regnamespace
  loop
    v_total := v_total + 1;
    foreach r in array v_barrados loop
      if has_function_privilege(r, f.oid, 'EXECUTE') then
        raise exception '%: % tem EXECUTE', f.nome, r;
      end if;
    end loop;
    if not has_function_privilege('site_api_runtime', f.oid, 'EXECUTE') then
      raise exception '%: site_api_runtime sem EXECUTE', f.nome;
    end if;
    if not f.prosecdef or f.dono <> 'postgres'
       or f.proconfig is distinct from array['search_path=""'] then
      raise exception '%: esperado SECURITY DEFINER, dono postgres, search_path vazio', f.nome;
    end if;
  end loop;

  if v_total <> 14 then
    raise exception 'site_api: esperadas 14 funções, há %', v_total;
  end if;

  if (select p.provolatile from pg_proc p
       where p.oid = 'site_api.experience_inscrever(jsonb,text,text,text,text)'::regprocedure) <> 'v' then
    raise exception 'experience_inscrever precisa ser VOLATILE (snapshot depois do lock)';
  end if;
end $$;

notify pgrst, 'reload schema';
