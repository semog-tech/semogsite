/**
 * Conteúdo dos "Termos de Uso" (slug `termos`) — port fiel do bloco
 * `termosHero`/`termosRichText` em `src/seed/pages.ts`.
 */
import type { PageData } from '@/types/content'
import { h2, legalRichText, p, type Section, ul } from '../lib/richText'

const UPDATED_AT = 'Última atualização: julho de 2026 · Documento em revisão pelo jurídico da Semog'

const sections: Section[] = [
  p(
    'Estes Termos de Uso regulam a utilização do site da Semog Administradora de Condomínios. Ao navegar por este site, você concorda com as condições abaixo.',
  ),
  h2('1. Finalidade do site'),
  p(
    'Este site tem caráter informativo e comercial: apresenta os serviços da Semog, permite a solicitação de propostas e o acesso a canais de atendimento e autoatendimento.',
  ),
  h2('2. Uso adequado'),
  ul([
    'É vedado utilizar o site para fins ilícitos ou que violem direitos de terceiros;',
    'É vedado tentar acessar áreas restritas, sistemas ou dados sem autorização;',
    'As informações enviadas em formulários devem ser verdadeiras e atualizadas.',
  ]),
  h2('3. Propriedade intelectual'),
  p(
    'Marca, logotipo, textos, imagens e demais conteúdos deste site pertencem à Semog ou a seus licenciantes e não podem ser reproduzidos sem autorização prévia e expressa.',
  ),
  h2('4. Serviços e propostas'),
  p(
    'As informações do site não constituem oferta vinculante. Condições comerciais, incluindo as do Semog Garante, são formalizadas em proposta e contrato específicos para cada condomínio.',
  ),
  h2('5. Responsabilidades'),
  p(
    'A Semog emprega os melhores esforços para manter as informações precisas e o site disponível, mas não se responsabiliza por indisponibilidades temporárias ou por conteúdos de sites de terceiros eventualmente vinculados.',
  ),
  h2('6. Atualizações destes termos'),
  p(
    'Estes termos podem ser atualizados a qualquer momento. A versão vigente estará sempre publicada nesta página.',
  ),
  h2('7. Foro'),
  p(
    'Fica eleito o foro da comarca de Recife/PE para dirimir eventuais controvérsias decorrentes destes termos.',
  ),
]

export const termos: PageData = {
  slug: 'termos',
  // Rótulo administrativo real no Payload (confirmado via GET /api/pages).
  title: 'Termos de Uso',
  layout: [
    { blockType: 'legalHero', headline: 'Termos de Uso', updatedText: UPDATED_AT },
    { blockType: 'richText', legal: true, content: legalRichText(sections) },
  ],
}
