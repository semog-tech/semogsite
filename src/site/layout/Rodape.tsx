import { conteudo } from '@/site/conteudo/conteudo'
import { caminhoNoSite } from '@/site/rotas'
import type { DestinoProposta } from './Cabecalho'

const LINKS_SEMOG = [
  { href: '/semog', rotulo: 'A Semog' },
  { href: '/incorporadoras', rotulo: 'Incorporadoras' },
  { href: '/administracao-de-condominios', rotulo: 'Gestão completa' },
  { href: '/garante', rotulo: 'Semog Garante' },
  { href: '/tecnologia', rotulo: 'Tecnologia' },
  // Decisão do Leandro de 16/10/2026: a /solucoes fica pelo tráfego do Search Console e precisa
  // de link interno depois da virada; o menu do cabeçalho não muda.
  { href: '/solucoes', rotulo: 'Soluções' },
  { href: '/blog', rotulo: 'Blog' },
] as const

/** Rodapé do pacote app (marcação de page.html do protótipo, sem a nota de protótipo). */
export function Rodape({ destinoProposta }: { destinoProposta: DestinoProposta }) {
  const { marca, unidades, numeros } = conteudo
  return (
    <footer className="rodape grao" data-tema="marinho">
      <div className="container rodape-grade">
        <div>
          <a className="marca" href={caminhoNoSite('/')}>
            <span className="sr-only">Semog, página inicial</span>
            <svg className="logo-claro" viewBox="0 0 601.59 94.93" aria-hidden="true">
              <use href="#logo-semog" />
            </svg>
          </a>
          <p className="rodape-slogan">{marca.slogan}</p>
        </div>
        <div className="rodape-colunas">
          <div>
            <h2>Unidades Semog</h2>
            <ul>
              {unidades.map((unidade) => (
                <li key={unidade.id}>
                  <a href={unidade.url}>
                    {unidade.cidade}/{unidade.uf}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2>Semog</h2>
            <ul>
              {LINKS_SEMOG.map((link) => (
                <li key={link.href}>
                  <a href={caminhoNoSite(link.href)}>{link.rotulo}</a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2>Fale com a gente</h2>
            <ul>
              <li>
                <a
                  href={destinoProposta === '#proposta' ? '#proposta' : caminhoNoSite('/proposta')}
                >
                  Pedir proposta
                </a>
              </li>
              <li>
                <a href={caminhoNoSite('/contato')}>Telefones e endereços</a>
              </li>
              <li>
                <a href={marca.loginUrl}>Login · Área do cliente</a>
              </li>
            </ul>
          </div>
        </div>
      </div>
      <div className="container rodape-base">
        <p>Semog · administradora de condomínios {numeros.anos.detalhe}.</p>
        <nav className="rodape-legal" aria-label="Documentos">
          <a href={caminhoNoSite('/privacidade')} data-pagina-link="privacidade">
            Privacidade
          </a>
          <a href={caminhoNoSite('/termos')} data-pagina-link="termos">
            Termos de uso
          </a>
        </nav>
      </div>
    </footer>
  )
}
