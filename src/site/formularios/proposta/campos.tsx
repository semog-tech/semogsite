import type { InputHTMLAttributes } from 'react'
import {
  CIDADES_DAS_UNIDADES,
  NOME_DA_UF,
  OUTRA_CIDADE,
  OUTRAS_UFS,
  PERFIS,
  UFS_COM_UNIDADE,
} from '@/lib/propostaDuasEtapas/schema'
import { conteudo } from '@/site/conteudo/conteudo'
import { mascararTelefone } from './leitura'

/** Campos do formulário de proposta, na marcação do protótipo (`sections/01-abertura.html:45-248`). */

type Erros = Readonly<Record<string, string>>
type Opcao = { valor: string; rotulo: string }

const idDe = (id: string, nome: string) => `${id}-${nome}`

function Erro({ alvo, texto }: { alvo: string; texto?: string }) {
  return (
    <p className="fp-erro" id={`${alvo}-erro`} aria-live="polite">
      {texto}
    </p>
  )
}

type PropsCampoTexto = {
  id: string
  nome: string
  rotulo: { texto: string; opcional?: string }
  erro?: string
  entrada: InputHTMLAttributes<HTMLInputElement>
  /** Marca `.entrada`: a cena da seção Metades sobe o campo em cascata. */
  entrar?: boolean
}

function CampoTexto({ id, nome, rotulo, erro, entrada, entrar }: PropsCampoTexto) {
  const alvo = idDe(id, nome)
  return (
    <div className={entrar ? 'fp-campo entrada' : 'fp-campo'}>
      <label htmlFor={alvo}>
        {rotulo.texto}
        {rotulo.opcional ? <span className="fp-opcional"> {rotulo.opcional}</span> : null}
      </label>
      <div className="fp-controle">
        <input
          id={alvo}
          name={nome}
          aria-describedby={`${alvo}-erro`}
          aria-invalid={erro ? true : undefined}
          {...entrada}
        />
      </div>
      <Erro alvo={alvo} texto={erro} />
    </div>
  )
}

type PropsGrupo = {
  id: string
  grupo: { nome: string; legenda: string; opcoes: readonly Opcao[] }
  erro?: string
  escolha?: { valor: string; aoEscolher: (valor: string) => void }
}

function GrupoDeOpcoes({ id, grupo, erro, escolha }: PropsGrupo) {
  const alvo = idDe(id, grupo.nome)
  return (
    <fieldset
      className="fp-grupo"
      aria-describedby={`${alvo}-erro`}
      aria-invalid={erro ? true : undefined}
    >
      <legend>{grupo.legenda}</legend>
      <div className="fp-opcoes">
        {grupo.opcoes.map((opcao) => (
          <label key={opcao.valor}>
            <input
              type="radio"
              name={grupo.nome}
              value={opcao.valor}
              {...(escolha
                ? {
                    checked: escolha.valor === opcao.valor,
                    onChange: () => escolha.aoEscolher(opcao.valor),
                  }
                : {})}
            />{' '}
            {opcao.rotulo}
          </label>
        ))}
      </div>
      <Erro alvo={alvo} texto={erro} />
    </fieldset>
  )
}

type Uf = { valor: string; aoMudar: (uf: string) => void }

function SeletorDeUf({
  id,
  erro,
  uf,
  entrar,
}: {
  id: string
  erro?: string
  uf: Uf
  entrar?: boolean
}) {
  const alvo = idDe(id, 'uf')
  return (
    <div className={entrar ? 'fp-campo entrada' : 'fp-campo'}>
      <label htmlFor={alvo}>Estado</label>
      <div className="fp-controle fp-controle--select">
        <select
          id={alvo}
          name="uf"
          autoComplete="address-level1"
          value={uf.valor}
          onChange={(evento) => uf.aoMudar(evento.currentTarget.value)}
          aria-describedby={`${alvo}-erro`}
          aria-invalid={erro ? true : undefined}
        >
          <option value="" disabled>
            Selecione
          </option>
          {UFS_COM_UNIDADE.map((sigla) => (
            <option key={sigla} value={sigla}>
              {NOME_DA_UF[sigla]}
            </option>
          ))}
          <optgroup label="Outros estados">
            {OUTRAS_UFS.map((sigla) => (
              <option key={sigla} value={sigla}>
                {NOME_DA_UF[sigla]}
              </option>
            ))}
          </optgroup>
        </select>
      </div>
      <Erro alvo={alvo} texto={erro} />
    </div>
  )
}

export function CamposDaEtapa1({
  id,
  erros,
  uf,
  entrar,
}: {
  id: string
  erros: Erros
  uf: Uf
  entrar?: boolean
}) {
  return (
    <>
      <CampoTexto
        id={id}
        nome="nomeCondominio"
        rotulo={{ texto: 'Nome do condomínio' }}
        erro={erros.nomeCondominio}
        entrada={{ type: 'text', autoComplete: 'off', maxLength: 120 }}
        entrar={entrar}
      />
      <div className="fp-par">
        <SeletorDeUf id={id} erro={erros.uf} uf={uf} entrar={entrar} />
        {/* Sem maxLength: cortaria a colagem com +55; quem limita é a máscara (DP7). */}
        <CampoTexto
          id={id}
          nome="telefone"
          rotulo={{ texto: 'Telefone com DDD' }}
          erro={erros.telefone}
          entrada={{
            type: 'tel',
            autoComplete: 'tel-national',
            inputMode: 'tel',
            placeholder: '(00) 00000-0000',
            onChange: mascararTelefone,
          }}
          entrar={entrar}
        />
      </div>
      <CampoTexto
        id={id}
        nome="email"
        rotulo={{ texto: 'E-mail', opcional: '(opcional)' }}
        erro={erros.email}
        entrada={{ type: 'email', autoComplete: 'email', maxLength: 254 }}
        entrar={entrar}
      />
    </>
  )
}

const OPCOES_DE_PERFIL: readonly Opcao[] = PERFIS.map((valor, i) => ({
  valor,
  rotulo: conteudo.proposta.perfis[i] ?? valor,
}))
const OPCOES_DE_CLIENTE: readonly Opcao[] = [
  { valor: 'sim', rotulo: 'Sim' },
  { valor: 'nao', rotulo: 'Não' },
]

type PropsEtapa2 = {
  id: string
  erros: Erros
  uf: string
  cidade: { escolha: string; aoEscolher: (cidade: string) => void }
}

function CidadeDaEtapa2({ id, erros, uf, cidade }: PropsEtapa2) {
  const lista = CIDADES_DAS_UNIDADES[uf]
  const entrada = { type: 'text', autoComplete: 'address-level2', maxLength: 120 } as const
  if (!lista) {
    return (
      <CampoTexto
        id={id}
        nome="cidadeOutra"
        rotulo={{ texto: 'Cidade', opcional: '(opcional)' }}
        erro={erros.cidade}
        entrada={entrada}
      />
    )
  }
  const opcoes = [...lista, OUTRA_CIDADE].map((c) => ({ valor: c, rotulo: c }))
  return (
    <>
      <GrupoDeOpcoes
        id={id}
        grupo={{ nome: 'cidadeEscolha', legenda: 'Cidade', opcoes }}
        erro={erros.cidadeEscolha}
        escolha={{ valor: cidade.escolha, aoEscolher: cidade.aoEscolher }}
      />
      {cidade.escolha === OUTRA_CIDADE ? (
        <CampoTexto
          id={id}
          nome="cidadeOutra"
          rotulo={{ texto: 'Qual cidade?', opcional: '(opcional)' }}
          erro={erros.cidade}
          entrada={entrada}
        />
      ) : null}
    </>
  )
}

export function CamposDaEtapa2(props: PropsEtapa2) {
  const { id, erros } = props
  return (
    <>
      {/* Nome e Cidade lado a lado, como no protótipo: a etapa 2 oculta dita a altura do form. */}
      <div className="fp-par fp-par--invertido">
        <CampoTexto
          id={id}
          nome="nome"
          rotulo={{ texto: 'Seu nome' }}
          erro={erros.nome}
          entrada={{ type: 'text', autoComplete: 'name', maxLength: 120 }}
        />
        <CidadeDaEtapa2 {...props} />
      </div>
      <GrupoDeOpcoes
        id={id}
        grupo={{ nome: 'perfil', legenda: 'Você é', opcoes: OPCOES_DE_PERFIL }}
        erro={erros.perfil}
      />
      <div className="fp-par">
        <CampoTexto
          id={id}
          nome="unidades"
          rotulo={{ texto: 'Nº de unidades', opcional: '(aprox.)' }}
          erro={erros.unidades}
          entrada={{ type: 'text', inputMode: 'numeric', maxLength: 5 }}
        />
        <GrupoDeOpcoes
          id={id}
          grupo={{ nome: 'cliente', legenda: 'Já é cliente Semog?', opcoes: OPCOES_DE_CLIENTE }}
          erro={erros.cliente}
        />
      </div>
    </>
  )
}
