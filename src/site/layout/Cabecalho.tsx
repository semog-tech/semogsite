import { conteudo } from '@/site/conteudo/conteudo'
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

type ItemNav = { id: IdNav; href: string; rotulo: string }

const ANTES_DE_UNIDADES: readonly ItemNav[] = [
  { id: 'semog', href: '/semog', rotulo: 'A Semog' },
  { id: 'incorporadoras', href: '/incorporadoras', rotulo: 'Incorporadoras' },
  { id: 'gestao', href: '/administracao-de-condominios', rotulo: 'Gestão' },
  { id: 'garante', href: '/garante', rotulo: 'Garante' },
  { id: 'tecnologia', href: '/tecnologia', rotulo: 'Tecnologia' },
]
const DEPOIS_DE_UNIDADES: readonly ItemNav[] = [
  { id: 'blog', href: '/blog', rotulo: 'Blog' },
  { id: 'contato', href: '/contato', rotulo: 'Fale com a gente' },
]

type PropsCabecalho = { atual?: IdNav; destinoProposta: DestinoProposta }

function Links({ itens, atual }: { itens: readonly ItemNav[]; atual?: IdNav }) {
  return itens.map((item) => (
    <a
      key={item.id}
      href={item.href}
      data-pagina-link={item.id}
      aria-current={item.id === atual ? 'page' : undefined}
    >
      {item.rotulo}
    </a>
  ))
}

/** Cabeçalho completo do pacote app. O tema muda pela seção sob ele (core/tema.ts). */
export function Cabecalho({ atual, destinoProposta }: PropsCabecalho) {
  const { loginUrl } = conteudo.marca
  return (
    <header className="cabecalho" data-cabecalho="" data-tema="claro">
      <div className="cabecalho-faixa">
        <a className="marca" href="/">
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
          <a href="/#unidades" data-secao-link="unidades">
            Unidades
          </a>
          <Links itens={DEPOIS_DE_UNIDADES} atual={atual} />
        </nav>
        <div className="cab-acoes">
          <span className="cab-separador" aria-hidden="true" />
          <a className="cab-login" href={loginUrl}>
            Login
          </a>
          <a className="botao botao--pequeno" href={destinoProposta}>
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
        <a href="/#unidades">Unidades</a>
        <Links itens={DEPOIS_DE_UNIDADES} atual={atual} />
        <a className="painel-login" href={loginUrl}>
          Login · Área do cliente
        </a>
      </nav>
      <LigarMenu />
    </header>
  )
}
