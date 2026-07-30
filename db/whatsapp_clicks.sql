-- Tabela `whatsapp_clicks` — registro **server-side** dos cliques no WhatsApp.
--
-- Por que existe: o WhatsApp é o canal de contato dominante do site (medido em
-- 29/07/2026 no GA4, janela 24-29/07 com tracking limpo: 14 `whatsapp_click`
-- contra 5 `generate_lead`; no tráfego pago, 7 contra 1). Mas o clique só
-- existia como evento GA4 no navegador — ou seja, sumia com ad-blocker e nunca
-- virava conversão no Google Ads. Resultado: a campanha aparentava 1 resultado
-- quando havia gerado ~8 contatos, e o Smart Bidding otimizaria por um sinal
-- raro. Aqui o clique é gravado pelo servidor (beacon → /api/track/whatsapp),
-- com o `gclid` lido do cookie de 1ª parte `semog-attrib` — mesma mecânica
-- à prova de ad-block já usada pelos leads de formulário.
--
-- Fica no schema `cms` pelo mesmo motivo de `cms.leads`: o PostgREST do
-- Supabase só expõe `public` à API anônima, então `cms` é privado por
-- construção, sem precisar de RLS. Só o runtime (`pg` sobre DATABASE_URI)
-- lê/escreve, sempre qualificando `cms.whatsapp_clicks`.
--
-- Não guarda nada de pessoal: o clique acontece ANTES da conversa, então não
-- há nome, telefone nem mensagem — só origem (gclid/página/seção) e horário.

create table if not exists cms.whatsapp_clicks (
  id              bigint generated always as identity primary key,
  created_at      timestamptz not null default now(),
  gclid           text,                   -- do cookie `semog-attrib`; null se não veio de anúncio
  page            text,                   -- pathname de onde clicou (ex.: /administradora-de-condominios-recife)
  section         text,                   -- botao_flutuante | cabecalho | rodape | conteudo
  uploaded_to_ads boolean not null default false
);

create index if not exists whatsapp_clicks_created_at_idx on cms.whatsapp_clicks (created_at);

-- Índice parcial pro SELECT do cron: só interessa o que tem gclid e ainda não
-- subiu. Mantém a varredura barata mesmo quando a tabela crescer com os
-- cliques orgânicos (que são a maioria e nunca viram conversão no Ads).
create index if not exists whatsapp_clicks_pendentes_idx
  on cms.whatsapp_clicks (created_at)
  where gclid is not null and uploaded_to_ads = false;
