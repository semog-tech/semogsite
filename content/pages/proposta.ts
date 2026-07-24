/**
 * Conteúdo de "Proposta" (slug `proposta`) — port fiel de
 * `seedPropostaPage` em `src/seed/pages.ts`, fiel a
 * `_reference/proposta.html`.
 */
import type { PageData } from '@/types/content'
import { img } from '../media'

export const proposta: PageData = {
  slug: 'proposta',
  layout: [
    // `.proposal-wrap`, `_reference/proposta.html:38-45,154-166`: SEM
    // `poster` nem vídeo — `pageHeroOverlay` liga o mesmo tratamento de
    // gradiente puro (sem `poster`) usado em `/blog` e `/contato`, com
    // números compactos próprios desta página.
    {
      blockType: 'hero',
      headline: 'Vamos falar do seu condomínio?',
      subhead: 'Preencha em dois minutos. Nossa equipe comercial responde em até 24 horas úteis.',
      pageHeroOverlay: true,
      pageHeroMinHeight: '38dvh',
      pageHeroPaddingBottom: 'clamp(2rem, 4vw, 3rem)',
      pageHeroHeadlineMaxWidth: '15ch',
      pageHeroGradient:
        'radial-gradient(70% 60% at 100% 0%, rgba(42,63,150,0.5) 0%, transparent 55%), var(--grad-hero)',
    },
    {
      blockType: 'formEmbed',
      formType: 'proposta',
      eyebrow: 'Solicitar proposta',
      title: 'Conte sobre o seu condomínio.',
      text: 'Preencha os dados abaixo e a nossa equipe comercial responde em até 24 horas úteis, pelo WhatsApp ou e-mail informado.',
    },
    // `.trust-panel` (3 `.trust-card`), fiel a `_reference/proposta.html:
    // 260-290`.
    {
      blockType: 'trustPanel',
      photo: img('hero-towers.webp'),
      stats: [
        { value: '35', label: 'anos de mercado' },
        { value: '+650', label: 'condomínios' },
        { value: '+70 mil', label: 'clientes' },
        { value: '4', label: 'unidades na região' },
      ],
      quote: 'Com o Semog Garante, a inadimplência do seu condomínio cai a zero.',
      quoteAccent: 'cai a zero.',
      quoteText: 'Pergunte ao consultor sobre a garantia de 100% da arrecadação por 1% ao mês.',
      whatsappTitle: 'Prefere conversar agora?',
      whatsappText: 'Chame no WhatsApp:',
      whatsapp: '551130034506',
      whatsappDisplay: '(11) 3003-4506',
    },
    {
      blockType: 'ctaBand',
      title: 'Pronto para receber a sua proposta?',
      text: 'Fale agora com a Semog e receba uma proposta sob medida para o seu condomínio.',
      cta: { label: 'Falar no WhatsApp', href: 'https://wa.me/551130034506' },
    },
  ],
}
