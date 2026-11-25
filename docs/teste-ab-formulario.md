# Teste A/B do formulário das landings de cidade

Decidido em 25/11/2026. O formulário do topo das quatro landings de cidade
(`/administradora-de-condominios-recife`, `-joao-pessoa`, `-campina-grande`, `-belem`) tem
duas versões, e cada visitante vê uma delas:

| Variante | Formulário | Campos visíveis | Envio |
| -------- | ---------- | --------------- | ----- |
| `a` | `PropostaForm` compacto (o de antes) | nome, condomínio (opcional), WhatsApp, tipo, e-mail | `submitForm('proposta')` |
| `b` | `PropostaCurtaForm` | nome, WhatsApp, condomínio (opcional) | `submitPropostaRapida`, a mesma da triagem do WhatsApp |

Nos dois a cidade vai oculta, preenchida pela landing, e os dois têm Turnstile, rate limit e
o mesmo pipeline (`cms.leads` como `form = 'proposta'`, e-mail ao comercial da cidade, CRM com
a Unidade derivada da cidade). O `b` ainda passa pela deduplicação por telefone da proposta
curta e grava `variante = 'contato-rapido'` e um protocolo, que a tela não mostra.

## Como funciona

- **Sorteio**: 50/50, uma vez por navegador, guardado no cookie de 1ª parte `semog-form-ab`
  (`a` ou `b`, 90 dias). É cookie funcional: não sai do site nem identifica ninguém, então não
  espera o aceite de marketing. Nada de marketing é disparado por causa do teste.
- **Sem troca na tela**: a página continua estática e o HTML leva os dois formulários. Um
  script em linha logo antes deles (`scriptTesteFormulario` em `src/lib/testeFormulario.ts`)
  decide a variante e marca `data-form-ab` no `<html>` antes de o navegador pintar o
  formulário; o CSS esconde o outro, e depois da hidratação o escondido sai do DOM. Numa
  navegação pelo cliente (link interno até a landing) a decisão acontece na primeira
  renderização do `PropostaFormAb`.
- **Forçar para conferir**: `?form=a` ou `?form=b` mostra a variante só naquela visita, sem
  gravar nem trocar o cookie. Não envie o formulário assim em produção nem em Preview (o
  Preview grava no banco de produção): o lead entra na contagem.

## Onde a variante fica registrada

- **Lead**: `cms.leads.data->>'testeFormulario'` (`a` ou `b`). Sem migração: é mais um campo
  do `data`, que já guarda os campos do formulário. Lead sem a chave não passou pelo teste
  (outra página, triagem do WhatsApp, ou antes do início).
- **E-mail interno e CRM**: o e-mail mostra "Teste A/B do formulário (variante)"; no RD a
  variante sai em `dados_proposta` (`testeFormulario: b`); no Exact a descrição do `b` diz
  que veio do formulário curto da landing.
- **GA4**: o mesmo `generate_lead` de sempre, com o parâmetro `teste_formulario` (`a` ou `b`);
  o `b` leva também `variante: contato-rapido`, como a triagem. A conversão importada no
  Google Ads continua sendo o `generate_lead`, sem filtro novo. Para o parâmetro aparecer nos
  relatórios do GA4, registre uma dimensão personalizada com escopo de evento
  `teste_formulario` (Admin → Definições personalizadas). Ela só vale dali para a frente;
  o banco tem o histórico completo.

## Como ler o resultado

Como o sorteio é 50/50, as duas variantes recebem o mesmo tráfego, e dá para comparar o
número de propostas direto. Troque a data pelo dia em que o teste entrou no ar.

Propostas por variante e por cidade (as linhas com `cidade` vazia são o total da variante):

```sql
select
  data->>'testeFormulario'                     as variante,
  data->>'cidade'                              as cidade,
  count(*)                                     as propostas,
  count(distinct data->>'telefone')            as telefones_distintos,
  count(*) filter (where data ? 'duplicaDe')   as repetidas
from cms.leads
where form = 'proposta'
  and data ? 'testeFormulario'
  and created_at >= '2026-11-26'
group by rollup (data->>'testeFormulario', data->>'cidade')
having data->>'testeFormulario' is not null
order by variante, cidade nulls first;
```

Use `telefones_distintos` para comparar: o `b` marca a repetição do mesmo telefone
(`duplicaDe`) e o `a` não.

A diferença é real ou acaso? Com tráfego igual, cada proposta cai em `b` com chance de 50%
se as duas convertem igual, então `z = (b − a) / √(a + b)`. Fora de ±1,96 a diferença é
significativa a 5%:

```sql
with n as (
  select
    count(distinct data->>'telefone') filter (where data->>'testeFormulario' = 'a') as a,
    count(distinct data->>'telefone') filter (where data->>'testeFormulario' = 'b') as b
  from cms.leads
  where form = 'proposta' and data ? 'testeFormulario' and created_at >= '2026-11-26'
)
select a, b, round(((b - a) / nullif(sqrt(a + b), 0))::numeric, 2) as z from n;
```

Volume não é tudo: o `b` chega sem e-mail e sem tipo de condomínio. Antes de decidir, compare
no RD quantos negócios de cada variante avançaram (filtro por `dados_proposta` contendo
`testeFormulario: a` ou `b`).

## Como encerrar

1. Escolha a vencedora e, em `src/components/city/CityLanding.tsx`, troque o `<script>` e o
   `<PropostaFormAb>` pelo formulário dela, sem `testeFormulario`: `<PropostaForm compact
   cidade={…} />` (`a`) ou `<PropostaCurtaForm cidade={…} />` (`b`, tirando dele o
   `testeFormulario: 'b'` do envio e do `generate_lead`).
2. Apague `PropostaFormAb.tsx`, `src/lib/testeFormulario.ts`, o campo `testeFormulario` dos
   dois schemas (`src/lib/form-schemas.ts`), o rótulo em `PROPOSTA_LABELS`
   (`submit-form.ts`), a prop `testeFormulario` do `PropostaForm`, os testes
   `tests/int/teste-formulario*.int.spec.*` e este documento (com a linha que aponta para ele
   no `AGENTS.md`).
3. Se o `b` vencer, ajuste a linha de origem do Exact (`linhaDoFormulario` em
   `src/lib/exact/map-lead.ts`): sem `testeFormulario`, o formulário curto da landing
   passaria a ser descrito como "contato rápido pelo botão de WhatsApp".
4. As linhas antigas de `cms.leads` ficam com a chave no `data`, o que não atrapalha nada. O
   cookie `semog-form-ab` expira sozinho em até 90 dias.
