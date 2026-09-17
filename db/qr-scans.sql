-- Tabela `qr_scans` — contagem **server-side** dos acessos vindos de QR code
-- impresso. Primeira peça: o folder distribuído no Semog Experience de
-- 26/09/2026, cujo QR aponta para `https://www.semog.com.br/qr/folder`.
--
-- Por que a rota existe, e por que a contagem é aqui:
--
-- 1. **Papel é imutável.** Se o QR apontasse direto para a home, o destino
--    ficaria congelado na gráfica. Com endereço próprio, o destino muda depois
--    do evento (para uma página de agradecimento, para a próxima campanha) sem
--    reimprimir nada. Por isso a coluna `destino` guarda para onde AQUELE
--    acesso foi mandado: quando o mapa mudar, o histórico continua verdadeiro.
-- 2. **O GA4 não conta tudo.** O rastreador do navegador é comido por
--    bloqueador, modo econômico e pelo leitor de QR embutido em app (que abre
--    uma webview onde o gtag muitas vezes não roda). O servidor vê o acesso
--    antes de qualquer script — a mesma razão de `cms.whatsapp_clicks` existir.
--
-- **Nada de pessoal.** Sem IP, sem user-agent bruto, sem fingerprint: quem
-- escaneia um folder não consentiu com nada e não há o que perguntar a ele num
-- redirecionamento. `dispositivo` guarda só 'mobile' ou 'desktop', derivado do
-- user-agent e imediatamente descartado — é um sinal agregado de sanidade
-- ("o scan veio mesmo de celular?"), não um identificador.
--
-- **A contagem é de acessos à URL, não de pessoas nem de scans.** Quem escaneia
-- duas vezes conta duas; quem manda o link no WhatsApp faz o robô de preview
-- contar uma. Para um folder de evento isso é ruído aceitável — trocar por
-- deduplicação exigiria cookie ou fingerprint, que é justamente o que não
-- queremos aqui.
--
-- Fica no schema `cms` pelo mesmo motivo de `cms.leads` e
-- `cms.whatsapp_clicks`: o PostgREST do Supabase só expõe `public` à API
-- anônima, então `cms` é privado por construção, sem precisar de RLS. Só o
-- runtime (`pg` sobre `DATABASE_URI`) escreve, sempre qualificando
-- `cms.qr_scans`.
--
-- ============================================================================
-- COMO RODAR — leia antes, o dono importa
-- ============================================================================
--
-- **Rode conectado como `cms_user`** (o usuário da `DATABASE_URI`), e não pelo
-- SQL Editor do Supabase Studio, que conecta como `postgres`.
--
-- Medido em 17/09/2026 neste banco: `cms_user` tem CREATE e USAGE no schema
-- `cms`, então criando por ele a tabela e a sequência de identidade já nascem
-- dele — sem GRANT nenhum, exatamente como `cms.leads`.
--
-- Pelo Studio o resultado é outro, e já mordeu uma vez: `cms.whatsapp_clicks`
-- foi criada como `postgres` e precisou de DOIS grants (tabela e sequência)
-- para o runtime conseguir inserir. Pior, o conserto óbvio não funciona —
-- `postgres` NÃO é membro de `cms_user` neste projeto (verificado com
-- `pg_has_role`), então `alter table ... owner to cms_user` falha lá com
-- "must be member of role". Por isso não há ALTER OWNER neste arquivo: ou roda
-- como o dono certo, ou usa o plano B abaixo.
--
-- Plano B, SÓ se não houver como conectar como `cms_user` — rodando como
-- `postgres`, acrescentar depois do CREATE (é o que salvou `whatsapp_clicks`):
--
--   grant select, insert, update, delete on cms.qr_scans to cms_user;
--   grant usage, select on sequence cms.qr_scans_id_seq to cms_user;

create table if not exists cms.qr_scans (
  id          bigint generated always as identity primary key,
  created_at  timestamptz not null default now(),
  -- Qual peça impressa foi escaneada ('folder'). Coluna existe para o segundo
  -- QR: banner, crachá, camiseta — cada um com seu slug, todos na mesma
  -- tabela. Saneado na rota (minúsculas, `[a-z0-9-]`, 40 caracteres), então
  -- aqui não entra lixo de URL inventada.
  slug        text not null,
  -- Slug estava no mapa de peças (`PECAS_QR` em `src/lib/qr.ts`)? `false` é
  -- acesso a um slug que não existe — erro de impressão, link digitado errado
  -- ou varredura. Deriva do mapa VIGENTE na hora do acesso, por isso é gravado
  -- e não calculado depois.
  conhecido   boolean not null,
  -- Caminho para onde este acesso foi redirecionado, com as UTMs
  -- (`/?utm_source=qr&utm_medium=folder&utm_campaign=experience-26`). Slug
  -- desconhecido vai para a home SEM UTM — não se inventa atribuição para
  -- origem que não se conhece.
  destino     text not null,
  -- 'mobile' | 'desktop'. `text` sem enum/CHECK pelo mesmo motivo de
  -- `cms.leads.form`: valor novo não deve exigir migração.
  dispositivo text
);

create index if not exists qr_scans_created_at_idx on cms.qr_scans (created_at);
