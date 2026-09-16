-- Desfecho comercial do lead — o que aconteceu DEPOIS que o responsável da
-- praça recebeu o e-mail de notificação.
--
-- Por que existe (16/09/2026): o site sabe quanto custa comprar uma proposta
-- (R$ 167 no último ciclo) e não sabe quanto ela vale. O responsável trata o
-- lead fora daqui — WhatsApp, telefone, visita — e o resultado nunca voltava
-- para o banco. Sem isso não dá para separar as 39 propostas entre as que
-- viraram contrato, as que morreram e as que nunca foram lead (gente pedindo
-- segunda via de boleto pelo formulário de proposta, por exemplo).
--
-- O registro entra pelos quatro botões do e-mail de notificação, que levam a
-- uma página de confirmação (`/desfecho/<id>?t=<hmac>`). O clique no botão NÃO
-- grava nada: filtro de segurança corporativo e proxy de e-mail abrem todos os
-- links de uma mensagem para checá-los, e um link que gravasse estado marcaria
-- lead sozinho. O GET só lê e exibe; a gravação é o POST da própria página.
--
-- `text` sem enum nem CHECK, pelo mesmo motivo de `cms.leads.form` e
-- `cms.leads.ads_consent`: um valor novo (um quinto desfecho, um motivo a
-- mais) não deve exigir migração. A lista canônica é `DESFECHOS`/`MOTIVOS` em
-- `src/lib/desfecho.ts`, e o preço desta escolha é esse comentário precisar
-- ser mantido junto com ela.
--
-- A tabela pertence ao `cms_user`, então este ALTER roda pela própria
-- `DATABASE_URI` — diferente de `cms.whatsapp_clicks`, que é de outro dono.
--
-- NULL em `desfecho` é "ainda não respondeu", não "não evoluiu". Os dois são
-- estados diferentes e a diferença é o dado mais útil aqui: taxa de resposta
-- do time e taxa de conversão do lead não são a mesma métrica.

alter table cms.leads
  -- 'negociando' | 'fechou' | 'nao_evoluiu' | 'nao_e_lead' (ver `DESFECHOS`).
  add column if not exists desfecho            text,
  -- Quando o desfecho foi registrado pela última vez. Corrigir a resposta
  -- sobrescreve as duas colunas — o responsável pode ter clicado errado, e o
  -- lead que está "em negociação" hoje fecha (ou morre) depois.
  add column if not exists desfecho_em         timestamptz,
  -- Só preenchido quando `desfecho = 'nao_e_lead'`: 'segunda_via_boleto' |
  -- 'morador_reclamacao' | 'fornecedor_parceria' | 'curriculo' | 'outro'.
  -- É a coluna que responde "quantos dos nossos leads não eram lead, e por
  -- quê" — a razão de a página perguntar isso em opção fechada e não em texto
  -- livre.
  add column if not exists desfecho_motivo     text,
  -- Texto livre opcional, também só em 'nao_e_lead'. Contexto para ler depois,
  -- não dimensão de contagem.
  add column if not exists desfecho_observacao text,
  -- Para qual endereço a notificação deste lead foi ENDEREÇADA, gravado no
  -- momento do envio (`submit-form.ts`). Vários endereços vêm separados por
  -- vírgula, na ordem em que entraram no `To` — é o caso de "Outra cidade", que
  -- avisa os três responsáveis de uma vez.
  --
  -- É o que separa desfecho com autor conhecido de desfecho sem autor, SEM
  -- perguntar nada a ninguém: `ivan@` e `galvao@` são caixas individuais, então
  -- o registro que chega por elas tem dono; o que chega por uma caixa
  -- compartilhada, ou por um e-mail endereçado a três, veio da equipe. Perguntar
  -- quem clicou seria atrito num fluxo cujo valor inteiro está em não ter atrito.
  --
  -- Coluna própria, e não derivada da cidade na hora da consulta, justamente
  -- porque o roteamento MUDA: o mapa por cidade já foi reescrito uma vez
  -- (16/09/2026), e derivar faria os leads antigos responderem com o destino de
  -- hoje. Aqui fica o endereçamento daquele dia.
  --
  -- **Não é comprovante de entrega.** O envio é best-effort e `sendMail` nunca
  -- lança: esta coluna diz para quem o e-mail foi endereçado, não que ele chegou.
  add column if not exists notificado_para     text;

-- Não há coluna de "quem registrou", e a ausência é deliberada. O token
-- assinado no link identifica o LEAD, não a pessoa: quem abre o link é quem
-- tem a mensagem, e a caixa `comercial@` é compartilhada. Gravar o
-- destinatário da notificação como se fosse o autor do registro seria inventar
-- um dado — e ele já é derivável da cidade do lead (`data->>'cidade'`), pelo
-- mesmo mapa de roteamento que decidiu para onde o e-mail foi.
