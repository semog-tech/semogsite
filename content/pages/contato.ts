/**
 * Conteúdo de "Contato" (slug `contato`) — port fiel de `seedContatoPage` em
 * `src/seed/pages.ts`, fiel a `_reference/contato.html` — MAS com a mesma
 * escolha deliberada do seed de manter o form real de RHF/Zod/Turnstile por
 * cima do layout original do ref.
 */
import type { PageData } from '@/types/content'
import { img } from '../media'

export const contato: PageData = {
  slug: 'contato',
  // Rótulo administrativo real no Payload (confirmado via GET /api/pages).
  title: 'Contato',
  layout: [
    // `.page-hero`, `_reference/contato.html:76-88,198-205`: SEM `poster`,
    // 46dvh (igual ao blog), radial-gradient a 85% (à direita — o blog usa
    // 15%, à esquerda), `h1{max-width:15ch}`.
    {
      blockType: 'hero',
      headline: 'Fale com gente que resolve.',
      subhead: 'Atendimento rápido nos canais digitais e quatro unidades de portas abertas.',
      pageHeroOverlay: true,
      pageHeroMinHeight: '46dvh',
      pageHeroPaddingBottom: 'clamp(2.5rem, 5vw, 4rem)',
      pageHeroHeadlineMaxWidth: '15ch',
      pageHeroGradient:
        'radial-gradient(80% 70% at 85% 0%, rgba(42,63,150,0.45) 0%, transparent 55%), var(--grad-hero)',
    },
    // `.quick` (3 atalhos), `_reference/contato.html:207-231`.
    {
      blockType: 'quickLinks',
      items: [
        {
          icon: 'whatsapp',
          title: 'WhatsApp',
          description: 'Resposta em horário comercial, geralmente em poucos minutos.',
          value: '(11) 3003-4506',
          href: 'https://wa.me/551130034506',
          external: true,
        },
        {
          icon: 'email',
          title: 'E-mail',
          description: 'Para solicitações formais, documentos e propostas.',
          value: 'ola@semog.com.br',
          href: 'mailto:ola@semog.com.br',
        },
        {
          icon: 'document',
          title: 'Proposta comercial',
          description: 'Conte sobre o seu condomínio e receba retorno em até 24 horas úteis.',
          value: 'Solicitar proposta →',
          href: '/proposta',
        },
      ],
    },
    // `.selfserve` (6 links de autoatendimento), `_reference/contato.html:
    // 233-268`. `href="#"` em todos — mesmo estado do ref (autoatendimentos
    // que ainda não existem nesta migração).
    {
      blockType: 'selfServe',
      title: 'Resolva fácil, sem esperar.',
      titleAccent: 'sem esperar.',
      text: 'Os pedidos mais comuns já têm caminho direto. Escolha e resolva em minutos.',
      items: [
        {
          title: 'Segunda via de boleto',
          description: 'Baixe agora, sem falar com ninguém.',
          href: '#',
        },
        {
          title: 'CND do condomínio',
          description: 'Certidão negativa de débitos na hora.',
          href: '#',
        },
        {
          title: 'Acordo para pagamento',
          description: 'Negocie parcelas 100% online.',
          href: '#',
        },
        {
          title: 'Alteração de titularidade',
          description: 'Comprou ou vendeu? Atualize o cadastro.',
          href: '#',
        },
        {
          title: 'Declaração de quitação',
          description: 'Documento anual para o imposto de renda.',
          href: '#',
        },
        {
          title: 'Reserva de áreas comuns',
          description: 'Salão, churrasqueira e quadra pelo app.',
          href: '#',
        },
      ],
      note: 'Precisa de outra coisa? O time responde no WhatsApp em horário comercial.',
    },
    // `.units` (4 unidades, foto alternando de lado), fiel a
    // `_reference/contato.html:271-338`.
    {
      blockType: 'contactInfo',
      variant: 'units',
      eyebrow: 'Unidades',
      title: 'As Semogs, de portas abertas.',
      items: [
        {
          city: 'Semog Recife',
          chip: 'Unidade · Pernambuco',
          address: 'R. Bartolomeu de Gusmão, 217, Madalena, Recife/PE',
          phone: '(81) 3316-0265',
          whatsappDisplay: '(11) 3003-4506',
          hours: 'Segunda a sexta, 8h às 18h',
          mapsHref: 'https://maps.google.com/?q=Semog+Bartolomeu+de+Gusmao+217+Madalena+Recife',
          photo: img('recife.webp'),
          uf: 'PE',
        },
        {
          city: 'Semog João Pessoa',
          chip: 'Unidade · Paraíba',
          address: 'Av. Guarabira, 834, Manaíra, João Pessoa/PB',
          phone: '(83) 3224-1228',
          whatsappDisplay: '(11) 3003-4506',
          hours: 'Segunda a sexta, 8h às 18h',
          mapsHref: 'https://maps.google.com/?q=Semog+Guarabira+834+Manaira+Joao+Pessoa',
          photo: img('joao-pessoa.webp'),
          uf: 'PB',
        },
        {
          city: 'Semog Campina Grande',
          chip: 'Unidade · Paraíba',
          address: 'R. José Adnoste Roberto, 1001, Catolé, Campina Grande/PB',
          phone: '(83) 3201-9039',
          whatsappDisplay: '(11) 3003-4506',
          hours: 'Segunda a sexta, 8h às 18h',
          mapsHref:
            'https://maps.google.com/?q=Semog+Jose+Adnoste+Roberto+1001+Catole+Campina+Grande',
          photo: img('campina-grande.webp'),
          uf: 'PB',
        },
        {
          city: 'Semog Belém',
          chip: 'Unidade · Pará',
          address: 'Av. Alcindo Cacela, 2351, Sl 201, Cremação, Belém/PA',
          phone: '(91) 3115-4700',
          whatsappDisplay: '(11) 3003-4506',
          hours: 'Segunda a sexta, 8h às 18h',
          mapsHref: 'https://maps.google.com/?q=Semog+Alcindo+Cacela+2351+Cremacao+Belem',
          photo: img('belem.webp'),
          uf: 'PA',
        },
      ],
    },
    {
      blockType: 'formEmbed',
      formType: 'contato',
      eyebrow: 'Fale com a gente',
      title: 'Envie sua mensagem.',
      text: 'Preencha o formulário e nossa equipe responde em horário comercial, geralmente em poucos minutos.',
    },
    // Recapitulação compacta das 4 unidades (`variant:'grid'`, sem foto),
    // fecho perto do form — já existia antes desta task, mantida como um
    // plus sobre o ref (que termina em `.units`, sem nada depois).
    {
      blockType: 'contactInfo',
      variant: 'grid',
      eyebrow: 'Unidades',
      title: 'As Semogs, de portas abertas.',
      items: [
        {
          city: 'Recife',
          uf: 'PE',
          address: 'R. Bartolomeu de Gusmão, 217, Madalena, Recife/PE',
          phone: '(81) 3316-0265',
        },
        {
          city: 'João Pessoa',
          uf: 'PB',
          address: 'Av. Guarabira, 834, Manaíra, João Pessoa/PB',
          phone: '(83) 3224-1228',
        },
        {
          city: 'Campina Grande',
          uf: 'PB',
          address: 'R. José Adnoste Roberto, 1001, Catolé, Campina Grande/PB',
          phone: '(83) 3201-9039',
        },
        {
          city: 'Belém',
          uf: 'PA',
          address: 'Av. Alcindo Cacela, 2351, Sl 201, Cremação, Belém/PA',
          phone: '(91) 3115-4700',
        },
      ],
      whatsapp: '551130034506',
    },
  ],
}
