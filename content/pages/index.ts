/**
 * Índice das páginas estáticas servidas pelo catch-all (`[[...slug]]`) — a
 * Task 5 (`src/lib/content.ts`) consome este `Record` em vez do Payload. As
 * 4 landings de cidade (`administradora-de-condominios-*`) NÃO entram aqui:
 * são rotas explícitas com `CityLanding.tsx`, ver `src/data/cityLandings.ts`.
 *
 * A chave é o slug com hífen (ex.: `'administracao-de-condominios'`) — por
 * isso usamos a string literal na montagem do objeto, não o nome da
 * variável importada (que é camelCase por ser um identificador JS válido).
 */
import type { PageData } from '@/types/content'
import { administracaoDeCondominios } from './administracao-de-condominios'
import { aplicativo } from './aplicativo'
import { blog } from './blog'
import { contato } from './contato'
import { garante } from './garante'
import { home } from './home'
import { incorporadoras } from './incorporadoras'
import { prestacaoDeContasCondominio } from './prestacao-de-contas-condominio'
import { privacidade } from './privacidade'
import { proposta } from './proposta'
import { semog } from './semog'
import { softwareDeGestaoCondominial } from './software-de-gestao-condominial'
import { solucoes } from './solucoes'
import { termos } from './termos'

export const pages: Record<string, PageData> = {
  home,
  semog,
  solucoes,
  aplicativo,
  'administracao-de-condominios': administracaoDeCondominios,
  garante,
  incorporadoras,
  'prestacao-de-contas-condominio': prestacaoDeContasCondominio,
  'software-de-gestao-condominial': softwareDeGestaoCondominial,
  blog,
  contato,
  proposta,
  privacidade,
  termos,
}
