# Conversões de qualidade do RD CRM no Google Ads

Decisão do Leandro em 25/11/2026: além do pedido de proposta, o Google Ads passa a receber
quais leads do site andaram no funil do RD CRM, para o Smart Bidding otimizar por quem vira
negócio. O cron `upload-ads-conversions` sobe duas ações novas para leads que vieram de anúncio
(com `gclid`, `gbraid` ou `wbraid`):

| Ação no Google Ads      | Variável de ambiente (id da ação)             | Quando o lead conta                                                                 |
| ----------------------- | --------------------------------------------- | ----------------------------------------------------------------------------------- |
| `RD - Proposta enviada` | `GOOGLE_ADS_RD_PROPOSTA_CONVERSION_ACTION_ID` | a negociação chegou a "Visita realizada" ou depois (Negociação, Vendidos), ou foi ganha |
| `RD - Ganho`            | `GOOGLE_ADS_RD_GANHO_CONVERSION_ACTION_ID`    | a negociação chegou a "Vendidos" ou foi ganha                                       |

Perdido não vira conversão, mas não desfaz um marco já alcançado. Negociação perdida numa
etapa a partir de "Visita realizada" conta como proposta enviada (decisão: a proposta existiu),
com a data da primeira observação naquela etapa. As etapas são do Funil Padrão, onde o site cria
as negociações. O ganho também conta como proposta enviada: uma negociação ganha sem ter
passado pelas etapas teve proposta.

As etapas são reconhecidas pelo id do RD, fixado na função do semogapp
`commercial.crm_rdstation_marcos_obter()` (`db/2026-11-25-crm-rdstation-marcos.sql`): Visita
realizada é `6abd62c1c2a30800240fb2b7` e Vendidos é `6ac7a5e6a3aab600243102d4`. Etapa nova
depois de Visita realizada conta sozinha, pela posição no funil. Mas se "Visita realizada" for
apagada e recriada no RD, o id muda e a proposta enviada para de contar **sem erro nenhum** (o
ganho continua, pelo status won). Nesse caso, troque o id na função por uma migração nova no
semogapp (`create or replace` com o id novo, conferido em `commercial.crm_stages`).

## De onde vem a data

A API do RD não informa quando uma negociação mudou de etapa. O semogapp recebe os webhooks do
RD e grava cada observação, com a data do evento, em `commercial.crm_deal_observations`. A
função `commercial.crm_rdstation_marcos_obter()` (semogapp,
`db/2026-11-25-crm-rdstation-marcos.sql`) devolve, por lead do site, a primeira data de cada
marco, sem dado pessoal. O site lê pela fachada `cms.crm_rdstation_marcos_obter()`, de dono
`postgres` e `EXECUTE` só para `cms_user`.

Negociação que já estava adiantada quando a captura começou (21/10/2026) tem como data a da
primeira observação, não a da mudança real. Leads RD do site existem desde 05/11/2026, então
isso não os alcança.

## Regras do envio

- **Uma vez por lead e marco.** O que foi enviado ao Google fica em `cms.ads_conversoes_rd`
  (chave `lead_id, marco`), gravado só depois da resposta OK. A resposta OK só diz que o lote
  passou na validação: a API processa cada evento depois, e um descarte nessa fase não volta
  para o site. O `transactionId` estável (`rd-proposta-<id>`, `rd-ganho-<id>`) é a segunda
  defesa: o Google deduplica por ele dentro da mesma ação.
- **Janela de 90 dias**, o máximo do Google Ads para conversão por clique. O site não guarda a
  hora do clique e conta a partir da criação do lead. Como o gclid vem de um cookie de até 90
  dias, um marco dentro dessa janela pode chegar até ~180 dias depois do clique. O Google
  descarta esse evento sem avisar e sem derrubar o lote, e a tabela o registra como enviado.
  Reenviar não adiantaria: o clique continuaria velho demais.
- Marco anterior à criação do lead não sobe (indica vínculo errado entre lead e negociação).
- O consentimento vai por evento, da coluna `ads_consent` do lead, como nos outros lotes.
- A data do evento é a do marco; o valor é 1 BRL, como nas outras ações do site.

## Ligar

1. Criar as duas ações no Google Ads (importação de cliques offline), com os nomes da tabela
   acima e janela de conversão por clique de 90 dias. É feito à parte, na máquina com as
   credenciais do Ads.
2. Pôr os ids das ações nas duas variáveis, em Production na Vercel, e publicar de novo.

Sem as variáveis, o cron pula cada marco, registra no log
(`GOOGLE_ADS_RD_... não configurada; "RD - ..." não sobe`) e devolve `skipped` em `rd` na
resposta. Nada fica marcado como enviado, então os marcos sobem quando a ação for ligada, desde
que ainda estejam dentro dos 90 dias. Com só uma das variáveis, só aquele marco sobe.

## Banco

Ordem de aplicação, as duas como `postgres`:

1. semogapp: `db/2026-11-25-crm-rdstation-marcos.sql` (função em `commercial`).
2. site: `db/2026-11-25-ads-conversoes-rd-postgres.sql` (tabela `cms.ads_conversoes_rd` e
   fachada). Exige o passo 1: o corpo da fachada é validado na criação.

As duas foram aplicadas em produção em 25/11/2026 e conferidas no catálogo. Descida na ordem
inversa, depois de reverter o código ou esvaziar as variáveis; o `.down` do site apaga o
registro dos envios, então guarde uma cópia antes (o comando está no arquivo).

Uma falha ao ler os marcos (fachada ausente, banco fora) fica só neste lote: os leads e o
WhatsApp sobem e são marcados normalmente, e a resposta traz o erro em `rd`.
