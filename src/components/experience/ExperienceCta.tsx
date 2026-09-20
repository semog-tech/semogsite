import { ArrowIcon } from '@/components/experience/icones'
import { EXPERIENCE_EVENT as E } from '@/data/experienceEvent'
import type { EstadoDaInscricao } from '@/lib/experienceEstado'

/**
 * Faixa de conversão entre o vídeo e o formulário — porte da
 * `<section class="band s-brand">` do protótipo aprovado. Fundo
 * `--color-navy-600` (a superfície `.s-brand`), botão claro, e o segundo dos
 * dois CTAs da página que apontam para `#inscricao`.
 *
 * O plano pedia repetir "gratuito e o total de vagas" aqui; o protótipo aprovado
 * diz "Evento gratuito … Vagas limitadas". Mantido o texto do protótipo: o
 * número já aparece no hero e volta na seção de inscrição, e repeti-lo
 * pela terceira vez em meia página cansa sem informar. **Nos outros dois
 * estados o número volta**, e aí informa: a notícia É o número que fechou.
 *
 * `encerrado` perde o botão e fica só com a frase. Não sobrou destino: a
 * seção de inscrição virou agradecimento, e mandar alguém até lá por um botão
 * que promete ação é promessa vazia.
 */
export function ExperienceCta({
  estado,
  capacidade = null,
}: {
  estado: EstadoDaInscricao
  capacidade?: number | null
}) {
  if (estado === 'encerrado') {
    return (
      <section className="band s-brand">
        <div className="wrap">
          <h2>Obrigado a quem passou a manhã com a gente.</h2>
          <div className="side">
            <p>O {E.series} é anual. A próxima edição será anunciada nesta mesma página.</p>
          </div>
        </div>
      </section>
    )
  }

  const esgotado = estado === 'esgotado'
  return (
    <section className="band s-brand">
      <div className="wrap">
        <h2>
          {esgotado
            ? 'As vagas acabaram — quem garantiu a sua, a gente se vê no sábado.'
            : 'Participe de uma manhã incrível e transforme seu bem-estar.'}
        </h2>
        <div className="side">
          <a className="btn btn-light" href="#inscricao">
            {esgotado ? 'Ver informações do evento' : 'Quero me inscrever'}
            <ArrowIcon />
          </a>
          <p>
            Evento gratuito e aberto a clientes, parceiros e amigos da Semog.{' '}
            {esgotado
              ? `As ${capacidade === null ? '' : `${capacidade} `}vagas desta edição foram preenchidas.`
              : 'Vagas limitadas.'}
          </p>
        </div>
      </div>
    </section>
  )
}
