import { img } from '@/../content/media'
import { EXPERIENCE_EVENT as E } from '@/data/experienceEvent'
import type { EstadoDaInscricao } from '@/lib/experienceEstado'
import { absoluteUrl } from '@/lib/seo'

/**
 * O que a busca e as redes leem da landing do Experience: título, descrição,
 * card social e o JSON-LD de evento.
 *
 * Mora fora de `page.tsx` por um motivo prático: um `page.tsx` do App Router
 * só pode exportar o que o Next reconhece (`default`, `metadata`, …), e o que
 * nenhum teste consegue importar nenhum teste consegue defender. O JSON-LD do
 * evento estava travado só no e2e, e `.github/workflows/ci.yml` não tem passo
 * de Playwright — ou seja, sem trava nenhuma na prática.
 *
 * Os builders de dado estruturado do resto do site vivem em `src/lib/seo.ts`;
 * este ficou à parte para não arrastar `content/media.ts` e o dado do evento
 * para dentro de um módulo que TODA página do site importa.
 *
 * **Tudo aqui é função do estado da inscrição.** Enquanto era constante, a
 * página esgotada continuaria anunciando as vagas na SERP e oferecendo vaga
 * no rich result — o Google mostraria o snippet de um mês atrás para quem
 * procurasse o evento no sábado seguinte.
 */

// O local saiu do título e entrou na descrição: `${E.name} — manhã wellness na
// Praia do Cabo Branco` media 601px em Arial 20px e perdia o fim na SERP.
const TITULOS: Record<EstadoDaInscricao, string> = {
  aberto: `${E.name}: manhã wellness em ${E.city}`,
  esgotado: `${E.name}: vagas esgotadas`,
  encerrado: `${E.name}: a edição já aconteceu`,
}

export function experienceTitle(estado: EstadoDaInscricao): string {
  return TITULOS[estado]
}

/**
 * O horário sai de `E.timeLabel`, como todo o resto: este texto vai para a
 * `<meta description>`, para o `og:description`, para o `twitter:description`
 * E para o JSON-LD do evento (é o mesmo `description` reusado abaixo). Digitado
 * à mão, uma troca de horário em `experienceEvent.ts` arrumaria a página
 * inteira e deixaria o snippet da busca e o rich result mentindo.
 *
 * O texto vive no limite dos 160 caracteres e já perdeu duas coisas para
 * caber, sempre a menos importante: "e kit praia" saiu quando o local virou
 * "Centro de Atendimento ao Turista", e o BAIRRO saiu em 15/09/2026, quando o
 * nome do local ganhou o "Adaptado" e o texto foi a 165. O bairro é o que
 * menos falta aqui: a cidade já está no título, o nome completo do local é
 * específico o bastante para a busca, e o endereço inteiro — com avenida e
 * ponto de referência — está na página e no JSON-LD. Sem ele são 152.
 *
 * Nos dois estados fechados o LOCAL sai do texto, pelo mesmo critério de sempre
 * (cabe menos, sai o que menos falta): o nome do prédio tem 44 caracteres e
 * quem lê um snippet que anuncia "as vagas foram preenchidas" não está mais
 * procurando o endereço — está descobrindo que não vai. O endereço completo
 * continua na página, no hero e no JSON-LD.
 */
export function experienceDescription(
  estado: EstadoDaInscricao,
  capacidade: number | null = null,
): string {
  const vagas = capacidade === null ? 'Vagas limitadas' : `${capacidade} vagas`
  if (estado === 'aberto')
    return `Manhã gratuita de pilates, yoga e treino funcional em ${E.dateLabel}, das ${E.timeLabel}, no ${E.venue}. ${vagas}.`
  if (estado === 'esgotado')
    return `As ${capacidade === null ? '' : `${capacidade} `}vagas da manhã de pilates, yoga e treino funcional de ${E.dateLabel} foram preenchidas. Não há inscrição no dia do evento.`
  return `O ${E.name} aconteceu em ${E.dateLabel}, em ${E.city}: pilates, yoga e treino funcional. A próxima edição será anunciada aqui.`
}

/**
 * A foto do hero também é o card social. O route group `(evento)` é um root
 * layout IRMÃO de `(frontend)`, então não herda o `src/app/[slug]/opengraph-image.tsx`
 * que serve as rotas do site — sem declarar a imagem aqui, esta seria a única
 * página sem `og:image`, e o link do evento (divulgado justamente em WhatsApp
 * e Instagram) apareceria sem imagem nenhuma.
 */
export const experienceHeroImage = img('experience-hero.webp')

/**
 * JSON-LD `Event` — é o que habilita o rich result de evento na busca (data,
 * local e "gratuito" aparecem na própria SERP) e o que faz o Google entender
 * a página como evento, não como mais uma página de serviço.
 *
 * Data e horário saem de `EXPERIENCE_EVENT`, como todo o resto da página: se
 * a data mudar num lugar só, o structured data mentiria para o Google
 * enquanto a página mostra o certo. `-03:00` é o fuso de João Pessoa o ano
 * inteiro (o Brasil não tem mais horário de verão desde 2019).
 *
 * Duas coisas que o plano não pedia e entraram por decisão de SEO:
 * - `image`: o Google lista a imagem como recomendada para `Event` e é ela
 *   que aparece no card do resultado. É a mesma foto do hero, via `img()`,
 *   para não duplicar a URL do bucket.
 * - `organizer['@id']`: aponta para o nó `Organization` publicado na home
 *   (`getOrganizationJsonLd`, `#org`), então o evento fica preso à mesma
 *   entidade em vez de criar uma organização solta com nome igual.
 *
 * **`eventStatus` NÃO muda quando o evento acaba, e isso está certo.**
 * `EventStatusType` (schema.org) tem exatamente cinco membros — `EventCancelled`,
 * `EventMovedOnline`, `EventPostponed`, `EventRescheduled` e `EventScheduled` —
 * e nenhum significa "já realizado". Um evento que aconteceu como estava
 * marcado permanece `EventScheduled`; quem diz que ele ficou para trás é o
 * `endDate`, que é passado. Trocar por `EventCancelled` para "desligar" o rich
 * result seria afirmar que o evento foi cancelado, o que não aconteceu.
 *
 * Quem carrega o estado da inscrição é o `offers`:
 * - `aberto`   → `InStock`, há vaga;
 * - `esgotado` → `SoldOut`, acabou (as duas são membros de `ItemAvailability`);
 * - `encerrado`→ **sem `offers`**. Depois do sábado não existe oferta nenhuma a
 *   publicar, e um `SoldOut` eterno continuaria descrevendo uma inscrição que
 *   não existe mais. `undefined` some do JSON: `JSON.stringify` remove a chave.
 */
export function experienceEventJsonLd(estado: EstadoDaInscricao, capacidade: number | null = null) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: E.name,
    description: experienceDescription(estado, capacidade),
    startDate: `${E.date}T${E.startTime}:00-03:00`,
    endDate: `${E.date}T${E.endTime}:00-03:00`,
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    image: [experienceHeroImage.url],
    location: {
      '@type': 'Place',
      name: E.venue,
      // O ponto de referência e o bairro seguem na `description` porque não são
      // logradouro — o logradouro agora existe e está no `streetAddress` abaixo.
      description: `${E.venueReference}, ${E.district}`,
      address: {
        '@type': 'PostalAddress',
        // É por este campo que o Google põe o evento no mapa: só com cidade e
        // estado o rich result aponta para João Pessoa inteira, não para a orla.
        streetAddress: E.street,
        addressLocality: E.city,
        addressRegion: E.uf,
        addressCountry: 'BR',
      },
    },
    organizer: {
      '@type': 'Organization',
      '@id': `${absoluteUrl('')}#org`,
      name: 'Semog Administradora de Condomínios',
      url: absoluteUrl(''),
    },
    offers:
      estado === 'encerrado' || capacidade === null
        ? undefined
        : {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'BRL',
            availability:
              estado === 'esgotado' ? 'https://schema.org/SoldOut' : 'https://schema.org/InStock',
            url: absoluteUrl('experience'),
          },
    url: absoluteUrl('experience'),
  }
}
