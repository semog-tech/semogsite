import { GatilhoSouCliente } from '@/site/cliente/GatilhoSouCliente'
import { conteudo } from '@/site/conteudo/conteudo'
import { caminhoNoSite } from '@/site/rotas'
import { LigarMenu } from './LigarMenu'

export type IdNav =
  | 'semog'
  | 'incorporadoras'
  | 'gestao'
  | 'garante'
  | 'tecnologia'
  | 'blog'
  | 'contato'
export type DestinoProposta = '#proposta' | '/proposta'

/** `curto`: o rótulo do cabeçalho entre 1081 e 1320px, onde nove itens disputam a faixa. */
type ItemNav = { id: IdNav; href: string; rotulo: string; curto?: string }

const ANTES_DE_UNIDADES: readonly ItemNav[] = [
  { id: 'semog', href: '/semog', rotulo: 'A Semog' },
  { id: 'incorporadoras', href: '/incorporadoras', rotulo: 'Incorporadoras' },
  { id: 'gestao', href: '/administracao-de-condominios', rotulo: 'Gestão' },
  { id: 'garante', href: '/garante', rotulo: 'Garante' },
  { id: 'tecnologia', href: '/tecnologia', rotulo: 'Tecnologia' },
]
const DEPOIS_DE_UNIDADES: readonly ItemNav[] = [
  { id: 'blog', href: '/blog', rotulo: 'Blog' },
  // TEXTO-NOVO: "Contato" é o rótulo curto do cabeçalho de 1081 a 1320px
  { id: 'contato', href: '/contato', rotulo: 'Fale com a gente', curto: 'Contato' },
]

type PropsCabecalho = { atual?: IdNav; destinoProposta: DestinoProposta }

type PropsLinks = { itens: readonly ItemNav[]; atual?: IdNav; comCurto?: boolean }

function Rotulo({ item, comCurto }: { item: ItemNav; comCurto: boolean }) {
  if (!comCurto || !item.curto) return item.rotulo
  return (
    <>
      <span className="nav-longo">{item.rotulo}</span>
      <span className="nav-curto">{item.curto}</span>
    </>
  )
}

function Links({ itens, atual, comCurto = false }: PropsLinks) {
  return itens.map((item) => (
    <a
      key={item.id}
      href={caminhoNoSite(item.href)}
      data-pagina-link={item.id}
      aria-current={item.id === atual ? 'page' : undefined}
    >
      <Rotulo item={item} comCurto={comCurto} />
    </a>
  ))
}

/** Cabeçalho completo do pacote app. O tema muda pela seção sob ele (core/tema.ts). */
export function Cabecalho({ atual, destinoProposta }: PropsCabecalho) {
  const { loginUrl } = conteudo.marca
  return (
    <header className="cabecalho" data-cabecalho="" data-tema="claro">
      <div className="cabecalho-faixa">
        <a className="marca" href={caminhoNoSite('/')}>
          <span className="sr-only">Semog, página inicial</span>
          <svg className="marca-escura logo-escuro" viewBox="0 0 601.59 94.93" aria-hidden="true">
            <use href="#logo-semog" />
          </svg>
          <svg className="marca-clara logo-claro" viewBox="0 0 601.59 94.93" aria-hidden="true">
            <use href="#logo-semog" />
          </svg>
        </a>
        <nav className="nav" aria-label="Principal">
          <Links itens={ANTES_DE_UNIDADES} atual={atual} />
          <a href={caminhoNoSite('/#unidades')} data-secao-link="unidades">
            Unidades
          </a>
          <Links itens={DEPOIS_DE_UNIDADES} atual={atual} comCurto />
        </nav>
        <div className="cab-acoes">
          <span className="cab-separador" aria-hidden="true" />
          <GatilhoSouCliente origem="cabecalho" className="cab-cliente">
            {conteudo.souCliente.botao}
          </GatilhoSouCliente>
          <a className="cab-login" href={loginUrl}>
            Login
          </a>
          <a
            className="botao botao--pequeno"
            href={destinoProposta === '#proposta' ? '#proposta' : caminhoNoSite('/proposta')}
          >
            Seja Semog
          </a>
          <button
            className="cab-menu"
            type="button"
            aria-expanded="false"
            aria-controls="painel-menu"
            data-menu=""
          >
            <span className="cab-menu-icone" aria-hidden="true">
              <i />
              <i />
            </span>
            <span>Menu</span>
          </button>
        </div>
      </div>
      <nav className="painel-menu" id="painel-menu" aria-label="Menu">
        <Links itens={ANTES_DE_UNIDADES} atual={atual} />
        <a href={caminhoNoSite('/#unidades')}>Unidades</a>
        <Links itens={DEPOIS_DE_UNIDADES} atual={atual} />
        <GatilhoSouCliente origem="menu" className="painel-cliente">
          {conteudo.souCliente.botao}
        </GatilhoSouCliente>
        <a className="painel-login" href={loginUrl}>
          Login · Área do cliente
        </a>
      </nav>
      <LigarMenu />
    </header>
  )
}
