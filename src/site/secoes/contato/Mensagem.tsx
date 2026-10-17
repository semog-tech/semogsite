import './mensagem.css'
import { conteudo } from '@/site/conteudo/conteudo'
import { FormularioDeMensagem } from '@/site/formularios/mensagem/FormularioDeMensagem'

/**
 * Mensagem do Contato: um formulário simples (nome, e-mail, assunto, mensagem) para quem não quer
 * proposta, com o mesmo desenho de campo do formulário de proposta.
 */
export function MensagemDoContato() {
  const { mensagem } = conteudo.contatoPagina
  return (
    <section
      id="contato-mensagem"
      className="cena cm"
      data-tema="claro"
      aria-labelledby="cm-titulo"
    >
      <div className="container cm-quadro">
        <div className="cm-texto revelar">
          <h2 id="cm-titulo" className="cm-titulo">
            <span className="linha">
              <span className="linha-interna">
                {mensagem.titulo}{' '}
                <em className="peso peso-fixo" data-texto={mensagem.enfase}>
                  {mensagem.enfase}
                </em>
              </span>
            </span>
          </h2>
          <p className="cm-apoio">{mensagem.texto}</p>
        </div>

        <FormularioDeMensagem />
      </div>
    </section>
  )
}
