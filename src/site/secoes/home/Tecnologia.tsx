import './tecnologia.css'
import './tecnologia-pendencia.css'
import { conteudo, type NumerosDaPrestacao as Numeros } from '@/site/conteudo/conteudo'
import { estaPendente, type OuPendente } from '@/site/conteudo/pendencias'
import { Pendencia } from '@/site/secoes/comum/Pendencia'
import { fraseDosNumerosDaPrestacao } from '@/site/secoes/tecnologia/numeros'

/**
 * Os números da nova prestação: a frase no contexto quando o Leandro informar. Até lá, o selo fica
 * fora do contexto, como irmão dele, para sobrepor o palco sem somar altura à legenda (verificação
 * 4a, I2); o contexto tem máscara de entrada, que cortaria um selo posicionado dentro dele.
 */
function NumerosDaPrestacao({ numeros }: { numeros: OuPendente<Numeros> }) {
  if (estaPendente(numeros)) return null
  return <>{fraseDosNumerosDaPrestacao(numeros)}</>
}

function SeloDosNumeros({ numeros }: { numeros: OuPendente<Numeros> }) {
  return estaPendente(numeros) ? <Pendencia item={numeros} /> : null
}

/**
 * Tecnologia (home), a cena-assinatura: num palco fixado, os mesmos itens contam a prestação de
 * contas inteira, do ERP ao Semog One, costurados por um único traço. Sem JS, a seção é um
 * documento com os cinco passos em lista.
 */
export function Tecnologia() {
  const { tecnologia } = conteudo
  const [erp, pdf, assinatura, link, adendo] = tecnologia.prestacao
  return (
    <section id="tecnologia" className="cena" data-tema="gelo" aria-labelledby="tecnologia-titulo">
      <div className="tec-palco">
        <div className="tec-fundo" aria-hidden="true" />
        {/* biome-ignore lint/a11y/noAriaHiddenOnFocusable: o canvas não tem tabindex nem interação (o Biome o trata como focável); é decorativo e os passos ao lado são a versão completa */}
        <canvas className="tec-campo" aria-hidden="true" />

        <div className="container tec-grade">
          <div className="tec-legendas">
            {/* TEXTO-NOVO: título da cena */}
            <h2 id="tecnologia-titulo" className="tec-titulo">
              Tecnologia Semog.
            </h2>
            <p className="tec-sub">{tecnologia.titulo}</p>
            <p className="tec-contexto">
              {tecnologia.contexto} <NumerosDaPrestacao numeros={tecnologia.numerosDaPrestacao} />
            </p>
            <SeloDosNumeros numeros={tecnologia.numerosDaPrestacao} />

            <ol className="tec-passos">
              <li className="tec-passo" data-passo="0">
                {/* TEXTO-NOVO: títulos dos passos 1 a 4 */}
                <h3 className="tec-revela">Do ERP, conferida.</h3>
                <p className="tec-revela">{erp}</p>
              </li>
              <li className="tec-passo" data-passo="1">
                <h3 className="tec-revela">Um PDF, organizado.</h3>
                <p className="tec-revela">{pdf}</p>
              </li>
              <li className="tec-passo" data-passo="2">
                <h3 className="tec-revela">Assinada, com parecer.</h3>
                <p className="tec-revela">{assinatura}</p>
              </li>
              <li className="tec-passo" data-passo="3">
                <h3 className="tec-revela">Link e QR permanentes.</h3>
                <p className="tec-revela">{link}</p>
                <p className="tec-revela tec-adendo">{adendo}</p>
              </li>
              <li className="tec-passo" data-passo="4">
                <h3 className="tec-revela">{tecnologia.semogOne.titulo}</h3>
                <p className="tec-revela">{tecnologia.semogOne.texto}</p>
                <ul className="tec-itens">
                  {tecnologia.semogOne.itens.map((item) => (
                    <li key={item} className="tec-revela">
                      {item}
                    </li>
                  ))}
                </ul>
              </li>
            </ol>

            {/* TEXTO-NOVO: nomes curtos da trilha */}
            <nav className="tec-trilha" aria-label="Passos da prestação de contas">
              <button type="button" data-ir="0">
                ERP
              </button>
              <button type="button" data-ir="1">
                PDF
              </button>
              <button type="button" data-ir="2">
                Assinatura
              </button>
              <button type="button" data-ir="3">
                QR
              </button>
              <button type="button" data-ir="4">
                Semog One
              </button>
            </nav>
          </div>
        </div>

        {/* TEXTO-NOVO: rótulos desenhados no palco (o canvas é decorativo; o texto completo está nos passos acima). Nomes das partes do PDF vêm de tecnologia.prestacao[1]. */}
        <ul className="tec-rotulos" hidden>
          <li data-rotulo="folha">Parecer</li>
          <li data-rotulo="folha">Extratos</li>
          <li data-rotulo="folha">Receitas</li>
          <li data-rotulo="folha">Inadimplência e acordos</li>
          <li data-rotulo="folha">Demonstrativo</li>
          <li data-rotulo="folha">Despesas</li>
          <li data-rotulo="assinatura">Síndico</li>
          <li data-rotulo="assinatura">Conselho</li>
          <li data-rotulo="parecer">Parecer</li>
          <li data-rotulo="url">prestacao.semog.com.br</li>
          <li data-rotulo="confere">Qualquer condômino confere a versão atual</li>
          <li data-rotulo="adendo">Adendo</li>
          <li data-rotulo="original">Versão original preservada</li>
          <li data-rotulo="historico">Adendo com histórico</li>
          <li data-rotulo="convencao">Convenção</li>
          <li data-rotulo="condominios">condomínios</li>
        </ul>
      </div>
    </section>
  )
}
