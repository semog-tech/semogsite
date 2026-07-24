/**
 * Conteúdo de "Semog Garante" (slug `garante`) — port fiel de
 * `seedGarantePage` em `src/seed/pages.ts`, fiel a `_reference/garante.html`,
 * ordem exata do ref (9 seções).
 */
import type { PageData } from '@/types/content'
import { img } from '../media'

export const garante: PageData = {
  slug: 'garante',
  // Rótulo administrativo real no Payload (confirmado via GET /api/pages).
  title: 'Semog Garante',
  layout: [
    // `.g-hero`, `_reference/garante.html:59-104,268-293` — hero de vídeo
    // full-bleed (100dvh) com o chip de vidro "1%".
    {
      blockType: 'hero',
      eyebrow: 'Semog Garante · uma parceria Semog + G5 Partners',
      headline: 'Inadimplência zero.',
      subhead:
        'O condomínio recebe 100% da arrecadação prevista, todos os meses. Chova, atrase quem atrasar.',
      video: img('garante.mp4'),
      poster: img('garante.webp'),
      ctas: [{ label: 'Solicitar proposta', href: '/proposta', variant: 'white' }],
      priceChip: { value: '1%', label: 'da arrecadação. Sem adesão, sem letra miúda.' },
    },
    // `.g-ticker`, `_reference/garante.html:105-112,296-303` — o único
    // marquee da página. Sem "/" visível no ref (usa `&nbsp;` como
    // espaçador): `separator` recebe 4 nbsp reais, não "/". A comparação
    // de fidelidade (Task 5, Step 9) pegou que a primeira versão portada
    // aqui usava 4 espaços comuns (U+0020) em vez de nbsp (U+00A0) —
    // visualmente idênticos no editor, mas produção usa nbsp de verdade
    // (confirmado via GET /api/pages?where[slug][equals]=garante, que
    // devolve os bytes a0 a0 a0 a0). Escrito com \u00a0 (escape Unicode
    // explícito) em vez do caractere literal, pra não depender de um
    // caractere invisível sobreviver ao editor/diff/git intactos.
    {
      blockType: 'valuesMarquee',
      variant: 'ticker',
      items: ['100% DA ARRECADAÇÃO', 'TODO MÊS', 'SEM SUSTO'],
      separator: '\u00a0\u00a0\u00a0\u00a0',
    },
    // `.g-problem`, `_reference/garante.html:114-120,306-310` — o parágrafo
    // "O problema" com scrub palavra-a-palavra.
    {
      blockType: 'wordsSection',
      variant: 'problem',
      text: 'Todo síndico conhece o ciclo: inadimplência sobe, o caixa aperta, a obra para, a assembleia esquenta. O Semog Garante quebra esse ciclo no primeiro mês.',
    },
    // `.g-how.sec-light`, `_reference/garante.html:122-141,313-333` — os 4
    // hover-rows claros de "Como funciona". `.g-how` não zera o padding-top
    // → `tightTop: false`.
    {
      blockType: 'pillars',
      eyebrow: 'Como funciona',
      tightTop: false,
      light: true,
      compact: true,
      items: [
        {
          title: 'O condomínio recebe tudo',
          text: 'No dia previsto, 100% da arrecadação entra no caixa do condomínio. Com ou sem atrasos, a receita está garantida em contrato.',
        },
        {
          title: 'A cobrança vira problema nosso',
          text: 'A Semog e a G5 Partners assumem toda a régua de cobrança: negociação humana, dentro da lei e sem constrangimento entre vizinhos.',
        },
        {
          title: 'O orçamento vira certeza',
          text: 'Sem buraco no fluxo de caixa, manutenção, obras e melhorias saem do papel no prazo combinado em assembleia.',
        },
        {
          title: 'O síndico dorme tranquilo',
          text: 'Nada de lista de devedores na porta do elevador nem assembleia tensa. A relação entre vizinhos fica preservada.',
        },
      ],
    },
    // `.g-one`, `_reference/garante.html:143-165,336-342` — o "1%"
    // tipográfico gigante.
    {
      blockType: 'priceMoment',
      value: '1%',
      sub: 'da arrecadação. Só isso.',
      fine: 'Sem taxa de adesão, sem carência escondida, sem pegadinha no contrato. O custo se paga na primeira obra que sai do papel.',
    },
    // `.g-compare.sec-light.white`, `_reference/garante.html:167-195,345-373`
    // — os 2 cartões antes/depois.
    {
      blockType: 'compare',
      title: 'A diferença no dia a dia.',
      before: {
        tag: 'Sem o Garante',
        items: [
          { text: 'Receita imprevisível, refém dos atrasos do mês' },
          { text: 'Síndico constrangido cobrando vizinho' },
          { text: 'Obras adiadas por falta de caixa' },
          { text: 'Rateio extra para cobrir buracos' },
          { text: 'Assembleias dominadas pela pauta da inadimplência' },
        ],
      },
      after: {
        tag: 'Com o Semog Garante',
        items: [
          { text: '100% da arrecadação garantida em contrato' },
          { text: 'Cobrança profissional, sem envolver o síndico' },
          { text: 'Manutenção e obras dentro do cronograma' },
          { text: 'Zero rateio extra por inadimplência' },
          { text: 'Assembleias para decidir o futuro, não o débito' },
        ],
      },
    },
    // `.g-partner.sec-light`, `_reference/garante.html:197-201,376-392` —
    // "Quem garante a garantia".
    {
      blockType: 'partnerSplit',
      title: 'Quem garante a garantia.',
      text: 'O Semog Garante é operado em parceria com a G5 Partners, especialista em soluções financeiras para o mercado condominial. A Semog cuida da gestão e do relacionamento; a G5, da estrutura de capital que assegura o repasse integral. O condomínio assina um contrato só e recebe de um parceiro só.',
      highlight: 'G5 Partners',
    },
    // `.faq`, `_reference/garante.html:203-220,395-417` — FAQ em `--bg-deep`
    // ESCURO (ao contrário do `.faq.sec-light` claro de `/solucoes`), daí
    // `dark: true`.
    {
      blockType: 'faq',
      title: 'Perguntas diretas, respostas diretas.',
      dark: true,
      items: [
        {
          question: 'O que é o Semog Garante?',
          answer:
            'É o produto que garante 100% da arrecadação prevista do condomínio, todos os meses, mesmo com condôminos em atraso. Uma parceria da Semog com a G5 Partners, por 1% da arrecadação.',
        },
        {
          question: 'Quanto custa?',
          answer: '1% da arrecadação mensal. Sem taxa de adesão e sem carência escondida.',
        },
        {
          question: 'Quem cobra os condôminos em atraso?',
          answer:
            'A Semog e a G5 Partners assumem toda a cobrança, com respeito e dentro da lei. O síndico não participa e a convivência entre vizinhos fica preservada.',
        },
        {
          question: 'Meu condomínio precisa ser administrado pela Semog?',
          answer:
            'Sim, o Garante é exclusivo para condomínios Semog. Se o seu ainda não é, a migração é conduzida pela nossa equipe sem interromper a operação, e o Garante já pode entrar no primeiro mês.',
        },
      ],
    },
    // `.final-cta`, `_reference/garante.html:222-224,420-431` — CTA final
    // centrado. `headingMaxWidth`/`headingFontSize` próprios desta página.
    {
      blockType: 'ctaBand',
      variant: 'centered',
      title: 'Quanto vale nunca mais se preocupar com a arrecadação?',
      text: 'Envie os dados do condomínio e receba a simulação do Garante em até 24 horas úteis.',
      cta: { label: 'Solicitar proposta', href: '/proposta' },
      headingMaxWidth: '18ch',
      headingFontSize: 'clamp(2.2rem, 5vw, 4.2rem)',
    },
  ],
}
