'use server'

/**
 * **Só exporte função async deste arquivo.** Num módulo `'use server'` o Next
 * registra *todo* export como Server Action — inclusive um `export type`, que
 * a compilação depois apaga, deixando o registro apontando para um
 * identificador que não existe. O módulo inteiro morre com `ReferenceError` na
 * primeira submissão, antes de qualquer validação.
 *
 * Não é hipótese: um `export type { FormType }` reexportado de `@/lib/forms`
 * derrubou os três formulários por 12 dias em agosto/2026, com build verde,
 * `tsc` limpo e testes passando — nenhum portão automático enxerga isso.
 * Tipo compartilhado se importa de `@/lib/forms`, que é a fonte única.
 */

import { cookies, headers } from 'next/headers'
import { EXPERIENCE_EVENT } from '@/data/experienceEvent'
import ContactAutoReply from '@/emails/ContactAutoReply'
import ContactNotification from '@/emails/ContactNotification'
import ExperienceAutoReply from '@/emails/ExperienceAutoReply'
import { consentimentoDeAnuncio, paisDaRequisicao } from '@/lib/adsConsent'
import {
  ATTRIBUTION_COOKIE,
  buildAttributionFields,
  parseAttributionCookie,
} from '@/lib/attribution'
import { CONSENT_COOKIE_NAME } from '@/lib/consent'
import { pool, query } from '@/lib/db'
import { botoesDeDesfecho } from '@/lib/desfechoToken'
import { isExactEligible } from '@/lib/exact/map-lead'
import { pushLeadToExact } from '@/lib/exact/push-lead'
import type { ContatoValues, ExperienceValues, PropostaValues } from '@/lib/form-schemas'
import { contatoSchema, experienceSchema, propostaSchema } from '@/lib/form-schemas'
import { extractLeadColumns, FORMS, type FormType, type SubmitFormResult } from '@/lib/forms'
import { rateLimit } from '@/lib/rate-limit'
import { sendMail } from '@/lib/sendgrid'
import { verifyTurnstile } from '@/lib/turnstile'

/** Rótulos pt-BR (iguais ao `label` de cada bloco do seed) pro e-mail de notificação interna. */
const CONTATO_LABELS: Record<keyof ContatoValues, string> = {
  nome: 'Nome',
  email: 'E-mail',
  telefone: 'Telefone / WhatsApp',
  assunto: 'Assunto',
  mensagem: 'Mensagem',
}

const PROPOSTA_LABELS: Record<keyof PropostaValues, string> = {
  tipo: 'O que você representa?',
  nome: 'Seu nome',
  nomeCondominio: 'Nome do condomínio',
  cargo: 'Seu papel',
  email: 'E-mail',
  telefone: 'WhatsApp',
  cidade: 'Cidade do condomínio',
  unidades: 'Número de unidades',
  mensagem: 'Mensagem',
}

/**
 * Inscrição no Semog Experience. Mesmo papel dos dois acima: só o rótulo
 * legível de cada campo no e-mail de notificação interna.
 */
const EXPERIENCE_LABELS: Record<keyof ExperienceValues, string> = {
  nome: 'Nome',
  email: 'E-mail',
  telefone: 'WhatsApp',
  condominio: 'Condomínio',
  aceiteImagem: 'Autoriza uso de imagem',
}

/**
 * Responsáveis da Paraíba (João Pessoa e Campina Grande) — a mesma caixa da
 * filial que já recebe a inscrição do Experience.
 */
const PB_TO = 'comercial.pb@semog.com.br'

/**
 * Roteamento da notificação interna de **Proposta** por região, a partir do
 * campo `cidade` (as chaves são os `value` exatos de `CIDADE_OPTIONS` em
 * `src/lib/form-schemas.ts` — se o enum mudar as opções, o `tsc` cobra a
 * entrada aqui). Só a Proposta usa isto; Contato continua indo pro `CONTACT_TO`.
 *
 * O grupo `comercial@semog.com.br` saiu daqui em 16/09/2026. Ele é uma lista de
 * distribuição, e lista não responde: com os botões de desfecho no e-mail, um
 * registro que chega por caixa individual (`ivan@`, `galvao@`) tem autor
 * conhecido, e um que chega por grupo não tem. Trocar o grupo pela caixa da
 * filial da Paraíba mantém o endereçamento concreto.
 *
 * **"Outra cidade" vai para os três de uma vez.** Não dá para saber de que
 * praça é um condomínio que não está na lista, então todo mundo recebe e quem
 * reconhecer assume. É UM e-mail com os três no `To`, não três e-mails — assim
 * cada um vê que os outros também receberam, o que evita dois consultores
 * ligando para o mesmo síndico.
 */
const PROPOSTA_CIDADE_TO: Record<PropostaValues['cidade'], readonly string[]> = {
  'Recife e região': ['ivan@semog.com.br'],
  'João Pessoa e região': [PB_TO],
  'Campina Grande e região': [PB_TO],
  'Belém e região': ['galvao@semog.com.br'],
  'Outra cidade': ['ivan@semog.com.br', 'galvao@semog.com.br', PB_TO],
}

/**
 * Destino da inscrição no Semog Experience — quem organiza o evento é a filial
 * de João Pessoa. Cravado no código como os da Proposta, e não em variável de
 * ambiente: `CONTACT_TO` ausente faz a notificação simplesmente não sair, sem
 * erro nenhum, e uma inscrição perdida em silêncio é o pior desfecho possível.
 */
const EXPERIENCE_TO = 'comercial.pb@semog.com.br'

/**
 * Para quem vai a notificação interna deste formulário. `undefined` só acontece
 * no Contato sem `CONTACT_TO` configurado (comum em dev), e aí nenhuma
 * notificação sai — comportamento original.
 *
 * É função, e não um trecho dentro do bloco de e-mail, porque a decisão passou
 * a ser gravada na linha do lead (`notificado_para`) e portanto precisa
 * acontecer ANTES do INSERT: quem recebeu o aviso é o que separa, depois, um
 * desfecho com autor conhecido de um que veio de caixa compartilhada.
 */
function destinatariosDaNotificacao(
  formType: FormType,
  data: ContatoValues | PropostaValues | ExperienceValues,
): readonly string[] | undefined {
  if (formType === 'proposta') return PROPOSTA_CIDADE_TO[(data as PropostaValues).cidade]
  if (formType === 'experience') return [EXPERIENCE_TO]
  return process.env.CONTACT_TO ? [process.env.CONTACT_TO] : undefined
}

/**
 * Schema de validação por formulário. Mapa (e não ternário) porque com três
 * formulários o ternário aninhado já esconde qual schema vale pra qual tipo —
 * e porque assim o `tsc` cobra a entrada quando um `FormType` novo aparecer.
 */
const SCHEMAS = {
  contato: contatoSchema,
  proposta: propostaSchema,
  experience: experienceSchema,
} as const

/**
 * Converte o primeiro `ZodIssue` de cada campo (`issue.path[0]`) num
 * `Record<string, string>` — formato que o client usa pra destacar o campo
 * com erro, sem precisar entender a árvore de issues do Zod.
 */
function flattenZodErrors(
  issues: { path: PropertyKey[]; message: string }[],
): Record<string, string> {
  const errors: Record<string, string> = {}
  for (const issue of issues) {
    const key = issue.path[0]
    if (typeof key === 'string' && !(key in errors)) {
      errors[key] = issue.message
    }
  }
  return errors
}

/**
 * IP do cliente a partir de `x-forwarded-for` (Vercel/proxies padrão
 * preenchem esse header; primeiro valor da lista é o cliente original).
 * `undefined` se ausente (ex.: `next dev` sem proxy na frente) — quem chama
 * cai pro fallback `'anon'` do rate limit.
 */
async function getClientIp(): Promise<string | undefined> {
  const headerList = await headers()
  const forwardedFor = headerList.get('x-forwarded-for')
  if (!forwardedFor) return undefined
  return forwardedFor.split(',')[0]?.trim() || undefined
}

/** Uma linha de `cms.leads`, já com tudo decidido — ver `gravarLead`. */
type LinhaDeLead = {
  formType: FormType
  leadData: Record<string, string>
  gclid: string | null
  email: string | null
  adsConsent: string
  notificadoPara: string | null
}

const COLUNAS_DO_LEAD = 'form, data, gclid, email, ads_consent, notificado_para'

/**
 * Chave da trava de vagas do Experience. É um número arbitrário e fixo — o que
 * importa é que só esta operação o use, porque advisory lock é um espaço de
 * nomes global do banco: duas operações diferentes com a mesma chave
 * serializariam uma à outra sem nenhuma relação entre si. Nasceu da data do
 * evento só para ser reconhecível.
 */
const TRAVA_DE_VAGAS = 26092026

/** O INSERT sem limite — Contato e Proposta, que não têm teto de vagas. */
async function gravarLeadSemLimite(valores: unknown[]): Promise<{ id?: string; lotado: false }> {
  const { rows } = await query<{ id: string }>(
    `insert into cms.leads (${COLUNAS_DO_LEAD})
     values ($1, $2, $3, $4, $5, $6) returning id`,
    valores,
  )
  return { id: rows[0]?.id, lotado: false }
}

/**
 * A inscrição do Experience, com a trava das `seats` vagas.
 *
 * **Por que transação explícita, e não um comando só.** A versão anterior era
 * `insert ... select ... where (select count(*)) < $7` numa declaração única,
 * na crença de que um comando só não poderia ter corrida. **Está errado, e foi
 * medido:** em `read committed` o subselect roda no snapshot da declaração e
 * não toma lock nenhum, então N envios que caiam na mesma janela leem todos a
 * mesma contagem e gravam todos. Reproduzido em Postgres 17 partindo de 149
 * com limite 150: dez envios simultâneos → dez gravados (159 no total); com 30
 * de concorrência, 179. Nem exige simultaneidade perfeita — seis envios
 * espalhados em 100ms deram excesso em 3 de 10 rodadas, com janela medida de
 * ~7ms sem rede (maior em produção, com o HAProxy no caminho). A declaração
 * única economiza uma ida ao banco; ela não serializa nada.
 *
 * **E advisory lock dentro de uma CTE no mesmo comando também não resolve** —
 * 10 de 10 rodadas ainda com excesso. É contraintuitivo e a próxima pessoa vai
 * tentar: o snapshot do comando é tirado ANTES de a CTE adquirir o lock, então
 * quando o lock enfim chega já é tarde, a contagem que será lida é velha.
 *
 * O que zerou o excesso, medido (0 em 10 rodadas, com concorrência 10 e 40,
 * parando exato em 150), é o que está abaixo: `begin` → `pg_advisory_xact_lock`
 * → INSERT → `commit`. Cada transação toma o snapshot do INSERT **depois** de
 * já ter o lock, portanto enxerga o que as anteriores gravaram.
 *
 * O lock é `xact`: o Postgres o solta sozinho no `commit` E no `rollback`,
 * inclusive se a conexão cair — não há caminho de saída que o deixe preso.
 *
 * A chave é exclusiva desta operação, então **Contato e Proposta não são
 * serializados**: eles nem passam por aqui (ver `gravarLead`).
 *
 * `lock_timeout` existe para o modo de falha oposto: sem ele, uma espera
 * anômala penduraria a Server Action indefinidamente. Estourando, o erro sobe
 * e vira o `{ ok: false }` genérico de `submitForm` — nunca um falso sucesso.
 * **Ele precisa vir ANTES do `pg_advisory_xact_lock`**: depois, não limita a
 * espera que existe para limitar, e a submissão pendura (medido: >15s).
 *
 * **Os 5s são uma decisão consciente, não um número solto — não "otimize" sem
 * ler isto.** A trava serializa as inscrições, e o pool é pequeno (`max: 5`,
 * ver `lib/db.ts`), então uma fila no lock ocupa conexões que o resto do site
 * também usa. Medido: em operação normal o custo é desprezível (40 submissões
 * simultâneas resolvidas em 144ms); no cenário de cauda, cinco inscrições
 * disputando o lock ao mesmo tempo esgotam o pool e fazem uma submissão de
 * Contato — ou uma leitura de página — esperar ~4s. Baixar o timeout trocaria
 * essa lentidão rara por um erro na cara de quem está se inscrevendo, que é
 * pior: o pico acontece justamente quando as vagas estão acabando. Mantido em
 * 5s por decisão do time, 17/09/2026.
 */
async function gravarInscricaoDoExperience(
  valores: unknown[],
): Promise<{ id?: string; lotado: boolean }> {
  const client = await pool.connect()

  /**
   * **Sem isto, uma queda de conexão aqui derruba o processo.**
   *
   * `pool.connect()` REMOVE o listener de `'error'` que o pool mantém no client
   * e só o recoloca no `release` — no intervalo, quem pegou o client é o
   * responsável por ele. Um erro assíncrono na conexão (backend morto, rede
   * caindo) emite `'error'` num `EventEmitter` sem ouvinte, e no Node isso vira
   * `uncaughtException`, não uma promise rejeitada: o `try/catch` abaixo não
   * pega. Medido derrubando a conexão no meio da transação: este caminho
   * produzia `Connection terminated unexpectedly` como exceção não tratada,
   * enquanto o Contato (via `pool.query`) rejeitava limpo — porque `pool.query`
   * registra exatamente este listener por dentro. Em serverless o crash pode
   * levar a instância junto.
   */
  const aoFalharConexao = (err: Error) => {
    console.error('[submit-form] conexão da inscrição caiu no meio da transação:', err)
  }
  client.on('error', aoFalharConexao)

  // Um rollback que falha deixa a conexão em estado incerto; devolvê-la ao
  // pool contaminaria a próxima submissão que a pegasse.
  let conexaoSuspeita = false

  try {
    await client.query('begin')
    await client.query("set local lock_timeout = '5s'")
    await client.query('select pg_advisory_xact_lock($1)', [TRAVA_DE_VAGAS])

    // Cada linha é uma pessoa — acompanhante ocupa vaga e é assim que o kit é
    // dimensionado. Nada de desduplicar por e-mail nesta contagem.
    const { rows, rowCount } = await client.query<{ id: string }>(
      `insert into cms.leads (${COLUNAS_DO_LEAD})
       select $1, $2, $3, $4, $5, $6
        where (select count(*) from cms.leads where form = 'experience') < $7
       returning id`,
      [...valores, EXPERIENCE_EVENT.seats],
    )
    await client.query('commit')

    // Zero linhas = a condição reprovou. É assim, e não por exceção, que a
    // lotação se anuncia.
    return { id: rows[0]?.id, lotado: rowCount === 0 }
  } catch (err) {
    try {
      await client.query('rollback')
    } catch (rollbackErr) {
      conexaoSuspeita = true
      console.error('[submit-form] rollback da inscrição falhou:', rollbackErr)
    }
    throw err
  } finally {
    // Tirar o ouvinte ANTES de devolver: a partir do `release` o pool volta a
    // ser o dono do client e recoloca o dele. Deixar o nosso aqui vazaria um
    // listener por submissão (`MaxListenersExceededWarning`) numa conexão que
    // vive enquanto a instância viver.
    client.removeListener('error', aoFalharConexao)
    client.release(conexaoSuspeita)
  }
}

/**
 * Grava a submissão em `cms.leads` e devolve o id da linha — ou `lotado: true`
 * quando o Experience já bateu as `seats` vagas.
 *
 * **A trava de lotação é aqui, não no que a página mostra.** A landing é
 * servida com ISR (ver `revalidate` em `(evento)/experience/page.tsx`), então
 * existe sempre uma janela em que alguém está com o formulário aberto numa
 * versão da página de até um minuto atrás. Barrar só no render deixaria essa
 * pessoa entrar como vaga 151.
 */
async function gravarLead(linha: LinhaDeLead): Promise<{ id?: string; lotado: boolean }> {
  const valores = [
    linha.formType,
    linha.leadData,
    linha.gclid,
    linha.email,
    linha.adsConsent,
    linha.notificadoPara,
  ]

  return linha.formType === 'experience'
    ? gravarInscricaoDoExperience(valores)
    : gravarLeadSemLimite(valores)
}

/**
 * Server Action de submit dos formulários "Contato"/"Proposta"/"Inscrição —
 * Semog Experience" (config estática em `@/lib/forms`). Pipeline: valida com
 * Zod → rate limit por formulário+IP → Turnstile → grava em `cms.leads` (via `pg`,
 * `@/lib/db`) → cria o lead no CRM (Exact, só quando é captação) → e-mail. Os
 * dois últimos são best-effort.
 *
 * A inscrição do Experience passa pelo mesmo pipeline, mas **nunca** chega ao
 * CRM: `isExactEligible` a barra (evento é relacionamento, não captação).
 *
 * **Nunca lança** — cada etapa arriscada (Turnstile, DB, Exact, SendGrid) fica
 * atrás de um `try/catch` que devolve um `{ ok: false, message }` genérico em
 * vez de deixar o erro subir. O `INSERT` em `cms.leads` é o único passo que
 * precisa ter sucesso pra `ok: true` — falha de CRM ou de e-mail depois disso
 * é só registrada (no banco e no log).
 */
export async function submitForm(
  formType: FormType,
  values: unknown,
  turnstileToken: string,
): Promise<SubmitFormResult> {
  const schema = SCHEMAS[formType]
  const parsed = schema.safeParse(values)

  if (!parsed.success) {
    return { ok: false, errors: flattenZodErrors(parsed.error.issues) }
  }

  try {
    const ip = await getClientIp()

    // Rate limit ANTES do Turnstile, de propósito. `verifyTurnstile` é uma
    // chamada de rede ao siteverify da Cloudflare: na ordem inversa, uma
    // enxurrada de tokens inválidos nunca chegava a contar e cada tentativa
    // ainda custava uma requisição de saída. A chave leva o formulário na
    // frente (como pede o docblock de `rateLimit`) para que uma rajada na
    // landing do evento não consuma a cota de quem está preenchendo Contato ou
    // Proposta do mesmo IP — escritório inteiro sai por um NAT só.
    const rate = rateLimit(`${formType}:${ip ?? 'anon'}`, { max: 5, windowMs: 60_000 })
    if (!rate.ok) {
      return { ok: false, message: 'Muitas tentativas, tente em instantes.' }
    }

    const turnstileOk = await verifyTurnstile(turnstileToken, ip)
    if (!turnstileOk) {
      return { ok: false, message: 'Verificação anti-spam falhou.' }
    }

    const formTitle = FORMS[formType].title
    const data = parsed.data as ContatoValues | PropostaValues | ExperienceValues

    // Origem do lead (cookie de 1ª parte gravado pelo AttributionTracker no
    // client). Best-effort: ausente/ilegível → `[]`, e a submissão segue igual.
    const jar = await cookies()
    const attributionCookie = jar.get(ATTRIBUTION_COOKIE)?.value
    const attributionFields = buildAttributionFields(parseAttributionCookie(attributionCookie))

    // Monta o `data` (jsonb) do lead: campos do formulário (chave = nome do
    // campo do schema Zod) + origem, como objeto `{field: value}`.
    const leadData: Record<string, string> = {}
    for (const [field, value] of Object.entries(data)) {
      if (value !== undefined) {
        leadData[field] = String(value)
      }
    }
    for (const f of attributionFields) {
      leadData[`origem — ${f.label}`] = f.value
    }

    const { gclid, email } = extractLeadColumns(leadData)

    // Consentimento de publicidade deste visitante, decidido AQUI e gravado na
    // linha: é o que o cron do Google Ads envia junto com a conversão, no
    // lugar da constante que havia antes (ver `@/lib/adsConsent`).
    const adsConsent = consentimentoDeAnuncio(
      jar.get(CONSENT_COOKIE_NAME)?.value,
      paisDaRequisicao(await headers()),
    )

    // Decidido aqui, antes do INSERT, porque vai para a própria linha: é o
    // registro de a quem este lead foi endereçado, e ele precisa sobreviver a
    // uma mudança futura do mapa de roteamento (ver `db/leads-desfecho.sql`).
    const notifyTo = destinatariosDaNotificacao(formType, data)

    const gravado = await gravarLead({
      formType,
      leadData,
      gclid: gclid ?? null,
      email: email ?? null,
      adsConsent,
      notificadoPara: notifyTo?.join(', ') ?? null,
    })

    // Lotou enquanto esta pessoa preenchia. Sai ANTES do CRM e do e-mail: não
    // há lead salvo para empurrar nem inscrição para confirmar, e um e-mail de
    // "inscrição recebida" para quem não entrou seria pior que o erro.
    if (gravado.lotado) {
      return {
        ok: false,
        esgotado: true,
        message: `As ${EXPERIENCE_EVENT.seats} vagas foram preenchidas enquanto você preenchia o formulário. Sua inscrição não foi registrada.`,
      }
    }

    const leadRowId = gravado.id

    // CRM (Exact) é best-effort, igual aos e-mails: o lead já está salvo acima.
    // Um CRM fora do ar — ou um payload que ele recuse — não pode virar erro
    // pra quem preencheu o formulário; o cron `push-exact-leads` retenta
    // depois. Só passa por aqui quem é captação de verdade (o próprio
    // `pushLeadToExact` devolve `null` pro resto e pra integração desligada).
    if (leadRowId) {
      try {
        const push = await pushLeadToExact(formType, leadData)
        if (push) {
          await query(
            `update cms.leads
                set exact_lead_id = $1, exact_error = $2, exact_attempts = exact_attempts + 1
              where id = $3`,
            [
              push.ok ? push.exactLeadId : null,
              push.ok ? (push.personError ?? null) : push.error,
              leadRowId,
            ],
          )
        }
      } catch (exactErr) {
        console.error('[submit-form] push pro Exact falhou (lead já salvo):', exactErr)
      }
    }

    // E-mail é best-effort: a submissão já está salva acima, então uma
    // falha de SendGrid (ou ausência de `CONTACT_TO`/`SENDGRID_API_KEY`)
    // não deve derrubar o retorno `ok: true` pro usuário.
    try {
      const labels =
        formType === 'contato'
          ? CONTATO_LABELS
          : formType === 'experience'
            ? EXPERIENCE_LABELS
            : PROPOSTA_LABELS
      const fields = Object.entries(data)
        .filter(([, value]) => value !== undefined)
        .map(([field, value]) => ({
          label: labels[field as keyof typeof labels] ?? field,
          value: String(value),
        }))

      // Botões de desfecho (Em negociação / Fechou / Não evoluiu / Não é lead).
      //
      // O critério é `isExactEligible` — a MESMA função que decide o que vira
      // card no CRM —, e não `formType === 'proposta'`. Perguntar "isto é
      // captação?" e "vale perguntar o desfecho disto?" é perguntar a mesma
      // coisa, e duplicar a regra faria as duas respostas divergirem com o
      // tempo. Na prática isso inclui o Contato com assunto
      // `proposta-comercial`, que é pedido de proposta escrito no formulário
      // errado: ele já entra no CRM como lead e agora também tem desfecho. O
      // resto do Contato (2ª via, CND, acordo) é atendimento a quem já é
      // cliente, e "fechou" não faz sentido ali.
      //
      // `leadRowId` ausente = sem o que assinar. `botoesDeDesfecho` devolve
      // `undefined` também quando falta `LEAD_OUTCOME_SECRET`, e aí o e-mail sai
      // como sempre saiu, sem a seção.
      const desfecho =
        leadRowId && isExactEligible(formType, leadData)
          ? (botoesDeDesfecho(leadRowId) ?? undefined)
          : undefined

      if (notifyTo && notifyTo.length > 0) {
        const notificationResult = await sendMail({
          to: [...notifyTo],
          subject: `Novo contato via ${formTitle}`,
          react: ContactNotification({
            formTitle,
            fields,
            attribution: attributionFields,
            desfecho,
          }),
        })
        if (notificationResult.ok === false) {
          console.error('[submit-form] sendMail falhou:', notificationResult.error)
        }
      } else {
        console.info(
          '[submit-form] destinatário da notificação ausente — notificação interna não enviada.',
        )
      }

      // Auto-reply: a inscrição no evento tem o seu, e não é firula. O
      // genérico diz "Recebemos seu contato" e promete que "em breve alguém
      // vai retornar pra você" — para quem se inscreveu num evento gratuito
      // isso é falso (ninguém vai retornar) e contradiz a frase que o próprio
      // formulário mostra acima do botão. O do evento confirma a inscrição
      // repetindo data, horário e local de `EXPERIENCE_EVENT`.
      const autoReply =
        formType === 'experience'
          ? {
              subject: `Inscrição recebida — ${EXPERIENCE_EVENT.name}`,
              react: ExperienceAutoReply({ name: data.nome }),
            }
          : {
              subject: 'Recebemos seu contato — Semog',
              react: ContactAutoReply({ name: data.nome }),
            }

      const autoReplyResult = await sendMail({
        to: data.email,
        subject: autoReply.subject,
        react: autoReply.react,
      })
      if (autoReplyResult.ok === false) {
        console.error('[submit-form] sendMail falhou:', autoReplyResult.error)
      }
    } catch (mailErr) {
      console.error('[submit-form] falha ao enviar e-mail (submissão já salva):', mailErr)
    }

    return { ok: true, message: 'Recebemos sua mensagem!' }
  } catch (err) {
    console.error('[submit-form] erro inesperado:', err)
    return { ok: false, message: 'Erro ao enviar. Tente novamente.' }
  }
}
