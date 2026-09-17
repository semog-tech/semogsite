import { ExperienceAgenda } from '@/components/experience/ExperienceAgenda'
import { ExperienceSignupAberto } from '@/components/experience/ExperienceSignupAberto'
import { IntroEsgotado } from '@/components/experience/ExperienceSignupIntro'
import { CalendarIcon } from '@/components/experience/icones'
import { EXPERIENCE_EVENT as E } from '@/data/experienceEvent'
import type { EstadoDaInscricao } from '@/lib/experienceEstado'

/**
 * A seção `#inscricao` — alvo dos CTAs da página e a única que troca de
 * conteúdo inteiro nos três estados.
 *
 * O markup morava em `page.tsx` porque metade era texto e a outra metade o
 * `<ExperienceForm />`, e um invólucro só para o `<div className="card">` não
 * pagaria por si. Com três estados ele paga: a página voltou a ser a lista das
 * seções, e cada estado desta seção cabe numa tela sem disputar espaço com os
 * outros dois.
 *
 * Só o estado ABERTO é client (ver `ExperienceSignupAberto`), porque é o único
 * que pode mudar depois de renderizado. Os outros dois são markup fixo e ficam
 * no servidor.
 */

/**
 * Vagas preenchidas, evento ainda por vir. A seção mantém as duas colunas: a
 * esquerda explica o que aconteceu, a direita **substitui o formulário pelo
 * endereço** — porque a partir daqui quem chega nesta seção é, em boa parte,
 * quem já se inscreveu e voltou para conferir onde é.
 */
function Esgotado() {
  return (
    <div className="grid">
      <IntroEsgotado />

      <div className="card">
        <div className="aviso">
          <span aria-hidden="true" className="aviso-mark">
            <CalendarIcon />
          </span>
          <h3>Você já se inscreveu?</h3>
          <p>Anote na agenda — é onde a gente se encontra:</p>
          <ExperienceAgenda />
        </div>
      </div>
    </div>
  )
}

/**
 * Passado o sábado. Coluna única (`.signup-solo`): não há formulário nem
 * contraponto à direita, e manter a grade de duas colunas deixaria metade da
 * seção vazia.
 */
function Encerrado() {
  return (
    <div className="grid">
      <div className="card">
        <div className="aviso">
          <span aria-hidden="true" className="aviso-mark">
            <CalendarIcon />
          </span>
          <h3>O {E.name} já aconteceu</h3>
          <p>
            Foram {E.seats} vagas, uma manhã de pilates, yoga e treino funcional na orla do{' '}
            {E.district} — e muita gente que a gente só encontra por telefone durante o ano.
          </p>
          <p>
            Fica o agradecimento a quem acordou cedo no sábado, aos profissionais que conduziram as
            aulas e aos patrocinadores que bancaram a manhã.
          </p>
          <div className="aviso-linha">
            <div>
              <span className="rot">Data</span>
              <span className="val">
                <time dateTime={E.date}>{E.dateLabel}</time>
              </span>
              <small>{E.weekday}</small>
            </div>
            <div>
              <span className="rot">Horário</span>
              <span className="val">{E.timeLabel}</span>
            </div>
            <div>
              <span className="rot">Local</span>
              <span className="val">{E.venue}</span>
              <small>
                {E.district} — {E.city}, {E.uf}
              </small>
            </div>
          </div>
          <p className="formnote">
            O {E.series} é anual. A inscrição da próxima edição abre nesta mesma página.
          </p>
        </div>
      </div>
    </div>
  )
}

export function ExperienceSignup({ estado }: { estado: EstadoDaInscricao }) {
  const encerrado = estado === 'encerrado'

  return (
    <section className={`signup s-paper${encerrado ? ' signup-solo' : ''}`} id="inscricao">
      <div className="wrap">
        {estado === 'aberto' ? (
          <ExperienceSignupAberto />
        ) : encerrado ? (
          <Encerrado />
        ) : (
          <Esgotado />
        )}
      </div>
    </section>
  )
}
