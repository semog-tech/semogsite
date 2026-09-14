import { img } from '@/../content/media'
import { EXPERIENCE_EVENT as E } from '@/data/experienceEvent'
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
 */

// O local saiu do título e entrou na descrição: `${E.name} — manhã wellness na
// Praia do Cabo Branco` media 601px em Arial 20px e perdia o fim na SERP.
export const experienceTitle = `${E.name}: manhã wellness em ${E.city}`

/**
 * O horário sai de `E.timeLabel`, como todo o resto: este texto vai para a
 * `<meta description>`, para o `og:description`, para o `twitter:description`
 * E para o JSON-LD do evento (é o mesmo `description` reusado abaixo). Digitado
 * à mão, uma troca de horário em `experienceEvent.ts` arrumaria a página
 * inteira e deixaria o snippet da busca e o rich result mentindo.
 *
 * "e kit praia" saiu no fecho quando o local virou "Centro de Atendimento ao
 * Turista" (12 caracteres a mais que "Praia do Cabo Branco"): com ele o texto
 * ia a 168 caracteres e o Google cortava justamente o fecho. Sem ele são 156,
 * dentro do que a SERP mostra — e o kit ganhou seção própria na página.
 */
export const experienceDescription = `Manhã gratuita de pilates, yoga e treino funcional em ${E.dateLabel}, das ${E.timeLabel}, no ${E.venue}, ${E.district}. ${E.seats} vagas.`

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
 */
export const experienceEventJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Event',
  name: E.name,
  description: experienceDescription,
  startDate: `${E.date}T${E.startTime}:00-03:00`,
  endDate: `${E.date}T${E.endTime}:00-03:00`,
  eventStatus: 'https://schema.org/EventScheduled',
  eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
  image: [experienceHeroImage.url],
  location: {
    '@type': 'Place',
    name: E.venue,
    // O ponto de referência e o bairro entram como `description` porque não são
    // logradouro: inventar um `streetAddress` para o Centro de Atendimento ao
    // Turista daria ao Google um endereço que ninguém confirmou.
    description: `${E.venueReference}, ${E.district}`,
    address: {
      '@type': 'PostalAddress',
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
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'BRL',
    availability: 'https://schema.org/InStock',
    url: absoluteUrl('experience'),
  },
  url: absoluteUrl('experience'),
}
