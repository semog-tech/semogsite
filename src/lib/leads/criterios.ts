import { TIPO_CLIQUE_FIELD } from '@/lib/forms'
import { SQL_AMBIENTE_LIBERADO } from './ambiente'
import { COLUNAS_DA_LINHA } from './linha'

/**
 * SQL dos crons de captação (spec 4.3 e 4.4). Ficam fora das rotas porque arquivo de Route Handler
 * só pode exportar os handlers e as opções do Next. Cada consulta começa com uma etiqueta em
 * comentário, lida pelos testes.
 */

/** Captação: proposta, ou contato com assunto proposta comercial (o resto do contato é atendimento). */
export const SQL_E_CAPTACAO =
  "(form = 'proposta' or (form = 'contato' and data->>'assunto' = 'proposta-comercial'))"

/** Critério da spec 4.3: etapa nula (formulário antigo) e etapa 2 valem na hora; etapa 1 só depois de 45 min. */
export const SQL_PRONTO_PARA_ENVIO =
  "(etapa is null or etapa = 2 or created_at < now() - interval '45 minutes')"

/** "Já sou cliente" não é lead (spec 4.3). */
export const SQL_NAO_E_CLIENTE = "coalesce(data->>'cliente', '') <> 'sim'"

/** Quem gravou ou reivindicou já teve 10 min para enviar (o Exact tem timeout de 8 s). */
const SQL_JA_PROCESSADA = "envio_em is not null and envio_em < now() - interval '10 minutes'"

/**
 * (A) Etapa 1 sem etapa 2 há 45 min: reivindica (trava) **uma** linha e a devolve para a
 * pós-gravação; o cron chama em laço, com orçamento de tempo, para nenhuma linha ficar reivindicada
 * sem ser processada se a execução estourar. Sem teto de idade: etapa 1 de um cron parado por dias
 * ainda sai (o cron avisa o Sentry quando ela passa de 2 h).
 *
 * Disputa com a action: com Turnstile novo, a action ainda pode mexer nesta linha depois dos 45 min
 * (`absorver`, `reaproveitar-etapa1`, sem o limite dos 30 min do token). Todos os UPDATEs exigem
 * `envio_em is null` e o Postgres trava a linha: quem grava primeiro vence, e o outro reavalia o
 * WHERE depois da trava e não muda nada (a action então grava linha nova). Com `skip locked`, o cron
 * pula a linha que a action ou outra execução estiver segurando, e a pega na rodada seguinte se ela
 * ainda estiver pendente.
 */
export const SQL_REIVINDICAR_ETAPA1 = `/* cron:reivindicar-etapa1 */
update cms.leads set envio_em = now()
 where id in (
   select id from cms.leads
    where envio_em is null
      and etapa = 1
      and form = 'proposta'
      and created_at < now() - interval '45 minutes'
      and ${SQL_AMBIENTE_LIBERADO}
    order by created_at asc
    limit 1
    for update skip locked)
returning ${COLUNAS_DA_LINHA}`

/** (B) Reenvio ao Exact do que falhou, com trava entre execuções (`exact_tentativa_em`). */
export const SQL_REIVINDICAR_REENVIO_EXACT = `/* cron:reivindicar-reenvio-exact */
update cms.leads set exact_tentativa_em = now()
 where id in (
   select id from cms.leads
    where exact_lead_id is null
      and created_at > $1
      and exact_attempts < $2
      and ${SQL_E_CAPTACAO}
      and ${SQL_PRONTO_PARA_ENVIO}
      and ${SQL_JA_PROCESSADA}
      and (exact_tentativa_em is null or exact_tentativa_em < now() - interval '10 minutes')
      and ${SQL_AMBIENTE_LIBERADO}
      and ${SQL_NAO_E_CLIENTE}
    order by created_at asc
    limit $3
    for update skip locked)
returning id, form, etapa, data`

/** Lote diário do Ads (rede de recuperação, D1): o mesmo critério do envio na hora. */
export const SQL_LEADS_PARA_O_ADS = `/* cron:leads-para-o-ads */
select id, created_at, gclid, ads_consent, data->>'${TIPO_CLIQUE_FIELD}' as tipo_de_clique
  from cms.leads
 where gclid is not null
   and ${SQL_E_CAPTACAO}
   and created_at > $1 and uploaded_to_ads = false
   and ${SQL_PRONTO_PARA_ENVIO}
   and ${SQL_JA_PROCESSADA}
   and ${SQL_AMBIENTE_LIBERADO}
   and ${SQL_NAO_E_CLIENTE}
 order by created_at desc`
