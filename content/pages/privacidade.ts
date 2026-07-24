/**
 * Conteúdo da "Política de Privacidade" (slug `privacidade`) — port fiel do
 * bloco `privacidadeHero`/`privacidadeRichText` em `src/seed/pages.ts`.
 */
import type { PageData } from '@/types/content'
import { h2, legalRichText, p, pWithLink, type Section, ul } from '../lib/richText'

const UPDATED_AT = 'Última atualização: julho de 2026 · Documento em revisão pelo jurídico da Semog'

const sections: Section[] = [
  p(
    'Esta Política de Privacidade descreve como a Semog Administradora de Condomínios coleta, usa e protege os dados pessoais de síndicos, condôminos, clientes e visitantes deste site, em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018).',
  ),
  h2('1. Dados que coletamos'),
  ul([
    'Dados de contato fornecidos em formulários (nome, e-mail, telefone, cidade e informações do condomínio);',
    'Dados de navegação (páginas visitadas, dispositivo e cookies essenciais);',
    'Dados necessários à prestação dos serviços de administração condominial.',
  ]),
  h2('2. Como usamos os dados'),
  ul([
    'Responder solicitações de proposta e atendimento;',
    'Prestar os serviços contratados pelo condomínio;',
    'Cumprir obrigações legais, contábeis e regulatórias;',
    'Melhorar a experiência do site e dos nossos canais digitais.',
  ]),
  h2('3. Compartilhamento'),
  p(
    'Não vendemos dados pessoais. Compartilhamos dados apenas com operadores necessários à prestação do serviço (como instituições financeiras, parceiros de cobrança e provedores de tecnologia), sempre sob contrato e dever de confidencialidade.',
  ),
  h2('4. Seus direitos'),
  pWithLink(
    'Você pode solicitar a qualquer momento a confirmação, o acesso, a correção, a anonimização ou a exclusão dos seus dados, além da revogação de consentimentos, pelo e-mail ',
    'privacidade@semog.com.br',
    'mailto:privacidade@semog.com.br',
    '.',
  ),
  h2('5. Segurança e retenção'),
  p(
    'Adotamos medidas técnicas e organizacionais para proteger os dados sob nossa responsabilidade e os mantemos apenas pelo tempo necessário às finalidades desta política ou às exigências legais.',
  ),
  h2('6. Contato do encarregado (DPO)'),
  p(
    'Dúvidas sobre esta política podem ser encaminhadas ao nosso encarregado de proteção de dados pelo e-mail acima.',
  ),
]

export const privacidade: PageData = {
  slug: 'privacidade',
  // Rótulo administrativo real no Payload (confirmado via GET /api/pages).
  title: 'Política de Privacidade',
  layout: [
    { blockType: 'legalHero', headline: 'Política de Privacidade', updatedText: UPDATED_AT },
    { blockType: 'richText', legal: true, content: legalRichText(sections) },
  ],
}
